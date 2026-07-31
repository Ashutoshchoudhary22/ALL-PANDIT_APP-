import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloudImage } from '@/components/CloudImage';
import { PanditProfileCard } from '@/components/PanditProfileCard';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { HomeColors as C } from '@/constants/home-theme';
import { useApprovedPanditsQuery } from '@/hooks/use-approved-pandits';
import { useMyCustomerProfileQuery } from '@/hooks/use-customer-profile';
import { useAuth } from '@/providers/AuthProvider';
import { CustomerProfile } from '@/services/customer-profile.api';

const CATEGORIES = [
  { id: '1', label: 'Marriage Puja', emoji: '💍', bg: '#FEE2E2', color: '#DC2626' },
  { id: '2', label: 'Griha Pravesh', emoji: '🏠', bg: '#DBEAFE', color: '#2563EB' },
  { id: '3', label: 'Satyanarayan Katha', emoji: '📖', bg: '#FCE7F3', color: '#DB2777' },
  { id: '4', label: 'Havan', emoji: '🔥', bg: '#FFEDD5', color: '#EA580C' },
  { id: '5', label: 'Rudrabhishek', emoji: '🕉️', bg: '#E0E7FF', color: '#4338CA' },
  { id: '6', label: 'Sunderkand Path', emoji: '📿', bg: '#F3E8FF', color: '#9333EA' },
  { id: '7', label: 'More', emoji: '⊞', bg: '#FEF9C3', color: '#CA8A04' },
];

const POPULAR_SERVICES = [
  { id: '1', name: 'Marriage Puja', price: '₹5,101', image: DEMO_IMAGES.serviceMarriage },
  { id: '2', name: 'Griha Pravesh', price: '₹3,501', image: DEMO_IMAGES.serviceGriha },
  { id: '3', name: 'Rudrabhishek', price: '₹2,101', image: DEMO_IMAGES.banner },
  { id: '4', name: 'Satyanarayan Katha', price: '₹1,501', image: DEMO_IMAGES.avatar },
];

const TRUST_FEATURES = [
  { icon: 'shield-checkmark' as const, title: 'Verified Pandits', desc: '100% Verified and Trusted' },
  { icon: 'cash' as const, title: 'Transparent Pricing', desc: 'No Hidden Charges Ever' },
  { icon: 'time' as const, title: 'On-time Service', desc: 'Punctual and Reliable' },
  { icon: 'headset' as const, title: '24x7 Support', desc: 'We are always here to help' },
];

type CustomerHomeProps = {
  notificationCount?: number;
};

function getDisplayName(profile: CustomerProfile | undefined, mobile?: string | null, email?: string | null) {
  if (profile) {
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    if (name) return name;
  }
  if (email) return email.split('@')[0]?.replace(/[._]/g, ' ') || 'Customer';
  if (mobile) return mobile;
  return 'Customer';
}

function getLocationLabel(profile: CustomerProfile | undefined) {
  if (profile?.cityName) return profile.cityName;
  if (profile?.address) return profile.address;
  return 'Add your location';
}

function SectionHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAll ? (
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>View All {'>'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CustomerHome({ notificationCount = 0 }: CustomerHomeProps) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const profileQuery = useMyCustomerProfileQuery(Boolean(token));
  const panditsQuery = useApprovedPanditsQuery(Boolean(token));
  const approvedPandits = panditsQuery.data?.data ?? [];
  const profile = profileQuery.data?.data;

  const customerName = getDisplayName(profile, user?.mobile, user?.email);
  const location = getLocationLabel(profile);
  const avatarSource = profile?.profileImage || user?.profileImage || DEMO_IMAGES.customer;

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void profileQuery.refetch();
      }
    }, [token, profileQuery.refetch]),
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerLeft} onPress={() => router.push('/(tabs)/profile')}>
            <CloudImage
              source={avatarSource}
              preset="avatar"
              style={styles.avatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Namaste, {customerName} 🙏</Text>
              <Text style={styles.subGreeting}>Welcome to Pandit Booking</Text>
              <Pressable
                style={styles.locationRow}
                onPress={() => router.push('/edit-profile')}
              >
                <Ionicons name="location" size={14} color={C.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
                <Ionicons name="chevron-down" size={14} color={C.textMuted} />
              </Pressable>
            </View>
          </Pressable>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={24} color={C.text} />
              {notificationCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="wallet-outline" size={24} color={C.text} />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={C.textLight} />
            <TextInput
              placeholder="Search for puja, pandit or occasion..."
              placeholderTextColor={C.textLight}
              style={styles.searchInput}
            />
          </View>
          <Pressable style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color={C.primary} />
            <Text style={styles.filterText}>Filters</Text>
          </Pressable>
        </View>

        {/* Hero Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              Find the Best Pandits{'\n'}for All Your Needs
            </Text>
            <Text style={styles.bannerBullets}>
              • Verified Pandits • Transparent Pricing{'\n'}
              • Easy Booking • On-time Service
            </Text>
            <Pressable
              style={styles.bookNowBtn}
              onPress={() => router.push('/nearby-pandits')}
            >
              <Text style={styles.bookNowText}>Book Now</Text>
            </Pressable>
          </View>
          <View style={styles.bannerImageWrap}>
            <CloudImage source={DEMO_IMAGES.banner} preset="banner" style={styles.bannerImage} />
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.id} style={styles.categoryItem}>
              <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={styles.categoryLabel} numberOfLines={2}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Nearby Pandits */}
        <SectionHeader
          title="Nearby Pandits"
          onViewAll={token ? () => router.push('/nearby-pandits') : undefined}
        />
        {panditsQuery.isLoading ? (
          <View style={styles.panditsLoading}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.panditsLoadingText}>Loading verified pandits...</Text>
          </View>
        ) : approvedPandits.length === 0 ? (
          <View style={styles.panditsEmpty}>
            <Ionicons name="person-outline" size={32} color={C.textLight} />
            <Text style={styles.panditsEmptyTitle}>No verified pandits yet</Text>
            <Text style={styles.panditsEmptyText}>
              Approved pandits will appear here once Super Admin verifies their profiles.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.panditsRow}
          >
            {approvedPandits.map((pandit, index) => (
              <PanditProfileCard key={pandit.id} pandit={pandit} index={index} variant="carousel" />
            ))}
          </ScrollView>
        )}

        {/* Popular Services */}
        <SectionHeader title="Popular Services" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesRow}
        >
          {POPULAR_SERVICES.map((service) => (
            <Pressable key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceImageWrap}>
                <CloudImage source={service.image} preset="service" style={styles.serviceImage} />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>{service.price} onwards</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Trust Features */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trustRow}
        >
          {TRUST_FEATURES.map((feature, i) => (
            <View key={i} style={styles.trustCard}>
              <View style={styles.trustIconWrap}>
                <Ionicons name={feature.icon} size={22} color="#3B82F6" />
              </View>
              <Text style={styles.trustTitle}>{feature.title}</Text>
              <Text style={styles.trustDesc}>{feature.desc}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.border,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  subGreeting: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingVertical: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: C.bannerBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.bannerText,
    lineHeight: 24,
  },
  bannerBullets: {
    fontSize: 11,
    color: C.bannerText,
    opacity: 0.85,
    marginTop: 8,
    lineHeight: 18,
  },
  bookNowBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerImageWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  categoriesRow: {
    gap: 14,
    paddingBottom: 4,
    marginBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 10,
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  panditsRow: {
    gap: 12,
    paddingBottom: 4,
  },
  panditsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  panditsLoadingText: {
    fontSize: 13,
    color: C.textMuted,
  },
  panditsEmpty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  panditsEmptyTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  panditsEmptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: C.textMuted,
    textAlign: 'center',
  },
  servicesRow: {
    gap: 12,
    paddingBottom: 4,
  },
  serviceCard: {
    width: 130,
    alignItems: 'center',
  },
  serviceImageWrap: {
    width: 130,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
  },
  servicePrice: {
    fontSize: 12,
    color: C.success,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  trustRow: {
    gap: 12,
    marginTop: 20,
    paddingBottom: 8,
  },
  trustCard: {
    width: 140,
    backgroundColor: C.trustBg,
    borderRadius: 14,
    padding: 14,
  },
  trustIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
  },
  trustDesc: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 4,
    lineHeight: 14,
  },
});
