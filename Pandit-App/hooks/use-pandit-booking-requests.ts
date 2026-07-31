import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approvePanditBookingApi,
  getPanditBookingRequestsApi,
  rejectPanditBookingApi,
} from '@/services/booking.api';

export function usePanditBookingRequestsQuery(enabled = true) {
  return useQuery({
    queryKey: ['bookings', 'pandit', 'requests'],
    queryFn: getPanditBookingRequestsApi,
    enabled,
  });
}

export function useApproveBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => approvePanditBookingApi(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
    },
  });
}

export function useRejectBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => rejectPanditBookingApi(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'requests'] });
    },
  });
}
