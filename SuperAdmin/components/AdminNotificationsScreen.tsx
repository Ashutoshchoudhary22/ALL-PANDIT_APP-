import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/AdminScreenHeader';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useNotifications } from '@/providers/NotificationsProvider';
import { AdminNotification } from '@/services/notification.api';

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getIconName(type: AdminNotification['type']) {
  switch (type) {
    case 'admin:pandit:pending':
      return 'person-add-outline';
    case 'admin:pandit:update':
      return 'create-outline';
    default:
      return 'calendar-outline';
  }
}

function NotificationCard({
  item,
  onPress,
}: {
  item: AdminNotification;
  onPress: (item: AdminNotification) => void;
}) {
  return (
    <Pressable onPress={() => onPress(item)}>
      <PremiumCard accent={item.read ? 'none' : 'purple'} innerStyle={styles.cardInner}>
        <View style={styles.cardRow}>
          <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
            <Ionicons name={getIconName(item.type)} size={20} color={C.primary} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
              {!item.read ? <View style={styles.unreadDot} /> : null}
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textLight} />
        </View>
      </PremiumCard>
    </Pressable>
  );
}

export function AdminNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, markAllRead, markAsRead, refreshNotifications } =
    useNotifications();

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  useFocusEffect(
    useCallback(() => {
      void refreshNotifications();
    }, [refreshNotifications]),
  );

  const handlePress = (item: AdminNotification) => {
    markAsRead(item.id);

    if (item.type === 'admin:pandit:pending' || item.type === 'admin:pandit:update') {
      router.push('/pandit-profiles');
      return;
    }

    router.push('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} new update${unreadCount === 1 ? '' : 's'}`
            : 'All caught up'
        }
        rightAction={
          unreadCount > 0 ? (
            <Pressable onPress={markAllRead} hitSlop={8}>
              <Text style={styles.markAllRead}>Mark all read</Text>
            </Pressable>
          ) : null
        }
      />

      {isLoading && !notifications.length ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            !notifications.length && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => void refreshNotifications()}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <PremiumCard accent="gold" innerStyle={styles.emptyCard}>
              <Ionicons name="notifications-off-outline" size={36} color={C.textLight} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                New bookings and pandit approval requests will appear here.
              </Text>
            </PremiumCard>
          }
          renderItem={({ item }) => <NotificationCard item={item} onPress={handlePress} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  markAllRead: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 10,
  },
  cardInner: {
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: {
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  titleUnread: {
    color: C.primaryDark,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
  },
  message: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
});
