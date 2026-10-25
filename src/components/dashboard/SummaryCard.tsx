import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { PeriodComparison } from '../../types';

interface SummaryCardProps {
  title: string;
  amount: number;
  isCurrency?: boolean;
  currencyCode?: string;
  comparison?: PeriodComparison;
  comparisonLabel?: string;
  icon: React.ReactNode;
  invertTrendColor?: boolean; // For expenses, an increase is bad (red) and decrease is good (green)
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  isCurrency = true,
  currencyCode = 'INR',
  comparison,
  comparisonLabel = 'vs previous period',
  icon,
  invertTrendColor = false,
}) => {
  const formattedValue = isCurrency
    ? formatCurrency(amount, currencyCode)
    : `${amount.toFixed(1)}%`;

  let trendColor = 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
  let TrendIcon = Minus;

  if (comparison && comparison.changePercentage !== null) {
    const isUp = comparison.trend === 'up';
    const isDown = comparison.trend === 'down';

    if (isUp) {
      TrendIcon = TrendingUp;
      trendColor = invertTrendColor
        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400'
        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400';
    } else if (isDown) {
      TrendIcon = TrendingDown;
      trendColor = invertTrendColor
        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
        : 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400';
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60">
          {icon}
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
          {formattedValue}
        </span>

        <div className="flex items-center gap-2 mt-3 text-xs">
          {comparison && comparison.changePercentage !== null ? (
            <>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-[11px] ${trendColor}`}
              >
                <TrendIcon className="w-3 h-3" />
                {formatPercentage(comparison.changePercentage)}
              </span>
              <span className="text-slate-400 dark:text-slate-500 truncate">
                {comparisonLabel}
              </span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
              No prior period baseline
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
