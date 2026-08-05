import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, memo, useMemo } from 'react';
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

import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Brand, HomeColors as C } from '@/constants/home-theme';
import { formatINR, ADVANCE_RATE } from '@/lib/booking-pricing';
import {
  backFromProfileLinkedScreen,
  leaveProfileLinkedScreen,
  useProfileReturnBackHandler,
} from '@/lib/profile-navigation';
import { useNotifications } from '@/providers/NotificationsProvider';
import { CustomerNotification } from '@/services/notification.api';

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

const NotificationCard = memo(function NotificationCard({
  item,
  onPress,
}: {
  item: CustomerNotification;
  onPress: (item: CustomerNotification) => void;
}) {
  const advanceAmount = item.booking?.advanceAmount ?? 0;
  const accent = item.read ? 'none' : 'gold';

  return (
    <Pressable onPress={() => onPress(item)}>
      <PremiumCard accent={accent} innerStyle={styles.cardInner}>
        <View style={styles.cardRow}>
          <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={C.success} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
              {!item.read ? <View style={styles.unreadDot} /> : null}
            </View>
            <Text style={styles.message}>{item.message}</Text>
            {advanceAmount > 0 ? (
              <View style={styles.metaPill}>
                <Ionicons name="wallet-outline" size={12} color={C.maroon} />
                <Text style={styles.meta}>
                  Pay now: {formatINR(advanceAmount)} ({Math.round(ADVANCE_RATE * 100)}% advance)
                </Text>
              </View>
            ) : null}
            <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textLight} />
        </View>
      </PremiumCard>
    </Pressable>
  );
});

function ListSeparator() {
  return <View style={styles.separator} />;
}

const keyExtractor = (item: CustomerNotification) => item.id;

export function CustomerNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const fromProfile = useProfileReturnBackHandler();
  const { notifications, isLoading, markAllRead, markAsRead, refreshNotifications } =
    useNotifications();

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  useFocusEffect(
    useCallback(() => {
      markAllRead();
    }, [markAllRead]),
  );

  const handlePress = useCallback(
    (item: CustomerNotification) => {
      markAsRead(item.id);
      router.push('/(tabs)/bookings');
    },
    [markAsRead],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CustomerNotification>) => (
      <NotificationCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const handleRefresh = useCallback(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const handleBack = useCallback(() => {
    if (fromProfile) {
      backFromProfileLinkedScreen();
      return;
    }
    leaveProfileLinkedScreen();
  }, [fromProfile]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={C.maroon} />
          </Pressable>
          <View style={styles.headerBadge}>
            <Ionicons name="notifications" size={20} color={C.maroon} />
            <Text style={styles.headerBadgeCount}>{notifications.length}</Text>
            <Text style={styles.headerBadgeLabel}>Total</Text>
          </View>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerOm}>ॐ</Text>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} new update${unreadCount === 1 ? '' : 's'}`
              : 'Booking approvals & payment reminders'}
          </Text>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={180} />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... loading alerts</Text>
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
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            notifications.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={ListSeparator}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="notifications-outline" size={36} color={C.maroon} />
                </View>
                <Text style={styles.emptyOm}>ॐ</Text>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>
                  You will be notified here when a pandit approves your booking request.
                </Text>
              </View>
            </PremiumCard>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  headerContent: { paddingHorizontal: 2 },
  headerOm: {
    fontSize: 14,
    color: C.goldLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,248,240,0.85)',
    fontWeight: '500',
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
    minWidth: 72,
  },
  headerBadgeCount: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: C.maroon,
  },
  headerBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerDividerWrap: { alignItems: 'center', marginTop: 12 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  cardInner: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  iconWrapUnread: {
    backgroundColor: '#DCFCE7',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  titleUnread: { fontWeight: '800', color: C.maroon },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: C.primary,
  },
  message: { marginTop: 4, fontSize: 13, lineHeight: 19, color: C.textMuted },
  metaPill: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: C.creamDark,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  meta: { fontSize: 11, fontWeight: '700', color: C.success },
  time: { marginTop: 6, fontSize: 11, color: C.textLight, fontWeight: '500' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  emptyCardInner: { padding: 28 },
  emptyWrap: { alignItems: 'center', gap: 6 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
    marginBottom: 4,
  },
  emptyOm: { fontSize: 20, color: C.gold, fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.maroon, textAlign: 'center' },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
