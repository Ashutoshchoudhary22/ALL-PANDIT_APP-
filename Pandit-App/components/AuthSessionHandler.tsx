import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { apiClient } from '@/lib/axios';
import { useAuth } from '@/providers/AuthProvider';

export function AuthSessionHandler() {
  const { token, isLoading } = useAuth();

  const validateSession = useCallback(async () => {
    if (!token) return;

    try {
      await apiClient.get('/api/auth/me');
    } catch {
      // 401 responses are handled by the axios interceptor.
    }
  }, [token]);

  useEffect(() => {
    if (isLoading || !token) return;
    validateSession();
  }, [isLoading, token, validateSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        validateSession();
      }
    });

    return () => subscription.remove();
  }, [validateSession]);

  return null;
}
