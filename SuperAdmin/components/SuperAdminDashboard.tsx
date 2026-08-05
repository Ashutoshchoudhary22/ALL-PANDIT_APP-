import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
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

type StatCardProps = {
  label: string;
  value: string;
  trend: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
};

type BookingStatus = 'Upcoming' | 'Completed' | 'Ongoing' | 'Cancelled' | 'Pending';

type RecentBooking = {
  id: string;
  customer: string;
  customerInitials: string;
  customerColor: string;
  pandit: string;
  service: string;
  datetime: string;
  amount: string;
  status: BookingStatus;
};

const STATIC_STAT_CARDS: StatCardProps[] = [
  { label: 'Total Bookings', value: '12,458', trend: '18.7% vs last week', icon: 'calendar', iconColor: C.warning, iconBg: C.orangeBg },
  { label: 'Total Revenue', value: '₹24,78,560', trend: '16.4% vs last week', icon: 'cash', iconColor: C.yellow, iconBg: C.yellowBg },
  { label: 'Platform Earnings', value: '₹4,78,560', trend: '14.2% vs last week', icon: 'trending-up', iconColor: C.pink, iconBg: C.pinkBg },
  { label: 'Pandit Payouts', value: '₹19,45,000', trend: '16.1% vs last week', icon: 'wallet', iconColor: C.cyan, iconBg: C.cyanBg },
  { label: 'Total Reviews', value: '3,245', trend: '9.6% vs last week', icon: 'star', iconColor: C.primary, iconBg: C.purpleBg },
];

function formatCount(value: number) {
  return value.toLocaleString('en-IN');
}

const BOOKING_TREND = [42, 58, 45, 72, 65, 88, 76];
const BOOKING_LABELS = ['26 May', '27 May', '28 May', '29 May', '30 May', '31 May', '01 Jun'];

const BOOKING_STATUS = [
  { label: 'Completed', count: 6245, pct: 50.1, color: C.success },
  { label: 'Upcoming', count: 3215, pct: 25.8, color: C.info },
  { label: 'Cancelled', count: 1245, pct: 10.0, color: C.danger },
  { label: 'Ongoing', count: 1053, pct: 8.4, color: C.warning },
  { label: 'Pending', count: 700, pct: 5.6, color: C.primary },
];

const REVENUE_BARS = [65, 48, 72, 55, 80, 68, 90, 75];
const REVENUE_LABELS = ['05 May', '10 May', '15 May', '20 May', '25 May', '30 May'];

const NEW_USERS = [
  { label: 'Customers', pct: 66.7, color: C.info },
  { label: 'Pandits', pct: 33.3, color: C.success },
];

const QUICK_ACTIONS = [
  { label: 'Add Pandit', icon: 'person-add' as const, color: C.primary, bg: C.purpleBg },
  { label: 'Add Service', icon: 'add-circle' as const, color: C.success, bg: C.greenBg },
  { label: 'Manage Bookings', icon: 'calendar' as const, color: C.warning, bg: C.orangeBg },
  { label: 'Manage Coupons', icon: 'pricetag' as const, color: C.pink, bg: C.pinkBg },
  { label: 'View Reports', icon: 'bar-chart' as const, color: C.info, bg: C.blueBg },
  { label: 'System Settings', icon: 'settings' as const, color: C.textMuted, bg: '#F3F4F6' },
];

const RECENT_BOOKINGS: RecentBooking[] = [
  {
    id: '1',
    customer: 'Rahul Sharma',
    customerInitials: 'RS',
    customerColor: '#8B5CF6',
    pandit: 'Pt. Rakesh Tripathi',
    service: 'Griha Pravesh',
    datetime: '01 Jun, 11:00 AM',
    amount: '₹2,501',
    status: 'Upcoming',
  },
  {
    id: '2',
    customer: 'Priya Patel',
    customerInitials: 'PP',
    customerColor: '#EC4899',
    pandit: 'Pt. Sunil Mishra',
    service: 'Satyanarayan Puja',
    datetime: '31 May, 09:00 AM',
    amount: '₹3,500',
    status: 'Completed',
  },
  {
    id: '3',
    customer: 'Amit Kumar',
    customerInitials: 'AK',
    customerColor: '#3B82F6',
    pandit: 'Pt. Rajesh Tiwari',
    service: 'Rudrabhishek',
    datetime: '31 May, 04:00 PM',
    amount: '₹5,000',
    status: 'Ongoing',
  },
  {
    id: '4',
    customer: 'Sneha Gupta',
    customerInitials: 'SG',
    customerColor: '#22C55E',
    pandit: 'Pt. Anil Sharma',
    service: 'Marriage Puja',
    datetime: '30 May, 10:00 AM',
    amount: '₹8,500',
    status: 'Completed',
  },
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
}: {
  title: string;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? <Text style={styles.sectionAction}>{actionLabel}</Text> : null}
    </View>
  );
}

