import React from 'react';
import { CheckSquare, Moon, Sun, Plus, RefreshCw, Database } from 'lucide-react';

export default function Navbar({
  theme,
  toggleTheme,
  backendOnline,
  dbStatus,
  isRefreshing,
  onRefresh,
  onOpenCreateModal,
}) {
  const isDbConnected = backendOnline && dbStatus?.connected;
  const dbProvider = dbStatus?.provider || 'SQLite';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-group">
          <div className="brand-icon">
            <CheckSquare size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">TaskFlow</span>
              <span className="brand-badge">React + .NET 8</span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="nav-actions">
          {/* Backend API Health Status */}
          <div
            className="status-pill"
            title={backendOnline ? '.NET Web API Connected' : 'Connecting to .NET Web API...'}
          >
            <span
              className={`status-dot ${
                isRefreshing ? 'loading' : backendOnline ? 'online' : 'offline'
              }`}
            />
            <span>{backendOnline ? 'API Connected' : 'Offline Mode'}</span>
          </div>

          {/* Database Health Status */}
          <div
            className="status-pill db-status-pill"
            title={
              isDbConnected
                ? `Connected to ${dbProvider}`
                : 'Database disconnected / Offline fallback'
            }
          >
            <Database size={13} style={{ opacity: 0.8 }} />
            <span
              className={`status-dot ${
                isRefreshing ? 'loading' : isDbConnected ? 'online' : 'offline'
              }`}
            />
            <span>{isDbConnected ? dbProvider : 'DB Offline'}</span>
          </div>

          {/* Refresh Button */}
          <button
            className="btn-icon"
            onClick={onRefresh}
            title="Refresh tasks from server"
            aria-label="Refresh tasks"
          >
            <RefreshCw size={17} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Theme Toggle */}
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Create Task Button */}
          <button
            id="btn-create-task"
            className="btn btn-primary"
            onClick={onOpenCreateModal}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Task</span>
            <span className="kbd-shortcut">N</span>
          </button>
        </div>
      </div>
    </header>
  );
}
