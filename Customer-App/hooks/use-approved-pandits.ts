import { useQuery } from '@tanstack/react-query';

import { listApprovedPanditsApi } from '@/services/pandit-profile.api';

export function useApprovedPanditsQuery(enabled = true, service?: string) {
  return useQuery({
    queryKey: ['pandit-profiles', 'public', service ?? 'all'],
    queryFn: () => listApprovedPanditsApi(service),
    enabled,
  });
}
