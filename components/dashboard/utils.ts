import type { Currency } from './types';

const FX: Record<Currency, number> = { inr: 1, usd: 0.012, eur: 0.011 };
const SYM: Record<Currency, string> = { inr: '₹', usd: '$', eur: '€' };

export function formatCurrency(value: number, currency: Currency): string {
  const sym = SYM[currency];
  const cv = value * FX[currency];
  if (currency === 'inr') {
    if (cv >= 1e7) return `${sym}${(cv / 1e7).toFixed(2)}Cr`;
    if (cv >= 1e5) return `${sym}${(cv / 1e5).toFixed(1)}L`;
    return `${sym}${cv.toLocaleString('en-IN')}`;
  }
  if (cv >= 1e6) return `${sym}${(cv / 1e6).toFixed(2)}M`;
  if (cv >= 1e3) return `${sym}${(cv / 1e3).toFixed(1)}K`;
  return `${sym}${cv.toFixed(0)}`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-IN');
}
