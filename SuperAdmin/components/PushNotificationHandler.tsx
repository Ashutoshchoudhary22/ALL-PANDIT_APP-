import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { isPushNotificationsAvailable } from '@/lib/push-capability';
import {
  getNativePushToken,
  isAdminRole,
  loadNotificationsModule,
  parsePushNotificationData,
} from '@/lib/push-notifications';
import { useAuth } from '@/providers/AuthProvider';
import { registerPushTokenApi } from '@/services/push.api';

function handleNotificationNavigation(type?: string) {
  if (type === 'admin:booking:new') {
    router.push('/notifications');
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
    if (isLoading || !token || !isAdminRole(user?.role) || !isPushNotificationsAvailable()) {
      return;
    }

    let cancelled = false;
    let tokenSubscription: { remove: () => void } | null = null;

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

    void (async () => {
      const Notifications = await loadNotificationsModule();
      if (!Notifications || cancelled) return;

      void registerToken();

      tokenSubscription = Notifications.addPushTokenListener((event) => {
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
    })();

    return () => {
      cancelled = true;
      tokenSubscription?.remove();
    };
  }, [token, user?.role, isLoading]);

  useEffect(() => {
    if (isLoading || !token || !isAdminRole(user?.role) || !isPushNotificationsAvailable()) {
      return;
    }

    let cancelled = false;
    let receivedSubscription: { remove: () => void } | null = null;
    let responseSubscription: { remove: () => void } | null = null;

    const invalidateAdminData = (type?: string) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      if (type === 'admin:pandit:pending') {
        queryClient.invalidateQueries({ queryKey: ['admin', 'pandit-profiles'] });
      }
    };

    void (async () => {
      const Notifications = await loadNotificationsModule();
      if (!Notifications || cancelled) return;

      receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        const data = parsePushNotificationData(
          notification.request.content.data as Record<string, unknown>,
        );
        invalidateAdminData(data.type);
      });

      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = parsePushNotificationData(
          response.notification.request.content.data as Record<string, unknown>,
        );
        invalidateAdminData(data.type);

        if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          handleNotificationNavigation(data.type);
        }
      });
    })();

    return () => {
      cancelled = true;
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, [token, user?.role, isLoading, queryClient]);

  return null;
}
