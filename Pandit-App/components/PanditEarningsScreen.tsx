import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
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
import { Brand, DashboardColors as C } from '@/constants/dashboard-theme';
import { advancePercentLabel } from '@/lib/booking-pricing';
import { usePanditEarnings } from '@/hooks/use-pandit-earnings';
import {
  EarningTransaction,
  formatEarningDate,
  formatEarningTime,
  formatINR,
} from '@/lib/pandit-earnings';
import { useAuth } from '@/providers/AuthProvider';

function SummaryCard({
  label,
  amount,
  subtitle,
  icon,
  iconColor,
  bgColor,
  accent,
}: {
  label: string;
  amount: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  accent: 'gold' | 'maroon' | 'saffron';
}) {
  return (
    <PremiumCard accent={accent} innerStyle={styles.summaryCardInner} style={styles.summaryCardWrap}>
      <LinearGradient
        colors={[bgColor, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <View style={[styles.summaryIconWrap, { borderColor: `${iconColor}44` }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryAmount}>{amount}</Text>
        <Text style={styles.summarySubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </LinearGradient>
    </PremiumCard>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );
}

function TransactionRow({ item }: { item: EarningTransaction }) {
  const isOnline = item.paymentMethod === 'online';

  return (
    <PremiumCard accent={isOnline ? 'saffron' : 'gold'} innerStyle={styles.transactionCardInner}>
      <View style={styles.transactionTop}>
        <View style={styles.transactionIconWrap}>
          <Ionicons name="flame-outline" size={18} color={C.primary} />
        </View>
        <View style={styles.transactionMain}>
          <Text style={styles.transactionService}>{item.serviceName}</Text>
          <Text style={styles.transactionCustomer}>{item.customerName}</Text>
        </View>
        <Text style={styles.transactionAmount}>{formatINR(item.amount)}</Text>
      </View>

      <View style={styles.transactionMeta}>
        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={13} color={C.maroon} />
          <Text style={styles.dateText}>{formatEarningDate(item.paidAt)}</Text>
          {formatEarningTime(item.paidAt) ? (
            <Text style={styles.timeText}>• {formatEarningTime(item.paidAt)}</Text>
          ) : null}
        </View>

        <View
          style={[
            styles.methodBadge,
            isOnline ? styles.methodBadgeOnline : styles.methodBadgeCash,
          ]}
        >
          <Ionicons
            name={isOnline ? 'card-outline' : 'cash-outline'}
            size={12}
            color={isOnline ? '#1D4ED8' : '#15803D'}
          />
          <Text
            style={[
              styles.methodBadgeText,
              isOnline ? styles.methodBadgeTextOnline : styles.methodBadgeTextCash,
            ]}
          >
            {item.paymentLabel}
          </Text>
        </View>
      </View>
    </PremiumCard>
  );
}

const keyExtractor = (item: EarningTransaction) => item.id;

export function PanditEarningsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const earningsQuery = usePanditEarnings(Boolean(token));
  const summary = earningsQuery.summary;

  const onlineCount = useMemo(
    () => summary.transactions.filter((t) => t.paymentMethod === 'online').length,
    [summary.transactions],
  );
  const cashCount = useMemo(
    () => summary.transactions.filter((t) => t.paymentMethod === 'cash').length,
    [summary.transactions],
  );

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void earningsQuery.refetch();
      }
    }, [token, earningsQuery.refetch]),
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<EarningTransaction>) => <TransactionRow item={item} />,
    [],
  );

  const handleRefresh = useCallback(() => {
    void earningsQuery.refetch();
  }, [earningsQuery.refetch]);

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
            <Text style={styles.headerTitle}>My Earnings</Text>
            <Text style={styles.headerSubtitle}>Track online & cash payments</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="wallet" size={22} color={C.maroon} />
            <Text style={styles.headerBadgeCount}>{formatINR(summary.totalEarned)}</Text>
            <Text style={styles.headerBadgeLabel}>Total Earned</Text>
          </View>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={200} />
        </View>
      </LinearGradient>

      <View style={styles.summaryStrip}>
        <SummaryCard
          label="Today"
          amount={formatINR(summary.todayAmount)}
          subtitle={
            summary.todayTransactionCount > 0
              ? `${summary.todayTransactionCount} received today`
              : 'No payments today'
          }
          icon="cash-outline"
          iconColor={C.primary}
          bgColor={C.orangeBg}
          accent="saffron"
        />
        <SummaryCard
          label={summary.currentMonthLabel}
          amount={formatINR(summary.currentMonthAmount)}
          subtitle={
            summary.currentMonthTransactionCount > 0
              ? `${summary.currentMonthTransactionCount} this month`
              : 'No payments this month'
          }
          icon="trending-up-outline"
          iconColor={C.success}
          bgColor={C.greenBg}
          accent="gold"
        />
        <SummaryCard
          label="Payments"
          amount={String(summary.transactions.length)}
          subtitle={`${onlineCount} online • ${cashCount} cash`}
          icon="receipt-outline"
          iconColor={C.purple}
          bgColor={C.purpleBg}
          accent="maroon"
        />
      </View>

      {earningsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... loading earnings</Text>
        </View>
      ) : earningsQuery.isError ? (
        <View style={styles.centerState}>
          <PremiumCard accent="maroon" innerStyle={styles.errorCardInner}>
            <View style={styles.errorContent}>
              <View style={styles.errorIconWrap}>
                <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
              </View>
              <Text style={styles.errorTitle}>Could not load earnings</Text>
              <Text style={styles.errorSubtitle}>Please check your connection and try again.</Text>
              <Pressable style={styles.retryBtnWrap} onPress={() => earningsQuery.refetch()}>
                <LinearGradient
                  colors={[C.maroon, C.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </PremiumCard>
        </View>
      ) : (
        <FlatList
          data={summary.transactions}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
            summary.transactions.length === 0 && styles.emptyList,
          ]}
          ListHeaderComponent={<SectionHeader title="Payment History" />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={earningsQuery.isRefetching && !earningsQuery.isLoading}
              onRefresh={handleRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="wallet-outline" size={36} color={C.maroon} />
                </View>
                <Text style={styles.emptyOm}>ॐ</Text>
                <Text style={styles.emptyTitle}>No earnings yet</Text>
                <Text style={styles.emptySubtitle}>
                  Payments will appear here when customers pay {advancePercentLabel()} advance online or you collect
                  remaining amount via cash or online.
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
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
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
  headerBadge: {
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.borderGold,
    minWidth: 88,
    maxWidth: 120,
  },
  headerBadgeCount: {
    fontSize: 14,
    fontWeight: '800',
    color: C.maroon,
    marginTop: 2,
    textAlign: 'center',
  },
  headerBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  headerDividerWrap: {
    marginTop: 14,
    opacity: 0.75,
  },
  summaryStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  summaryCardWrap: {
    flex: 1,
  },
  summaryCardInner: {
    padding: 0,
    overflow: 'hidden',
  },
  summaryCard: {
    borderRadius: 18,
    padding: 10,
    minHeight: 112,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  summaryLabel: {
    marginTop: 8,
    fontSize: 9,
    fontWeight: '700',
    color: C.textMuted,
  },
  summaryAmount: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
    color: C.maroon,
  },
  summarySubtitle: {
    marginTop: 3,
    fontSize: 8,
    lineHeight: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.maroon,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  transactionCardInner: {
    padding: 14,
  },
  transactionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  transactionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
  },
  transactionMain: {
    flex: 1,
  },
  transactionService: {
    fontSize: 15,
    fontWeight: '800',
    color: C.maroon,
  },
  transactionCustomer: {
    marginTop: 4,
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
  },
  transactionMeta: {
    marginTop: 12,
    gap: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    backgroundColor: C.creamDark,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.2)',
  },
  dateText: {
    fontSize: 12,
    color: C.text,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: C.textMuted,
  },
  methodBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  methodBadgeOnline: {
    backgroundColor: '#DBEAFE',
    borderColor: 'rgba(29, 78, 216, 0.15)',
  },
  methodBadgeCash: {
    backgroundColor: '#DCFCE7',
    borderColor: 'rgba(46, 125, 50, 0.15)',
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  methodBadgeTextOnline: {
    color: '#1D4ED8',
  },
  methodBadgeTextCash: {
    color: '#15803D',
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
    fontWeight: '500',
  },
  errorCardInner: {
    padding: 24,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '800',
    color: C.maroon,
  },
  errorSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtnWrap: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyCardInner: {
    padding: 32,
    marginTop: 20,
  },
  emptyWrap: {
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  emptyOm: {
    fontSize: 20,
    color: C.gold,
    marginTop: 12,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '800',
    color: C.maroon,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
});
