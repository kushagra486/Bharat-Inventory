import { differenceInDays, format, isToday, isTomorrow, parseISO, isValid } from 'date-fns';
import { ExpiryStatus, Product } from '@/types';
import { COLORS, EXPIRY_THRESHOLDS } from '@/constants';

// ─── Expiry Helpers ────────────────────────────────────────────────────────────

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = parseISO(expiryDate);
  if (!isValid(expiry)) return 0;
  return differenceInDays(expiry, new Date());
}

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days <= EXPIRY_THRESHOLDS.soon) return 'soon';
  return 'safe';
}

export function getExpiryStatusColor(status: ExpiryStatus): string {
  switch (status) {
    case 'expired': return COLORS.expired;
    case 'today':   return COLORS.today;
    case 'soon':    return COLORS.soon;
    case 'safe':    return COLORS.safe;
  }
}

export function getExpiryStatusLabel(status: ExpiryStatus): string {
  switch (status) {
    case 'expired': return 'Expired';
    case 'today':   return 'Today';
    case 'soon':    return 'Soon';
    case 'safe':    return 'Safe';
  }
}

export function getExpiryLabel(expiryDate: string): string {
  const days = getDaysUntilExpiry(expiryDate);
  const expiry = parseISO(expiryDate);

  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 7) return `Expires in ${days} days`;
  return format(expiry, 'dd MMM yyyy');
}

// ─── Product Enrichment ────────────────────────────────────────────────────────

export function enrichProduct(product: Product): Product {
  return {
    ...product,
    expiry_status: getExpiryStatus(product.expiry_date),
    days_until_expiry: getDaysUntilExpiry(product.expiry_date),
  };
}

export function enrichProducts(products: Product[]): Product[] {
  return products.map(enrichProduct);
}

// ─── Date Formatting ───────────────────────────────────────────────────────────

export function formatDate(date: string, pattern = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(date), pattern);
  } catch {
    return date;
  }
}

export function formatDateShort(date: string): string {
  const parsed = parseISO(date);
  if (isToday(parsed)) return 'Today';
  if (isTomorrow(parsed)) return 'Tomorrow';
  return format(parsed, 'dd MMM');
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// ─── Number Formatting ─────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity} ${unit}`;
}

// ─── Sort Helpers ──────────────────────────────────────────────────────────────

export function sortByExpiry(a: Product, b: Product): number {
  return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
}

export function sortByName(a: Product, b: Product): number {
  return a.name.localeCompare(b.name);
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidDate(dateString: string): boolean {
  return isValid(parseISO(dateString));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function matchesSearch(product: Product, query: string): boolean {
  const q = query.toLowerCase();
  return (
    product.name.toLowerCase().includes(q) ||
    product.category?.name.toLowerCase().includes(q) ||
    product.barcode?.includes(q) ||
    product.batch_number?.toLowerCase().includes(q) ||
    product.location?.toLowerCase().includes(q) ||
    false
  );
}
