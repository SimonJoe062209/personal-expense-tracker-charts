import { Transaction, Budget, UserSettings } from '../types';

// Dynamic API host determination (supports custom URL, localhost, local network IP, and Vercel production)
const getApiBaseUrl = () => {
  let envApi = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envApi) {
    envApi = envApi.trim().replace(/\/+$/, '');
    return envApi.endsWith('/api') ? envApi : `${envApi}/api`;
  }
  if (typeof window !== 'undefined') {
    // If running in production (Vercel, Render, or any standard port 80/443 without local dev port)
    if (window.location.port === '' || window.location.protocol === 'https:') {
      return '/api';
    }
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5001/api`;
  }
  return 'http://localhost:5001/api';
};

const API_BASE = getApiBaseUrl();

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('moneta_auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiService = {
  // Auth API
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async demoLogin() {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Demo login failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to authenticate');
    return data.user;
  },

  // Transactions API
  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/transactions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch transactions from MongoDB');
    return res.json();
  },

  async createTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tx),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record transaction');
    return data;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update transaction');
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },

  // Budgets API
  async getBudgets(): Promise<Budget[]> {
    const res = await fetch(`${API_BASE}/budgets`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch budgets from MongoDB');
    return res.json();
  },

  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Budget> {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(budget),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create budget');
    return data;
  },

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const res = await fetch(`${API_BASE}/budgets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update budget');
    return data;
  },

  async deleteBudget(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/budgets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete budget');
  },

  // Settings API
  async getSettings(): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch settings from MongoDB');
    return res.json();
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');
    return data;
  },

  async resetDemoData(): Promise<void> {
    const res = await fetch(`${API_BASE}/settings/reset-demo`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset demo dataset');
  },

  async checkHealth(): Promise<{ status: string; demoAccount: any }> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
};
