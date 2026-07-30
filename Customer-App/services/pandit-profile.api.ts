import { apiClient } from '@/lib/axios';

export type PublicPanditProfile = {
  id: number;
  userId: number;
  name: string;
  gender: string;
  bio: string | null;
  experienceYears: number;
  cityName: string | null;
  liveLatitude: number | null;
  liveLongitude: number | null;
  liveLocationAt: string | null;
  profileImage: string | null;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  sameDayBooking: boolean;
  languages: string[];
  languageCode: string;
};

type ListResponse = {
  success: boolean;
  data: PublicPanditProfile[];
};

export async function listApprovedPanditsApi() {
  const { data } = await apiClient.get<ListResponse>('/api/pandit-profiles/public');
  return data;
}
