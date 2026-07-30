import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  saveAuthSession,
} from '@/lib/auth-storage';
import { setAuthTokenGetter, setUnauthorizedHandler } from '@/lib/axios';
import { goToGetStarted } from '@/lib/auth-navigation';
import { AuthUser } from '@/services/auth.api';

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
    await clearAuthSession();
    setToken(null);
    setUser(null);
    queryClient.clear();
    goToGetStarted();
  }, [queryClient]);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await signOut();
    });

    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([getAuthToken(), getAuthUser()]);
        setToken(storedToken);
        setUser(storedUser);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      signIn: async (nextToken, nextUser) => {
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
