import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import { AdminEmptyState } from '@/components/ui/AdminEmptyState';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAdminBookingsQuery } from '@/hooks/use-admin-bookings';
import { AdminBooking, AdminBookingsFilter } from '@/services/admin-bookings.api';

const FILTERS: Array<{ id: AdminBookingsFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Completed: { bg: '#DCFCE7', text: '#16A34A' },
  Upcoming: { bg: '#DBEAFE', text: '#2563EB' },
  Ongoing: { bg: '#FFEDD5', text: '#EA580C' },
  Cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  Pending: { bg: '#EDE9FE', text: '#7C3AED' },
};

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatBookingDateTime(bookingDate: string, bookingTime: string) {
  const parsed = new Date(`${bookingDate}T${bookingTime || '12:00:00'}`);
  if (Number.isNaN(parsed.getTime())) return `${bookingDate} ${bookingTime}`;
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BookingRow({ booking }: { booking: AdminBooking }) {
  const statusStyle = STATUS_STYLES[booking.displayStatus] ?? STATUS_STYLES.Pending;

  return (
    <PremiumCard accent="none" innerStyle={styles.rowInner}>
      <View style={styles.rowTop}>
        <View style={styles.rowLeft}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <Text style={styles.participants}>
            {booking.customerName} → {booking.panditName}
          </Text>
          <Text style={styles.datetime}>{formatBookingDateTime(booking.bookingDate, booking.bookingTime)}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.amount}>{formatINR(booking.totalPrice)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{booking.displayStatus}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.paymentMeta}>
        Payment: {booking.paymentStatus.replace(/_/g, ' ')} • Advance {formatINR(booking.advanceAmount)}
      </Text>
    </PremiumCard>
  );
}

export function AdminBookingsTabScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<AdminBookingsFilter>('all');
  const bookingsQuery = useAdminBookingsQuery(filter);
  const bookings = bookingsQuery.data?.data.bookings ?? [];
  const summary = bookingsQuery.data?.data.summary;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader title="Bookings" subtitle="Live platform booking activity" />

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : bookingsQuery.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.errorText}>Could not load bookings.</Text>
          <Pressable style={styles.retryBtn} onPress={() => bookingsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <BookingRow booking={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
            bookings.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={bookingsQuery.isRefetching}
              onRefresh={() => bookingsQuery.refetch()}
              tintColor={C.primary}
            />
          }
          ListHeaderComponent={
            <>
              <PremiumCard accent="purple" innerStyle={styles.summaryCard}>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary?.totalBookings ?? 0}</Text>
                    <Text style={styles.summaryLabel}>Total</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary?.pending ?? 0}</Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary?.ongoing ?? 0}</Text>
                    <Text style={styles.summaryLabel}>Ongoing</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary?.completed ?? 0}</Text>
                    <Text style={styles.summaryLabel}>Completed</Text>
                  </View>
                </View>
              </PremiumCard>

              <View style={styles.filtersRow}>
                {FILTERS.map((item) => {
                  const active = filter === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilter(item.id)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          }
          ListEmptyComponent={
            <AdminEmptyState
              icon="calendar-outline"
              title="No bookings found"
              subtitle="Bookings matching this filter will appear here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.screenBg },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { marginTop: 12, fontSize: 15, color: C.textMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 10 },
  summaryCard: { marginBottom: 14, padding: 16 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: '900', color: C.primaryDark },
  summaryLabel: { marginTop: 4, fontSize: 11, fontWeight: '700', color: C.textMuted },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
  },
  filterChipActive: { backgroundColor: C.purpleBg, borderColor: C.primary },
  filterChipText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  filterChipTextActive: { color: C.primary },
  rowInner: { padding: 14 },
  rowTop: { flexDirection: 'row', gap: 12 },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', gap: 8 },
  serviceName: { fontSize: 15, fontWeight: '800', color: C.text },
  participants: { marginTop: 4, fontSize: 12, color: C.textMuted },
  datetime: { marginTop: 2, fontSize: 11, color: C.textLight },
  amount: { fontSize: 15, fontWeight: '900', color: C.primaryDark },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  paymentMeta: { marginTop: 10, fontSize: 11, color: C.textLight },
});
