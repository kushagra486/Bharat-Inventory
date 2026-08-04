import { databases, account, DATABASE_ID, COLLECTIONS, ID, Query, Permission, Role } from './appwrite';
import { Product, ProductInsert, ProductUpdate, Category, Supplier, ProductFilters, UserProfile } from '@/types';
import { enrichProducts } from './utils';

function mapDoc<T>(doc: any): T {
  const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...rest } = doc;
  return { id: $id, created_at: $createdAt, updated_at: $updatedAt, ...rest } as T;
}

async function currentUserId(): Promise<string> {
  const user = await account.get();
  return user.$id;
}

function ownerPermissions(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const userId = await currentUserId();
  const queries = [
    Query.equal('user_id', userId),
    Query.equal('is_archived', filters?.is_archived ?? false),
    Query.orderAsc('expiry_date'),
    Query.limit(1000),
  ];

  if (filters?.category_id) queries.push(Query.equal('category_id', filters.category_id));
  if (filters?.supplier_id) queries.push(Query.equal('supplier_id', filters.supplier_id));
  if (filters?.barcode) queries.push(Query.equal('barcode', filters.barcode));
  if (filters?.date_from) queries.push(Query.greaterThanEqual('expiry_date', filters.date_from));
  if (filters?.date_to) queries.push(Query.lessThanEqual('expiry_date', filters.date_to));

  const [res, categories, suppliers] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.products, queries),
    getCategories(),
    getSuppliers(),
  ]);

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const supplierMap = new Map(suppliers.map(s => [s.id, s]));

  let products: Product[] = res.documents.map(doc => {
    const p = mapDoc<Product>(doc);
    return {
      ...p,
      category: categoryMap.get(p.category_id),
      supplier: p.supplier_id ? supplierMap.get(p.supplier_id) : undefined,
    };
  });

  products = enrichProducts(products);

  if (filters?.location) {
    const q = filters.location.toLowerCase();
    products = products.filter(p => p.location?.toLowerCase().includes(q));
  }
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
  try {
    const [doc, categories, suppliers] = await Promise.all([
      databases.getDocument(DATABASE_ID, COLLECTIONS.products, id),
      getCategories(),
      getSuppliers(),
    ]);
    const p = mapDoc<Product>(doc);
    const product: Product = {
      ...p,
      category: categories.find(c => c.id === p.category_id),
      supplier: p.supplier_id ? suppliers.find(s => s.id === p.supplier_id) : undefined,
    };
    return enrichProducts([product])[0];
  } catch {
    return null;
  }
}

export async function addProduct(product: ProductInsert): Promise<Product> {
  const userId = await currentUserId();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.products,
    ID.unique(),
    { ...product, user_id: userId, is_archived: false },
    ownerPermissions(userId)
  );
  const p = mapDoc<Product>(doc);
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);
  const enriched: Product = {
    ...p,
    category: categories.find(c => c.id === p.category_id),
    supplier: p.supplier_id ? suppliers.find(s => s.id === p.supplier_id) : undefined,
  };
  return enrichProducts([enriched])[0];
}

export async function updateProduct(product: ProductUpdate): Promise<Product> {
  const { id, ...updates } = product;
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.products, id, updates);
  const p = mapDoc<Product>(doc);
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);
  const enriched: Product = {
    ...p,
    category: categories.find(c => c.id === p.category_id),
    supplier: p.supplier_id ? suppliers.find(s => s.id === p.supplier_id) : undefined,
  };
  return enrichProducts([enriched])[0];
}

export async function deleteProduct(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.products, id);
}

export async function archiveProduct(id: string, archive = true): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.products, id, { is_archived: archive });
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
  const products = await getProducts();

  const counts: Record<string, { name: string; icon: string; color: string; count: number }> = {};
  products.forEach(p => {
    if (!p.category) return;
    const key = p.category_id;
    if (!counts[key]) {
      counts[key] = { name: p.category.name, icon: p.category.icon, color: p.category.color, count: 0 };
    }
    counts[key].count++;
  });

  return Object.values(counts).sort((a, b) => b.count - a.count);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const userId = await currentUserId();
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.categories, [
    Query.limit(200),
  ]);
  return res.documents
    .map(doc => mapDoc<Category>(doc))
    .filter(c => c.is_default || c.user_id === userId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addCategory(name: string, icon: string, color: string): Promise<Category> {
  const userId = await currentUserId();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.categories,
    ID.unique(),
    { name, icon, color, user_id: userId, is_default: false },
    ownerPermissions(userId)
  );
  return mapDoc<Category>(doc);
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  const userId = await currentUserId();
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.suppliers, [
    Query.equal('user_id', userId),
    Query.orderAsc('name'),
    Query.limit(500),
  ]);
  return res.documents.map(doc => mapDoc<Supplier>(doc));
}

export async function addSupplier(supplier: Omit<Supplier, 'id' | 'user_id' | 'created_at'>): Promise<Supplier> {
  const userId = await currentUserId();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.suppliers,
    ID.unique(),
    { ...supplier, user_id: userId },
    ownerPermissions(userId)
  );
  return mapDoc<Supplier>(doc);
}

export async function deleteSupplier(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.suppliers, id);
}

// ─── Notification Settings ────────────────────────────────────────────────────

export async function getNotificationSettings(): Promise<Record<number, boolean>> {
  const userId = await currentUserId();
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notificationSettings, [
    Query.equal('user_id', userId),
    Query.limit(100),
  ]);
  const map: Record<number, boolean> = {};
  res.documents.forEach((doc: any) => { map[doc.days_before] = doc.is_enabled; });
  return map;
}

export async function setNotificationSetting(daysBefore: number, enabled: boolean): Promise<void> {
  const userId = await currentUserId();
  const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notificationSettings, [
    Query.equal('user_id', userId),
    Query.equal('days_before', daysBefore),
    Query.equal('channel', 'push'),
    Query.limit(1),
  ]);

  if (existing.documents.length > 0) {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.notificationSettings,
      existing.documents[0].$id,
      { is_enabled: enabled }
    );
  } else {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.notificationSettings,
      ID.unique(),
      { user_id: userId, days_before: daysBefore, is_enabled: enabled, channel: 'push' },
      ownerPermissions(userId)
    );
  }
}

// ─── Products for Calendar ────────────────────────────────────────────────────

export async function getProductsForMonth(year: number, month: number): Promise<Product[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-31`;

  return getProducts({ date_from: start, date_to: end });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | null> {
  const user = await account.get();
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.userProfiles, user.$id);
    return { ...mapDoc<UserProfile>(doc), email: user.email };
  } catch {
    return { id: user.$id, email: user.email, full_name: user.name, created_at: user.$createdAt };
  }
}

export async function updateProfile(updates: { full_name?: string; avatar_url?: string }): Promise<void> {
  const user = await account.get();

  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.userProfiles, user.$id, updates);
  } catch {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.userProfiles,
      user.$id,
      updates,
      ownerPermissions(user.$id)
    );
  }

  if (updates.full_name) {
    await account.updateName(updates.full_name);
  }
}
