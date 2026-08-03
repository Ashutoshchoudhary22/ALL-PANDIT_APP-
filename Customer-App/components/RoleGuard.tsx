import { useEffect, useRef } from 'react';

import { exitAppForWrongRole, isWrongRole } from '@/lib/role-guard';
import { useAuth } from '@/providers/AuthProvider';

export function RoleGuard() {
  const { token, user, isLoading } = useAuth();
  const hasTriggeredExit = useRef(false);

  useEffect(() => {
    if (isLoading || hasTriggeredExit.current) return;

    if (token && user && isWrongRole(user.role)) {
      hasTriggeredExit.current = true;
      exitAppForWrongRole();
    }
  }, [isLoading, token, user]);

  return null;
}
