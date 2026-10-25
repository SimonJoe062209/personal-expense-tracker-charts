import React from 'react';
import { TimeRange } from '../../types';
import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const PERIOD_OPTIONS: { id: TimeRange; label: string }[] = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3_months', label: 'Last 3M' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-400 ${className}`}
    >
      <div className="hidden sm:flex items-center px-2 text-slate-400 dark:text-slate-500">
        <Calendar className="w-3.5 h-3.5 mr-1" />
        <span>Range</span>
      </div>
      <div className="flex items-center gap-0.5">
        {PERIOD_OPTIONS.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`px-2.5 py-1 rounded-md transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
