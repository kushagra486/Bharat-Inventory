import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { getProfile, updateProfile } from '@/lib/db';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then(p => {
      setFullName(p?.full_name ?? '');
      setAvatarUrl(p?.avatar_url ?? '');
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName.trim(), avatar_url: avatarUrl.trim() });
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accentCyan} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={72} color={COLORS.accentCyan} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.disabledText}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={COLORS.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Avatar URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={COLORS.textMuted}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.textInverse} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.xl, paddingBottom: 100 },
  avatarContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  fieldGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    color: COLORS.textPrimary, fontSize: FONT_SIZES.md, minHeight: 50, justifyContent: 'center',
  },
  inputDisabled: { opacity: 0.6 },
  disabledText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  saveBtn: {
    backgroundColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textInverse },
});
