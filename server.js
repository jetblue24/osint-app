import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchUsername, checkEmailBreach, lookupPhoneNumber, lookupIP, lookupDomain, searchFiles, generateUsernameVariations, verifyUsername } from './osint-services.js';

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

// ==================== OSINT FEATURES - REAL APIs ====================

// Username Search - Real API
app.post('/api/osint/username-search', authenticateToken, async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const results = await searchUsername(username);

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'username', username, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Search failed' });
  }
});

// Verify Username - Manual re-verification
app.post('/api/osint/verify-username', authenticateToken, async (req, res) => {
  const { platform, username } = req.body;

  if (!platform || !username) {
    return res.status(400).json({ error: 'Platform and username are required' });
  }

  try {
    const result = await verifyUsername(platform, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// Username Variations - Real API
app.post('/api/osint/username-variations', authenticateToken, async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const variations = generateUsernameVariations(username);
    const results = {
      originalUsername: username,
      variations: variations,
      totalVariations: variations.length,
      timestamp: new Date()
    };

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'username_variations', username, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Variations generation failed' });
  }
});

// Domain/IP Lookup - Real API
app.post('/api/osint/domain-lookup', authenticateToken, async (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    const results = await lookupDomain(domain);

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'domain', domain, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lookup failed' });
  }
});

// IP Lookup - Real API
app.post('/api/osint/ip-lookup', authenticateToken, async (req, res) => {
  const { ip } = req.body;

  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  try {
    const results = await lookupIP(ip);

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'ip', ip, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message || 'IP lookup failed' });
  }
});

// Email Breach Check - Real API (Have I Been Pwned)
app.post('/api/osint/breach-check', authenticateToken, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const results = await checkEmailBreach(email);

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'breach', email, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Breach check failed' });
  }
});

// Phone Number Lookup - Real API
app.post('/api/osint/phone-lookup', authenticateToken, async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const results = await lookupPhoneNumber(phoneNumber);

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'phone', phoneNumber, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Phone lookup failed' });
  }
});

// File Search - Real APIs (News, Government, Academic)
app.post('/api/osint/file-search', authenticateToken, async (req, res) => {
  const { query, searchType } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const results = await searchFiles(query, searchType);

    db.run(
      'INSERT INTO searches (user_id, search_type, query, results) VALUES (?, ?, ?, ?)',
      [req.user.id, 'file_search', query, JSON.stringify(results)]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message || 'File search failed' });
  }
});

// Get search history
app.get('/api/searches', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch history' });
      const searches = rows.map(row => ({
        ...row,
        results: row.results ? JSON.parse(row.results) : {}
      }));
      res.json(searches);
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
