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
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Search failed');
        return;
      }

      // Ensure we have valid data
      if (!data.originalUsername) {
        data.originalUsername = username;
      }

      setResults(data);
      if (onSearchComplete) onSearchComplete();
    } catch (err) {
      console.error('Search error:', err);
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
          Enter a username to search for all variations across 15+ platforms. We'll automatically check variations like john12doe, Johndoe45, john_doe, etc.
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
              placeholder="e.g., john doe"
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
          <h3>Results for "{results.originalUsername || username}"</h3>
          <div className="summary-box">
            <p><strong>Searched {results.variationsSearched || 0} variations</strong></p>
            <p><strong>Total accounts found: {results.totalAccountsFound || 0}</strong></p>
          </div>

          {results.variationResults && Object.keys(results.variationResults).length > 0 ? (
            <div className="variations-section">
              <h4>Accounts by Username Variation:</h4>
              {Object.entries(results.variationResults).map(([variation, data]) => (
                <div key={variation} className="variation-group">
                  <div className="variation-header">
                    <span className="variation-name">{variation}</span>
                    <span className="variation-count">{data.count} account(s) found</span>
                  </div>
                  <div className="platforms-grid">
                    {data.accounts && data.accounts.map((account, index) => (
                      <div key={index} className="platform-item found">
                        <div className="platform-header">
                          <span className="platform-name">{account.platform}</span>
                          <span className="platform-status">✅ Found</span>
                        </div>
                        <a href={account.url} target="_blank" rel="noopener noreferrer" className="platform-link">
                          Visit Profile →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No accounts found with any variations of "{results.originalUsername || username}"</p>
            </div>
          )}

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
