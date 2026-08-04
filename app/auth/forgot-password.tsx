import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '@/constants';
import { isValidEmail } from '@/lib/utils';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email) return setError('Email is required');
    if (!isValidEmail(email)) return setError('Enter a valid email');
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {sent ? (
              <>
                <View style={styles.logoContainer}>
                  <Ionicons name="mail-open-outline" size={32} color={COLORS.accentCyan} />
                </View>
                <Text style={styles.formTitle}>Check your email</Text>
                <Text style={styles.subtitle}>
                  We've sent a password reset link to {email}. Follow the link to set a new password.
                </Text>
                <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/auth/login')}>
                  <Text style={styles.loginBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.formTitle}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your email and we'll send you a link to reset your password.</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textMuted}
                      value={email}
                      onChangeText={t => { setEmail(t); setError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
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
                    <Text style={styles.loginBtnText}>Send Reset Link</Text>
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
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md },
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
