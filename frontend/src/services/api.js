const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${BASE_URL}/api/todos`;

export const api = {
  async getTodos(params = {}) {
    const query = new URLSearchParams();
    if (params.isCompleted !== undefined && params.isCompleted !== 'all') {
      query.append('isCompleted', params.isCompleted);
    }
    if (params.priority && params.priority !== 'all') {
      query.append('priority', params.priority);
    }
    if (params.category && params.category !== 'all') {
      query.append('category', params.category);
    }
    if (params.search) {
      query.append('search', params.search);
    }
    if (params.sortBy) {
      query.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      query.append('sortOrder', params.sortOrder);
    }

    const qs = query.toString();
    const url = qs ? `${API_BASE}?${qs}` : API_BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.statusText}`);
    return res.json();
  },

  async getTodo(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error(`Task #${id} not found`);
    return res.json();
  },

  async createTodo(data) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create task');
    }
    return res.json();
  },

  async updateTodo(id, data) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update task');
    }
    return res.json();
  },

  async toggleTodo(id) {
    const res = await fetch(`${API_BASE}/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to toggle task status');
    return res.json();
  },

  async deleteTodo(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return true;
  },

  async clearCompleted() {
    const res = await fetch(`${API_BASE}/completed`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear completed tasks');
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },
};
