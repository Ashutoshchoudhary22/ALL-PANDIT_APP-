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
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useCustomerProfilesQuery } from '@/hooks/use-admin-profiles';
import { CustomerProfile } from '@/services/admin-profiles.api';

function fullName(profile: CustomerProfile) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
}

function CustomerProfileRow({ profile }: { profile: CustomerProfile }) {
  const name = fullName(profile);

  return (
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
  );
}

export function CustomerProfilesScreen() {
  const insets = useSafeAreaInsets();
  const query = useCustomerProfilesQuery();
  const profiles = query.data?.data ?? [];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <AdminScreenHeader title="Customer Profile" subtitle="Manage all customer profiles" />

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
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No customer profiles yet</Text>
              <Text style={styles.emptySubtitle}>Customer profiles will appear here once created.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { marginTop: 12, fontSize: 15, color: C.textMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  emptyList: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueBg },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.info },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: C.text },
  meta: { marginTop: 3, fontSize: 12, color: C.textMuted },
  contact: { marginTop: 2, fontSize: 12, color: C.textLight },
  address: { marginTop: 4, fontSize: 11, color: C.textMuted },
  separator: { height: 10 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: C.text },
  emptySubtitle: { marginTop: 6, fontSize: 14, color: C.textMuted, textAlign: 'center' },
});
