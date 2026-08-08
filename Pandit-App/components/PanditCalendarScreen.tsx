import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
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

import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Brand, DashboardColors as C } from '@/constants/dashboard-theme';
import { usePanditBookingsQuery } from '@/hooks/use-pandit-bookings';
import { promptBookingLocation } from '@/lib/open-map';
import { useTabBackToHome } from '@/lib/tab-navigation';
import { useAuth } from '@/providers/AuthProvider';
import { PanditBooking } from '@/services/booking.api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES: Record<
  PanditBooking['status'],
  { label: string; bg: string; text: string }
> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#B45309' },
  payment_pending: { label: 'Approved', bg: '#DBEAFE', text: '#1D4ED8' },
  confirmed: { label: 'Confirmed', bg: '#DCFCE7', text: '#15803D' },
  in_progress: { label: 'In Progress', bg: '#FEF3C7', text: '#B45309' },
  awaiting_payment: { label: 'Collect Pay', bg: '#FFEDD5', text: '#C2410C' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C' },
  completed: { label: 'Completed', bg: '#EFF6FF', text: '#1D4ED8' },
};

function getLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function formatSelectedDateLabel(dateKey: string) {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
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

function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function bookingTimeValue(booking: PanditBooking) {
  const match = booking.bookingTime.match(/^(\d{1,2}):(\d{2})/);
  const hours = match ? Number(match[1]) : 0;
  const minutes = match ? Number(match[2]) : 0;
  return hours * 60 + minutes;
}

function CalendarDayCell({
  day,
  dateKey,
  selected,
  today,
  bookingCount,
  onPress,
}: {
  day: number;
  dateKey: string;
  selected: boolean;
  today: boolean;
  bookingCount: number;
  onPress: (dateKey: string) => void;
}) {
  return (
    <Pressable
      style={[
        styles.dayCell,
        selected && styles.dayCellSelected,
        today && !selected && styles.dayCellToday,
      ]}
      onPress={() => onPress(dateKey)}
    >
      <Text style={[styles.dayText, selected && styles.dayTextSelected, today && styles.dayTextToday]}>
        {day}
      </Text>
      {bookingCount > 0 ? (
        <View style={[styles.dayDot, selected && styles.dayDotSelected]}>
          <Text style={[styles.dayDotText, selected && styles.dayDotTextSelected]}>
            {bookingCount > 9 ? '9+' : bookingCount}
          </Text>
        </View>
      ) : (
        <View style={styles.dayDotSpacer} />
      )}
    </Pressable>
  );
}

function CalendarBookingRow({ booking }: { booking: PanditBooking }) {
  const statusStyle = STATUS_STYLES[booking.status];

  return (
    <PremiumCard accent="gold" innerStyle={styles.bookingInner}>
      <View style={styles.bookingTop}>
        <View style={styles.bookingMain}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <Text style={styles.customerName}>{booking.customerName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <View style={styles.bookingMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={C.maroon} />
          <Text style={styles.metaText}>{formatBookingTime(booking.bookingTime)}</Text>
        </View>
        <Text style={styles.amountText}>{formatINR(booking.totalPrice)}</Text>
      </View>

      <Pressable
        style={styles.mapBtn}
        onPress={() =>
          promptBookingLocation({
            latitude: booking.latitude,
            longitude: booking.longitude,
            address: booking.address,
            label: `${booking.customerName} • ${booking.serviceName}`,
          })
        }
      >
        <Ionicons name="location-outline" size={16} color={C.primary} />
        <Text style={styles.mapBtnText} numberOfLines={1}>
          {booking.address}
        </Text>
      </Pressable>
    </PremiumCard>
  );
}

export function PanditCalendarScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  useTabBackToHome();
  const bookingsQuery = usePanditBookingsQuery(Boolean(token));
  const bookings = bookingsQuery.data?.data ?? [];

  const todayKey = getLocalIsoDate();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void bookingsQuery.refetch();
      }
    }, [token, bookingsQuery.refetch]),
  );

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, PanditBooking[]>();

    for (const booking of bookings) {
      const key = booking.bookingDate.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(booking);
      map.set(key, list);
    }

    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort((a, b) => bookingTimeValue(a) - bookingTimeValue(b)),
      );
    }

    return map;
  }, [bookings]);

  const selectedBookings = bookingsByDate.get(selectedDate) ?? [];

  const calendarCells = useMemo(() => {
    const { year, month } = visibleMonth;
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay();
    const cells: Array<{ day: number; dateKey: string } | null> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, dateKey });
    }

    return cells;
  }, [visibleMonth]);

  const monthBookingCount = useMemo(() => {
    const prefix = `${visibleMonth.year}-${String(visibleMonth.month + 1).padStart(2, '0')}-`;
    let count = 0;
    for (const [key, list] of bookingsByDate.entries()) {
      if (key.startsWith(prefix)) count += list.length;
    }
    return count;
  }, [bookingsByDate, visibleMonth]);

  const goToPreviousMonth = () => {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month - 1, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const goToNextMonth = () => {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month + 1, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const goToToday = () => {
    const now = new Date();
    setVisibleMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(todayKey);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerOm}>ॐ</Text>
            <Text style={styles.headerTitle}>Puja Calendar</Text>
            <Text style={styles.headerSubtitle}>Date-wise booking schedule</Text>
          </View>
          <Pressable style={styles.todayBtn} onPress={goToToday}>
            <Text style={styles.todayBtnText}>Today</Text>
          </Pressable>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={200} />
        </View>
      </LinearGradient>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... loading schedule</Text>
        </View>
      ) : (
        <FlatList
          data={selectedBookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CalendarBookingRow booking={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
            selectedBookings.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={bookingsQuery.isRefetching && !bookingsQuery.isLoading}
              onRefresh={() => bookingsQuery.refetch()}
              tintColor={C.primary}
            />
          }
          ListHeaderComponent={
            <>
              <PremiumCard accent="saffron" innerStyle={styles.calendarCard}>
                <View style={styles.monthHeader}>
                  <Pressable style={styles.monthNavBtn} onPress={goToPreviousMonth} hitSlop={8}>
                    <Ionicons name="chevron-back" size={20} color={C.maroon} />
                  </Pressable>
                  <View style={styles.monthTitleWrap}>
                    <Text style={styles.monthTitle}>
                      {formatMonthYear(visibleMonth.year, visibleMonth.month)}
                    </Text>
                    <Text style={styles.monthMeta}>
                      {monthBookingCount} booking{monthBookingCount === 1 ? '' : 's'} this month
                    </Text>
                  </View>
                  <Pressable style={styles.monthNavBtn} onPress={goToNextMonth} hitSlop={8}>
                    <Ionicons name="chevron-forward" size={20} color={C.maroon} />
                  </Pressable>
                </View>

                <View style={styles.weekdayRow}>
                  {WEEKDAYS.map((label) => (
                    <Text key={label} style={styles.weekdayText}>
                      {label}
                    </Text>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {calendarCells.map((cell, index) =>
                    cell ? (
                      <CalendarDayCell
                        key={cell.dateKey}
                        day={cell.day}
                        dateKey={cell.dateKey}
                        selected={cell.dateKey === selectedDate}
                        today={cell.dateKey === todayKey}
                        bookingCount={bookingsByDate.get(cell.dateKey)?.length ?? 0}
                        onPress={setSelectedDate}
                      />
                    ) : (
                      <View key={`empty-${index}`} style={styles.dayCellEmpty} />
                    ),
                  )}
                </View>
              </PremiumCard>

              <View style={styles.selectedHeader}>
                <Text style={styles.selectedTitle}>{formatSelectedDateLabel(selectedDate)}</Text>
                <Text style={styles.selectedMeta}>
                  {selectedBookings.length} booking{selectedBookings.length === 1 ? '' : 's'}
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <PremiumCard accent="gold" innerStyle={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={36} color={C.maroon} />
              <Text style={styles.emptyTitle}>No bookings on this date</Text>
              <Text style={styles.emptySubtitle}>
                Select another date or wait for new approved bookings.
              </Text>
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
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
  todayBtn: {
    backgroundColor: C.cream,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.maroon,
  },
  headerDividerWrap: {
    marginTop: 14,
    opacity: 0.75,
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  emptyList: {
    flexGrow: 1,
  },
  calendarCard: {
    padding: 14,
    marginBottom: 14,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  monthTitleWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.maroon,
  },
  monthMeta: {
    marginTop: 2,
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: C.textLight,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 4,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCellSelected: {
    backgroundColor: C.maroon,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextToday: {
    color: C.maroon,
  },
  dayDot: {
    marginTop: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#FFF0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotSelected: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  dayDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.primary,
  },
  dayDotTextSelected: {
    color: '#fff',
  },
  dayDotSpacer: {
    height: 18,
    marginTop: 4,
  },
  selectedHeader: {
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.maroon,
  },
  selectedMeta: {
    marginTop: 4,
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '600',
  },
  separator: {
    height: 10,
  },
  bookingInner: {
    padding: 14,
  },
  bookingTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bookingMain: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.maroon,
  },
  customerName: {
    marginTop: 4,
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bookingMeta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.primary,
  },
  mapBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.creamDark,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.2)',
  },
  mapBtnText: {
    flex: 1,
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.maroon,
  },
  emptySubtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
});
