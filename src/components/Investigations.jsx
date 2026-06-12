import React, { useState, useEffect } from 'react';
import './Investigations.css';

function Investigations() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const fetchInvestigations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/investigations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch investigations');
        return;
      }

      setInvestigations(data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Please enter a case title');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/investigations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save investigation');
        return;
      }

      setFormData({ title: '', description: '' });
      setShowForm(false);
      fetchInvestigations();
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="investigations-container">
      <div className="investigations-header">
        <h2>📁 Investigation Cases</h2>
        <p className="description">
          Create and manage your OSINT investigations. Organize your findings and keep track of your cases.
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          + Create New Case
        </button>
      ) : (
        <div className="form-card">
          <h3>Create New Investigation</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="title">Case Title</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Social Media Investigation"
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes about this investigation..."
                rows="4"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn btn-primary">
                Save Case
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', description: '' });
                  setError('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {investigations.length === 0 ? (
        <div className="empty-state">
          <p>No investigations yet.</p>
          <p className="empty-hint">Create your first case to get started.</p>
        </div>
      ) : (
        <div className="investigations-grid">
          {investigations.map((investigation) => (
            <div key={investigation.id} className="investigation-card">
              <h3>{investigation.title}</h3>
              {investigation.description && (
                <p className="description">{investigation.description}</p>
              )}
              <div className="investigation-meta">
                <span className="date">
                  Created: {new Date(investigation.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Investigations;
