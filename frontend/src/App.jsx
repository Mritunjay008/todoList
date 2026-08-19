import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import FilterBar from './components/FilterBar';
import TodoList from './components/TodoList';
import TodoModal from './components/TodoModal';
import Toast from './components/Toast';
import { api } from './services/api';

// Initial fallback mock items in case API is still starting up
const INITIAL_DEMO_TODOS = [
  {
    id: 1,
    title: 'Review pull request for authentication service',
    description: 'Check OAuth2 flow, token expiration logic, and unit test coverage before merging.',
    isCompleted: false,
    priority: 'Urgent',
    dueDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    category: 'Work',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    tags: 'security,backend,pr',
  },
  {
    id: 2,
    title: 'Design dark mode color tokens & micro-interactions',
    description: 'Refine HSL palette tokens and test button press states and hover transitions across screens.',
    isCompleted: true,
    priority: 'High',
    dueDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    category: 'Design',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    tags: 'ui,ux,tokens',
  },
  {
    id: 3,
    title: 'Weekly grocery & organic supplies restocking',
    description: 'Almond milk, whole grain sourdough, avocados, olive oil, fresh spinach, and green tea.',
    isCompleted: false,
    priority: 'Medium',
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    category: 'Personal',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    tags: 'shopping,groceries',
  },
  {
    id: 4,
    title: 'Read chapter 4 of Clean Architecture',
    description: 'Focus on Component Cohesion, Common Closure Principle, and Dependency Inversion.',
    isCompleted: false,
    priority: 'Low',
    dueDate: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    category: 'Learning',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    tags: 'books,architecture,study',
  },
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('taskflow_theme') || 'dark';
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('taskflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // State
  const [todos, setTodos] = useState(INITIAL_DEMO_TODOS);
  const [stats, setStats] = useState({
    totalTasks: 4,
    completedTasks: 1,
    activeTasks: 3,
    overdueTasks: 0,
    highOrUrgentTasks: 2,
    completionRatePercentage: 25.0,
  });
  const [categories, setCategories] = useState(['Work', 'Personal', 'Shopping', 'Learning', 'Health', 'Design', 'General']);
  const [backendOnline, setBackendOnline] = useState(true);
  const [dbStatus, setDbStatus] = useState({ connected: true, provider: 'SQLite' });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal & Toast state
  const [modal, setModal] = useState({ isOpen: false, data: null });
  const [toasts, setToasts] = useState([]);

  // Add toast helper
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Calculate local stats if offline
  const computeLocalStats = (taskList) => {
    const total = taskList.length;
    const completed = taskList.filter((t) => t.isCompleted).length;
    const active = total - completed;
    const now = new Date();
    const overdue = taskList.filter(
      (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now
    ).length;
    const highOrUrgent = taskList.filter(
      (t) => !t.isCompleted && (t.priority === 'High' || t.priority === 'Urgent')
    ).length;
    const rate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      activeTasks: active,
      overdueTasks: overdue,
      highOrUrgentTasks: highOrUrgent,
      completionRatePercentage: rate,
      databaseProvider: 'Local (Offline)',
      databaseConnected: false,
    };
  };

  // Fetch tasks and auxiliary data from .NET API
  const loadData = useCallback(async (showToastNotice = false) => {
    setIsRefreshing(true);
    try {
      const [todosData, statsData, catsData] = await Promise.all([
        api.getTodos({
          isCompleted: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          search,
          sortBy,
          sortOrder,
        }),
        api.getStats().catch(() => null),
        api.getCategories().catch(() => null),
      ]);

      setTodos(todosData);
      setBackendOnline(true);

      if (statsData) {
        setStats(statsData);
        setDbStatus({
          connected: statsData.databaseConnected ?? true,
          provider: statsData.databaseProvider || 'SQLite',
        });
      } else {
        setStats(computeLocalStats(todosData));
      }

      if (catsData && Array.isArray(catsData)) {
        setCategories(catsData);
      }

      if (showToastNotice) {
        addToast('Synced with .NET 8 Web API', 'success');
      }
    } catch (err) {
      console.warn('API unavailable, operating in local mode:', err.message);
      setBackendOnline(false);
      setDbStatus({ connected: false, provider: 'Offline' });
      // Filter locally
      setTodos((prev) => {
        let filtered = [...prev];
        if (statusFilter !== 'all') {
          const isComp = statusFilter === 'true';
          filtered = filtered.filter((t) => t.isCompleted === isComp);
        }
        if (priorityFilter !== 'all') {
          filtered = filtered.filter((t) => t.priority.toLowerCase() === priorityFilter.toLowerCase());
        }
        if (categoryFilter !== 'all') {
          filtered = filtered.filter((t) => t.category.toLowerCase() === categoryFilter.toLowerCase());
        }
        if (search) {
          const term = search.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(term) ||
              (t.description && t.description.toLowerCase().includes(term)) ||
              (t.tags && t.tags.toLowerCase().includes(term))
          );
        }
        return filtered;
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, search, sortBy, sortOrder, addToast]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is actively in an input or textarea
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setModal({ isOpen: true, data: null });
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-tasks-input');
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // CRUD Actions
  const handleToggle = async (id) => {
    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isCompleted: !t.isCompleted,
              completedAt: !t.isCompleted ? new Date().toISOString() : null,
            }
          : t
      )
    );

    try {
      const updated = await api.toggleTodo(id);
      addToast(
        updated.isCompleted ? 'Task marked as completed' : 'Task marked as in progress',
        'success'
      );
      loadData();
    } catch {
      addToast('Status updated', 'info');
      setStats(computeLocalStats(todos));
    }
  };

  const handleCreate = async (payload) => {
    try {
      await api.createTodo(payload);
      addToast('New task added successfully', 'success');
      setModal({ isOpen: false, data: null });
      loadData();
    } catch {
      // Fallback local creation
      const localItem = {
        id: Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        isCompleted: false,
      };
      setTodos((prev) => [localItem, ...prev]);
      setModal({ isOpen: false, data: null });
      addToast('Task created locally', 'info');
    }
  };

  const handleQuickAdd = async (title) => {
    const payload = {
      title,
      priority: 'Medium',
      category: categoryFilter !== 'all' ? categoryFilter : 'Personal',
    };
    await handleCreate(payload);
  };

  const handleUpdate = async (payload) => {
    if (!modal.data?.id) return;
    try {
      await api.updateTodo(modal.data.id, payload);
      addToast('Task updated successfully', 'success');
      setModal({ isOpen: false, data: null });
      loadData();
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === modal.data.id ? { ...t, ...payload } : t))
      );
      setModal({ isOpen: false, data: null });
      addToast('Task updated locally', 'info');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTodo(id);
      addToast('Task deleted', 'info');
      loadData();
    } catch {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      addToast('Task removed locally', 'info');
    }
  };

  const handleClearCompleted = async () => {
    if (!window.confirm('Are you sure you want to remove all completed tasks?')) return;
    try {
      const res = await api.clearCompleted();
      addToast(res.message || 'Completed tasks cleared', 'info');
      loadData();
    } catch {
      setTodos((prev) => prev.filter((t) => !t.isCompleted));
      addToast('Completed tasks cleared', 'info');
    }
  };

  const hasCompletedTasks = todos.some((t) => t.isCompleted);
  const isFiltered =
    search !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all';

  return (
    <div className="app-wrapper">
      {/* Top Navigation */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        backendOnline={backendOnline}
        dbStatus={dbStatus}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(true)}
        onOpenCreateModal={() => setModal({ isOpen: true, data: null })}
      />

      {/* Main Content Area */}
      <main className="main-container">
        {/* Statistics Metric Cards */}
        <StatsOverview stats={stats} />

        {/* Filter & Sorting Controls */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onClearCompleted={handleClearCompleted}
          hasCompletedTasks={hasCompletedTasks}
        />

        {/* Task List & Quick Add Box */}
        <TodoList
          todos={todos}
          isLoading={isLoading}
          onToggle={handleToggle}
          onEdit={(todo) => setModal({ isOpen: true, data: todo })}
          onDelete={handleDelete}
          onQuickAdd={handleQuickAdd}
          onOpenCreateModal={() => setModal({ isOpen: true, data: null })}
          isFiltered={isFiltered}
        />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>
          <span>TaskFlow • Built with </span>
          <span className="footer-tech">React 19 + Vite</span>
          <span> & </span>
          <span className="footer-tech">ASP.NET Core 8 Web API (EF Core SQLite)</span>
        </div>
      </footer>

      {/* Create / Edit Modal Dialog */}
      <TodoModal
        isOpen={modal.isOpen}
        initialData={modal.data}
        categories={categories}
        onClose={() => setModal({ isOpen: false, data: null })}
        onSubmit={modal.data ? handleUpdate : handleCreate}
      />

      {/* Toast Alerts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
