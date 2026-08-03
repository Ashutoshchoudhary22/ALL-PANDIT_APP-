import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeColors as C } from '@/constants/home-theme';
import { formatINR } from '@/lib/booking-pricing';
import { WalletTransaction } from '@/services/wallet.api';

type WalletTransactionsModalProps = {
  visible: boolean;
  transactions: WalletTransaction[];
  onDismiss: () => void;
};

function formatTransactionDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTransactionType(type: WalletTransaction['type']) {
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

function TransactionRow({ item }: { item: WalletTransaction }) {
  const isCredit = item.amount > 0;

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>{formatTransactionType(item.type)}</Text>
        <Text style={styles.rowMeta}>{item.description || formatTransactionDate(item.createdAt)}</Text>
        <Text style={styles.rowDate}>{formatTransactionDate(item.createdAt)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowAmount, isCredit ? styles.credit : styles.debit]}>
          {isCredit ? '+' : ''}
          {formatINR(Math.abs(item.amount))}
        </Text>
        <Text style={styles.rowBalance}>Bal {formatINR(item.balanceAfter)}</Text>
      </View>
    </View>
  );
}

export function WalletTransactionsModal({
  visible,
  transactions,
  onDismiss,
}: WalletTransactionsModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet Transactions</Text>
          <Pressable onPress={onDismiss} hitSlop={12}>
            <Ionicons name="close" size={24} color={C.text} />
          </Pressable>
        </View>

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
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={40} color={C.textLight} />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Wallet top-ups and booking payments will appear here.
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  emptyList: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  rowMeta: { marginTop: 4, fontSize: 12, color: C.textMuted },
  rowDate: { marginTop: 2, fontSize: 11, color: C.textLight },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 14, fontWeight: '800' },
  credit: { color: C.success },
  debit: { color: '#DC2626' },
  rowBalance: { marginTop: 4, fontSize: 11, color: C.textMuted },
  separator: { height: 10 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: '700', color: C.text },
  emptySubtitle: { marginTop: 6, fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
});
