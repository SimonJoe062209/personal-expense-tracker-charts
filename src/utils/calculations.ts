import {
  Transaction,
  Budget,
  FinancialSummary,
  PeriodComparison,
  CategorySpending,
  BudgetStatus,
  SpendingInsight,
  TimeRange,
} from '../types';
import { getCategoryMeta } from './categories';
import {
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  startOfYear,
  endOfYear,
  format,
  getDaysInMonth,
  getDate,
} from 'date-fns';

/**
 * Filter transactions by a designated TimeRange or custom interval.
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  timeRange: TimeRange,
  referenceDate = new Date()
): { currentPeriod: Transaction[]; previousPeriod: Transaction[]; label: string } {
  let curStart: Date;
  let curEnd: Date;
  let prevStart: Date;
  let prevEnd: Date;
  let label = 'This Month';

  switch (timeRange) {
    case 'this_month':
      curStart = startOfMonth(referenceDate);
      curEnd = endOfMonth(referenceDate);
      prevStart = startOfMonth(subMonths(referenceDate, 1));
      prevEnd = endOfMonth(subMonths(referenceDate, 1));
      label = format(referenceDate, 'MMMM yyyy');
      break;

    case 'last_month':
      const lastMonth = subMonths(referenceDate, 1);
      curStart = startOfMonth(lastMonth);
      curEnd = endOfMonth(lastMonth);
      prevStart = startOfMonth(subMonths(referenceDate, 2));
      prevEnd = endOfMonth(subMonths(referenceDate, 2));
      label = format(lastMonth, 'MMMM yyyy');
      break;

    case 'last_3_months':
      curEnd = endOfMonth(referenceDate);
      curStart = startOfMonth(subMonths(referenceDate, 2));
      prevEnd = subDays(curStart, 1);
      prevStart = startOfMonth(subMonths(curStart, 3));
      label = 'Last 3 Months';
      break;

    case 'last_6_months':
      curEnd = endOfMonth(referenceDate);
      curStart = startOfMonth(subMonths(referenceDate, 5));
      prevEnd = subDays(curStart, 1);
      prevStart = startOfMonth(subMonths(curStart, 6));
      label = 'Last 6 Months';
      break;

    case 'this_year':
      curStart = startOfYear(referenceDate);
      curEnd = endOfYear(referenceDate);
      const prevYearDate = subMonths(referenceDate, 12);
      prevStart = startOfYear(prevYearDate);
      prevEnd = endOfYear(prevYearDate);
      label = format(referenceDate, 'yyyy');
      break;

    case 'all':
    default:
      return {
        currentPeriod: transactions,
        previousPeriod: [],
        label: 'All Time',
      };
  }

  const currentPeriod = transactions.filter((t) => {
    try {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start: curStart, end: curEnd });
    } catch {
      return false;
    }
  });

  const previousPeriod = transactions.filter((t) => {
    try {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start: prevStart, end: prevEnd });
    } catch {
      return false;
    }
  });

  return { currentPeriod, previousPeriod, label };
}

/**
 * Calculate total income from a list of transactions.
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

/**
 * Calculate total expenses from a list of transactions.
 */
export function calculateTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

/**
 * Calculate percentage change safely.
 * Returns null if previous value is 0 or invalid (prevents fabrication / division by zero).
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): { changeAmount: number; changePercentage: number | null; trend: 'up' | 'down' | 'neutral' } {
  const changeAmount = current - previous;
  if (previous === 0) {
    return {
      changeAmount,
      changePercentage: null,
      trend: changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'neutral',
    };
  }

  const changePercentage = (changeAmount / Math.abs(previous)) * 100;
  const roundedPct = Math.round(changePercentage * 10) / 10;
  const trend = roundedPct > 0 ? 'up' : roundedPct < 0 ? 'down' : 'neutral';

  return {
    changeAmount,
    changePercentage: roundedPct,
    trend,
  };
}

/**
 * Calculate savings rate: (Income - Expenses) / Income * 100
 * Handles cases where income is 0 or negative.
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const netSavings = income - expenses;
  if (netSavings <= 0) return 0;
  const rate = (netSavings / income) * 100;
  return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
}

/**
 * Generates comprehensive financial summary comparing current period to previous.
 */
