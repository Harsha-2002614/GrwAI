import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Italic } from '@/components/Italic';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccountScreen() {
  const router = useRouter();
  const setEmail = useOnboardingStore((s) => s.setEmail);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  const [email, setEmailLocal] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [confirm, setConfirm] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const passwordValid = password.length >= 8;
  const confirmValid = confirm === password && confirm.length > 0;

  const emailError = emailTouched && !emailValid ? 'Enter a valid email address.' : null;
  const passwordError =
    passwordTouched && !passwordValid ? 'Use at least 8 characters.' : null;
  const confirmError =
    confirmTouched && !confirmValid ? 'Passwords don’t match.' : null;

  const canSubmit = emailValid && passwordValid && confirmValid;

  const handleSocialStub = useMemo(
    () => () => Alert.alert('Social auth coming in chunk 9'),
    []
  );

  const handleCreateAccount = () => {
    if (!canSubmit) return;
    // TODO: real auth API call in chunk 9
    setEmail(email.trim());
    markScreenComplete(1);
    router.push('/onboarding/name');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <CapsLabel size="md" tone="secondary">
          Create your account
        </CapsLabel>
        <View style={{ height: theme.space[2] }} />
        <Text style={styles.headline}>
          Let’s get <Italic tone="rust">acquainted</Italic>
        </Text>

        <View style={styles.socialBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
            onPress={handleSocialStub}
            style={({ pressed }) => [
              styles.socialBtn,
              styles.appleBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="logo-apple" size={18} color={theme.color.ink.inverse} />
            <Text style={[styles.socialText, { color: theme.color.ink.inverse }]}>
              Continue with Apple
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            onPress={handleSocialStub}
            style={({ pressed }) => [
              styles.socialBtn,
              styles.googleBtn,
              pressed && { backgroundColor: theme.color.bg.warm },
            ]}
          >
            <Ionicons name="logo-google" size={18} color={theme.color.ink.primary} />
            <Text style={styles.socialText}>Continue with Google</Text>
          </Pressable>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <CapsLabel size="sm" tone="tertiary">
            Or
          </CapsLabel>
          <View style={styles.dividerLine} />
        </View>

        <FormField
          label="Email"
          value={email}
          onChangeText={setEmailLocal}
          onBlur={() => setEmailTouched(true)}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          error={emailError}
        />

        <View style={{ height: theme.space[4] }} />

        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setPasswordTouched(true)}
          placeholder="8 or more characters"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          error={passwordError}
          trailing={
            <PasswordToggle
              shown={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          }
        />

        <View style={{ height: theme.space[4] }} />

        <FormField
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          onBlur={() => setConfirmTouched(true)}
          placeholder="8 or more characters"
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          error={confirmError}
          trailing={
            <PasswordToggle
              shown={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
            />
          }
        />

        <Text style={styles.legalText}>
          By continuing, you agree to our Terms and Privacy Policy.
          {/* TODO: link Terms and Privacy in chunk 9 */}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Create account"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          onPress={handleCreateAccount}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Form field ──────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
  error?: string | null;
  trailing?: React.ReactNode;
}

function FormField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  secureTextEntry,
  error,
  trailing,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? theme.color.error.base
    : focused
      ? theme.color.ink.primary
      : theme.color.border.light;
  const borderWidth = error || focused ? 1.5 : StyleSheet.hairlineWidth;

  return (
    <View>
      <CapsLabel size="sm" tone="secondary">
        {label}
      </CapsLabel>
      <View style={{ height: theme.space[2] }} />
      <View
        style={[
          styles.fieldRow,
          { borderColor, borderWidth },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.color.ink.tertiary}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          style={styles.fieldInput}
        />
        {trailing}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

interface PasswordToggleProps {
  shown: boolean;
  onToggle: () => void;
}

function PasswordToggle({ shown, onToggle }: PasswordToggleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={shown ? 'Hide password' : 'Show password'}
      hitSlop={8}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.toggleBtn,
        pressed && { opacity: 0.6 },
      ]}
    >
      {shown ? (
        <EyeOff size={18} color={theme.color.ink.secondary} strokeWidth={1.75} />
      ) : (
        <Eye size={18} color={theme.color.ink.secondary} strokeWidth={1.75} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
  },
  headline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
  },
  socialBlock: {
    marginTop: theme.space[6],
    gap: theme.space[3],
  },
  socialBtn: {
    height: 48,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
  },
  appleBtn: {
    backgroundColor: theme.color.ink.primary,
  },
  googleBtn: {
    backgroundColor: theme.color.bg.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.mid,
  },
  socialText: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: theme.font.label.lg.fontSize,
    lineHeight: theme.font.label.lg.fontSize,
    color: theme.color.ink.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    marginVertical: theme.space[6],
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.border.light,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.color.bg.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    height: 52,
  },
  fieldInput: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    color: theme.color.ink.primary,
    paddingVertical: 0,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: theme.space[2],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.error.base,
  },
  legalText: {
    marginTop: theme.space[6],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
  },
  footer: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[3],
    paddingBottom: theme.space[6],
    backgroundColor: theme.color.bg.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border.light,
  },
});
