import AsyncStorage from '@react-native-async-storage/async-storage';

import { AdminNotification } from '@/services/notification.api';

const STORAGE_PREFIX = 'admin_notifications';

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}_${userId}`;
}

export async function loadNotifications(userId: number) {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AdminNotification[];
  } catch {
    return [];
  }
}

export async function saveNotifications(userId: number, notifications: AdminNotification[]) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(notifications));
}

export async function clearNotifications(userId: number) {
  await AsyncStorage.removeItem(storageKey(userId));
}
