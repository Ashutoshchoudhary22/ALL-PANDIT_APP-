import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  getNativePushToken,
  isAdminRole,
  parsePushNotificationData,
} from '@/lib/push-notifications';
import { useAuth } from '@/providers/AuthProvider';
import { registerPushTokenApi } from '@/services/push.api';

function handleNotificationNavigation(type?: string) {
  if (type === 'admin:booking:new') {
    router.push('/(tabs)');
    return;
  }

  if (type === 'admin:pandit:pending') {
    router.push('/pandit-profiles');
    return;
  }

  router.push('/(tabs)');
}

export function PushNotificationHandler() {
  const { token, user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !token || !isAdminRole(user?.role) || Platform.OS === 'web') {
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
    if (isLoading || !token || !isAdminRole(user?.role)) {
      return;
    }

    const invalidateAdminData = (type?: string) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      if (type === 'admin:pandit:pending') {
        queryClient.invalidateQueries({ queryKey: ['admin', 'pandit-profiles'] });
      }
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = parsePushNotificationData(
        notification.request.content.data as Record<string, unknown>,
      );
      invalidateAdminData(data.type);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = parsePushNotificationData(
          response.notification.request.content.data as Record<string, unknown>,
        );
        invalidateAdminData(data.type);

        if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          handleNotificationNavigation(data.type);
        }
      },
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [token, user?.role, isLoading, queryClient]);

  return null;
}
