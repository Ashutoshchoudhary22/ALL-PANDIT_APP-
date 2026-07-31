import { useQuery } from '@tanstack/react-query';

import { getAdminDashboardStatsApi } from '@/services/admin-stats.api';

export function useAdminDashboardStatsQuery(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: getAdminDashboardStatsApi,
    enabled,
    staleTime: 30_000,
  });
}
