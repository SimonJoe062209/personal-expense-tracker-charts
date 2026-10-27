import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { storageService } from '../utils/storage';
import { CURRENCY_CONFIGS } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  RefreshCw,
  Coins,
  User,
  Info,
  Database,
  LogOut,
  KeyRound,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToDemo, transactions, budgets } = useApp();
  const { user, logout, isBackendConnected } = useAuth();
  const { showToast } = useToast();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for profile and opening balance
  const [userName, setUserName] = useState(settings.userName);
  const [openingBalance, setOpeningBalance] = useState(settings.openingBalance.toString());

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(openingBalance) || 0;
    updateSettings({
      userName: userName.trim() || 'User',
      openingBalance: balanceNum,
    });
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const config = CURRENCY_CONFIGS[currencyCode];
    if (config) {
      updateSettings({
        currency: currencyCode,
        currencySymbol: config.symbol,
        currencyLocale: config.locale,
      });
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
  };

  const handleExportJSON = () => {
    const jsonStr = storageService.exportCompleteJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moneta_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Complete backup exported as JSON', 'success');
  };

  const handleExportCSV = () => {
    const csvStr = storageService.exportTransactionsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moneta_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported as CSV', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = storageService.importJSON(content);
        if (success) {
          showToast('Data restored successfully from backup', 'success');
        } else {
          showToast('Failed to parse backup JSON. Please check file format.', 'error');
        }
      } catch (err) {
        showToast('Error reading file: ' + String(err), 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Configuration & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Control currency locales, presentation theme, opening balance reserves, and data state.
        </p>
      </div>

      {/* Account & MongoDB Session Banner */}
      <Card
        title="Active User Session & Database State"
        subtitle="Current authenticated account and MongoDB persistence status."
        action={
          <Button variant="danger" size="sm" icon={<LogOut className="w-3.5 h-3.5" />} onClick={logout}>
            Sign Out
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center shrink-0">
              {user?.name?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Rohan Sharma'}
                </span>
                {user?.isDemo && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Demo Account
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'demo@moneta.app'}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                MongoDB Status
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isBackendConnected ? 'Connected & Synced' : 'Local Storage Mode'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                Demo Credentials
              </span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                demo@moneta.app / demo123456
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Currency & Formatting Section */}
      <Card
        title="Display Currency & Formatting"
        subtitle="Configure the standard monetary denomination for all ledgers and charts."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Display Notice:</strong> Switching currency adjusts locale formatting, numeric grouping, and currency symbol ({settings.currencySymbol}). It does not perform simulated foreign-exchange conversion rates.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(CURRENCY_CONFIGS).map(([code, config]) => {
              const isSelected = settings.currency === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleCurrencyChange(code)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {code}
                    </span>
                    <span className="font-mono text-base font-semibold text-indigo-600 dark:text-indigo-400">
                      {config.symbol}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {config.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Appearance Theme Section */}
      <Card
        title="Interface Theme"
        subtitle="Choose your preferred visual presentation scheme."
      >
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              settings.theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              settings.theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold">Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              settings.theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Laptop className="w-5 h-5 text-slate-500" />
            <span className="text-xs font-semibold">System Default</span>
          </button>
        </div>
      </Card>

      {/* Account Profile & Opening Balance */}
      <Card
        title="Profile & Capital Baseline"
        subtitle="Set user name and initial account balance baseline."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display User Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Opening Balance Baseline ({settings.currencySymbol})
              </label>
              <div className="relative">
                <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="any"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Starting bank balance before cumulative transaction sums.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm">
              Update Profile Baseline
            </Button>
          </div>
        </form>
      </Card>

      {/* Data Backup & Portability */}
      <Card
        title="Data Portability & Migration"
        subtitle="Export and import your complete financial history."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All Moneta data is persisted directly in your browser's private LocalStorage (currently storing{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {transactions.length} transactions
            </strong>{' '}
            and{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {budgets.length} budget targets
            </strong>
            ).
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportJSON}
            >
              Export JSON Backup
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
            >
              Export CSV Spreadsheet
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import Backup (.json)
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </Card>

      {/* Danger Zone: Reset to Demo Data */}
      <Card
        title="Danger Zone: Demo State"
        subtitle="Reset transactions and budgets back to realistic initial seed dataset."
        className="border-rose-200/80 dark:border-rose-950/60"
        headerClassName="bg-rose-50/40 dark:bg-rose-950/20"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-rose-900 dark:text-rose-300">
              Restore Sample Seed Dataset
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Re-populates 6 months of realistic Indian fintech transaction records and active October budgets.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => setIsResetConfirmOpen(true)}
          >
            Reset to Demo Data
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetToDemo}
        title="Reset All Data to Demo Sample?"
        message="This operation will overwrite your local transactions and budgets with the default fictional sample dataset. Any custom records you have added will be replaced unless you first exported a JSON backup."
        confirmLabel="Reset Everything"
      />
    </div>
  );
};
