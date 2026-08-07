import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddWalletMoneyModal } from '@/components/AddWalletMoneyModal';
import { CloudImage } from '@/components/CloudImage';
import { LanguageSelectModal } from '@/components/LanguageSelectModal';
import { WalletTransactionsModal } from '@/components/WalletTransactionsModal';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Brand, HomeColors as C } from '@/constants/home-theme';
import { useCustomerBookingStats } from '@/hooks/use-customer-booking-stats';
import { useMyCustomerProfileQuery, useUpdateCustomerProfileMutation } from '@/hooks/use-customer-profile';
import { useMyWalletQuery } from '@/hooks/use-wallet';
import { formatBookingDate, formatBookingTime } from '@/lib/booking-display';
import { formatINR } from '@/lib/booking-pricing';
import {
  formatCustomerLanguage,
  formatNotificationPreference,
} from '@/lib/customer-preferences';
import { navigateFromProfile } from '@/lib/profile-navigation';
import { useTabBackToHome } from '@/lib/tab-navigation';
import { AppLanguage, normalizeAppLanguage } from '@/constants/i18n';
import type { TranslationKey } from '@/constants/i18n/en';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage, useTranslation } from '@/providers/LanguageProvider';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useSavedPandits } from '@/providers/SavedPanditsProvider';
import { CustomerProfile } from '@/services/customer-profile.api';
import { Booking, BookingStatus } from '@/services/booking.api';

