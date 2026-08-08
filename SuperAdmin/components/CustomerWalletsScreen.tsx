import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
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
import { AdminWalletTransactionsModal } from '@/components/AdminWalletTransactionsModal';
import { AdminEmptyState } from '@/components/ui/AdminEmptyState';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import {
  useCustomerWalletTransactionsQuery,
  useCustomerWalletsQuery,
} from '@/hooks/use-admin-wallets';
import { AdminCustomerWallet } from '@/services/admin-wallets.api';

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatUpdatedAt(value: string | null) {
  if (!value) return 'No wallet activity yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently updated';
  return `Updated ${parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function WalletCard({
  wallet,
  onPress,
}: {
  wallet: AdminCustomerWallet;
  onPress: (wallet: AdminCustomerWallet) => void;
}) {
  return (
    <Pressable onPress={() => onPress(wallet)}>
      <PremiumCard accent="purple" innerStyle={styles.cardInner}>
        <View style={styles.cardRow}>
          {wallet.profileImage ? (
            <Image source={{ uri: wallet.profileImage }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{wallet.customerName.charAt(0)}</Text>
            </View>
          )}

          <View style={styles.cardBody}>
            <Text style={styles.customerName}>{wallet.customerName}</Text>
            <Text style={styles.mobile}>{wallet.mobile}</Text>
            <Text style={styles.meta}>
              {wallet.transactionCount} transaction{wallet.transactionCount === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.balanceWrap}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>{formatINR(wallet.balance)}</Text>
            <View style={styles.viewRow}>
              <Text style={styles.viewText}>View</Text>
              <Ionicons name="chevron-forward" size={14} color={C.primary} />
            </View>
          </View>
        </View>
        <Text style={styles.updatedAt}>{formatUpdatedAt(wallet.updatedAt)}</Text>
      </PremiumCard>
    </Pressable>
  );
}

export function CustomerWalletsScreen() {
  const insets = useSafeAreaInsets();
  const walletsQuery = useCustomerWalletsQuery();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const transactionsQuery = useCustomerWalletTransactionsQuery(selectedCustomerId);

  const wallets = walletsQuery.data?.data.wallets ?? [];
  const totalBalance = walletsQuery.data?.data.totalBalance ?? 0;
  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.customerId === selectedCustomerId) ?? null,
    [selectedCustomerId, wallets],
  );
  const walletDetail = transactionsQuery.data?.data;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader
        title="Customer Wallets"
        subtitle="Tap a wallet to view all transactions"
      />

      {walletsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : walletsQuery.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.errorText}>Could not load customer wallets.</Text>
          <Pressable style={styles.retryBtn} onPress={() => walletsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={wallets}
          keyExtractor={(item) => String(item.customerId)}
          renderItem={({ item }) => (
            <WalletCard wallet={item} onPress={(wallet) => setSelectedCustomerId(wallet.customerId)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            wallets.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={walletsQuery.isRefetching}
              onRefresh={() => walletsQuery.refetch()}
              tintColor={C.primary}
            />
          }
          ListHeaderComponent={
            wallets.length > 0 ? (
              <PremiumCard accent="gold" innerStyle={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.summaryLabel}>Total Wallet Balance</Text>
                    <Text style={styles.summaryValue}>{formatINR(totalBalance)}</Text>
                  </View>
                  <View style={styles.summaryBadge}>
                    <Ionicons name="wallet-outline" size={22} color={C.primary} />
                  </View>
                </View>
                <Text style={styles.summaryMeta}>
                  {wallets.length} customer wallet{wallets.length === 1 ? '' : 's'}
                </Text>
              </PremiumCard>
            ) : null
          }
          ListEmptyComponent={
            <AdminEmptyState
              icon="wallet-outline"
              title="No customer wallets yet"
              subtitle="Customer wallet balances will appear here once customers register."
            />
          }
        />
      )}

      <AdminWalletTransactionsModal
        visible={selectedCustomerId != null}
        customerName={walletDetail?.customerName || selectedWallet?.customerName || 'Customer'}
        mobile={walletDetail?.mobile || selectedWallet?.mobile || ''}
        balance={walletDetail?.balance ?? selectedWallet?.balance ?? 0}
        transactions={walletDetail?.transactions ?? []}
        isLoading={transactionsQuery.isLoading}
        onDismiss={() => setSelectedCustomerId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: C.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  summaryCard: {
    marginBottom: 14,
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: '900',
    color: C.primaryDark,
  },
  summaryBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryMeta: {
    marginTop: 8,
    fontSize: 12,
    color: C.textLight,
  },
  cardInner: {
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  avatarFallback: {
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  mobile: {
    fontSize: 12,
    color: C.textMuted,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    color: C.textLight,
  },
  balanceWrap: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
  },
  balanceValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '900',
    color: C.primaryDark,
  },
  viewRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  updatedAt: {
    marginTop: 10,
    fontSize: 11,
    color: C.textLight,
  },
});
