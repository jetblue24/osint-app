import React, { useState } from 'react';
import './UsernameSearch.css';

function UsernameSearch({ onSearchComplete }) {
  const [username, setUsername] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyingAccount, setVerifyingAccount] = useState(null);
  const [showUnverified, setShowUnverified] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setShowUnverified(false);

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

  const handleVerifyAccount = async (platform, username) => {
    setVerifyingAccount(`${platform}-${username}`);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/osint/verify-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform, username }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the results with new verification data
        setResults(prev => {
          const updated = { ...prev };
          if (updated.variationResults[username]) {
            updated.variationResults[username].accounts = updated.variationResults[username].accounts.map(acc => {
              if (acc.platform === platform) {
                return {
                  ...acc,
                  verified: data.verified,
                  confidence: data.confidence
                };
              }
              return acc;
            });
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifyingAccount(null);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#4CAF50'; // Green
    if (confidence >= 50) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 50) return 'Medium';
    return 'Low';
  };

  const getVerifiedBadge = (account) => {
    if (account.verified === true) {
      return <span className="badge badge-verified">✅ Verified</span>;
    } else if (account.verified === false) {
      return <span className="badge badge-unverified">❌ Not Found</span>;
    } else {
      return <span className="badge badge-unknown">❓ Unknown</span>;
    }
  };

  // Filter accounts based on verification status
  const getFilteredAccounts = (accounts) => {
    if (showUnverified) {
      return accounts;
    }
    // By default, only show verified accounts
    return accounts.filter(acc => acc.verified === true);
  };

  return (
    <div className="search-container">
      <div className="search-card">
        <h2>👤 Find Usernames Across Platforms</h2>
        <p className="description">
          Enter a username to search for all variations across 15+ platforms. We'll automatically verify if accounts actually exist.
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
            <p><strong>✅ Verified accounts: {results.totalVerifiedAccounts || 0}</strong></p>
            <p><strong>📊 Total found: {results.totalAccountsFound || 0}</strong></p>
          </div>

          {results.totalAccountsFound > 0 && (
            <div className="filter-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showUnverified}
                  onChange={(e) => setShowUnverified(e.target.checked)}
                />
                Show all results (including unverified)
              </label>
              <p className="filter-hint">
                {showUnverified 
                  ? 'Showing all results. Some may be false positives.' 
                  : 'Showing only verified accounts. Click "Verify" to re-check.'}
              </p>
            </div>
          )}

          {results.verifiedAccounts && results.verifiedAccounts.length > 0 && !showUnverified ? (
            <div className="verified-section">
              <h4>✅ Verified Accounts ({results.verifiedAccounts.length})</h4>
              <div className="verified-grid">
                {results.verifiedAccounts.map((account, index) => (
                  <div key={index} className="verified-item">
                    <div className="verified-header">
                      <span className="platform-name">{account.platform}</span>
                      <span className="username-badge">@{account.username}</span>
                    </div>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{
                          width: `${account.confidence}%`,
                          backgroundColor: getConfidenceColor(account.confidence)
                        }}
                      />
                    </div>
                    <p className="confidence-text">
                      Confidence: {account.confidence}% ({getConfidenceLabel(account.confidence)})
                    </p>
                    <a href={account.url} target="_blank" rel="noopener noreferrer" className="platform-link">
                      Visit Profile →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {results.variationResults && Object.keys(results.variationResults).length > 0 ? (
            <div className="variations-section">
              <h4>All Results by Username Variation:</h4>
              {Object.entries(results.variationResults).map(([variation, data]) => {
                const filteredAccounts = getFilteredAccounts(data.accounts || []);
                if (filteredAccounts.length === 0 && !showUnverified) return null;
                
                return (
                  <div key={variation} className="variation-group">
                    <div className="variation-header">
                      <span className="variation-name">@{variation}</span>
                      <span className="variation-count">
                        {showUnverified 
                          ? `${data.count} found` 
                          : `${data.verifiedCount || 0} verified`}
                      </span>
                    </div>
                    {filteredAccounts.length > 0 ? (
                      <div className="platforms-grid">
                        {filteredAccounts.map((account, index) => (
                          <div key={index} className={`platform-item ${account.verified === true ? 'verified' : 'unverified'}`}>
                            <div className="platform-header">
                              <span className="platform-name">{account.platform}</span>
                              {getVerifiedBadge(account)}
                            </div>
                            <div className="confidence-section">
                              <div className="confidence-bar">
                                <div 
                                  className="confidence-fill" 
                                  style={{
                                    width: `${account.confidence || 0}%`,
                                    backgroundColor: getConfidenceColor(account.confidence || 0)
                                  }}
                                />
                              </div>
                              <p className="confidence-text">
                                {account.confidence || 0}% ({getConfidenceLabel(account.confidence || 0)})
                              </p>
                            </div>
                            <div className="platform-actions">
                              <a href={account.url} target="_blank" rel="noopener noreferrer" className="platform-link">
                                Visit Profile →
                              </a>
                              <button
                                onClick={() => handleVerifyAccount(account.platform, account.username)}
                                className="btn btn-verify"
                                disabled={verifyingAccount === `${account.platform}-${account.username}`}
                              >
                                {verifyingAccount === `${account.platform}-${account.username}` ? '⏳ Verifying...' : '🔄 Verify'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-results-variation">No verified accounts for this variation</p>
                    )}
                  </div>
                );
              })}
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
                setShowUnverified(false);
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
