import { ReactNode } from 'react';

import { useAuth } from '@/providers/AuthProvider';

type AuthGateProps = {
  children: ReactNode;
};

/** Wait for auth hydration before mounting the app stack. */
export function AuthGate({ children }: AuthGateProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return children;
}
