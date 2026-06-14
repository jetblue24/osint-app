import React, { useState } from 'react';
import './FileSearch.css';

function FileSearch({ onSearchComplete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
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

      const response = await fetch('/api/osint/file-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: searchQuery.trim(),
          searchType: searchType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search files');
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
          searchType: 'file_search',
          query: searchQuery,
          results: JSON.stringify(data)
        })
      });

      if (onSearchComplete) onSearchComplete();
    } catch (err) {
      console.error('File search error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-search">
      <div className="search-container">
        <h2>📄 File & Document Search</h2>
        <p className="description">
          Search for files, documents, news articles, and public records. Find information about people, organizations, and events.
        </p>

        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label htmlFor="query">Search Query:</label>
            <input
              id="query"
              type="text"
              placeholder="e.g., person name, organization, event"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Search Type:</label>
            <select
              id="type"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              disabled={loading}
              className="select-field"
            >
              <option value="all">All Files & Documents</option>
              <option value="news">News Articles</option>
              <option value="government">Government Records</option>
              <option value="legal">Legal Documents</option>
              <option value="academic">Academic Papers</option>
              <option value="business">Business Records</option>
              <option value="social">Social Media</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Searching...' : 'Search Files'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {results && (
        <div className="results-container">
          <h3>📊 Search Results ({results.totalResults || 0})</h3>
          
          {results.files && results.files.length > 0 ? (
            <div className="files-list">
              {results.files.map((file, idx) => (
                <div key={idx} className="file-card">
                  <div className="file-header">
                    <h4>{file.title}</h4>
                    <span className="file-type">{file.type}</span>
                  </div>
                  
                  {file.description && (
                    <p className="file-description">{file.description}</p>
                  )}
                  
                  <div className="file-meta">
                    {file.source && (
                      <span className="meta-item">
                        <strong>Source:</strong> {file.source}
                      </span>
                    )}
                    {file.date && (
                      <span className="meta-item">
                        <strong>Date:</strong> {file.date}
                      </span>
                    )}
                    {file.relevance && (
                      <span className="meta-item">
                        <strong>Relevance:</strong> {file.relevance}%
                      </span>
                    )}
                  </div>

                  {file.url && (
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-link">
                      View Document →
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No files found matching your search. Try different keywords.</p>
            </div>
          )}

          <div className="info-box">
            <p>💡 <strong>Tip:</strong> Use specific keywords or names to get better results. Government records and news articles are indexed regularly.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileSearch;
