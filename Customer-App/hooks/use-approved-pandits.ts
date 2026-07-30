import { useQuery } from '@tanstack/react-query';

import { listApprovedPanditsApi } from '@/services/pandit-profile.api';

export function useApprovedPanditsQuery(enabled = true) {
  return useQuery({
    queryKey: ['pandit-profiles', 'public'],
    queryFn: listApprovedPanditsApi,
    enabled,
  });
}
