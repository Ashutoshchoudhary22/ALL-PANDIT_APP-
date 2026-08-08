import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAdminDashboardStatsQuery } from '@/hooks/use-admin-stats';
import { useAdminDrawer } from '@/providers/AdminDrawerProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useNotifications } from '@/providers/NotificationsProvider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { AdminRecentBooking } from '@/services/admin-stats.api';

type StatCardProps = {
  label: string;
  value: string;
  trend: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
};

type BookingStatus = AdminRecentBooking['displayStatus'];

type RecentBooking = AdminRecentBooking & {
  customerInitials: string;
  customerColor: string;
  datetime: string;
  amount: string;
  status: BookingStatus;
};

const STATUS_COLORS: Record<string, string> = {
  Completed: C.success,
  Upcoming: C.info,
  Ongoing: C.warning,
  Cancelled: C.danger,
  Pending: C.primary,
  'No bookings': C.textLight,
};

const AVATAR_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#22C55E', '#F97316'];

function formatCount(value: number) {
  return value.toLocaleString('en-IN');
}

function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatTrendText(pct: number | null | undefined, fallback: string) {
  if (pct == null) return fallback;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct}% vs last week`;
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function formatBookingDateTime(bookingDate: string, bookingTime: string) {
  const parsed = new Date(`${bookingDate}T${bookingTime || '12:00:00'}`);
  if (Number.isNaN(parsed.getTime())) return `${bookingDate} ${bookingTime}`;
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function mapRecentBooking(booking: AdminRecentBooking): RecentBooking {
  return {
    ...booking,
    customerInitials: initials(booking.customerName),
    customerColor: avatarColor(booking.customerName),
    datetime: formatBookingDateTime(booking.bookingDate, booking.bookingTime),
    amount: formatINR(booking.totalPrice),
    status: booking.displayStatus,
  };
}

function formatBadgeCount(count: number) {
  if (count <= 0) return '';
  if (count > 9) return '9+';
  return String(count);
}

const QUICK_ACTIONS = [
  { label: 'Add Pandit', icon: 'person-add' as const, color: C.primary, bg: C.purpleBg, href: '/pandit-profiles' as const },
  { label: 'Add Service', icon: 'add-circle' as const, color: C.success, bg: C.greenBg },
  { label: 'Manage Bookings', icon: 'calendar' as const, color: C.warning, bg: C.orangeBg, href: '/(tabs)/bookings' as const },
  { label: 'Manage Coupons', icon: 'pricetag' as const, color: C.pink, bg: C.pinkBg },
  { label: 'View Reports', icon: 'bar-chart' as const, color: C.info, bg: C.blueBg, href: '/(tabs)/reports' as const },
  { label: 'System Settings', icon: 'settings' as const, color: C.textMuted, bg: '#F3F4F6', href: '/(tabs)/more' as const },
];


const STATUS_STYLES: Record<BookingStatus, { bg: string; text: string }> = {
  Upcoming: { bg: '#DBEAFE', text: '#2563EB' },
  Completed: { bg: '#DCFCE7', text: '#16A34A' },
  Ongoing: { bg: '#FFEDD5', text: '#EA580C' },
  Cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  Pending: { bg: '#EDE9FE', text: '#7C3AED' },
};

function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        onActionPress ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        )
      ) : null}
    </View>
  );
}

function StatCard({ label, value, trend, icon, iconColor, iconBg, loading }: StatCardProps) {
  return (
    <PremiumCard accent="purple" innerStyle={styles.statCardInner} style={styles.statCardWrap}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator style={styles.statLoader} size="small" color={C.primary} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statTrend}>{trend}</Text>
    </PremiumCard>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <Pressable style={styles.filterChip}>
      <Text style={styles.filterChipText}>{label}</Text>
      <Ionicons name="chevron-down" size={14} color={C.textMuted} />
    </Pressable>
  );
}

function LineAreaChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  const chartHeight = 96;

  return (
    <View style={styles.chartWrap}>
      <View style={[styles.lineChartArea, { height: chartHeight }]}>
        {data.map((point, index) => {
          const barHeight = (point / max) * chartHeight;
          return (
            <View key={`line-point-${index}`} style={styles.lineChartCol}>
              <View style={[styles.lineChartBar, { height: barHeight }]}>
                <LinearGradient
                  colors={[`${C.primaryLight}55`, `${C.primary}22`]}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <View style={[styles.lineChartDot, { bottom: barHeight - 4 }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.chartLabelsRow}>
        {labels.map((label, index) => (
          <Text key={`line-label-${index}`} style={styles.chartLabel} numberOfLines={1}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; count: number; pct: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const ringColors = segments.slice(0, 4).map((s) => s.color);

  return (
    <View style={styles.donutWrap}>
      <View style={styles.donutChartArea}>
        <View
          style={[
            styles.donutRing,
            {
              borderTopColor: ringColors[0] ?? C.border,
              borderRightColor: ringColors[1] ?? C.border,
              borderBottomColor: ringColors[2] ?? C.border,
              borderLeftColor: ringColors[3] ?? C.border,
            },
          ]}
        />
        <View style={styles.donutCenter}>
          <Text style={styles.donutCenterValue}>{centerValue}</Text>
          <Text style={styles.donutCenterLabel}>{centerLabel}</Text>
        </View>
      </View>
      <View style={styles.legendList}>
        {segments.map((segment) => (
          <View key={segment.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendLabel}>{segment.label}</Text>
            <Text style={styles.legendValue}>
              {segment.count.toLocaleString('en-IN')} ({segment.pct}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  const chartHeight = 100;

  return (
    <View style={styles.chartWrap}>
      <View style={[styles.barChartArea, { height: chartHeight }]}>
        {data.map((value, index) => (
          <View key={`bar-${index}`} style={styles.barCol}>
            <LinearGradient
              colors={[C.primaryLight, C.primary]}
              style={[styles.bar, { height: (value / max) * chartHeight }]}
            />
          </View>
        ))}
      </View>
      <View style={styles.chartLabelsRow}>
        {labels.map((label, index) => (
          <Text key={`line-label-${index}`} style={styles.chartLabel} numberOfLines={1}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function RecentBookingRow({ booking }: { booking: RecentBooking }) {
  const statusStyle = STATUS_STYLES[booking.status];

  return (
    <View style={styles.bookingRow}>
      <Avatar initials={booking.customerInitials} color={booking.customerColor} />
      <View style={styles.bookingMain}>
        <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
        <Text style={styles.bookingPandit}>{booking.panditName}</Text>
      </View>
      <View style={styles.bookingMeta}>
        <Text style={styles.bookingService}>{booking.serviceName}</Text>
        <View style={styles.bookingTimeRow}>
          <Ionicons name="calendar-outline" size={12} color={C.textLight} />
          <Text style={styles.bookingTime}>{booking.datetime}</Text>
        </View>
      </View>
      <View style={styles.bookingRight}>
        <Text style={styles.bookingAmount}>{booking.amount}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{booking.status}</Text>
        </View>
      </View>
      <Pressable hitSlop={8} style={styles.menuBtn}>
        <Ionicons name="ellipsis-vertical" size={18} color={C.textLight} />
      </Pressable>
    </View>
  );
}

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <PremiumCard accent="gold" innerStyle={{ padding: 16 }} style={style as never}>
      {children}
    </PremiumCard>
  );
}

type SuperAdminDashboardProps = {
  adminName?: string;
};

export function SuperAdminDashboard({
  adminName = 'Super Admin',
}: SuperAdminDashboardProps) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useAdminDrawer();
  const { token } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();
  const badgeLabel = formatBadgeCount(unreadCount);
  const statsQuery = useAdminDashboardStatsQuery(Boolean(token));
  const stats = statsQuery.data?.data;
  const statsLoading = statsQuery.isLoading || statsQuery.isFetching;

  const bookingTrendData = stats?.bookingTrend.map((item) => item.count) ?? [0, 0, 0, 0, 0, 0, 0];
  const bookingTrendLabels = stats?.bookingTrend.map((item) => item.label) ?? [];
  const bookingStatusSegments =
    stats?.bookingsByStatus.map((item) => ({
      ...item,
      color: STATUS_COLORS[item.label] ?? C.textLight,
    })) ?? [];
  const revenueBars = stats?.revenueTrend.map((item) => item.amount) ?? [0];
  const revenueLabels = stats?.revenueTrend.map((item) => item.label) ?? [];
  const newUsersTotal = stats?.newUsersThisWeek.total ?? 0;
  const newUserSegments =
    newUsersTotal > 0
      ? [
          {
            label: 'Customers',
            count: stats?.newUsersThisWeek.customers ?? 0,
            pct: Number((((stats?.newUsersThisWeek.customers ?? 0) / newUsersTotal) * 100).toFixed(1)),
            color: C.info,
          },
          {
            label: 'Pandits',
            count: stats?.newUsersThisWeek.pandits ?? 0,
            pct: Number((((stats?.newUsersThisWeek.pandits ?? 0) / newUsersTotal) * 100).toFixed(1)),
            color: C.success,
          },
        ]
      : [{ label: 'No new users', count: 0, pct: 0, color: C.textLight }];
  const recentBookings = (stats?.recentBookings ?? []).map(mapRecentBooking);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void refreshNotifications();
      }
    }, [token, refreshNotifications]),
  );

  const statCards: StatCardProps[] = [
    {
      label: 'Total Users',
      value: formatCount(stats?.totalUsers ?? 0),
      trend: `${formatCount(stats?.totalCustomers ?? 0)} customers • ${formatCount(stats?.totalPandits ?? 0)} pandits`,
      icon: 'people',
      iconColor: C.primary,
      iconBg: C.purpleBg,
      loading: statsLoading,
    },
    {
      label: 'Total Pandits',
      value: formatCount(stats?.totalPandits ?? 0),
      trend: 'Registered pandit accounts',
      icon: 'person',
      iconColor: C.success,
      iconBg: C.greenBg,
      loading: statsLoading,
    },
    {
      label: 'Total Customers',
      value: formatCount(stats?.totalCustomers ?? 0),
      trend: 'Registered customer accounts',
      icon: 'people-outline',
      iconColor: C.info,
      iconBg: C.blueBg,
      loading: statsLoading,
    },
    {
      label: 'Total Bookings',
      value: formatCount(stats?.totalBookings ?? 0),
      trend: formatTrendText(stats?.trends.bookingsWeekChangePct, 'Bookings this week'),
      icon: 'calendar',
      iconColor: C.warning,
      iconBg: C.orangeBg,
      loading: statsLoading,
    },
    {
      label: 'Total Revenue',
      value: formatINR(stats?.totalRevenue ?? 0),
      trend: `${formatINR(stats?.collectedRevenue ?? 0)} collected`,
      icon: 'cash',
      iconColor: C.yellow,
      iconBg: C.yellowBg,
      loading: statsLoading,
    },
    {
      label: 'Platform Earnings',
      value: formatINR(stats?.platformEarnings ?? 0),
      trend: '20% commission on collected payments',
      icon: 'trending-up',
      iconColor: C.pink,
      iconBg: C.pinkBg,
      loading: statsLoading,
    },
    {
      label: 'Pandit Payouts',
      value: formatINR(stats?.panditPayouts ?? 0),
      trend: 'Paid / payable to pandits',
      icon: 'wallet',
      iconColor: C.cyan,
      iconBg: C.cyanBg,
      loading: statsLoading,
    },
    {
      label: 'Total Reviews',
      value: formatCount(stats?.totalReviews ?? 0),
      trend: 'Customer booking reviews',
      icon: 'star',
      iconColor: C.primary,
      iconBg: C.purpleBg,
      loading: statsLoading,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statsQuery.isRefetching}
            onRefresh={() => {
              void statsQuery.refetch();
              void refreshNotifications();
            }}
            tintColor={C.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <LinearGradient
          colors={[...C.headerGradient]}
          style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerTop}>
            <Pressable style={styles.menuBtn} onPress={openDrawer} hitSlop={12}>
              <Ionicons name="menu" size={24} color="#fff" />
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable style={styles.headerIconBtn}>
                <Ionicons name="search" size={22} color="#fff" />
              </Pressable>
              <Pressable style={styles.headerIconBtn} onPress={() => router.push('/notifications')}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
                {badgeLabel ? (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
                  </View>
                ) : null}
              </Pressable>
              <View style={styles.adminAvatarWrap}>
                <View style={styles.adminAvatar}>
                  <Ionicons name="person" size={20} color={C.primary} />
                </View>
                <View style={styles.onlineDot} />
              </View>
            </View>
          </View>

          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeText}>
              Welcome Back, <Text style={styles.welcomeBold}>{adminName}</Text>
            </Text>
            <Ionicons name="shield-checkmark" size={18} color="#FBBF24" />
          </View>
          <Text style={styles.platformText}>Pandit Booking Platform</Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </View>

        <View style={styles.content}>
          <View style={styles.chartsRow}>
            <Card style={styles.chartCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Bookings Overview</Text>
                <FilterChip label="This Week" />
              </View>
              <LineAreaChart data={bookingTrendData} labels={bookingTrendLabels} />
            </Card>

            <Card style={styles.chartCard}>
              <Text style={styles.cardTitle}>Bookings by Status</Text>
              <DonutChart
                segments={bookingStatusSegments}
                centerValue={formatCount(stats?.totalBookings ?? 0)}
                centerLabel="Total"
              />
            </Card>
          </View>

          <SectionHeader title="Quick Actions" />
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickAction
                key={action.label}
                {...action}
                onPress={action.href ? () => router.push(action.href) : undefined}
              />
            ))}
          </View>

          <SectionHeader
            title="Recent Bookings"
            actionLabel="View All >"
            onActionPress={() => router.push('/(tabs)/bookings')}
          />
          <Card>
            {recentBookings.length ? (
              recentBookings.map((booking, index) => (
                <View key={String(booking.id)}>
                  <RecentBookingRow booking={booking} />
                  {index < recentBookings.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyChartText}>
                {statsLoading ? 'Loading bookings...' : 'No bookings yet'}
              </Text>
            )}
          </Card>

          <View style={[styles.chartsRow, { marginTop: 20 }]}>
            <Card style={styles.chartCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Revenue Overview</Text>
                <FilterChip label="This Month" />
              </View>
              <View style={styles.revenueSummary}>
                <View>
                  <Text style={styles.revenueSummaryLabel}>Total Revenue</Text>
                  <Text style={styles.revenueSummaryValue}>{formatINR(stats?.totalRevenue ?? 0)}</Text>
                </View>
                <View>
                  <Text style={styles.revenueSummaryLabel}>Platform Earnings</Text>
                  <Text style={[styles.revenueSummaryValue, { color: C.primary }]}>
                    {formatINR(stats?.platformEarnings ?? 0)}
                  </Text>
                </View>
              </View>
              <BarChart data={revenueBars.length ? revenueBars : [0]} labels={revenueLabels.length ? revenueLabels : ['—']} />
            </Card>

            <Card style={styles.chartCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>New Users Overview</Text>
                <FilterChip label="This Week" />
              </View>
              <DonutChart
                segments={newUserSegments}
                centerValue={formatCount(newUsersTotal)}
                centerLabel="Total New Users"
              />
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  menuBtn: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  adminAvatarWrap: {
    position: 'relative',
  },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.success,
    borderWidth: 2,
    borderColor: '#fff',
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.92)',
  },
  welcomeBold: {
    fontWeight: '800',
    color: '#fff',
  },
  platformText: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: -12,
    gap: 8,
  },
  statCardWrap: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
  },
  statCardInner: {
    padding: 14,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
  statValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
  },
  statLoader: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statTrend: {
    marginTop: 6,
    fontSize: 11,
    color: C.textMuted,
  },
  trendUp: {
    color: C.success,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  chartsRow: {
    gap: 12,
    marginTop: 12,
  },
  card: {
    marginBottom: 0,
  },
  chartCard: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    flex: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  chartWrap: {
    marginTop: 4,
  },
  lineChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  lineChartCol: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  lineChartBar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
    minHeight: 8,
  },
  lineChartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  barChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 8,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 4,
  },
  chartLabel: {
    flex: 1,
    fontSize: 9,
    color: C.textLight,
    textAlign: 'center',
  },
  donutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donutChartArea: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 16,
  },
  donutCenter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  donutCenterValue: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  donutCenterLabel: {
    fontSize: 9,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  legendList: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 11,
    color: C.textMuted,
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '30%',
    flexGrow: 1,
    flexBasis: '28%',
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  bookingMain: {
    width: 88,
  },
  bookingCustomer: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  bookingPandit: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  bookingMeta: {
    flex: 1,
  },
  bookingService: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },
  bookingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  bookingTime: {
    fontSize: 10,
    color: C.textLight,
  },
  bookingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  bookingAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
  revenueSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  revenueSummaryLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
  revenueSummaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  emptyChartText: {
    paddingVertical: 24,
    textAlign: 'center',
    fontSize: 14,
    color: C.textMuted,
  },
});
