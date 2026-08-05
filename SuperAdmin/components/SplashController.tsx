import { useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuth } from '@/providers/AuthProvider';

export function SplashController() {
  const { isLoading } = useAuth();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!isLoading && rootNavigationState?.key) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading, rootNavigationState?.key]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 3500);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
