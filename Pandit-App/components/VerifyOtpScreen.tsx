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
        colors={['#A78BFA', '#7C3AED', '#4C1D95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.heroTitle}>Verify your email 📧</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Text style={styles.formTitle}>Enter OTP</Text>
          <Text style={styles.formSubtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{email || mobile}</Text>
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            editable={!verifyMutation.isPending}
          />

          <Pressable
            style={({ pressed }) => [
              styles.verifyBtn,
              (pressed || verifyMutation.isPending) && styles.pressed,
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

          <Pressable onPress={handleResend} disabled={resendMutation.isPending}>
            <Text style={styles.resend}>
              {resendMutation.isPending ? 'Sending...' : 'Resend OTP'}
            </Text>
          </Pressable>

          <Pressable onPress={onSignIn}>
            <Text style={styles.signIn}>Back to Sign In</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#7C3AED',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  heroTitle: {
    marginTop: 20,
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  formSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  email: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 12,
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  otpInput: {
    marginTop: 24,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
    color: '#111827',
    fontWeight: '700',
  },
  verifyBtn: {
    marginTop: 24,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.88,
  },
  verifyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resend: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  signIn: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
});
