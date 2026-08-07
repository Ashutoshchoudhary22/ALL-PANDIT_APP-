import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Brand, HomeColors as C } from '@/constants/home-theme';
import { useMyBookingsQuery, useSubmitBookingReviewMutation } from '@/hooks/use-bookings';
import {
  formatBookingDate,
  formatBookingTime,
  formatCompletedAt,
  isHistoryBooking,
  sortHistoryBookings,
} from '@/lib/booking-display';
import { formatINR } from '@/lib/booking-pricing';
import { useProfileReturnBackHandler } from '@/lib/profile-navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from '@/providers/LanguageProvider';
import { Booking } from '@/services/booking.api';

const STATUS_STYLES: Record<
  'completed' | 'cancelled',
  {
    label: string;
    bg: string;
    text: string;
    icon: keyof typeof Ionicons.glyphMap;
    accent: 'gold' | 'maroon' | 'saffron' | 'none';
  }
> = {
  completed: {
    label: 'Completed',
    bg: '#DCFCE7',
    text: '#15803D',
    icon: 'checkmark-done-outline',
    accent: 'saffron',
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#FEE2E2',
    text: '#B91C1C',
    icon: 'close-circle-outline',
    accent: 'maroon',
  },
};

function MetaPill({
  icon,
  text,
  iconColor = C.maroon,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={13} color={iconColor} />
      <Text style={styles.metaPillText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={8}>
          <View style={[styles.starWrap, star <= value && styles.starWrapActive]}>
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={26}
              color={star <= value ? C.gold : C.textLight}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const HistoryCard = memo(function HistoryCard({
  booking,
  onReview,
}: {
  booking: Booking;
  onReview: (booking: Booking) => void;
}) {
  const statusStyle = STATUS_STYLES[booking.status as 'completed' | 'cancelled'];
  const completedLabel = formatCompletedAt(booking.completedAt);
  const paymentMethod =
    booking.remainingPaymentMethod === 'cash'
      ? 'Cash'
      : booking.remainingPaymentMethod === 'online'
        ? 'Online'
        : null;

  return (
    <PremiumCard accent={statusStyle.accent} innerStyle={styles.cardInner}>
      <View style={styles.cardTop}>
        <View style={styles.serviceIconWrap}>
          <LinearGradient
            colors={
              booking.status === 'completed'
                ? ['#ECFDF5', '#FFFFFF']
                : ['#FEF2F2', '#FFFFFF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.serviceIconGradient}
          >
            <Ionicons
              name={booking.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={booking.status === 'completed' ? C.success : C.danger}
            />
          </LinearGradient>
        </View>
        <View style={styles.serviceWrap}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <View style={styles.panditRow}>
            <Ionicons name="person-circle-outline" size={14} color={C.textMuted} />
            <Text style={styles.panditName}>{booking.panditName}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={11} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <MetaPill icon="calendar-outline" text={formatBookingDate(booking.bookingDate)} />
        <MetaPill icon="time-outline" text={formatBookingTime(booking.bookingTime)} />
        <MetaPill icon="location-outline" text={booking.address} />
        {completedLabel && booking.status === 'completed' ? (
          <MetaPill
            icon="checkmark-circle-outline"
            text={`Completed on ${completedLabel}`}
            iconColor={C.success}
          />
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.tagsRow}>
          {booking.samagriRequired ? (
            <View style={styles.tag}>
              <Ionicons name="basket-outline" size={11} color={C.primary} />
              <Text style={styles.tagText}>Samagri included</Text>
            </View>
          ) : null}
          {booking.paymentStatus === 'fully_paid' ? (
            <View style={[styles.tag, styles.tagPaid]}>
              <Ionicons name="checkmark-circle" size={11} color="#15803D" />
              <Text style={[styles.tagText, styles.tagPaidText]}>Fully paid</Text>
            </View>
          ) : null}
          {paymentMethod ? (
            <View style={styles.tag}>
              <Ionicons name="card-outline" size={11} color={C.textMuted} />
              <Text style={[styles.tagText, styles.tagMutedText]}>Paid via {paymentMethod}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.totalPrice}>{formatINR(booking.totalPrice)}</Text>
      </View>

      {booking.status === 'completed' && booking.reviewRating != null ? (
        <View style={styles.reviewRow}>
          <View style={styles.reviewStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= booking.reviewRating! ? 'star' : 'star-outline'}
                size={14}
                color={C.gold}
              />
            ))}
          </View>
          <Text style={styles.reviewText}>You rated {booking.reviewRating}/5</Text>
        </View>
      ) : null}

      {booking.status === 'completed' && booking.needsReview ? (
        <Pressable style={styles.reviewBtnWrap} onPress={() => onReview(booking)}>
          <LinearGradient
            colors={[C.maroon, C.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.reviewBtn}
          >
            <Ionicons name="star-outline" size={16} color="#fff" />
            <Text style={styles.reviewBtnText}>Rate this puja</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </PremiumCard>
  );
});

const keyExtractor = (item: Booking) => String(item.id);

function ListSeparator() {
  return <View style={styles.separator} />;
}

export function CustomerHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useProfileReturnBackHandler();
  const { token } = useAuth();
  const bookingsQuery = useMyBookingsQuery(Boolean(token));
  const submitReview = useSubmitBookingReviewMutation();
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const historyBookings = useMemo(() => {
    const items = (bookingsQuery.data?.data ?? []).filter((booking) =>
      isHistoryBooking(booking.status),
    );
    return sortHistoryBookings(items);
  }, [bookingsQuery.data?.data]);

  const completedCount = useMemo(
    () => historyBookings.filter((b) => b.status === 'completed').length,
    [historyBookings],
  );
  const cancelledCount = useMemo(
    () => historyBookings.filter((b) => b.status === 'cancelled').length,
    [historyBookings],
  );
  const pendingReviewsCount = useMemo(
    () => historyBookings.filter((b) => b.status === 'completed' && b.needsReview).length,
    [historyBookings],
  );

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void bookingsQuery.refetch();
      }
    }, [token, bookingsQuery.refetch]),
  );

  const openReview = useCallback((booking: Booking) => {
    setReviewBooking(booking);
    setRating(0);
    setComment('');
  }, []);

  const closeReview = useCallback(() => {
    setReviewBooking(null);
    setRating(0);
    setComment('');
  }, []);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewBooking || rating < 1) return;

    try {
      const response = await submitReview.mutateAsync({
        bookingId: reviewBooking.id,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Thank You!', response.message);
      closeReview();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not submit review');
    }
  }, [reviewBooking, rating, comment, submitReview, closeReview]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Booking>) => (
      <HistoryCard booking={item} onReview={openReview} />
    ),
    [openReview],
  );

  const handleRefresh = useCallback(() => {
    void bookingsQuery.refetch();
  }, [bookingsQuery.refetch]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerOm}>ॐ</Text>
            <Text style={styles.headerTitle}>{t('history.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('history.subtitle')}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="time" size={22} color={C.maroon} />
            <Text style={styles.headerBadgeCount}>{historyBookings.length}</Text>
            <Text style={styles.headerBadgeLabel}>{t('history.badge.total')}</Text>
          </View>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} />
        </View>
      </LinearGradient>

      <View style={styles.summaryStrip}>
        <PremiumCard accent="saffron" innerStyle={styles.summaryCardInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-done-outline" size={18} color={C.success} />
            </View>
            <View>
              <Text style={styles.summaryValue}>{completedCount}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          </View>
        </PremiumCard>
        <PremiumCard accent="maroon" innerStyle={styles.summaryCardInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="close-circle-outline" size={18} color={C.danger} />
            </View>
            <View>
              <Text style={styles.summaryValue}>{cancelledCount}</Text>
              <Text style={styles.summaryLabel}>Cancelled</Text>
            </View>
          </View>
        </PremiumCard>
        <PremiumCard accent="gold" innerStyle={styles.summaryCardInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="star-outline" size={18} color={C.gold} />
            </View>
            <View>
              <Text style={styles.summaryValue}>{pendingReviewsCount}</Text>
              <Text style={styles.summaryLabel}>To Review</Text>
            </View>
          </View>
        </PremiumCard>
      </View>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... loading your history</Text>
        </View>
      ) : bookingsQuery.isError ? (
        <View style={styles.centerState}>
          <PremiumCard accent="maroon" innerStyle={styles.errorCardInner}>
            <View style={styles.errorContent}>
              <View style={styles.errorIconWrap}>
                <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
              </View>
              <Text style={styles.errorTitle}>Could not load history</Text>
              <Text style={styles.errorSubtitle}>Please check your connection and try again.</Text>
              <Pressable style={styles.retryBtnWrap} onPress={() => bookingsQuery.refetch()}>
                <LinearGradient
                  colors={[C.maroon, C.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </PremiumCard>
        </View>
      ) : (
        <FlatList
          data={historyBookings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
            historyBookings.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={ListSeparator}
          refreshControl={
            <RefreshControl
              refreshing={bookingsQuery.isRefetching && !bookingsQuery.isLoading}
              onRefresh={handleRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="time-outline" size={36} color={C.maroon} />
                </View>
                <Text style={styles.emptyOm}>ॐ</Text>
                <Text style={styles.emptyTitle}>No history yet</Text>
                <Text style={styles.emptySubtitle}>
                  Completed and cancelled bookings will appear here after your puja sessions.
                </Text>
              </View>
            </PremiumCard>
          }
        />
      )}

      <Modal visible={Boolean(reviewBooking)} animationType="slide" transparent onRequestClose={closeReview}>
        <View style={styles.modalBackdrop}>
          <PremiumCard accent="gold" innerStyle={styles.modalCardInner} style={styles.modalCardWrap}>
            <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalOm}>ॐ</Text>
              <Text style={styles.modalTitle}>Rate your experience</Text>
              {reviewBooking ? (
                <Text style={styles.modalSubtitle}>
                  {reviewBooking.serviceName} with {reviewBooking.panditName}
                </Text>
              ) : null}

              <StarPicker value={rating} onChange={setRating} />

              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience (optional)"
                placeholderTextColor={C.textLight}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={closeReview}
                  disabled={submitReview.isPending}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modalSubmitWrap,
                    (rating < 1 || submitReview.isPending) && styles.modalSubmitDisabled,
                  ]}
                  onPress={handleSubmitReview}
                  disabled={rating < 1 || submitReview.isPending}
                >
                  <LinearGradient
                    colors={[C.maroon, C.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSubmitBtn}
                  >
                    {submitReview.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.modalSubmitText}>Submit Review</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </PremiumCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerOm: {
    fontSize: 14,
    color: C.goldLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,248,240,0.85)',
    fontWeight: '500',
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.borderGold,
    minWidth: 72,
  },
  headerBadgeCount: {
    fontSize: 20,
    fontWeight: '800',
    color: C.maroon,
    marginTop: 2,
  },
  headerBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    marginTop: 1,
  },
  headerDividerWrap: {
    marginTop: 14,
    opacity: 0.75,
  },
  summaryStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  summaryCard: {
    flex: 1,
  },
  summaryCardInner: {
    padding: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.maroon,
  },
  summaryLabel: {
    fontSize: 9,
    color: C.textMuted,
    fontWeight: '700',
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  cardInner: {
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  serviceIconWrap: {
    padding: 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  serviceIconGradient: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceWrap: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.maroon,
  },
  panditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  panditName: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: '38%',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    flexShrink: 1,
  },
  metaGrid: {
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.creamDark,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.2)',
  },
  metaPillText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 160, 23, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  tagsRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF0E0',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.15)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.primary,
  },
  tagMutedText: {
    color: C.textMuted,
  },
  tagPaid: {
    backgroundColor: '#ECFDF5',
    borderColor: 'rgba(46, 125, 50, 0.15)',
  },
  tagPaidText: {
    color: '#15803D',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
  },
  reviewRow: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.maroon,
  },
  reviewBtnWrap: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  reviewBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 12,
    fontSize: 14,
    color: C.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorCardInner: {
    padding: 24,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '800',
    color: C.maroon,
  },
  errorSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtnWrap: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyCardInner: {
    padding: 32,
    marginTop: 40,
  },
  emptyWrap: {
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  emptyOm: {
    fontSize: 20,
    color: C.gold,
    marginTop: 12,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '800',
    color: C.maroon,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 16,
  },
  starWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.creamDark,
    borderWidth: 1,
    borderColor: C.border,
  },
  starWrapActive: {
    backgroundColor: '#FFFBEB',
    borderColor: C.borderGold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(61, 21, 21, 0.55)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  modalCardWrap: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalCardInner: {
    padding: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalCard: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: 12,
  },
  modalOm: {
    fontSize: 18,
    color: C.gold,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.maroon,
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  commentInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: C.borderGold,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    textAlignVertical: 'top',
    backgroundColor: C.cream,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.creamDark,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textMuted,
  },
  modalSubmitWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalSubmitDisabled: {
    opacity: 0.6,
  },
  modalSubmitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
