import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
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
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Brand, HomeColors as C } from '@/constants/home-theme';
import { openBookPandit } from '@/lib/pandit-navigation';
import {
  backFromProfileLinkedScreen,
  leaveProfileLinkedScreen,
  useProfileReturnBackHandler,
} from '@/lib/profile-navigation';
import { useSavedPandits } from '@/providers/SavedPanditsProvider';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

function openPanditDetail(pandit: PublicPanditProfile) {
  router.push(`/pandit/${pandit.id}`);
}

export function SavedPanditsScreen() {
  const insets = useSafeAreaInsets();
  const fromProfile = useProfileReturnBackHandler();
  const { savedPandits, isLoading, refreshSavedPandits } = useSavedPandits();

  useFocusEffect(
    useCallback(() => {
      void refreshSavedPandits();
    }, [refreshSavedPandits]),
  );

  const handleBack = () => {
    if (fromProfile) {
      backFromProfileLinkedScreen();
      return;
    }
    leaveProfileLinkedScreen();
  };

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
          <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={C.maroon} />
          </Pressable>
          <View style={styles.headerBadge}>
            <Ionicons name="bookmark" size={18} color={C.maroon} />
            <Text style={styles.headerBadgeCount}>{savedPandits.length}</Text>
            <Text style={styles.headerBadgeLabel}>Saved</Text>
          </View>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerOm}>ॐ</Text>
          <Text style={styles.headerTitle}>Saved Pandits</Text>
          <Text style={styles.headerSubtitle}>Your bookmarked pandits for quick booking</Text>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={180} />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... loading saved pandits</Text>
        </View>
      ) : (
        <FlatList
          data={savedPandits}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <PanditProfileCard
              pandit={item}
              index={index}
              variant="list"
              onPress={openPanditDetail}
              onBook={(pandit) => openBookPandit(pandit.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            savedPandits.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refreshSavedPandits()}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="bookmark-outline" size={36} color={C.maroon} />
                </View>
                <Text style={styles.emptyOm}>ॐ</Text>
                <Text style={styles.emptyTitle}>No saved pandits yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the bookmark icon on any pandit card to save them here for quick access.
                </Text>
                <Pressable style={styles.browseBtnWrap} onPress={() => router.push('/nearby-pandits')}>
                  <LinearGradient
                    colors={[C.maroon, C.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.browseBtn}
                  >
                    <Text style={styles.browseBtnText}>Browse Pandits</Text>
                  </LinearGradient>
                </Pressable>
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
  headerBadge: {
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
    minWidth: 72,
  },
  headerBadgeCount: { marginTop: 2, fontSize: 18, fontWeight: '800', color: C.maroon },
  headerBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerDividerWrap: { alignItems: 'center', marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
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
  browseBtnWrap: { marginTop: 16, borderRadius: 14, overflow: 'hidden', width: '100%' },
  browseBtn: { paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center' },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
