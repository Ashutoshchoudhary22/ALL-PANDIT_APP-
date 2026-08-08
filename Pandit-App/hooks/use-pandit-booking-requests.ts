import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  removePanditBookingRequestFromCache,
  upsertPanditBookingInCache,
} from '@/lib/booking-realtime';
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
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

export function useApproveBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => approvePanditBookingApi(bookingId),
    onSuccess: (response) => {
      if (response.data) {
        removePanditBookingRequestFromCache(queryClient, response.data.id);
        upsertPanditBookingInCache(queryClient, response.data);
      }
    },
  });
}

export function useRejectBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => rejectPanditBookingApi(bookingId),
    onSuccess: (response) => {
      if (response.data) {
        removePanditBookingRequestFromCache(queryClient, response.data.id);
      }
    },
  });
}
