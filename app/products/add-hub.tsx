import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';

// ─── Method Registry ────────────────────────────────────────────────────────────
// All methods are always available — none are gated, paywalled, or marked
// "coming soon". Only one method screen is ever mounted at a time because
// each card performs a full navigation (router.push), not a modal/overlay,
// so there is never more than one capture session (camera/OCR/file-picker)
// active simultaneously.

type Method = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  time: string;
  route: string;
  color: string;
};

const METHODS: Method[] = [
  {
    key: 'manual',
    icon: 'create-outline',
    title: 'Manual Entry',
    description: 'Type in all product details yourself',
    time: '~1 min',
    route: '/products/add',
    color: COLORS.accentCyan,
  },
  {
    key: 'scan',
    icon: 'barcode-outline',
    title: 'Barcode Scan',
    description: 'Scan a barcode — auto-fills name, brand & category when found online',
    time: '~10 sec',
    route: '/products/scan',
    color: COLORS.accentGreen,
  },
  {
    key: 'ocr',
    icon: 'camera-outline',
    title: 'Label Scanner (OCR)',
    description: 'Photograph the label — reads expiry, batch & name automatically',
    time: '~20 sec',
    route: '/products/ocr-scan',
    color: COLORS.accentPurple,
  },
  {
    key: 'import',
    icon: 'document-text-outline',
    title: 'CSV / Excel Import',
    description: 'Bulk-add many products at once from a spreadsheet',
    time: '~2 min',
    route: '/products/import',
    color: COLORS.accentOrange,
  },
];

function MethodCard({ method }: { method: Method }) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: `${method.color}40` }]}
      onPress={() => router.push(method.route as any)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${method.color}20` }]}>
        <Ionicons name={method.icon} size={26} color={method.color} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{method.title}</Text>
        <Text style={styles.cardDesc}>{method.description}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardTime, { color: method.color }]}>{method.time}</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function AddProductHubScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Products</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          Choose how you'd like to add a product. All methods are always available — pick whichever is fastest for you right now.
        </Text>

        {METHODS.map(m => <MethodCard key={m.key} method={m} />)}
      </ScrollView>
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
  scroll: { padding: SPACING.xl, paddingBottom: 100 },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.xl, lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1,
    padding: SPACING.lg, marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  cardDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardTime: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
});
