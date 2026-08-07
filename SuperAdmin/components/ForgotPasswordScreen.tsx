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
import { useForgotPasswordMutation } from '@/hooks/use-auth';

type ForgotPasswordScreenProps = {
  onSuccess?: () => void;
  onSignIn?: () => void;
};

export function ForgotPasswordScreen({ onSuccess, onSignIn }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const forgotPasswordMutation = useForgotPasswordMutation();

  const handleSendReset = () => {
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    forgotPasswordMutation.mutate(
      { email: email.trim().toLowerCase() },
      {
        onSuccess: (response) => {
          Alert.alert('Reset Link Sent', response.message, [
            { text: 'OK', onPress: onSuccess },
          ]);
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
          <Text style={styles.brandName}>ApnaAcharya Admin</Text>
        </View>

        <Text style={styles.heroTitle}>
          Reset your password{'\n'}and get back in. 🔐
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
            <Text style={styles.formTitle}>Forgot Password?</Text>
            <Text style={styles.formSubtitle}>
              Enter your registered email and we&apos;ll send you a link to reset your password.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                editable={!forgotPasswordMutation.isPending}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.resetBtn,
                (pressed || forgotPasswordMutation.isPending) && styles.pressed,
                forgotPasswordMutation.isPending && styles.disabledBtn,
              ]}
              onPress={handleSendReset}
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.resetText}>Send Reset Link</Text>
                  <Ionicons name="send-outline" size={20} color="#fff" />
                </>
              )}
            </Pressable>

            <Text style={styles.accountRow}>
              Remember your password?{' '}
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
  resetBtn: {
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
  resetText: {
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
