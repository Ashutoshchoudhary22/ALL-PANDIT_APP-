import * as Location from 'expo-location';

export type LiveCoords = {
  latitude: number;
  longitude: number;
};

const MIN_UPDATE_INTERVAL_MS = 30_000;
const MIN_DISTANCE_METERS = 25;

function distanceMeters(a: LiveCoords, b: LiveCoords) {
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

export async function hasLiveLocationPermission() {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

export async function requestLiveLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function startLiveLocationWatch(onUpdate: (coords: LiveCoords) => void) {
  const granted = await hasLiveLocationPermission();
  if (!granted) {
    return null;
  }

  let lastSent: (LiveCoords & { at: number }) | null = null;

  const maybeSend = (coords: LiveCoords) => {
    const now = Date.now();
    if (lastSent) {
      const elapsed = now - lastSent.at;
      const moved = distanceMeters(lastSent, coords);
      if (elapsed < MIN_UPDATE_INTERVAL_MS && moved < MIN_DISTANCE_METERS) {
        return;
      }
    }
    lastSent = { ...coords, at: now };
    onUpdate(coords);
  };

  const initial = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  maybeSend({
    latitude: initial.coords.latitude,
    longitude: initial.coords.longitude,
  });

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: MIN_DISTANCE_METERS,
      timeInterval: MIN_UPDATE_INTERVAL_MS,
    },
    (position) => {
      maybeSend({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
  );
}
