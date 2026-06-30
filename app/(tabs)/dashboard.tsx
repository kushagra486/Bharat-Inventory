import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useProducts } from '@/hooks/useProducts';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { getExpiryStatusColor, formatDateShort, getExpiryLabel } from '@/lib/utils';
import { getProductsByCategory } from '@/lib/db';
import { ExpiryStatus, Product } from '@/types';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────
function AlertItem({ product }: { product: Product }) {
  const color = getExpiryStatusColor(product.expiry_status!);
  return (
    <TouchableOpacity
      style={styles.alertItem}
      onPress={() => router.push(`/products/${product.id}`)}
    >
      <View style={[styles.alertDot, { backgroundColor: color }]} />
      <View style={styles.alertInfo}>
        <Text style={styles.alertName}>{product.name}</Text>
        <Text style={[styles.alertDate, { color }]}>{getExpiryLabel(product.expiry_date)}</Text>
      </View>
      <Text style={styles.alertCategory}>{product.category?.icon}</Text>
    </TouchableOpacity>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────────
function ProductRow({ product }: { product: Product }) {
  const color = getExpiryStatusColor(product.expiry_status!);
  return (
    <TouchableOpacity
      style={styles.productRow}
      onPress={() => router.push(`/products/${product.id}`)}
    >
      <View style={styles.productIcon}>
        <Text style={{ fontSize: 22 }}>{product.category?.icon ?? '📦'}</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.productCategory}>{product.category?.name}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
        <Text style={[styles.statusText, { color }]}>{formatDateShort(product.expiry_date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { products, loading, refresh } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);

  const alerts = products.filter(p =>
    p.expiry_status === 'expired' || p.expiry_status === 'today' || p.expiry_status === 'soon'
  ).slice(0, 5);

  const recentProducts = products.slice(0, 6);

  useEffect(() => {
    getProductsByCategory().then(setCategoryStats);
  }, [products]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentCyan} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
            <Text style={styles.headerSub}>Here's your inventory status</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            {alerts.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{alerts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Total" value={stats.total} color={COLORS.accentCyan} icon="📦" />
          <StatCard label="Expired" value={stats.expired} color={COLORS.expired} icon="❌" />
          <StatCard label="Today" value={stats.expiring_today} color={COLORS.today} icon="⚠️" />
          <StatCard label="Soon" value={stats.expiring_soon} color={COLORS.soon} icon="🔔" />
          <StatCard label="Safe" value={stats.safe} color={COLORS.safe} icon="✅" />
          <TouchableOpacity
            style={[styles.statCard, styles.addCard]}
            onPress={() => router.push('/products/add')}
          >
            <Ionicons name="add-circle-outline" size={28} color={COLORS.accentCyan} />
            <Text style={[styles.statLabel, { color: COLORS.accentCyan }]}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Alerts</Text>
              <TouchableOpacity onPress={() => router.push('/products?status=soon')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {alerts.map(p => <AlertItem key={p.id} product={p} />)}
            </View>
          </View>
        )}

        {/* Categories */}
        {categoryStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.md }}>
              {categoryStats.map((cat, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.categoryChip, { borderColor: `${cat.color}40` }]}
                  onPress={() => router.push(`/products?category=${cat.name}`)}
                >
                  <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryChipName}>{cat.name}</Text>
                  <Text style={[styles.categoryChipCount, { color: cat.color }]}>{cat.count}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🕒 Recent Products</Text>
            <TouchableOpacity onPress={() => router.push('/products')}>
              <Text style={styles.seeAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {recentProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No products yet</Text>
                <TouchableOpacity onPress={() => router.push('/products/add')}>
                  <Text style={styles.emptyAction}>Add your first product →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentProducts.map(p => <ProductRow key={p.id} product={p} />)
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
  },
  greeting: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  notifBadge: {
    position: 'absolute', top: 6, right: 6, width: 16, height: 16,
    borderRadius: 8, backgroundColor: COLORS.expired,
    alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, marginTop: SPACING.md,
  },
  statCard: {
    flex: 1, minWidth: '30%', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    borderLeftWidth: 3, alignItems: 'center',
  },
  addCard: { borderLeftColor: COLORS.accentCyan, borderLeftWidth: 1, borderColor: `${COLORS.accentCyan}30` },
  statIcon: { fontSize: 22, marginBottom: SPACING.xs },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  section: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  seeAll: { fontSize: FONT_SIZES.sm, color: COLORS.accentCyan },
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  alertItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertInfo: { flex: 1 },
  alertName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  alertDate: { fontSize: FONT_SIZES.xs, marginTop: 2 },
  alertCategory: { fontSize: 20 },
  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  productIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  productCategory: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.sm, borderWidth: 1,
  },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  categoryChipIcon: { fontSize: 18 },
  categoryChipName: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  categoryChipCount: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: SPACING.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary },
  emptyAction: { fontSize: FONT_SIZES.sm, color: COLORS.accentCyan, marginTop: SPACING.sm },
});