function formatDob(dob: string | null) {
  if (!dob) return 'Not added';
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return dob;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMemberSince(memberSince: string) {
  const date = new Date(memberSince);
  if (Number.isNaN(date.getTime())) return '';
  return date.getFullYear();
}

function comingSoon(feature: string) {
  Alert.alert(feature, 'This will be available soon.');
}

const BOOKING_STATUS_STYLE: Record<BookingStatus, { labelKey: TranslationKey; bg: string; text: string }> = {
  payment_pending: { labelKey: 'booking.status.paymentPending', bg: '#FEE2E2', text: '#B91C1C' },
  pending: { labelKey: 'booking.status.awaitingApproval', bg: '#FEF3C7', text: '#B45309' },
  confirmed: { labelKey: 'booking.status.confirmed', bg: '#DCFCE7', text: '#15803D' },
  in_progress: { labelKey: 'booking.status.inProgress', bg: '#FEF3C7', text: '#B45309' },
  awaiting_payment: { labelKey: 'booking.status.awaitingPayment', bg: '#FFEDD5', text: '#C2410C' },
  cancelled: { labelKey: 'booking.status.cancelled', bg: '#FEE2E2', text: '#B91C1C' },
  completed: { labelKey: 'booking.status.completed', bg: '#EFF6FF', text: '#1D4ED8' },
};

function RecentBookingItem({ booking }: { booking: Booking }) {
  const { t } = useTranslation();
  const statusStyle = BOOKING_STATUS_STYLE[booking.status];

  return (
    <PremiumCard accent="saffron" innerStyle={styles.recentBookingCardInner}>
      <View style={styles.recentBookingItem}>
        <View style={styles.recentBookingIconWrap}>
          <Ionicons name="flame-outline" size={18} color={C.primary} />
        </View>
        <View style={styles.recentBookingContent}>
          <View style={styles.recentBookingTop}>
            <View style={styles.recentBookingInfo}>
              <Text style={styles.recentBookingTitle} numberOfLines={1}>
                {booking.serviceName}
              </Text>
              <Text style={styles.recentBookingSubtitle} numberOfLines={1}>
                {t('profile.recent.withPandit', { panditName: booking.panditName })}
              </Text>
            </View>
            <View style={[styles.recentStatusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.recentStatusText, { color: statusStyle.text }]}>
                {t(statusStyle.labelKey)}
              </Text>
            </View>
          </View>
          <View style={styles.recentBookingMeta}>
            <Ionicons name="calendar-outline" size={13} color={C.maroon} />
            <Text style={styles.recentBookingMetaText}>
              {formatBookingDate(booking.bookingDate)} • {formatBookingTime(booking.bookingTime)}
            </Text>
          </View>
          <View style={styles.recentPriceRow}>
            <Text style={styles.recentBookingPrice}>{formatINR(booking.totalPrice)}</Text>
            <Ionicons name="chevron-forward" size={16} color={C.primary} />
          </View>
        </View>
      </View>
    </PremiumCard>
  );
}

function RecentBookingsSection({
  bookings,
  hasActiveBookings,
}: {
  bookings: Booking[];
  hasActiveBookings: boolean;
}) {
  const handleViewAll = () => {
    navigateFromProfile(hasActiveBookings ? '/(tabs)/bookings' : '/(tabs)/history');
  };

  return (
    <>
      <SectionHeader title="Recent Bookings" action="View All →" onAction={handleViewAll} />
      {bookings.length === 0 ? (
        <PremiumCard accent="gold" innerStyle={styles.recentEmptyInner}>
          <View style={styles.recentCard}>
            <View style={styles.recentEmptyIcon}>
              <Ionicons name="calendar-outline" size={28} color={C.maroon} />
            </View>
            <Text style={styles.recentHint}>
              Your booking history will appear here once you book a pandit for a puja or ritual.
            </Text>
          </View>
        </PremiumCard>
      ) : (
        <View style={styles.recentListWrap}>
          {bookings.map((booking) => (
            <RecentBookingItem key={booking.id} booking={booking} />
          ))}
        </View>
      )}
    </>
  );
}

function formatBadgeCount(count: number) {
  if (count <= 0) return '';
  if (count > 9) return '9+';
  return String(count);
}

function openNotifications() {
  navigateFromProfile('/notifications');
}

function StatCard({
  icon,
  iconColor,
  bg,
  gradientEnd,
  value,
  label,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bg: string;
  gradientEnd?: string;
  value: string;
  label: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <PremiumCard style={styles.statCardWrap} innerStyle={styles.statCardInner} accent="maroon">
      <LinearGradient
        colors={[bg, gradientEnd ?? '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}
      >
        <View style={[styles.statIconWrap, { borderColor: `${iconColor}44` }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        <Pressable onPress={onPress ?? (() => comingSoon(label))} style={styles.statActionBtn}>
          <Text style={styles.statAction}>{action}</Text>
          <Ionicons name="arrow-forward" size={12} color={C.primary} />
        </Pressable>
      </LinearGradient>
    </PremiumCard>
  );
}

function QuickAction({
  icon,
  iconColor,
  bg,
  label,
  meta,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bg: string;
  label: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <LinearGradient
        colors={[bg, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.quickActionRing, { borderColor: `${iconColor}55` }]}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      </LinearGradient>
      <Text style={styles.quickActionLabel}>{label}</Text>
      <View style={styles.quickActionMetaPill}>
        <Text style={styles.quickActionMeta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

function QuickActionsSection({
  stats,
  savedPanditsCount,
  walletTransactionCount,
  onViewTransactions,
  onViewSavedPandits,
}: {
  stats: {
    totalBookings: number;
    activeBookingsCount: number;
    reviewsGiven: number;
    pendingReviewsCount: number;
  };
  savedPanditsCount: number;
  walletTransactionCount: number;
  onViewTransactions: () => void;
  onViewSavedPandits: () => void;
}) {
  const bookingsMeta =
    stats.activeBookingsCount > 0
      ? `${stats.activeBookingsCount} active`
      : stats.totalBookings > 0
        ? `${stats.totalBookings} total`
        : 'No bookings';

  const reviewsMeta =
    stats.pendingReviewsCount > 0
      ? `${stats.pendingReviewsCount} pending`
      : stats.reviewsGiven > 0
        ? `${stats.reviewsGiven} given`
        : 'None yet';

  const savedMeta =
    savedPanditsCount > 0 ? `${savedPanditsCount} saved` : 'None yet';

  const transactionsMeta =
    walletTransactionCount > 0 ? `${walletTransactionCount} records` : 'No records';

  return (
    <PremiumCard accent="gold" innerStyle={styles.quickActionsInner}>
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
      <QuickAction
        icon="calendar-outline"
        iconColor={C.maroon}
        bg={C.creamDark}
        label="My Bookings"
        meta={bookingsMeta}
        onPress={() => navigateFromProfile('/(tabs)/bookings')}
      />
      <QuickAction
        icon="heart-outline"
        iconColor={C.primary}
        bg="#FFF0E0"
        label="My Reviews"
        meta={reviewsMeta}
        onPress={() => navigateFromProfile('/(tabs)/history')}
      />
      <QuickAction
        icon="bookmark-outline"
        iconColor={C.success}
        bg="#ECFDF5"
        label="Saved Pandits"
        meta={savedMeta}
        onPress={onViewSavedPandits}
      />
      <QuickAction
        icon="pricetag-outline"
        iconColor={C.gold}
        bg="#FFFBEB"
        label="Coupons"
        meta="0 available"
        onPress={() => comingSoon('Coupons')}
      />
      <QuickAction
        icon="card-outline"
        iconColor="#1D4ED8"
        bg="#EFF6FF"
        label="Transactions"
        meta={transactionsMeta}
        onPress={onViewTransactions}
      />
      </View>
    </PremiumCard>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={16} color={C.maroon} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function NoProfileState() {
  return (
    <View style={styles.emptyState}>
      <LinearGradient colors={[C.maroon, C.primary]} style={styles.emptyIconWrap}>
        <Ionicons name="person-circle-outline" size={72} color="#fff" />
      </LinearGradient>
      <Text style={styles.emptyOm}>ॐ</Text>
      <Text style={styles.emptyTitle}>Profile Not Created</Text>
      <Text style={styles.emptySubtitle}>
        Create your profile to get a personalized spiritual booking experience on {Brand.name}.
      </Text>
      <LotusDivider width={100} />
      <Pressable style={styles.createProfileBtnWrap} onPress={() => navigateFromProfile('/create-profile')}>
        <LinearGradient colors={[C.maroon, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createProfileBtn}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.createProfileBtnText}>Create Profile</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function LogoutButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.logoutBtn} onPress={onPress}>
      <Ionicons name="log-out-outline" size={20} color="#DC2626" />
      <Text style={styles.logoutBtnText}>Logout</Text>
    </Pressable>
  );
}

function PreferencesSection({
  profile,
  unreadCount,
  updating,
  onSelectLanguage,
  onToggleNotifications,
  onOpenNotifications,
}: {
  profile: CustomerProfile;
  unreadCount: number;
  updating: boolean;
  onSelectLanguage: () => void;
  onToggleNotifications: () => void;
  onOpenNotifications: () => void;
}) {
  const { t, language } = useTranslation();
  const languageLabel = formatCustomerLanguage(profile.languageCode, language);
  const notificationsLabel = formatNotificationPreference(
    profile.notificationsEnabled !== false,
    unreadCount,
    t,
  );

  return (
    <>
      <SectionHeader title={t('profile.section.preferences')} />
      <View style={styles.preferencesGrid}>
        <PremiumCard style={styles.preferenceCardWrap} accent="saffron" innerStyle={styles.preferenceCardInner}>
          <Pressable
            style={[styles.preferenceItem, updating && styles.preferenceItemDisabled]}
            onPress={onSelectLanguage}
            disabled={updating}
          >
            <View style={[styles.preferenceIconWrap, { backgroundColor: '#FFF0E0' }]}>
              <Ionicons name="language-outline" size={18} color={C.primary} />
            </View>
            <Text style={styles.preferenceLabel}>{t('profile.pref.language')}</Text>
            <Text style={styles.preferenceValue} numberOfLines={1}>
              {languageLabel}
            </Text>
          </Pressable>
        </PremiumCard>
        <PremiumCard style={styles.preferenceCardWrap} accent="maroon" innerStyle={styles.preferenceCardInner}>
          <Pressable
            style={styles.preferenceItem}
            onPress={() => navigateFromProfile('/edit-profile')}
          >
            <View style={[styles.preferenceIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="location-outline" size={18} color="#9333EA" />
            </View>
            <Text style={styles.preferenceLabel}>{t('profile.pref.preferredCity')}</Text>
            <Text style={styles.preferenceValue} numberOfLines={1}>
              {profile.cityName || t('profile.notSet')}
            </Text>
          </Pressable>
        </PremiumCard>
        <PremiumCard style={styles.preferenceCardWrap} accent="gold" innerStyle={styles.preferenceCardInner}>
          <Pressable
            style={[styles.preferenceItem, updating && styles.preferenceItemDisabled]}
            onPress={onToggleNotifications}
            disabled={updating}
          >
            <View style={[styles.preferenceIconWrap, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="notifications-outline" size={18} color="#DB2777" />
            </View>
            <Text style={styles.preferenceLabel}>{t('profile.pref.notifications')}</Text>
            <Text style={styles.preferenceValue} numberOfLines={1}>
              {notificationsLabel}
            </Text>
          </Pressable>
        </PremiumCard>
        <PremiumCard style={styles.preferenceCardWrap} accent="none" innerStyle={styles.preferenceCardInner}>
          <Pressable style={styles.preferenceItem} onPress={onOpenNotifications}>
            <View style={[styles.preferenceIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="mail-unread-outline" size={18} color={C.success} />
            </View>
            <Text style={styles.preferenceLabel}>{t('profile.pref.alerts')}</Text>
            <Text style={styles.preferenceValue} numberOfLines={1}>
              {unreadCount > 0 ? t('profile.pref.newAlerts', { count: unreadCount }) : t('profile.pref.none')}
            </Text>
          </Pressable>
        </PremiumCard>
      </View>
    </>
  );
}

function ProfileContent({
  profile,
  stats,
  recentBookings,
  hasActiveBookings,
  walletBalance,
  unreadCount,
  walletTransactionCount,
  savedPanditsCount,
  preferencesUpdating,
  onAddWalletMoney,
  onSelectLanguage,
  onToggleNotifications,
  onViewTransactions,
  onViewSavedPandits,
}: {
  profile: CustomerProfile;
  stats: {
    totalBookings: number;
    completedBookings: number;
    reviewsGiven: number;
    activeBookingsCount: number;
    pendingReviewsCount: number;
  };
  recentBookings: Booking[];
  hasActiveBookings: boolean;
  walletBalance: number;
  unreadCount: number;
  walletTransactionCount: number;
  savedPanditsCount: number;
  preferencesUpdating: boolean;
  onAddWalletMoney: () => void;
  onSelectLanguage: () => void;
  onToggleNotifications: () => void;
  onViewTransactions: () => void;
  onViewSavedPandits: () => void;
}) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Customer';
  const memberSinceYear = formatMemberSince(profile.memberSince);

  return (
    <>
      <LinearGradient
        colors={[C.maroon, C.maroonLight, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View style={styles.photoFrame}>
            <View style={styles.photoWrap}>
              {profile.profileImage ? (
                <CloudImage source={profile.profileImage} preset="avatar" style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Ionicons name="person" size={40} color={C.cream} />
                </View>
              )}
              <Pressable style={styles.cameraBadge} onPress={() => navigateFromProfile('/edit-profile')} hitSlop={8}>
                <Ionicons name="camera" size={13} color={C.maroon} />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroGreeting}>{Brand.greeting}</Text>
            <Text style={styles.name}>{fullName}</Text>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={13} color="rgba(255,248,240,0.85)" />
              <Text style={styles.contactText}>{profile.mobile}</Text>
            </View>
            {profile.email ? (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={13} color="rgba(255,248,240,0.85)" />
                <Text style={styles.contactText} numberOfLines={1}>{profile.email}</Text>
              </View>
            ) : null}
            {profile.cityName ? (
              <View style={styles.contactRow}>
                <Ionicons name="location-outline" size={13} color="rgba(255,248,240,0.85)" />
                <Text style={styles.contactText} numberOfLines={1}>{profile.cityName}</Text>
              </View>
            ) : null}
            {memberSinceYear ? (
              <View style={styles.memberBadge}>
                <Ionicons name="shield-checkmark" size={12} color={C.maroon} />
                <Text style={styles.memberBadgeText}>Member since {memberSinceYear}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <StatCard
          icon="receipt-outline"
          iconColor={C.maroon}
          bg={C.creamDark}
          value={String(stats.totalBookings)}
          label="Total Bookings"
          action="View All →"
          onPress={() => navigateFromProfile('/(tabs)/bookings')}
        />
        <StatCard
          icon="checkmark-done-outline"
          iconColor={C.success}
          bg="#ECFDF5"
          value={String(stats.completedBookings)}
          label="Completed"
          action="View All →"
          onPress={() => navigateFromProfile('/(tabs)/history')}
        />
        <StatCard
          icon="star-outline"
          iconColor={C.gold}
          bg="#FFFBEB"
          value={String(stats.reviewsGiven)}
          label="Reviews Given"
          action="View All →"
          onPress={() => navigateFromProfile('/(tabs)/history')}
        />
        <StatCard
          icon="wallet-outline"
          iconColor={C.primary}
          bg="#FFF0E0"
          value={formatINR(walletBalance)}
          label="Wallet Balance"
          action="Add Money →"
          onPress={onAddWalletMoney}
        />
      </View>

      <QuickActionsSection
        stats={stats}
        savedPanditsCount={savedPanditsCount}
        walletTransactionCount={walletTransactionCount}
        onViewTransactions={onViewTransactions}
        onViewSavedPandits={onViewSavedPandits}
      />

      <SectionHeader title="Personal Details" action="Edit Profile" onAction={() => navigateFromProfile('/edit-profile')} />
      <PremiumCard accent="maroon" innerStyle={styles.detailsCardInner}>
        <View style={styles.detailsCard}>
          <DetailRow icon="calendar-outline" label="Date of Birth" value={formatDob(profile.dob)} />
          <DetailRow icon="call-outline" label="Mobile Number" value={profile.mobile} />
          <DetailRow icon="male-female-outline" label="Gender" value={profile.gender ? profile.gender : 'Not added'} />
          <DetailRow icon="mail-outline" label="Email" value={profile.email || 'Not added'} />
          <DetailRow icon="business-outline" label="City" value={profile.cityName || 'Not added'} />
          <DetailRow icon="location-outline" label="Address" value={profile.address || 'Not added'} isLast />
        </View>
      </PremiumCard>

      <SectionHeader title="Saved Addresses" action="View All →" onAction={() => comingSoon('Saved Addresses')} />
      <PremiumCard accent="gold" innerStyle={styles.addressCardInner}>
        <View style={styles.addressCard}>
          {profile.address ? (
            <>
              <View style={styles.addressTop}>
                <View style={styles.addressBadgeRow}>
                  <View style={styles.addressIconWrap}>
                    <Ionicons name="home" size={16} color={C.maroon} />
                  </View>
                  <Text style={styles.addressLabel}>Home</Text>
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                </View>
                <View style={styles.addressActions}>
                  <Pressable onPress={() => navigateFromProfile('/edit-profile')} hitSlop={8}>
                    <Ionicons name="create-outline" size={18} color={C.textMuted} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.addressText}>{profile.address}</Text>
              <Text style={styles.addressText}>{profile.mobile}</Text>
            </>
          ) : (
            <Text style={styles.addressEmptyText}>No saved address yet.</Text>
          )}
          <Pressable style={styles.addAddressBtn} onPress={() => navigateFromProfile('/edit-profile')}>
            <LinearGradient
              colors={[C.cream, '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addAddressBtnGradient}
            >
              <Ionicons name="add-circle-outline" size={18} color={C.primary} />
              <Text style={styles.addAddressText}>Add New Address</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </PremiumCard>

      <PreferencesSection
        profile={profile}
        unreadCount={unreadCount}
        updating={preferencesUpdating}
        onSelectLanguage={onSelectLanguage}
        onToggleNotifications={onToggleNotifications}
        onOpenNotifications={openNotifications}
      />

      <RecentBookingsSection bookings={recentBookings} hasActiveBookings={hasActiveBookings} />
    </>
  );
}

export function CustomerProfileScreen() {
  const insets = useSafeAreaInsets();
  useTabBackToHome();
  const { t } = useTranslation();
  const { setLanguage } = useLanguage();
  const { token, user, isLoading: authLoading, signOut, signIn } = useAuth();
  const { unreadCount } = useNotifications();
  const { savedCount, refreshSavedPandits } = useSavedPandits();
  const badgeLabel = formatBadgeCount(unreadCount);
  const profileQuery = useMyCustomerProfileQuery(Boolean(token));
  const updateProfileMutation = useUpdateCustomerProfileMutation();
  const bookingStats = useCustomerBookingStats(Boolean(token));
  const walletQuery = useMyWalletQuery(Boolean(token));
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [transactionsModalVisible, setTransactionsModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const profile = profileQuery.data?.data;
  const walletBalance = walletQuery.data?.data.balance ?? 0;
  const walletTransactions = walletQuery.data?.data.transactions ?? [];
  const isNotFound =
    profileQuery.error instanceof Error &&
    (profileQuery.error.message.toLowerCase().includes('not found') ||
      profileQuery.error.message.includes('404'));

  const handleSelectLanguage = () => {
    if (!profile) return;
    setLanguageModalVisible(true);
  };

  const handleLanguageChange = (optionCode: AppLanguage) => {
    if (!profile) return;

    const nextLanguage = normalizeAppLanguage(optionCode);
    if (nextLanguage === normalizeAppLanguage(profile.languageCode)) {
      setLanguageModalVisible(false);
      return;
    }

    updateProfileMutation.mutate(
      { languageCode: optionCode },
      {
        onSuccess: async () => {
          await setLanguage(nextLanguage);
          if (token && user) {
            await signIn(token, { ...user, languageCode: optionCode });
          }
          setLanguageModalVisible(false);
        },
        onError: (error) => {
          Alert.alert(
            t('common.error'),
            error instanceof Error ? error.message : t('profile.language.errorFallback'),
          );
        },
      },
    );
  };

  const handleToggleNotifications = () => {
    if (!profile) return;

    const nextEnabled = profile.notificationsEnabled === false;
    const title = nextEnabled ? 'Enable Notifications' : 'Disable Notifications';
    const message = nextEnabled
      ? 'Turn on booking and payment alerts?'
      : 'You will stop receiving in-app booking alerts.';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: nextEnabled ? 'Enable' : 'Disable',
        onPress: () => {
          updateProfileMutation.mutate(
            { notificationsEnabled: nextEnabled },
            {
              onError: (error) => {
                Alert.alert(
                  'Error',
                  error instanceof Error ? error.message : 'Could not update notifications',
                );
              },
            },
          );
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void profileQuery.refetch();
        void bookingStats.refetch();
        void walletQuery.refetch();
        void refreshSavedPandits();
      }
    }, [token, profileQuery.refetch, bookingStats.refetch, walletQuery.refetch, refreshSavedPandits]),
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <View>
          <Text style={styles.topOm}>ॐ</Text>
          <Text style={styles.topTitle}>{t('profile.title')}</Text>
        </View>
        <View style={styles.topActions}>
          {profile ? (
            <Pressable style={styles.editBtn} onPress={() => navigateFromProfile('/edit-profile')} hitSlop={8}>
              <Ionicons name="create-outline" size={18} color={C.maroon} />
            </Pressable>
          ) : null}
          <Pressable onPress={openNotifications} hitSlop={8}>
            <View>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {badgeLabel ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
      </LinearGradient>

      {authLoading || profileQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : !token ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>{t('profile.signInRequired')}</Text>
        </View>
      ) : isNotFound ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            styles.emptyScroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          <NoProfileState />
          <LogoutButton onPress={handleLogout} />
        </ScrollView>
      ) : profileQuery.error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>{profileQuery.error.message}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => profileQuery.refetch()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : profile ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
        >
          <ProfileContent
            profile={profile}
            stats={bookingStats}
            recentBookings={bookingStats.recentBookings}
            hasActiveBookings={bookingStats.hasActiveBookings}
            walletBalance={walletBalance}
            unreadCount={unreadCount}
            walletTransactionCount={walletTransactions.length}
            savedPanditsCount={savedCount}
            preferencesUpdating={updateProfileMutation.isPending}
            onAddWalletMoney={() => setWalletModalVisible(true)}
            onSelectLanguage={handleSelectLanguage}
            onToggleNotifications={handleToggleNotifications}
            onViewTransactions={() => setTransactionsModalVisible(true)}
            onViewSavedPandits={() => navigateFromProfile('/saved-pandits')}
          />
          <LogoutButton onPress={handleLogout} />
        </ScrollView>
      ) : null}

      <AddWalletMoneyModal
        visible={walletModalVisible}
        currentBalance={walletBalance}
        onDismiss={() => setWalletModalVisible(false)}
        onSuccess={() => {
          void walletQuery.refetch();
        }}
      />

      <WalletTransactionsModal
        visible={transactionsModalVisible}
        transactions={walletTransactions}
        onDismiss={() => setTransactionsModalVisible(false)}
      />

      <LanguageSelectModal
        visible={languageModalVisible}
        selectedCode={profile?.languageCode}
        saving={updateProfileMutation.isPending}
        onClose={() => setLanguageModalVisible(false)}
        onSelect={handleLanguageChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topOm: { fontSize: 14, color: C.goldLight, marginBottom: 2 },
  topTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: C.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#fff',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  stateText: { fontSize: 15, color: C.textMuted, textAlign: 'center' },
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 24, gap: 8 },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyOm: { fontSize: 22, color: C.gold, marginTop: 4 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.maroon, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, lineHeight: 22, color: C.textMuted, textAlign: 'center', paddingHorizontal: 8 },
  createProfileBtnWrap: { marginTop: 16, borderRadius: 14, overflow: 'hidden', width: '100%' },
  createProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createProfileBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTop: { flexDirection: 'row', gap: 16 },
  photoFrame: {
    padding: 3,
    borderRadius: 50,
    backgroundColor: C.gold,
  },
  photoWrap: { position: 'relative' },
  photo: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.border },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.gold,
  },
  heroInfo: { flex: 1, gap: 3, justifyContent: 'center' },
  heroGreeting: { fontSize: 12, color: C.goldLight, fontWeight: '600', letterSpacing: 0.5 },
  name: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  contactText: { fontSize: 12, color: 'rgba(255,248,240,0.9)', flexShrink: 1, fontWeight: '500' },
  memberBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.cream,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  memberBadgeText: { color: C.maroon, fontSize: 10, fontWeight: '800' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  statCardWrap: { width: '48%' },
  statCardInner: { padding: 0, overflow: 'hidden' },
  statGradient: { padding: 14, minHeight: 130 },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  statValue: { marginTop: 10, fontSize: 17, fontWeight: '800', color: C.maroon },
  statLabel: { marginTop: 2, fontSize: 11, color: C.textMuted, fontWeight: '500' },
  statActionBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  statAction: { fontSize: 11, fontWeight: '700', color: C.primary },
  quickActionsInner: {
    marginTop: 22,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.maroon,
    marginBottom: 4,
    paddingHorizontal: 4,
    letterSpacing: 0.3,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  quickAction: { alignItems: 'center', gap: 6, flex: 1 },
  quickActionRing: {
    padding: 2,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 10, color: C.textMuted, fontWeight: '700', textAlign: 'center' },
  quickActionMetaPill: {
    backgroundColor: C.creamDark,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.borderGold,
    maxWidth: '100%',
  },
  quickActionMeta: {
    fontSize: 9,
    color: C.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.maroon },
  sectionAction: { fontSize: 13, fontWeight: '700', color: C.primary },
  detailsCardInner: { padding: 0 },
  detailsCard: { paddingVertical: 4 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 160, 23, 0.15)',
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  detailValue: { marginTop: 2, fontSize: 14, fontWeight: '700', color: C.text, textTransform: 'capitalize' },
  addressCardInner: { padding: 0 },
  addressCard: { padding: 16 },
  addressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  addressLabel: { fontSize: 14, fontWeight: '800', color: C.maroon },
  defaultBadge: {
    backgroundColor: C.creamDark,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  defaultBadgeText: { color: C.maroon, fontSize: 10, fontWeight: '800' },
  addressActions: { flexDirection: 'row', gap: 12 },
  addressText: { marginTop: 6, fontSize: 13, color: C.textMuted, lineHeight: 20, paddingLeft: 36 },
  addressEmptyText: { fontSize: 13, color: C.textMuted, paddingVertical: 4 },
  addAddressBtn: {
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: C.borderGold,
    borderStyle: 'dashed',
  },
  addAddressBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  addAddressText: { color: C.maroon, fontSize: 13, fontWeight: '800' },
  preferencesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  preferenceCardWrap: { width: '48%' },
  preferenceCardInner: { padding: 0 },
  preferenceItem: {
    padding: 14,
    alignItems: 'flex-start',
    gap: 2,
    minHeight: 96,
    justifyContent: 'flex-start',
  },
  preferenceItemDisabled: { opacity: 0.6 },
  preferenceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.2)',
  },
  preferenceLabel: { fontSize: 11, color: C.textMuted, marginTop: 6, fontWeight: '500' },
  preferenceValue: { fontSize: 13, fontWeight: '800', color: C.maroon },
  recentEmptyInner: { padding: 0 },
  recentCard: {
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  recentEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  recentHint: { fontSize: 12, color: C.textLight, textAlign: 'center', lineHeight: 18 },
  recentListWrap: { gap: 10 },
  recentBookingCardInner: { padding: 14 },
  recentBookingItem: { flexDirection: 'row', gap: 12 },
  recentBookingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
  },
  recentBookingContent: { flex: 1, gap: 6 },
  recentBookingTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  recentBookingInfo: { flex: 1 },
  recentBookingTitle: { fontSize: 14, fontWeight: '800', color: C.maroon },
  recentBookingSubtitle: { marginTop: 2, fontSize: 12, color: C.textMuted },
  recentStatusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  recentStatusText: { fontSize: 10, fontWeight: '800' },
  recentBookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentBookingMetaText: { fontSize: 12, color: C.textMuted },
  recentPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  recentBookingPrice: { fontSize: 14, fontWeight: '800', color: C.primary },
  logoutBtn: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 15,
  },
  logoutBtnText: { color: C.danger, fontSize: 15, fontWeight: '800' },
});
