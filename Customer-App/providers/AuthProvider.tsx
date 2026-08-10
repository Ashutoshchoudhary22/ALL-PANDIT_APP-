import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  saveAuthSession,
} from '@/lib/auth-storage';
import { apiClient, setUnauthorizedHandler, syncAuthToken } from '@/lib/axios';
import { isPushNotificationsAvailable } from '@/lib/push-capability';
import { unregisterStoredPushToken } from '@/lib/push-notifications';
import { AuthUser } from '@/services/auth.api';
import { unregisterPushTokenApi } from '@/services/push.api';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    if (isPushNotificationsAvailable()) {
      await unregisterStoredPushToken(unregisterPushTokenApi);
    }
    syncAuthToken(null);
    await clearAuthSession();
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await signOut();
    });

    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const timeout = setTimeout(() => {
        if (!cancelled) setIsLoading(false);
      }, 8000);

      try {
        const [storedToken, storedUser] = await Promise.all([getAuthToken(), getAuthUser()]);
        syncAuthToken(storedToken);
        setToken(storedToken);

        if (storedUser) {
          setUser(storedUser);
          return;
        }

        if (storedToken) {
          try {
            const { data } = await apiClient.get<{ success: boolean; data?: { user: AuthUser } }>(
              '/api/auth/me',
            );
            if (data.data?.user) {
              await saveAuthSession(storedToken, data.data.user);
              setUser(data.data.user);
            } else {
              syncAuthToken(null);
              await clearAuthSession();
              setToken(null);
            }
          } catch {
            syncAuthToken(null);
            await clearAuthSession();
            setToken(null);
          }
        }
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setIsLoading(false);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      signIn: async (nextToken, nextUser) => {
        syncAuthToken(nextToken);
        await saveAuthSession(nextToken, nextUser);
        setToken(nextToken);
        setUser(nextUser);
      },
      signOut,
    }),
    [token, user, isLoading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
