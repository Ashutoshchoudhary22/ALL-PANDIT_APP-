import { SignInScreen } from '@/components/SignInScreen';
import { router } from 'expo-router';

import { goToDashboard } from '@/lib/auth-navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function SignInRoute() {
  const { signIn } = useAuth();

  return (
    <SignInScreen
      onLoginSuccess={async (user, token) => {
        await signIn(token, user);
        goToDashboard();
      }}
      onSignUp={() => router.push('/sign-up')}
      onForgotPassword={() => router.push('/forgot-password')}
      onSocialPress={() => {}}
    />
  );
}
