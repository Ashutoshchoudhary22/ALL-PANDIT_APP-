import { Ionicons } from '@expo/vector-icons';
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

import {
  PUJA_SERVICE_OPTIONS,
} from '@/constants/puja-services';
import { HomeColors as C } from '@/constants/home-theme';
import { openPanditsForService } from '@/lib/pandit-navigation';
import { PujaServiceIcon } from '@/components/PujaServiceIcon';

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
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>All Puja Services</Text>
          <Text style={styles.subtitle}>{PUJA_SERVICE_OPTIONS.length} services available</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={C.textLight} />
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
            <Pressable
              style={styles.serviceCard}
              onPress={() => openPanditsForService(item)}
            >
              <PujaServiceIcon name={item} index={index} size="lg" />
              <Text style={styles.serviceName} numberOfLines={3}>
                {item}
              </Text>
            </Pressable>
          )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={40} color={C.textLight} />
            <Text style={styles.emptyTitle}>No service found</Text>
            <Text style={styles.emptySubtitle}>Try a different search term.</Text>
          </View>
        }
      />
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
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 130,
    gap: 10,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    lineHeight: 17,
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
    color: C.textMuted,
    textAlign: 'center',
  },
});
