import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Database setup
const db = new sqlite3.Database('./osint.db', (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Initialize database tables
const initializeDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Search history table
    db.run(`
      CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        search_type TEXT NOT NULL,
        query TEXT NOT NULL,
        results TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Saved investigations table
    db.run(`
      CREATE TABLE IF NOT EXISTS investigations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  });
};

initializeDatabase();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }

        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: this.lastID, username, email } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  });
});

// ==================== OSINT FEATURES ====================

// Username Search (mock data - replace with real APIs)
app.post('/api/osint/username-search', authenticateToken, async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Mock results - in production, integrate with real APIs
    const platforms = [
      { name: 'Twitter', url: `https://twitter.com/${username}`, found: Math.random() > 0.5 },
      { name: 'Instagram', url: `https://instagram.com/${username}`, found: Math.random() > 0.5 },
      { name: 'GitHub', url: `https://github.com/${username}`, found: Math.random() > 0.5 },
      { name: 'Reddit', url: `https://reddit.com/user/${username}`, found: Math.random() > 0.5 },
      { name: 'TikTok', url: `https://tiktok.com/@${username}`, found: Math.random() > 0.5 },
      { name: 'LinkedIn', url: `https://linkedin.com/in/${username}`, found: Math.random() > 0.5 },
      { name: 'YouTube', url: `https://youtube.com/@${username}`, found: Math.random() > 0.5 },
      { name: 'Twitch', url: `https://twitch.tv/${username}`, found: Math.random() > 0.5 },
    ];

    const results = { username, platforms, timestamp: new Date() };

    // Save to search history
    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'username', username, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Domain/IP Lookup (mock data - replace with real APIs)
app.post('/api/osint/domain-lookup', authenticateToken, async (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    // Mock results
    const results = {
      domain,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: 'United States',
      isp: 'Example ISP',
      dns_records: {
        A: ['192.168.1.1'],
        MX: ['mail.example.com'],
        NS: ['ns1.example.com', 'ns2.example.com'],
      },
      whois: {
        registrar: 'Example Registrar',
        created: '2020-01-15',
        expires: '2025-01-15',
      },
      timestamp: new Date(),
    };

    // Save to search history
    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'domain', domain, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

// Email Breach Check (mock data - replace with real APIs)
app.post('/api/osint/breach-check', authenticateToken, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Mock results
    const breaches = [
      { name: 'Example Breach 1', date: '2023-01-15', records: 500000 },
      { name: 'Example Breach 2', date: '2022-06-20', records: 250000 },
    ];

    const results = {
      email,
      breached: Math.random() > 0.5,
      breaches: Math.random() > 0.5 ? breaches : [],
      timestamp: new Date(),
    };

    // Save to search history
    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'breach', email, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Breach check failed' });
  }
});

// Phone Number Lookup
app.post('/api/osint/phone-lookup', authenticateToken, async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const carriers = ['AT&T', 'Verizon', 'T-Mobile', 'Sprint'];
    const types = ['Mobile', 'Landline', 'VoIP'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston'];
    const timezones = ['Eastern', 'Central', 'Mountain', 'Pacific'];

    const results = {
      phoneNumber,
      found: Math.random() > 0.3,
      carrier: carriers[Math.floor(Math.random() * carriers.length)],
      type: types[Math.floor(Math.random() * types.length)],
      country: 'United States',
      region: 'Example Region',
      city: cities[Math.floor(Math.random() * cities.length)],
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      registeredTo: 'Private Individual',
      timestamp: new Date(),
    };

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'phone', phoneNumber, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Phone lookup failed' });
  }
});

// Username Variations Search
app.post('/api/osint/username-variations', authenticateToken, async (req, res) => {
  const { username, variations } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Mock results - in production, check each variation across platforms
    const foundAccounts = variations
      .filter(() => Math.random() > 0.7)
      .slice(0, 5)
      .map((variation, idx) => ({
        platform: ['Twitter', 'Instagram', 'GitHub', 'Reddit', 'TikTok'][idx % 5],
        username: variation,
        url: `https://example.com/${variation}`
      }));

    const results = {
      originalUsername: username,
      variations: variations,
      foundAccounts: foundAccounts,
      timestamp: new Date(),
    };

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'username_variations', username, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Username variations search failed' });
  }
});

// File Search
app.post('/api/osint/file-search', authenticateToken, async (req, res) => {
  const { query, searchType } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // Mock results - in production, integrate with real search APIs
    const fileTypes = ['News Article', 'Government Record', 'Legal Document', 'Academic Paper', 'Business Record'];
    const sources = ['Reuters', 'AP News', 'Government Archive', 'Academic Database', 'Public Records'];
    
    const files = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, idx) => ({
      title: `${query} - Document ${idx + 1}`,
      type: fileTypes[Math.floor(Math.random() * fileTypes.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      description: `Information related to ${query}. This is a sample result from the file search.`,
      relevance: Math.floor(Math.random() * 40) + 60,
      url: `https://example.com/document/${idx}`
    }));

    const results = {
      query,
      searchType,
      totalResults: files.length,
      files: files,
      timestamp: new Date(),
    };

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'file_search', query, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'File search failed' });
  }
});

// Save search to history
app.post('/api/searches', authenticateToken, (req, res) => {
  const { searchType, query, results } = req.body;

  if (!searchType || !query) {
    return res.status(400).json({ error: 'Search type and query are required' });
  }

  db.run(
    'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
    [req.user.id, searchType, query, JSON.stringify(results)],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to save search' });
      res.json({ id: this.lastID, success: true });
    }
  );
});

// Get search history
app.get('/api/searches', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch history' });
      res.json(rows);
    }
  );
});

// Save investigation
app.post('/api/investigations', authenticateToken, (req, res) => {
  const { title, description, notes, data } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    'INSERT INTO investigations (user_id, title, description, data) VALUES (?, ?, ?, ?)',
    [req.user.id, title, description || notes, JSON.stringify(data || {})],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to save investigation' });
      res.json({ id: this.lastID, title, description });
    }
  );
});

// Update investigation
app.put('/api/investigations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, notes, data } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    'UPDATE investigations SET title = ?, description = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [title, description || notes, JSON.stringify(data || {}), id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update investigation' });
      if (this.changes === 0) return res.status(404).json({ error: 'Investigation not found' });
      res.json({ id, title, description, success: true });
    }
  );
});

// Delete investigation
app.delete('/api/investigations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM investigations WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete investigation' });
      if (this.changes === 0) return res.status(404).json({ error: 'Investigation not found' });
      res.json({ success: true });
    }
  );
});

// Get investigations
app.get('/api/investigations', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM investigations WHERE user_id = ? ORDER BY updated_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch investigations' });
      const investigations = rows.map(inv => ({
        ...inv,
        data: inv.data ? JSON.parse(inv.data) : {},
        notes: inv.description
      }));
      res.json(investigations);
    }
  );
});

// Serve React app (catch-all route must be last)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`OSINT App running on http://localhost:${PORT}`);
});
