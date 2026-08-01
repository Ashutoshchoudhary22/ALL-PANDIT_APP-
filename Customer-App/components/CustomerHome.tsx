import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloudImage } from '@/components/CloudImage';
import { PanditFiltersButton } from '@/components/PanditFiltersButton';
import { PanditProfileCard } from '@/components/PanditProfileCard';
import { ReviewPromptBanner } from '@/components/ReviewPromptBanner';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { HomeColors as C } from '@/constants/home-theme';
import { HOME_PUJA_CATEGORIES, getPujaServiceStyle } from '@/constants/puja-services';
import { useFilteredPandits } from '@/hooks/use-filtered-pandits';
import { useSubmitBookingReviewMutation } from '@/hooks/use-bookings';
import { usePendingReviewPrompts } from '@/hooks/use-pending-reviews';
import { openPanditsForService } from '@/lib/pandit-navigation';
import { dismissReviewPrompt } from '@/lib/review-prompt-storage';
import { useApprovedPanditsQuery } from '@/hooks/use-approved-pandits';
import { usePopularPujaServicesQuery } from '@/hooks/use-popular-puja-services';
import { useMyCustomerProfileQuery } from '@/hooks/use-customer-profile';
import { useAuth } from '@/providers/AuthProvider';
import { usePanditFilters } from '@/providers/PanditFiltersProvider';
import { useNotifications } from '@/providers/NotificationsProvider';
import { CustomerProfile } from '@/services/customer-profile.api';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

function openPanditDetail(pandit: PublicPanditProfile) {
  router.push(`/pandit/${pandit.id}`);
}

function openAllPujaServices() {
  router.push('/all-puja-services');
}

const CATEGORIES = HOME_PUJA_CATEGORIES;

const TRUST_FEATURES = [
  { icon: 'shield-checkmark' as const, title: 'Verified Pandits', desc: '100% Verified and Trusted' },
  { icon: 'cash' as const, title: 'Transparent Pricing', desc: 'No Hidden Charges Ever' },
  { icon: 'time' as const, title: 'On-time Service', desc: 'Punctual and Reliable' },
  { icon: 'headset' as const, title: '24x7 Support', desc: 'We are always here to help' },
];

type CustomerHomeProps = {
  notificationCount?: number;
};

function formatBadgeCount(count: number) {
  if (count <= 0) return '';
  if (count > 9) return '9+';
  return String(count);
}

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

export function CustomerHome({ notificationCount: notificationCountProp }: CustomerHomeProps) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { unreadCount } = useNotifications();
  const badgeLabel = formatBadgeCount(notificationCountProp ?? unreadCount);
  const profileQuery = useMyCustomerProfileQuery(Boolean(token));
  const panditsQuery = useApprovedPanditsQuery(Boolean(token));
  const popularServicesQuery = usePopularPujaServicesQuery(Boolean(token), 10);
  const { activeCount } = usePanditFilters();
  const approvedPandits = panditsQuery.data?.data ?? [];
  const popularServices = popularServicesQuery.data?.data ?? [];
  const profile = profileQuery.data?.data;
  const customerLatitude = profile?.liveLatitude ?? profile?.latitude ?? null;
  const customerLongitude = profile?.liveLongitude ?? profile?.longitude ?? null;
  const filteredPandits = useFilteredPandits({
    pandits: approvedPandits,
    customerLatitude,
    customerLongitude,
  });
  const reviewPrompts = usePendingReviewPrompts(Boolean(token));
  const submitReview = useSubmitBookingReviewMutation();

  const customerName = getDisplayName(profile, user?.mobile, user?.email);
  const location = getLocationLabel(profile);
  const avatarSource = profile?.profileImage || user?.profileImage || DEMO_IMAGES.customer;

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void profileQuery.refetch();
        void reviewPrompts.refetch();
        void reviewPrompts.refreshDismissed();
      }
    }, [token, profileQuery.refetch, reviewPrompts.refetch, reviewPrompts.refreshDismissed]),
  );

  const handleDismissReview = useCallback(async () => {
    const booking = reviewPrompts.featuredReview;
    if (!booking || !user?.id) return;
    await dismissReviewPrompt(user.id, booking.id);
    reviewPrompts.markDismissedLocally(booking.id);
  }, [reviewPrompts, user?.id]);

  const handleSubmitReview = useCallback(
    async (payload: { rating: number; comment: string }) => {
      const booking = reviewPrompts.featuredReview;
      if (!booking) return;
      try {
        const response = await submitReview.mutateAsync({
          bookingId: booking.id,
          rating: payload.rating,
          comment: payload.comment || undefined,
        });
        Alert.alert('Thank You!', response.message);
        void reviewPrompts.refetch();
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Could not submit review');
      }
    },
    [reviewPrompts, submitReview],
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
            <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={C.text} />
              {badgeLabel ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeLabel}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="wallet-outline" size={24} color={C.text} />
            </Pressable>
          </View>
        </View>

        {reviewPrompts.featuredReview ? (
          <ReviewPromptBanner
            booking={reviewPrompts.featuredReview}
            submitting={submitReview.isPending}
            onDismiss={handleDismissReview}
            onSubmit={handleSubmitReview}
          />
        ) : null}

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
          <PanditFiltersButton />
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
        <SectionHeader title="Puja Services" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => {
                if (cat.label === 'More') {
                  openAllPujaServices();
                  return;
                }
                openPanditsForService(cat.label);
              }}
            >
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
        ) : filteredPandits.length === 0 ? (
          <View style={styles.panditsEmpty}>
            <Ionicons name="person-outline" size={32} color={C.textLight} />
            <Text style={styles.panditsEmptyTitle}>
              {activeCount > 0 ? 'No pandits match your filters' : 'No verified pandits yet'}
            </Text>
            <Text style={styles.panditsEmptyText}>
              {activeCount > 0
                ? 'Try changing or clearing your filters to see more pandits.'
                : 'Approved pandits will appear here once Super Admin verifies their profiles.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.panditsRow}
          >
            {filteredPandits.map((pandit, index) => (
              <PanditProfileCard
                key={pandit.id}
                pandit={pandit}
                index={index}
                variant="carousel"
                onPress={openPanditDetail}
              />
            ))}
          </ScrollView>
        )}

        {/* Popular Services */}
        <SectionHeader title="Popular Services" onViewAll={openAllPujaServices} />
        {popularServicesQuery.isLoading ? (
          <View style={styles.panditsLoading}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.panditsLoadingText}>Loading latest services...</Text>
          </View>
        ) : popularServices.length === 0 ? (
          <View style={styles.panditsEmpty}>
            <Ionicons name="flame-outline" size={32} color={C.textLight} />
            <Text style={styles.panditsEmptyTitle}>No services yet</Text>
            <Text style={styles.panditsEmptyText}>
              Latest puja services will appear here when pandits add them to their profiles.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesRow}
          >
            {popularServices.map((service, index) => {
              const style = getPujaServiceStyle(service.name, index);
              return (
                <Pressable
                  key={service.name}
                  style={styles.serviceCard}
                  onPress={() => openPanditsForService(service.name)}
                >
                  <View style={[styles.serviceImageWrap, { backgroundColor: style.bg }]}>
                    <Text style={styles.serviceEmoji}>{style.emoji}</Text>
                  </View>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {service.name}
                  </Text>
                  <Text style={styles.servicePrice}>
                    ₹{service.minPrice.toLocaleString('en-IN')} onwards
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceEmoji: {
    fontSize: 36,
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
