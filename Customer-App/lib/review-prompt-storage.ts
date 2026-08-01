import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'dismissed_review_prompts';

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}_${userId}`;
}

export async function loadDismissedReviewPrompts(userId: number) {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return new Set<number>();
  try {
    const ids = JSON.parse(raw) as number[];
    return new Set(ids);
  } catch {
    return new Set<number>();
  }
}

export async function dismissReviewPrompt(userId: number, bookingId: number) {
  const current = await loadDismissedReviewPrompts(userId);
  current.add(bookingId);
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(Array.from(current)));
}

export async function clearDismissedReviewPrompt(userId: number, bookingId: number) {
  const current = await loadDismissedReviewPrompts(userId);
  current.delete(bookingId);
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(Array.from(current)));
}
