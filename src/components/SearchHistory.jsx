import React, { useState, useEffect } from 'react';
import './SearchHistory.css';

function SearchHistory() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/searches', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch history');
        return;
      }

      setSearches(data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSearchTypeIcon = (type) => {
    const icons = {
      username: '👤',
      domain: '🌐',
      breach: '⚠️',
    };
    return icons[type] || '🔍';
  };

  const getSearchTypeLabel = (type) => {
    const labels = {
      username: 'Username Search',
      domain: 'Domain Lookup',
      breach: 'Breach Check',
    };
    return labels[type] || type;
  };

  const filteredSearches = filter === 'all' 
    ? searches 
    : searches.filter(s => s.search_type === filter);

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>📜 Search History</h2>
        <p className="description">View all your previous OSINT searches and results.</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Searches ({searches.length})
        </button>
        <button
          className={`filter-btn ${filter === 'username' ? 'active' : ''}`}
          onClick={() => setFilter('username')}
        >
          Usernames
        </button>
        <button
          className={`filter-btn ${filter === 'domain' ? 'active' : ''}`}
          onClick={() => setFilter('domain')}
        >
          Domains
        </button>
        <button
          className={`filter-btn ${filter === 'breach' ? 'active' : ''}`}
          onClick={() => setFilter('breach')}
        >
          Breaches
        </button>
      </div>

      {filteredSearches.length === 0 ? (
        <div className="empty-state">
          <p>No search history found.</p>
          <p className="empty-hint">Your searches will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {filteredSearches.map((search) => (
            <div key={search.id} className="history-item">
              <div className="history-item-header">
                <span className="search-type-icon">
                  {getSearchTypeIcon(search.search_type)}
                </span>
                <div className="search-info">
                  <span className="search-type">
                    {getSearchTypeLabel(search.search_type)}
                  </span>
                  <span className="search-query">{search.query}</span>
                </div>
                <span className="search-date">
                  {new Date(search.created_at).toLocaleString()}
                </span>
              </div>
              {search.results && (
                <div className="search-results-preview">
                  <pre>{JSON.stringify(JSON.parse(search.results), null, 2).substring(0, 200)}...</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchHistory;
