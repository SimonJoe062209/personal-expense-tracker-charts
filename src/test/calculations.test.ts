import { describe, it, expect } from 'vitest';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateSavingsRate,
  calculatePercentageChange,
  aggregateExpensesByCategory,
  calculateBudgetStatuses,
  filterTransactionsByDate,
} from '../utils/calculations';
import { Transaction, Budget } from '../types';

describe('Financial Calculation Utilities', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      description: 'Consulting Payout',
      amount: 100000,
      type: 'income',
      category: 'Salary',
      date: '2026-10-01',
      paymentMethod: 'Net Banking',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'tx-2',
      description: 'Dividends',
      amount: 10000,
      type: 'income',
      category: 'Investments & Dividends',
      date: '2026-10-15',
      paymentMethod: 'Net Banking',
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
    },
    {
      id: 'tx-3',
      description: 'Apartment Rent',
      amount: 30000,
      type: 'expense',
      category: 'Housing & Rent',
      date: '2026-10-02',
      paymentMethod: 'UPI',
      createdAt: '2026-10-02T00:00:00.000Z',
      updatedAt: '2026-10-02T00:00:00.000Z',
    },
    {
      id: 'tx-4',
      description: 'Supermarket Groceries',
      amount: 10000,
      type: 'expense',
      category: 'Groceries',
      date: '2026-10-05',
      paymentMethod: 'Credit Card',
      createdAt: '2026-10-05T00:00:00.000Z',
      updatedAt: '2026-10-05T00:00:00.000Z',
    },
    {
      id: 'tx-5',
      description: 'Bistro Dinner',
      amount: 4000,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-10-10',
      paymentMethod: 'UPI',
      createdAt: '2026-10-10T00:00:00.000Z',
      updatedAt: '2026-10-10T00:00:00.000Z',
    },
  ];

  it('calculates total income accurately', () => {
    const totalIncome = calculateTotalIncome(sampleTransactions);
    expect(totalIncome).toBe(110000);
  });

  it('calculates total expenses accurately', () => {
    const totalExpenses = calculateTotalExpenses(sampleTransactions);
    expect(totalExpenses).toBe(44000);
  });

  it('calculates savings rate correctly: (income - expenses) / income * 100', () => {
    // Income = 110000, Expenses = 44000, Net = 66000
    // Rate = (66000 / 110000) * 100 = 60%
    const rate = calculateSavingsRate(110000, 44000);
    expect(rate).toBe(60);
  });

  it('gracefully handles division by zero and negative income in savings rate', () => {
    expect(calculateSavingsRate(0, 5000)).toBe(0);
    expect(calculateSavingsRate(-1000, 5000)).toBe(0);
    expect(calculateSavingsRate(1000, 2000)).toBe(0); // expenses exceed income
  });

  it('calculates percentage changes safely without fabricating when baseline is 0', () => {
    const zeroPrevious = calculatePercentageChange(5000, 0);
    expect(zeroPrevious.changePercentage).toBeNull();
    expect(zeroPrevious.changeAmount).toBe(5000);
    expect(zeroPrevious.trend).toBe('up');

    const normalIncrease = calculatePercentageChange(150, 100);
    expect(normalIncrease.changePercentage).toBe(50);
    expect(normalIncrease.trend).toBe('up');

    const normalDecrease = calculatePercentageChange(80, 100);
    expect(normalDecrease.changePercentage).toBe(-20);
    expect(normalDecrease.trend).toBe('down');
  });

  it('aggregates expenses by category descending by total spend', () => {
    const aggregated = aggregateExpensesByCategory(sampleTransactions);
    expect(aggregated.length).toBe(3);
    expect(aggregated[0].category).toBe('Housing & Rent');
    expect(aggregated[0].amount).toBe(30000);
    expect(aggregated[1].category).toBe('Groceries');
    expect(aggregated[1].amount).toBe(10000);
    expect(aggregated[2].category).toBe('Food & Dining');
    expect(aggregated[2].amount).toBe(4000);
  });

  it('accurately evaluates budget utilization, remaining limits, and status states', () => {
    const sampleBudgets: Budget[] = [
      {
        id: 'b-1',
        category: 'Food & Dining',
        limit: 5000,
        month: 10,
        year: 2026,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'b-2',
        category: 'Groceries',
        limit: 8000,
        month: 10,
        year: 2026,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'b-3',
        category: 'Housing & Rent',
        limit: 40000,
        month: 10,
        year: 2026,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ];

    const refDate = new Date(2026, 9, 25); // Oct 25, 2026
    const statuses = calculateBudgetStatuses(sampleBudgets, sampleTransactions, 10, 2026, refDate);

    // Food & Dining: spent 4000 out of 5000 = 80% => 'warning'
    const foodStatus = statuses.find((s) => s.budget.category === 'Food & Dining')!;
    expect(foodStatus.spent).toBe(4000);
    expect(foodStatus.remaining).toBe(1000);
    expect(foodStatus.percentageConsumed).toBe(80);
    expect(foodStatus.status).toBe('warning');

    // Groceries: spent 10000 out of 8000 = 125% => 'exceeded'
    const grocStatus = statuses.find((s) => s.budget.category === 'Groceries')!;
    expect(grocStatus.spent).toBe(10000);
    expect(grocStatus.remaining).toBe(-2000);
    expect(grocStatus.status).toBe('exceeded');

    // Housing: spent 30000 out of 40000 = 75% => 'safe'
    const houseStatus = statuses.find((s) => s.budget.category === 'Housing & Rent')!;
    expect(houseStatus.status).toBe('safe');
  });

  it('correctly filters transactions by date range', () => {
    const refDate = new Date(2026, 9, 25); // Oct 2026
    const result = filterTransactionsByDate(sampleTransactions, 'this_month', refDate);
    expect(result.currentPeriod.length).toBe(5);
  });
});
