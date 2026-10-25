import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '../common/Card';
import { aggregateTransactionsTimeline } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { Transaction } from '../../types';
import { useApp } from '../../context/AppContext';

interface ExpenseOverviewChartProps {
  transactions: Transaction[];
}

export const ExpenseOverviewChart: React.FC<ExpenseOverviewChartProps> = ({ transactions }) => {
  const { settings } = useApp();
  const [timeframe, setTimeframe] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

  const chartData = aggregateTransactionsTimeline(transactions, timeframe);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeVal = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expenseVal = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0;
      const netVal = incomeVal - expenseVal;

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
            {label}
          </p>
          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Income:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(incomeVal, settings.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-rose-500 font-sans">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Expenses:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(expenseVal, settings.currency)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 font-sans font-medium">
              <span className="text-slate-500">Net Flow:</span>
              <span
                className={`font-mono font-semibold ${
                  netVal >= 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {netVal >= 0 ? '+' : ''}
                {formatCurrency(netVal, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Cash Flow Velocity"
      subtitle="Income vs. expenses over time"
      action={
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              timeframe === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              timeframe === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('daily')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              timeframe === 'daily'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily
          </button>
        </div>
      }
      className="col-span-1 lg:col-span-2"
    >
      {chartData.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-sm">
          No transaction history for the selected timeframe
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickFormatter={(val) =>
                  val >= 1000 ? `${settings.currencySymbol}${(val / 1000).toFixed(0)}k` : `${settings.currencySymbol}${val}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