function StatCard({ label, value, trend, icon, iconColor, iconBg, loading }: StatCardProps) {
  return (
    <View style={styles.statCard}>
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
    </View>
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
  const max = Math.max(...data);
  const chartHeight = 96;

  return (
    <View style={styles.chartWrap}>
      <View style={[styles.lineChartArea, { height: chartHeight }]}>
        {data.map((point, index) => {
          const barHeight = (point / max) * chartHeight;
          return (
            <View key={labels[index]} style={styles.lineChartCol}>
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
        {labels.map((label) => (
          <Text key={label} style={styles.chartLabel} numberOfLines={1}>
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
  const max = Math.max(...data);
  const chartHeight = 100;

  return (
    <View style={styles.chartWrap}>
      <View style={[styles.barChartArea, { height: chartHeight }]}>
        {data.map((value, index) => (
          <View key={labels[index] ?? index} style={styles.barCol}>
            <LinearGradient
              colors={[C.primaryLight, C.primary]}
              style={[styles.bar, { height: (value / max) * chartHeight }]}
            />
          </View>
        ))}
      </View>
      <View style={styles.chartLabelsRow}>
        {labels.map((label) => (
          <Text key={label} style={styles.chartLabel} numberOfLines={1}>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <Pressable style={styles.quickAction}>
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
        <Text style={styles.bookingCustomer}>{booking.customer}</Text>
        <Text style={styles.bookingPandit}>{booking.pandit}</Text>
      </View>
      <View style={styles.bookingMeta}>
        <Text style={styles.bookingService}>{booking.service}</Text>
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
  return <View style={[styles.card, style]}>{children}</View>;
}

type SuperAdminDashboardProps = {
  adminName?: string;
  notificationCount?: number;
};

export function SuperAdminDashboard({
  adminName = 'Super Admin',
  notificationCount = 8,
}: SuperAdminDashboardProps) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useAdminDrawer();
  const { token } = useAuth();
  const statsQuery = useAdminDashboardStatsQuery(Boolean(token));
  const stats = statsQuery.data?.data;
  const statsLoading = statsQuery.isLoading;

  const statCards: StatCardProps[] = [
    {
      label: 'Total Users',
      value: formatCount(stats?.totalUsers ?? 0),
      trend: 'Customers + Pandits on platform',
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
    ...STATIC_STAT_CARDS,
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
              <Pressable style={styles.headerIconBtn}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
                {notificationCount > 0 ? (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{notificationCount}</Text>
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
              <LineAreaChart data={BOOKING_TREND} labels={BOOKING_LABELS} />
            </Card>

            <Card style={styles.chartCard}>
              <Text style={styles.cardTitle}>Bookings by Status</Text>
              <DonutChart
                segments={BOOKING_STATUS}
                centerValue="12,458"
                centerLabel="Total"
              />
            </Card>
          </View>

          <SectionHeader title="Quick Actions" />
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickAction key={action.label} {...action} />
            ))}
          </View>

          <SectionHeader title="Recent Bookings" actionLabel="View All >" />
          <Card>
            {RECENT_BOOKINGS.map((booking, index) => (
              <View key={booking.id}>
                <RecentBookingRow booking={booking} />
                {index < RECENT_BOOKINGS.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
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
                  <Text style={styles.revenueSummaryValue}>₹24,78,560</Text>
                </View>
                <View>
                  <Text style={styles.revenueSummaryLabel}>Platform Earnings</Text>
                  <Text style={[styles.revenueSummaryValue, { color: C.primary }]}>₹4,78,560</Text>
                </View>
              </View>
              <BarChart data={REVENUE_BARS} labels={REVENUE_LABELS} />
            </Card>

            <Card style={styles.chartCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>New Users Overview</Text>
                <FilterChip label="This Week" />
              </View>
              <DonutChart
                segments={NEW_USERS.map((u) => ({
                  label: u.label,
                  count: u.label === 'Customers' ? 856 : 428,
                  pct: u.pct,
                  color: u.color,
                }))}
                centerValue="1,284"
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
    backgroundColor: C.background,
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
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
});
