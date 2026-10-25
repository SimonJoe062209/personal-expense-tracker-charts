import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../common/Card';
import { aggregateExpensesByCategory, calculateTotalExpenses } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { Transaction } from '../../types';
import { useApp } from '../../context/AppContext';

interface CategoryDonutChartProps {
  transactions: Transaction[];
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ transactions }) => {
  const { settings } = useApp();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = aggregateExpensesByCategory(transactions);
  const totalExpense = calculateTotalExpenses(transactions);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const activeCategory = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;

  return (
    <Card
      title="Spending by Category"
      subtitle="Proportional outlay distribution"
      className="col-span-1"
    >
      {data.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-sm">
          No expenses recorded for this period
        </div>
      ) : (
        <div className="space-y-4">
          {/* Donut Chart with Centered Total */}
          <div className="relative h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="amount"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [
                    formatCurrency(val, settings.currency),
                    'Spent',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total / Active Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {activeCategory ? activeCategory.category : 'Total Outlays'}
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatCurrency(
                  activeCategory ? activeCategory.amount : totalExpense,
                  settings.currency
                )}
              </span>
              {activeCategory && (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {activeCategory.percentage}% of total
                </span>
              )}
            </div>
          </div>

          {/* Category Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-36 overflow-y-auto pr-1">
            {data.map((cat, idx) => (
              <div
                key={cat.category}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeIndex === idx
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {cat.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                  <span>{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
