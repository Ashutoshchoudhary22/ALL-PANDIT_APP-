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

import { useForgotPasswordMutation } from '@/hooks/use-auth';

const BHAGWA = '#FFB366';
const BHAGWA_DARK = '#FF8C00';
const INPUT_BG = 'rgba(255, 248, 240, 0.94)';
const INPUT_BORDER = '#FFCC80';
const ICON_COLOR = '#FF8C00';
const TEXT_COLOR = '#1F2937';
const DANGER_COLOR = '#EF4444';

type ForgotPasswordScreenProps = {
  onSuccess?: () => void;
  onSignIn?: () => void;
};

export function ForgotPasswordScreen({
  onSuccess,
  onSignIn,
}: ForgotPasswordScreenProps) {
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

            <View style={[styles.inputRow, styles.firstRow]}>
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
                editable={!forgotPasswordMutation.isPending}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.resetBtnWrap,
                (pressed || forgotPasswordMutation.isPending) && styles.pressed,
              ]}
              onPress={handleSendReset}
              disabled={forgotPasswordMutation.isPending}
            >
              <LinearGradient
                colors={[BHAGWA, BHAGWA_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resetBtn}
              >
                {forgotPasswordMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetText}>Send Reset Link</Text>
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
  errorText: {
    marginBottom: 12,
    color: DANGER_COLOR,
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
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT_COLOR,
    paddingVertical: 0,
  },
  resetBtnWrap: {
    marginTop: 22,
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
