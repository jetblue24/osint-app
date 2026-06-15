import React, { useState } from 'react';
import './BreachChecker.css';

function BreachChecker({ onSearchComplete }) {
  const [email, setEmail] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/osint/breach-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Breach check failed');
        return;
      }

      setResults(data);
      if (onSearchComplete) onSearchComplete();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-card">
        <h2>⚠️ Email Breach Checker</h2>
        <p className="description">
          Check if your email address has appeared in any known data breaches or leaks.
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSearch}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '🔍 Checking...' : '🔍 Check Email'}
          </button>
        </form>
      </div>

      {results && (
        <div className="results-card">
          <h3>Results for {results.email}</h3>

          <div className={`status-banner ${results.breached ? 'breached' : 'safe'}`}>
            {results.breached ? (
              <>
                <span className="status-icon">⚠️</span>
                <div className="status-text">
                  <h4>Email Found in Breaches</h4>
                  <p>This email appears in {results.breaches.length} known data breach(es).</p>
                </div>
              </>
            ) : (
              <>
                <span className="status-icon">✅</span>
                <div className="status-text">
                  <h4>No Breaches Found</h4>
                  <p>This email does not appear in any known data breaches.</p>
                </div>
              </>
            )}
          </div>

          {results.breached && results.breaches.length > 0 && (
            <div className="breaches-section">
              <h4>Affected Breaches</h4>
              <div className="breaches-list">
                {results.breaches.map((breach, index) => (
                  <div key={index} className="breach-item">
                    <div className="breach-header">
                      <span className="breach-name">{breach.name}</span>
                      <span className="breach-date">{breach.date}</span>
                    </div>
                    <p className="breach-records">
                      ~{breach.records.toLocaleString()} records affected
                    </p>
                  </div>
                ))}
              </div>

              <div className="breach-recommendations">
                <h4>What Should You Do?</h4>
                <ul>
                  <li>🔐 Change your password immediately on affected services</li>
                  <li>📧 Use a unique password for each online account</li>
                  <li>👁️ Monitor your accounts for suspicious activity</li>
                  <li>📱 Enable two-factor authentication where available</li>
                </ul>
              </div>
            </div>
          )}

          <div className="results-footer">
            <p className="timestamp">
              Check completed: {new Date(results.timestamp).toLocaleString()}
            </p>
            <button
              onClick={() => {
                setResults(null);
                setEmail('');
              }}
              className="btn btn-secondary"
            >
              Check Another Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BreachChecker;
