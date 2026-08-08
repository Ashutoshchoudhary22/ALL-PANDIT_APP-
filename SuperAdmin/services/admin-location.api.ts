import { apiClient } from '@/lib/axios';

export type LocationHistoryPoint = {
  id: number;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type LocationHistoryDate = {
  date: string;
  pointCount: number;
  firstAt: string;
  lastAt: string;
};

export type LocationTrackingStatus = {
  userId: number;
  role: 'customer' | 'pandit';
  trackingEnabled: boolean;
  dates: LocationHistoryDate[];
};

export async function getLocationTrackingStatusApi(
  userId: number,
  role: 'customer' | 'pandit',
) {
  const { data } = await apiClient.get<{ success: boolean; data: LocationTrackingStatus }>(
    `/api/admin/location-tracking/${userId}`,
    { params: { role } },
  );
  return data;
}

export async function setLocationTrackingApi(payload: {
  userId: number;
  role: 'customer' | 'pandit';
  enabled: boolean;
  latitude?: number;
  longitude?: number;
}) {
  const { data } = await apiClient.patch<{ success: boolean; message: string; data: LocationTrackingStatus }>(
    `/api/admin/location-tracking/${payload.userId}`,
    {
      role: payload.role,
      enabled: payload.enabled,
      latitude: payload.latitude,
      longitude: payload.longitude,
    },
  );
  return data;
}

export async function getLocationHistoryApi(payload: {
  userId: number;
  role: 'customer' | 'pandit';
  date?: string | null;
}) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: {
      userId: number;
      role: 'customer' | 'pandit';
      date: string | null;
      points: LocationHistoryPoint[];
    };
  }>(`/api/admin/location-history/${payload.userId}`, {
    params: {
      role: payload.role,
      ...(payload.date ? { date: payload.date } : {}),
    },
  });
  return data;
}
