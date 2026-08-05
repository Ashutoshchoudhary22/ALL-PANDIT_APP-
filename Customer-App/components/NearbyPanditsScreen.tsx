import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

import { PanditFiltersButton } from '@/components/PanditFiltersButton';
import { PanditProfileCard } from '@/components/PanditProfileCard';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Brand, HomeColors as C } from '@/constants/home-theme';
import { useFilteredPandits } from '@/hooks/use-filtered-pandits';
import { useApprovedPanditsQuery } from '@/hooks/use-approved-pandits';
import { useMyCustomerProfileQuery } from '@/hooks/use-customer-profile';
import { openBookPandit } from '@/lib/pandit-navigation';
import { usePanditFilters } from '@/providers/PanditFiltersProvider';
import { useAuth } from '@/providers/AuthProvider';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

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
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={C.maroon} />
          </Pressable>
          <PanditFiltersButton compact light />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerOm}>ॐ</Text>
          <Text style={styles.headerTitle}>{serviceName ?? 'Nearby Pandits'}</Text>
          <Text style={styles.headerSubtitle}>
            {serviceName
              ? `Verified pandits offering ${serviceName}`
              : 'Book verified pandits near you'}
          </Text>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={180} />
        </View>
      </LinearGradient>

      {panditsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... finding pandits</Text>
        </View>
      ) : panditsQuery.isError ? (
        <View style={styles.centerState}>
          <PremiumCard accent="maroon" innerStyle={styles.errorCardInner}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
              <Text style={styles.errorTitle}>Could not load pandits</Text>
              <Pressable style={styles.retryBtnWrap} onPress={() => panditsQuery.refetch()}>
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
            <RefreshControl
              refreshing={panditsQuery.isRefetching}
              onRefresh={() => panditsQuery.refetch()}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="person-outline" size={36} color={C.maroon} />
                </View>
                <Text style={styles.emptyOm}>ॐ</Text>
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
            </PremiumCard>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  headerContent: { paddingHorizontal: 2 },
  headerOm: { fontSize: 14, color: C.goldLight, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,248,240,0.85)',
    fontWeight: '500',
  },
  headerDividerWrap: { alignItems: 'center', marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  errorCardInner: { padding: 24 },
  errorContent: { alignItems: 'center', gap: 12 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: C.maroon },
  retryBtnWrap: { marginTop: 4, borderRadius: 12, overflow: 'hidden' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: '800' },
  emptyCardInner: { padding: 28 },
  emptyWrap: { alignItems: 'center', gap: 6 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
    marginBottom: 4,
  },
  emptyOm: { fontSize: 20, color: C.gold, fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.maroon, textAlign: 'center' },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
