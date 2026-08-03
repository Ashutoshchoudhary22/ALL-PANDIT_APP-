import { Ionicons } from '@expo/vector-icons';
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
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { DashboardColors as C } from '@/constants/dashboard-theme';
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
      <Text style={styles.sectionTitle}>{title}</Text>
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
  action,
  loading,
}: {
  label: string;
  amount: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  action?: ReactNode;
  loading?: boolean;
}) {
  return (
    <View style={[styles.earningCard, { backgroundColor: bgColor }]}>
      <View style={styles.earningTop}>
        <View style={[styles.earningIconWrap, { backgroundColor: `${iconColor}22` }]}>
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
    </View>
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
      <View style={[styles.statIconWrap, { backgroundColor: `${iconColor}18` }]}>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Pressable style={styles.quickAction}>
      <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
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
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <CloudImage source={avatarSource} preset="avatar" style={styles.customerAvatar} />
        <View style={styles.reviewHeaderText}>
          <Text style={styles.customerName}>{review.customerName}</Text>
          <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
        </View>
        <View style={styles.ratingWrap}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= review.rating ? 'star' : 'star-outline'}
            size={16}
            color="#FBBF24"
          />
        ))}
      </View>
      <Text style={styles.reviewComment} numberOfLines={3}>
        {review.comment || 'No written feedback provided.'}
      </Text>
    </View>
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
    <View style={[styles.upcomingCard, { backgroundColor: C.yellowBg }]}>
      <View style={styles.upcomingBadge}>
        <Text style={styles.upcomingBadgeText}>{formatUpcomingBadge(booking.bookingDate)}</Text>
      </View>
      <View style={styles.upcomingContent}>
        <View style={styles.kalashIcon}>
          <Text style={styles.kalashEmoji}>🪔</Text>
        </View>
        <View style={styles.upcomingInfo}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
            <Text style={styles.metaText}>
              {formatUpcomingDateTime(booking.bookingDate, booking.bookingTime)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={C.textMuted} />
            <Text style={styles.metaText} numberOfLines={2}>
              {booking.address}
            </Text>
          </View>
        </View>
      </View>
      <Pressable style={styles.locationBtn} onPress={handleOpenLocation}>
        <Ionicons name="location" size={16} color="#fff" />
        <Text style={styles.locationBtnText}>View Location</Text>
      </Pressable>
    </View>
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
        void requestsQuery.refetch();
        void bookingsQuery.refetch();
        void reviewsQuery.refetch();
      }
    }, [token, earningsQuery.refetch, profileQuery.refetch, requestsQuery.refetch, bookingsQuery.refetch, reviewsQuery.refetch]),
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
          <Pressable
            style={styles.headerLeft}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.avatarWrap}>
              {profileQuery.isLoading && !profile ? (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : (
                <CloudImage
                  source={avatarSource}
                  preset="avatar"
                  style={styles.avatar}
                />
              )}
              {isOnline ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Namaste, {greetingName} 🙏</Text>
              <Text style={styles.panditName}>{panditName}</Text>
              {profileSubtitle ? (
                <Text style={styles.profileSubtitle} numberOfLines={1}>
                  {profileSubtitle}
                </Text>
              ) : null}
              {isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="star" size={12} color={C.primary} />
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
            <Pressable style={styles.notifBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={C.text} />
              {badgeLabel ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.onlinePill}>
              <View style={[styles.onlinePillDot, isOnline && styles.onlinePillDotActive]} />
              <Text style={styles.onlinePillText}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Ionicons name="chevron-down" size={14} color={C.textMuted} />
            </Pressable>
          </View>
        </View>

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
            loading={earningsQuery.isLoading}
          />
          <EarningCard
            label="Wallet Balance"
            amount="₹12,680"
            icon="wallet"
            iconColor={C.purple}
            bgColor={C.purpleBg}
            action={
              <Pressable style={styles.withdrawBtn}>
                <Text style={styles.withdrawText}>Withdraw</Text>
              </Pressable>
            }
          />
        </ScrollView>

        <SectionHeader title="Monthly Earnings" />
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

        {/* Stats */}
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

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" actionLabel="View All >" />
        <View style={styles.quickActionsRow}>
          <QuickAction icon="briefcase-outline" label="Availability" color={C.primary} bgColor={C.orangeBg} />
          <QuickAction icon="flower-outline" label="Services" color="#EC4899" bgColor="#FDF2F8" />
          <QuickAction icon="calendar" label="Calendar" color={C.purple} bgColor={C.purpleBg} />
          <QuickAction icon="document-text-outline" label="Documents" color={C.success} bgColor={C.greenBg} />
        </View>

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
          <View style={styles.requestsEmpty}>
            <Text style={styles.requestsEmptyText}>No pending booking requests right now.</Text>
          </View>
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
          <View style={styles.upcomingEmpty}>
            <Text style={styles.upcomingEmptyText}>No upcoming puja scheduled.</Text>
          </View>
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
          <View style={styles.reviewsEmpty}>
            <Text style={styles.reviewsEmptyText}>No customer reviews yet.</Text>
          </View>
        )}
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
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.border,
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
    borderColor: '#fff',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  panditName: {
    fontSize: 14,
    color: C.textMuted,
    marginTop: 2,
  },
  profileSubtitle: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: C.orangeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.primary,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  notifBtn: {
    position: 'relative',
    padding: 4,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
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
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },
  earningsRow: {
    gap: 12,
    paddingBottom: 4,
  },
  earningCard: {
    width: 160,
    borderRadius: 16,
    padding: 14,
    marginRight: 0,
  },
  earningTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  earningIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  earningAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
  },
  earningLoader: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  earningSubtitle: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  monthlyCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
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
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
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
    backgroundColor: C.border,
  },
  requestsLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  requestsEmpty: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  requestsEmptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  withdrawBtn: {
    marginTop: 10,
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  withdrawText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
  },
  statLabel: {
    fontSize: 10,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
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
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingCardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.border,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  serviceName: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: C.textMuted,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: C.success,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: C.success,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.danger,
  },
  rejectBtnText: {
    color: C.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  upcomingCard: {
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: C.yellowBadge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  upcomingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  upcomingContent: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  kalashIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kalashEmoji: {
    fontSize: 32,
  },
  upcomingInfo: {
    flex: 1,
    paddingTop: 4,
  },
  upcomingLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  upcomingEmpty: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  upcomingEmptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  reviewsLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  reviewsEmpty: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  reviewsEmptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  locationBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
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
