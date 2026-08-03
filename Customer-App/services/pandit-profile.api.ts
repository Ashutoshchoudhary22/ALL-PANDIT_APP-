import { apiClient } from '@/lib/axios';

export type PujaService = {
  name: string;
  price: number;
};

export type PopularPujaService = {
  name: string;
  minPrice: number;
  lastAddedAt: string;
};

export type PublicPanditProfile = {
  id: number;
  userId: number;
  name: string;
  gender: string;
  bio: string | null;
  experienceYears: number;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  liveLatitude: number | null;
  liveLongitude: number | null;
  liveLocationAt: string | null;
  profileImage: string | null;
  galleryPhotos: string[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  sameDayBooking: boolean;
  languages: string[];
  languageCode: string;
  pujaServices: PujaService[];
  performingSince: number | null;
};

type ListResponse = {
  success: boolean;
  data: PublicPanditProfile[];
};

type ItemResponse = {
  success: boolean;
  data: PublicPanditProfile;
};

type PopularServicesResponse = {
  success: boolean;
  data: PopularPujaService[];
};

export async function listApprovedPanditsApi(service?: string) {
  const { data } = await apiClient.get<ListResponse>('/api/pandit-profiles/public', {
    params: service ? { service } : undefined,
  });
  return data;
}

export async function getPublicPanditProfileApi(profileId: number) {
  const { data } = await apiClient.get<ItemResponse>(`/api/pandit-profiles/public/${profileId}`);
  return data;
}

export async function listPopularPujaServicesApi(limit = 10) {
  const { data } = await apiClient.get<PopularServicesResponse>(
    '/api/pandit-profiles/public/popular-services',
    { params: { limit } },
  );
  return data;
}
