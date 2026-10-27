import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SettingsModel } from '../models/Settings';
import { TransactionModel } from '../models/Transaction';
import { BudgetModel } from '../models/Budget';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_USER_SETTINGS } from '../../src/data/seedData';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    let settings = await SettingsModel.findOne({ userId }).lean();

    if (!settings) {
      settings = await SettingsModel.create({
        userId,
        currency: INITIAL_USER_SETTINGS.currency,
        currencySymbol: INITIAL_USER_SETTINGS.currencySymbol,
        currencyLocale: INITIAL_USER_SETTINGS.currencyLocale,
        theme: 'light',
        openingBalance: 0,
        userName: req.user?.name || 'User',
        monthlySavingsTargetPct: 25,
      });
    }

    res.json({
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      currencyLocale: settings.currencyLocale,
      theme: settings.theme,
      openingBalance: settings.openingBalance,
      userName: settings.userName,
      monthlySavingsTargetPct: settings.monthlySavingsTargetPct,
    });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const updates = req.body;

    const updated = await SettingsModel.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      currency: updated.currency,
      currencySymbol: updated.currencySymbol,
      currencyLocale: updated.currencyLocale,
      theme: updated.theme,
      openingBalance: updated.openingBalance,
      userName: updated.userName,
      monthlySavingsTargetPct: updated.monthlySavingsTargetPct,
    });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};

export const exportBackup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const transactions = await TransactionModel.find({ userId }).lean();
    const budgets = await BudgetModel.find({ userId }).lean();
    const settings = await SettingsModel.findOne({ userId }).lean();

    const backup = {
      version: '1.0.0-mongo',
      exportedAt: new Date().toISOString(),
      user: {
        name: req.user?.name,
        email: req.user?.email,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
        paymentMethod: t.paymentMethod,
        notes: t.notes,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      budgets: budgets.map((b) => ({
        id: b.id,
        category: b.category,
        limit: b.limit,
        month: b.month,
        year: b.year,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })),
      settings: settings
        ? {
            currency: settings.currency,
            currencySymbol: settings.currencySymbol,
            currencyLocale: settings.currencyLocale,
            theme: settings.theme,
            openingBalance: settings.openingBalance,
            userName: settings.userName,
            monthlySavingsTargetPct: settings.monthlySavingsTargetPct,
          }
        : INITIAL_USER_SETTINGS,
    };

    res.json(backup);
  } catch (err: any) {
    console.error('Error exporting backup:', err);
    res.status(500).json({ error: 'Failed to generate JSON backup.' });
  }
};

export const importBackup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const data = req.body;

    if (!data || !Array.isArray(data.transactions)) {
      res.status(400).json({ error: 'Invalid backup format: missing transactions list.' });
      return;
    }

    // Replace user transactions
    await TransactionModel.deleteMany({ userId });
    const txDocs = data.transactions.map((tx: any) => ({
      userId,
      id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: tx.description,
      amount: Number(tx.amount),
      type: tx.type,
      category: tx.category,
      date: tx.date,
      paymentMethod: tx.paymentMethod,
      notes: tx.notes || '',
      createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
      updatedAt: tx.updatedAt ? new Date(tx.updatedAt) : new Date(),
    }));
    await TransactionModel.insertMany(txDocs);

    // Replace budgets
    if (Array.isArray(data.budgets)) {
      await BudgetModel.deleteMany({ userId });
      const budgetDocs = data.budgets.map((b: any) => ({
        userId,
        id: b.id || `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category: b.category,
        limit: Number(b.limit),
        month: Number(b.month),
        year: Number(b.year),
        createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
        updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      }));
      await BudgetModel.insertMany(budgetDocs);
    }

    // Replace settings
    if (data.settings && typeof data.settings === 'object') {
      await SettingsModel.findOneAndUpdate({ userId }, { $set: data.settings }, { upsert: true });
    }

    res.json({ message: 'Backup imported and MongoDB collections updated successfully.' });
  } catch (err: any) {
    console.error('Error importing backup:', err);
    res.status(500).json({ error: 'Failed to restore backup.' });
  }
};

export const resetDemoData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Reset transactions to initial seed
    await TransactionModel.deleteMany({ userId });
    const txDocs = INITIAL_TRANSACTIONS.map((tx) => ({
      userId,
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      paymentMethod: tx.paymentMethod,
      notes: tx.notes || '',
      createdAt: new Date(tx.createdAt),
      updatedAt: new Date(tx.updatedAt),
    }));
    await TransactionModel.insertMany(txDocs);

    // Reset budgets to initial seed
    await BudgetModel.deleteMany({ userId });
    const budgetDocs = INITIAL_BUDGETS.map((b) => ({
      userId,
      id: b.id,
      category: b.category,
      limit: b.limit,
      month: b.month,
      year: b.year,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt),
    }));
    await BudgetModel.insertMany(budgetDocs);

    // Reset settings
    await SettingsModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          currency: INITIAL_USER_SETTINGS.currency,
          currencySymbol: INITIAL_USER_SETTINGS.currencySymbol,
          currencyLocale: INITIAL_USER_SETTINGS.currencyLocale,
          theme: INITIAL_USER_SETTINGS.theme,
          openingBalance: INITIAL_USER_SETTINGS.openingBalance,
          userName: INITIAL_USER_SETTINGS.userName,
          monthlySavingsTargetPct: INITIAL_USER_SETTINGS.monthlySavingsTargetPct,
        },
      },
      { upsert: true }
    );

    res.json({ message: 'Demo seed dataset restored successfully in MongoDB.' });
  } catch (err: any) {
    console.error('Error resetting demo dataset:', err);
    res.status(500).json({ error: 'Failed to reset demo dataset.' });
  }
};
