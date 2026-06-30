import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { COLORS, SPACING, RADIUS, FONT_SIZES, CHART_COLORS } from '@/constants';
import { getDashboardStats, getProductsByCategory, getProducts } from '@/lib/db';
import { getExpiryStatus } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;

const CHART_CONFIG = {
  backgroundColor: COLORS.bgCard,
  backgroundGradientFrom: COLORS.bgCard,
  backgroundGradientTo: COLORS.bgCard,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
  labelColor: () => COLORS.textSecondary,
  style: { borderRadius: RADIUS.lg },
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.accentCyan },
};

export default function AnalyticsScreen() {
  const [stats, setStats] = useState({ total: 0, expired: 0, expiring_today: 0, expiring_soon: 0, safe: 0 });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any>({ labels: [], datasets: [{ data: [] }] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const [s, cats, products] = await Promise.all([
        getDashboardStats(),
        getProductsByCategory(),
        getProducts(),
      ]);

      setStats(s);

      // Pie chart data
      setCategoryData(
        cats.slice(0, 6).map((c: any, i: number) => ({
          name: c.name,
          population: c.count,
          color: c.color || CHART_COLORS[i % CHART_COLORS.length],
          legendFontColor: COLORS.textSecondary,
          legendFontSize: 12,
        }))
      );

      // Monthly bar chart - products expiring per month (next 6 months)
      const months: string[] = [];
      const expiryCounts: number[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        months.push(format(d, 'MMM'));
        const start = startOfMonth(d).toISOString().split('T')[0];
        const end = endOfMonth(d).toISOString().split('T')[0];
        const count = products.filter(p => p.expiry_date >= start && p.expiry_date <= end).length;
        expiryCounts.push(count);
      }

      setMonthlyData({
        labels: months,
        datasets: [{ data: expiryCounts, color: () => COLORS.accentCyan }],
      });

    } finally {
      setLoading(false);
    }
  }

  const statusData = [
    { label: 'Expired', value: stats.expired, color: COLORS.expired },
    { label: 'Today', value: stats.expiring_today, color: COLORS.today },
    { label: 'Soon', value: stats.expiring_soon, color: COLORS.soon },
    { label: 'Safe', value: stats.safe, color: COLORS.safe },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Health</Text>
          <View style={styles.healthGrid}>
            {statusData.map(s => (
              <View key={s.label} style={[styles.healthCard, { borderTopColor: s.color }]}>
                <Text style={[styles.healthValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.healthLabel}>{s.label}</Text>
                <View style={styles.healthBar}>
                  <View style={[styles.healthBarFill, {
                    width: `${stats.total > 0 ? (s.value / stats.total) * 100 : 0}%`,
                    backgroundColor: s.color,
                  }]} />
                </View>
                <Text style={styles.healthPercent}>
                  {stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Expiry Chart */}
        {monthlyData.datasets[0].data.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Products Expiring Per Month</Text>
            <View style={styles.chartCard}>
              <BarChart
                data={monthlyData}
                width={CHART_WIDTH - SPACING.xl * 2}
                height={200}
                chartConfig={CHART_CONFIG}
                style={styles.chart}
                showValuesOnTopOfBars
                withInnerLines={false}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
              />
            </View>
          </View>
        )}

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Products by Category</Text>
            <View style={styles.chartCard}>
              <PieChart
                data={categoryData}
                width={CHART_WIDTH - SPACING.xl * 2}
                height={200}
                chartConfig={CHART_CONFIG}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                absolute
              />
            </View>
          </View>
        )}

        {/* Summary Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCard}>
            {[
              { label: 'Total Products', value: stats.total, icon: '📦' },
              { label: 'Need Attention', value: stats.expired + stats.expiring_today + stats.expiring_soon, icon: '⚠️' },
              { label: 'Safe Products', value: stats.safe, icon: '✅' },
              { label: 'Waste Risk', value: stats.expired, icon: '🗑️' },
            ].map(item => (
              <View key={item.label} style={styles.summaryRow}>
                <Text style={styles.summaryIcon}>{item.icon}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
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
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  healthCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    borderTopWidth: 3, padding: SPACING.md,
  },
  healthValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800' },
  healthLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  healthBar: {
    height: 4, backgroundColor: COLORS.bgElevated, borderRadius: 2,
    marginTop: SPACING.sm, overflow: 'hidden',
  },
  healthBarFill: { height: '100%', borderRadius: 2 },
  healthPercent: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  chartCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
    alignItems: 'center',
  },
  chart: { borderRadius: RADIUS.md },
  summaryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  summaryIcon: { fontSize: 22, width: 32 },
  summaryLabel: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
});
