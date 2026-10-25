import { Transaction, Budget, UserSettings } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_USER_SETTINGS } from '../data/seedData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'moneta_transactions_v1',
  BUDGETS: 'moneta_budgets_v1',
  SETTINGS: 'moneta_settings_v1',
};

// Safe wrapper for localStorage access
export const storageService = {
  getTransactions(): Transaction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!stored) {
        this.saveTransactions(INITIAL_TRANSACTIONS);
        return INITIAL_TRANSACTIONS;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Malformed transactions format');
      return parsed;
    } catch (e) {
      console.warn('Could not read transactions from storage, restoring defaults:', e);
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      window.dispatchEvent(new Event('moneta-storage-updated'));
    } catch (e) {
      console.error('Failed to save transactions to localStorage:', e);
    }
  },

  getBudgets(): Budget[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!stored) {
        this.saveBudgets(INITIAL_BUDGETS);
        return INITIAL_BUDGETS;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Malformed budgets format');
      return parsed;
    } catch (e) {
      console.warn('Could not read budgets from storage, restoring defaults:', e);
      return INITIAL_BUDGETS;
    }
  },

  saveBudgets(budgets: Budget[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      window.dispatchEvent(new Event('moneta-storage-updated'));
    } catch (e) {
      console.error('Failed to save budgets to localStorage:', e);
    }
  },

  getSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) {
        this.saveSettings(INITIAL_USER_SETTINGS);
        return INITIAL_USER_SETTINGS;
      }
      return { ...INITIAL_USER_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
      console.warn('Could not read settings from storage, restoring defaults:', e);
      return INITIAL_USER_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      window.dispatchEvent(new Event('moneta-storage-updated'));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  },

  resetAllToDemo(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_USER_SETTINGS));
      window.dispatchEvent(new Event('moneta-storage-updated'));
    } catch (e) {
      console.error('Failed to reset demo data:', e);
    }
  },

  exportCompleteJSON(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      transactions: this.getTransactions(),
      budgets: this.getBudgets(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.transactions)) {
        throw new Error('Invalid Moneta backup format: missing transactions array');
      }
      this.saveTransactions(data.transactions);
      if (Array.isArray(data.budgets)) {
        this.saveBudgets(data.budgets);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings(data.settings);
      }
      return true;
    } catch (e) {
      console.error('Failed to import Moneta backup JSON:', e);
      return false;
    }
  },

  exportTransactionsCSV(): string {
    const transactions = this.getTransactions();
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.type,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.paymentMethod}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
