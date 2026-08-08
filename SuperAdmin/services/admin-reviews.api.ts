import { apiClient } from '@/lib/axios';

export type AdminPanditReviewPreview = {
  rating: number;
  comment: string;
  createdAt: string;
};

export type AdminPanditReviewSummary = {
  profileId: number;
  name: string;
  mobile: string;
  profileImage: string | null;
  rating: number;
  totalReviews: number;
  reviewCount: number;
  latestReview: AdminPanditReviewPreview | null;
};

export type AdminPanditReview = {
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

export type AdminPanditReviewDetail = {
  profileId: number;
  name: string;
  mobile: string;
  profileImage: string | null;
  rating: number;
  totalReviews: number;
  reviews: AdminPanditReview[];
};

type ListSummariesResponse = {
  success: boolean;
  data: {
    totalReviews: number;
    averageRating: number;
    pandits: AdminPanditReviewSummary[];
  };
};

type PanditReviewsResponse = {
  success: boolean;
  data: AdminPanditReviewDetail;
};

export async function listPanditReviewSummariesApi() {
  const { data } = await apiClient.get<ListSummariesResponse>('/api/admin/pandit-reviews');
  return data;
}

export async function getPanditReviewsAdminApi(profileId: number) {
  const { data } = await apiClient.get<PanditReviewsResponse>(
    `/api/admin/pandit-reviews/${profileId}`,
  );
  return data;
}
