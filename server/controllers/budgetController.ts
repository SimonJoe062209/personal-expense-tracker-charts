import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { BudgetModel } from '../models/Budget';

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const budgets = await BudgetModel.find({ userId }).sort({ year: -1, month: -1 }).lean();

    const formatted = budgets.map((b) => ({
      id: b.id,
      category: b.category,
      limit: b.limit,
      month: b.month,
      year: b.year,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Failed to retrieve budgets.' });
  }
};

export const createBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id, category, limit, month, year } = req.body;

    if (!category || limit === undefined || !month || !year) {
      res.status(400).json({ error: 'Category, limit, month, and year are required.' });
      return;
    }

    // Check duplicate
    const existing = await BudgetModel.findOne({ userId, category, month, year });
    if (existing) {
      res.status(409).json({
        error: `A budget target for ${category} already exists for this period. Please edit it instead.`,
      });
      return;
    }

    const budgetId = id || `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newBudget = await BudgetModel.create({
      userId,
      id: budgetId,
      category,
      limit: Number(limit),
      month: Number(month),
      year: Number(year),
    });

    res.status(201).json({
      id: newBudget.id,
      category: newBudget.category,
      limit: newBudget.limit,
      month: newBudget.month,
      year: newBudget.year,
      createdAt: newBudget.createdAt.toISOString(),
      updatedAt: newBudget.updatedAt.toISOString(),
    });
  } catch (err: any) {
    console.error('Error creating budget:', err);
    res.status(500).json({ error: 'Failed to create budget target.' });
  }
};

export const updateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updates = req.body;

    const updated = await BudgetModel.findOneAndUpdate(
      { userId, id },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'Budget not found or unauthorized.' });
      return;
    }

    res.json({
      id: updated.id,
      category: updated.category,
      limit: updated.limit,
      month: updated.month,
      year: updated.year,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err: any) {
    console.error('Error updating budget:', err);
    res.status(500).json({ error: 'Failed to update budget.' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const deleted = await BudgetModel.findOneAndDelete({ userId, id });

    if (!deleted) {
      res.status(404).json({ error: 'Budget not found or unauthorized.' });
      return;
    }

    res.json({ message: 'Budget deleted successfully', id });
  } catch (err: any) {
    console.error('Error deleting budget:', err);
    res.status(500).json({ error: 'Failed to delete budget.' });
  }
};
