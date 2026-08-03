import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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

import { HomeColors as C } from '@/constants/home-theme';
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
import { Booking } from '@/services/booking.api';

const STATUS_STYLES: Record<
  'completed' | 'cancelled',
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  completed: { label: 'Completed', bg: '#EFF6FF', text: '#1D4ED8', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle-outline' },
};

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
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={28}
            color={star <= value ? '#FBBF24' : C.textLight}
          />
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
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.serviceWrap}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <Text style={styles.panditName}>with {booking.panditName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={16} color={C.textMuted} />
        <Text style={styles.metaText}>{formatBookingDate(booking.bookingDate)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={16} color={C.textMuted} />
        <Text style={styles.metaText}>{formatBookingTime(booking.bookingTime)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={16} color={C.textMuted} />
        <Text style={styles.metaText} numberOfLines={2}>
          {booking.address}
        </Text>
      </View>

      {completedLabel && booking.status === 'completed' ? (
        <View style={styles.metaRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={C.success} />
          <Text style={styles.metaText}>Completed on {completedLabel}</Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.tagsRow}>
          {booking.samagriRequired ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Samagri included</Text>
            </View>
          ) : null}
          {booking.paymentStatus === 'fully_paid' ? (
            <View style={[styles.tag, styles.tagPaid]}>
              <Text style={[styles.tagText, styles.tagPaidText]}>Fully paid</Text>
            </View>
          ) : null}
          {paymentMethod ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Paid via {paymentMethod}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.totalPrice}>{formatINR(booking.totalPrice)}</Text>
      </View>

      {booking.status === 'completed' && booking.reviewRating != null ? (
        <View style={styles.reviewRow}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={styles.reviewText}>You rated {booking.reviewRating}/5</Text>
        </View>
      ) : null}

      {booking.status === 'completed' && booking.needsReview ? (
        <Pressable style={styles.reviewBtn} onPress={() => onReview(booking)}>
          <Ionicons name="star-outline" size={16} color="#fff" />
          <Text style={styles.reviewBtnText}>Rate this puja</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const keyExtractor = (item: Booking) => String(item.id);

function ListSeparator() {
  return <View style={styles.separator} />;
}

export function CustomerHistoryScreen() {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>Your completed and cancelled puja bookings</Text>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>Loading your history...</Text>
        </View>
      ) : bookingsQuery.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.centerText}>Could not load booking history.</Text>
          <Pressable style={styles.retryBtn} onPress={() => bookingsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
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
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="time-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No history yet</Text>
              <Text style={styles.emptySubtitle}>
                Completed and cancelled bookings will appear here after your puja sessions.
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={Boolean(reviewBooking)} animationType="slide" transparent onRequestClose={closeReview}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
              <Pressable style={styles.modalCancelBtn} onPress={closeReview} disabled={submitReview.isPending}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, (rating < 1 || submitReview.isPending) && styles.modalSubmitDisabled]}
                onPress={handleSubmitReview}
                disabled={rating < 1 || submitReview.isPending}
              >
                {submitReview.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Review</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 13,
    color: C.textMuted,
  },
  listContent: {
    paddingTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 12,
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
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  serviceWrap: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  panditName: {
    marginTop: 2,
    fontSize: 13,
    color: C.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 8,
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
    backgroundColor: C.background,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  tagPaid: {
    backgroundColor: '#DCFCE7',
  },
  tagPaidText: {
    color: '#15803D',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  reviewText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  reviewBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  reviewBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  commentInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    textAlignVertical: 'top',
    backgroundColor: C.background,
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
    borderRadius: 12,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMuted,
  },
  modalSubmitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  modalSubmitDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
