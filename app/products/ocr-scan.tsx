import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { extractLabelFields, terminateOcrWorker } from '@/lib/ocrExtract';

export default function OcrScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

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
          <Text style={styles.permText}>Allow camera access to photograph product labels.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handleCapture() {
    if (processing || !cameraRef.current) return;
    setProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (!photo?.uri) {
        Alert.alert('Capture Failed', 'Could not capture image. Please try again.');
        setProcessing(false);
        return;
      }

      // Runs fully on-device — no network call, no API key, no usage limit.
      const fields = await extractLabelFields(photo.uri);

      if (!fields.expiryDate && !fields.productName && !fields.batchNumber) {
        Alert.alert(
          'Nothing Readable',
          'Could not confidently read the label. Try better lighting, hold the camera steady, or fill in details manually.',
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Enter Manually', onPress: () => router.replace('/products/add') },
          ]
        );
        setProcessing(false);
        return;
      }

      router.replace({
        pathname: '/products/add',
        params: {
          prefillName: fields.productName ?? '',
          prefillExpiry: fields.expiryDate ?? '',
          prefillMfg: fields.manufactureDate ?? '',
          prefillBatch: fields.batchNumber ?? '',
        },
      });
    } catch (err) {
      Alert.alert('OCR Error', 'Something went wrong reading the label. Please try again or enter manually.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleClose() {
    await terminateOcrWorker();
    router.back();
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />

      <View style={styles.overlay}>
        <SafeAreaView style={styles.topBar}>
          <TouchableOpacity style={styles.circleBtn} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.scanTitle}>Scan Label</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        <View style={styles.frameArea}>
          <View style={styles.frame} />
          <Text style={styles.scanHint}>
            {processing ? 'Reading label...' : 'Frame the expiry date & product name clearly'}
          </Text>
          {processing && <ActivityIndicator color={COLORS.accentPurple} style={{ marginTop: SPACING.md }} />}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.captureBtn, processing && styles.captureBtnDisabled]}
            onPress={handleCapture}
            disabled={processing}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualBtn} onPress={() => router.push('/products/add')}>
            <Ionicons name="create-outline" size={18} color={COLORS.accentPurple} />
            <Text style={styles.manualBtnText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const FRAME_W = 300;
const FRAME_H = 180;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backBtn: { padding: SPACING.md },
  permissionView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl },
  permIcon: { fontSize: 64, marginBottom: SPACING.lg },
  permTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  permText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  permBtn: {
    backgroundColor: COLORS.accentPurple, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl, height: 50, alignItems: 'center',
    justifyContent: 'center', marginTop: SPACING.xl,
  },
  permBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#fff' },
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
    width: FRAME_W, height: FRAME_H, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.accentPurple, borderStyle: 'dashed',
  },
  scanHint: {
    marginTop: SPACING.xl, fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)', textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  bottomBar: {
    padding: SPACING.xl, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', gap: SPACING.lg,
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accentPurple,
  },
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: `${COLORS.accentPurple}60`,
    paddingHorizontal: SPACING.xl, height: 48,
  },
  manualBtnText: { fontSize: FONT_SIZES.md, color: COLORS.accentPurple, fontWeight: '600' },
});
