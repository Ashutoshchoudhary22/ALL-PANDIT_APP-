import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
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
import { AdminEmptyState } from '@/components/ui/AdminEmptyState';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useCustomerProfilesQuery, usePanditProfilesQuery } from '@/hooks/use-admin-profiles';
import { useAdminDashboardStatsQuery } from '@/hooks/use-admin-stats';

type UserFilter = 'all' | 'customers' | 'pandits';

type UserListItem = {
  id: string;
  name: string;
  mobile: string;
  role: 'customer' | 'pandit';
  subtitle: string;
  profileImage: string | null;
  status?: string;
};

const FILTERS: Array<{ id: UserFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'customers', label: 'Customers' },
  { id: 'pandits', label: 'Pandits' },
];

function UserRow({ item, onPress }: { item: UserListItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <PremiumCard accent={item.role === 'pandit' ? 'purple' : 'gold'} innerStyle={styles.rowInner}>
        <View style={styles.row}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.roleBadge, item.role === 'pandit' ? styles.panditBadge : styles.customerBadge]}>
                <Text style={styles.roleBadgeText}>{item.role === 'pandit' ? 'Pandit' : 'Customer'}</Text>
              </View>
            </View>
            <Text style={styles.mobile}>{item.mobile}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textLight} />
        </View>
      </PremiumCard>
    </Pressable>
  );
}

export function AdminUsersTabScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<UserFilter>('all');
  const statsQuery = useAdminDashboardStatsQuery();
  const panditsQuery = usePanditProfilesQuery();
  const customersQuery = useCustomerProfilesQuery();

  const stats = statsQuery.data?.data;
  const isLoading = statsQuery.isLoading || panditsQuery.isLoading || customersQuery.isLoading;
  const isRefetching = statsQuery.isRefetching || panditsQuery.isRefetching || customersQuery.isRefetching;

  const users = useMemo(() => {
    const items: UserListItem[] = [];

    for (const profile of panditsQuery.data?.data ?? []) {
      items.push({
        id: `pandit-${profile.id}`,
        name: profile.name,
        mobile: profile.mobile,
        role: 'pandit',
        subtitle: `${profile.cityName || 'City not set'} • ${profile.status}`,
        profileImage: profile.profileImage,
        status: profile.status,
      });
    }

    for (const profile of customersQuery.data?.data ?? []) {
      const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      items.push({
        id: `customer-${profile.id}`,
        name,
        mobile: profile.mobile,
        role: 'customer',
        subtitle: profile.cityName || 'City not set',
        profileImage: profile.profileImage,
      });
    }

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [panditsQuery.data?.data, customersQuery.data?.data]);

  const filteredUsers = useMemo(() => {
    if (filter === 'customers') return users.filter((item) => item.role === 'customer');
    if (filter === 'pandits') return users.filter((item) => item.role === 'pandit');
    return users;
  }, [filter, users]);

  const refetchAll = () => {
    void statsQuery.refetch();
    void panditsQuery.refetch();
    void customersQuery.refetch();
  };

  const handlePress = (item: UserListItem) => {
    router.push(item.role === 'pandit' ? '/pandit-profiles' : '/customer-profiles');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader title="Users" subtitle="Manage pandits and customers" />

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserRow item={item} onPress={() => handlePress(item)} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
            filteredUsers.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchAll} tintColor={C.primary} />
          }
          ListHeaderComponent={
            <>
              <View style={styles.statsRow}>
                <PremiumCard accent="purple" innerStyle={styles.statCard}>
                  <Text style={styles.statValue}>{stats?.totalCustomers ?? 0}</Text>
                  <Text style={styles.statLabel}>Customers</Text>
                </PremiumCard>
                <PremiumCard accent="gold" innerStyle={styles.statCard}>
                  <Text style={styles.statValue}>{stats?.totalPandits ?? 0}</Text>
                  <Text style={styles.statLabel}>Pandits</Text>
                </PremiumCard>
                <PremiumCard accent="none" innerStyle={styles.statCard}>
                  <Text style={styles.statValue}>{stats?.newUsersThisWeek?.total ?? 0}</Text>
                  <Text style={styles.statLabel}>New This Week</Text>
                </PremiumCard>
              </View>

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
              icon="people-outline"
              title="No users found"
              subtitle="Users will appear here once they register on the platform."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.screenBg },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: C.primaryDark },
  statLabel: { marginTop: 4, fontSize: 11, fontWeight: '700', color: C.textMuted },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 16 },
  avatarFallback: { backgroundColor: C.purpleBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.primary },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '800', color: C.text },
  roleBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  panditBadge: { backgroundColor: C.purpleBg },
  customerBadge: { backgroundColor: '#FEF3C7' },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: C.primaryDark },
  mobile: { fontSize: 12, color: C.textMuted },
  subtitle: { fontSize: 11, color: C.textLight },
});
