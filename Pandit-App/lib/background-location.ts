import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { PANDIT_BACKGROUND_LOCATION_TASK } from '@/tasks/background-location';

export async function hasBackgroundLocationPermission() {
  const { status } = await Location.getBackgroundPermissionsAsync();
  return status === 'granted';
}

export async function requestBackgroundLocationPermission() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    return false;
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === 'granted';
}

export async function isBackgroundLocationRunning() {
  const hasTask = await TaskManager.isTaskRegisteredAsync(PANDIT_BACKGROUND_LOCATION_TASK);
  if (!hasTask) return false;
  return Location.hasStartedLocationUpdatesAsync(PANDIT_BACKGROUND_LOCATION_TASK);
}

export async function startBackgroundLocationTracking() {
  const foregroundGranted = await Location.getForegroundPermissionsAsync();
  if (foregroundGranted.status !== 'granted') {
    return false;
  }

  const alreadyRunning = await isBackgroundLocationRunning();
  if (alreadyRunning) {
    return true;
  }

  await Location.startLocationUpdatesAsync(PANDIT_BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30_000,
    distanceInterval: 25,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'ApnaAcharya Pandit',
      notificationBody: 'Sharing your live location for bookings',
      notificationColor: '#FF8C00',
    },
    pausesUpdatesAutomatically: false,
  });

  return true;
}

export async function stopBackgroundLocationTracking() {
  const running = await isBackgroundLocationRunning();
  if (!running) return;

  await Location.stopLocationUpdatesAsync(PANDIT_BACKGROUND_LOCATION_TASK);
}
