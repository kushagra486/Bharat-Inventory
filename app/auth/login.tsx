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

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!isValidEmail(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>⏰</Text>
            </View>
            <Text style={styles.title}>Expiry Dashboard</Text>
            <Text style={styles.subtitle}>Track. Alert. Reduce Waste.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Sign In</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/auth/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Don't have an account?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => router.push('/auth/signup')}
            >
              <Text style={styles.signupBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: SPACING.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING.xxxl },
  logoContainer: {
    width: 80, height: 80, borderRadius: RADIUS.xl,
    backgroundColor: `${COLORS.accentCyan}20`,
    borderWidth: 1, borderColor: `${COLORS.accentCyan}40`,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  logoIcon: { fontSize: 36 },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  form: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
  },
  fieldGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, gap: SPACING.sm,
    height: 50,
  },
  inputError: { borderColor: COLORS.expired },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.md },
  errorText: { fontSize: FONT_SIZES.xs, color: COLORS.expired, marginTop: SPACING.xs },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: SPACING.xl },
  forgotText: { fontSize: FONT_SIZES.sm, color: COLORS.accentCyan },
  loginBtn: {
    backgroundColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textInverse },
  divider: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    marginVertical: SPACING.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  signupBtn: {
    borderWidth: 1, borderColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  signupBtnText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.accentCyan },
});
