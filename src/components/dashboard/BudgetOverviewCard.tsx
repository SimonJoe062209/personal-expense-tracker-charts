import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { BudgetStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight, AlertCircle } from 'lucide-react';

interface BudgetOverviewCardProps {
  budgetStatuses: BudgetStatus[];
}

export const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({ budgetStatuses }) => {
  const { settings } = useApp();

  // Sort by percentageConsumed descending so high-risk budgets are on top
  const sorted = [...budgetStatuses].sort((a, b) => b.percentageConsumed - a.percentageConsumed);
  const displayBudgets = sorted.slice(0, 4);

  return (
    <Card
      title="Budget Guardrails"
      subtitle="Monthly category utilization & caps"
      action={
        <Link
          to="/budgets"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
        >
          Manage <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
      className="col-span-1"
    >
      {displayBudgets.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
          <p>No active budgets configured for this month.</p>
          <Link
            to="/budgets"
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Create your first budget target &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayBudgets.map((status) => {
            const isExceeded = status.status === 'exceeded';
            const isWarning = status.status === 'warning';

            let barColor = 'bg-emerald-500';
            if (isExceeded) barColor = 'bg-rose-500';
            else if (isWarning) barColor = 'bg-amber-500';

            return (
              <div key={status.budget.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <span>{status.budget.category}</span>
                    {isExceeded && (
                      <Badge variant="rose" size="sm">
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Exceeded
                      </Badge>
                    )}
                    {isWarning && (
                      <Badge variant="amber" size="sm">
                        Near Cap
                      </Badge>
                    )}
                  </div>
                  <div className="font-mono text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(status.spent, settings.currency)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {' '}/ {formatCurrency(status.budget.limit, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(status.percentageConsumed, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  <span>{status.percentageConsumed.toFixed(0)}% consumed</span>
                  <span>
                    {status.remaining >= 0
                      ? `${formatCurrency(status.remaining, settings.currency)} left`
                      : `${formatCurrency(Math.abs(status.remaining), settings.currency)} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
