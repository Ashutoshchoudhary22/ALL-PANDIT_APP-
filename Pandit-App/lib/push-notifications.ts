import { Platform } from 'react-native';

import { isPushNotificationsAvailable } from '@/lib/push-capability';

export const BOOKING_NOTIFICATION_CHANNEL = 'bookings';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule> | null = null;
let handlerConfigured = false;

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (!isPushNotificationsAvailable()) return null;

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications');
  }

  const Notifications = await notificationsModulePromise;

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

  return Notifications;
}

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync(BOOKING_NOTIFICATION_CHANNEL, {
    name: 'Booking Updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C3AED',
    sound: 'default',
  });
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!isPushNotificationsAvailable()) return false;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

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
  if (!isPushNotificationsAvailable()) return null;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const granted = await requestPushPermissions();
  if (!granted) return null;

  const tokenResult = await Notifications.getDevicePushTokenAsync();
  return tokenResult.data || null;
}

export async function loadNotificationsModule() {
  return getNotificationsModule();
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
