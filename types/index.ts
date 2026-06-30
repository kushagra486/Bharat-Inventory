// ─── Product Types ────────────────────────────────────────────────────────────

export type ExpiryStatus = 'expired' | 'today' | 'soon' | 'safe';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  category_id: string;
  category?: Category;
  barcode?: string;
  batch_number?: string;
  manufacture_date?: string;
  expiry_date: string;
  quantity: number;
  unit: string;
  supplier_id?: string;
  supplier?: Supplier;
  price?: number;
  location?: string;
  notes?: string;
  image_url?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // computed
  expiry_status?: ExpiryStatus;
  days_until_expiry?: number;
}

export interface ProductInsert {
  name: string;
  category_id: string;
  barcode?: string;
  batch_number?: string;
  manufacture_date?: string;
  expiry_date: string;
  quantity: number;
  unit: string;
  supplier_id?: string;
  price?: number;
  location?: string;
  notes?: string;
  image_url?: string;
}

export interface ProductUpdate extends Partial<ProductInsert> {
  id: string;
  is_archived?: boolean;
}

// ─── Category Types ────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

// ─── Supplier Types ────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

// ─── Notification Types ────────────────────────────────────────────────────────

export type NotificationChannel = 'push' | 'email';

export interface NotificationSetting {
  id: string;
  user_id: string;
  days_before: number;
  is_enabled: boolean;
  channel: NotificationChannel;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  days_before: number;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
}

// ─── Dashboard Types ────────────────────────────────────────────────────────────

export interface DashboardStats {
  total: number;
  expired: number;
  expiring_today: number;
  expiring_soon: number;
  safe: number;
}

export interface CategoryStat {
  category: Category;
  count: number;
  expired_count: number;
}

export interface ExpiryTrendData {
  month: string;
  expired: number;
  expiring_soon: number;
  safe: number;
}

// ─── Filter Types ────────────────────────────────────────────────────────────────

export interface ProductFilters {
  search?: string;
  category_id?: string;
  supplier_id?: string;
  status?: ExpiryStatus | 'all';
  barcode?: string;
  date_from?: string;
  date_to?: string;
  location?: string;
  is_archived?: boolean;
}

// ─── Report Types ────────────────────────────────────────────────────────────────

export type ReportType = 'expired' | 'monthly' | 'waste' | 'inventory';
export type ReportFormat = 'pdf' | 'csv';

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  date_from?: string;
  date_to?: string;
  category_id?: string;
}

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}
