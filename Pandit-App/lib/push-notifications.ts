import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isPushNotificationsAvailable } from '@/lib/push-capability';

export const BOOKING_NOTIFICATION_CHANNEL = 'bookings';
const REGISTERED_PUSH_TOKEN_KEY = 'my_pandit_registered_push_token';

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

export async function hasPushPermission(): Promise<boolean> {
  if (!isPushNotificationsAvailable()) return true;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return true;

  const current = await Notifications.getPermissionsAsync();
  return (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
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

export async function getNativePushToken(options?: { requestIfNeeded?: boolean }): Promise<string | null> {
  if (!isPushNotificationsAvailable()) return null;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const granted = options?.requestIfNeeded
    ? await requestPushPermissions()
    : await hasPushPermission();
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

export async function saveRegisteredPushToken(token: string) {
  await AsyncStorage.setItem(REGISTERED_PUSH_TOKEN_KEY, token);
}

export async function getRegisteredPushToken() {
  return AsyncStorage.getItem(REGISTERED_PUSH_TOKEN_KEY);
}

export async function clearRegisteredPushToken() {
  await AsyncStorage.removeItem(REGISTERED_PUSH_TOKEN_KEY);
}

export async function unregisterStoredPushToken(
  unregisterApi: (token: string) => Promise<unknown>,
) {
  const storedToken = await getRegisteredPushToken();
  if (!storedToken) return;

  try {
    await unregisterApi(storedToken);
  } catch {
    // Ignore if already removed server-side.
  } finally {
    await clearRegisteredPushToken();
  }
}

export async function consumeInitialNotificationResponse(
  onResponse: (
    data: PushNotificationData,
    content: { title?: string | null; body?: string | null },
  ) => void,
  onNavigate?: (type?: string) => void,
) {
  if (!isPushNotificationsAvailable()) return;

  const Notifications = await loadNotificationsModule();
  if (!Notifications) return;

  const last = await Notifications.getLastNotificationResponseAsync();
  if (!last) return;

  const content = last.notification.request.content;
  const data = parsePushNotificationData(content.data as Record<string, unknown>);

  onResponse(data, content);

  if (last.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    onNavigate?.(data.type);
  }
}
