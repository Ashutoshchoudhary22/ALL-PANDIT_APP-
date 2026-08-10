import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { API_BASE_URL } from '@/constants/api';
import { getAuthToken } from '@/lib/auth-storage';

export const PANDIT_BACKGROUND_LOCATION_TASK = 'PANDIT_BACKGROUND_LOCATION';

const MIN_UPDATE_INTERVAL_MS = 30_000;
const MIN_DISTANCE_METERS = 25;

let lastSent: { latitude: number; longitude: number; at: number } | null = null;

function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

async function uploadLiveLocation(latitude: number, longitude: number) {
  const token = await getAuthToken();
  if (!token) return;

  const userRaw = await AsyncStorage.getItem('my_pandit_auth_user');
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw) as { role?: string };
      if (user.role !== 'pandit') return;
    } catch {
      return;
    }
  }

  const now = Date.now();
  if (lastSent) {
    const elapsed = now - lastSent.at;
    const moved = distanceMeters(lastSent, { latitude, longitude });
    if (elapsed < MIN_UPDATE_INTERVAL_MS && moved < MIN_DISTANCE_METERS) {
      return;
    }
  }

  lastSent = { latitude, longitude, at: now };

  try {
    await fetch(`${API_BASE_URL}/api/pandit-profiles/me/live-location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    });
  } catch {
    // Background task — ignore transient network errors.
  }
}

TaskManager.defineTask(PANDIT_BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('Background location task error:', error.message);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  const location = locations?.[0];
  if (!location) return;

  await uploadLiveLocation(location.coords.latitude, location.coords.longitude);
});
