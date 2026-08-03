import AsyncStorage from '@react-native-async-storage/async-storage';

import { PublicPanditProfile } from '@/services/pandit-profile.api';

const STORAGE_PREFIX = 'customer_saved_pandits';

export type SavedPanditEntry = PublicPanditProfile & {
  savedAt: string;
};

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}_${userId}`;
}

export async function loadSavedPandits(userId: number) {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedPanditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSavedPandits(userId: number, pandits: SavedPanditEntry[]) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(pandits));
}

export async function clearSavedPandits(userId: number) {
  await AsyncStorage.removeItem(storageKey(userId));
}
