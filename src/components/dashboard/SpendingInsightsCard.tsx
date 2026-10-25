import React from 'react';
import { Card } from '../common/Card';
import { SpendingInsight } from '../../types';
import { Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface SpendingInsightsCardProps {
  insights: SpendingInsight[];
}

export const SpendingInsightsCard: React.FC<SpendingInsightsCardProps> = ({ insights }) => {
  const getIcon = (type: SpendingInsight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <Card
      title="Deterministic Financial Insights"
      subtitle="Algorithmic signals evaluated directly from your data"
      action={
        <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
          Rule-Based
        </span>
      }
      className="col-span-1"
    >
      {insights.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
          <Sparkles className="w-6 h-6 mb-2 text-slate-300 dark:text-slate-600" />
          <p>Add more transactions to generate deterministic analytical signals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.slice(0, 3).map((insight) => (
            <div
              key={insight.id}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/80"
            >
              {getIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {insight.title}
                  </h4>
                  {insight.metric && (
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
