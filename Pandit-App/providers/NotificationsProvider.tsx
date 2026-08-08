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
import {
  PanditNotification,
  mergeNotifications,
} from '@/services/notification.api';
import { useAuth } from '@/providers/AuthProvider';

type NotificationsContextValue = {
  notifications: PanditNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: PanditNotification) => void;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  refreshNotifications: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<PanditNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback(
    async (items: PanditNotification[]) => {
      if (!user?.id) return;
      await saveNotifications(user.id, items);
    },
    [user?.id],
  );

  const refreshNotifications = useCallback(async () => {
    if (!token || user?.role !== 'pandit' || !user.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const stored = await loadNotifications(user.id);
      setNotifications(stored);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.id, user?.role]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== 'pandit') {
      setNotifications([]);
      setIsLoading(false);
      if (user?.id && !token) {
        void clearNotifications(user.id);
      }
      return;
    }
    void refreshNotifications();
  }, [authLoading, token, user?.id, user?.role, refreshNotifications]);

  const addNotification = useCallback(
    (notification: PanditNotification) => {
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

export async function clearUserNotifications(userId: number) {
  await clearNotifications(userId);
}
