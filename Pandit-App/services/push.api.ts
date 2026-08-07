import { Platform } from 'react-native';

import { apiClient } from '@/lib/axios';

export type PushPlatform = 'android' | 'ios' | 'web';

export function getPushPlatform(): PushPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'web') return 'web';
  return 'android';
}

export async function registerPushTokenApi(token: string) {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/api/push/register',
    {
      token,
      platform: getPushPlatform(),
    },
  );
  return response.data;
}

export async function unregisterPushTokenApi(token: string) {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    '/api/push/register',
    {
      data: { token },
    },
  );
  return response.data;
}
