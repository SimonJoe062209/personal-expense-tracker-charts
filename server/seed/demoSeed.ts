import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { TransactionModel } from '../models/Transaction';
import { BudgetModel } from '../models/Budget';
import { SettingsModel } from '../models/Settings';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_USER_SETTINGS } from '../../src/data/seedData';

export const DEMO_CREDENTIALS = {
  name: 'Rohan Sharma',
  email: 'demo@moneta.app',
  password: 'demo123456',
};

export const seedDemoAccount = async (): Promise<void> => {
  try {
    let demoUser = await User.findOne({ email: DEMO_CREDENTIALS.email });

    if (!demoUser) {
      console.log(`[Seed] Creating demo account: ${DEMO_CREDENTIALS.email}`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(DEMO_CREDENTIALS.password, salt);

      demoUser = await User.create({
        name: DEMO_CREDENTIALS.name,
        email: DEMO_CREDENTIALS.email,
        passwordHash,
        isDemo: true,
      });
    }

    // Check if transactions exist for demo user
    const txCount = await TransactionModel.countDocuments({ userId: demoUser._id });
    if (txCount === 0) {
      console.log(`[Seed] Populating ${INITIAL_TRANSACTIONS.length} seed transactions for demo user...`);
      const txDocs = INITIAL_TRANSACTIONS.map((tx) => ({
        userId: demoUser!._id,
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
    }

    // Check budgets
    const budgetCount = await BudgetModel.countDocuments({ userId: demoUser._id });
    if (budgetCount === 0) {
      console.log(`[Seed] Populating ${INITIAL_BUDGETS.length} seed budgets for demo user...`);
      const budgetDocs = INITIAL_BUDGETS.map((b) => ({
        userId: demoUser!._id,
        id: b.id,
        category: b.category,
        limit: b.limit,
        month: b.month,
        year: b.year,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      }));
      await BudgetModel.insertMany(budgetDocs);
    }

    // Check settings
    const existingSettings = await SettingsModel.findOne({ userId: demoUser._id });
    if (!existingSettings) {
      console.log(`[Seed] Initializing settings for demo user...`);
      await SettingsModel.create({
        userId: demoUser._id,
        currency: INITIAL_USER_SETTINGS.currency,
        currencySymbol: INITIAL_USER_SETTINGS.currencySymbol,
        currencyLocale: INITIAL_USER_SETTINGS.currencyLocale,
        theme: INITIAL_USER_SETTINGS.theme,
        openingBalance: INITIAL_USER_SETTINGS.openingBalance,
        userName: INITIAL_USER_SETTINGS.userName,
        monthlySavingsTargetPct: INITIAL_USER_SETTINGS.monthlySavingsTargetPct,
      });
    }

    console.log(`[Seed] Demo account verified and ready for login! (${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password})`);
  } catch (err) {
    console.error(`[Seed] Error initializing demo account:`, err);
  }
};
