import React, { useState } from 'react';
import './PhoneLookup.css';

function PhoneLookup({ onSearchComplete }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
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

      const response = await fetch('/api/osint/phone-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to lookup phone number');
      }

      const data = await response.json();
      setResults(data);

      // Save to history
      await fetch('/api/searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          searchType: 'phone',
          query: phoneNumber,
          results: JSON.stringify(data)
        })
      });

      if (onSearchComplete) onSearchComplete();
    } catch (err) {
      console.error('Phone lookup error:', err);
      setError(err.message || 'An error occurred during phone lookup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-lookup">
      <div className="search-container">
        <h2>📱 Phone Number Lookup</h2>
        <p className="description">
          Search for information about a phone number. Enter the number with country code (e.g., +1-555-123-4567)
        </p>

        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label htmlFor="phone">Phone Number:</label>
            <input
              id="phone"
              type="tel"
              placeholder="+1-555-123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Searching...' : 'Search Phone Number'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {results && (
        <div className="results-container">
          <h3>📊 Phone Lookup Results</h3>
          
          {results.found ? (
            <div className="results-grid">
              <div className="result-card">
                <h4>Phone Number</h4>
                <p>{results.phoneNumber}</p>
              </div>

              {results.carrier && (
                <div className="result-card">
                  <h4>Carrier</h4>
                  <p>{results.carrier}</p>
                </div>
              )}

              {results.type && (
                <div className="result-card">
                  <h4>Type</h4>
                  <p>{results.type}</p>
                </div>
              )}

              {results.country && (
                <div className="result-card">
                  <h4>Country</h4>
                  <p>{results.country}</p>
                </div>
              )}

              {results.region && (
                <div className="result-card">
                  <h4>Region</h4>
                  <p>{results.region}</p>
                </div>
              )}

              {results.city && (
                <div className="result-card">
                  <h4>City</h4>
                  <p>{results.city}</p>
                </div>
              )}

              {results.timezone && (
                <div className="result-card">
                  <h4>Timezone</h4>
                  <p>{results.timezone}</p>
                </div>
              )}

              {results.registeredTo && (
                <div className="result-card">
                  <h4>Registered To</h4>
                  <p>{results.registeredTo}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-results">
              <p>No information found for this phone number.</p>
            </div>
          )}

          <div className="info-box">
            <p>💡 <strong>Tip:</strong> Phone number lookup results depend on publicly available data. Some numbers may have limited information available.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhoneLookup;
