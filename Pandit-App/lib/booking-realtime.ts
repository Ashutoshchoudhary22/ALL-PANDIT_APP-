import { QueryClient } from '@tanstack/react-query';

import { PanditBooking } from '@/services/booking.api';

export const PANDIT_BOOKINGS_QUERY_KEY = ['bookings', 'pandit', 'me'] as const;
export const PANDIT_BOOKING_REQUESTS_QUERY_KEY = ['bookings', 'pandit', 'requests'] as const;

type PanditBookingsCache = {
  success: boolean;
  data: PanditBooking[];
};

function normalizePanditBooking(booking: Partial<PanditBooking> & { id: number }): PanditBooking {
  return {
    id: booking.id,
    customerId: booking.customerId ?? 0,
    panditProfileId: booking.panditProfileId ?? 0,
    panditName: booking.panditName ?? 'Pandit',
    customerName: booking.customerName ?? 'Customer',
    customerMobile: booking.customerMobile ?? null,
    customerProfileImage: booking.customerProfileImage ?? null,
    serviceName: booking.serviceName ?? 'Puja Service',
    bookingDate: booking.bookingDate ?? '',
    bookingTime: booking.bookingTime ?? '',
    address: booking.address ?? '',
    latitude: booking.latitude ?? null,
    longitude: booking.longitude ?? null,
    specialRequirements: booking.specialRequirements ?? null,
    samagriRequired: booking.samagriRequired ?? false,
    basePrice: booking.basePrice ?? 0,
    samagriCharge: booking.samagriCharge ?? 0,
    totalPrice: booking.totalPrice ?? 0,
    advanceAmount: booking.advanceAmount ?? 0,
    remainingAmount: booking.remainingAmount ?? 0,
    paymentStatus: booking.paymentStatus ?? 'pending',
    status: booking.status ?? 'pending',
    startedAt: booking.startedAt ?? null,
    finishRequestedAt: booking.finishRequestedAt ?? null,
    remainingPaymentMethod: booking.remainingPaymentMethod ?? null,
    advancePaidAt: booking.advancePaidAt ?? null,
    completedAt: booking.completedAt ?? null,
    createdAt: booking.createdAt ?? new Date().toISOString(),
    updatedAt: booking.updatedAt ?? booking.createdAt ?? new Date().toISOString(),
  };
}

export function upsertPanditBookingInCache(
  queryClient: QueryClient,
  incoming: Partial<PanditBooking> & { id: number },
) {
  const booking = normalizePanditBooking(incoming);

  queryClient.setQueryData<PanditBookingsCache>(PANDIT_BOOKINGS_QUERY_KEY, (current) => {
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

    if (booking.status === 'pending') {
      return current ?? { success: true, data: list };
    }

    return {
      success: true,
      data: [booking, ...list],
    };
  });
}

export function upsertPanditBookingRequestInCache(
  queryClient: QueryClient,
  incoming: Partial<PanditBooking> & { id: number },
) {
  if (incoming.status && incoming.status !== 'pending') {
    removePanditBookingRequestFromCache(queryClient, incoming.id);
    return;
  }

  const booking = normalizePanditBooking({ ...incoming, status: 'pending' });

  queryClient.setQueryData<PanditBookingsCache>(PANDIT_BOOKING_REQUESTS_QUERY_KEY, (current) => {
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
      data: [...list, booking],
    };
  });
}

export function removePanditBookingRequestFromCache(queryClient: QueryClient, bookingId: number) {
  queryClient.setQueryData<PanditBookingsCache>(PANDIT_BOOKING_REQUESTS_QUERY_KEY, (current) => {
    if (!current?.data?.length) return current;
    return {
      success: true,
      data: current.data.filter((item) => item.id !== bookingId),
    };
  });
}
