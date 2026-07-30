import { PROFILE_ENDPOINTS } from '@/constants/profiles';
import { apiClient } from '@/lib/axios';

export type PanditProfile = {
  id: number;
  userId: number;
  name: string;
  gender: string;
  bio: string | null;
  experienceYears: number;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  mobile: string;
  email: string | null;
  profileImage: string | null;
  aadharImage: string | null;
  panditCertificateImage: string | null;
  passbookImage: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
  status: string;
  isVerified: boolean;
  isOnline: boolean;
  rating: number;
  totalBookings: number;
  languages?: string[];
  memberSince?: string;
};

export type CustomerProfile = {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string | null;
  gender: string;
  dob: string | null;
  address: string | null;
  cityName: string | null;
  mobile: string;
  email: string | null;
  profileImage: string | null;
};

type ListResponse<T> = {
  success: boolean;
  data: T[];
};

type ItemResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type PanditProfileStatus = 'approved' | 'rejected';

export async function listPanditProfilesApi() {
  const { data } = await apiClient.get<ListResponse<PanditProfile>>(PROFILE_ENDPOINTS.panditProfiles);
  return data;
}

export async function getPanditProfileApi(profileId: number) {
  const { data } = await apiClient.get<ItemResponse<PanditProfile>>(
    `${PROFILE_ENDPOINTS.panditProfiles}/${profileId}`,
  );
  return data;
}

export async function updatePanditProfileStatusApi(profileId: number, status: PanditProfileStatus) {
  const { data } = await apiClient.patch<ItemResponse<PanditProfile>>(
    `${PROFILE_ENDPOINTS.panditProfiles}/${profileId}/status`,
    { status },
  );
  return data;
}

export async function listCustomerProfilesApi() {
  const { data } = await apiClient.get<ListResponse<CustomerProfile>>(PROFILE_ENDPOINTS.customerProfiles);
  return data;
}
