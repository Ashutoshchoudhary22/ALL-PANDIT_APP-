import { ResetPasswordScreen } from '@/components/ResetPasswordScreen';
import { router, useLocalSearchParams } from 'expo-router';

export default function ResetPasswordRoute() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const resetToken = Array.isArray(token) ? token[0] : token;

  return (
    <ResetPasswordScreen
      token={resetToken}
      onSuccess={() => router.replace('/sign-in')}
      onSignIn={() => router.replace('/sign-in')}
    />
  );
}
