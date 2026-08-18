import React from 'react';
import { Search, X, Trash2, ArrowUpDown, Tag } from 'lucide-react';

export default function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  categories = [],
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onClearCompleted,
  hasCompletedTasks,
}) {
  return (
    <div className="filter-card">
      {/* Search Input Bar */}
      <div className="search-input-wrapper">
        <Search className="search-icon" size={18} />
        <input
          id="search-tasks-input"
          type="text"
          className="search-input"
          placeholder="Search tasks, descriptions, or tags... (Press / to focus)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="search-clear-btn"
            onClick={() => setSearch('')}
            aria-label="Clear search input"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Row 1: Status & Sorters */}
      <div className="filter-row">
        {/* Status Segment Controls */}
        <div className="segmented-control" role="tablist" aria-label="Filter tasks by status">
          <button
            role="tab"
            aria-selected={statusFilter === 'all'}
            className={`segment-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Tasks
          </button>
          <button
            role="tab"
            aria-selected={statusFilter === 'false'}
            className={`segment-btn ${statusFilter === 'false' ? 'active' : ''}`}
            onClick={() => setStatusFilter('false')}
          >
            Active
          </button>
          <button
            role="tab"
            aria-selected={statusFilter === 'true'}
            className={`segment-btn ${statusFilter === 'true' ? 'active' : ''}`}
            onClick={() => setStatusFilter('true')}
          >
            Completed
          </button>
        </div>

        {/* Dropdowns & Bulk Actions */}
        <div className="filter-dropdowns">
          {/* Priority filter */}
          <select
            id="priority-select"
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟡 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">⚪ Low</option>
          </select>

          {/* Sort By selector */}
          <select
            id="sort-by-select"
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort tasks by"
          >
            <option value="created">Sort: Created Date</option>
            <option value="duedate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            className="btn-icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            aria-label="Toggle sort order"
          >
            <ArrowUpDown size={16} />
          </button>

          {/* Clear Completed Action */}
          {hasCompletedTasks && (
            <button
              id="btn-clear-completed"
              className="btn btn-danger-ghost btn-sm"
              onClick={onClearCompleted}
              title="Delete all completed tasks"
            >
              <Trash2 size={15} />
              <span>Clear Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row 2: Category Pills */}
      <div className="category-pills-row" role="tablist" aria-label="Filter tasks by category">
        <button
          className={`category-pill ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${categoryFilter.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
