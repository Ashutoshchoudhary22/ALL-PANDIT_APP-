import { SignUpScreen } from '@/components/SignUpScreen';
import { router } from 'expo-router';

export default function SignUpRoute() {
  return (
    <SignUpScreen
      onSignupSuccess={({ mobile, email }) =>
        router.push({
          pathname: '/verify-otp',
          params: { mobile, email: email ?? '' },
        })
      }
      onSignIn={() => router.push('/sign-in')}
      onSocialPress={() => {}}
    />
  );
}
