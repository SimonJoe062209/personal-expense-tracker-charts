import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  currency: string;
  currencySymbol: string;
  currencyLocale: string;
  theme: 'light' | 'dark' | 'system';
  openingBalance: number;
  userName: string;
  monthlySavingsTargetPct: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    currencyLocale: { type: String, default: 'en-IN' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    openingBalance: { type: Number, default: 85000 },
    userName: { type: String, default: 'Rohan Sharma' },
    monthlySavingsTargetPct: { type: Number, default: 35 },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);
