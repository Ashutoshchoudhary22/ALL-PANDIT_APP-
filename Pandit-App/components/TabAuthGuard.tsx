import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { goToGetStarted } from '@/lib/auth-navigation';
import { useAuth } from '@/providers/AuthProvider';

const PROTECTED_TAB_ROUTES = new Set([
  'dashboard',
  'bookings',
  'calendar',
  'earnings',
  'profile',
]);

function isOnboardingPath(pathname: string) {
  const segment = pathname.split('/').filter(Boolean).pop() ?? 'index';
  return segment === 'index' || segment === '(tabs)';
}

export function TabAuthGuard() {
  const { token, isLoading } = useAuth();
  const pathname = usePathname();
  const lastRedirectAt = useRef(0);

  useEffect(() => {
    if (isLoading || token) return;

    const tabSegment = pathname.split('/').filter(Boolean).pop() ?? 'index';
    if (!PROTECTED_TAB_ROUTES.has(tabSegment) || isOnboardingPath(pathname)) return;

    const now = Date.now();
    if (now - lastRedirectAt.current < 400) return;

    lastRedirectAt.current = now;
    goToGetStarted();
  }, [token, isLoading, pathname]);

  return null;
}
