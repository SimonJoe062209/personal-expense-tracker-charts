import { format, parseISO, isValid } from 'date-fns';

export const CURRENCY_CONFIGS: Record<
  string,
  { symbol: string; locale: string; name: string }
> = {
  INR: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
  JPY: { symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
  CAD: { symbol: 'CA$', locale: 'en-CA', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  SGD: { symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' },
  AED: { symbol: 'AED', locale: 'ar-AE', name: 'UAE Dirham' },
};

/**
 * Formats a numeric amount with proper locale grouping and currency symbol.
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'INR',
  fractionDigits = 0
): string {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.INR;
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Formats an ISO date string into a friendly readable format.
 */
export function formatDate(
  dateInput: string | Date,
  pattern = 'MMM dd, yyyy'
): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return String(dateInput);
    return format(date, pattern);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a percentage value.
 */
export function formatPercentage(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return '0.0%';
  }
  return `${val >= 0 ? '+' : ''}${val.toFixed(decimals)}%`;
}
