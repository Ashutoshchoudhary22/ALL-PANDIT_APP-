import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const ADMIN_NOTIFICATION_CHANNEL = 'admin-alerts';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ADMIN_NOTIFICATION_CHANNEL, {
    name: 'Admin Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C3AED',
    sound: 'default',
  });
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  await ensureAndroidNotificationChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function getNativePushToken(): Promise<string | null> {
  if (!Device.isDevice || Platform.OS === 'web') return null;

  const granted = await requestPushPermissions();
  if (!granted) return null;

  const tokenResult = await Notifications.getDevicePushTokenAsync();
  return tokenResult.data || null;
}

export type PushNotificationData = {
  type?: string;
  bookingId?: string;
  title?: string;
  message?: string;
};

export function parsePushNotificationData(
  data: Record<string, unknown> | undefined,
): PushNotificationData {
  if (!data) return {};

  return {
    type: typeof data.type === 'string' ? data.type : undefined,
    bookingId: typeof data.bookingId === 'string' ? data.bookingId : undefined,
    title: typeof data.title === 'string' ? data.title : undefined,
    message: typeof data.message === 'string' ? data.message : undefined,
  };
}

export function isAdminRole(role?: string | null) {
  return role === 'admin' || role === 'superadmin';
}
