import { differenceInDays, format, parseISO, isValid } from 'date-fns';
import { ExpiryStatus, Product } from '../types';
import { C, EXPIRY_SOON_DAYS } from './tokens';

export function getDaysUntilExpiry(d: string) {
  const dt = parseISO(d);
  return isValid(dt) ? differenceInDays(dt, new Date()) : 0;
}
export function getExpiryStatus(d: string): ExpiryStatus {
  const days = getDaysUntilExpiry(d);
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days <= EXPIRY_SOON_DAYS) return 'soon';
  return 'safe';
}
export function statusColor(s: ExpiryStatus) {
  return ({ expired: C.expired, today: C.today, soon: C.soon, safe: C.safe })[s];
}
export function expiryLabel(d: string) {
  const days = getDaysUntilExpiry(d);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return format(parseISO(d), 'dd MMM yyyy');
}
export function fmtDate(d: string) {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}
export function toISO(date: Date) { return format(date, 'yyyy-MM-dd'); }
export function enrichProduct(p: Product): Product {
  return { ...p, expiry_status: getExpiryStatus(p.expiry_date), days_until_expiry: getDaysUntilExpiry(p.expiry_date) };
}
export function enrichProducts(ps: Product[]) { return ps.map(enrichProduct); }
export function fmtCurrency(n: number) { return `₹${n.toLocaleString('en-IN')}`; }
