import React from 'react';
import { Check, Calendar, Tag, Edit3, Trash2 } from 'lucide-react';

export default function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const { id, title, description, isCompleted, priority, dueDate, category, tags } = todo;

  // Format Due Date and status
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const isPast = diffMs < 0;
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    let relativeLabel = '';
    let statusClass = '';

    if (isPast && !isCompleted) {
      statusClass = 'overdue';
      if (Math.abs(diffHours) < 24) {
        relativeLabel = `Overdue by ${Math.abs(diffHours)}h`;
      } else {
        relativeLabel = `Overdue by ${Math.abs(diffDays)}d`;
      }
    } else if (isToday) {
      statusClass = 'due-today';
      relativeLabel = 'Due Today';
    } else if (diffDays === 1) {
      relativeLabel = 'Due Tomorrow';
    } else if (diffDays > 1 && diffDays < 7) {
      relativeLabel = `Due in ${diffDays} days`;
    } else {
      relativeLabel = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }

    return {
      formatted: date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      relativeLabel,
      statusClass,
    };
  };

  const dueInfo = formatDueDate(dueDate);
  const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const priorityClass = `badge-priority-${(priority || 'medium').toLowerCase()}`;

  return (
    <article
      className={`todo-card ${isCompleted ? 'completed' : ''}`}
      id={`todo-item-${id}`}
    >
      {/* Checkbox */}
      <div className="todo-checkbox-wrapper">
        <button
          className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
          onClick={() => onToggle(id)}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          aria-label={`Toggle task "${title}" status`}
        >
          <Check size={14} strokeWidth={3} />
        </button>
      </div>

      {/* Task Content */}
      <div className="todo-content">
        <div className="todo-header-row">
          <h3 className="todo-title">{title}</h3>

          {/* Quick Actions */}
          <div className="todo-actions">
            <button
              className="action-btn"
              onClick={() => onEdit(todo)}
              title="Edit task"
              aria-label={`Edit task "${title}"`}
            >
              <Edit3 size={16} />
            </button>
            <button
              className="action-btn delete"
              onClick={() => onDelete(id)}
              title="Delete task"
              aria-label={`Delete task "${title}"`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Description if present */}
        {description && <p className="todo-description">{description}</p>}

        {/* Metadata Row */}
        <div className="todo-meta-row">
          {/* Priority */}
          <span className={`badge ${priorityClass}`}>
            {priority || 'Medium'}
          </span>

          {/* Category */}
          {category && (
            <span className="badge badge-category">
              <Tag size={11} />
              {category}
            </span>
          )}

          {/* Due Date */}
          {dueInfo && (
            <span
              className={`badge badge-due-date ${dueInfo.statusClass}`}
              title={`Full deadline: ${dueInfo.formatted}`}
            >
              <Calendar size={11} />
              {dueInfo.relativeLabel}
            </span>
          )}

          {/* Tags */}
          {tagList.map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
