import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  id: string; // Client-side compatible string ID
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    id: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });

export const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);
