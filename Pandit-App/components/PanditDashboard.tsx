import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import {
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

type PanditDashboardProps = {
  panditName?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  notificationCount?: number;
};

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
  trend,
  icon,
  iconColor,
  bgColor,
  action,
}: {
  label: string;
  amount: string;
  trend?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  action?: ReactNode;
}) {
  return (
    <View style={[styles.earningCard, { backgroundColor: bgColor }]}>
      <View style={styles.earningTop}>
        <View style={[styles.earningIconWrap, { backgroundColor: `${iconColor}22` }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.earningLabel}>{label}</Text>
      </View>
      <Text style={styles.earningAmount}>{amount}</Text>
      {trend ? (
        <Text style={styles.earningTrend}>
          <Text style={styles.trendUp}>↑ </Text>
          {trend}
        </Text>
      ) : null}
      {action}
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

export function PanditDashboard({
  panditName = 'Pt. Shyam Sharma',
  isVerified = true,
  isOnline = true,
  notificationCount = 3,
}: PanditDashboardProps) {
  const insets = useSafeAreaInsets();

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
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <CloudImage
                source={DEMO_IMAGES.pandit1}
                preset="avatar"
                style={styles.avatar}
              />
              {isOnline ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Namaste, Pandit Ji 🙏</Text>
              <Text style={styles.panditName}>{panditName}</Text>
              {isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="star" size={12} color={C.primary} />
                  <Text style={styles.verifiedText}>Verified Pandit</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={24} color={C.text} />
              {notificationCount > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notificationCount}</Text>
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
            amount="₹2,450"
            trend="12% from yesterday"
            icon="cash-outline"
            iconColor={C.primary}
            bgColor={C.orangeBg}
          />
          <EarningCard
            label="Monthly Earnings"
            amount="₹48,750"
            trend="18% from last month"
            icon="wallet-outline"
            iconColor={C.success}
            bgColor={C.greenBg}
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

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem icon="calendar-outline" iconColor={C.blue} value="04" label="Today's Bookings" />
          <StatItem icon="time-outline" iconColor={C.primary} value="06" label="Upcoming Bookings" />
          <StatItem icon="checkmark-circle-outline" iconColor={C.success} value="23" label="Completed Services" />
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
        <SectionHeader title="New Booking Requests" actionLabel="View All (2) >" />
        <View style={styles.bookingCard}>
          <View style={styles.bookingCardTop}>
            <CloudImage
              source={DEMO_IMAGES.customer}
              preset="avatar"
              style={styles.customerAvatar}
            />
            <View style={styles.bookingInfo}>
              <Text style={styles.customerName}>Rahul Verma</Text>
              <Text style={styles.serviceName}>Griha Pravesh Puja</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={C.textMuted} />
                <Text style={styles.metaText}>Indore, Madhya Pradesh</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
                <Text style={styles.metaText}>25 May 2024 • 10:00 AM</Text>
              </View>
            </View>
            <Text style={styles.price}>₹3,500</Text>
          </View>
          <View style={styles.bookingActions}>
            <Pressable style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </Pressable>
            <Pressable style={styles.rejectBtn}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </Pressable>
          </View>
        </View>

        {/* Upcoming Puja */}
        <SectionHeader title="Upcoming Puja" actionLabel="View All >" />
        <View style={[styles.upcomingCard, { backgroundColor: C.yellowBg }]}>
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingBadgeText}>Tomorrow</Text>
          </View>
          <View style={styles.upcomingContent}>
            <View style={styles.kalashIcon}>
              <Text style={styles.kalashEmoji}>🪔</Text>
            </View>
            <View style={styles.upcomingInfo}>
              <Text style={styles.customerName}>Satyam Singh</Text>
              <Text style={styles.serviceName}>Satyanarayan Katha</Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
                <Text style={styles.metaText}>26 May 2024 • 11:00 AM</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={C.textMuted} />
                <Text style={styles.metaText}>Vijay Nagar, Indore, MP</Text>
              </View>
            </View>
          </View>
          <Pressable style={styles.locationBtn}>
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.locationBtnText}>View Location</Text>
          </Pressable>
        </View>

        {/* Recent Reviews */}
        <SectionHeader title="Recent Reviews" actionLabel="View All >" />
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <CloudImage
              source={DEMO_IMAGES.customer}
              preset="avatar"
              style={styles.customerAvatar}
            />
            <View style={styles.reviewHeaderText}>
              <Text style={styles.customerName}>Priya Gupta</Text>
              <Text style={styles.reviewDate}>20 May 2024</Text>
            </View>
            <View style={styles.ratingWrap}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.ratingText}>5.0</Text>
            </View>
          </View>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons key={i} name="star" size={16} color="#FBBF24" />
            ))}
          </View>
          <Text style={styles.reviewComment}>
            Very good experience. Pooja was performed very well.
          </Text>
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
  earningTrend: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
  },
  trendUp: {
    color: C.success,
    fontWeight: '700',
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
