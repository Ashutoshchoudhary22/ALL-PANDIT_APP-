import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { AdminWalletTransaction } from '@/services/admin-wallets.api';

type AdminWalletTransactionsModalProps = {
  visible: boolean;
  customerName: string;
  mobile: string;
  balance: number;
  transactions: AdminWalletTransaction[];
  isLoading: boolean;
  onDismiss: () => void;
};

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatTransactionDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTransactionType(type: AdminWalletTransaction['type']) {
  switch (type) {
    case 'topup':
      return 'Top-up';
    case 'debit_advance':
      return 'Advance Paid';
    case 'debit_remaining':
      return 'Remaining Paid';
    case 'refund':
      return 'Refund';
    case 'adjustment':
      return 'Adjustment';
    default:
      return type;
  }
}

function formatStatus(status: AdminWalletTransaction['status']) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    default:
      return 'Completed';
  }
}

function TransactionRow({ item }: { item: AdminWalletTransaction }) {
  const isCredit = item.amount > 0;

  return (
    <PremiumCard accent="none" innerStyle={styles.rowInner}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={styles.rowTitleRow}>
            <Text style={styles.rowTitle}>{formatTransactionType(item.type)}</Text>
            {item.status !== 'completed' ? (
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'failed' ? styles.statusFailed : styles.statusPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'failed' ? styles.statusFailedText : styles.statusPendingText,
                  ]}
                >
                  {formatStatus(item.status)}
                </Text>
              </View>
            ) : null}
          </View>
          {item.description ? <Text style={styles.rowMeta}>{item.description}</Text> : null}
          <Text style={styles.rowDate}>{formatTransactionDate(item.createdAt)}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowAmount, isCredit ? styles.credit : styles.debit]}>
            {isCredit ? '+' : ''}
            {formatINR(Math.abs(item.amount))}
          </Text>
          {item.status === 'completed' ? (
            <Text style={styles.rowBalance}>Bal {formatINR(item.balanceAfter)}</Text>
          ) : null}
        </View>
      </View>
    </PremiumCard>
  );
}

export function AdminWalletTransactionsModal({
  visible,
  customerName,
  mobile,
  balance,
  transactions,
  isLoading,
  onDismiss,
}: AdminWalletTransactionsModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{customerName}</Text>
            <Text style={styles.subtitle}>{mobile}</Text>
          </View>
          <Pressable onPress={onDismiss} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={C.text} />
          </Pressable>
        </View>

        <PremiumCard accent="purple" innerStyle={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>{formatINR(balance)}</Text>
          <Text style={styles.balanceMeta}>
            {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
          </Text>
        </PremiumCard>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <Text style={styles.loaderText}>Loading transactions...</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <TransactionRow item={item} />}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 24 },
              transactions.length === 0 && styles.emptyList,
            ]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <PremiumCard accent="gold" innerStyle={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={36} color={C.textLight} />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Wallet top-ups and booking payments will appear here.
                </Text>
              </PremiumCard>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: C.textMuted,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  balanceValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '900',
    color: C.primaryDark,
  },
  balanceMeta: {
    marginTop: 6,
    fontSize: 12,
    color: C.textLight,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 14,
    color: C.textMuted,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  rowInner: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPendingText: {
    color: '#D97706',
  },
  statusFailedText: {
    color: '#DC2626',
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 17,
  },
  rowDate: {
    marginTop: 4,
    fontSize: 11,
    color: C.textLight,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  credit: {
    color: C.success,
  },
  debit: {
    color: C.danger,
  },
  rowBalance: {
    marginTop: 4,
    fontSize: 11,
    color: C.textMuted,
  },
  separator: {
    height: 10,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  emptySubtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
});
