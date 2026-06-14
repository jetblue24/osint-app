import React, { useState, useEffect } from 'react';
import './Investigations.css';

function Investigations() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
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
      const url = selectedCase 
        ? `/api/investigations/${selectedCase.id}`
        : '/api/investigations';
      
      const method = selectedCase ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
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

      setFormData({ title: '', description: '', notes: '' });
      setShowForm(false);
      setSelectedCase(null);
      fetchInvestigations();
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleOpenCase = (investigation) => {
    setSelectedCase(investigation);
    setFormData({
      title: investigation.title,
      description: investigation.description || '',
      notes: investigation.notes || '',
    });
    setShowForm(true);
  };

  const handleDeleteCase = async (id) => {
    if (!window.confirm('Are you sure you want to delete this case?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/investigations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError('Failed to delete case');
        return;
      }

      fetchInvestigations();
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedCase(null);
    setFormData({ title: '', description: '', notes: '' });
    setError('');
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
          <h3>{selectedCase ? 'Edit Investigation' : 'Create New Investigation'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="title">Case Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Social Media Investigation"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add details about this investigation..."
                rows="3"
              />
            </div>

            <div className="input-group">
              <label htmlFor="notes">Investigation Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add your findings, observations, and notes here..."
                rows="6"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn btn-primary">
                {selectedCase ? 'Update Case' : 'Save Case'}
              </button>
              <button
                type="button"
                onClick={handleCloseForm}
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
              <div className="card-header">
                <h3>{investigation.title}</h3>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteCase(investigation.id)}
                  title="Delete case"
                >
                  ✕
                </button>
              </div>
              
              {investigation.description && (
                <p className="description">{investigation.description}</p>
              )}
              
              {investigation.notes && (
                <div className="notes-preview">
                  <strong>Notes:</strong>
                  <p>{investigation.notes.substring(0, 100)}...</p>
                </div>
              )}
              
              <div className="investigation-meta">
                <span className="date">
                  Created: {new Date(investigation.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <button
                className="btn btn-open"
                onClick={() => handleOpenCase(investigation)}
              >
                Open & Edit Case
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Investigations;
