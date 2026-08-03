import { apiClient } from '@/lib/axios';

export type PujaService = {
  name: string;
  price: number;
};

export type PendingPanditProfile = {
  name: string;
  gender: 'male' | 'female' | 'other';
  bio: string | null;
  experienceYears: number;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  profileImage: string | null;
  galleryPhotos?: string[];
  aadharImage: string | null;
  panditCertificateImage: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
  passbookImage: string | null;
  pujaServices: PujaService[];
  languageCode?: string;
  submittedAt?: string | null;
};

export type PanditProfile = {
  id: number;
  userId: number;
  name: string;
  gender: 'male' | 'female' | 'other';
  bio: string | null;
  experienceYears: number;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  liveLatitude: number | null;
  liveLongitude: number | null;
  liveLocationAt: string | null;
  aadharImage: string | null;
  panditCertificateImage: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
  passbookImage: string | null;
  galleryPhotos: string[];
  pujaServices: PujaService[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  sameDayBooking: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  updateRequestStatus?: 'none' | 'pending' | 'rejected';
  pendingProfile?: PendingPanditProfile | null;
  mobile: string;
  email: string | null;
  profileImage: string | null;
  languageCode: string;
  languages: string[];
  memberSince: string;
  performingSince: number | null;
  profileCreatedAt: string;
  profileUpdatedAt: string;
};

export type CreatePanditProfilePayload = {
  name: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  experienceYears?: number;
  cityName?: string;
  latitude?: number;
  longitude?: number;
  isAvailable?: boolean;
  sameDayBooking?: boolean;
  profileImage?: string;
  aadharImage?: string;
  panditCertificateImage?: string;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  passbookImage?: string;
  galleryPhotos?: string[];
  pujaServices?: PujaService[];
};

export type UpdatePanditProfilePayload = Partial<
  CreatePanditProfilePayload & {
    isOnline: boolean;
    languageCode: string;
  }
>;

export async function getMyPanditProfileApi() {
  const { data } = await apiClient.get<{ success: boolean; data: PanditProfile }>(
    '/api/pandit-profiles/me',
  );
  return data;
}

export async function createPanditProfileApi(payload: CreatePanditProfilePayload) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: PanditProfile }>(
    '/api/pandit-profiles',
    payload,
  );
  return data;
}

export async function updatePanditProfileApi(payload: UpdatePanditProfilePayload) {
  const { data } = await apiClient.put<{ success: boolean; message: string; data: PanditProfile }>(
    '/api/pandit-profiles/me',
    payload,
  );
  return data;
}

export async function updatePanditLiveLocationApi(payload: {
  latitude: number;
  longitude: number;
}) {
  const { data } = await apiClient.patch<{ success: boolean; message: string; data: PanditProfile }>(
    '/api/pandit-profiles/me/live-location',
    payload,
  );
  return data;
}
