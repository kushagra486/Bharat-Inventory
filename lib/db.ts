import { supabase } from './supabase';
import { Product, ProductInsert, ProductUpdate, Category, Supplier, ProductFilters } from '@/types';
import { enrichProducts } from './utils';

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      supplier:suppliers(*)
    `)
    .eq('is_archived', filters?.is_archived ?? false)
    .order('expiry_date', { ascending: true });

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id);
  }
  if (filters?.barcode) {
    query = query.eq('barcode', filters.barcode);
  }
  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters?.date_from) {
    query = query.gte('expiry_date', filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte('expiry_date', filters.date_to);
  }

  const { data, error } = await query;
  if (error) throw error;

  let products = enrichProducts(data as Product[]);

  // Client-side filters
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category?.name.toLowerCase().includes(q) ||
      p.barcode?.includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  }

  if (filters?.status && filters.status !== 'all') {
    products = products.filter(p => p.expiry_status === filters.status);
  }

  return products;
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`*, category:categories(*), supplier:suppliers(*)`)
    .eq('id', id)
    .single();

  if (error) return null;
  return enrichProducts([data as Product])[0];
}

export async function addProduct(product: ProductInsert): Promise<Product> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('products')
    .insert({ ...product, user_id: user!.id })
    .select(`*, category:categories(*), supplier:suppliers(*)`)
    .single();

  if (error) throw error;
  return enrichProducts([data as Product])[0];
}

export async function updateProduct(product: ProductUpdate): Promise<Product> {
  const { id, ...updates } = product;
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`*, category:categories(*), supplier:suppliers(*)`)
    .single();

  if (error) throw error;
  return enrichProducts([data as Product])[0];
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function archiveProduct(id: string, archive = true): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_archived: archive, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function duplicateProduct(id: string): Promise<Product> {
  const original = await getProductById(id);
  if (!original) throw new Error('Product not found');

  const { id: _, created_at, updated_at, category, supplier, expiry_status, days_until_expiry, ...rest } = original;
  return addProduct({ ...rest, name: `${rest.name} (Copy)` });
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const products = await getProducts();

  return {
    total: products.length,
    expired: products.filter(p => p.expiry_status === 'expired').length,
    expiring_today: products.filter(p => p.expiry_status === 'today').length,
    expiring_soon: products.filter(p => p.expiry_status === 'soon').length,
    safe: products.filter(p => p.expiry_status === 'safe').length,
  };
}

export async function getProductsByCategory() {
  const { data, error } = await supabase
    .from('products')
    .select(`category_id, categories(name, icon, color)`)
    .eq('is_archived', false);

  if (error) throw error;

  const counts: Record<string, { name: string; icon: string; color: string; count: number }> = {};
  data.forEach((p: any) => {
    const key = p.category_id;
    if (!counts[key]) {
      counts[key] = { ...p.categories, count: 0 };
    }
    counts[key].count++;
  });

  return Object.values(counts).sort((a, b) => b.count - a.count);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`is_default.eq.true,user_id.eq.${user?.id}`)
    .order('name');

  if (error) throw error;
  return data as Category[];
}

export async function addCategory(name: string, icon: string, color: string): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, icon, color, user_id: user!.id, is_default: false })
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Supplier[];
}

export async function addSupplier(supplier: Omit<Supplier, 'id' | 'user_id' | 'created_at'>): Promise<Supplier> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...supplier, user_id: user!.id })
    .select()
    .single();

  if (error) throw error;
  return data as Supplier;
}

// ─── Products for Calendar ────────────────────────────────────────────────────

export async function getProductsForMonth(year: number, month: number): Promise<Product[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-31`;

  return getProducts({ date_from: start, date_to: end });
}
