import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { goToGetStarted } from '@/lib/auth-navigation';
import { useAuth } from '@/providers/AuthProvider';

const PROTECTED_TAB_ROUTES = new Set([
  'dashboard',
  'bookings',
  'calendar',
  'earnings',
  'profile',
]);

export function TabAuthGuard() {
  const { token, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || token) return;

    const tabSegment = pathname.split('/').filter(Boolean).pop() || 'index';
    if (PROTECTED_TAB_ROUTES.has(tabSegment)) {
      goToGetStarted();
    }
  }, [token, isLoading, pathname]);

  return null;
}
