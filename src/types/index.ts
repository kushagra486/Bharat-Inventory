export type ExpiryStatus = 'expired' | 'today' | 'soon' | 'safe';
export interface Product {
  id: string; user_id: string; name: string; category_id: string;
  category?: Category; barcode?: string; batch_number?: string;
  manufacture_date?: string; expiry_date: string; quantity: number;
  unit: string; supplier_id?: string; supplier?: Supplier;
  price?: number; location?: string; notes?: string; image_url?: string;
  is_archived: boolean; created_at: string; updated_at: string;
  expiry_status?: ExpiryStatus; days_until_expiry?: number;
}
export interface ProductInsert {
  name: string; category_id: string; barcode?: string; batch_number?: string;
  manufacture_date?: string; expiry_date: string; quantity: number; unit: string;
  supplier_id?: string; price?: number; location?: string; notes?: string; image_url?: string;
}
export interface ProductUpdate extends Partial<ProductInsert> { id: string; is_archived?: boolean; }
export interface Category {
  id: string; user_id?: string; name: string; icon: string; color: string;
  is_default: boolean; created_at: string;
}
export interface Supplier {
  id: string; user_id: string; name: string; phone?: string; email?: string; address?: string; created_at: string;
}
export interface DashboardStats {
  total: number; expired: number; expiring_today: number; expiring_soon: number; safe: number;
}
export interface ProductFilters {
  search?: string; category_id?: string; status?: ExpiryStatus | 'all';
  barcode?: string; date_from?: string; date_to?: string; is_archived?: boolean;
}
