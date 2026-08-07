import { useQuery } from '@tanstack/react-query';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { clearNotifications, loadNotifications, saveNotifications } from '@/lib/notification-storage';
import { isAdminRole } from '@/lib/push-notifications';
import { getAdminDashboardStatsApi } from '@/services/admin-stats.api';
import { listPanditProfilesApi } from '@/services/admin-profiles.api';
import {
  AdminNotification,
  buildAdminNotifications,
  mergeNotifications,
} from '@/services/notification.api';
import { useAuth } from '@/providers/AuthProvider';

type NotificationsContextValue = {
  notifications: AdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: AdminNotification) => void;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  refreshNotifications: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const adminEnabled = Boolean(token) && isAdminRole(user?.role) && Boolean(user?.id);

  const feedQuery = useQuery({
    queryKey: ['admin', 'notifications', 'feed'],
    queryFn: async () => {
      const [profilesResponse, statsResponse] = await Promise.all([
        listPanditProfilesApi(),
        getAdminDashboardStatsApi(),
      ]);
      return buildAdminNotifications(
        profilesResponse.data ?? [],
        statsResponse.data?.recentBookings ?? [],
      );
    },
    enabled: adminEnabled,
    staleTime: 30_000,
  });

  const isLoading = authLoading || (adminEnabled && feedQuery.isLoading);

  useEffect(() => {
    if (!adminEnabled || !user?.id) {
      if (!authLoading) {
        setNotifications([]);
      }
      if (user?.id && !token) {
        void clearNotifications(user.id);
      }
      return;
    }

    if (!feedQuery.data) return;

    void (async () => {
      const stored = await loadNotifications(user.id);
      const merged = mergeNotifications(stored, feedQuery.data);
      setNotifications(merged);
      await saveNotifications(user.id, merged);
    })();
  }, [adminEnabled, authLoading, feedQuery.data, token, user?.id]);

  const persist = useCallback(
    async (items: AdminNotification[]) => {
      if (!user?.id) return;
      await saveNotifications(user.id, items);
    },
    [user?.id],
  );

  const refreshNotifications = useCallback(async () => {
    if (!adminEnabled) {
      setNotifications([]);
      return;
    }
    await feedQuery.refetch();
  }, [adminEnabled, feedQuery]);

  const addNotification = useCallback(
    (notification: AdminNotification) => {
      setNotifications((prev) => {
        const merged = mergeNotifications(prev, [notification]);
        void persist(merged);
        return merged;
      });
    },
    [persist],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      void persist(next);
      return next;
    });
  }, [persist]);

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAllRead,
      markAsRead,
      refreshNotifications,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAllRead,
      markAsRead,
      refreshNotifications,
    ],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}
