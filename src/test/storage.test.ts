import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../utils/storage';
import { Transaction } from '../types';

describe('Storage Service Persistence & Migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default seed transactions on initial access', () => {
    const txs = storageService.getTransactions();
    expect(txs.length).toBeGreaterThan(0);
    expect(txs.some((t) => t.category === 'Salary')).toBe(true);
  });

  it('persists newly appended transactions to localStorage', () => {
    const existing = storageService.getTransactions();
    const newTx: Transaction = {
      id: 'test-custom-1',
      description: 'Test Unit Expense',
      amount: 550,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-10-25',
      paymentMethod: 'UPI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveTransactions([newTx, ...existing]);
    const reloaded = storageService.getTransactions();
    expect(reloaded[0].id).toBe('test-custom-1');
    expect(reloaded[0].amount).toBe(550);
  });

  it('generates valid JSON export backup and imports correctly', () => {
    const exportedJSON = storageService.exportCompleteJSON();
    const parsed = JSON.parse(exportedJSON);
    expect(parsed.version).toBe('1.0.0');
    expect(Array.isArray(parsed.transactions)).toBe(true);
    expect(Array.isArray(parsed.budgets)).toBe(true);

    const importedSuccess = storageService.importJSON(exportedJSON);
    expect(importedSuccess).toBe(true);
  });

  it('generates valid CSV format with header and comma delimiters', () => {
    const csv = storageService.exportTransactionsCSV();
    const lines = csv.split('\n');
    expect(lines[0]).toContain('ID,Date,Type,Category,Description,Amount');
    expect(lines.length).toBeGreaterThan(1);
  });
});
