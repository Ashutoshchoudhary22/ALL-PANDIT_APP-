import { apiClient } from '@/lib/axios';

export type CustomerProfile = {
  id: number;
  customerId: number;
  firstName: string | null;
  lastName: string | null;
  gender: 'male' | 'female' | 'other' | null;
  dob: string | null;
  address: string | null;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  liveLatitude: number | null;
  liveLongitude: number | null;
  liveLocationAt: string | null;
  mobile: string;
  email: string | null;
  profileImage: string | null;
  languageCode?: string;
  languageLabel?: string;
  notificationsEnabled?: boolean;
  memberSince: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerProfilePayload = {
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  address?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
  profileImage?: string;
};

export type UpdateCustomerProfilePayload = CreateCustomerProfilePayload & {
  languageCode?: string;
  notificationsEnabled?: boolean;
};

export async function getMyCustomerProfileApi() {
  const { data } = await apiClient.get<{ success: boolean; data: CustomerProfile }>(
    '/api/customer-profiles/me',
  );
  return data;
}

export async function createCustomerProfileApi(payload: CreateCustomerProfilePayload) {
  const { data } = await apiClient.post<{
    success: boolean;
    message: string;
    data: CustomerProfile;
  }>('/api/customer-profiles', payload);
  return data;
}

export async function updateCustomerProfileApi(payload: UpdateCustomerProfilePayload) {
  const { data } = await apiClient.put<{
    success: boolean;
    message: string;
    data: CustomerProfile;
  }>('/api/customer-profiles/me', payload);
  return data;
}

export async function updateCustomerLiveLocationApi(payload: {
  latitude: number;
  longitude: number;
}) {
  const { data } = await apiClient.patch<{
    success: boolean;
    message: string;
    data: CustomerProfile;
  }>('/api/customer-profiles/me/live-location', payload);
  return data;
}
