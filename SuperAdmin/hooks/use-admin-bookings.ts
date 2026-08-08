import { useQuery } from '@tanstack/react-query';

import { AdminBookingsFilter, listAdminBookingsApi } from '@/services/admin-bookings.api';

export function useAdminBookingsQuery(status: AdminBookingsFilter = 'all', enabled = true) {
  return useQuery({
    queryKey: ['admin', 'bookings', status],
    queryFn: () => listAdminBookingsApi(status),
    enabled,
  });
}
