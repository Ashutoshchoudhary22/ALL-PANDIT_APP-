import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getPanditReviewsApi } from '@/services/review.api';

export function usePanditReviewsQuery(enabled = true) {
  return useQuery({
    queryKey: ['reviews', 'pandit', 'me'],
    queryFn: getPanditReviewsApi,
    enabled,
  });
}

export function useInvalidatePanditReviews() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['reviews', 'pandit', 'me'] });
}
