import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';

export default function TodoModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Personal');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'Medium');
      setTags(initialData.tags || '');

      // Due date format for input datetime-local
      if (initialData.dueDate) {
        const d = new Date(initialData.dueDate);
        const pad = (n) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDueDate(formatted);
      } else {
        setDueDate('');
      }

      if (initialData.category && !categories.includes(initialData.category)) {
        setIsCustomCat(true);
        setCustomCategory(initialData.category);
      } else {
        setIsCustomCat(false);
        setCategory(initialData.category || 'General');
      }
    } else {
      // Defaults for create
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setCategory('Work');
      setIsCustomCat(false);
      setCustomCategory('');
      setDueDate('');
      setTags('');
    }
    setError('');
  }, [initialData, isOpen, categories]);

  // Handle escape & ctrl+enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, description, priority, category, isCustomCat, customCategory, dueDate, tags]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    const finalCategory = isCustomCat ? (customCategory.trim() || 'General') : category;

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      category: finalCategory,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tags: tags.trim() || null,
    };

    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {initialData ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: 'var(--accent-danger-light)',
                  color: 'var(--accent-danger)',
                  padding: '0.6rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-title-input">
                Title <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                id="task-title-input"
                type="text"
                className="form-input"
                placeholder="e.g., Complete quarterly tax preparation"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-desc-input">
                Description (Optional)
              </label>
              <textarea
                id="task-desc-input"
                className="form-textarea"
                placeholder="Add more context, acceptance criteria, or reference links..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Priority Selector */}
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <div className="priority-selector">
                {['Urgent', 'High', 'Medium', 'Low'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-opt-btn ${priority === p ? `selected ${p.toLowerCase()}` : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    {p === 'Urgent' && '🔴 '}
                    {p === 'High' && '🟡 '}
                    {p === 'Medium' && '🔵 '}
                    {p === 'Low' && '⚪ '}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category & Due Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="task-category-select">
                  Category
                </label>
                {!isCustomCat ? (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <select
                      id="task-category-select"
                      className="form-select"
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCat(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom__">+ Add Custom Category</option>
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setIsCustomCat(false)}
                      title="Back to dropdown"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="task-due-date-input">
                  Due Date
                </label>
                <input
                  id="task-due-date-input"
                  type="datetime-local"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-tags-input">
                Tags (comma-separated)
              </label>
              <input
                id="task-tags-input"
                type="text"
                className="form-input"
                placeholder="e.g. backend, urgent, sprint-4"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              id="btn-save-task"
              type="submit"
              className="btn btn-primary"
            >
              <Save size={16} />
              <span>{initialData ? 'Save Changes' : 'Create Task'}</span>
              <span className="kbd-shortcut">Ctrl+Enter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
