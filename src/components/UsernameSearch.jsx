import React, { useState } from 'react';
import './UsernameSearch.css';

function UsernameSearch({ onSearchComplete }) {
  const [username, setUsername] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await fetch('/api/osint/username-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Search failed');
        return;
      }

      setResults(data);
      onSearchComplete();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-card">
        <h2>👤 Find Usernames Across Platforms</h2>
        <p className="description">
          Enter a username to see if it exists on popular social media platforms and websites.
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSearch}>
          <div className="input-group">
            <label htmlFor="username">Username to Search</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., john_doe"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </form>
      </div>

      {results && (
        <div className="results-card">
          <h3>Results for "{results.username}"</h3>
          <div className="platforms-grid">
            {results.platforms.map((platform, index) => (
              <div key={index} className={`platform-item ${platform.found ? 'found' : 'not-found'}`}>
                <div className="platform-header">
                  <span className="platform-name">{platform.name}</span>
                  <span className="platform-status">
                    {platform.found ? '✅ Found' : '❌ Not Found'}
                  </span>
                </div>
                {platform.found && (
                  <a href={platform.url} target="_blank" rel="noopener noreferrer" className="platform-link">
                    Visit Profile →
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="results-footer">
            <p className="timestamp">
              Search completed: {new Date(results.timestamp).toLocaleString()}
            </p>
            <button
              onClick={() => {
                setResults(null);
                setUsername('');
              }}
              className="btn btn-secondary"
            >
              New Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsernameSearch;
