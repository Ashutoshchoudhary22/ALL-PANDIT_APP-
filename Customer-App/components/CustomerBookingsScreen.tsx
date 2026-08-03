import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, memo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RazorpayCheckoutModal } from '@/components/RazorpayCheckoutModal';
import { HomeColors as C } from '@/constants/home-theme';
import {
  useCancelBookingMutation,
  useMyBookingsQuery,
  usePayBookingWithWalletMutation,
  useRetryBookingPaymentMutation,
  useVerifyBookingPaymentMutation,
} from '@/hooks/use-bookings';
import {
  formatBookingDate,
  formatBookingTime,
  isActiveBooking,
} from '@/lib/booking-display';
import { formatINR } from '@/lib/booking-pricing';
import { useMyWalletQuery } from '@/hooks/use-wallet';
import { useAuth } from '@/providers/AuthProvider';
import {
  Booking,
  BookingCustomerPrefill,
  BookingPaymentDetails,
} from '@/services/booking.api';

const STATUS_STYLES: Record<
  Booking['status'],
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  payment_pending: { label: 'Payment Pending', bg: '#FEE2E2', text: '#B91C1C', icon: 'card-outline' },
  pending: { label: 'Awaiting Approval', bg: '#FEF3C7', text: '#B45309', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle-outline' },
  in_progress: { label: 'In Progress', bg: '#FEF3C7', text: '#B45309', icon: 'play-circle-outline' },
  awaiting_payment: {
    label: 'Awaiting Payment',
    bg: '#FFEDD5',
    text: '#C2410C',
    icon: 'cash-outline',
  },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle-outline' },
  completed: { label: 'Completed', bg: '#EFF6FF', text: '#1D4ED8', icon: 'checkmark-done-outline' },
};

