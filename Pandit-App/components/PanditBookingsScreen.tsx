import { Ionicons } from '@expo/vector-icons';
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
import { usePanditBookingsQuery } from '@/hooks/use-pandit-bookings';
import { promptBookingLocation } from '@/lib/open-map';
import { useAuth } from '@/providers/AuthProvider';
import { PanditBooking } from '@/services/booking.api';

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

function BookingCard({ booking }: { booking: PanditBooking }) {
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
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle-outline" size={12} color="#15803D" />
          <Text style={styles.statusText}>Confirmed</Text>
        </View>
      </View>

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
          style={styles.mapBtn}
          onPress={handleOpenMap}
          hitSlop={8}
          accessibilityLabel="Open booking location on map"
        >
          <Ionicons name="map-outline" size={20} color={C.primary} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>40% paid • {formatINR(booking.advanceAmount)}</Text>
        </View>
        <Text style={styles.totalPrice}>{formatINR(booking.totalPrice)}</Text>
      </View>
    </View>
  );
}

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

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Bookings</Text>
      <Text style={styles.subtitle}>Paid bookings assigned to you</Text>

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
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <BookingCard booking={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
            bookings.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={bookingsQuery.isRefetching && !bookingsQuery.isLoading}
              onRefresh={() => bookingsQuery.refetch()}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="clipboard-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>
                New booking notifications will appear here when customers pay the 40% advance.
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
  statusText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
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
