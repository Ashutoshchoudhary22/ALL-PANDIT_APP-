import { useMemo } from 'react';

import { usePanditBookingsQuery } from '@/hooks/use-pandit-bookings';
import { computePanditEarnings } from '@/lib/pandit-earnings';

export function usePanditEarnings(enabled = true) {
  const bookingsQuery = usePanditBookingsQuery(enabled);

  const summary = useMemo(
    () => computePanditEarnings(bookingsQuery.data?.data ?? []),
    [bookingsQuery.data?.data],
  );

  return {
    summary,
    isLoading: bookingsQuery.isLoading,
    isError: bookingsQuery.isError,
    refetch: bookingsQuery.refetch,
  };
}
