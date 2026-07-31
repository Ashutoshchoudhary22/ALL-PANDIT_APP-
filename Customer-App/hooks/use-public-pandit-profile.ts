import { useQuery } from '@tanstack/react-query';

import { getPublicPanditProfileApi } from '@/services/pandit-profile.api';

export function usePublicPanditProfileQuery(profileId: number | null, enabled = true) {
  return useQuery({
    queryKey: ['pandit-profiles', 'public', profileId],
    queryFn: () => getPublicPanditProfileApi(profileId as number),
    enabled: enabled && profileId != null,
  });
}
