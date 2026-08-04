import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { account } from '@/lib/appwrite';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';

export default function ResetPasswordScreen() {
  const { userId, secret } = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const linkInvalid = !userId || !secret;

  async function handleSubmit() {
    if (password.length < 8) return setError('Minimum 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setError('');
    setLoading(true);
    try {
      await account.updateRecovery(userId!, secret!, password);
      setDone(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {linkInvalid ? (
              <>
                <Text style={styles.formTitle}>Invalid Link</Text>
                <Text style={styles.subtitle}>
                  This password reset link is missing or malformed. Request a new one from the sign-in screen.
                </Text>
                <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/auth/login')}>
                  <Text style={styles.loginBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : done ? (
              <>
                <View style={styles.logoContainer}>
                  <Ionicons name="checkmark-circle-outline" size={32} color={COLORS.accentCyan} />
                </View>
                <Text style={styles.formTitle}>Password Updated</Text>
                <Text style={styles.subtitle}>You can now sign in with your new password.</Text>
                <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/auth/login')}>
                  <Text style={styles.loginBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.formTitle}>Set New Password</Text>
                <Text style={styles.subtitle}>Choose a new password for your account.</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Min 8 characters"
                      placeholderTextColor={COLORS.textMuted}
                      value={password}
                      onChangeText={t => { setPassword(t); setError(''); }}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      placeholderTextColor={COLORS.textMuted}
                      value={confirmPassword}
                      onChangeText={t => { setConfirmPassword(t); setError(''); }}
                      secureTextEntry
                    />
                  </View>
                  {error && <Text style={styles.errorText}>{error}</Text>}
                </View>

                <TouchableOpacity
                  style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.textInverse} />
                  ) : (
                    <Text style={styles.loginBtnText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: SPACING.xl, justifyContent: 'center' },
  logoContainer: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: `${COLORS.accentCyan}20`,
    borderWidth: 1, borderColor: `${COLORS.accentCyan}40`,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  form: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  formTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xl },
  fieldGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, gap: SPACING.sm, height: 50,
  },
  inputError: { borderColor: COLORS.expired },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.md },
  errorText: { fontSize: FONT_SIZES.xs, color: COLORS.expired, marginTop: SPACING.xs },
  loginBtn: {
    backgroundColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textInverse },
});
