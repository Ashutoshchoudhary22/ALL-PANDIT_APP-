import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  completeBookingCashApi,
  requestFinishBookingPujaApi,
  retryRemainingPaymentApi,
  startBookingPujaApi,
  verifyFinishBookingOtpApi,
  verifyRemainingPaymentApi,
  VerifyRemainingPaymentPayload,
} from '@/services/booking.api';

export function useStartBookingPujaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, otp }: { bookingId: number; otp: string }) =>
      startBookingPujaApi(bookingId, otp),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
    },
  });
}

export function useRequestFinishBookingPujaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => requestFinishBookingPujaApi(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
    },
  });
}

export function useVerifyFinishBookingOtpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, otp }: { bookingId: number; otp: string }) =>
      verifyFinishBookingOtpApi(bookingId, otp),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
    },
  });
}

export function useCompleteBookingCashMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => completeBookingCashApi(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
    },
  });
}

export function useRetryRemainingPaymentMutation() {
  return useMutation({
    mutationFn: (bookingId: number) => retryRemainingPaymentApi(bookingId),
  });
}

export function useVerifyRemainingPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyRemainingPaymentPayload) => verifyRemainingPaymentApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
    },
  });
}
