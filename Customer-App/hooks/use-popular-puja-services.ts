import { useQuery } from '@tanstack/react-query';

import { listPopularPujaServicesApi } from '@/services/pandit-profile.api';

export function usePopularPujaServicesQuery(enabled = true, limit = 10) {
  return useQuery({
    queryKey: ['pandit-profiles', 'popular-services', limit],
    queryFn: () => listPopularPujaServicesApi(limit),
    enabled,
  });
}
