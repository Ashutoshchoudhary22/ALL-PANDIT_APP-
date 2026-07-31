import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelBookingApi,
  createBookingApi,
  getMyBookingsApi,
  retryBookingPaymentApi,
  verifyBookingPaymentApi,
  CreateBookingPayload,
  VerifyBookingPaymentPayload,
} from '@/services/booking.api';

export function useRetryBookingPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => retryBookingPaymentApi(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
    },
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBookingApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
    },
  });
}

export function useVerifyBookingPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyBookingPaymentPayload) => verifyBookingPaymentApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => cancelBookingApi(bookingId),
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
