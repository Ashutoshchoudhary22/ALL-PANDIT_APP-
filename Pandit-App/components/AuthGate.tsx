import { ReactNode } from 'react';

import { useAuth } from '@/providers/AuthProvider';

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}
