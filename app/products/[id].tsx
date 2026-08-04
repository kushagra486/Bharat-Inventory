import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { getProductById, deleteProduct, archiveProduct, duplicateProduct } from '@/lib/db';
import { formatDate, getExpiryLabel, getExpiryStatusColor, getExpiryStatusLabel, formatCurrency } from '@/lib/utils';
import { Product } from '@/types';

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={18} color={COLORS.accentCyan} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const p = await getProductById(id);
    setProduct(p);
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleArchiveToggle() {
    if (!product) return;
    setBusy(true);
    try {
      await archiveProduct(product.id, !product.is_archived);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update product');
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate() {
    if (!product) return;
    setBusy(true);
    try {
      await duplicateProduct(product.id);
      Alert.alert('Duplicated', `"${product.name}" was duplicated.`);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to duplicate product');
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (!product) return;
    Alert.alert('Delete Product', `Delete "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setBusy(true);
          try {
            await deleteProduct(product.id);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete product');
            setBusy(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.accentCyan} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Product not found</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const color = getExpiryStatusColor(product.expiry_status!);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={() => router.push(`/products/add?id=${product.id}`)}>
          <Ionicons name="create-outline" size={22} color={COLORS.accentCyan} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>{product.category?.icon ?? '📦'}</Text>
          <Text style={styles.heroName}>{product.name}</Text>
          <Text style={styles.heroCategory}>{product.category?.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{getExpiryLabel(product.expiry_date)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <DetailRow icon="calendar-outline" label="Expiry Date" value={formatDate(product.expiry_date)} />
          <DetailRow icon="calendar-clear-outline" label="Manufacture Date" value={product.manufacture_date ? formatDate(product.manufacture_date) : undefined} />
          <DetailRow icon="cube-outline" label="Quantity" value={`${product.quantity} ${product.unit}`} />
          <DetailRow icon="barcode-outline" label="Barcode" value={product.barcode} />
          <DetailRow icon="pricetag-outline" label="Batch Number" value={product.batch_number} />
          <DetailRow icon="location-outline" label="Location" value={product.location} />
          <DetailRow icon="business-outline" label="Supplier" value={product.supplier?.name} />
          <DetailRow icon="cash-outline" label="Price" value={product.price ? formatCurrency(product.price) : undefined} />
          <DetailRow icon="document-text-outline" label="Notes" value={product.notes} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDuplicate} disabled={busy}>
            <Ionicons name="copy-outline" size={20} color={COLORS.textPrimary} />
            <Text style={styles.actionText}>Duplicate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleArchiveToggle} disabled={busy}>
            <Ionicons name={product.is_archived ? 'arrow-undo-outline' : 'archive-outline'} size={20} color={COLORS.textPrimary} />
            <Text style={styles.actionText}>{product.is_archived ? 'Restore' : 'Archive'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete} disabled={busy}>
            <Ionicons name="trash-outline" size={20} color={COLORS.expired} />
            <Text style={[styles.actionText, { color: COLORS.expired }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { flex: 1, textAlign: 'center', marginHorizontal: SPACING.md, fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.xl, paddingBottom: 100 },
  hero: { alignItems: 'center', marginBottom: SPACING.xl },
  heroIcon: { fontSize: 56, marginBottom: SPACING.sm },
  heroName: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  heroCategory: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: RADIUS.sm, borderWidth: 1,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginTop: SPACING.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  detailIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: `${COLORS.accentCyan}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  detailValue: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, height: 50,
  },
  deleteBtn: { borderColor: `${COLORS.expired}40` },
  actionText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary },
  backLink: { marginTop: SPACING.lg },
  backLinkText: { fontSize: FONT_SIZES.md, color: COLORS.accentCyan },
});
