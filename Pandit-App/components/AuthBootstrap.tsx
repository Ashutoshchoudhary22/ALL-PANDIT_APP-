import { usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

import { goToDashboard, goToGetStarted } from '@/lib/auth-navigation';
import { exitAppForWrongRole } from '@/lib/role-guard';
import { useAuth } from '@/providers/AuthProvider';

function isOnboardingPath(pathname: string) {
  const segment = pathname.split('/').filter(Boolean).pop() ?? 'index';
  return segment === 'index' || segment === '(tabs)';
}

export function AuthBootstrap() {
  const { token, user, isLoading } = useAuth();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (isLoading || hasBootstrapped.current || !rootNavigationState?.key) return;

    hasBootstrapped.current = true;

    if (token && user && user.role !== 'pandit') {
      exitAppForWrongRole();
      return;
    }

    if (token) {
      goToDashboard();
      return;
    }

    if (!isOnboardingPath(pathname)) {
      goToGetStarted();
    }
  }, [isLoading, token, user, rootNavigationState?.key]);

  return null;
}
