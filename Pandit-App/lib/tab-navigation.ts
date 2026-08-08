import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { goToDashboard } from '@/lib/auth-navigation';
import { useAuth } from '@/providers/AuthProvider';

/** Android hardware back from secondary tabs should return to dashboard, not landing. */
export function useTabBackToHome() {
  const { token } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goToDashboard();
        return true;
      });

      return () => subscription.remove();
    }, [token]),
  );
}
