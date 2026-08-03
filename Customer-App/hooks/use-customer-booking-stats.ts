import { useMemo } from 'react';

import { useMyBookingsQuery } from '@/hooks/use-bookings';
import { sortRecentBookings, isActiveBooking } from '@/lib/booking-display';
import { Booking } from '@/services/booking.api';

export type CustomerBookingStats = {
  totalBookings: number;
  completedBookings: number;
  reviewsGiven: number;
  activeBookingsCount: number;
  pendingReviewsCount: number;
  savedPanditsCount: number;
};

export function computeCustomerBookingStats(bookings: Booking[]): CustomerBookingStats {
  const activeBookings = bookings.filter((booking) => isActiveBooking(booking.status));
  const savedPanditIds = new Set(
    bookings
      .filter((booking) => booking.status !== 'cancelled')
      .map((booking) => booking.panditProfileId),
  );

  return {
    totalBookings: bookings.length,
    completedBookings: bookings.filter((booking) => booking.status === 'completed').length,
    reviewsGiven: bookings.filter((booking) => booking.reviewRating != null).length,
    activeBookingsCount: activeBookings.length,
    pendingReviewsCount: bookings.filter((booking) => booking.needsReview).length,
    savedPanditsCount: savedPanditIds.size,
  };
}

export function useCustomerBookingStats(enabled = true) {
  const bookingsQuery = useMyBookingsQuery(enabled);

  const stats = useMemo(
    () => computeCustomerBookingStats(bookingsQuery.data?.data ?? []),
    [bookingsQuery.data?.data],
  );

  const recentBookings = useMemo(
    () => sortRecentBookings(bookingsQuery.data?.data ?? [], 3),
    [bookingsQuery.data?.data],
  );

  const hasActiveBookings = useMemo(
    () => (bookingsQuery.data?.data ?? []).some((booking) => isActiveBooking(booking.status)),
    [bookingsQuery.data?.data],
  );

  return {
    ...stats,
    recentBookings,
    hasActiveBookings,
    isLoading: bookingsQuery.isLoading,
    refetch: bookingsQuery.refetch,
  };
}
