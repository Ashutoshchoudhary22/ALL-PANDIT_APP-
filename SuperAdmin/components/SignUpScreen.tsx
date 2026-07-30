import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ADMIN_COLORS } from '@/constants/admin-theme';
import { useSignupMutation } from '@/hooks/use-auth';

type SignUpScreenProps = {
  onSignupSuccess?: (data: { mobile: string; email?: string }) => void;
  onSignIn?: () => void;
};

export function SignUpScreen({ onSignupSuccess, onSignIn }: SignUpScreenProps) {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const signupMutation = useSignupMutation();

  const handleSignUp = () => {
    setError('');

    if (!mobile.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    signupMutation.mutate(
      {
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'superadmin',
      },
      {
        onSuccess: (response) => {
          Alert.alert('OTP Sent', response.message);
          onSignupSuccess?.({
            mobile: response.data?.mobile || mobile.trim(),
            email: response.data?.email || email.trim().toLowerCase(),
          });
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[...ADMIN_COLORS.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="shield-checkmark" size={22} color={ADMIN_COLORS.primary} />
          </View>
          <Text style={styles.brandName}>My-Pandit Super Admin</Text>
        </View>

        <Text style={styles.heroTitle}>
          Create your{'\n'}admin account. ✨
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            <Text style={styles.formTitle}>Create Super Admin Account</Text>
            <Text style={styles.formSubtitle}>
              Register to manage the My-Pandit platform and all operations.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={20} color={ADMIN_COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                placeholderTextColor={ADMIN_COLORS.muted}
                keyboardType="phone-pad"
                maxLength={15}
                value={mobile}
                onChangeText={setMobile}
                editable={!signupMutation.isPending}
              />
            </View>

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color={ADMIN_COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="admin@example.com"
                placeholderTextColor={ADMIN_COLORS.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!signupMutation.isPending}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={ADMIN_COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={ADMIN_COLORS.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!signupMutation.isPending}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={ADMIN_COLORS.muted}
                />
              </Pressable>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={ADMIN_COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={ADMIN_COLORS.muted}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!signupMutation.isPending}
              />
              <Pressable onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={ADMIN_COLORS.muted}
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.signUpBtn,
                (pressed || signupMutation.isPending) && styles.pressed,
                signupMutation.isPending && styles.disabledBtn,
              ]}
              onPress={handleSignUp}
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.signUpText}>Sign Up</Text>
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                </>
              )}
            </Pressable>

            <Text style={styles.accountRow}>
              Already registered?{' '}
              <Text style={styles.link} onPress={onSignIn}>
                Sign In
              </Text>
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.primaryDark,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ADMIN_COLORS.sheet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: ADMIN_COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  heroTitle: {
    marginTop: 28,
    color: ADMIN_COLORS.textOnPrimary,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
  },
  sheetWrap: {
    flex: 1,
    marginTop: -24,
  },
  sheet: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.sheet,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: ADMIN_COLORS.text,
  },
  formSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: ADMIN_COLORS.muted,
    lineHeight: 20,
  },
  errorText: {
    marginTop: 12,
    color: ADMIN_COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.label,
  },
  inputRow: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ADMIN_COLORS.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ADMIN_COLORS.sheet,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: ADMIN_COLORS.text,
    paddingVertical: 0,
  },
  signUpBtn: {
    marginTop: 28,
    height: 54,
    borderRadius: 27,
    backgroundColor: ADMIN_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.88,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  signUpText: {
    color: ADMIN_COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  accountRow: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    color: ADMIN_COLORS.label,
  },
  link: {
    color: ADMIN_COLORS.primary,
    fontWeight: '700',
  },
});
