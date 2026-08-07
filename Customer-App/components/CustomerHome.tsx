import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
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

import { AddWalletMoneyModal } from '@/components/AddWalletMoneyModal';
import { CloudImage } from '@/components/CloudImage';
import { PanditFiltersButton } from '@/components/PanditFiltersButton';
import { PanditProfileCard } from '@/components/PanditProfileCard';
import { PujaServiceIcon } from '@/components/PujaServiceIcon';
import { ReviewPromptBanner } from '@/components/ReviewPromptBanner';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { HomeColors as C } from '@/constants/home-theme';
import { getPujaCategoryTranslationKey } from '@/constants/i18n';
import { HOME_PUJA_CATEGORIES } from '@/constants/puja-services';
import { useFilteredPandits } from '@/hooks/use-filtered-pandits';
import { useSubmitBookingReviewMutation } from '@/hooks/use-bookings';
import { usePendingReviewPrompts } from '@/hooks/use-pending-reviews';
import { openPanditsForService } from '@/lib/pandit-navigation';
import { dismissReviewPrompt } from '@/lib/review-prompt-storage';
import { useApprovedPanditsQuery } from '@/hooks/use-approved-pandits';
import { usePopularPujaServicesQuery } from '@/hooks/use-popular-puja-services';
import { useMyCustomerProfileQuery } from '@/hooks/use-customer-profile';
import { useMyWalletQuery } from '@/hooks/use-wallet';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from '@/providers/LanguageProvider';
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
  { icon: 'shield-checkmark' as const, titleKey: 'home.trust.verified.title' as const, descKey: 'home.trust.verified.desc' as const },
  { icon: 'cash' as const, titleKey: 'home.trust.pricing.title' as const, descKey: 'home.trust.pricing.desc' as const },
  { icon: 'time' as const, titleKey: 'home.trust.ontime.title' as const, descKey: 'home.trust.ontime.desc' as const },
  { icon: 'headset' as const, titleKey: 'home.trust.support.title' as const, descKey: 'home.trust.support.desc' as const },
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

function getLocationLabel(profile: CustomerProfile | undefined, t: (key: 'home.addLocation') => string) {
  if (profile?.cityName) return profile.cityName;
  if (profile?.address) return profile.address;
  return t('home.addLocation');
}

