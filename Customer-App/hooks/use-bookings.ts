import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { upsertCustomerBookingInCache } from '@/lib/booking-realtime';
import {
  cancelBookingApi,
  createBookingApi,
  getMyBookingsApi,
  payBookingWithWalletApi,
  retryBookingPaymentApi,
  submitBookingReviewApi,
  verifyBookingPaymentApi,
  CreateBookingPayload,
  VerifyBookingPaymentPayload,
} from '@/services/booking.api';

export function useRetryBookingPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => retryBookingPaymentApi(bookingId),
    onSuccess: (response) => {
      if (response.data) {
        upsertCustomerBookingInCache(queryClient, response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['pandit-profiles', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
    },
  });
}

export function usePayBookingWithWalletMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => payBookingWithWalletApi(bookingId),
    onSuccess: (response) => {
      if (response.data) {
        upsertCustomerBookingInCache(queryClient, response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['pandit-profiles', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
    },
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBookingApi(payload),
    onSuccess: (response) => {
      if (response.data) {
        upsertCustomerBookingInCache(queryClient, response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['pandit-profiles', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
    },
  });
}

export function useVerifyBookingPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyBookingPaymentPayload) => verifyBookingPaymentApi(payload),
    onSuccess: (response) => {
      if (response.data) {
        upsertCustomerBookingInCache(queryClient, response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['pandit-profiles', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      cancelBookingApi(bookingId, reason),
    onSuccess: (response) => {
      if (response.data) {
        upsertCustomerBookingInCache(queryClient, response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['pandit-profiles', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
    },
  });
}

export function useMyBookingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['bookings', 'me'],
    queryFn: getMyBookingsApi,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

export function useSubmitBookingReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      rating,
      comment,
    }: {
      bookingId: number;
      rating: number;
      comment?: string;
    }) => submitBookingReviewApi(bookingId, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['pandit-profiles', 'public'] });
    },
  });
}

