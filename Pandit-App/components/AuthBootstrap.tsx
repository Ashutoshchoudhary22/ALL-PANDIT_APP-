import { useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

import { goToDashboard, goToGetStarted } from '@/lib/auth-navigation';
import { useAuth } from '@/providers/AuthProvider';

export function AuthBootstrap() {
  const { token, isLoading } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (isLoading || hasBootstrapped.current || !rootNavigationState?.key) return;

    hasBootstrapped.current = true;

    if (token) {
      goToDashboard();
      return;
    }

    goToGetStarted();
  }, [isLoading, token, rootNavigationState?.key]);

  return null;
}
