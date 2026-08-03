import { Ionicons } from '@expo/vector-icons';
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
import { HomeColors as C } from '@/constants/home-theme';
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
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Saved Pandits</Text>
          <Text style={styles.subtitle}>Pandits you bookmarked for quick booking</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
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
            <RefreshControl refreshing={false} onRefresh={() => refreshSavedPandits()} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="bookmark-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No saved pandits yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the bookmark icon on any pandit card to save them here for quick access.
              </Text>
              <Pressable style={styles.browseBtn} onPress={() => router.push('/nearby-pandits')}>
                <Text style={styles.browseBtnText}>Browse Pandits</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
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
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  subtitle: { marginTop: 2, fontSize: 12, color: C.textMuted },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: C.text },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
  browseBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
