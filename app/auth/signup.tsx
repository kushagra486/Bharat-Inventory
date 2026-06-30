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

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email) e.email = 'Email is required';
    else if (!isValidEmail(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup() {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      Alert.alert(
        'Account Created! 🎉',
        'Check your email to verify your account, then sign in.',
        [{ text: 'Sign In', onPress: () => router.replace('/auth/login') }]
      );
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking your products today</Text>
          </View>

          <View style={styles.form}>

            {[
              { label: 'Full Name', value: fullName, setter: setFullName, icon: 'person-outline', placeholder: 'John Doe', key: 'fullName', keyboard: 'default' as const },
              { label: 'Email', value: email, setter: setEmail, icon: 'mail-outline', placeholder: 'you@example.com', key: 'email', keyboard: 'email-address' as const },
            ].map(field => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={[styles.inputWrapper, errors[field.key] ? styles.inputError : null]}>
                  <Ionicons name={field.icon as any} size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.keyboard}
                    autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                    autoCorrect={false}
                  />
                </View>
                {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
              </View>
            ))}

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Min 6 characters"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.signupBtn, loading && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <Text style={styles.signupBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkAccent}>Sign In</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: SPACING.xl },
  backBtn: { marginBottom: SPACING.xl },
  header: { marginBottom: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  form: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  fieldGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, gap: SPACING.sm, height: 50,
  },
  inputError: { borderColor: COLORS.expired },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.md },
  errorText: { fontSize: FONT_SIZES.xs, color: COLORS.expired, marginTop: SPACING.xs },
  signupBtn: {
    backgroundColor: COLORS.accentCyan, borderRadius: RADIUS.md,
    height: 50, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md,
  },
  btnDisabled: { opacity: 0.6 },
  signupBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textInverse },
  loginLink: { alignItems: 'center', marginTop: SPACING.xl },
  loginLinkText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  loginLinkAccent: { color: COLORS.accentCyan, fontWeight: '600' },
});
