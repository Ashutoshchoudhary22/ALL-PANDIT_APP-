import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useLoginMutation } from '@/hooks/use-auth';
import { exitAppForWrongRole } from '@/lib/role-guard';
import { useTranslation } from '@/providers/LanguageProvider';
import { AuthUser } from '@/services/auth.api';

const INPUT_BG = 'rgba(255, 248, 240, 0.96)';
const INPUT_BORDER = C.borderGold;
const ICON_COLOR = C.maroon;

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
}: SignInScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useLoginMutation();

  const handleSignIn = () => {
    setError('');

    if (!email.trim() || !password) {
      setError(t('auth.validation.required'));
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
            if (response.data.user.role !== 'customer') {
              exitAppForWrongRole();
              return;
            }
            onLoginSuccess?.(response.data.user, response.data.token);
          }
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
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={[styles.inputRow, styles.emailRow]}>
              <Ionicons name="mail-outline" size={20} color={ICON_COLOR} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loginMutation.isPending}
              />
            </View>

            <View style={[styles.inputRow, styles.inputRowSpacing]}>
              <Ionicons name="lock-closed-outline" size={20} color={ICON_COLOR} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.passwordPlaceholder')}
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
                  color={ICON_COLOR}
                />
              </Pressable>
            </View>

            <Pressable
              style={styles.forgotWrap}
              onPress={onForgotPassword}
              disabled={loginMutation.isPending}
            >
              <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.loginBtnWrap,
                (pressed || loginMutation.isPending) && styles.pressed,
              ]}
              onPress={handleSignIn}
              disabled={loginMutation.isPending}
            >
              <LinearGradient
                colors={[C.maroon, C.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>{t('auth.login')}</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={styles.accountRow}>
              {t('auth.noAccount')}{' '}
              <Text style={styles.link} onPress={onSignUp}>
                {t('auth.signUp')}
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
    backgroundColor: C.cream,
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
  },
  emailRow: {
    marginTop: 2,
  },
  inputRowSpacing: {
    marginTop: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    paddingVertical: 0,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 22,
  },
  forgot: {
    fontSize: 14,
    fontWeight: '600',
    color: C.maroon,
  },
  loginBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  loginText: {
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
    color: C.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
