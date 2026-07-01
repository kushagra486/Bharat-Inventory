import { supabase } from './supabase';
import { Product, ProductInsert, ProductUpdate, Category, Supplier, ProductFilters } from '../types';
import { enrichProducts } from './utils';

export async function getProducts(f?: ProductFilters): Promise<Product[]> {
  let q = supabase.from('products').select('*, category:categories(*), supplier:suppliers(*)')
    .eq('is_archived', f?.is_archived ?? false).order('expiry_date', { ascending: true });
  if (f?.category_id) q = q.eq('category_id', f.category_id);
  if (f?.barcode) q = q.eq('barcode', f.barcode);
  if (f?.date_from) q = q.gte('expiry_date', f.date_from);
  if (f?.date_to) q = q.lte('expiry_date', f.date_to);
  const { data, error } = await q;
  if (error) throw error;
  let prods = enrichProducts(data as Product[]);
  if (f?.search) {
    const s = f.search.toLowerCase();
    prods = prods.filter(p => p.name.toLowerCase().includes(s) || p.barcode?.includes(s) || p.category?.name.toLowerCase().includes(s));
  }
  if (f?.status && f.status !== 'all') prods = prods.filter(p => p.expiry_status === f.status);
  return prods;
}
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*, category:categories(*), supplier:suppliers(*)').eq('id', id).single();
  if (error) return null;
  return enrichProducts([data as Product])[0];
}
export async function addProduct(p: ProductInsert): Promise<Product> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('products').insert({ ...p, user_id: user!.id })
    .select('*, category:categories(*), supplier:suppliers(*)').single();
  if (error) throw error;
  return enrichProducts([data as Product])[0];
}
export async function updateProduct(p: ProductUpdate): Promise<Product> {
  const { id, ...rest } = p;
  const { data, error } = await supabase.from('products').update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id).select('*, category:categories(*), supplier:suppliers(*)').single();
  if (error) throw error;
  return enrichProducts([data as Product])[0];
}
export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}
export async function archiveProduct(id: string, archive = true) {
  const { error } = await supabase.from('products').update({ is_archived: archive, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
export async function getCategories(): Promise<Category[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('categories').select('*').or(`is_default.eq.true,user_id.eq.${user?.id}`).order('name');
  if (error) throw error;
  return data as Category[];
}
export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) throw error;
  return data as Supplier[];
}
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
  const prods = await getProducts();
  const m: Record<string, any> = {};
  prods.forEach(p => {
    const k = p.category_id;
    if (!m[k]) m[k] = { ...p.category, count: 0 };
    m[k].count++;
  });
  return Object.values(m).sort((a, b) => b.count - a.count);
}
