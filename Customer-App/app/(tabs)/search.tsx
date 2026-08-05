import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { PUJA_SERVICE_OPTIONS } from '@/constants/puja-services';
import { Brand, HomeColors as C } from '@/constants/home-theme';
import { useProfileReturnBackHandler } from '@/lib/profile-navigation';
import { openPanditsForService } from '@/lib/pandit-navigation';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  useProfileReturnBackHandler();

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return PUJA_SERVICE_OPTIONS.slice(0, 6);
    return PUJA_SERVICE_OPTIONS.filter((name) => name.toLowerCase().includes(query)).slice(0, 8);
  }, [search]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerOm}>ॐ</Text>
        <Text style={styles.headerTitle}>Search</Text>
        <Text style={styles.headerSubtitle}>{Brand.greeting}! Find pandits & puja services</Text>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={180} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={C.maroon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search puja service or pandit..."
            placeholderTextColor={C.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickCardWrap} onPress={() => router.push('/all-puja-services')}>
            <PremiumCard accent="gold" innerStyle={styles.quickCardInner}>
              <Ionicons name="flame-outline" size={22} color={C.primary} />
              <Text style={styles.quickLabel}>All Services</Text>
            </PremiumCard>
          </Pressable>
          <Pressable style={styles.quickCardWrap} onPress={() => router.push('/nearby-pandits')}>
            <PremiumCard accent="saffron" innerStyle={styles.quickCardInner}>
              <Ionicons name="people-outline" size={22} color={C.maroon} />
              <Text style={styles.quickLabel}>Nearby Pandits</Text>
            </PremiumCard>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          {search.trim() ? 'Search Results' : 'Popular Pujas'}
        </Text>

        {suggestions.length > 0 ? (
          suggestions.map((service, index) => (
            <Pressable
              key={service}
              style={styles.resultWrap}
              onPress={() => openPanditsForService(service)}
            >
              <PremiumCard
                accent={index % 2 === 0 ? 'maroon' : 'gold'}
                innerStyle={styles.resultInner}
              >
                <View style={styles.resultRow}>
                  <View style={styles.resultIconWrap}>
                    <Ionicons name="sparkles-outline" size={18} color={C.primary} />
                  </View>
                  <Text style={styles.resultText}>{service}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.textLight} />
                </View>
              </PremiumCard>
            </Pressable>
          ))
        ) : (
          <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={32} color={C.maroon} />
              <Text style={styles.emptyTitle}>No match found</Text>
              <Text style={styles.emptySubtitle}>Try another puja name or browse all services.</Text>
            </View>
          </PremiumCard>
        )}
      </ScrollView>
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
  headerOm: { fontSize: 14, color: C.goldLight, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,248,240,0.85)',
    fontWeight: '500',
  },
  headerDividerWrap: { alignItems: 'center', marginTop: 12 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  quickCardWrap: { flex: 1 },
  quickCardInner: { padding: 16, alignItems: 'center', gap: 8 },
  quickLabel: { fontSize: 12, fontWeight: '800', color: C.maroon, textAlign: 'center' },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '800',
    color: C.maroon,
  },
  resultWrap: { marginBottom: 10 },
  resultInner: { padding: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  resultText: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  emptyCardInner: { padding: 24 },
  emptyWrap: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.maroon },
  emptySubtitle: { fontSize: 13, color: C.textMuted, textAlign: 'center' },
});
