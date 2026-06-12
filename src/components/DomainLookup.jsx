import React, { useState } from 'react';
import './DomainLookup.css';

function DomainLookup({ onSearchComplete }) {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/osint/domain-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Lookup failed');
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
        <h2>🌐 Domain & IP Lookup</h2>
        <p className="description">
          Enter a domain name to get information about its IP address, DNS records, and WHOIS details.
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSearch}>
          <div className="input-group">
            <label htmlFor="domain">Domain Name</label>
            <input
              id="domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., example.com"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '🔍 Looking up...' : '🔍 Lookup'}
          </button>
        </form>
      </div>

      {results && (
        <div className="results-card">
          <h3>Results for {results.domain}</h3>

          <div className="info-section">
            <h4>Basic Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">IP Address</span>
                <span className="value">{results.ip}</span>
              </div>
              <div className="info-item">
                <span className="label">Country</span>
                <span className="value">{results.country}</span>
              </div>
              <div className="info-item">
                <span className="label">ISP</span>
                <span className="value">{results.isp}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h4>DNS Records</h4>
            <div className="dns-records">
              {Object.entries(results.dns_records).map(([type, records]) => (
                <div key={type} className="dns-item">
                  <span className="dns-type">{type}</span>
                  <div className="dns-values">
                    {records.map((record, idx) => (
                      <code key={idx}>{record}</code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h4>WHOIS Information</h4>
            <div className="whois-info">
              <div className="whois-item">
                <span className="label">Registrar</span>
                <span className="value">{results.whois.registrar}</span>
              </div>
              <div className="whois-item">
                <span className="label">Created</span>
                <span className="value">{results.whois.created}</span>
              </div>
              <div className="whois-item">
                <span className="label">Expires</span>
                <span className="value">{results.whois.expires}</span>
              </div>
            </div>
          </div>

          <div className="results-footer">
            <p className="timestamp">
              Lookup completed: {new Date(results.timestamp).toLocaleString()}
            </p>
            <button
              onClick={() => {
                setResults(null);
                setDomain('');
              }}
              className="btn btn-secondary"
            >
              New Lookup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DomainLookup;
