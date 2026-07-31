import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback, memo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useNotifications } from '@/providers/NotificationsProvider';
import { PanditNotification } from '@/services/notification.api';

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

function formatBookingDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const NotificationCard = memo(function NotificationCard({
  item,
  onPress,
}: {
  item: PanditNotification;
  onPress: (item: PanditNotification) => void;
}) {
  const booking = item.booking;
  const isConfirmed = item.type === 'booking:confirmed';

  return (
    <Pressable
      style={[styles.card, !item.read && styles.cardUnread, isConfirmed && !item.read && styles.cardConfirmedUnread]}
      onPress={() => onPress(item)}
    >
      <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread, isConfirmed && styles.iconWrapConfirmed]}>
        <Ionicons
          name={isConfirmed ? 'checkmark-circle-outline' : 'calendar-outline'}
          size={20}
          color={isConfirmed ? C.success : C.primary}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.title}>{item.title}</Text>
          {!item.read ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        {booking ? (
          <Text style={styles.meta}>
            {formatBookingDate(booking.bookingDate)} • Advance {booking.advanceAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
          </Text>
        ) : null}
        <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
});

function ListSeparator() {
  return <View style={styles.separator} />;
}

const keyExtractor = (item: PanditNotification) => item.id;

export function PanditNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, markAllRead, markAsRead, refreshNotifications } =
    useNotifications();

  useFocusEffect(
    useCallback(() => {
      markAllRead();
    }, [markAllRead]),
  );

  const handlePress = useCallback(
    (item: PanditNotification) => {
      markAsRead(item.id);
      if (item.type === 'booking:confirmed') {
        router.push('/(tabs)/bookings');
        return;
      }
      router.push('/booking-requests');
    },
    [markAsRead],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PanditNotification>) => (
      <NotificationCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const handleRefresh = useCallback(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            notifications.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={ListSeparator}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Booking requests and payment confirmations will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: C.text },
  headerSpacer: { width: 40 },
  listContent: { padding: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardUnread: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  cardConfirmedUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: {
    backgroundColor: '#FFEDD5',
  },
  iconWrapConfirmed: {
    backgroundColor: '#DCFCE7',
  },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: C.text },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: C.primary,
  },
  message: { marginTop: 4, fontSize: 13, lineHeight: 19, color: C.textMuted },
  meta: { marginTop: 8, fontSize: 12, fontWeight: '600', color: C.text },
  time: { marginTop: 6, fontSize: 11, color: C.textLight },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: C.text },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
});
