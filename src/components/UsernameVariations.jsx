import React, { useState } from 'react';
import './UsernameVariations.css';

function UsernameVariations({ onSearchComplete }) {
  const [username, setUsername] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateVariations = (name) => {
    const variations = new Set();
    
    // Original
    variations.add(name);
    
    // Lowercase/Uppercase
    variations.add(name.toLowerCase());
    variations.add(name.toUpperCase());
    variations.add(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
    
    // Numbers substitution (common leetspeak)
    const leet = {
      'a': ['4', '@'],
      'e': ['3'],
      'i': ['1', '!'],
      'o': ['0'],
      's': ['5', '$'],
      't': ['7'],
      'l': ['1'],
      'g': ['9']
    };
    
    for (let i = 0; i < name.length; i++) {
      const char = name[i].toLowerCase();
      if (leet[char]) {
        for (let sub of leet[char]) {
          variations.add(name.substring(0, i) + sub + name.substring(i + 1));
        }
      }
    }
    
    // Common separators
    variations.add(name.replace(/\s+/g, '_'));
    variations.add(name.replace(/\s+/g, '.'));
    variations.add(name.replace(/\s+/g, '-'));
    variations.add(name.replace(/\s+/g, ''));
    
    // First letter + last name
    const parts = name.split(/\s+/);
    if (parts.length > 1) {
      variations.add(parts[0][0] + parts[parts.length - 1]);
      variations.add(parts[0] + parts[parts.length - 1]);
      variations.add(parts[parts.length - 1] + parts[0][0]);
    }
    
    // Double letters
    variations.add(name.replace(/(.)\1*/g, '$1$1'));
    
    // Remove vowels
    variations.add(name.replace(/[aeiou]/gi, ''));
    
    return Array.from(variations).filter(v => v.length > 0);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const variations = generateVariations(username.trim());

      const response = await fetch('/api/osint/username-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username: username.trim(),
          variations: variations
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search username variations');
      }

      const data = await response.json();
      setResults({
        originalUsername: username.trim(),
        variations: variations,
        foundAccounts: data.foundAccounts || []
      });

      // Save to history
      await fetch('/api/searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          searchType: 'username_variations',
          query: username,
          results: JSON.stringify(data)
        })
      });

      if (onSearchComplete) onSearchComplete();
    } catch (err) {
      console.error('Username variations error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="username-variations">
      <div className="search-container">
        <h2>👤 Username Variations Search</h2>
        <p className="description">
          Search for variations of a username across platforms. Generates common variations like leetspeak, separators, and abbreviations.
        </p>

        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              placeholder="e.g., john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Searching...' : 'Search Variations'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {results && (
        <div className="results-container">
          <h3>📊 Username Variations Results</h3>
          
          <div className="variations-section">
            <h4>Generated Variations ({results.variations.length})</h4>
            <div className="variations-grid">
              {results.variations.slice(0, 20).map((variation, idx) => (
                <div key={idx} className="variation-tag">
                  {variation}
                </div>
              ))}
              {results.variations.length > 20 && (
                <div className="variation-tag more">
                  +{results.variations.length - 20} more
                </div>
              )}
            </div>
          </div>

          {results.foundAccounts && results.foundAccounts.length > 0 && (
            <div className="found-accounts">
              <h4>✅ Found Accounts</h4>
              <div className="accounts-list">
                {results.foundAccounts.map((account, idx) => (
                  <div key={idx} className="account-card">
                    <p><strong>Platform:</strong> {account.platform}</p>
                    <p><strong>Username:</strong> {account.username}</p>
                    <p><strong>URL:</strong> <a href={account.url} target="_blank" rel="noopener noreferrer">{account.url}</a></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="info-box">
            <p>💡 <strong>Tip:</strong> This tool generates common username variations to help you find accounts across different platforms.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsernameVariations;
