import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { getProductsForMonth } from '@/lib/db';
import { getExpiryStatusColor } from '@/lib/utils';
import { Product } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    getProductsForMonth(year, month).then(setProducts);
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      const dayStr = format(selectedDate, 'yyyy-MM-dd');
      const filtered = products.filter(p => p.expiry_date === dayStr);
      setSelectedProducts(filtered);
    }
  }, [selectedDate, products]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startWeekDay = startOfMonth(currentMonth).getDay();
  const blanks = Array(startWeekDay).fill(null);

  function getProductsForDay(date: Date): Product[] {
    const dayStr = format(date, 'yyyy-MM-dd');
    return products.filter(p => p.expiry_date === dayStr);
  }

  function getDayDotColor(date: Date): string | null {
    const dayProducts = getProductsForDay(date);
    if (!dayProducts.length) return null;
    const hasExpired = dayProducts.some(p => p.expiry_status === 'expired');
    const hasToday = dayProducts.some(p => p.expiry_status === 'today');
    const hasSoon = dayProducts.some(p => p.expiry_status === 'soon');
    if (hasExpired) return COLORS.expired;
    if (hasToday) return COLORS.today;
    if (hasSoon) return COLORS.soon;
    return COLORS.safe;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentMonth(m => subMonths(m, 1))}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentMonth(m => addMonths(m, 1))}>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(d => (
              <Text key={d} style={styles.weekday}>{d}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {blanks.map((_, i) => <View key={`blank-${i}`} style={styles.dayCell} />)}
            {daysInMonth.map(date => {
              const dotColor = getDayDotColor(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentDay = isToday(date);
              const hasProducts = !!dotColor;

              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isCurrentDay && styles.dayCellToday,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isCurrentDay && styles.dayTextToday,
                  ]}>
                    {format(date, 'd')}
                  </Text>
                  {dotColor && (
                    <View style={[styles.dayDot, { backgroundColor: dotColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: COLORS.expired, label: 'Expired' },
            { color: COLORS.today, label: 'Today' },
            { color: COLORS.soon, label: 'Soon' },
            { color: COLORS.safe, label: 'Safe' },
          ].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* Selected Day Products */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isToday(selectedDate) ? "Today's Products" : format(selectedDate, 'dd MMM yyyy')}
            </Text>
            {selectedProducts.length === 0 ? (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>No products expiring on this day</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {selectedProducts.map(product => {
                  const color = getExpiryStatusColor(product.expiry_status!);
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productRow}
                      onPress={() => router.push(`/products/${product.id}`)}
                    >
                      <Text style={styles.productIcon}>{product.category?.icon ?? '📦'}</Text>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productCategory}>{product.category?.name}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
                        <Text style={[styles.statusText, { color }]}>{product.expiry_status}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Upcoming Expirations Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month — {products.length} products</Text>
          <View style={styles.card}>
            {products.slice(0, 8).map(product => {
              const color = getExpiryStatusColor(product.expiry_status!);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productRow}
                  onPress={() => router.push(`/products/${product.id}`)}
                >
                  <Text style={styles.productIcon}>{product.category?.icon ?? '📦'}</Text>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={[styles.productDate, { color }]}>
                      {format(parseISO(product.expiry_date), 'dd MMM')}
                    </Text>
                  </View>
                  <View style={[styles.statusDot2, { backgroundColor: color }]} />
                </TouchableOpacity>
              );
            })}
            {products.length === 0 && (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>No products expiring this month</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.md,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  monthTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  calendarCard: {
    marginHorizontal: SPACING.xl, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  weekday: { flex: 1, textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center',
    justifyContent: 'center', borderRadius: RADIUS.sm, padding: 2,
  },
  dayCellSelected: { backgroundColor: COLORS.accentCyan },
  dayCellToday: { borderWidth: 1, borderColor: COLORS.accentCyan },
  dayText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  dayTextSelected: { color: COLORS.textInverse, fontWeight: '700' },
  dayTextToday: { color: COLORS.accentCyan, fontWeight: '700' },
  dayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg,
    marginVertical: SPACING.md, paddingHorizontal: SPACING.xl,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  productIcon: { fontSize: 24 },
  productInfo: { flex: 1 },
  productName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  productCategory: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  productDate: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.sm, borderWidth: 1,
  },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '600', textTransform: 'capitalize' },
  statusDot2: { width: 10, height: 10, borderRadius: 5 },
  emptyDay: { padding: SPACING.xl, alignItems: 'center' },
  emptyDayText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
});
