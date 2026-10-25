import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CategoryPill } from '../components/common/CategoryPill';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../utils/categories';
import { Transaction } from '../types';
import { storageService } from '../utils/storage';
import {
  Search,
  Download,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    settings,
    deleteTransaction,
    setEditingTransaction,
    setIsAddTransactionOpen,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirmation state
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesCategory = tx.category.toLowerCase().includes(query);
        const matchesNotes = (tx.notes || '').toLowerCase().includes(query);
        if (!matchesDesc && !matchesCategory && !matchesNotes) return false;
      }

      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // Payment method
      if (paymentMethodFilter !== 'all' && tx.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, paymentMethodFilter]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        comparison = Number(b.amount) - Number(a.amount);
      }
      return sortDirection === 'desc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(start, start + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  // Filtered aggregates
  const filteredMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += Number(t.amount || 0);
      else expense += Number(t.amount || 0);
    });
    return {
      count: filteredTransactions.length,
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setSortField('date');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || paymentMethodFilter !== 'all';

  const exportCSV = () => {
    const csvData = storageService.exportTransactionsCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `moneta_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allAvailableCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ledger & Transactions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit, filter, and export comprehensive financial records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={exportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddTransactionOpen(true)}
          >
            New Entry
          </Button>
        </div>
      </div>

      {/* Filter metrics mini banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Records Matching
          </span>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {filteredMetrics.count}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Filtered Inflow
          </span>
          <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            +{formatCurrency(filteredMetrics.income, settings.currency)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
            Filtered Outflow
          </span>
          <p className="text-lg font-bold font-mono text-rose-500 mt-0.5">
            -{formatCurrency(filteredMetrics.expense, settings.currency)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Filtered Net
          </span>
          <p
            className={`text-lg font-bold font-mono mt-0.5 ${
              filteredMetrics.net >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-500'
            }`}
          >
            {filteredMetrics.net >= 0 ? '+' : ''}
            {formatCurrency(filteredMetrics.net, settings.currency)}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4" bodyClassName="p-0">
        <div className="p-4 space-y-3.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by description, merchant, or notes..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold shrink-0">
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  typeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setTypeFilter('expense');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  typeFilter === 'expense'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => {
                  setTypeFilter('income');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  typeFilter === 'income'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Secondary filter row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Category dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {allAvailableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment method */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Method:</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Methods</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-slate-400 font-medium">Sort:</span>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-') as ['date' | 'amount', 'desc' | 'asc'];
                  setSortField(field);
                  setSortDirection(dir);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="date-desc">Date (Newest first)</option>
                <option value="date-asc">Date (Oldest first)</option>
                <option value="amount-desc">Amount (Highest first)</option>
                <option value="amount-asc">Amount (Lowest first)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="overflow-x-auto border-t border-slate-200/80 dark:border-slate-800">
          {paginatedTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No matching transactions found
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Try modifying your search criteria or resetting filters to reveal more ledger items.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="mt-4"
                >
                  Reset all filters
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Details & Notes</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Description & Notes */}
                      <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                              {tx.description}
                            </span>
                            {tx.notes && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate block font-normal">
                                {tx.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <CategoryPill category={tx.category} size="sm" />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {formatDate(tx.date, 'MMM dd, yyyy')}
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
                        {tx.paymentMethod}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(tx.amount, settings.currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit entry"
                            aria-label="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTransactionToDelete(tx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete entry"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * itemsPerPage, sortedTransactions.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {sortedTransactions.length}
              </span>{' '}
              entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="font-mono font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(transactionToDelete)}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={() => {
          if (transactionToDelete) {
            deleteTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
          }
        }}
        title="Delete Transaction"
        message={`Are you sure you want to permanently delete "${transactionToDelete?.description}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
};
