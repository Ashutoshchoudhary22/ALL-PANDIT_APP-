import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloudImage } from '@/components/CloudImage';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { Brand, DashboardColors as C } from '@/constants/dashboard-theme';
import { usePanditEarnings } from '@/hooks/use-pandit-earnings';
import {
  useApproveBookingMutation,
  usePanditBookingRequestsQuery,
  useRejectBookingMutation,
} from '@/hooks/use-pandit-booking-requests';
import { usePanditBookingsQuery } from '@/hooks/use-pandit-bookings';
import { useMyPanditProfileQuery } from '@/hooks/use-pandit-profile';
import { usePanditReviewsQuery } from '@/hooks/use-pandit-reviews';
import { formatINR, MonthEarning } from '@/lib/pandit-earnings';
import {
  formatUpcomingBadge,
  formatUpcomingDateTime,
  getUpcomingPujas,
} from '@/lib/pandit-upcoming';
import { promptBookingLocation } from '@/lib/open-map';
import { useAuth } from '@/providers/AuthProvider';
import { PanditBooking } from '@/services/booking.api';
import { PanditReview } from '@/services/review.api';
import { PanditBookingRequestCard } from '@/components/PanditBookingRequestCard';
import { useNotifications } from '@/providers/NotificationsProvider';

type PanditDashboardProps = {
  panditName?: string;
};

function getGreetingName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'Pandit Ji';
  return trimmed.split(/\s+/)[0] || 'Pandit Ji';
}

function getProfileSubtitle(profile: {
  cityName: string | null;
  experienceYears: number;
  rating: number;
  totalReviews: number;
}) {
  const parts: string[] = [];
  if (profile.cityName) parts.push(profile.cityName);
  if (profile.experienceYears > 0) {
    parts.push(`${profile.experienceYears}+ yrs experience`);
  }
  if (profile.totalReviews > 0) {
    parts.push(`${profile.rating.toFixed(1)} ★ (${profile.totalReviews})`);
  }
  return parts.join(' • ');
}

function formatBadgeCount(count: number) {
  if (count <= 0) return '';
  if (count > 9) return '9+';
  return String(count);
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EarningCard({
  label,
  amount,
  subtitle,
  icon,
  iconColor,
  bgColor,
  accent,
  action,
  loading,
}: {
  label: string;
  amount: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  accent: 'gold' | 'maroon' | 'saffron';
  action?: ReactNode;
  loading?: boolean;
}) {
  return (
    <PremiumCard accent={accent} innerStyle={styles.earningCardInner} style={styles.earningCardWrap}>
      <LinearGradient
        colors={[bgColor, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.earningCard}
      >
        <View style={styles.earningTop}>
          <View style={[styles.earningIconWrap, { borderColor: `${iconColor}44` }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          <Text style={styles.earningLabel}>{label}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} style={styles.earningLoader} />
        ) : (
          <Text style={styles.earningAmount}>{amount}</Text>
        )}
        {subtitle ? <Text style={styles.earningSubtitle}>{subtitle}</Text> : null}
        {action}
      </LinearGradient>
    </PremiumCard>
  );
}

function MonthEarningRow({ item }: { item: MonthEarning }) {
  return (
    <View style={styles.monthRow}>
      <View style={styles.monthRowLeft}>
        <View style={styles.monthIconWrap}>
          <Ionicons name="calendar-outline" size={16} color={C.primary} />
        </View>
        <View>
          <Text style={styles.monthLabel}>{item.label}</Text>
          <Text style={styles.monthMeta}>
            {item.bookingCount} confirmed booking{item.bookingCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
      <Text style={styles.monthAmount}>{formatINR(item.amount)}</Text>
    </View>
  );
}

function StatItem({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconWrap, { borderColor: `${iconColor}44` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  bgColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <LinearGradient
        colors={[bgColor, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.quickActionRing, { borderColor: `${color}55` }]}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      </LinearGradient>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function RecentReviewCard({ review }: { review: PanditReview }) {
  const avatarSource = review.customerProfileImage || DEMO_IMAGES.customer;

  return (
    <PremiumCard accent="gold" innerStyle={styles.reviewCardInner}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatarFrame}>
          <CloudImage source={avatarSource} preset="avatar" style={styles.customerAvatar} />
        </View>
        <View style={styles.reviewHeaderText}>
          <Text style={styles.customerName}>{review.customerName}</Text>
          <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
        </View>
        <View style={styles.ratingWrap}>
          <Ionicons name="star" size={14} color={C.gold} />
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= review.rating ? 'star' : 'star-outline'}
            size={16}
            color={C.gold}
          />
        ))}
      </View>
      <Text style={styles.reviewComment} numberOfLines={3}>
        {review.comment || 'No written feedback provided.'}
      </Text>
    </PremiumCard>
  );
}

