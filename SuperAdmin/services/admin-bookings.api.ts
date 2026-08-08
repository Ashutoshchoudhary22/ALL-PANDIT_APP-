import { apiClient } from '@/lib/axios';
import { AdminRecentBooking } from '@/services/admin-stats.api';

export type AdminBooking = AdminRecentBooking & {
  advanceAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  createdAt: string;
};

export type AdminBookingsSummary = {
  totalBookings: number;
  completed: number;
  confirmed: number;
  ongoing: number;
  pending: number;
  cancelled: number;
};

export type AdminBookingsFilter = 'all' | 'pending' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

type ListBookingsResponse = {
  success: boolean;
  data: {
    total: number;
    summary: AdminBookingsSummary;
    bookings: AdminBooking[];
  };
};

export async function listAdminBookingsApi(status: AdminBookingsFilter = 'all') {
  const { data } = await apiClient.get<ListBookingsResponse>('/api/admin/bookings', {
    params: status === 'all' ? undefined : { status },
  });
  return data;
}
