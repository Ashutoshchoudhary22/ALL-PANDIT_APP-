import { VerifyOtpScreen } from '@/components/VerifyOtpScreen';
import { router, useLocalSearchParams } from 'expo-router';

export default function VerifyOtpRoute() {
  const { mobile, email } = useLocalSearchParams<{ mobile: string; email?: string }>();

  if (!mobile) {
    router.replace('/sign-up');
    return null;
  }

  return (
    <VerifyOtpScreen
      mobile={mobile}
      email={email}
      onVerified={() => router.replace('/sign-in')}
      onSignIn={() => router.push('/sign-in')}
    />
  );
}
