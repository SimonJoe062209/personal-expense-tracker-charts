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

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    storageService.getTransactions()
  );
  const [budgets, setBudgets] = useState<Budget[]>(() => storageService.getBudgets());
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');

  // Modal states
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync with localStorage across tabs or internal events
  useEffect(() => {
    const handleStorageChange = () => {
      setTransactions(storageService.getTransactions());
      setBudgets(storageService.getBudgets());
      setSettings(storageService.getSettings());
    };
    window.addEventListener('moneta-storage-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('moneta-storage-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
    // Current month is October (month index 10)
    const now = new Date();
    return calculateBudgetStatuses(budgets, transactions, now.getMonth() + 1, now.getFullYear(), now);
  }, [budgets, transactions]);

  const spendingInsights = useMemo(() => {
    return generateSpendingInsights(currentPeriod, previousPeriod, budgetStatuses);
  }, [currentPeriod, previousPeriod, budgetStatuses]);

  // CRUD actions
  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newTx: Transaction = {
        ...tx,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction recorded successfully', 'success');
    },
    [transactions, showToast]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      const updated = transactions.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      );
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction updated', 'success');
    },
    [transactions, showToast]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction removed', 'info');
    },
    [transactions, showToast]
  );

  const addBudget = useCallback(
    (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Check for duplicate category budget for the same month/year
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
      const newBudget: Budget = {
        ...budget,
        id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...budgets, newBudget];
      setBudgets(updated);
      storageService.saveBudgets(updated);
      showToast('Budget target created', 'success');
      return { success: true };
    },
    [budgets, showToast]
  );

  const updateBudget = useCallback(
    (id: string, updates: Partial<Budget>) => {
      const updated = budgets.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      );
      setBudgets(updated);
      storageService.saveBudgets(updated);
      showToast('Budget updated', 'success');
    },
    [budgets, showToast]
  );

  const deleteBudget = useCallback(
    (id: string) => {
      const updated = budgets.filter((b) => b.id !== id);
      setBudgets(updated);
      storageService.saveBudgets(updated);
      showToast('Budget target deleted', 'info');
    },
    [budgets, showToast]
  );

  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      const updated = { ...settings, ...updates };
      setSettings(updated);
      storageService.saveSettings(updated);
      showToast('Settings saved', 'success');
    },
    [settings, showToast]
  );

  const resetToDemo = useCallback(() => {
    storageService.resetAllToDemo();
    setTransactions(storageService.getTransactions());
    setBudgets(storageService.getBudgets());
    setSettings(storageService.getSettings());
    showToast('Reset to demo sample data successfully', 'success');
  }, [showToast]);

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
