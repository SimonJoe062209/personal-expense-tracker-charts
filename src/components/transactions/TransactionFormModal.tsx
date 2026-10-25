import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../utils/categories';
import { format } from 'date-fns';

const transactionSchema = z.object({
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Please select a category'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date in YYYY-MM-DD required'),
  paymentMethod: z.enum(['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash']),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export const TransactionFormModal: React.FC = () => {
  const {
    isAddTransactionOpen,
    setIsAddTransactionOpen,
    editingTransaction,
    setEditingTransaction,
    addTransaction,
    updateTransaction,
    settings,
  } = useApp();

  const isOpen = isAddTransactionOpen || Boolean(editingTransaction);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: '' as any,
      category: 'Food & Dining',
      date: format(new Date(), 'yyyy-MM-dd'),
      paymentMethod: 'UPI',
      notes: '',
    },
  });

  const selectedType = watch('type');

  // Reset or fill form when modal opens or editing transaction changes
  useEffect(() => {
    if (editingTransaction) {
      reset({
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        type: editingTransaction.type,
        category: editingTransaction.category,
        date: editingTransaction.date,
        paymentMethod: editingTransaction.paymentMethod,
        notes: editingTransaction.notes || '',
      });
    } else {
      reset({
        type: 'expense',
        description: '',
        amount: '' as any,
        category: 'Food & Dining',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'UPI',
        notes: '',
      });
    }
  }, [editingTransaction, isAddTransactionOpen, reset]);

  // Adjust category if type switches
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setValue('type', newType);
    if (newType === 'income') {
      setValue('category', INCOME_CATEGORIES[0]);
    } else {
      setValue('category', EXPENSE_CATEGORIES[0]);
    }
  };

  const handleClose = () => {
    setIsAddTransactionOpen(false);
    setEditingTransaction(null);
  };

  const onSubmit = (data: TransactionFormData) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        description: data.description,
        amount: Number(data.amount),
        type: data.type,
        category: data.category as any,
        date: data.date,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
    } else {
      addTransaction({
        description: data.description,
        amount: Number(data.amount),
        type: data.type,
        category: data.category as any,
        date: data.date,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
    }
    handleClose();
  };

  const activeCategoryList =
    selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingTransaction ? 'Edit Transaction' : 'Record New Transaction'}
      subtitle="Enter details below. Your balance and analytics update immediately."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Toggle */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Transaction Nature
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'expense'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'income'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Income (+)
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Swiggy gourmet dinner, Client invoice payment"
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount ({settings.currencySymbol}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                {settings.currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2 text-sm font-mono bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                {...register('amount')}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-xs text-rose-500 mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>

        {/* Category & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...register('category')}
            >
              {activeCategoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...register('paymentMethod')}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="text-xs text-rose-500 mt-1">{errors.paymentMethod.message}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes / Reference (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Add invoice reference, location, or split details"
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            {...register('notes')}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {editingTransaction ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
