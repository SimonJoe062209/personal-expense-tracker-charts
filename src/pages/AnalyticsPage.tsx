import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { PeriodSelector } from '../components/common/PeriodSelector';
import {
  aggregateExpensesByCategory,
  aggregateTransactionsTimeline,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateSavingsRate,
} from '../utils/calculations';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Percent,
  Award,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const {
    filteredTransactions,
    transactions,
    settings,
    timeRange,
    setTimeRange,
    reportingPeriodLabel,
  } = useApp();

  // Aggregated data
  const timelineData = useMemo(() => {
    return aggregateTransactionsTimeline(filteredTransactions, 'monthly');
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    return aggregateExpensesByCategory(filteredTransactions);
  }, [filteredTransactions]);

  // Savings rate trend calculation across all months
  const allMonthsTimeline = useMemo(() => {
    const raw = aggregateTransactionsTimeline(transactions, 'monthly');
    return raw.map((item) => ({
      ...item,
      savingsRate: calculateSavingsRate(item.income, item.expenses),
    }));
  }, [transactions]);

  // Top 5 largest individual expenses in filtered period
  const topExpenses = useMemo(() => {
    return [...filteredTransactions]
      .filter((t) => t.type === 'expense')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }, [filteredTransactions]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map.set(t.paymentMethod, (map.get(t.paymentMethod) || 0) + Number(t.amount || 0));
      });
    return Array.from(map.entries())
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const totalPeriodIncome = calculateTotalIncome(filteredTransactions);
  const totalPeriodExpenses = calculateTotalExpenses(filteredTransactions);
  const periodSavingsRate = calculateSavingsRate(totalPeriodIncome, totalPeriodExpenses);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Analytics & Deep-Dives
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multivariate visualization across cash flows, savings margins, and payment channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PeriodSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Analytical KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Capital Flow Ratio
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {(totalPeriodExpenses > 0
                ? (totalPeriodIncome / totalPeriodExpenses).toFixed(2)
                : '∞') + 'x'}
            </span>
            <span className="text-xs text-slate-500">income to expense ratio</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-indigo-500" /> Net Savings Margin
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {periodSavingsRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">
              {periodSavingsRate >= 20 ? 'Healthy target reached' : 'Below 20% target'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> Top Expense Category
          </span>
          <div className="mt-2 flex items-baseline gap-2 truncate">
            <span className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {categoryData[0]?.category || 'None'}
            </span>
            {categoryData[0] && (
              <span className="text-xs font-mono font-semibold text-slate-500">
                ({categoryData[0].percentage}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart 1: Income vs Expense Comparative Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Inflow vs Outflow Velocity"
          subtitle={`Comparison across ${reportingPeriodLabel}`}
        >
          {timelineData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No transactions for timeline rendering
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                      val >= 1000 ? `${settings.currencySymbol}${(val / 1000).toFixed(0)}k` : `${val}`
                    }
                  />
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val, settings.currency)]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Total Inflow" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Total Outflow" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Chart 2: Savings Rate Trend Over Time */}
        <Card
          title="Savings Rate Progression"
          subtitle="Longitudinal historical savings discipline (%)"
        >
          {allMonthsTimeline.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No history available
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={allMonthsTimeline}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
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
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val.toFixed(1)}%`, 'Savings Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="savingsRate"
                    name="Savings Rate (%)"
                    stroke="#6366F1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366F1' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Row 2: Category Breakdown Bar Chart & Top Largest Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Horizontal Bar Chart */}
        <Card
          title="Category Expenditure Volume"
          subtitle="Ranking of category outlays"
          className="col-span-1 lg:col-span-2"
        >
          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No expense entries
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(val) =>
                      val >= 1000 ? `${settings.currencySymbol}${(val / 1000).toFixed(0)}k` : `${val}`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    width={100}
                  />
                  <Tooltip
                    formatter={(val: number) => [
                      formatCurrency(val, settings.currency),
                      'Total Spent',
                    ]}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Highest Individual Expenses */}
        <Card
          title="Highest Individual Outlays"
          subtitle="Peak spending transactions in period"
          className="col-span-1"
        >
          {topExpenses.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No expenses recorded
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topExpenses.map((tx, idx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(tx.date, 'MMM dd')} • {tx.category}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-rose-500 shrink-0">
                    -{formatCurrency(tx.amount, settings.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: Payment Method Distribution */}
      <Card
        title="Payment Instrument Analytics"
        subtitle="Distribution of transaction volume across channels"
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {paymentMethodData.map((pm) => (
            <div
              key={pm.method}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
            >
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
                {pm.method}
              </span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatCurrency(pm.amount, settings.currency)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {totalPeriodExpenses > 0
                  ? `${((pm.amount / totalPeriodExpenses) * 100).toFixed(1)}% of expenses`
                  : '0%'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
