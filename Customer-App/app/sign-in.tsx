import { SignInScreen } from '@/components/SignInScreen';
import { Href, router } from 'expo-router';

export default function SignInRoute() {
  return (
    <SignInScreen
      onLoginSuccess={() => router.replace('/(tabs)/home' as Href)}
      onSignUp={() => router.push('/sign-up')}
      onForgotPassword={() => router.push('/forgot-password')}
      onSocialPress={() => {}}
    />
  );
}
