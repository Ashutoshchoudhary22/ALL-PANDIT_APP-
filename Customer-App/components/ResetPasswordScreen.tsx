import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
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

import { HomeColors as C } from '@/constants/home-theme';
import { useResetPasswordMutation } from '@/hooks/use-auth';

const BHAGWA = '#FFB366';
const BHAGWA_DARK = '#FF8C00';
const INPUT_BG = 'rgba(255, 248, 240, 0.94)';
const INPUT_BORDER = '#FFCC80';
const ICON_COLOR = '#FF8C00';

type ResetPasswordScreenProps = {
  token?: string;
  onSuccess?: () => void;
  onSignIn?: () => void;
};

export function ResetPasswordScreen({
  token,
  onSuccess,
  onSignIn,
}: ResetPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const resetPasswordMutation = useResetPasswordMutation();

  const handleResetPassword = () => {
    setError('');

    if (!token?.trim()) {
      setError('Invalid reset link. Please request a new password reset email.');
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

    resetPasswordMutation.mutate(
      { token: token.trim(), password },
      {
        onSuccess: (response) => {
          Alert.alert('Password Updated', response.message, [
            { text: 'Sign In', onPress: onSuccess },
          ]);
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ImageBackground
        source={require('@/assets/sign-in.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 22,
            },
          ]}
        >
          <View style={styles.form}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Enter a new password for your account.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={[styles.inputRow, styles.firstRow]}>
              <Ionicons name="lock-closed-outline" size={20} color={ICON_COLOR} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                editable={!resetPasswordMutation.isPending}
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={ICON_COLOR} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!resetPasswordMutation.isPending}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.resetBtnWrap,
                (pressed || resetPasswordMutation.isPending) && styles.pressed,
              ]}
              onPress={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              <LinearGradient
                colors={[BHAGWA, BHAGWA_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resetBtn}
              >
                {resetPasswordMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetText}>Update Password</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={styles.accountRow}>
              Remember your password?{' '}
              <Text style={styles.link} onPress={onSignIn}>
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorText: {
    marginBottom: 12,
    color: C.danger,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputRow: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: INPUT_BG,
    marginBottom: 12,
  },
  firstRow: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    paddingVertical: 0,
  },
  resetBtnWrap: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  resetBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  accountRow: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    color: BHAGWA_DARK,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
