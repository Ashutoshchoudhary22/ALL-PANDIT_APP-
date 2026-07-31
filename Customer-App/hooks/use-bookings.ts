import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createBookingApi, getMyBookingsApi, CreateBookingPayload } from '@/services/booking.api';

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBookingApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
    },
  });
}

export function useMyBookingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['bookings', 'me'],
    queryFn: getMyBookingsApi,
    enabled,
  });
}
