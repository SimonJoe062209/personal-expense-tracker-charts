import React from 'react';
import { useApp } from '../context/AppContext';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { ExpenseOverviewChart } from '../components/dashboard/ExpenseOverviewChart';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { BudgetOverviewCard } from '../components/dashboard/BudgetOverviewCard';
import { SpendingInsightsCard } from '../components/dashboard/SpendingInsightsCard';
import { RecentTransactionsList } from '../components/dashboard/RecentTransactionsList';
import { PeriodSelector } from '../components/common/PeriodSelector';
import { Button } from '../components/common/Button';
import { Wallet, ArrowDownRight, ArrowUpRight, Percent, Plus } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    settings,
    timeRange,
    setTimeRange,
    filteredTransactions,
    transactions,
    financialSummary,
    budgetStatuses,
    spendingInsights,
    reportingPeriodLabel,
    setIsAddTransactionOpen,
  } = useApp();

  // Determine greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = settings.userName.split(' ')[0] || 'User';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Hero controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {getGreeting()}, {firstName} 👋
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/50">
              {reportingPeriodLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here is your dynamic cash flow and capital health overview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <PeriodSelector value={timeRange} onChange={setTimeRange} />
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddTransactionOpen(true)}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* 4 Premium Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Net Capital Balance"
          amount={financialSummary.currentBalance}
          currencyCode={settings.currency}
          comparison={financialSummary.balanceComparison}
          comparisonLabel="period net delta"
          icon={<Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
        />
        <SummaryCard
          title="Period Income"
          amount={financialSummary.totalIncome}
          currencyCode={settings.currency}
          comparison={financialSummary.incomeComparison}
          comparisonLabel="vs prior period"
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <SummaryCard
          title="Total Outlays"
          amount={financialSummary.totalExpenses}
          currencyCode={settings.currency}
          comparison={financialSummary.expenseComparison}
          comparisonLabel="vs prior period"
          invertTrendColor={true}
          icon={<ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
        />
        <SummaryCard
          title="Savings Velocity"
          amount={financialSummary.savingsRate}
          isCurrency={false}
          comparison={financialSummary.savingsRateComparison}
          comparisonLabel="percentage points"
          icon={<Percent className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
        />
      </div>

      {/* Visualization Grid: Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExpenseOverviewChart transactions={filteredTransactions} />
        <CategoryDonutChart transactions={filteredTransactions} />
      </div>

      {/* Operations Grid: Recent Transactions & Budget / Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentTransactionsList transactions={transactions} />
        <div className="space-y-6 col-span-1">
          <BudgetOverviewCard budgetStatuses={budgetStatuses} />
          <SpendingInsightsCard insights={spendingInsights} />
        </div>
      </div>
    </div>
  );
};
