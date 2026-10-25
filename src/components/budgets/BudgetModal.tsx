import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { EXPENSE_CATEGORIES } from '../../utils/categories';
import { Budget } from '../../types';

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.coerce.number().positive('Budget target must be positive'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2030),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBudget?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  editingBudget,
}) => {
  const { addBudget, updateBudget, settings } = useApp();
  const currentDate = new Date();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: 'Food & Dining',
      limit: '' as any,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
  });

  useEffect(() => {
    if (editingBudget) {
      reset({
        category: editingBudget.category,
        limit: editingBudget.limit,
        month: editingBudget.month,
        year: editingBudget.year,
      });
    } else {
      reset({
        category: 'Food & Dining',
        limit: '' as any,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
    }
  }, [editingBudget, isOpen, reset]);

  const onSubmit = (data: BudgetFormData) => {
    if (editingBudget) {
      updateBudget(editingBudget.id, {
        category: data.category as any,
        limit: Number(data.limit),
        month: Number(data.month),
        year: Number(data.year),
      });
      onClose();
    } else {
      const result = addBudget({
        category: data.category as any,
        limit: Number(data.limit),
        month: Number(data.month),
        year: Number(data.year),
      });

      if (!result.success) {
        setError('category', { message: result.message });
        return;
      }
      onClose();
    }
  };

  const categoryOptions = ['Overall', ...EXPENSE_CATEGORIES];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBudget ? 'Edit Spending Budget' : 'Establish New Budget Target'}
      subtitle="Define category caps to track thresholds and remaining allowances."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Category Target <span className="text-rose-500">*</span>
          </label>
          <select
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            {...register('category')}
            disabled={Boolean(editingBudget)}
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Overall' ? '⚡ Overall Monthly Cap' : cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Limit */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Monthly Spending Limit ({settings.currencySymbol}) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
              {settings.currencySymbol}
            </span>
            <input
              type="number"
              step="any"
              placeholder="e.g. 15000"
              className="w-full pl-8 pr-3.5 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...register('limit')}
            />
          </div>
          {errors.limit && (
            <p className="text-xs text-rose-500 mt-1">{errors.limit.message}</p>
          )}
        </div>

        {/* Month & Year */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Month (1-12)
            </label>
            <input
              type="number"
              min={1}
              max={12}
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...register('month')}
            />
            {errors.month && (
              <p className="text-xs text-rose-500 mt-1">{errors.month.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Year
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...register('year')}
            />
            {errors.year && (
              <p className="text-xs text-rose-500 mt-1">{errors.year.message}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {editingBudget ? 'Save Target' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
