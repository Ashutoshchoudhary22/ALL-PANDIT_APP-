import AsyncStorage from '@react-native-async-storage/async-storage';

import { PanditNotification } from '@/services/notification.api';

const STORAGE_PREFIX = 'pandit_notifications';

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}_${userId}`;
}

export async function loadNotifications(userId: number) {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PanditNotification[];
  } catch {
    return [];
  }
}

export async function saveNotifications(userId: number, notifications: PanditNotification[]) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(notifications));
}

export async function clearNotifications(userId: number) {
  await AsyncStorage.removeItem(storageKey(userId));
}
