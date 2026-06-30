import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import {
  parseCsvText, parseExcelBuffer, buildImportRows,
  generateCsvTemplate, ImportRow,
} from '@/lib/csvImport';
import { addProduct, getProducts, getCategories, getSuppliers } from '@/lib/db';
import { Category, Supplier } from '@/types';
import * as Sharing from 'expo-sharing';

type Stage = 'pick' | 'preview' | 'importing' | 'done';

export default function ImportScreen() {
  const [stage, setStage] = useState<Stage>('pick');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [resultSummary, setResultSummary] = useState({ success: 0, failed: 0 });

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'text/csv',
        'text/comma-separated-values',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setFileName(asset.name);

    try {
      const isExcel = /\.(xlsx|xls)$/i.test(asset.name);
      let rawRows: Record<string, string>[];

      if (isExcel) {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        const buffer = base64ToArrayBuffer(base64);
        rawRows = parseExcelBuffer(buffer);
      } else {
        const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
        rawRows = parseCsvText(text);
      }

      if (rawRows.length === 0) {
        Alert.alert('Empty File', 'No rows found in this file.');
        return;
      }

      // Pull existing barcodes for duplicate detection — single query, no per-row API calls.
      const existing = await getProducts();
      const existingBarcodes = new Set(existing.map(p => p.barcode).filter(Boolean) as string[]);

      const result2 = buildImportRows(rawRows, existingBarcodes);
      setRows(result2.rows);
      setStage('preview');
    } catch (err: any) {
      Alert.alert('Parse Error', err.message || 'Could not read this file. Check the format and try again.');
    }
  }

  async function handleDownloadTemplate() {
    const csv = generateCsvTemplate();
    const path = FileSystem.cacheDirectory + 'bharat-inventory-template.csv';
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Save CSV Template' });
    }
  }

  async function handleImport() {
    const validRows = rows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      Alert.alert('Nothing To Import', 'No valid rows to import. Fix the errors and try again.');
      return;
    }

    setStage('importing');
    setProgress(0);

    const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);
    const catMap = new Map(categories.map((c: Category) => [c.name.toLowerCase(), c.id]));
    const supMap = new Map(suppliers.map((s: Supplier) => [s.name.toLowerCase(), s.id]));
    const othersId = catMap.get('others');

    let success = 0, failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const categoryName = (row.parsed as any).category_name?.toLowerCase();
        const supplierName = (row.parsed as any).supplier_name?.toLowerCase();

        await addProduct({
          name: row.parsed.name!,
          category_id: (categoryName && catMap.get(categoryName)) || othersId || categories[0]?.id,
          barcode: row.parsed.barcode,
          batch_number: row.parsed.batch_number,
          manufacture_date: row.parsed.manufacture_date,
          expiry_date: row.parsed.expiry_date!,
          quantity: row.parsed.quantity ?? 1,
          unit: row.parsed.unit ?? 'pcs',
          supplier_id: supplierName ? supMap.get(supplierName) : undefined,
          price: row.parsed.price,
          location: row.parsed.location,
          notes: row.parsed.notes,
        });
        success++;
      } catch {
        failed++;
      }
      setProgress((i + 1) / validRows.length);
    }

    setResultSummary({ success, failed });
    setStage('done');
  }

  // ─── Pick Stage ─────────────────────────────────────────────────────────────
  if (stage === 'pick') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Import Products" />
        <View style={styles.pickStage}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.accentOrange} />
          <Text style={styles.pickTitle}>Bulk Import from CSV / Excel</Text>
          <Text style={styles.pickText}>
            Upload a spreadsheet to add many products at once. Every row is validated and shown to you before anything is saved.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handlePickFile}>
            <Ionicons name="cloud-upload-outline" size={20} color={COLORS.textInverse} />
            <Text style={styles.primaryBtnText}>Choose File</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownloadTemplate}>
            <Ionicons name="download-outline" size={18} color={COLORS.accentOrange} />
            <Text style={styles.secondaryBtnText}>Download CSV Template</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>Supports .csv, .xlsx, .xls — no row limit.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Preview Stage ──────────────────────────────────────────────────────────
  if (stage === 'preview') {
    const validCount = rows.filter(r => r.errors.length === 0).length;
    const errorCount = rows.length - validCount;
    const dupCount = rows.filter(r => r.isDuplicate).length;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Preview Import" onBack={() => setStage('pick')} />
        <View style={styles.summaryBar}>
          <SummaryChip label="Valid" value={validCount} color={COLORS.safe} />
          <SummaryChip label="Errors" value={errorCount} color={COLORS.expired} />
          <SummaryChip label="Duplicates" value={dupCount} color={COLORS.today} />
        </View>

        <ScrollView style={styles.previewList} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }}>
          {rows.map((row, i) => (
            <View
              key={i}
              style={[
                styles.previewRow,
                row.errors.length > 0 && styles.previewRowError,
                row.isDuplicate && styles.previewRowDup,
              ]}
            >
              <Text style={styles.previewName} numberOfLines={1}>{row.parsed.name || '(no name)'}</Text>
              <Text style={styles.previewMeta}>
                {row.parsed.expiry_date || 'no expiry'} · Qty {row.parsed.quantity ?? 1}
              </Text>
              {row.errors.length > 0 && (
                <Text style={styles.previewError}>{row.errors.join(', ')}</Text>
              )}
              {row.isDuplicate && (
                <Text style={styles.previewDupText}>⚠️ Barcode already exists — will still import as new entry</Text>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, validCount === 0 && styles.btnDisabled]}
            onPress={handleImport}
            disabled={validCount === 0}
          >
            <Text style={styles.primaryBtnText}>Import {validCount} Product{validCount !== 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Importing Stage ────────────────────────────────────────────────────────
  if (stage === 'importing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerStage}>
          <ActivityIndicator size="large" color={COLORS.accentOrange} />
          <Text style={styles.pickTitle}>Importing...</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.hint}>{Math.round(progress * 100)}%</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Done Stage ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerStage}>
        <Ionicons name="checkmark-circle" size={64} color={COLORS.safe} />
        <Text style={styles.pickTitle}>Import Complete</Text>
        <Text style={styles.pickText}>
          {resultSummary.success} product{resultSummary.success !== 1 ? 's' : ''} added successfully.
          {resultSummary.failed > 0 ? ` ${resultSummary.failed} failed.` : ''}
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/dashboard')}>
          <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => (onBack ? onBack() : router.back())}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: `${color}40` }]}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = (global as any).atob ? (global as any).atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  pickStage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl, gap: SPACING.md },
  centerStage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl, gap: SPACING.md },
  pickTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginTop: SPACING.md },
  pickText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.accentOrange, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl, height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.lg, alignSelf: 'stretch',
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textInverse },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  secondaryBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.accentOrange, fontWeight: '600' },
  hint: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.sm },
  summaryBar: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.lg },
  chip: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: SPACING.md,
  },
  chipValue: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  chipLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  previewList: { flex: 1 },
  previewRow: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  previewRowError: { borderColor: `${COLORS.expired}60` },
  previewRowDup: { borderColor: `${COLORS.today}60` },
  previewName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  previewMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  previewError: { fontSize: FONT_SIZES.xs, color: COLORS.expired, marginTop: 4 },
  previewDupText: { fontSize: FONT_SIZES.xs, color: COLORS.today, marginTop: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.lg, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  progressTrack: {
    width: '100%', height: 8, borderRadius: 4, backgroundColor: COLORS.bgCard, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.accentOrange },
});
