import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Plus, Sun, Moon, Calendar } from 'lucide-react';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Financial Overview', subtitle: 'Real-time cash flow and portfolio trajectory' },
  '/transactions': { title: 'Transaction Ledger', subtitle: 'Manage, filter, and audit all financial records' },
  '/analytics': { title: 'Analytical Insights', subtitle: 'Trend analysis, category ratios, and velocity metrics' },
  '/budgets': { title: 'Budget Allocation', subtitle: 'Spending targets, threshold alerts, and discipline metrics' },
  '/settings': { title: 'Preferences & Storage', subtitle: 'Currency locales, theme controls, and data import/export' },
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { settings, updateSettings, setIsAddTransactionOpen } = useApp();

  const currentMeta = PAGE_TITLES[location.pathname] || {
    title: 'Financial Tracker',
    subtitle: 'MONETA personal finance control center',
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  const todayFormatted = format(new Date(), 'EEEE, MMM dd, yyyy');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
            {currentMeta.title}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Date badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>{todayFormatted}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle dark/light theme"
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Global Add Transaction Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddTransactionOpen(true)}
        >
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
};
