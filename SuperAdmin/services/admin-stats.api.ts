import { apiClient } from '@/lib/axios';

export type AdminDashboardStats = {
  totalUsers: number;
  totalPandits: number;
  totalCustomers: number;
};

type StatsResponse = {
  success: boolean;
  data: AdminDashboardStats;
};

export async function getAdminDashboardStatsApi() {
  const { data } = await apiClient.get<StatsResponse>('/api/admin/stats');
  return data;
}
