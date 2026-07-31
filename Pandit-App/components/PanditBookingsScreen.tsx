import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { memo, useCallback } from 'react';
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
import { usePanditBookingsQuery } from '@/hooks/use-pandit-bookings';
import { promptBookingLocation } from '@/lib/open-map';
import { useAuth } from '@/providers/AuthProvider';
import { PanditBooking } from '@/services/booking.api';

const STATUS_STYLES: Record<
  PanditBooking['status'],
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#B45309', icon: 'time-outline' },
  payment_pending: {
    label: 'Approved',
    bg: '#DBEAFE',
    text: '#1D4ED8',
    icon: 'checkmark-circle-outline',
  },
  confirmed: {
    label: 'Confirmed',
    bg: '#DCFCE7',
    text: '#15803D',
    icon: 'checkmark-circle-outline',
  },
  cancelled: {
    label: 'Rejected',
    bg: '#FEE2E2',
    text: '#B91C1C',
    icon: 'close-circle-outline',
  },
  completed: {
    label: 'Completed',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    icon: 'checkmark-done-outline',
  },
};

function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatBookingDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBookingTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const BookingCard = memo(function BookingCard({ booking }: { booking: PanditBooking }) {
  const statusStyle = STATUS_STYLES[booking.status];
  const isPaid = booking.paymentStatus === 'advance_paid' || booking.status === 'confirmed';
  const isRejected = booking.status === 'cancelled';

  const handleOpenMap = () => {
    promptBookingLocation({
      latitude: booking.latitude,
      longitude: booking.longitude,
      address: booking.address,
      label: `${booking.customerName} • ${booking.serviceName}`,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.mainInfo}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <Text style={styles.customerName}>{booking.customerName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      {booking.status === 'payment_pending' ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>Approved by you. Waiting for customer to pay 40% advance.</Text>
        </View>
      ) : null}

      {isRejected ? (
        <View style={[styles.infoBox, styles.infoBoxRejected]}>
          <Text style={[styles.infoBoxText, styles.infoBoxTextRejected]}>
            You rejected this booking request.
          </Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={16} color={C.textMuted} />
        <Text style={styles.metaText}>{formatBookingDate(booking.bookingDate)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={16} color={C.textMuted} />
        <Text style={styles.metaText}>{formatBookingTime(booking.bookingTime)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={16} color={C.textMuted} />
        <Text style={styles.metaText} numberOfLines={2}>
          {booking.address}
        </Text>
        <Pressable
          style={[styles.mapBtn, isRejected && styles.mapBtnDisabled]}
          onPress={handleOpenMap}
          hitSlop={8}
          disabled={isRejected}
          accessibilityLabel="Open booking location on map"
        >
          <Ionicons name="map-outline" size={20} color={C.primary} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        {isPaid ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>40% paid • {formatINR(booking.advanceAmount)}</Text>
          </View>
        ) : isRejected ? (
          <View style={[styles.tag, styles.tagRejected]}>
            <Text style={[styles.tagText, styles.tagRejectedText]}>Not confirmed</Text>
          </View>
        ) : (
          <View style={[styles.tag, styles.tagAwaiting]}>
            <Text style={[styles.tagText, styles.tagAwaitingText]}>Awaiting payment</Text>
          </View>
        )}
        <Text style={styles.totalPrice}>{formatINR(booking.totalPrice)}</Text>
      </View>
    </View>
  );
});

function ListSeparator() {
  return <View style={styles.separator} />;
}

const keyExtractor = (item: PanditBooking) => String(item.id);

export function PanditBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const bookingsQuery = usePanditBookingsQuery(Boolean(token));
  const bookings = bookingsQuery.data?.data ?? [];

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void bookingsQuery.refetch();
      }
    }, [token, bookingsQuery.refetch]),
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PanditBooking>) => <BookingCard booking={item} />,
    [],
  );

  const handleRefresh = useCallback(() => {
    void bookingsQuery.refetch();
  }, [bookingsQuery.refetch]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Bookings</Text>
      <Text style={styles.subtitle}>Approved, rejected and confirmed bookings</Text>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : bookingsQuery.isError ? (
        <View style={styles.centerState}>
          <Text style={styles.centerText}>Could not load bookings.</Text>
          <Pressable style={styles.retryBtn} onPress={() => bookingsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
            bookings.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={ListSeparator}
          refreshControl={
            <RefreshControl
              refreshing={bookingsQuery.isRefetching && !bookingsQuery.isLoading}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="clipboard-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>
                Bookings will appear here after you approve or reject customer requests.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  subtitle: { marginTop: 4, marginBottom: 16, fontSize: 13, color: C.textMuted },
  listContent: { paddingTop: 4 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  mainInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '800', color: C.text },
  customerName: { marginTop: 4, fontSize: 13, color: C.textMuted, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  infoBox: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBoxRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  infoBoxText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  infoBoxTextRejected: {
    color: '#B91C1C',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metaText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 19 },
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  mapBtnDisabled: {
    opacity: 0.45,
  },
  footer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  tagText: { fontSize: 11, fontWeight: '700', color: C.primary },
  tagAwaiting: {
    backgroundColor: '#DBEAFE',
  },
  tagAwaitingText: {
    color: '#1D4ED8',
  },
  tagRejected: {
    backgroundColor: '#FEE2E2',
  },
  tagRejectedText: {
    color: '#B91C1C',
  },
  totalPrice: { fontSize: 16, fontWeight: '800', color: C.primary },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 14, color: C.textMuted },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: C.text },
  emptySubtitle: { marginTop: 8, fontSize: 14, lineHeight: 21, color: C.textMuted, textAlign: 'center' },
});
