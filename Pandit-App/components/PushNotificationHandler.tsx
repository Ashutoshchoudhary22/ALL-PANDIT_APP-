import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  getNativePushToken,
  parsePushNotificationData,
} from '@/lib/push-notifications';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { registerPushTokenApi } from '@/services/push.api';

function handleNotificationNavigation(type?: string) {
  if (type === 'booking:new') {
    router.push('/booking-requests');
    return;
  }

  if (type === 'booking:confirmed') {
    router.push('/(tabs)/bookings');
  }
}

export function PushNotificationHandler() {
  const { token, user, isLoading } = useAuth();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !token || user?.role !== 'pandit' || Platform.OS === 'web') {
      return;
    }

    let cancelled = false;

    const registerToken = async () => {
      try {
        const pushToken = await getNativePushToken();
        if (!pushToken || cancelled) return;
        if (registeredTokenRef.current === pushToken) return;

        await registerPushTokenApi(pushToken);
        registeredTokenRef.current = pushToken;
      } catch (error) {
        console.warn('Push token registration failed:', error);
      }
    };

    void registerToken();

    const tokenSubscription = Notifications.addPushTokenListener((event) => {
      const nextToken = event.data;
      if (!nextToken || registeredTokenRef.current === nextToken) return;

      void registerPushTokenApi(nextToken)
        .then(() => {
          registeredTokenRef.current = nextToken;
        })
        .catch((error) => {
          console.warn('Push token refresh registration failed:', error);
        });
    });

    return () => {
      cancelled = true;
      tokenSubscription.remove();
    };
  }, [token, user?.role, isLoading]);

  useEffect(() => {
    if (isLoading || !token || user?.role !== 'pandit') {
      return;
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = parsePushNotificationData(content.data as Record<string, unknown>);
      const type = data.type;
      const bookingId = Number(data.bookingId || 0);

      if (!type || !bookingId) return;

      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'requests'] });
      if (type === 'booking:confirmed') {
        queryClient.invalidateQueries({ queryKey: ['pandit', 'earnings'] });
      }

      addNotification({
        id:
          type === 'booking:confirmed'
            ? `booking-confirmed-${bookingId}`
            : `booking-${bookingId}`,
        type: type as 'booking:new' | 'booking:confirmed',
        title: content.title || data.title || 'Notification',
        message: content.body || data.message || '',
        bookingId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const content = response.notification.request.content;
        const data = parsePushNotificationData(content.data as Record<string, unknown>);
        const type = data.type;
        const bookingId = Number(data.bookingId || 0);
        const title = content.title || data.title || 'Notification';
        const message = content.body || data.message || 'Open the app to view details.';

        if (type && bookingId) {
          queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
          queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'requests'] });
          if (type === 'booking:confirmed') {
            queryClient.invalidateQueries({ queryKey: ['pandit', 'earnings'] });
          }

          addNotification({
            id:
              type === 'booking:confirmed'
                ? `booking-confirmed-${bookingId}`
                : `booking-${bookingId}`,
            type: type as 'booking:new' | 'booking:confirmed',
            title,
            message,
            bookingId,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }

        if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          handleNotificationNavigation(type);
        }
      },
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [token, user?.role, isLoading, queryClient, addNotification]);

  return null;
}
