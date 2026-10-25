import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { CategoryPill } from '../common/CategoryPill';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Transaction } from '../../types';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight, Edit2, Trash2, ArrowDownLeft, ArrowUpRight as IncomeIcon } from 'lucide-react';

interface RecentTransactionsListProps {
  transactions: Transaction[];
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({ transactions }) => {
  const { settings, deleteTransaction, setEditingTransaction } = useApp();
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Take top 6 recent transactions sorted by date descending
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <>
      <Card
        title="Recent Transactions"
        subtitle="Latest ledger activities"
        action={
          <Link
            to="/transactions"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
          >
            Full Ledger ({transactions.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
        className="col-span-1 lg:col-span-2"
      >
        {recent.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm">
            No transactions found for this period
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((tx) => {
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-lg"
                >
                  {/* Left: icon & details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <IncomeIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <span>{formatDate(tx.date, 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <span className="truncate">{tx.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Category, amount, actions */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="hidden sm:block">
                      <CategoryPill category={tx.category} size="sm" />
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs sm:text-sm font-mono font-bold tabular-nums ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, settings.currency)}
                      </span>
                    </div>

                    {/* Quick action buttons (hover or mobile) */}
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingTransaction(tx)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Edit transaction"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTransactionToDelete(tx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Delete transaction"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
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
        message={`Are you sure you want to permanently remove "${transactionToDelete?.description}"? Your account balance and period charts will update immediately.`}
        confirmLabel="Confirm Delete"
      />
    </>
  );
};
