-- ============================================================
-- EXPIRY DASHBOARD - SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '📦',
  color       TEXT NOT NULL DEFAULT '#94A3B8',
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Suppliers ────────────────────────────────────────────────────────────────
CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  barcode           TEXT,
  batch_number      TEXT,
  manufacture_date  DATE,
  expiry_date       DATE NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1,
  unit              TEXT NOT NULL DEFAULT 'pcs',
  supplier_id       UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  price             DECIMAL(10, 2),
  location          TEXT,
  notes             TEXT,
  image_url         TEXT,
  is_archived       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notification Settings ────────────────────────────────────────────────────
CREATE TABLE notification_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days_before INTEGER NOT NULL,
  is_enabled  BOOLEAN NOT NULL DEFAULT true,
  channel     TEXT NOT NULL DEFAULT 'push',
  UNIQUE(user_id, days_before, channel)
);

-- ─── Notification Logs ────────────────────────────────────────────────────────
CREATE TABLE notification_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  days_before INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Profiles ────────────────────────────────────────────────────────────
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Categories: users can see default categories + their own
CREATE POLICY "categories_select" ON categories FOR SELECT
  USING (is_default = true OR user_id = auth.uid());
CREATE POLICY "categories_insert" ON categories FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories_update" ON categories FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "categories_delete" ON categories FOR DELETE
  USING (user_id = auth.uid() AND is_default = false);

-- Suppliers: users own their suppliers
CREATE POLICY "suppliers_all" ON suppliers FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Products: users own their products
CREATE POLICY "products_all" ON products FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notification Settings
CREATE POLICY "notif_settings_all" ON notification_settings FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notification Logs
CREATE POLICY "notif_logs_all" ON notification_logs FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- User Profiles
CREATE POLICY "profiles_all" ON user_profiles FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- DEFAULT CATEGORIES SEED DATA
-- ============================================================

INSERT INTO categories (name, icon, color, is_default) VALUES
  ('Dairy',          '🥛', '#00D4FF', true),
  ('Grocery',        '🥫', '#00FF94', true),
  ('Fruits',         '🍎', '#FF6B35', true),
  ('Vegetables',     '🥦', '#4ADE80', true),
  ('Medicines',      '💊', '#A855F7', true),
  ('Cosmetics',      '🧴', '#F472B6', true),
  ('Frozen Food',    '🧊', '#38BDF8', true),
  ('Bakery',         '🍞', '#F59E0B', true),
  ('Beverages',      '🧃', '#FB923C', true),
  ('Electronics',    '📱', '#818CF8', true),
  ('Others',         '📦', '#94A3B8', true);

-- Default notification settings for new users (call after signup)
-- INSERT INTO notification_settings (user_id, days_before, is_enabled, channel)
-- VALUES (auth.uid(), 1, true, 'push'), (auth.uid(), 3, true, 'push'),
--        (auth.uid(), 7, true, 'push'), (auth.uid(), 15, true, 'push'),
--        (auth.uid(), 30, true, 'push');