export function calculateFinancialSummary(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[] = [],
  openingBalance = 0
): FinancialSummary {
  const currentIncome = calculateTotalIncome(currentTransactions);
  const currentExpenses = calculateTotalExpenses(currentTransactions);
  const currentNetSavings = currentIncome - currentExpenses;
  const currentBalance = openingBalance + currentNetSavings;
  const currentSavingsRate = calculateSavingsRate(currentIncome, currentExpenses);

  const prevIncome = calculateTotalIncome(previousTransactions);
  const prevExpenses = calculateTotalExpenses(previousTransactions);
  const prevNetSavings = prevIncome - prevExpenses;
  const prevBalance = openingBalance + prevNetSavings;
  const prevSavingsRate = calculateSavingsRate(prevIncome, prevExpenses);

  const incomeComparison: PeriodComparison = {
    current: currentIncome,
    previous: prevIncome,
    ...calculatePercentageChange(currentIncome, prevIncome),
  };

  const expenseComparison: PeriodComparison = {
    current: currentExpenses,
    previous: prevExpenses,
    ...calculatePercentageChange(currentExpenses, prevExpenses),
  };

  const balanceComparison: PeriodComparison = {
    current: currentBalance,
    previous: prevBalance,
    ...calculatePercentageChange(currentBalance, prevBalance),
  };

  // For savings rate, difference is in percentage points
  const savingsRateDiff = currentSavingsRate - prevSavingsRate;
  const savingsRateComparison: PeriodComparison = {
    current: currentSavingsRate,
    previous: prevSavingsRate,
    changeAmount: savingsRateDiff,
    changePercentage: previousTransactions.length > 0 ? Math.round(savingsRateDiff * 10) / 10 : null,
    trend: savingsRateDiff > 0 ? 'up' : savingsRateDiff < 0 ? 'down' : 'neutral',
  };

  return {
    openingBalance,
    totalIncome: currentIncome,
    totalExpenses: currentExpenses,
    netSavings: currentNetSavings,
    currentBalance,
    savingsRate: currentSavingsRate,
    incomeComparison,
    expenseComparison,
    balanceComparison,
    savingsRateComparison,
  };
}

/**
 * Group expenses by category, sorted descending by total amount.
 */