function UpcomingPujaCard({ booking }: { booking: PanditBooking }) {
  const handleOpenLocation = () => {
    promptBookingLocation({
      latitude: booking.latitude,
      longitude: booking.longitude,
      address: booking.address,
      label: `${booking.customerName} • ${booking.serviceName}`,
    });
  };

  return (
    <PremiumCard accent="saffron" innerStyle={styles.upcomingCardInner}>
      <View style={styles.upcomingBadge}>
        <Text style={styles.upcomingBadgeText}>{formatUpcomingBadge(booking.bookingDate)}</Text>
      </View>
      <View style={styles.upcomingContent}>
        <View style={styles.kalashIcon}>
          <Ionicons name="flame" size={28} color={C.primary} />
        </View>
        <View style={styles.upcomingInfo}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <View style={styles.metaPill}>
            <Ionicons name="calendar-outline" size={13} color={C.maroon} />
            <Text style={styles.metaPillText}>
              {formatUpcomingDateTime(booking.bookingDate, booking.bookingTime)}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="location-outline" size={13} color={C.maroon} />
            <Text style={styles.metaPillText} numberOfLines={2}>
              {booking.address}
            </Text>
          </View>
        </View>
      </View>
      <Pressable style={styles.locationBtnWrap} onPress={handleOpenLocation}>
        <LinearGradient
          colors={[C.maroon, C.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.locationBtn}
        >
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={styles.locationBtnText}>View Location</Text>
        </LinearGradient>
      </Pressable>
    </PremiumCard>
  );
}

export function PanditDashboard({ panditName: panditNameProp }: PanditDashboardProps) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { unreadCount } = useNotifications();
  const badgeLabel = formatBadgeCount(unreadCount);
  const profileQuery = useMyPanditProfileQuery(Boolean(token));
  const earningsQuery = usePanditEarnings(Boolean(token));
  const bookingsQuery = usePanditBookingsQuery(Boolean(token));
  const requestsQuery = usePanditBookingRequestsQuery(Boolean(token));
  const reviewsQuery = usePanditReviewsQuery(Boolean(token));
  const approveBooking = useApproveBookingMutation();
  const rejectBooking = useRejectBookingMutation();
  const summary = earningsQuery.summary;
  const pendingRequests = requestsQuery.data?.data ?? [];
  const upcomingPujas = useMemo(
    () => getUpcomingPujas(bookingsQuery.data?.data ?? []),
    [bookingsQuery.data?.data],
  );
  const featuredUpcomingPuja = upcomingPujas[0] ?? null;
  const featuredRequest = pendingRequests[0] ?? null;
  const recentReviews = reviewsQuery.data?.data ?? [];
  const featuredReview = recentReviews[0] ?? null;
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const profile = profileQuery.data?.data;
  const panditName = profile?.name || panditNameProp || user?.mobile || 'Pandit Ji';
  const greetingName = getGreetingName(panditName);
  const avatarSource = profile?.profileImage || user?.profileImage || DEMO_IMAGES.pandit1;
  const isVerified = Boolean(profile?.isVerified && profile.status === 'approved');
  const isOnline = profile?.isOnline ?? false;
  const profileSubtitle = profile ? getProfileSubtitle(profile) : '';

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void earningsQuery.refetch();
        void profileQuery.refetch();
        void reviewsQuery.refetch();
      }
    }, [token, earningsQuery.refetch, profileQuery.refetch, reviewsQuery.refetch]),
  );

  const handleApprove = async (booking: PanditBooking) => {
    setActiveBookingId(booking.id);
    setActionType('approve');
    try {
      const response = await approveBooking.mutateAsync(booking.id);
      Alert.alert('Approved', response.message);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not approve booking');
    } finally {
      setActiveBookingId(null);
      setActionType(null);
    }
  };

  const handleReject = (booking: PanditBooking) => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActiveBookingId(booking.id);
          setActionType('reject');
          try {
            const response = await rejectBooking.mutateAsync(booking.id);
            Alert.alert('Rejected', response.message);
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Could not reject booking');
          } finally {
            setActiveBookingId(null);
            setActionType(null);
          }
        },
      },
    ]);
  };

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
                {profileQuery.isLoading && !profile ? (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <ActivityIndicator size="small" color={C.primary} />
                  </View>
                ) : (
                  <CloudImage source={avatarSource} preset="avatar" style={styles.avatar} />
                )}
                {isOnline ? <View style={styles.onlineDot} /> : null}
                <View style={styles.avatarRing} pointerEvents="none" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerOm}>ॐ</Text>
                <Text style={styles.greeting}>
                  {Brand.greeting}, <Text style={styles.greetingName}>{greetingName}</Text>
                </Text>
                <Text style={styles.panditName} numberOfLines={1}>{panditName}</Text>
                {profileSubtitle ? (
                  <Text style={styles.profileSubtitle} numberOfLines={1}>
                    {profileSubtitle}
                  </Text>
                ) : null}
                {isVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={C.maroon} />
                    <Text style={styles.verifiedText}>Verified Pandit</Text>
                  </View>
                ) : profile?.status === 'pending' ? (
                  <View style={[styles.verifiedBadge, styles.pendingBadge]}>
                    <Ionicons name="time-outline" size={12} color="#B45309" />
                    <Text style={styles.pendingText}>Verification Pending</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>

            <View style={styles.headerRight}>
              <Pressable style={styles.headerActionBtn} onPress={() => router.push('/notifications')}>
                <Ionicons name="notifications-outline" size={21} color={C.maroon} />
                {badgeLabel ? (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable style={styles.onlinePill}>
                <View style={[styles.onlinePillDot, isOnline && styles.onlinePillDotActive]} />
                <Text style={styles.onlinePillText}>{isOnline ? 'Online' : 'Offline'}</Text>
                <Ionicons name="chevron-down" size={12} color={C.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.headerDividerWrap}>
            <LotusDivider color={C.goldLight} width={200} />
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
        {/* Earnings */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.earningsRow}
        >
          <EarningCard
            label="Today's Earnings"
            amount={formatINR(summary.todayAmount)}
            subtitle={
              summary.todayBookingCount > 0
                ? `${summary.todayBookingCount} confirmed booking${summary.todayBookingCount === 1 ? '' : 's'}`
                : 'No confirmed bookings today'
            }
            icon="cash-outline"
            iconColor={C.primary}
            bgColor={C.orangeBg}
            accent="saffron"
            loading={earningsQuery.isLoading}
          />
          <EarningCard
            label={summary.currentMonthLabel}
            amount={formatINR(summary.currentMonthAmount)}
            subtitle={
              summary.currentMonthBookingCount > 0
                ? `${summary.currentMonthBookingCount} confirmed this month`
                : 'No confirmed bookings this month'
            }
            icon="wallet-outline"
            iconColor={C.success}
            bgColor={C.greenBg}
            accent="gold"
            loading={earningsQuery.isLoading}
          />
          <EarningCard
            label="Wallet Balance"
            amount="₹12,680"
            icon="wallet"
            iconColor={C.purple}
            bgColor={C.purpleBg}
            accent="maroon"
            action={
              <Pressable style={styles.withdrawBtnWrap}>
                <LinearGradient
                  colors={[C.maroon, C.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.withdrawBtn}
                >
                  <Text style={styles.withdrawText}>Withdraw</Text>
                </LinearGradient>
              </Pressable>
            }
          />
        </ScrollView>

        <SectionHeader title="Monthly Earnings" />
        <PremiumCard accent="maroon" innerStyle={styles.monthlyCardInner}>
          <View style={styles.monthlyCard}>
            {earningsQuery.isLoading ? (
              <View style={styles.monthlyLoading}>
                <ActivityIndicator size="small" color={C.primary} />
              </View>
            ) : summary.monthlyBreakdown.length === 0 ? (
              <Text style={styles.monthlyEmpty}>No confirmed booking earnings yet.</Text>
            ) : (
              summary.monthlyBreakdown.map((item, index) => (
                <View key={item.monthKey}>
                  <MonthEarningRow item={item} />
                  {index < summary.monthlyBreakdown.length - 1 ? (
                    <View style={styles.monthDivider} />
                  ) : null}
                </View>
              ))
            )}
          </View>
        </PremiumCard>

        {/* Stats */}
        <PremiumCard accent="gold" innerStyle={styles.statsCardInner}>
          <View style={styles.statsRow}>
            <StatItem
              icon="calendar-outline"
              iconColor={C.blue}
              value={String(summary.todayBookingsCount).padStart(2, '0')}
              label="Today's Bookings"
            />
            <StatItem
              icon="time-outline"
              iconColor={C.primary}
              value={String(summary.upcomingBookingsCount).padStart(2, '0')}
              label="Upcoming Bookings"
            />
            <StatItem
              icon="checkmark-circle-outline"
              iconColor={C.success}
              value={String(summary.completedBookingsCount).padStart(2, '0')}
              label="Completed Services"
            />
          </View>
        </PremiumCard>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" actionLabel="View All >" />
        <PremiumCard accent="gold" innerStyle={styles.quickActionsInner}>
          <View style={styles.quickActionsRow}>
            <QuickAction icon="briefcase-outline" label="Availability" color={C.primary} bgColor={C.orangeBg} />
            <QuickAction icon="flower-outline" label="Services" color="#EC4899" bgColor="#FDF2F8" />
            <QuickAction icon="calendar" label="Calendar" color={C.purple} bgColor={C.purpleBg} onPress={() => router.push('/(tabs)/calendar')} />
            <QuickAction icon="document-text-outline" label="Documents" color={C.success} bgColor={C.greenBg} />
          </View>
        </PremiumCard>

        {/* New Booking Requests */}
        <SectionHeader
          title="New Booking Requests"
          actionLabel={
            pendingRequests.length > 0 ? `View All (${pendingRequests.length}) >` : undefined
          }
          onAction={
            pendingRequests.length > 0 ? () => router.push('/booking-requests') : undefined
          }
        />
        {requestsQuery.isLoading ? (
          <View style={styles.requestsLoading}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : featuredRequest ? (
          <PanditBookingRequestCard
            booking={featuredRequest}
            approving={activeBookingId === featuredRequest.id && actionType === 'approve'}
            rejecting={activeBookingId === featuredRequest.id && actionType === 'reject'}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
            <Text style={styles.requestsEmptyText}>No pending booking requests right now.</Text>
          </PremiumCard>
        )}

        {/* Upcoming Puja */}
        <SectionHeader
          title="Upcoming Puja"
          actionLabel={upcomingPujas.length > 0 ? `View All (${upcomingPujas.length}) >` : undefined}
          onAction={upcomingPujas.length > 0 ? () => router.push('/(tabs)/bookings') : undefined}
        />
        {bookingsQuery.isLoading ? (
          <View style={styles.upcomingLoading}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : featuredUpcomingPuja ? (
          <UpcomingPujaCard booking={featuredUpcomingPuja} />
        ) : (
          <PremiumCard accent="saffron" innerStyle={styles.emptyCardInner}>
            <Text style={styles.upcomingEmptyText}>No upcoming puja scheduled.</Text>
          </PremiumCard>
        )}

        {/* Recent Reviews */}
        <SectionHeader
          title="Recent Reviews"
          actionLabel={recentReviews.length > 0 ? 'View All >' : undefined}
          onAction={recentReviews.length > 0 ? () => router.push('/reviews') : undefined}
        />
        {reviewsQuery.isLoading ? (
          <View style={styles.reviewsLoading}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : featuredReview ? (
          <RecentReviewCard review={featuredReview} />
        ) : (
          <PremiumCard accent="maroon" innerStyle={styles.emptyCardInner}>
            <Text style={styles.reviewsEmptyText}>No customer reviews yet.</Text>
          </PremiumCard>
        )}
        </View>
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
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.success,
    borderWidth: 2,
    borderColor: C.cream,
    zIndex: 3,
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
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 248, 240, 0.9)',
  },
  greetingName: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  panditName: {
    fontSize: 12,
    color: 'rgba(255, 248, 240, 0.8)',
    fontWeight: '500',
  },
  profileSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 248, 240, 0.65)',
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: C.cream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.maroon,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  headerDividerWrap: {
    marginTop: 14,
    opacity: 0.75,
  },
  headerRight: {
    alignItems: 'flex-end',
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
  },
  notifBadge: {
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
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  onlinePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.textLight,
  },
  onlinePillDotActive: {
    backgroundColor: C.success,
  },
  onlinePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.maroon,
  },
  earningsRow: {
    gap: 12,
    paddingBottom: 4,
  },
  earningCardWrap: {
    width: 168,
  },
  earningCardInner: {
    padding: 0,
    overflow: 'hidden',
  },
  earningCard: {
    borderRadius: 18,
    padding: 14,
    minHeight: 130,
  },
  earningTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  earningIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  earningLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  earningAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: C.maroon,
  },
  earningLoader: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  earningSubtitle: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 4,
    lineHeight: 14,
    fontWeight: '500',
  },
  monthlyCardInner: {
    padding: 0,
    marginBottom: 8,
  },
  monthlyCard: {
    padding: 14,
  },
  monthlyLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  monthlyEmpty: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  monthRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  monthIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: C.maroon,
  },
  monthMeta: {
    marginTop: 2,
    fontSize: 11,
    color: C.textMuted,
  },
  monthAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: C.success,
  },
  monthDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 160, 23, 0.2)',
  },
  statsCardInner: {
    padding: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.maroon,
  },
  statLabel: {
    fontSize: 10,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
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
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },
  quickActionsInner: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionRing: {
    padding: 2,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '700',
    textAlign: 'center',
  },
  requestsLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCardInner: {
    padding: 18,
  },
  requestsEmptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  withdrawBtnWrap: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  withdrawBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  withdrawText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.border,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.maroon,
  },
  serviceName: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
    marginBottom: 6,
    fontWeight: '600',
  },
  upcomingCardInner: {
    padding: 16,
    position: 'relative',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: C.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.maroon,
  },
  upcomingContent: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    paddingRight: 60,
  },
  kalashIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
  },
  upcomingInfo: {
    flex: 1,
    paddingTop: 2,
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: C.creamDark,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.2)',
  },
  metaPillText: {
    flex: 1,
    fontSize: 12,
    color: C.text,
    lineHeight: 17,
    fontWeight: '500',
  },
  upcomingLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  upcomingEmptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  reviewsLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  reviewsEmptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  locationBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  locationBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  reviewCardInner: {
    padding: 16,
    marginBottom: 8,
  },
  reviewAvatarFrame: {
    padding: 2,
    borderRadius: 24,
    backgroundColor: C.gold,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewDate: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.maroon,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 10,
  },
  reviewComment: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 20,
    marginTop: 8,
  },
});
