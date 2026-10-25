import { CategoryMeta, ExpenseCategory, IncomeCategory } from '../types';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Housing & Rent',
  'Utilities & Bills',
  'Shopping & Lifestyle',
  'Entertainment',
  'Healthcare & Fitness',
  'Education & Learning',
  'Investments & Savings',
  'Personal Care',
  'Miscellaneous',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Freelance & Consulting',
  'Investments & Dividends',
  'Rental Income',
  'Gifts & Grants',
  'Other Income',
];

export const CATEGORY_METADATA: Record<string, { icon: string; color: string; bgColor: string; darkBgColor: string }> = {
  // Expenses
  'Food & Dining': {
    icon: 'Utensils',
    color: '#F97316', // Orange
    bgColor: '#FFEDD5',
    darkBgColor: 'rgba(249, 115, 22, 0.15)',
  },
  'Groceries': {
    icon: 'ShoppingBag',
    color: '#10B981', // Emerald
    bgColor: '#D1FAE5',
    darkBgColor: 'rgba(16, 185, 129, 0.15)',
  },
  'Transportation': {
    icon: 'Car',
    color: '#06B6D4', // Cyan
    bgColor: '#CFFAFE',
    darkBgColor: 'rgba(6, 182, 212, 0.15)',
  },
  'Housing & Rent': {
    icon: 'Home',
    color: '#6366F1', // Indigo
    bgColor: '#E0E7FF',
    darkBgColor: 'rgba(99, 102, 241, 0.15)',
  },
  'Utilities & Bills': {
    icon: 'Zap',
    color: '#EAB308', // Amber
    bgColor: '#FEF9C3',
    darkBgColor: 'rgba(234, 179, 8, 0.15)',
  },
  'Shopping & Lifestyle': {
    icon: 'Sparkles',
    color: '#EC4899', // Pink
    bgColor: '#FCE7F3',
    darkBgColor: 'rgba(236, 72, 153, 0.15)',
  },
  'Entertainment': {
    icon: 'Film',
    color: '#8B5CF6', // Purple
    bgColor: '#EDE9FE',
    darkBgColor: 'rgba(139, 92, 246, 0.15)',
  },
  'Healthcare & Fitness': {
    icon: 'HeartPulse',
    color: '#EF4444', // Red
    bgColor: '#FEE2E2',
    darkBgColor: 'rgba(239, 68, 68, 0.15)',
  },
  'Education & Learning': {
    icon: 'GraduationCap',
    color: '#3B82F6', // Blue
    bgColor: '#DBEAFE',
    darkBgColor: 'rgba(59, 130, 246, 0.15)',
  },
  'Investments & Savings': {
    icon: 'TrendingUp',
    color: '#14B8A6', // Teal
    bgColor: '#CCFBF1',
    darkBgColor: 'rgba(20, 184, 166, 0.15)',
  },
  'Personal Care': {
    icon: 'Smile',
    color: '#F43F5E', // Rose
    bgColor: '#FFE4E6',
    darkBgColor: 'rgba(244, 63, 94, 0.15)',
  },
  'Miscellaneous': {
    icon: 'MoreHorizontal',
    color: '#64748B', // Slate
    bgColor: '#F1F5F9',
    darkBgColor: 'rgba(100, 116, 139, 0.15)',
  },
  // Income
  'Salary': {
    icon: 'Briefcase',
    color: '#10B981', // Emerald
    bgColor: '#D1FAE5',
    darkBgColor: 'rgba(16, 185, 129, 0.15)',
  },
  'Freelance & Consulting': {
    icon: 'Laptop',
    color: '#6366F1', // Indigo
    bgColor: '#E0E7FF',
    darkBgColor: 'rgba(99, 102, 241, 0.15)',
  },
  'Investments & Dividends': {
    icon: 'Coins',
    color: '#0EA5E9', // Sky
    bgColor: '#E0F2FE',
    darkBgColor: 'rgba(14, 165, 233, 0.15)',
  },
  'Rental Income': {
    icon: 'Building',
    color: '#8B5CF6', // Purple
    bgColor: '#EDE9FE',
    darkBgColor: 'rgba(139, 92, 246, 0.15)',
  },
  'Gifts & Grants': {
    icon: 'Gift',
    color: '#F59E0B', // Amber
    bgColor: '#FEF3C7',
    darkBgColor: 'rgba(245, 158, 11, 0.15)',
  },
  'Other Income': {
    icon: 'ArrowDownLeft',
    color: '#22C55E', // Green
    bgColor: '#DCFCE7',
    darkBgColor: 'rgba(34, 197, 94, 0.15)',
  },
};

export const PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Cash',
] as const;

export function getCategoryMeta(categoryName: string): CategoryMeta {
  const meta = CATEGORY_METADATA[categoryName] || {
    icon: 'Tag',
    color: '#64748B',
    bgColor: '#F1F5F9',
    darkBgColor: 'rgba(100, 116, 139, 0.15)',
  };
  const isIncome = INCOME_CATEGORIES.includes(categoryName as IncomeCategory);

  return {
    name: categoryName as any,
    icon: meta.icon,
    color: meta.color,
    bgColor: meta.bgColor,
    type: isIncome ? 'income' : 'expense',
  };
}
