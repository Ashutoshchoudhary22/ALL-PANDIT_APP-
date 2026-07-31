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

import { HomeColors as C } from '@/constants/home-theme';
import { useMyBookingsQuery } from '@/hooks/use-bookings';
import { formatINR } from '@/lib/booking-pricing';
import { useAuth } from '@/providers/AuthProvider';
import { Booking } from '@/services/booking.api';

const STATUS_STYLES: Record<
  Booking['status'],
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#B45309', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle-outline' },
  completed: { label: 'Completed', bg: '#EFF6FF', text: '#1D4ED8', icon: 'checkmark-done-outline' },
};

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

function BookingCard({ booking }: { booking: Booking }) {
  const statusStyle = STATUS_STYLES[booking.status];

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.serviceWrap}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <Text style={styles.panditName}>with {booking.panditName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
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
      </View>

      {booking.specialRequirements ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Special Requirements</Text>
          <Text style={styles.noteText}>{booking.specialRequirements}</Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.tagsRow}>
          {booking.samagriRequired ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Samagri included</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.totalPrice}>{formatINR(booking.totalPrice)}</Text>
      </View>
    </View>
  );
}

export function CustomerBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const bookingsQuery = useMyBookingsQuery(Boolean(token));
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
      <Text style={styles.subtitle}>Track your puja booking requests and status</Text>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>Loading your bookings...</Text>
        </View>
      ) : bookingsQuery.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
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
              <Ionicons name="calendar-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>
                Your booking requests will appear here once you book a pandit from the home screen.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 13,
    color: C.textMuted,
  },
  listContent: {
    paddingTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  serviceWrap: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  panditName: {
    marginTop: 4,
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },
  noteBox: {
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: C.border,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 12,
    fontSize: 14,
    color: C.textMuted,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
});
