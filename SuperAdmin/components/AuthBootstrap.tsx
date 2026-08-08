import { useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

import { goToHome, goToSignIn } from '@/lib/auth-navigation';
import { useAuth } from '@/providers/AuthProvider';

const ADMIN_ROLES = new Set(['superadmin', 'admin']);

export function AuthBootstrap() {
  const { token, user, isLoading, signOut } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (isLoading || hasBootstrapped.current || !rootNavigationState?.key) return;

    hasBootstrapped.current = true;

    if (token && (!user?.role || !ADMIN_ROLES.has(user.role))) {
      void signOut();
      return;
    }

    if (token) {
      goToHome();
      return;
    }

    goToSignIn();
  }, [isLoading, token, user, signOut, rootNavigationState?.key]);

  return null;
}
