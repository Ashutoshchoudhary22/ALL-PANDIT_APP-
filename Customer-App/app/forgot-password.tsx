import { ForgotPasswordScreen } from '@/components/ForgotPasswordScreen';
import { router } from 'expo-router';

export default function ForgotPasswordRoute() {
  return (
    <ForgotPasswordScreen
      onSuccess={() => router.push('/sign-in')}
      onSignIn={() => router.push('/sign-in')}
    />
  );
}
