import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddWalletMoneyModal } from '@/components/AddWalletMoneyModal';
import { WalletTransactionsModal } from '@/components/WalletTransactionsModal';
import { HomeColors as C } from '@/constants/home-theme';
import { useCustomerBookingStats } from '@/hooks/use-customer-booking-stats';
import { useMyCustomerProfileQuery, useUpdateCustomerProfileMutation } from '@/hooks/use-customer-profile';
import { useMyWalletQuery } from '@/hooks/use-wallet';
import { formatBookingDate, formatBookingTime } from '@/lib/booking-display';
import { formatINR } from '@/lib/booking-pricing';
import {
  CUSTOMER_LANGUAGE_OPTIONS,
  formatCustomerLanguage,
  formatNotificationPreference,
} from '@/lib/customer-preferences';
import { navigateFromProfile } from '@/lib/profile-navigation';
import { useAuth } from '@/providers/AuthProvider';
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

const BOOKING_STATUS_LABELS: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  payment_pending: { label: 'Payment Pending', bg: '#FEE2E2', text: '#B91C1C' },
  pending: { label: 'Awaiting Approval', bg: '#FEF3C7', text: '#B45309' },
  confirmed: { label: 'Confirmed', bg: '#DCFCE7', text: '#15803D' },
  in_progress: { label: 'In Progress', bg: '#FEF3C7', text: '#B45309' },
  awaiting_payment: { label: 'Awaiting Payment', bg: '#FFEDD5', text: '#C2410C' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C' },
  completed: { label: 'Completed', bg: '#EFF6FF', text: '#1D4ED8' },
};

