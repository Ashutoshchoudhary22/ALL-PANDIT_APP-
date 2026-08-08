import { useQuery } from '@tanstack/react-query';

import {
  getPanditReviewsAdminApi,
  listPanditReviewSummariesApi,
} from '@/services/admin-reviews.api';

export function usePanditReviewSummariesQuery(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'pandit-review-summaries'],
    queryFn: listPanditReviewSummariesApi,
    enabled,
  });
}

export function usePanditReviewsAdminQuery(profileId: number | null) {
  return useQuery({
    queryKey: ['admin', 'pandit-reviews', profileId],
    queryFn: () => getPanditReviewsAdminApi(profileId!),
    enabled: profileId != null,
  });
}