export function aggregateExpensesByCategory(
  transactions: Transaction[]
): CategorySpending[] {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const total = calculateTotalExpenses(expenseTransactions);

  const categoryMap = new Map<string, { amount: number; count: number }>();

  expenseTransactions.forEach((t) => {
    const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
    categoryMap.set(t.category, {
      amount: existing.amount + Number(t.amount || 0),
      count: existing.count + 1,
    });
  });

  const result: CategorySpending[] = [];

  categoryMap.forEach((val, category) => {
    const meta = getCategoryMeta(category);
    const percentage = total > 0 ? Math.round((val.amount / total) * 1000) / 10 : 0;
    result.push({
      category: category as any,
      amount: val.amount,
      percentage,
      count: val.count,
      color: meta.color,
    });
  });

  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Aggregate daily or weekly income and expenses for charts.
 */
export function aggregateTransactionsTimeline(
  transactions: Transaction[],
  timeframe: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Array<{ date: string; displayDate: string; income: number; expenses: number; net: number }> {
  if (transactions.length === 0) return [];

  const groups = new Map<string, { income: number; expenses: number; sortKey: string }>();

  transactions.forEach((t) => {
    let key = '';
    let sortKey = '';

    try {
      const date = parseISO(t.date);
      if (timeframe === 'daily') {
        key = format(date, 'MMM dd');
        sortKey = format(date, 'yyyy-MM-dd');
      } else if (timeframe === 'weekly') {
        key = `W${format(date, 'w, MMM')}`;
        sortKey = format(date, 'yyyy-ww');
      } else {
        key = format(date, 'MMM yyyy');
        sortKey = format(date, 'yyyy-MM');
      }
    } catch {
      key = t.date;
      sortKey = t.date;
    }

    const cur = groups.get(key) || { income: 0, expenses: 0, sortKey };
    if (t.type === 'income') {
      cur.income += Number(t.amount || 0);
    } else {
      cur.expenses += Number(t.amount || 0);
    }
    groups.set(key, cur);
  });

  const array = Array.from(groups.entries()).map(([displayDate, val]) => ({
    date: val.sortKey,
    displayDate,
    income: val.income,
    expenses: val.expenses,
    net: val.income - val.expenses,
  }));

  return array.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate budget utilization and status for all active budgets.
 */
export function calculateBudgetStatuses(
  budgets: Budget[],
  transactions: Transaction[],
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  referenceDate = new Date()
): BudgetStatus[] {
  // Filter transactions for specified month and year
  const monthlyExpenses = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    try {
      const d = parseISO(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    } catch {
      return false;
    }
  });

  const totalDays = getDaysInMonth(referenceDate);
  const currentDay = getDate(referenceDate);
  const remainingDays = Math.max(1, totalDays - currentDay + 1);

  return budgets
    .filter((b) => b.month === month && b.year === year)
    .map((budget) => {
      let spent = 0;
      if (budget.category === 'Overall') {
        spent = calculateTotalExpenses(monthlyExpenses);
      } else {
        spent = monthlyExpenses
          .filter((t) => t.category === budget.category)
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      }

      const remaining = budget.limit - spent;
      const percentageConsumed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      
      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentageConsumed >= 100) {
        status = 'exceeded';
      } else if (percentageConsumed >= 80) {
        status = 'warning';
      }

      const dailyRemainingAllowance = remaining > 0 ? Math.round(remaining / remainingDays) : 0;

      return {
        budget,
        spent,
        remaining,
        percentageConsumed: Math.round(percentageConsumed * 10) / 10,
        status,
        dailyRemainingAllowance,
      };
    });
}

/**
 * Generates deterministic insights from actual transaction data.
 * No fabricated AI text or hallucinations.
 */
export function generateSpendingInsights(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[] = [],
  budgetStatuses: BudgetStatus[] = []
): SpendingInsight[] {
  const insights: SpendingInsight[] = [];

  // Insight 1: Top spending category
  const categories = aggregateExpensesByCategory(currentTransactions);
  if (categories.length > 0) {
    const top = categories[0];
    insights.push({
      id: 'top-spending-cat',
      type: 'info',
      title: 'Primary Spending Driver',
      description: `${top.category} is your highest expense area, accounting for ${top.percentage}% of total outlays.`,
      metric: `${top.percentage}%`,
    });
  }

  // Insight 2: Month over Month expense trend
  const curExpenses = calculateTotalExpenses(currentTransactions);
  const prevExpenses = calculateTotalExpenses(previousTransactions);
  if (previousTransactions.length > 0 && prevExpenses > 0) {
    const change = calculatePercentageChange(curExpenses, prevExpenses);
    if (change.changePercentage !== null) {
      if (change.changePercentage < 0) {
        insights.push({
          id: 'expense-drop',
          type: 'success',
          title: 'Decreased Outlays',
          description: `Total expenses are down by ${Math.abs(change.changePercentage)}% compared to the prior period.`,
          metric: `${change.changePercentage}%`,
        });
      } else if (change.changePercentage > 10) {
        insights.push({
          id: 'expense-rise',
          type: 'warning',
          title: 'Increased Outlays',
          description: `Spending rose ${change.changePercentage}% compared to the prior period. Review discretionary categories.`,
          metric: `+${change.changePercentage}%`,
        });
      }
    }
  }

  // Insight 3: Budget alert
  const exceededBudgets = budgetStatuses.filter((b) => b.status === 'exceeded');
  const warningBudgets = budgetStatuses.filter((b) => b.status === 'warning');

  if (exceededBudgets.length > 0) {
    const first = exceededBudgets[0];
    insights.push({
      id: 'budget-exceeded',
      type: 'alert',
      title: 'Budget Exceeded',
      description: `${first.budget.category} budget exceeded by ${Math.abs(first.remaining).toLocaleString('en-IN')}.`,
      metric: `${first.percentageConsumed}%`,
    });
  } else if (warningBudgets.length > 0) {
    const first = warningBudgets[0];
    insights.push({
      id: 'budget-warning',
      type: 'warning',
      title: 'Budget Alert (≥80%)',
      description: `${first.budget.category} has reached ${first.percentageConsumed}% of its allocation.`,
      metric: `${first.percentageConsumed}%`,
    });
  }

  // Insight 4: Savings rate benchmark
  const income = calculateTotalIncome(currentTransactions);
  const savingsRate = calculateSavingsRate(income, curExpenses);
  if (income > 0) {
    if (savingsRate >= 30) {
      insights.push({
        id: 'savings-stellar',
        type: 'success',
        title: 'Strong Savings Discipline',
        description: `Current savings rate of ${savingsRate}% exceeds healthy personal finance standards (20%+).`,
        metric: `${savingsRate}%`,
      });
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        id: 'savings-low',
        type: 'warning',
        title: 'Savings Opportunity',
        description: `Current savings rate is ${savingsRate}%. Target standard 50/30/20 rule to boost emergency reserves.`,
        metric: `${savingsRate}%`,
      });
    }
  }

  return insights;
}
