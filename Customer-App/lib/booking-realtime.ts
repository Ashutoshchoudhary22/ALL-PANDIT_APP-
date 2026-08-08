import { QueryClient } from '@tanstack/react-query';

import { Booking } from '@/services/booking.api';

export const MY_BOOKINGS_QUERY_KEY = ['bookings', 'me'] as const;

type BookingsCache = {
  success: boolean;
  data: Booking[];
};

function normalizeSocketBooking(booking: Partial<Booking> & { id: number }): Booking {
  return {
    id: booking.id,
    customerId: booking.customerId ?? 0,
    panditProfileId: booking.panditProfileId ?? 0,
    panditName: booking.panditName ?? 'Pandit',
    serviceName: booking.serviceName ?? 'Puja Service',
    bookingDate: booking.bookingDate ?? '',
    bookingTime: booking.bookingTime ?? '',
    address: booking.address ?? '',
    specialRequirements: booking.specialRequirements ?? null,
    samagriRequired: booking.samagriRequired ?? false,
    basePrice: booking.basePrice ?? 0,
    samagriCharge: booking.samagriCharge ?? 0,
    totalPrice: booking.totalPrice ?? 0,
    advanceAmount: booking.advanceAmount ?? 0,
    remainingAmount: booking.remainingAmount ?? 0,
    paymentStatus: booking.paymentStatus ?? 'pending',
    razorpayOrderId: booking.razorpayOrderId ?? null,
    razorpayPaymentId: booking.razorpayPaymentId ?? null,
    status: booking.status ?? 'pending',
    needsReview: booking.needsReview ?? false,
    reviewRating: booking.reviewRating ?? null,
    advancePaymentMethod: booking.advancePaymentMethod ?? null,
    walletAdvanceAmount: booking.walletAdvanceAmount ?? 0,
    sessionOtp: booking.sessionOtp,
    sessionOtpPurpose: booking.sessionOtpPurpose,
    sessionOtpHint: booking.sessionOtpHint,
    startedAt: booking.startedAt ?? null,
    finishRequestedAt: booking.finishRequestedAt ?? null,
    remainingPaymentMethod: booking.remainingPaymentMethod ?? null,
    advancePaidAt: booking.advancePaidAt ?? null,
    completedAt: booking.completedAt ?? null,
    createdAt: booking.createdAt ?? new Date().toISOString(),
    updatedAt: booking.updatedAt ?? booking.createdAt ?? new Date().toISOString(),
  };
}

export function upsertCustomerBookingInCache(
  queryClient: QueryClient,
  incoming: Partial<Booking> & { id: number },
) {
  const booking = normalizeSocketBooking(incoming);

  queryClient.setQueryData<BookingsCache>(MY_BOOKINGS_QUERY_KEY, (current) => {
    const list = current?.data ?? [];
    const index = list.findIndex((item) => item.id === booking.id);

    if (index >= 0) {
      return {
        success: true,
        data: list.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...booking } : item,
        ),
      };
    }

    return {
      success: true,
      data: [booking, ...list],
    };
  });
}

export function removeCustomerBookingFromCache(queryClient: QueryClient, bookingId: number) {
  queryClient.setQueryData<BookingsCache>(MY_BOOKINGS_QUERY_KEY, (current) => {
    if (!current?.data?.length) return current;
    return {
      success: true,
      data: current.data.filter((item) => item.id !== bookingId),
    };
  });
}
