import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
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
}: {
  label: string;
  amount: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: bgColor }]}>
      <View style={[styles.summaryIconWrap, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryAmount}>{amount}</Text>
      <Text style={styles.summarySubtitle}>{subtitle}</Text>
    </View>
  );
}

function TransactionRow({ item }: { item: EarningTransaction }) {
  const isOnline = item.paymentMethod === 'online';

  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionTop}>
        <View style={styles.transactionMain}>
          <Text style={styles.transactionService}>{item.serviceName}</Text>
          <Text style={styles.transactionCustomer}>{item.customerName}</Text>
        </View>
        <Text style={styles.transactionAmount}>{formatINR(item.amount)}</Text>
      </View>

      <View style={styles.transactionMeta}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
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
    </View>
  );
}

const keyExtractor = (item: EarningTransaction) => item.id;

export function PanditEarningsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const earningsQuery = usePanditEarnings(Boolean(token));
  const summary = earningsQuery.summary;

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
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Earnings</Text>
      <Text style={styles.subtitle}>Track payments received online and in cash</Text>

      <View style={styles.summaryRow}>
        <SummaryCard
          label="Total Earned"
          amount={formatINR(summary.totalEarned)}
          subtitle={`${summary.transactions.length} payment${summary.transactions.length === 1 ? '' : 's'}`}
          icon="wallet-outline"
          iconColor={C.purple}
          bgColor={C.purpleBg}
        />
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
        />
      </View>

      <Text style={styles.sectionTitle}>Payment History</Text>

      {earningsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : earningsQuery.isError ? (
        <View style={styles.centerState}>
          <Text style={styles.centerText}>Could not load earnings.</Text>
          <Pressable style={styles.retryBtn} onPress={() => earningsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={summary.transactions}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
            summary.transactions.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={earningsQuery.isRefetching && !earningsQuery.isLoading}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="wallet-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No earnings yet</Text>
              <Text style={styles.emptySubtitle}>
                Payments will appear here when customers pay 40% advance online or you collect
                remaining amount via cash or online.
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
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 118,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  summaryAmount: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  summarySubtitle: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    color: C.textMuted,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
  },
  listContent: {
    paddingTop: 2,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  transactionCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  transactionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  transactionMain: {
    flex: 1,
  },
  transactionService: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: C.textLight,
  },
  methodBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  methodBadgeOnline: {
    backgroundColor: '#DBEAFE',
  },
  methodBadgeCash: {
    backgroundColor: '#DCFCE7',
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
  },
  centerText: {
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
    paddingTop: 60,
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
