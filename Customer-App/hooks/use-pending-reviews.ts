import { useCallback, useEffect, useMemo, useState } from 'react';

import { useMyBookingsQuery } from '@/hooks/use-bookings';
import { loadDismissedReviewPrompts } from '@/lib/review-prompt-storage';
import { useAuth } from '@/providers/AuthProvider';
import { Booking } from '@/services/booking.api';

export function usePendingReviewPrompts(enabled = true) {
  const { user } = useAuth();
  const bookingsQuery = useMyBookingsQuery(enabled && Boolean(user?.id));
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user?.id) {
      setDismissedIds(new Set());
      return;
    }
    void loadDismissedReviewPrompts(user.id).then(setDismissedIds);
  }, [user?.id]);

  const pendingReviews = useMemo(() => {
    const bookings = bookingsQuery.data?.data ?? [];
    return bookings.filter(
      (booking: Booking) => booking.needsReview && !dismissedIds.has(booking.id),
    );
  }, [bookingsQuery.data?.data, dismissedIds]);

  const refreshDismissed = useCallback(async () => {
    if (!user?.id) return;
    const ids = await loadDismissedReviewPrompts(user.id);
    setDismissedIds(ids);
  }, [user?.id]);

  const markDismissedLocally = useCallback((bookingId: number) => {
    setDismissedIds((prev) => new Set(prev).add(bookingId));
  }, []);

  return {
    pendingReviews,
    featuredReview: pendingReviews[0] ?? null,
    isLoading: bookingsQuery.isLoading,
    refetch: bookingsQuery.refetch,
    refreshDismissed,
    markDismissedLocally,
  };
}
