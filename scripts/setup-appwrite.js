/**
 * Provisions the Appwrite database, collections, attributes, indexes and
 * default category data used by Expiry Dashboard. Equivalent to running
 * supabase/schema.sql against a fresh Supabase project, but for Appwrite.
 *
 * Usage:
 *   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 \
 *   APPWRITE_PROJECT_ID=... \
 *   APPWRITE_API_KEY=... \
 *   APPWRITE_DATABASE_ID=expiry_dashboard \
 *   node scripts/setup-appwrite.js
 *
 * APPWRITE_API_KEY needs the databases.write scope. Get it from
 * your Appwrite project → Overview → Integrations → API keys.
 * Safe to re-run: already-existing resources are skipped.
 */

const { Client, Databases, ID, Permission, Role, DatabasesIndexType: IndexType } = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'expiry_dashboard';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing required env vars: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const ALREADY_EXISTS = 409;

async function ignoreConflict(promise) {
  try {
    await promise;
  } catch (err) {
    if (err.code !== ALREADY_EXISTS) throw err;
  }
}

async function createAttribute(collectionId, attr) {
  const { key, type, required = false, array = false, size, min, max, default: def } = attr;

  switch (type) {
    case 'string':
      return ignoreConflict(
        databases.createStringAttribute(DATABASE_ID, collectionId, key, size ?? 512, required, def, array)
      );
    case 'boolean':
      return ignoreConflict(
        databases.createBooleanAttribute(DATABASE_ID, collectionId, key, required, def, array)
      );
    case 'integer':
      return ignoreConflict(
        databases.createIntegerAttribute(DATABASE_ID, collectionId, key, required, min, max, def, array)
      );
    case 'float':
      return ignoreConflict(
        databases.createFloatAttribute(DATABASE_ID, collectionId, key, required, min, max, def, array)
      );
    default:
      throw new Error(`Unknown attribute type: ${type}`);
  }
}

async function waitUntilAvailable(collectionId, keys, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { attributes } = await databases.listAttributes(DATABASE_ID, collectionId);
    const ready = keys.every(key => attributes.some(a => a.key === key && a.status === 'available'));
    if (ready) return;
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error(`Timed out waiting for attributes on ${collectionId}: ${keys.join(', ')}`);
}

async function createIndex(collectionId, index) {
  await ignoreConflict(
    databases.createIndex(DATABASE_ID, collectionId, index.key, index.type, index.attributes, index.orders)
  );
}

const COLLECTIONS = [
  {
    id: 'categories',
    name: 'Categories',
    attributes: [
      { key: 'user_id', type: 'string', size: 64 },
      { key: 'name', type: 'string', size: 128, required: true },
      { key: 'icon', type: 'string', size: 16, required: true },
      { key: 'color', type: 'string', size: 16, required: true },
      { key: 'is_default', type: 'boolean', required: true },
    ],
    indexes: [
      { key: 'idx_is_default', type: IndexType.Key, attributes: ['is_default'] },
      { key: 'idx_user_id', type: IndexType.Key, attributes: ['user_id'] },
    ],
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    attributes: [
      { key: 'user_id', type: 'string', size: 64, required: true },
      { key: 'name', type: 'string', size: 128, required: true },
      { key: 'phone', type: 'string', size: 32 },
      { key: 'email', type: 'string', size: 128 },
      { key: 'address', type: 'string', size: 512 },
    ],
    indexes: [
      { key: 'idx_user_id', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'idx_name', type: IndexType.Key, attributes: ['name'] },
    ],
  },
  {
    id: 'products',
    name: 'Products',
    attributes: [
      { key: 'user_id', type: 'string', size: 64, required: true },
      { key: 'name', type: 'string', size: 256, required: true },
      { key: 'category_id', type: 'string', size: 64 },
      { key: 'barcode', type: 'string', size: 64 },
      { key: 'batch_number', type: 'string', size: 64 },
      { key: 'manufacture_date', type: 'string', size: 32 },
      { key: 'expiry_date', type: 'string', size: 32, required: true },
      { key: 'quantity', type: 'integer', required: true, min: 0, max: 1000000000 },
      { key: 'unit', type: 'string', size: 32, required: true },
      { key: 'supplier_id', type: 'string', size: 64 },
      { key: 'price', type: 'float', min: 0, max: 1000000000 },
      { key: 'location', type: 'string', size: 128 },
      { key: 'notes', type: 'string', size: 2000 },
      { key: 'image_url', type: 'string', size: 1024 },
      { key: 'is_archived', type: 'boolean', required: true },
    ],
    indexes: [
      { key: 'idx_user_id', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'idx_is_archived', type: IndexType.Key, attributes: ['is_archived'] },
      { key: 'idx_expiry_date', type: IndexType.Key, attributes: ['expiry_date'] },
      { key: 'idx_category_id', type: IndexType.Key, attributes: ['category_id'] },
      { key: 'idx_supplier_id', type: IndexType.Key, attributes: ['supplier_id'] },
      { key: 'idx_barcode', type: IndexType.Key, attributes: ['barcode'] },
    ],
  },
  {
    id: 'notification_settings',
    name: 'Notification Settings',
    attributes: [
      { key: 'user_id', type: 'string', size: 64, required: true },
      { key: 'days_before', type: 'integer', required: true, min: 0, max: 365 },
      { key: 'is_enabled', type: 'boolean', required: true },
      { key: 'channel', type: 'string', size: 16, required: true },
    ],
    indexes: [
      { key: 'idx_user_id', type: IndexType.Key, attributes: ['user_id'] },
      {
        key: 'idx_unique_setting',
        type: IndexType.Unique,
        attributes: ['user_id', 'days_before', 'channel'],
      },
    ],
  },
  {
    id: 'notification_logs',
    name: 'Notification Logs',
    attributes: [
      { key: 'user_id', type: 'string', size: 64, required: true },
      { key: 'product_id', type: 'string', size: 64, required: true },
      { key: 'days_before', type: 'integer', required: true, min: 0, max: 365 },
      { key: 'status', type: 'string', size: 16, required: true },
      { key: 'sent_at', type: 'string', size: 32 },
    ],
    indexes: [
      { key: 'idx_user_id', type: IndexType.Key, attributes: ['user_id'] },
      { key: 'idx_product_id', type: IndexType.Key, attributes: ['product_id'] },
    ],
  },
  {
    id: 'user_profiles',
    name: 'User Profiles',
    attributes: [
      { key: 'full_name', type: 'string', size: 256 },
      { key: 'avatar_url', type: 'string', size: 1024 },
    ],
    indexes: [],
  },
];

