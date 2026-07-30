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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ADMIN_COLORS } from '@/constants/admin-theme';
import { useResendOtpMutation, useVerifyOtpMutation } from '@/hooks/use-auth';

type VerifyOtpScreenProps = {
  mobile: string;
  email?: string;
  onVerified?: () => void;
  onSignIn?: () => void;
};

export function VerifyOtpScreen({
  mobile,
  email,
  onVerified,
  onSignIn,
}: VerifyOtpScreenProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();

  const handleVerify = () => {
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter valid 6-digit OTP');
      return;
    }

    verifyMutation.mutate(
      { mobile, email, otp: otp.trim() },
      {
        onSuccess: (response) => {
          Alert.alert('Success', response.message);
          onVerified?.();
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  const handleResend = () => {
    setError('');
    resendMutation.mutate(
      { mobile, email },
      {
        onSuccess: (response) => {
          Alert.alert('OTP Sent', response.message);
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

        <Text style={styles.heroTitle}>Verify your email OTP 📧</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Text style={styles.formTitle}>Enter OTP</Text>
            <Text style={styles.formSubtitle}>
              We sent a 6-digit code to {email || mobile}. Enter it below to complete signup.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>OTP Code</Text>
            <View style={styles.inputRow}>
              <Ionicons name="keypad-outline" size={20} color={ADMIN_COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor={ADMIN_COLORS.muted}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                editable={!verifyMutation.isPending}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.verifyBtn,
                (pressed || verifyMutation.isPending) && styles.pressed,
                verifyMutation.isPending && styles.disabledBtn,
              ]}
              onPress={handleVerify}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.verifyText}>Verify OTP</Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                </>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.resendBtn, pressed && styles.pressed]}
              onPress={handleResend}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending ? (
                <ActivityIndicator color={ADMIN_COLORS.primary} />
              ) : (
                <Text style={styles.resendText}>Resend OTP</Text>
              )}
            </Pressable>

            <Text style={styles.accountRow}>
              Already verified?{' '}
              <Text style={styles.link} onPress={onSignIn}>
                Sign In
              </Text>
            </Text>
          </View>
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
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
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
    fontSize: 18,
    letterSpacing: 4,
    color: ADMIN_COLORS.text,
    paddingVertical: 0,
  },
  verifyBtn: {
    marginTop: 28,
    height: 54,
    borderRadius: 27,
    backgroundColor: ADMIN_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resendBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.88,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  verifyText: {
    color: ADMIN_COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  resendText: {
    color: ADMIN_COLORS.primary,
    fontSize: 14,
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
