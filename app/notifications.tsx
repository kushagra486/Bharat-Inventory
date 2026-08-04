import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { getProducts } from '@/lib/db';
import { getExpiryLabel, getExpiryStatusColor, sortByExpiry } from '@/lib/utils';
import { Product } from '@/types';

export default function NotificationsScreen() {
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const products = await getProducts();
    const relevant = products
      .filter(p => p.expiry_status === 'expired' || p.expiry_status === 'today' || p.expiry_status === 'soon')
      .sort(sortByExpiry);
    setAlerts(relevant);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={alerts}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentCyan} />}
        renderItem={({ item }) => {
          const color = getExpiryStatusColor(item.expiry_status!);
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/products/${item.id}`)}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.cardIcon}>{item.category?.icon ?? '📦'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.cardMeta, { color }]}>{getExpiryLabel(item.expiry_date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySubtitle}>Nothing expiring soon</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  list: { padding: SPACING.xl, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardIcon: { fontSize: 24 },
  cardName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  cardMeta: { fontSize: FONT_SIZES.xs, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textSecondary },
  emptySubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.sm },
});
