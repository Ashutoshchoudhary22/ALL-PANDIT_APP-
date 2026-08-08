import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
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

import { AdminScreenHeader } from '@/components/AdminScreenHeader';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAdminDashboardStatsQuery } from '@/hooks/use-admin-stats';

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatTrendText(pct: number | null | undefined, fallback: string) {
  if (pct == null) return fallback;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct}% vs last week`;
}

function MetricCard({
  label,
  value,
  trend,
  icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  trend: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <PremiumCard accent="purple" innerStyle={styles.metricInner}>
      <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTrend}>{trend}</Text>
    </PremiumCard>
  );
}

function ProgressRow({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressCount}>{count}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(pct, 0)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressPct}>{pct.toFixed(1)}%</Text>
    </View>
  );
}

function TrendBars({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <View style={styles.trendBars}>
      {values.map((value, index) => {
        const height = (value / max) * 72;
        return (
          <View key={`${labels[index]}-${index}`} style={styles.trendCol}>
            <View style={[styles.trendBar, { height }]}>
              <LinearGradient colors={[`${C.primaryLight}55`, `${C.primary}22`]} style={StyleSheet.absoluteFill} />
            </View>
            <Text style={styles.trendLabel}>{labels[index]}</Text>
            <Text style={styles.trendValue}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function AdminReportsTabScreen() {
  const insets = useSafeAreaInsets();
  const statsQuery = useAdminDashboardStatsQuery();
  const stats = statsQuery.data?.data;

  const statusColors: Record<string, string> = {
    Completed: C.success,
    Upcoming: C.info,
    Ongoing: C.warning,
    Cancelled: C.danger,
    Pending: C.primary,
    'No bookings': C.textLight,
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader title="Reports" subtitle="Revenue, bookings and platform analytics" />

      {statsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : statsQuery.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.errorText}>Could not load reports.</Text>
          <Pressable style={styles.retryBtn} onPress={() => statsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={statsQuery.isRefetching} onRefresh={() => statsQuery.refetch()} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Total Revenue"
              value={formatINR(stats?.totalRevenue ?? 0)}
              trend={formatTrendText(stats?.trends.bookingsWeekChangePct, 'All-time booking value')}
              icon="cash-outline"
              iconColor={C.success}
              iconBg={C.greenBg}
            />
            <MetricCard
              label="Collected"
              value={formatINR(stats?.collectedRevenue ?? 0)}
              trend={`${formatINR(stats?.platformEarnings ?? 0)} platform`}
              icon="wallet-outline"
              iconColor={C.primary}
              iconBg={C.purpleBg}
            />
            <MetricCard
              label="Total Bookings"
              value={String(stats?.totalBookings ?? 0)}
              trend={formatTrendText(stats?.trends.bookingsWeekChangePct, 'Platform bookings')}
              icon="calendar-outline"
              iconColor={C.warning}
              iconBg={C.orangeBg}
            />
            <MetricCard
              label="Total Reviews"
              value={String(stats?.totalReviews ?? 0)}
              trend={`${stats?.newUsersThisWeek.total ?? 0} new users this week`}
              icon="star-outline"
              iconColor={C.gold}
              iconBg="#FFFBEB"
            />
          </View>

          <Text style={styles.sectionTitle}>Bookings Trend (7 Days)</Text>
          <PremiumCard accent="gold" innerStyle={styles.sectionCard}>
            <TrendBars
              labels={stats?.bookingTrend.map((item) => item.label) ?? []}
              values={stats?.bookingTrend.map((item) => item.count) ?? [0]}
            />
          </PremiumCard>

          <Text style={styles.sectionTitle}>Bookings by Status</Text>
          <PremiumCard accent="purple" innerStyle={styles.sectionCard}>
            {(stats?.bookingsByStatus ?? []).map((item) => (
              <ProgressRow
                key={item.label}
                label={item.label}
                count={item.count}
                pct={item.pct}
                color={statusColors[item.label] ?? C.primary}
              />
            ))}
          </PremiumCard>

          <Text style={styles.sectionTitle}>Revenue Trend (6 Months)</Text>
          <PremiumCard accent="none" innerStyle={styles.sectionCard}>
            {(stats?.revenueTrend ?? []).length ? (
              stats?.revenueTrend.map((item) => (
                <View key={item.label} style={styles.revenueRow}>
                  <Text style={styles.revenueLabel}>{item.label}</Text>
                  <Text style={styles.revenueValue}>{formatINR(item.amount)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No revenue data yet</Text>
            )}
          </PremiumCard>

          <Text style={styles.sectionTitle}>New Users This Week</Text>
          <PremiumCard accent="gold" innerStyle={styles.sectionCard}>
            <View style={styles.newUsersRow}>
              <View style={styles.newUsersItem}>
                <Text style={styles.newUsersValue}>{stats?.newUsersThisWeek.customers ?? 0}</Text>
                <Text style={styles.newUsersLabel}>Customers</Text>
              </View>
              <View style={styles.newUsersItem}>
                <Text style={styles.newUsersValue}>{stats?.newUsersThisWeek.pandits ?? 0}</Text>
                <Text style={styles.newUsersLabel}>Pandits</Text>
              </View>
              <View style={styles.newUsersItem}>
                <Text style={[styles.newUsersValue, { color: C.primary }]}>
                  {stats?.newUsersThisWeek.total ?? 0}
                </Text>
                <Text style={styles.newUsersLabel}>Total</Text>
              </View>
            </View>
            <Text style={styles.trendNote}>
              {formatTrendText(stats?.trends.newUsersWeekChangePct, 'Weekly user growth')}
            </Text>
          </PremiumCard>

          <PremiumCard accent="purple" innerStyle={styles.payoutCard}>
            <Text style={styles.payoutLabel}>Pandit Payouts (Estimated)</Text>
            <Text style={styles.payoutValue}>{formatINR(stats?.panditPayouts ?? 0)}</Text>
            <Text style={styles.payoutMeta}>
              Platform earnings {formatINR(stats?.platformEarnings ?? 0)} from collected revenue
            </Text>
          </PremiumCard>
        </ScrollView>
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
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricInner: { width: '48.5%', minWidth: 150, padding: 14 },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: { marginTop: 10, fontSize: 11, fontWeight: '700', color: C.textMuted },
  metricValue: { marginTop: 4, fontSize: 18, fontWeight: '900', color: C.text },
  metricTrend: { marginTop: 4, fontSize: 10, color: C.textLight },
  sectionTitle: { marginTop: 8, fontSize: 16, fontWeight: '800', color: C.text },
  sectionCard: { padding: 16 },
  trendBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 6 },
  trendCol: { flex: 1, alignItems: 'center' },
  trendBar: { width: '100%', borderRadius: 8, overflow: 'hidden', minHeight: 4 },
  trendLabel: { marginTop: 8, fontSize: 10, color: C.textMuted, fontWeight: '700' },
  trendValue: { marginTop: 2, fontSize: 11, color: C.text, fontWeight: '800' },
  progressRow: { marginBottom: 14 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  progressCount: { fontSize: 13, fontWeight: '800', color: C.primaryDark },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressPct: { marginTop: 4, fontSize: 11, color: C.textLight },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 160, 23, 0.12)',
  },
  revenueLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  revenueValue: { fontSize: 14, fontWeight: '800', color: C.primaryDark },
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center' },
  newUsersRow: { flexDirection: 'row', justifyContent: 'space-between' },
  newUsersItem: { alignItems: 'center', flex: 1 },
  newUsersValue: { fontSize: 24, fontWeight: '900', color: C.text },
  newUsersLabel: { marginTop: 4, fontSize: 12, fontWeight: '700', color: C.textMuted },
  trendNote: { marginTop: 12, fontSize: 12, color: C.textLight, textAlign: 'center' },
  payoutCard: { padding: 18, alignItems: 'center', marginTop: 4 },
  payoutLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase' },
  payoutValue: { marginTop: 8, fontSize: 28, fontWeight: '900', color: C.primaryDark },
  payoutMeta: { marginTop: 6, fontSize: 12, color: C.textLight, textAlign: 'center' },
});
