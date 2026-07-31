import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
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

function NotificationCard({
  item,
  onPress,
}: {
  item: PanditNotification;
  onPress: (item: PanditNotification) => void;
}) {
  const booking = item.booking;

  return (
    <Pressable
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => onPress(item)}
    >
      <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
        <Ionicons name="calendar-outline" size={20} color={C.primary} />
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
}

export function PanditNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, markAllRead, markAsRead, refreshNotifications } =
    useNotifications();

  useFocusEffect(
    useCallback(() => {
      markAllRead();
    }, [markAllRead]),
  );

  const handlePress = (item: PanditNotification) => {
    markAsRead(item.id);
    router.push('/(tabs)/bookings');
  };

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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationCard item={item} onPress={handlePress} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            notifications.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => refreshNotifications()} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                New booking alerts will appear here when customers complete advance payment.
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