function SectionHeader({
  title,
  onViewAll,
  viewAllText = 'View All →',
}: {
  title: string;
  onViewAll?: () => void;
  viewAllText?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onViewAll ? (
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>{viewAllText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CustomerHome({ notificationCount: notificationCountProp }: CustomerHomeProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const { unreadCount } = useNotifications();
  const badgeLabel = formatBadgeCount(notificationCountProp ?? unreadCount);
  const profileQuery = useMyCustomerProfileQuery(Boolean(token));
  const walletQuery = useMyWalletQuery(Boolean(token));
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
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const walletBalance = walletQuery.data?.data.balance ?? 0;

  const customerName = getDisplayName(profile, user?.mobile, user?.email);
  const firstName = profile?.firstName?.trim() || customerName.split(' ')[0] || t('home.fallbackName');
  const location = getLocationLabel(profile, t);
  const avatarSource = profile?.profileImage || user?.profileImage || DEMO_IMAGES.customer;

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void profileQuery.refetch();
        void walletQuery.refetch();
        void panditsQuery.refetch();
        void reviewPrompts.refetch();
        void reviewPrompts.refreshDismissed();
      }
    }, [token, profileQuery.refetch, walletQuery.refetch, panditsQuery.refetch, reviewPrompts.refetch, reviewPrompts.refreshDismissed]),
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
        Alert.alert(t('home.review.thankYou'), response.message);
        void reviewPrompts.refetch();
      } catch (error) {
        Alert.alert(t('home.review.errorTitle'), error instanceof Error ? error.message : t('home.review.errorFallback'));
      }
    },
    [reviewPrompts, submitReview],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <LinearGradient
          colors={[C.maroon, C.maroonLight, C.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.premiumHeader, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.header}>
            <Pressable style={styles.headerLeft} onPress={() => router.push('/(tabs)/profile')}>
              <View style={styles.avatarFrame}>
                <CloudImage source={avatarSource} preset="avatar" style={styles.avatar} />
                <View style={styles.avatarRing} pointerEvents="none" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerOm}>ॐ</Text>
                <Text style={styles.greeting}>
                  {t('brand.greeting')}, <Text style={styles.greetingName}>{firstName}</Text>
                </Text>
                <Text style={styles.subGreeting}>{t('brand.tagline')}</Text>
                <Pressable style={styles.locationPill} onPress={() => router.push('/edit-profile')}>
                  <Ionicons name="location" size={13} color={C.primary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {location}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={C.textMuted} />
                </Pressable>
              </View>
            </Pressable>

            <View style={styles.headerRight}>
              <Pressable style={styles.headerActionBtn} onPress={() => router.push('/notifications')}>
                <Ionicons name="notifications-outline" size={21} color={C.maroon} />
                {badgeLabel ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeLabel}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable style={styles.headerActionBtn} onPress={() => setWalletModalVisible(true)}>
                <Ionicons name="wallet-outline" size={21} color={C.maroon} />
                {walletBalance > 0 ? (
                  <View style={styles.walletBadge}>
                    <Text style={styles.walletBadgeText} numberOfLines={1}>
                      {walletBalance >= 1000
                        ? `₹${Math.round(walletBalance / 1000)}k`
                        : `₹${walletBalance}`}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          </View>

          <View style={styles.headerDividerWrap}>
            <LotusDivider color={C.goldLight} width={200} />
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
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
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={C.textLight}
              style={styles.searchInput}
            />
          </View>
          <PanditFiltersButton />
        </View>

        {/* Hero Banner */}
        <LinearGradient
          colors={[C.maroon, C.maroonLight, C.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerOm}>ॐ</Text>
            <Text style={styles.bannerTitle}>
              {t('home.bannerTitle')}
            </Text>
            <Text style={styles.bannerBullets}>
              {t('home.bannerBullets')}
            </Text>
            <Pressable
              style={styles.bookNowBtn}
              onPress={() => router.push('/nearby-pandits')}
            >
              <Text style={styles.bookNowText}>{t('home.bookPujaNow')}</Text>
            </Pressable>
          </View>
          <View style={styles.bannerImageWrap}>
            <CloudImage source={DEMO_IMAGES.banner} preset="banner" style={styles.bannerImage} />
          </View>
        </LinearGradient>

        {/* Categories */}
        <SectionHeader title={t('home.section.pujaServices')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat, catIndex) => (
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
              <PujaServiceIcon name={cat.label} index={catIndex} size="sm" />
              <Text style={styles.categoryLabel} numberOfLines={2}>
                {(() => {
                  const key = getPujaCategoryTranslationKey(cat.label);
                  return key ? t(key) : cat.label;
                })()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Nearby Pandits */}
        <SectionHeader
          title={t('home.section.nearbyPandits')}
          onViewAll={token ? () => router.push('/nearby-pandits') : undefined}
          viewAllText={t('home.viewAll')}
        />
        {panditsQuery.isLoading ? (
          <View style={styles.panditsLoading}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.panditsLoadingText}>{t('home.pandits.loading')}</Text>
          </View>
        ) : filteredPandits.length === 0 ? (
          <View style={styles.panditsEmpty}>
            <Ionicons name="person-outline" size={32} color={C.textLight} />
            <Text style={styles.panditsEmptyTitle}>
              {activeCount > 0 ? t('home.pandits.emptyFilteredTitle') : t('home.pandits.emptyTitle')}
            </Text>
            <Text style={styles.panditsEmptyText}>
              {activeCount > 0
                ? t('home.pandits.emptyFilteredBody')
                : t('home.pandits.emptyBody')}
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
                customerLatitude={customerLatitude}
                customerLongitude={customerLongitude}
                onPress={openPanditDetail}
              />
            ))}
          </ScrollView>
        )}

        {/* Popular Services */}
        <SectionHeader title={t('home.section.popularServices')} onViewAll={openAllPujaServices} viewAllText={t('home.viewAll')} />
        {popularServicesQuery.isLoading ? (
          <View style={styles.panditsLoading}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.panditsLoadingText}>{t('home.services.loading')}</Text>
          </View>
        ) : popularServices.length === 0 ? (
          <View style={styles.panditsEmpty}>
            <Ionicons name="flame-outline" size={32} color={C.textLight} />
            <Text style={styles.panditsEmptyTitle}>{t('home.services.emptyTitle')}</Text>
            <Text style={styles.panditsEmptyText}>
              {t('home.services.emptyBody')}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesRow}
          >
            {popularServices.map((service, index) => (
                <Pressable
                  key={service.name}
                  style={styles.serviceCard}
                  onPress={() => openPanditsForService(service.name)}
                >
                  <PujaServiceIcon name={service.name} index={index} size="md" />
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {service.name}
                  </Text>
                  <Text style={styles.servicePrice}>
                    ₹{service.minPrice.toLocaleString('en-IN')} {t('home.services.priceOnwards')}
                  </Text>
                </Pressable>
              ))}
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
                <Ionicons name={feature.icon} size={22} color={C.maroon} />
              </View>
              <Text style={styles.trustTitle}>{t(feature.titleKey)}</Text>
              <Text style={styles.trustDesc}>{t(feature.descKey)}</Text>
            </View>
          ))}
        </ScrollView>
        </View>
      </ScrollView>

      <AddWalletMoneyModal
        visible={walletModalVisible}
        currentBalance={walletBalance}
        onDismiss={() => setWalletModalVisible(false)}
        onSuccess={() => {
          void walletQuery.refetch();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  premiumHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
    alignItems: 'center',
  },
  avatarFrame: {
    position: 'relative',
    padding: 3,
    borderRadius: 30,
    backgroundColor: C.gold,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.border,
    borderWidth: 2,
    borderColor: C.cream,
  },
  avatarRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  headerOm: {
    fontSize: 12,
    color: C.goldLight,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255, 248, 240, 0.9)',
  },
  greetingName: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subGreeting: {
    fontSize: 11,
    color: 'rgba(255, 248, 240, 0.75)',
    fontWeight: '500',
    marginTop: 1,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: C.cream,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.borderGold,
    maxWidth: '100%',
  },
  locationText: {
    flexShrink: 1,
    fontSize: 11,
    color: C.maroon,
    fontWeight: '700',
    maxWidth: 140,
  },
  headerDividerWrap: {
    marginTop: 14,
    opacity: 0.7,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  headerActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.borderGold,
    position: 'relative',
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.cream,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  walletBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    maxWidth: 48,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBadgeText: {
    color: C.success,
    fontSize: 8,
    fontWeight: '800',
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
    backgroundColor: C.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: C.borderGold,
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerContent: {
    flex: 1,
    paddingRight: 8,
  },
  bannerOm: {
    fontSize: 20,
    color: C.goldLight,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  bannerBullets: {
    fontSize: 11,
    color: 'rgba(255, 248, 240, 0.9)',
    marginTop: 8,
    lineHeight: 18,
  },
  bookNowBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: C.cream,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.gold,
  },
  bookNowText: {
    color: C.maroon,
    fontSize: 14,
    fontWeight: '800',
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
  categoriesScroll: {
    flexGrow: 0,
    overflow: 'visible',
  },
  categoriesRow: {
    gap: 14,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
    gap: 8,
    paddingTop: 2,
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
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.maroon,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
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
    gap: 8,
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
    borderWidth: 1,
    borderColor: C.border,
  },
  trustIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
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
