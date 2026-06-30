import { useState, useEffect, useCallback } from 'react';
import { Product, ProductFilters, ProductInsert, ProductUpdate } from '@/types';
import * as db from '@/lib/db';

export function useProducts(initialFilters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters ?? {});

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.getProducts(filters);
      setProducts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  async function add(product: ProductInsert) {
    const newProduct = await db.addProduct(product);
    setProducts(prev => [newProduct, ...prev].sort((a, b) =>
      new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    ));
    return newProduct;
  }

  async function update(product: ProductUpdate) {
    const updated = await db.updateProduct(product);
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    return updated;
  }

  async function remove(id: string) {
    await db.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function archive(id: string, value = true) {
    await db.archiveProduct(id, value);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function duplicate(id: string) {
    const copy = await db.duplicateProduct(id);
    setProducts(prev => [copy, ...prev]);
    return copy;
  }

  return {
    products,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetch,
    add,
    update,
    remove,
    archive,
    duplicate,
  };
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    total: 0, expired: 0, expiring_today: 0, expiring_soon: 0, safe: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getDashboardStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  return { stats, loading };
}
