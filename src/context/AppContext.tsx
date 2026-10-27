import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Budget,
  UserSettings,
  TimeRange,
  FinancialSummary,
  BudgetStatus,
  SpendingInsight,
} from '../types';
import { storageService } from '../utils/storage';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import {
  filterTransactionsByDate,
  calculateFinancialSummary,
  calculateBudgetStatuses,
  generateSpendingInsights,
} from '../utils/calculations';
import { useToast } from './ToastContext';

interface AppContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  settings: UserSettings;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filteredTransactions: Transaction[];
  financialSummary: FinancialSummary;
  budgetStatuses: BudgetStatus[];
  spendingInsights: SpendingInsight[];
  reportingPeriodLabel: string;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string };
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetToDemo: () => void;
  isAddTransactionOpen: boolean;
  setIsAddTransactionOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    storageService.getTransactions()
  );
  const [budgets, setBudgets] = useState<Budget[]>(() => storageService.getBudgets());
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');

  // Modal states
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync with MongoDB backend when user is authenticated
  useEffect(() => {
    let isMounted = true;

    const loadBackendData = async () => {
      if (isAuthenticated) {
        try {
          const [backendTxs, backendBudgets, backendSettings] = await Promise.all([
            apiService.getTransactions(),
            apiService.getBudgets(),
            apiService.getSettings(),
          ]);

          if (isMounted) {
            setTransactions(backendTxs);
            setBudgets(backendBudgets);
            setSettings(backendSettings);
            // Also update local storage as offline cache
            storageService.saveTransactions(backendTxs);
            storageService.saveBudgets(backendBudgets);
            storageService.saveSettings(backendSettings);
          }
        } catch (err) {
          console.warn('[AppContext] Could not fetch data from MongoDB backend, using local store:', err);
        }
      }
    };

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Derived calculations based on selected timeRange
  const { currentPeriod, previousPeriod, label } = useMemo(() => {
    return filterTransactionsByDate(transactions, timeRange);
  }, [transactions, timeRange]);

  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(currentPeriod, previousPeriod, settings.openingBalance);
  }, [currentPeriod, previousPeriod, settings.openingBalance]);

  const budgetStatuses = useMemo(() => {
    const now = new Date();
    return calculateBudgetStatuses(budgets, transactions, now.getMonth() + 1, now.getFullYear(), now);
  }, [budgets, transactions]);

  const spendingInsights = useMemo(() => {
    return generateSpendingInsights(currentPeriod, previousPeriod, budgetStatuses);
  }, [currentPeriod, previousPeriod, budgetStatuses]);

  // CRUD actions (dispatches to MongoDB if authenticated + optimistic local state update)
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const generatedId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newTx: Transaction = {
        ...tx,
        id: generatedId,
        createdAt: now,
        updatedAt: now,
      };

      // Optimistic update
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction recorded successfully', 'success');

      // Persist to MongoDB backend
      if (isAuthenticated) {
        try {
          await apiService.createTransaction(newTx);
        } catch (err) {
          console.error('[AppContext] Failed to sync new transaction to MongoDB:', err);
        }
      }
    },
    [transactions, showToast, isAuthenticated]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      const updated = transactions.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      );
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction updated', 'success');

      if (isAuthenticated) {
        try {
          await apiService.updateTransaction(id, updates);
        } catch (err) {
          console.error('[AppContext] Failed to sync update to MongoDB:', err);
        }
      }
    },
    [transactions, showToast, isAuthenticated]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction removed', 'info');

      if (isAuthenticated) {
        try {
          await apiService.deleteTransaction(id);
        } catch (err) {
          console.error('[AppContext] Failed to sync delete to MongoDB:', err);
        }
      }
    },
    [transactions, showToast, isAuthenticated]
  );

  const addBudget = useCallback(
    (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
      const existing = budgets.find(
        (b) =>
          b.category === budget.category &&
          b.month === budget.month &&
          b.year === budget.year
      );

      if (existing) {
        return {
          success: false,
          message: `A budget for ${budget.category} already exists for this period. Please edit it instead.`,
        };
      }

      const now = new Date().toISOString();
      const generatedId = `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newBudget: Budget = {
        ...budget,
        id: generatedId,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...budgets, newBudget];
      setBudgets(updated);
      storageService.saveBudgets(updated);
      showToast('Budget target created', 'success');

      if (isAuthenticated) {
        apiService.createBudget(newBudget).catch((err) => {
          console.error('[AppContext] Failed to sync budget to MongoDB:', err);
        });
      }

      return { success: true };
    },
    [budgets, showToast, isAuthenticated]
  );

  const updateBudget = useCallback(
    async (id: string, updates: Partial<Budget>) => {
      const updated = budgets.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      );
      setBudgets(updated);
      storageService.saveBudgets(updated);
      showToast('Budget updated', 'success');

      if (isAuthenticated) {
        try {
          await apiService.updateBudget(id, updates);
        } catch (err) {
          console.error('[AppContext] Failed to sync budget update to MongoDB:', err);
        }
      }
    },
    [budgets, showToast, isAuthenticated]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      const updated = budgets.filter((b) => b.id !== id);
      setBudgets(updated);
      storageService.saveBudgets(updated);
      showToast('Budget target deleted', 'info');

      if (isAuthenticated) {
        try {
          await apiService.deleteBudget(id);
        } catch (err) {
          console.error('[AppContext] Failed to sync budget delete to MongoDB:', err);
        }
      }
    },
    [budgets, showToast, isAuthenticated]
  );

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      const updated = { ...settings, ...updates };
      setSettings(updated);
      storageService.saveSettings(updated);
      showToast('Settings saved', 'success');

      if (isAuthenticated) {
        try {
          await apiService.updateSettings(updates);
        } catch (err) {
          console.error('[AppContext] Failed to sync settings to MongoDB:', err);
        }
      }
    },
    [settings, showToast, isAuthenticated]
  );

  const resetToDemo = useCallback(async () => {
    storageService.resetAllToDemo();
    setTransactions(storageService.getTransactions());
    setBudgets(storageService.getBudgets());
    setSettings(storageService.getSettings());

    if (isAuthenticated) {
      try {
        await apiService.resetDemoData();
      } catch (err) {
        console.error('[AppContext] Failed to reset demo data in MongoDB:', err);
      }
    }

    showToast('Reset to demo sample data successfully', 'success');
  }, [showToast, isAuthenticated]);

  return (
    <AppContext.Provider
      value={{
        transactions,
        budgets,
        settings,
        timeRange,
        setTimeRange,
        filteredTransactions: currentPeriod,
        financialSummary,
        budgetStatuses,
        spendingInsights,
        reportingPeriodLabel: label,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        updateSettings,
        resetToDemo,
        isAddTransactionOpen,
        setIsAddTransactionOpen,
        editingTransaction,
        setEditingTransaction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
