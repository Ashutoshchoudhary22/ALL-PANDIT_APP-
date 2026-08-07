import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
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
import { LiveLocationIconButton } from '@/components/LiveLocationIconButton';
import { AdminEmptyState } from '@/components/ui/AdminEmptyState';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useCustomerProfilesQuery } from '@/hooks/use-admin-profiles';
import { CustomerProfile } from '@/services/admin-profiles.api';

function fullName(profile: CustomerProfile) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
}

function CustomerProfileRow({ profile }: { profile: CustomerProfile }) {
  const name = fullName(profile);

  return (
    <PremiumCard accent="gold" innerStyle={styles.rowInner}>
      <View style={styles.row}>
        {profile.profileImage ? (
          <Image source={{ uri: profile.profileImage }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{profile.firstName.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {profile.cityName || 'City not set'} • {profile.gender}
          </Text>
          <Text style={styles.contact}>{profile.mobile}</Text>
          {profile.address ? (
            <Text style={styles.address} numberOfLines={1}>
              {profile.address}
            </Text>
          ) : null}
        </View>

        <LiveLocationIconButton
          name={name}
          latitude={profile.liveLatitude}
          longitude={profile.liveLongitude}
          updatedAt={profile.liveLocationAt}
          cityName={profile.cityName}
        />
      </View>
    </PremiumCard>
  );
}

export function CustomerProfilesScreen() {
  const insets = useSafeAreaInsets();
  const query = useCustomerProfilesQuery();
  const profiles = query.data?.data ?? [];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader title="Customer Profiles" subtitle="Manage all registered customers" />

      {query.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : query.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.errorText}>Could not load customer profiles.</Text>
          <Pressable style={styles.retryBtn} onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CustomerProfileRow profile={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            profiles.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />}
          ListEmptyComponent={
            <AdminEmptyState
              icon="people-outline"
              title="No customer profiles yet"
              subtitle="Customer profiles will appear here once created."
            />
          }
        />
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
    borderRadius: 14,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  rowInner: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: C.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueBg },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.info },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: C.text },
  meta: { marginTop: 3, fontSize: 12, color: C.textMuted },
  contact: { marginTop: 2, fontSize: 12, color: C.textLight },
  address: { marginTop: 4, fontSize: 11, color: C.textMuted },
  separator: { height: 12 },
});
