import React, { useState } from 'react';
import TodoItem from './TodoItem';
import { Plus, CheckCircle, SearchX } from 'lucide-react';

export default function TodoList({
  todos,
  onToggle,
  onEdit,
  onDelete,
  onQuickAdd,
  onOpenCreateModal,
  isFiltered,
}) {
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAdd(quickTitle.trim());
    setQuickTitle('');
  };

  return (
    <section aria-label="Task List">
      {/* Inline Quick Add Input */}
      <form className="quick-add-card" onSubmit={handleQuickSubmit}>
        <Plus size={20} color="var(--primary)" />
        <input
          type="text"
          className="quick-add-input"
          placeholder="Quick add a new task and press Enter..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!quickTitle.trim()}
        >
          Add
        </button>
      </form>

      {/* Todo Item Cards */}
      {todos.length > 0 ? (
        <div className="todo-list-container">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            {isFiltered ? <SearchX size={32} /> : <CheckCircle size={32} />}
          </div>
          <h3 className="empty-title">
            {isFiltered ? 'No matching tasks found' : 'All caught up!'}
          </h3>
          <p className="empty-desc">
            {isFiltered
              ? 'Try changing your search term, priority, or category filters.'
              : 'You have completed all your tasks or haven’t added any yet. Create a new task to get started.'}
          </p>
          {!isFiltered && (
            <button className="btn btn-primary" onClick={onOpenCreateModal}>
              <Plus size={18} />
              <span>Create Your First Task</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
