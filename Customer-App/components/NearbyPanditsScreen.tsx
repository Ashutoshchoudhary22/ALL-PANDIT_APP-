import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
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

import { PanditProfileCard } from '@/components/PanditProfileCard';
import { PanditFiltersButton } from '@/components/PanditFiltersButton';
import { HomeColors as C } from '@/constants/home-theme';
import { useFilteredPandits } from '@/hooks/use-filtered-pandits';
import { useApprovedPanditsQuery } from '@/hooks/use-approved-pandits';
import { useMyCustomerProfileQuery } from '@/hooks/use-customer-profile';
import { usePanditFilters } from '@/providers/PanditFiltersProvider';
import { useAuth } from '@/providers/AuthProvider';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

import { openBookPandit } from '@/lib/pandit-navigation';

function openPanditDetail(pandit: PublicPanditProfile) {
  router.push(`/pandit/${pandit.id}`);
}

export function NearbyPanditsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { service } = useLocalSearchParams<{ service?: string }>();
  const { activeCount } = usePanditFilters();
  const profileQuery = useMyCustomerProfileQuery(Boolean(token));
  const serviceName = typeof service === 'string' && service.trim() ? service.trim() : undefined;
  const panditsQuery = useApprovedPanditsQuery(Boolean(token), serviceName);
  const approvedPandits = panditsQuery.data?.data ?? [];
  const profile = profileQuery.data?.data;
  const customerLatitude = profile?.liveLatitude ?? profile?.latitude ?? null;
  const customerLongitude = profile?.liveLongitude ?? profile?.longitude ?? null;
  const pandits = useFilteredPandits({
    pandits: approvedPandits,
    serviceName,
    customerLatitude,
    customerLongitude,
  });

  const handleBook = useCallback(
    (pandit: PublicPanditProfile) => {
      openBookPandit(pandit.id, serviceName);
    },
    [serviceName],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{serviceName ?? 'Nearby Pandits'}</Text>
          <Text style={styles.subtitle}>
            {serviceName
              ? `Pandits offering ${serviceName}`
              : 'Verified pandits available for booking'}
          </Text>
        </View>
        <PanditFiltersButton compact />
      </View>

      {panditsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>Loading pandits...</Text>
        </View>
      ) : panditsQuery.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.centerText}>Could not load pandits.</Text>
          <Pressable style={styles.retryBtn} onPress={() => panditsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={pandits}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <PanditProfileCard
              pandit={item}
              index={index}
              variant="list"
              serviceName={serviceName}
              customerLatitude={customerLatitude}
              customerLongitude={customerLongitude}
              onPress={openPanditDetail}
              onBook={handleBook}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            pandits.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={panditsQuery.isRefetching} onRefresh={() => panditsQuery.refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="person-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>
                {activeCount > 0
                  ? 'No pandits match your filters'
                  : serviceName
                    ? 'No pandits for this service'
                    : 'No verified pandits yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeCount > 0
                  ? 'Try changing or clearing your filters to see more pandits.'
                  : serviceName
                    ? `No approved pandits have added ${serviceName} to their profile yet.`
                    : 'Approved pandits will appear here once Super Admin verifies their profiles.'}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: C.textMuted,
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
    justifyContent: 'center',
    paddingTop: 80,
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
