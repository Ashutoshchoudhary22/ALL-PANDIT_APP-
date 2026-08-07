import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  getNativePushToken,
  parsePushNotificationData,
} from '@/lib/push-notifications';
import { ADVANCE_RATE } from '@/lib/booking-pricing';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { registerPushTokenApi } from '@/services/push.api';

function handleNotificationNavigation(type?: string) {
  if (type === 'booking:approved' || type === 'booking:finish_otp') {
    router.push('/(tabs)/bookings');
    return;
  }

  if (type === 'booking:review_request') {
    router.push('/(tabs)/home');
  }
}

export function PushNotificationHandler() {
  const { token, user, isLoading } = useAuth();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !token || user?.role !== 'customer' || Platform.OS === 'web') {
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
    if (isLoading || !token || user?.role !== 'customer') {
      return;
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = parsePushNotificationData(content.data as Record<string, unknown>);
      const type = data.type;
      const bookingId = Number(data.bookingId || 0);

      if (!type || !bookingId) return;

      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });

      addNotification({
        id: `${type}-${bookingId}-${Date.now()}`,
        type: type as 'booking:approved' | 'booking:finish_otp' | 'booking:review_request',
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
        const message =
          content.body ||
          data.message ||
          (type === 'booking:approved'
            ? `Pay ${Math.round(ADVANCE_RATE * 100)}% advance now to confirm your booking.`
            : 'Open the app to view details.');

        if (type && bookingId) {
          queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });
          addNotification({
            id: `${type}-${bookingId}`,
            type: type as 'booking:approved' | 'booking:finish_otp' | 'booking:review_request',
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