const BookingCard = memo(function BookingCard({
  booking,
  paying,
  payingWithWallet,
  cancelling,
  walletBalance,
  onPayNow,
  onPayWithWallet,
  onCancel,
}: {
  booking: Booking;
  paying: boolean;
  payingWithWallet: boolean;
  cancelling: boolean;
  walletBalance: number;
  onPayNow: (booking: Booking) => void;
  onPayWithWallet: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}) {
  const statusStyle = STATUS_STYLES[booking.status];
  const needsPayment = booking.status === 'payment_pending';
  const canCancel = booking.status === 'pending' || booking.status === 'payment_pending';
  const canPayWithWallet = walletBalance >= booking.advanceAmount;

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

      {booking.specialRequirements ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Special Requirements</Text>
          <Text style={styles.noteText}>{booking.specialRequirements}</Text>
        </View>
      ) : null}

      {booking.sessionOtp ? (
        <View style={styles.otpBox}>
          <Text style={styles.otpLabel}>
            {booking.sessionOtpPurpose === 'finish' ? 'Finish Puja OTP' : 'Start Puja OTP'}
          </Text>
          <Text style={styles.otpValue}>{booking.sessionOtp}</Text>
          <Text style={styles.otpHint}>
            {booking.sessionOtpHint ||
              'Share this OTP with pandit ji. Also sent to your email.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.tagsRow}>
          {booking.samagriRequired ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Samagri included</Text>
            </View>
          ) : null}
          {booking.paymentStatus === 'advance_paid' ? (
            <View style={[styles.tag, styles.tagPaid]}>
              <Text style={[styles.tagText, styles.tagPaidText]}>40% paid</Text>
            </View>
          ) : null}
          {booking.status === 'confirmed' ? (
            <View style={[styles.tag, styles.tagConfirmed]}>
              <Text style={[styles.tagText, styles.tagConfirmedText]}>Confirmed</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.totalPrice}>{formatINR(booking.totalPrice)}</Text>
          {booking.remainingAmount > 0 || booking.advanceAmount > 0 ? (
            <Text style={styles.remainingText}>
              {booking.paymentStatus === 'advance_paid' ? 'Due later: ' : 'Advance: '}
              {formatINR(
                booking.paymentStatus === 'advance_paid'
                  ? booking.remainingAmount
                  : booking.advanceAmount,
              )}
            </Text>
          ) : null}
        </View>
      </View>

      {booking.status === 'pending' ? (
        <View style={styles.waitingBox}>
          <Ionicons name="hourglass-outline" size={16} color="#B45309" />
          <Text style={styles.waitingText}>
            Waiting for pandit approval. You can pay 40% after approval.
          </Text>
        </View>
      ) : null}

      {needsPayment ? (
        <>
          <Pressable
            style={[styles.payBtn, (paying || payingWithWallet) && styles.payBtnDisabled]}
            onPress={() => onPayNow(booking)}
            disabled={paying || payingWithWallet || cancelling}
          >
            {paying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="card-outline" size={16} color="#fff" />
                <Text style={styles.payBtnText}>
                  Pay Online • {formatINR(booking.advanceAmount)}
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[
              styles.walletPayBtn,
              (!canPayWithWallet || paying || payingWithWallet) && styles.walletPayBtnDisabled,
            ]}
            onPress={() => onPayWithWallet(booking)}
            disabled={!canPayWithWallet || paying || payingWithWallet || cancelling}
          >
            {payingWithWallet ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <>
                <Ionicons name="wallet-outline" size={16} color={C.primary} />
                <Text style={styles.walletPayBtnText}>
                  {canPayWithWallet
                    ? `Pay with Wallet • ${formatINR(booking.advanceAmount)}`
                    : `Wallet: ${formatINR(walletBalance)} (insufficient)`}
                </Text>
              </>
            )}
          </Pressable>
        </>
      ) : null}

      {canCancel ? (
        <Pressable
          style={[styles.cancelBtn, (paying || cancelling) && styles.payBtnDisabled]}
          onPress={() => onCancel(booking)}
          disabled={paying || cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color={C.danger} size="small" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={16} color={C.danger} />
              <Text style={styles.cancelBtnText}>Cancel Request</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
});

type BookingListItemProps = {
  booking: Booking;
  paying: boolean;
  payingWithWallet: boolean;
  cancelling: boolean;
  walletBalance: number;
  onPayNow: (booking: Booking) => void;
  onPayWithWallet: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
};

const BookingListItem = memo(function BookingListItem({
  booking,
  paying,
  payingWithWallet,
  cancelling,
  walletBalance,
  onPayNow,
  onPayWithWallet,
  onCancel,
}: BookingListItemProps) {
  return (
    <BookingCard
      booking={booking}
      paying={paying}
      payingWithWallet={payingWithWallet}
      cancelling={cancelling}
      walletBalance={walletBalance}
      onPayNow={onPayNow}
      onPayWithWallet={onPayWithWallet}
      onCancel={onCancel}
    />
  );
});

function ListSeparator() {
  return <View style={styles.separator} />;
}

const keyExtractor = (item: Booking) => String(item.id);

export function CustomerBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const bookingsQuery = useMyBookingsQuery(Boolean(token));
  const walletQuery = useMyWalletQuery(Boolean(token));
  const retryPayment = useRetryBookingPaymentMutation();
  const payWithWallet = usePayBookingWithWalletMutation();
  const verifyPayment = useVerifyBookingPaymentMutation();
  const cancelBooking = useCancelBookingMutation();
  const bookings = (bookingsQuery.data?.data ?? []).filter((booking) =>
    isActiveBooking(booking.status),
  );
  const walletBalance = walletQuery.data?.data.balance ?? 0;
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);
  const [payingWithWalletBookingId, setPayingWithWalletBookingId] = useState<number | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);
  const [paymentSession, setPaymentSession] = useState<{
    bookingId: number;
    payment: BookingPaymentDetails;
    customer?: BookingCustomerPrefill;
    description: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void bookingsQuery.refetch();
        void walletQuery.refetch();
      }
    }, [token, bookingsQuery.refetch, walletQuery.refetch]),
  );

  const handlePayNow = useCallback(async (booking: Booking) => {
    setPayingBookingId(booking.id);
    try {
      const response = await retryPayment.mutateAsync(booking.id);
      if (!response.payment) {
        Alert.alert('Error', 'Payment details are not available for this booking.');
        return;
      }
      setPaymentSession({
        bookingId: booking.id,
        payment: response.payment,
        customer: response.customer,
        description: `${booking.serviceName} • 40% advance`,
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not start payment');
    } finally {
      setPayingBookingId(null);
    }
  }, [retryPayment]);

  const handlePayWithWallet = useCallback(
    (booking: Booking) => {
      Alert.alert(
        'Pay with Wallet',
        `Pay ${formatINR(booking.advanceAmount)} from your wallet balance of ${formatINR(walletBalance)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay Now',
            onPress: async () => {
              setPayingWithWalletBookingId(booking.id);
              try {
                const response = await payWithWallet.mutateAsync(booking.id);
                Alert.alert('Booking Confirmed', response.message);
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Could not pay from wallet');
              } finally {
                setPayingWithWalletBookingId(null);
              }
            },
          },
        ],
      );
    },
    [payWithWallet, walletBalance],
  );

  const handleCancel = useCallback((booking: Booking) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancellingBookingId(booking.id);
          try {
            const response = await cancelBooking.mutateAsync(booking.id);
            Alert.alert('Cancelled', response.message);
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Could not cancel booking');
          } finally {
            setCancellingBookingId(null);
          }
        },
      },
    ]);
  }, [cancelBooking]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Booking>) => (
      <BookingListItem
        booking={item}
        paying={payingBookingId === item.id}
        payingWithWallet={payingWithWalletBookingId === item.id}
        cancelling={cancellingBookingId === item.id}
        walletBalance={walletBalance}
        onPayNow={handlePayNow}
        onPayWithWallet={handlePayWithWallet}
        onCancel={handleCancel}
      />
    ),
    [
      payingBookingId,
      payingWithWalletBookingId,
      cancellingBookingId,
      walletBalance,
      handlePayNow,
      handlePayWithWallet,
      handleCancel,
    ],
  );

  const handleRefresh = useCallback(() => {
    void bookingsQuery.refetch();
  }, [bookingsQuery.refetch]);

  const handlePaymentSuccess = async (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    if (!paymentSession) return;

    try {
      await verifyPayment.mutateAsync({
        bookingId: paymentSession.bookingId,
        razorpayOrderId: payload.razorpayOrderId,
        razorpayPaymentId: payload.razorpayPaymentId,
        razorpaySignature: payload.razorpaySignature,
      });

      setPaymentSession(null);
      Alert.alert(
        'Booking Confirmed',
        '40% advance paid. Start OTP sent to your email — share it with pandit ji on arrival.',
      );
      void bookingsQuery.refetch();
    } catch (error) {
      setPaymentSession(null);
      Alert.alert(
        'Payment Verification Failed',
        error instanceof Error ? error.message : 'Could not verify payment',
      );
    }
  };

  const handlePaymentDismiss = () => {
    setPaymentSession(null);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Bookings</Text>
      <Text style={styles.subtitle}>Track your puja booking requests and status</Text>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>Loading your bookings...</Text>
        </View>
      ) : bookingsQuery.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.centerText}>Could not load bookings.</Text>
          <Pressable style={styles.retryBtn} onPress={() => bookingsQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
            bookings.length === 0 && styles.emptyList,
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
              <Ionicons name="calendar-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>
                Your booking requests will appear here once you book a pandit from the home screen.
              </Text>
            </View>
          }
        />
      )}

      <RazorpayCheckoutModal
        visible={Boolean(paymentSession)}
        payment={paymentSession?.payment ?? null}
        customer={paymentSession?.customer}
        description={paymentSession?.description ?? 'Booking advance payment'}
        onSuccess={handlePaymentSuccess}
        onDismiss={handlePaymentDismiss}
      />
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
    marginBottom: 12,
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
    marginTop: 4,
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
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },
  noteBox: {
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: C.border,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  tagPaid: {
    backgroundColor: '#DCFCE7',
  },
  tagPaidText: {
    color: '#15803D',
  },
  tagConfirmed: {
    backgroundColor: '#EFF6FF',
  },
  tagConfirmedText: {
    color: '#1D4ED8',
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
  },
  remainingText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  payBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  walletPayBtn: {
    marginTop: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: '#FFF7ED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  walletPayBtnDisabled: {
    opacity: 0.6,
  },
  walletPayBtnText: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelBtnText: {
    color: C.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  waitingBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  waitingText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#92400E',
    fontWeight: '600',
  },
  otpBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otpValue: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 6,
  },
  otpHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
    textAlign: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
});
