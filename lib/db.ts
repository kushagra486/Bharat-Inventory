import { Models } from 'react-native-appwrite';
import { account, databases, APPWRITE_DATABASE_ID, COLLECTIONS, ID, Query, Permission, Role } from './appwrite';
import { Product, ProductInsert, ProductUpdate, Category, Supplier, ProductFilters } from '@/types';
import { enrichProducts } from './utils';

const PAGE_SIZE = 100;

type AppwriteDoc = Models.Document & Record<string, any>;

async function listAllDocuments(collectionId: string, queries: string[]): Promise<AppwriteDoc[]> {
  const all: AppwriteDoc[] = [];
  let cursor: string | undefined;

  while (true) {
    const pageQueries = [...queries, Query.limit(PAGE_SIZE)];
    if (cursor) pageQueries.push(Query.cursorAfter(cursor));

    const res = await databases.listDocuments(APPWRITE_DATABASE_ID, collectionId, pageQueries);
    all.push(...res.documents);

    if (res.documents.length < PAGE_SIZE) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }

  return all;
}

function ownerPermissions(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

function mapCategory(doc: AppwriteDoc): Category {
  return {
    id: doc.$id,
    user_id: doc.user_id ?? undefined,
    name: doc.name,
    icon: doc.icon,
    color: doc.color,
    is_default: doc.is_default,
    created_at: doc.$createdAt,
  };
}

function mapSupplier(doc: AppwriteDoc): Supplier {
  return {
    id: doc.$id,
    user_id: doc.user_id,
    name: doc.name,
    phone: doc.phone ?? undefined,
    email: doc.email ?? undefined,
    address: doc.address ?? undefined,
    created_at: doc.$createdAt,
  };
}

function mapProduct(doc: AppwriteDoc, categories: Category[], suppliers: Supplier[]): Product {
  return {
    id: doc.$id,
    user_id: doc.user_id,
    name: doc.name,
    category_id: doc.category_id,
    category: categories.find(c => c.id === doc.category_id),
    barcode: doc.barcode ?? undefined,
    batch_number: doc.batch_number ?? undefined,
    manufacture_date: doc.manufacture_date ?? undefined,
    expiry_date: doc.expiry_date,
    quantity: doc.quantity,
    unit: doc.unit,
    supplier_id: doc.supplier_id ?? undefined,
    supplier: suppliers.find(s => s.id === doc.supplier_id),
    price: doc.price ?? undefined,
    location: doc.location ?? undefined,
    notes: doc.notes ?? undefined,
    image_url: doc.image_url ?? undefined,
    is_archived: doc.is_archived,
    created_at: doc.$createdAt,
    updated_at: doc.$updatedAt,
  };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const queries: string[] = [
    Query.equal('is_archived', filters?.is_archived ?? false),
    Query.orderAsc('expiry_date'),
  ];

  if (filters?.category_id) queries.push(Query.equal('category_id', filters.category_id));
  if (filters?.supplier_id) queries.push(Query.equal('supplier_id', filters.supplier_id));
  if (filters?.barcode) queries.push(Query.equal('barcode', filters.barcode));
  if (filters?.date_from) queries.push(Query.greaterThanEqual('expiry_date', filters.date_from));
  if (filters?.date_to) queries.push(Query.lessThanEqual('expiry_date', filters.date_to));

  const [productDocs, categories, suppliers] = await Promise.all([
    listAllDocuments(COLLECTIONS.products, queries),
    getCategories(),
    getSuppliers(),
  ]);

  let products = enrichProducts(productDocs.map(d => mapProduct(d, categories, suppliers)));

  // Client-side filters
  if (filters?.location) {
    const loc = filters.location.toLowerCase();
    products = products.filter(p => p.location?.toLowerCase().includes(loc));
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
      databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.products, id),
      getCategories(),
      getSuppliers(),
    ]);
    return enrichProducts([mapProduct(doc, categories, suppliers)])[0];
  } catch {
    return null;
  }
}

export async function addProduct(product: ProductInsert): Promise<Product> {
  const user = await account.get();
  const [doc, categories, suppliers] = await Promise.all([
    databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.products,
      ID.unique(),
      { ...product, user_id: user.$id, is_archived: false },
      ownerPermissions(user.$id)
    ),
    getCategories(),
    getSuppliers(),
  ]);

  return enrichProducts([mapProduct(doc, categories, suppliers)])[0];
}

export async function updateProduct(product: ProductUpdate): Promise<Product> {
  const { id, ...updates } = product;
  const [doc, categories, suppliers] = await Promise.all([
    databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.products, id, updates),
    getCategories(),
    getSuppliers(),
  ]);

  return enrichProducts([mapProduct(doc, categories, suppliers)])[0];
}

export async function deleteProduct(id: string): Promise<void> {
  await databases.deleteDocument(APPWRITE_DATABASE_ID, COLLECTIONS.products, id);
}

export async function archiveProduct(id: string, archive = true): Promise<void> {
  await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.products, id, {
    is_archived: archive,
  });
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
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const counts: Record<string, { name: string; icon: string; color: string; count: number }> = {};
  products.forEach(p => {
    const key = p.category_id;
    if (!counts[key]) {
      const cat = categories.find(c => c.id === key);
      counts[key] = {
        name: cat?.name ?? 'Unknown',
        icon: cat?.icon ?? '📦',
        color: cat?.color ?? '#94A3B8',
        count: 0,
      };
    }
    counts[key].count++;
  });

  return Object.values(counts).sort((a, b) => b.count - a.count);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const user = await account.get().catch(() => null);

  const [defaults, mine] = await Promise.all([
    listAllDocuments(COLLECTIONS.categories, [Query.equal('is_default', true)]),
    user ? listAllDocuments(COLLECTIONS.categories, [Query.equal('user_id', user.$id)]) : Promise.resolve([]),
  ]);

  const merged = [...defaults, ...mine.filter(m => !defaults.some(d => d.$id === m.$id))];
  return merged.map(mapCategory).sort((a, b) => a.name.localeCompare(b.name));
}

export async function addCategory(name: string, icon: string, color: string): Promise<Category> {
  const user = await account.get();
  const doc = await databases.createDocument(
    APPWRITE_DATABASE_ID,
    COLLECTIONS.categories,
    ID.unique(),
    { name, icon, color, user_id: user.$id, is_default: false },
    ownerPermissions(user.$id)
  );

  return mapCategory(doc);
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  const docs = await listAllDocuments(COLLECTIONS.suppliers, [Query.orderAsc('name')]);
  return docs.map(mapSupplier);
}

export async function addSupplier(supplier: Omit<Supplier, 'id' | 'user_id' | 'created_at'>): Promise<Supplier> {
  const user = await account.get();
  const doc = await databases.createDocument(
    APPWRITE_DATABASE_ID,
    COLLECTIONS.suppliers,
    ID.unique(),
    { ...supplier, user_id: user.$id },
    ownerPermissions(user.$id)
  );

  return mapSupplier(doc);
}

// ─── Products for Calendar ────────────────────────────────────────────────────

export async function getProductsForMonth(year: number, month: number): Promise<Product[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-31`;

  return getProducts({ date_from: start, date_to: end });
}
