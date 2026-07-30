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

import { useLoginMutation } from '@/hooks/use-auth';
import { AuthUser } from '@/services/auth.api';

type SignInScreenProps = {
  onLoginSuccess?: (user: AuthUser, token: string) => void;
  onSignUp?: () => void;
  onForgotPassword?: () => void;
  onSocialPress?: (provider: 'facebook' | 'x' | 'google') => void;
};

export function SignInScreen({
  onLoginSuccess,
  onSignUp,
  onForgotPassword,
  onSocialPress,
}: SignInScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useLoginMutation();

  const handleSignIn = () => {
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    loginMutation.mutate(
      {
        email: email.trim().toLowerCase(),
        password,
      },
      {
        onSuccess: (response) => {
          if (response.data?.user && response.data?.token) {
            Alert.alert('Success', response.message);
            onLoginSuccess?.(response.data.user, response.data.token);
          }
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
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>ॐ</Text>
          </View>
          <Text style={styles.brandName}>My-Pandit</Text>
        </View>

        <Text style={styles.heroTitle}>
          Begin your sacred{'\n'}journey today. 🪔
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
            <Text style={styles.formTitle}>Sign In To Your Account.</Text>
            <Text style={styles.formSubtitle}>
              Let&apos;s sign in to your account and get started.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loginMutation.isPending}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loginMutation.isPending}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.signInBtn,
                (pressed || loginMutation.isPending) && styles.pressed,
                loginMutation.isPending && styles.disabledBtn,
              ]}
              onPress={handleSignIn}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.signInText}>Sign In</Text>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                </>
              )}
            </Pressable>

            <Text style={styles.accountRow}>
              Don&apos;t have an account?{' '}
              <Text style={styles.link} onPress={onSignUp}>
                Sign Up
              </Text>
            </Text>

            <Pressable onPress={onForgotPassword}>
              <Text style={styles.forgot}>Forgot Password</Text>
            </Pressable>

            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialBtn}
                onPress={() => onSocialPress?.('facebook')}
              >
                <Text style={styles.facebook}>f</Text>
              </Pressable>
              <Pressable style={styles.socialBtn} onPress={() => onSocialPress?.('x')}>
                <Text style={styles.xLogo}>𝕏</Text>
              </Pressable>
              <Pressable
                style={styles.socialBtn}
                onPress={() => onSocialPress?.('google')}
              >
                <Text style={styles.google}>G</Text>
              </Pressable>
            </View>
          </ScrollView>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    fontSize: 20,
    color: '#7C3AED',
    fontWeight: '700',
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  heroTitle: {
    marginTop: 28,
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  formSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  errorText: {
    marginTop: 12,
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  inputRow: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  signInBtn: {
    marginTop: 28,
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
  disabledBtn: {
    opacity: 0.7,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  accountRow: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  forgot: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  socialRow: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  facebook: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1877F2',
  },
  xLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  google: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EA4335',
  },
});
