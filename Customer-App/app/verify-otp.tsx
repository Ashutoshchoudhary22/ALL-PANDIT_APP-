import { goToDashboard } from '@/lib/auth-navigation';
import { useAuth } from '@/providers/AuthProvider';
import { VerifyOtpScreen } from '@/components/VerifyOtpScreen';
import { router, useLocalSearchParams } from 'expo-router';

export default function VerifyOtpRoute() {
  const { mobile, email } = useLocalSearchParams<{ mobile: string; email?: string }>();
  const { signIn } = useAuth();

  if (!mobile) {
    router.replace('/sign-up');
    return null;
  }

  return (
    <VerifyOtpScreen
      mobile={mobile}
      email={email}
      onVerified={async (user, token) => {
        await signIn(token, user);
        goToDashboard();
      }}
      onSignIn={() => router.push('/sign-in')}
    />
  );
}
