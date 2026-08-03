import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { apiClient } from '@/lib/axios';
import { exitAppForWrongRole } from '@/lib/role-guard';
import { useAuth } from '@/providers/AuthProvider';

export function AuthSessionHandler() {
  const { token, isLoading, signOut } = useAuth();

  const validateSession = useCallback(async () => {
    if (!token) return;

    try {
      const { data } = await apiClient.get<{ success: boolean; data?: { user: { role: string } } }>(
        '/api/auth/me',
      );
      if (data.data?.user?.role && data.data.user.role !== 'customer') {
        exitAppForWrongRole();
      }
    } catch {
      // 401 responses are handled by the axios interceptor.
    }
  }, [token, signOut]);

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
