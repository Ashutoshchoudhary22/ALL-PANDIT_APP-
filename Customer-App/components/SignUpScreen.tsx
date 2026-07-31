import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useSignupMutation } from '@/hooks/use-auth';

const BHAGWA = '#FFB366';
const BHAGWA_DARK = '#FF8C00';
const INPUT_BG = 'rgba(255, 248, 240, 0.94)';
const INPUT_BORDER = '#FFCC80';
const ICON_COLOR = '#FF8C00';

type SignUpScreenProps = {
  onSignupSuccess?: (data: { mobile: string; email?: string }) => void;
  onSignIn?: () => void;
  onSocialPress?: (provider: 'facebook' | 'x' | 'google') => void;
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
      },
      {
        onSuccess: (response) => {
          Alert.alert('OTP Sent', response.message);
          onSignupSuccess?.({
            mobile: response.data?.mobile || mobile.trim(),
            email: response.data?.email || email.trim().toLowerCase(),
          });
        },
        onError: (err) => {
          setError(err.message);
        },
      },
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ImageBackground
        source={require('@/assets/sign-up.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <View style={[styles.logoHeader, { paddingTop: insets.top + 52 }]}>
        <Image
          source={require('@/assets/main-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

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

            <View style={[styles.inputRow, styles.firstRow]}>
              <Ionicons name="call-outline" size={20} color={ICON_COLOR} />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={15}
                value={mobile}
                onChangeText={setMobile}
                editable={!signupMutation.isPending}
              />
            </View>

            <View style={[styles.inputRow, styles.inputRowSpacing]}>
              <Ionicons name="mail-outline" size={20} color={ICON_COLOR} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!signupMutation.isPending}
              />
            </View>

            <View style={[styles.inputRow, styles.inputRowSpacing]}>
              <Ionicons name="lock-closed-outline" size={20} color={ICON_COLOR} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!signupMutation.isPending}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={ICON_COLOR}
                />
              </Pressable>
            </View>

            <View style={[styles.inputRow, styles.inputRowSpacing]}>
              <Ionicons name="lock-closed-outline" size={20} color={ICON_COLOR} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!signupMutation.isPending}
              />
              <Pressable onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={ICON_COLOR}
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.signUpBtnWrap,
                (pressed || signupMutation.isPending) && styles.pressed,
              ]}
              onPress={handleSignUp}
              disabled={signupMutation.isPending}
            >
              <LinearGradient
                colors={[BHAGWA, BHAGWA_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signUpBtn}
              >
                {signupMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signUpText}>Sign Up</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={styles.accountRow}>
              Already have an account?{' '}
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
  logoHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  logo: {
    width: 220,
    height: 155,
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
  firstRow: {
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
  signUpBtnWrap: {
    marginTop: 22,
    borderRadius: 16,
    overflow: 'hidden',
  },
  signUpBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  signUpText: {
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
