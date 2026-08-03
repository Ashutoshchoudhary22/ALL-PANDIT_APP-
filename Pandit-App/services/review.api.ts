import { apiClient } from '@/lib/axios';

export type PanditReview = {
  id: number;
  bookingId: number;
  customerId: number;
  customerName: string;
  customerProfileImage: string | null;
  serviceName: string;
  bookingDate: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export async function getPanditReviewsApi() {
  const { data } = await apiClient.get<{ success: boolean; data: PanditReview[] }>(
    '/api/bookings/pandit/reviews',
  );
  return data;
}