function RecentBookingItem({ booking }: { booking: Booking }) {
  const statusStyle = BOOKING_STATUS_LABELS[booking.status];

  return (
    <View style={styles.recentBookingItem}>
      <View style={styles.recentBookingTop}>
        <View style={styles.recentBookingInfo}>
          <Text style={styles.recentBookingTitle} numberOfLines={1}>
            {booking.serviceName}
          </Text>
          <Text style={styles.recentBookingSubtitle} numberOfLines={1}>
            with {booking.panditName}
          </Text>
        </View>
        <View style={[styles.recentStatusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.recentStatusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>
      <View style={styles.recentBookingMeta}>
        <Ionicons name="calendar-outline" size={13} color={C.textMuted} />
        <Text style={styles.recentBookingMetaText}>
          {formatBookingDate(booking.bookingDate)} • {formatBookingTime(booking.bookingTime)}
        </Text>
      </View>
      <Text style={styles.recentBookingPrice}>{formatINR(booking.totalPrice)}</Text>
    </View>
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
      <SectionHeader title="Recent Bookings" action="View All >" onAction={handleViewAll} />
      {bookings.length === 0 ? (
        <View style={styles.recentCard}>
          <Ionicons name="calendar-outline" size={28} color={C.textLight} />
          <Text style={styles.recentHint}>
            Your booking history will appear here once you book a pandit for a puja or ritual.
          </Text>
        </View>
      ) : (
        <View style={styles.recentListCard}>
          {bookings.map((booking, index) => (
            <View key={booking.id}>
              <RecentBookingItem booking={booking} />
              {index < bookings.length - 1 ? <View style={styles.recentDivider} /> : null}
            </View>
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
  value,
  label,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bg: string;
  value: string;
  label: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Pressable onPress={onPress ?? (() => comingSoon(label))}>
        <Text style={styles.statAction}>{action}</Text>
      </Pressable>
    </View>
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
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
      <Text style={styles.quickActionMeta} numberOfLines={1}>
        {meta}
      </Text>
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
    <View style={styles.quickActionsRow}>
      <QuickAction
        icon="calendar-outline"
        iconColor={C.primary}
        bg="#FFF7ED"
        label="My Bookings"
        meta={bookingsMeta}
        onPress={() => navigateFromProfile('/(tabs)/bookings')}
      />
      <QuickAction
        icon="heart-outline"
        iconColor="#DB2777"
        bg="#FCE7F3"
        label="My Reviews"
        meta={reviewsMeta}
        onPress={() => navigateFromProfile('/(tabs)/history')}
      />
      <QuickAction
        icon="bookmark-outline"
        iconColor={C.success}
        bg="#F0FDF4"
        label="Saved Pandits"
        meta={savedMeta}
        onPress={onViewSavedPandits}
      />
      <QuickAction
        icon="pricetag-outline"
        iconColor="#9333EA"
        bg="#FAF5FF"
        label="Coupons"
        meta="0 available"
        onPress={() => comingSoon('Coupons')}
      />
      <QuickAction
        icon="card-outline"
        iconColor="#3B82F6"
        bg="#EFF6FF"
        label="Transactions"
        meta={transactionsMeta}
        onPress={onViewTransactions}
      />
    </View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={C.textMuted} />
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
      <View style={styles.emptyIconWrap}>
        <Ionicons name="person-circle-outline" size={72} color={C.primary} />
      </View>
      <Text style={styles.emptyTitle}>Profile Not Created</Text>
      <Text style={styles.emptySubtitle}>
        Create your profile with your personal details to get a personalized experience and faster
        bookings on My-Pandit.
      </Text>
      <Pressable style={styles.createProfileBtn} onPress={() => navigateFromProfile('/create-profile')}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.createProfileBtnText}>Create Profile</Text>
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
  const languageLabel = profile.languageLabel || formatCustomerLanguage(profile.languageCode);
  const notificationsLabel = formatNotificationPreference(
    profile.notificationsEnabled !== false,
    unreadCount,
  );

  return (
    <>
      <SectionHeader title="Preferences" />
      <View style={styles.preferencesGrid}>
        <Pressable
          style={[styles.preferenceItem, updating && styles.preferenceItemDisabled]}
          onPress={onSelectLanguage}
          disabled={updating}
        >
          <Ionicons name="language-outline" size={18} color={C.primary} />
          <Text style={styles.preferenceLabel}>Language</Text>
          <Text style={styles.preferenceValue} numberOfLines={1}>
            {languageLabel}
          </Text>
        </Pressable>
        <Pressable
          style={styles.preferenceItem}
          onPress={() => navigateFromProfile('/edit-profile')}
        >
          <Ionicons name="location-outline" size={18} color="#9333EA" />
          <Text style={styles.preferenceLabel}>Preferred City</Text>
          <Text style={styles.preferenceValue} numberOfLines={1}>
            {profile.cityName || 'Not set'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.preferenceItem, updating && styles.preferenceItemDisabled]}
          onPress={onToggleNotifications}
          disabled={updating}
        >
          <Ionicons name="notifications-outline" size={18} color="#DB2777" />
          <Text style={styles.preferenceLabel}>Notifications</Text>
          <Text style={styles.preferenceValue} numberOfLines={1}>
            {notificationsLabel}
          </Text>
        </Pressable>
        <Pressable style={styles.preferenceItem} onPress={onOpenNotifications}>
          <Ionicons name="mail-unread-outline" size={18} color={C.success} />
          <Text style={styles.preferenceLabel}>Alerts</Text>
          <Text style={styles.preferenceValue} numberOfLines={1}>
            {unreadCount > 0 ? `${unreadCount} new` : 'None'}
          </Text>
        </Pressable>
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
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.photoWrap}>
            {profile.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons name="person" size={40} color={C.textLight} />
              </View>
            )}
            <Pressable style={styles.cameraBadge} onPress={() => navigateFromProfile('/edit-profile')} hitSlop={8}>
              <Ionicons name="camera" size={13} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.name}>{fullName}</Text>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={13} color={C.textMuted} />
              <Text style={styles.contactText}>{profile.mobile}</Text>
            </View>
            {profile.email ? (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={13} color={C.textMuted} />
                <Text style={styles.contactText}>{profile.email}</Text>
              </View>
            ) : null}
            {profile.address ? (
              <View style={styles.contactRow}>
                <Ionicons name="location-outline" size={13} color={C.textMuted} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {profile.address}
                </Text>
              </View>
            ) : null}
            {memberSinceYear ? (
              <View style={styles.memberBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.memberBadgeText}>Customer since {memberSinceYear}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="receipt-outline"
          iconColor={C.primary}
          bg="#FFF7ED"
          value={String(stats.totalBookings)}
          label="Total Bookings"
          action="View All >"
          onPress={() => navigateFromProfile('/(tabs)/bookings')}
        />
        <StatCard
          icon="checkmark-done-outline"
          iconColor={C.success}
          bg="#F0FDF4"
          value={String(stats.completedBookings)}
          label="Completed"
          action="View All >"
          onPress={() => navigateFromProfile('/(tabs)/history')}
        />
        <StatCard
          icon="star-outline"
          iconColor="#9333EA"
          bg="#FAF5FF"
          value={String(stats.reviewsGiven)}
          label="Reviews Given"
          action="View All >"
          onPress={() => navigateFromProfile('/(tabs)/history')}
        />
        <StatCard
          icon="wallet-outline"
          iconColor="#3B82F6"
          bg="#EFF6FF"
          value={formatINR(walletBalance)}
          label="Wallet Balance"
          action="Add Money >"
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
      <View style={styles.detailsCard}>
        <DetailRow icon="calendar-outline" label="Date of Birth" value={formatDob(profile.dob)} />
        <DetailRow icon="call-outline" label="Mobile Number" value={profile.mobile} />
        <DetailRow icon="male-female-outline" label="Gender" value={profile.gender ? profile.gender : 'Not added'} />
        <DetailRow icon="mail-outline" label="Email" value={profile.email || 'Not added'} />
        <DetailRow icon="business-outline" label="City" value={profile.cityName || 'Not added'} />
        <DetailRow icon="location-outline" label="Address" value={profile.address || 'Not added'} />
      </View>

      <SectionHeader title="Saved Addresses" action="View All >" onAction={() => comingSoon('Saved Addresses')} />
      <View style={styles.addressCard}>
        {profile.address ? (
          <>
            <View style={styles.addressTop}>
              <View style={styles.addressBadgeRow}>
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
          <Ionicons name="add-circle-outline" size={18} color={C.primary} />
          <Text style={styles.addAddressText}>Add New Address</Text>
        </Pressable>
      </View>

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
  const profile = profileQuery.data?.data;
  const walletBalance = walletQuery.data?.data.balance ?? 0;
  const walletTransactions = walletQuery.data?.data.transactions ?? [];
  const isNotFound =
    profileQuery.error instanceof Error &&
    (profileQuery.error.message.toLowerCase().includes('not found') ||
      profileQuery.error.message.includes('404'));

  const handleSelectLanguage = () => {
    if (!profile) return;

    Alert.alert('Select Language', 'Choose your preferred app language', [
      ...CUSTOMER_LANGUAGE_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => {
          if (option.code === profile.languageCode) return;

          updateProfileMutation.mutate(
            { languageCode: option.code },
            {
              onSuccess: async () => {
                if (token && user) {
                  await signIn(token, { ...user, languageCode: option.code });
                }
              },
              onError: (error) => {
                Alert.alert(
                  'Error',
                  error instanceof Error ? error.message : 'Could not update language',
                );
              },
            },
          );
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
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
      <StatusBar style="dark" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topTitle}>Customer Profile</Text>
        <View style={styles.topActions}>
          {profile ? (
            <Pressable style={styles.editBtn} onPress={() => navigateFromProfile('/edit-profile')} hitSlop={8}>
              <Ionicons name="create-outline" size={18} color={C.primary} />
            </Pressable>
          ) : null}
          <Pressable onPress={openNotifications} hitSlop={8}>
            <View>
              <Ionicons name="notifications-outline" size={22} color={C.text} />
              {badgeLabel ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
          <Pressable onPress={() => comingSoon('Settings')} hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color={C.text} />
          </Pressable>
        </View>
      </View>

      {authLoading || profileQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : !token ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Please sign in to view your profile</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF8' },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF8',
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5EC',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  stateText: { fontSize: 15, color: C.textMuted, textAlign: 'center' },
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 24 },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  emptySubtitle: { marginTop: 10, fontSize: 14, lineHeight: 22, color: C.textMuted, textAlign: 'center' },
  createProfileBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createProfileBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  primaryBtn: { marginTop: 16, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  heroCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  heroTop: { flexDirection: 'row', gap: 14 },
  photoWrap: { position: 'relative' },
  photo: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.border },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF7ED',
  },
  heroInfo: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  contactText: { fontSize: 12, color: C.textMuted, flexShrink: 1 },
  memberBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  memberBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { marginTop: 8, fontSize: 16, fontWeight: '800', color: C.text },
  statLabel: { marginTop: 2, fontSize: 11, color: C.textMuted },
  statAction: { marginTop: 6, fontSize: 11, fontWeight: '700', color: C.primary },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quickAction: { alignItems: 'center', gap: 6, flex: 1 },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 10, color: C.textMuted, fontWeight: '600', textAlign: 'center' },
  quickActionMeta: {
    fontSize: 9,
    color: C.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  sectionAction: { fontSize: 13, fontWeight: '600', color: C.primary },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 11, color: C.textMuted },
  detailValue: { marginTop: 2, fontSize: 14, fontWeight: '600', color: C.text, textTransform: 'capitalize' },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  addressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  defaultBadge: { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  defaultBadgeText: { color: C.success, fontSize: 10, fontWeight: '700' },
  addressActions: { flexDirection: 'row', gap: 12 },
  addressText: { marginTop: 6, fontSize: 13, color: C.textMuted, lineHeight: 20 },
  addressEmptyText: { fontSize: 13, color: C.textMuted },
  addAddressBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
  },
  addAddressText: { color: C.primary, fontSize: 13, fontWeight: '700' },
  preferencesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  preferenceItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  preferenceItemDisabled: { opacity: 0.6 },
  preferenceLabel: { fontSize: 11, color: C.textMuted, marginTop: 4 },
  preferenceValue: { fontSize: 13, fontWeight: '700', color: C.text },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  recentHint: { fontSize: 12, color: C.textLight, textAlign: 'center', lineHeight: 18 },
  recentListCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  recentBookingItem: {
    gap: 6,
  },
  recentBookingTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  recentBookingInfo: {
    flex: 1,
  },
  recentBookingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },
  recentBookingSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: C.textMuted,
  },
  recentStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recentStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  recentBookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentBookingMetaText: {
    fontSize: 12,
    color: C.textMuted,
  },
  recentBookingPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },
  recentDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  logoutBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 14,
  },
  logoutBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});
