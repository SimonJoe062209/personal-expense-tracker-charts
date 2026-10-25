import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CategoryPill } from '../components/common/CategoryPill';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatCurrency } from '../utils/formatters';
import { calculateBudgetStatuses } from '../utils/calculations';
import { Budget } from '../types';
import {
  Target,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';

export const BudgetsPage: React.FC = () => {
  const { budgets, transactions, settings, deleteBudget } = useApp();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Compute live budget statuses for selected month/year
  const activeStatuses = calculateBudgetStatuses(
    budgets,
    transactions,
    selectedMonth,
    selectedYear,
    now
  );

  // Separate Overall budget from category budgets
  const overallStatus = activeStatuses.find((b) => b.budget.category === 'Overall');
  const categoryStatuses = activeStatuses.filter((b) => b.budget.category !== 'Overall');

  const monthName = format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Management & Spending Caps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enforce financial discipline with dynamic limit thresholds and daily safe-to-spend targets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="2026-10">October 2026 (Active)</option>
              <option value="2026-9">September 2026</option>
              <option value="2026-8">August 2026</option>
              <option value="2026-7">July 2026</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
          >
            Create Budget
          </Button>
        </div>
      </div>

      {/* Overall Monthly Budget Highlight Card */}
      {overallStatus ? (
        <Card className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border-indigo-800/50 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Overall Monthly Spending Cap ({monthName})
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
                  {formatCurrency(overallStatus.spent, settings.currency)}
                </span>
                <span className="text-slate-400 font-mono text-sm">
                  / {formatCurrency(overallStatus.budget.limit, settings.currency)} limit
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                {overallStatus.remaining >= 0 ? (
                  <>
                    You have{' '}
                    <span className="font-semibold text-white">
                      {formatCurrency(overallStatus.remaining, settings.currency)}
                    </span>{' '}
                    remaining for the month (~
                    <span className="font-mono text-emerald-400 font-semibold">
                      {formatCurrency(overallStatus.dailyRemainingAllowance, settings.currency)}/day
                    </span>{' '}
                    safe spend).
                  </>
                ) : (
                  <>
                    Spending cap exceeded by{' '}
                    <span className="font-bold text-rose-400">
                      {formatCurrency(Math.abs(overallStatus.remaining), settings.currency)}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>

            {/* Right progress meter */}
            <div className="md:w-72 space-y-2 shrink-0">
              <div className="flex justify-between text-xs font-mono font-medium">
                <span className="text-indigo-200">Total Utilization</span>
                <span className="font-bold text-white">
                  {overallStatus.percentageConsumed}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden border border-indigo-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallStatus.status === 'exceeded'
                      ? 'bg-rose-500'
                      : overallStatus.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(overallStatus.percentageConsumed, 100)}%` }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditingBudget(overallStatus.budget);
                    setIsModalOpen(true);
                  }}
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
                >
                  <Edit2 className="w-3 h-3" /> Edit Cap
                </button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">
              No Overall Monthly Cap Set for {monthName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Establish a global monthly limit to automatically monitor all outflows.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
          >
            Set Overall Limit
          </Button>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Category Allocations ({categoryStatuses.length})
          </h3>
          <span className="text-xs text-slate-400">
            Calculated against live transactions
          </span>
        </div>

        {categoryStatuses.length === 0 ? (
          <Card className="py-12 text-center">
            <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No category budgets found for {monthName}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create category budgets to prevent overspending on Dining, Groceries, Shopping, and more.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              className="mt-4"
              onClick={() => {
                setEditingBudget(null);
                setIsModalOpen(true);
              }}
            >
              Add Category Budget
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStatuses.map((status) => {
              const isExceeded = status.status === 'exceeded';
              const isWarning = status.status === 'warning';

              let barColor = 'bg-emerald-500';
              let badgeVariant: 'emerald' | 'amber' | 'rose' = 'emerald';
              let badgeText = 'Within Budget';

              if (isExceeded) {
                barColor = 'bg-rose-500';
                badgeVariant = 'rose';
                badgeText = 'Exceeded';
              } else if (isWarning) {
                barColor = 'bg-amber-500';
                badgeVariant = 'amber';
                badgeText = 'Approaching Limit';
              }

              return (
                <div
                  key={status.budget.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Category & Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <CategoryPill category={status.budget.category} size="md" />
                      <Badge variant={badgeVariant} size="sm">
                        {badgeText}
                      </Badge>
                    </div>

                    {/* Spent / Limit Figures */}
                    <div className="my-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                          {formatCurrency(status.spent, settings.currency)}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          of {formatCurrency(status.budget.limit, settings.currency)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{
                            width: `${Math.min(status.percentageConsumed, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats & Remaining Allowance */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-100 dark:border-slate-800/60 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">
                          Remaining
                        </span>
                        <span
                          className={`font-semibold ${
                            status.remaining >= 0
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-rose-500'
                          }`}
                        >
                          {status.remaining >= 0
                            ? formatCurrency(status.remaining, settings.currency)
                            : `-${formatCurrency(Math.abs(status.remaining), settings.currency)}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase">
                          Safe / Day
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(status.dailyRemainingAllowance, settings.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setEditingBudget(status.budget);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit budget"
                      aria-label="Edit budget"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setBudgetToDelete(status.budget)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Delete budget"
                      aria-label="Delete budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        editingBudget={editingBudget}
      />

      {/* Delete Budget Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(budgetToDelete)}
        onClose={() => setBudgetToDelete(null)}
        onConfirm={() => {
          if (budgetToDelete) {
            deleteBudget(budgetToDelete.id);
            setBudgetToDelete(null);
          }
        }}
        title="Delete Spending Budget"
        message={`Are you sure you want to remove the budget cap for "${budgetToDelete?.category}"? Past transaction records will remain unaffected.`}
        confirmLabel="Remove Budget"
      />
    </div>
  );
};
