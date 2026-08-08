import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getPanditBookingsApi } from '@/services/booking.api';

export function usePanditBookingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['bookings', 'pandit', 'me'],
    queryFn: getPanditBookingsApi,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

export function useInvalidatePanditBookings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
}
