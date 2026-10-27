import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TransactionModel } from '../models/Transaction';

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const transactions = await TransactionModel.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const formatted = transactions.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      paymentMethod: t.paymentMethod,
      notes: t.notes || '',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id, description, amount, type, category, date, paymentMethod, notes } = req.body;

    if (!description || amount === undefined || !type || !category || !date || !paymentMethod) {
      res.status(400).json({ error: 'Missing required transaction fields.' });
      return;
    }

    const txId = id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newTx = await TransactionModel.create({
      userId,
      id: txId,
      description,
      amount: Number(amount),
      type,
      category,
      date,
      paymentMethod,
      notes: notes || '',
    });

    res.status(201).json({
      id: newTx.id,
      description: newTx.description,
      amount: newTx.amount,
      type: newTx.type,
      category: newTx.category,
      date: newTx.date,
      paymentMethod: newTx.paymentMethod,
      notes: newTx.notes,
      createdAt: newTx.createdAt.toISOString(),
      updatedAt: newTx.updatedAt.toISOString(),
    });
  } catch (err: any) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Failed to record transaction.' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updates = req.body;

    const updated = await TransactionModel.findOneAndUpdate(
      { userId, id },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'Transaction not found or unauthorized.' });
      return;
    }

    res.json({
      id: updated.id,
      description: updated.description,
      amount: updated.amount,
      type: updated.type,
      category: updated.category,
      date: updated.date,
      paymentMethod: updated.paymentMethod,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err: any) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const deleted = await TransactionModel.findOneAndDelete({ userId, id });

    if (!deleted) {
      res.status(404).json({ error: 'Transaction not found or unauthorized.' });
      return;
    }

    res.json({ message: 'Transaction deleted successfully', id });
  } catch (err: any) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
};
