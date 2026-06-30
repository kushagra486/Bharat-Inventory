import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { getProducts } from '@/lib/db';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.permissionView}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permText}>Allow camera access to scan barcodes on products.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handleBarcodeScanned({ type, data }: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);

    // Check if product with this barcode exists
    const products = await getProducts({ barcode: data });

    if (products.length > 0) {
      Alert.alert(
        '✅ Product Found',
        `Found: ${products[0].name}`,
        [
          { text: 'View Product', onPress: () => router.replace(`/products/${products[0].id}`) },
          { text: 'Scan Again', onPress: () => setScanned(false) },
        ]
      );
    } else {
      Alert.alert(
        'Barcode Scanned',
        `Barcode: ${data}\n\nNo product found. Add a new product with this barcode?`,
        [
          { text: 'Add Product', onPress: () => router.replace({ pathname: '/products/add', params: { barcode: data } }) },
          { text: 'Scan Again', onPress: () => setScanned(false) },
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
        ]
      );
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView style={styles.topBar}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.scanTitle}>Scan Barcode</Text>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setTorch(t => !t)}>
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={24} color={torch ? COLORS.accentCyan : '#fff'} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Scanner frame */}
        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {!scanned && <View style={styles.scanLine} />}
          </View>
          <Text style={styles.scanHint}>
            {scanned ? 'Processing...' : 'Point camera at barcode or QR code'}
          </Text>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => router.push('/products/add')}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.accentCyan} />
            <Text style={styles.manualBtnText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backBtn: { padding: SPACING.md },
  permissionView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl },
  permIcon: { fontSize: 64, marginBottom: SPACING.lg },
  permTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  permText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  permBtn: {
    backgroundColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl, height: 50, alignItems: 'center',
    justifyContent: 'center', marginTop: SPACING.xl,
  },
  permBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textInverse },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  circleBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  scanTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: '#fff' },
  frameArea: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  frame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: COLORS.accentCyan, borderWidth: CORNER_WIDTH,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanLine: {
    width: FRAME_SIZE - 20, height: 2,
    backgroundColor: COLORS.accentCyan, opacity: 0.8,
  },
  scanHint: {
    marginTop: SPACING.xl, fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)', textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  bottomBar: {
    padding: SPACING.xl, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center',
  },
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: `${COLORS.accentCyan}60`,
    paddingHorizontal: SPACING.xl, height: 48,
  },
  manualBtnText: { fontSize: FONT_SIZES.md, color: COLORS.accentCyan, fontWeight: '600' },
});
