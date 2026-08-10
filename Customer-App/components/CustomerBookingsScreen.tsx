import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, memo } from 'react';
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

import { RazorpayCheckoutModal } from '@/components/RazorpayCheckoutModal';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Brand, HomeColors as C } from '@/constants/home-theme';
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
import { formatINR, ADVANCE_RATE } from '@/lib/booking-pricing';
import { useProfileReturnBackHandler } from '@/lib/profile-navigation';
import { useMyWalletQuery } from '@/hooks/use-wallet';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from '@/providers/LanguageProvider';
import {
  Booking,
  BookingCustomerPrefill,
  BookingPaymentDetails,
} from '@/services/booking.api';

const STATUS_STYLES: Record<
  Booking['status'],
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap; accent: 'gold' | 'maroon' | 'saffron' | 'none' }
> = {
  payment_pending: { label: 'Payment Pending', bg: '#FEE2E2', text: '#B91C1C', icon: 'card-outline', accent: 'maroon' },
  pending: { label: 'Awaiting Approval', bg: '#FEF3C7', text: '#B45309', icon: 'time-outline', accent: 'gold' },
  confirmed: { label: 'Confirmed', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle-outline', accent: 'saffron' },
  in_progress: { label: 'In Progress', bg: '#FEF3C7', text: '#B45309', icon: 'play-circle-outline', accent: 'gold' },
  awaiting_payment: {
    label: 'Awaiting Payment',
    bg: '#FFEDD5',
    text: '#C2410C',
    icon: 'cash-outline',
    accent: 'saffron',
  },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle-outline', accent: 'none' },
  completed: { label: 'Completed', bg: '#EFF6FF', text: '#1D4ED8', icon: 'checkmark-done-outline', accent: 'none' },
};

function MetaPill({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={13} color={C.maroon} />
      <Text style={styles.metaPillText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

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
  const isPaidConfirmed =
    booking.status === 'confirmed' && booking.paymentStatus === 'advance_paid';
  const canCancel =
    booking.status === 'pending' ||
    booking.status === 'payment_pending' ||
    isPaidConfirmed;
  const canPayWithWallet = walletBalance >= booking.advanceAmount;

  return (
    <PremiumCard accent={statusStyle.accent} innerStyle={styles.cardInner}>
      <View style={styles.cardTop}>
        <View style={styles.serviceIconWrap}>
          <LinearGradient
            colors={['#FFF0E0', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.serviceIconGradient}
          >
            <Ionicons name="flame" size={20} color={C.primary} />
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
      </View>

      {booking.specialRequirements ? (
        <View style={styles.noteBox}>
          <View style={styles.noteHeader}>
            <Ionicons name="document-text-outline" size={14} color={C.maroon} />
            <Text style={styles.noteLabel}>Special Requirements</Text>
          </View>
          <Text style={styles.noteText}>{booking.specialRequirements}</Text>
        </View>
      ) : null}

      {booking.sessionOtp ? (
        <LinearGradient
          colors={[C.creamDark, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.otpBox}
        >
          <View style={styles.otpTopRow}>
            <Ionicons name="key-outline" size={16} color={C.primary} />
            <Text style={styles.otpLabel}>
              {booking.sessionOtpPurpose === 'finish' ? 'Finish Puja OTP' : 'Start Puja OTP'}
            </Text>
          </View>
          <Text style={styles.otpValue}>{booking.sessionOtp}</Text>
          <Text style={styles.otpHint}>
            {booking.sessionOtpHint ||
              'Share this OTP with pandit ji. Also sent to your email.'}
          </Text>
        </LinearGradient>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.tagsRow}>
          {booking.samagriRequired ? (
            <View style={styles.tag}>
              <Ionicons name="basket-outline" size={11} color={C.primary} />
              <Text style={styles.tagText}>Samagri included</Text>
            </View>
          ) : null}
          {booking.paymentStatus === 'advance_paid' ? (
            <View style={[styles.tag, styles.tagPaid]}>
              <Ionicons name="checkmark-circle" size={11} color="#15803D" />
              <Text style={[styles.tagText, styles.tagPaidText]}>{Math.round(ADVANCE_RATE * 100)}% paid</Text>
            </View>
          ) : null}
          {booking.status === 'confirmed' ? (
            <View style={[styles.tag, styles.tagConfirmed]}>
              <Ionicons name="shield-checkmark" size={11} color="#1D4ED8" />
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
            Waiting for pandit approval. You can pay {Math.round(ADVANCE_RATE * 100)}% after approval.
          </Text>
        </View>
      ) : null}

      {needsPayment ? (
        <>
          <Pressable
            style={[styles.payBtnWrap, (paying || payingWithWallet) && styles.btnDisabled]}
            onPress={() => onPayNow(booking)}
            disabled={paying || payingWithWallet || cancelling}
          >
            <LinearGradient
              colors={[C.maroon, C.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payBtn}
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
            </LinearGradient>
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
          style={[styles.cancelBtn, (paying || cancelling) && styles.btnDisabled]}
          onPress={() => onCancel(booking)}
          disabled={paying || cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color={C.danger} size="small" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={16} color={C.danger} />
              <Text style={styles.cancelBtnText}>
                {isPaidConfirmed ? 'Cancel Booking' : 'Cancel Request'}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </PremiumCard>
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

const BookingListItem = memo(function BookingListItem(props: BookingListItemProps) {
  return <BookingCard {...props} />;
});

function ListSeparator() {
  return <View style={styles.separator} />;
}

const keyExtractor = (item: Booking) => String(item.id);

export function CustomerBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  useProfileReturnBackHandler();
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
  const [cancelReasonBooking, setCancelReasonBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');
  const [paymentSession, setPaymentSession] = useState<{
    bookingId: number;
    payment: BookingPaymentDetails;
    customer?: BookingCustomerPrefill;
    description: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void walletQuery.refetch();
      }
    }, [token, walletQuery.refetch]),
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
        description: `${booking.serviceName} • ${Math.round(ADVANCE_RATE * 100)}% advance`,
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

  const submitCancellation = useCallback(
    async (booking: Booking, reason?: string) => {
      setCancellingBookingId(booking.id);
      try {
        const response = await cancelBooking.mutateAsync({
          bookingId: booking.id,
          reason,
        });
        setCancelReasonBooking(null);
        setCancelReason('');
        setCancelReasonError('');
        Alert.alert('Cancelled', response.message);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Could not cancel booking');
      } finally {
        setCancellingBookingId(null);
      }
    },
    [cancelBooking],
  );

  const handleCancel = useCallback(
    (booking: Booking) => {
      const isPaidConfirmed =
        booking.status === 'confirmed' && booking.paymentStatus === 'advance_paid';

      if (isPaidConfirmed) {
        setCancelReason('');
        setCancelReasonError('');
        setCancelReasonBooking(booking);
        return;
      }

      Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking request?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            void submitCancellation(booking);
          },
        },
      ]);
    },
    [submitCancellation],
  );

  const handleConfirmCancelWithReason = useCallback(() => {
    if (!cancelReasonBooking) return;

    const trimmedReason = cancelReason.trim();
    if (trimmedReason.length < 3) {
      setCancelReasonError('Please enter a reason (at least 3 characters).');
      return;
    }

    void submitCancellation(cancelReasonBooking, trimmedReason);
  }, [cancelReason, cancelReasonBooking, submitCancellation]);

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
        `${Math.round(ADVANCE_RATE * 100)}% advance paid. Start OTP sent to your email — share it with pandit ji on arrival.`,
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
            <Text style={styles.headerTitle}>{t('bookings.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('bookings.subtitle')}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="calendar" size={22} color={C.maroon} />
            <Text style={styles.headerBadgeCount}>{bookings.length}</Text>
            <Text style={styles.headerBadgeLabel}>{t('bookings.badge.active')}</Text>
          </View>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} />
        </View>
      </LinearGradient>

      <View style={styles.summaryStrip}>
        <PremiumCard accent="gold" innerStyle={styles.summaryCardInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#FFF0E0' }]}>
              <Ionicons name="flame-outline" size={18} color={C.primary} />
            </View>
            <View>
              <Text style={styles.summaryValue}>{bookings.length}</Text>
              <Text style={styles.summaryLabel}>Active Bookings</Text>
            </View>
          </View>
        </PremiumCard>
        <PremiumCard accent="maroon" innerStyle={styles.summaryCardInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet-outline" size={18} color={C.success} />
            </View>
            <View>
              <Text style={styles.summaryValue}>{formatINR(walletBalance)}</Text>
              <Text style={styles.summaryLabel}>Wallet Balance</Text>
            </View>
          </View>
        </PremiumCard>
      </View>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... loading your bookings</Text>
        </View>
      ) : bookingsQuery.isError ? (
        <View style={styles.centerState}>
          <PremiumCard accent="maroon" innerStyle={styles.errorCardInner}>
            <View style={styles.errorContent}>
              <View style={styles.errorIconWrap}>
                <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
              </View>
              <Text style={styles.errorTitle}>Could not load bookings</Text>
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
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="calendar-outline" size={36} color={C.maroon} />
                </View>
                <Text style={styles.emptyOm}>ॐ</Text>
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your booking requests will appear here once you book a pandit from the home screen.
                </Text>
              </View>
            </PremiumCard>
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

      <Modal
        visible={Boolean(cancelReasonBooking)}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          if (cancellingBookingId) return;
          setCancelReasonBooking(null);
          setCancelReason('');
          setCancelReasonError('');
        }}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalCard}>
            <Text style={styles.cancelModalTitle}>Cancel Booking</Text>
            <Text style={styles.cancelModalMessage}>
              Please tell us why you want to cancel. Your full advance amount will be refunded to
              your wallet. No cancellation fee will be charged.
            </Text>
            <TextInput
              style={styles.cancelReasonInput}
              placeholder="Enter cancellation reason"
              placeholderTextColor={C.textMuted}
              value={cancelReason}
              onChangeText={(text) => {
                setCancelReason(text);
                if (cancelReasonError) setCancelReasonError('');
              }}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            {cancelReasonError ? (
              <Text style={styles.cancelReasonError}>{cancelReasonError}</Text>
            ) : null}
            <View style={styles.cancelModalActions}>
              <Pressable
                style={styles.cancelModalSecondaryBtn}
                disabled={Boolean(cancellingBookingId)}
                onPress={() => {
                  setCancelReasonBooking(null);
                  setCancelReason('');
                  setCancelReasonError('');
                }}
              >
                <Text style={styles.cancelModalSecondaryText}>Back</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.cancelModalPrimaryBtn,
                  cancellingBookingId ? styles.btnDisabled : null,
                ]}
                disabled={Boolean(cancellingBookingId)}
                onPress={handleConfirmCancelWithReason}
              >
                {cancellingBookingId ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.cancelModalPrimaryText}>Cancel Booking</Text>
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
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  summaryCard: {
    flex: 1,
  },
  summaryCardInner: {
    padding: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: C.maroon,
  },
  summaryLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
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
    borderColor: 'rgba(255, 107, 0, 0.3)',
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
  noteBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.maroon,
    letterSpacing: 0.3,
  },
  noteText: {
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 160, 23, 0.2)',
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
  tagPaid: {
    backgroundColor: '#ECFDF5',
    borderColor: 'rgba(46, 125, 50, 0.15)',
  },
  tagPaidText: {
    color: '#15803D',
  },
  tagConfirmed: {
    backgroundColor: '#EFF6FF',
    borderColor: 'rgba(29, 78, 216, 0.15)',
  },
  tagConfirmedText: {
    color: '#1D4ED8',
  },
  priceWrap: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
  },
  remainingText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
  },
  payBtnWrap: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  payBtn: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  walletPayBtn: {
    marginTop: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    backgroundColor: C.cream,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  walletPayBtnDisabled: {
    opacity: 0.6,
  },
  walletPayBtnText: {
    color: C.maroon,
    fontSize: 13,
    fontWeight: '800',
  },
  cancelBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
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
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cancelModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  cancelModalMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
  cancelReasonInput: {
    marginTop: 16,
    minHeight: 96,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.creamDark,
  },
  cancelReasonError: {
    marginTop: 8,
    fontSize: 12,
    color: C.danger,
    fontWeight: '600',
  },
  cancelModalActions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalSecondaryText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  cancelModalPrimaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderGold,
    alignItems: 'center',
  },
  otpTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.maroon,
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
    fontWeight: '500',
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
});
