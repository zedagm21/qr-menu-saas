/**
 * Utility to safely format currency amounts.
 * Uses Decimal-safe strings from Prisma to avoid floating-point arithmetic.
 */
export const formatCurrency = (amount: string | number, currency: string = 'ETB'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${numAmount.toLocaleString('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
};

export const SUPPORTED_CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
