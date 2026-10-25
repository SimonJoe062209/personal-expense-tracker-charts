export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Transportation'
  | 'Housing & Rent'
  | 'Utilities & Bills'
  | 'Shopping & Lifestyle'
  | 'Entertainment'
  | 'Healthcare & Fitness'
  | 'Education & Learning'
  | 'Investments & Savings'
  | 'Personal Care'
  | 'Miscellaneous';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance & Consulting'
  | 'Investments & Dividends'
  | 'Rental Income'
  | 'Gifts & Grants'
  | 'Other Income';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO format: YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: ExpenseCategory | 'Overall';
  limit: number;
  month: number; // 1-12
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  currency: string;
  currencySymbol: string;
  currencyLocale: string;
  theme: 'light' | 'dark' | 'system';
  openingBalance: number;
  userName: string;
  monthlySavingsTargetPct: number;
}

export interface CategoryMeta {
  name: TransactionCategory;
  icon: string;
  color: string;
  bgColor: string;
  type: TransactionType;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  changeAmount: number;
  changePercentage: number | null; // null if previous was 0
  trend: 'up' | 'down' | 'neutral';
}

export interface FinancialSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  currentBalance: number;
  savingsRate: number; // 0 - 100
  incomeComparison: PeriodComparison;
  expenseComparison: PeriodComparison;
  balanceComparison: PeriodComparison;
  savingsRateComparison: PeriodComparison;
}

export interface CategorySpending {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentageConsumed: number;
  status: 'safe' | 'warning' | 'exceeded';
  dailyRemainingAllowance: number;
}

export interface SpendingInsight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  description: string;
  metric?: string;
}

export type TimeRange = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'all';
