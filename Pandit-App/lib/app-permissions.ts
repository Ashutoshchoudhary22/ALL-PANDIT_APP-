import * as Location from 'expo-location';

import { isPushNotificationsAvailable } from '@/lib/push-capability';
import { hasPushPermission, requestPushPermissions } from '@/lib/push-notifications';

export type PanditPermissionStatus = {
  foregroundLocation: boolean;
  backgroundLocation: boolean;
  notifications: boolean;
};

export function areAllPanditPermissionsGranted(status: PanditPermissionStatus) {
  return status.foregroundLocation && status.backgroundLocation && status.notifications;
}

export async function getPanditPermissionStatus(): Promise<PanditPermissionStatus> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();
  const notifications = isPushNotificationsAvailable() ? await hasPushPermission() : true;

  return {
    foregroundLocation: foreground.status === 'granted',
    backgroundLocation: background.status === 'granted',
    notifications,
  };
}

/** Request location (foreground + background) and notifications from one app action. */
export async function requestAllPanditPermissions(): Promise<PanditPermissionStatus> {
  const foreground = await Location.requestForegroundPermissionsAsync();

  let backgroundLocation = false;
  if (foreground.status === 'granted') {
    const background = await Location.requestBackgroundPermissionsAsync();
    backgroundLocation = background.status === 'granted';
  }

  let notifications = true;
  if (isPushNotificationsAvailable()) {
    notifications = await requestPushPermissions();
  }

  return {
    foregroundLocation: foreground.status === 'granted',
    backgroundLocation,
    notifications,
  };
}
