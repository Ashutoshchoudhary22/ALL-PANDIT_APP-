import { apiClient } from '@/lib/axios';

export type PanditProfile = {
  id: number;
  userId: number;
  name: string;
  gender: 'male' | 'female' | 'other';
  bio: string | null;
  experienceYears: number;
  cityId: number | null;
  latitude: number | null;
  longitude: number | null;
  aadharImage: string | null;
  panditCertificateImage: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
  passbookImage: string | null;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  sameDayBooking: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
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
  cityId?: number;
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
