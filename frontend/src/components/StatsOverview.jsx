import React from 'react';
import { Layers, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const {
    totalTasks = 0,
    activeTasks = 0,
    completedTasks = 0,
    overdueTasks = 0,
    highOrUrgentTasks = 0,
    completionRatePercentage = 0,
  } = stats || {};

  return (
    <section className="stats-grid" aria-label="Task statistics overview">
      {/* Total Tasks */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">Total Tasks</span>
          <div className="stat-icon-wrapper stat-icon-total">
            <Layers size={16} />
          </div>
        </div>
        <div className="stat-value">{totalTasks}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Across all categories
        </div>
      </div>

      {/* Active Tasks */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">In Progress</span>
          <div className="stat-icon-wrapper stat-icon-active">
            <Clock size={16} />
          </div>
        </div>
        <div className="stat-value">{activeTasks}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {highOrUrgentTasks > 0 ? `${highOrUrgentTasks} high/urgent priority` : 'All tasks normal'}
        </div>
      </div>

      {/* Completed Tasks */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">Completed</span>
          <div className="stat-icon-wrapper stat-icon-completed">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="stat-value">{completedTasks}</div>
        <div className="stat-progress-bar" title={`${completionRatePercentage}% completed`}>
          <div
            className="stat-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, completionRatePercentage))}%` }}
          />
        </div>
      </div>

      {/* Overdue Tasks */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">Overdue</span>
          <div className="stat-icon-wrapper stat-icon-overdue">
            <AlertTriangle size={16} />
          </div>
        </div>
        <div className="stat-value" style={{ color: overdueTasks > 0 ? 'var(--accent-urgent)' : 'inherit' }}>
          {overdueTasks}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {overdueTasks > 0 ? 'Action required soon' : 'All deadlines on track'}
        </div>
      </div>
    </section>
  );
}