const DEFAULT_CATEGORIES = [
  { name: 'Dairy', icon: '🥛', color: '#00D4FF' },
  { name: 'Grocery', icon: '🥫', color: '#00FF94' },
  { name: 'Fruits', icon: '🍎', color: '#FF6B35' },
  { name: 'Vegetables', icon: '🥦', color: '#4ADE80' },
  { name: 'Medicines', icon: '💊', color: '#A855F7' },
  { name: 'Cosmetics', icon: '🧴', color: '#F472B6' },
  { name: 'Frozen Food', icon: '🧊', color: '#38BDF8' },
  { name: 'Bakery', icon: '🍞', color: '#F59E0B' },
  { name: 'Beverages', icon: '🧃', color: '#FB923C' },
  { name: 'Electronics', icon: '📱', color: '#818CF8' },
  { name: 'Others', icon: '📦', color: '#94A3B8' },
];

async function exists(getPromise) {
  try {
    await getPromise;
    return true;
  } catch (err) {
    if (err.code === 404) return false;
    throw err;
  }
}

async function ensureDatabase() {
  console.log(`→ Database "${DATABASE_ID}"`);
  if (await exists(databases.get(DATABASE_ID))) return;
  await databases.create(DATABASE_ID, 'Expiry Dashboard');
}

async function ensureCollection(collection) {
  console.log(`→ Collection "${collection.id}"`);
  if (!(await exists(databases.getCollection(DATABASE_ID, collection.id)))) {
    await databases.createCollection(
      DATABASE_ID,
      collection.id,
      collection.name,
      [Permission.create(Role.users())],
      true // documentSecurity: per-document permissions control read/update/delete
    );
  }

  for (const attr of collection.attributes) {
    await createAttribute(collection.id, attr);
  }

  if (collection.attributes.length > 0) {
    await waitUntilAvailable(collection.id, collection.attributes.map(a => a.key));
  }

  for (const index of collection.indexes) {
    await createIndex(collection.id, index);
  }
}

async function seedDefaultCategories() {
  console.log('→ Seeding default categories');
  const { documents: existing } = await databases.listDocuments(DATABASE_ID, 'categories');
  const existingNames = new Set(existing.filter(d => d.is_default).map(d => d.name));

  for (const category of DEFAULT_CATEGORIES) {
    if (existingNames.has(category.name)) continue;
    await databases.createDocument(
      DATABASE_ID,
      'categories',
      ID.unique(),
      { ...category, is_default: true },
      [Permission.read(Role.users())]
    );
  }
}

async function main() {
  await ensureDatabase();
  for (const collection of COLLECTIONS) {
    await ensureCollection(collection);
  }
  await seedDefaultCategories();
  console.log('\nDone. Set these in your .env:');
  console.log(`  EXPO_PUBLIC_APPWRITE_ENDPOINT=${ENDPOINT}`);
  console.log(`  EXPO_PUBLIC_APPWRITE_PROJECT_ID=${PROJECT_ID}`);
  console.log(`  EXPO_PUBLIC_APPWRITE_DATABASE_ID=${DATABASE_ID}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
