import React, { useState, useEffect } from 'react';
import UsernameSearch from '../components/UsernameSearch';
import DomainLookup from '../components/DomainLookup';
import BreachChecker from '../components/BreachChecker';
import PhoneLookup from '../components/PhoneLookup';
import SearchHistory from '../components/SearchHistory';
import Investigations from '../components/Investigations';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('username');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSearchComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔍 OSINT Nexus</h1>
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <button onClick={onLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'username' ? 'active' : ''}`}
          onClick={() => setActiveTab('username')}
        >
          👤 Username Search
        </button>
        <button
          className={`tab ${activeTab === 'domain' ? 'active' : ''}`}
          onClick={() => setActiveTab('domain')}
        >
          🌐 Domain Lookup
        </button>
        <button
          className={`tab ${activeTab === 'breach' ? 'active' : ''}`}
          onClick={() => setActiveTab('breach')}
        >
          ⚠️ Breach Check
        </button>
        <button
          className={`tab ${activeTab === 'phone' ? 'active' : ''}`}
          onClick={() => setActiveTab('phone')}
        >
          📱 Phone Lookup
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History
        </button>
        <button
          className={`tab ${activeTab === 'investigations' ? 'active' : ''}`}
          onClick={() => setActiveTab('investigations')}
        >
          📁 Cases
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'username' && (
          <UsernameSearch onSearchComplete={handleSearchComplete} />
        )}
        {activeTab === 'domain' && (
          <DomainLookup onSearchComplete={handleSearchComplete} />
        )}
        {activeTab === 'breach' && (
          <BreachChecker onSearchComplete={handleSearchComplete} />
        )}
        {activeTab === 'phone' && (
          <PhoneLookup onSearchComplete={handleSearchComplete} />
        )}
        {activeTab === 'history' && <SearchHistory key={refreshKey} />}
        {activeTab === 'investigations' && <Investigations />}
      </main>
    </div>
  );
}

export default Dashboard;
