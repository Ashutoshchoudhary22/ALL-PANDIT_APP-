import { apiClient } from '@/lib/axios';

export type AdminDashboardTrendPoint = {
  label: string;
  count: number;
};

export type AdminDashboardStatusSegment = {
  label: string;
  count: number;
  pct: number;
};

export type AdminDashboardRevenuePoint = {
  label: string;
  amount: number;
};

export type AdminRecentBooking = {
  id: number;
  customerName: string;
  panditName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: string;
  displayStatus: string;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalPandits: number;
  totalCustomers: number;
  totalBookings: number;
  totalReviews: number;
  totalRevenue: number;
  collectedRevenue: number;
  platformEarnings: number;
  panditPayouts: number;
  trends: {
    bookingsWeekChangePct: number | null;
    newUsersWeekChangePct: number | null;
  };
  bookingTrend: AdminDashboardTrendPoint[];
  bookingsByStatus: AdminDashboardStatusSegment[];
  revenueTrend: AdminDashboardRevenuePoint[];
  newUsersThisWeek: {
    customers: number;
    pandits: number;
    total: number;
  };
  recentBookings: AdminRecentBooking[];
};

type StatsResponse = {
  success: boolean;
  data: AdminDashboardStats;
};

export async function getAdminDashboardStatsApi() {
  const { data } = await apiClient.get<StatsResponse>('/api/admin/stats');
  return data;
}
