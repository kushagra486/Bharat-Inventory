import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/hooks/useProducts';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { getExpiryStatusColor, getExpiryStatusLabel, formatDate } from '@/lib/utils';
import { ExpiryStatus, Product } from '@/types';

const STATUS_FILTERS: { label: string; value: ExpiryStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: '❌ Expired', value: 'expired' },
  { label: '⚠️ Today', value: 'today' },
  { label: '🔔 Soon', value: 'soon' },
  { label: '✅ Safe', value: 'safe' },
];

function ProductCard({ product, onDelete, onArchive, onDuplicate }: {
  product: Product;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const color = getExpiryStatusColor(product.expiry_status!);

  function showActions() {
    Alert.alert(product.name, 'What would you like to do?', [
      { text: 'View / Edit', onPress: () => router.push(`/products/${product.id}`) },
      { text: 'Duplicate', onPress: () => onDuplicate(product.id) },
      { text: 'Archive', onPress: () => onArchive(product.id) },
      { text: 'Delete', style: 'destructive', onPress: () => {
        Alert.alert('Delete Product', `Delete "${product.name}"? This cannot be undone.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(product.id) },
        ]);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/products/${product.id}`)}
      onLongPress={showActions}
      activeOpacity={0.8}
    >
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconName}>
            <Text style={styles.cardIcon}>{product.category?.icon ?? '📦'}</Text>
            <View>
              <Text style={styles.cardName} numberOfLines={1}>{product.name}</Text>
              <Text style={styles.cardCategory}>{product.category?.name}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={showActions} style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{formatDate(product.expiry_date)}</Text>
          </View>
          {product.quantity && (
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{product.quantity} {product.unit}</Text>
            </View>
          )}
          {product.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>{product.location}</Text>
            </View>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>
            {getExpiryStatusLabel(product.expiry_status!)}
            {product.days_until_expiry !== undefined && product.days_until_expiry > 0
              ? ` · ${product.days_until_expiry}d`
              : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<ExpiryStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { products, loading, refresh, remove, archive, duplicate, setFilters } = useProducts({
    search,
    status: activeStatus,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  function handleSearchChange(text: string) {
    setSearch(text);
    setFilters(f => ({ ...f, search: text }));
  }

  function handleStatusFilter(status: ExpiryStatus | 'all') {
    setActiveStatus(status);
    setFilters(f => ({ ...f, status }));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/products/scan')}>
            <Ionicons name="barcode-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/products/add')}>
            <Ionicons name="add" size={20} color={COLORS.textInverse} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, barcode, location..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearchChange}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={i => i.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeStatus === item.value && styles.filterChipActive]}
            onPress={() => handleStatusFilter(item.value)}
          >
            <Text style={[styles.filterText, activeStatus === item.value && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onDelete={remove}
            onArchive={archive}
            onDuplicate={duplicate}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentCyan} />
        }
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No products found' : 'No products yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try different keywords' : 'Tap + Add to get started'}
            </Text>
          </View>
        )}
        ListFooterComponent={() => (
          <Text style={styles.countText}>{products.length} product{products.length !== 1 ? 's' : ''}</Text>
        )}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  headerActions: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  iconBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 40,
  },
  addBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textInverse },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    marginHorizontal: SPACING.xl, marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md, height: 46,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.md },
  filterList: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, gap: SPACING.sm },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: `${COLORS.accentCyan}20`, borderColor: COLORS.accentCyan },
  filterText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  filterTextActive: { color: COLORS.accentCyan, fontWeight: '600' },
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: 100 },
  productCard: {
    flexDirection: 'row', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.sm, overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIconName: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  cardIcon: { fontSize: 28 },
  cardName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, maxWidth: 180 },
  cardCategory: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  moreBtn: { padding: SPACING.xs },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: RADIUS.sm,
    borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 3,
    marginTop: SPACING.sm,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textSecondary },
  emptySubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.sm },
  countText: {
    textAlign: 'center', fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted, paddingVertical: SPACING.sm,
  },
});
