import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PujaServiceIcon } from '@/components/PujaServiceIcon';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { PUJA_SERVICE_OPTIONS } from '@/constants/puja-services';
import { HomeColors as C } from '@/constants/home-theme';
import { openPanditsForService } from '@/lib/pandit-navigation';

export function AllPujaServicesScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return PUJA_SERVICE_OPTIONS;
    return PUJA_SERVICE_OPTIONS.filter((name) => name.toLowerCase().includes(query));
  }, [search]);

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
          <View style={styles.headerBadge}>
            <Ionicons name="flame" size={18} color={C.maroon} />
            <Text style={styles.headerBadgeCount}>{PUJA_SERVICE_OPTIONS.length}</Text>
            <Text style={styles.headerBadgeLabel}>Services</Text>
          </View>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerOm}>ॐ</Text>
          <Text style={styles.headerTitle}>All Puja Services</Text>
          <Text style={styles.headerSubtitle}>Choose a ritual and find verified pandits</Text>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={180} />
        </View>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={C.maroon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search puja service..."
          placeholderTextColor={C.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
          filteredServices.length === 0 && styles.emptyList,
        ]}
        renderItem={({ item, index }) => (
          <Pressable style={styles.serviceCardWrap} onPress={() => openPanditsForService(item)}>
            <PremiumCard accent={index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'saffron' : 'maroon'} innerStyle={styles.serviceCardInner}>
              <PujaServiceIcon name={item} index={index} size="lg" />
              <Text style={styles.serviceName} numberOfLines={3}>
                {item}
              </Text>
            </PremiumCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={36} color={C.maroon} />
              <Text style={styles.emptyTitle}>No service found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term.</Text>
            </View>
          </PremiumCard>
        }
      />
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },
  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  emptyList: { flexGrow: 1 },
  gridRow: { gap: 12, marginBottom: 12 },
  serviceCardWrap: { flex: 1 },
  serviceCardInner: {
    padding: 14,
    alignItems: 'center',
    minHeight: 130,
    gap: 10,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '800',
    color: C.maroon,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyCardInner: { padding: 28 },
  emptyWrap: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.maroon },
  emptySubtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
});
