import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useState } from 'react';
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
import { DashboardColors as C } from '@/constants/dashboard-theme';
import {
  useCompleteBookingCashMutation,
  useRequestFinishBookingPujaMutation,
  useRetryRemainingPaymentMutation,
  useStartBookingPujaMutation,
  useVerifyFinishBookingOtpMutation,
  useVerifyRemainingPaymentMutation,
} from '@/hooks/use-pandit-booking-actions';
import { usePanditBookingsQuery } from '@/hooks/use-pandit-bookings';
import { promptBookingLocation } from '@/lib/open-map';
import { useAuth } from '@/providers/AuthProvider';
import {
  BookingCustomerPrefill,
  BookingPaymentDetails,
  PanditBooking,
} from '@/services/booking.api';

const STATUS_STYLES: Record<
  PanditBooking['status'],
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#B45309', icon: 'time-outline' },
  payment_pending: {
    label: 'Approved',
    bg: '#DBEAFE',
    text: '#1D4ED8',
    icon: 'checkmark-circle-outline',
  },
  confirmed: {
    label: 'Confirmed',
    bg: '#DCFCE7',
    text: '#15803D',
    icon: 'checkmark-circle-outline',
  },
  in_progress: {
    label: 'In Progress',
    bg: '#FEF3C7',
    text: '#B45309',
    icon: 'play-circle-outline',
  },
  awaiting_payment: {
    label: 'Collect Payment',
    bg: '#FFEDD5',
    text: '#C2410C',
    icon: 'cash-outline',
  },
  cancelled: {
    label: 'Rejected',
    bg: '#FEE2E2',
    text: '#B91C1C',
    icon: 'close-circle-outline',
  },
  completed: {
    label: 'Completed',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    icon: 'checkmark-done-outline',
  },
};

function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatBookingDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBookingTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

type BookingCardProps = {
  booking: PanditBooking;
  busy: boolean;
  onStart: (booking: PanditBooking) => void;
  onFinish: (booking: PanditBooking) => void;
  onVerifyFinishOtp: (booking: PanditBooking) => void;
  onCollectCash: (booking: PanditBooking) => void;
  onCollectOnline: (booking: PanditBooking) => void;
};

const BookingCard = memo(function BookingCard({
  booking,
  busy,
  onStart,
  onFinish,
  onVerifyFinishOtp,
  onCollectCash,
  onCollectOnline,
}: BookingCardProps) {
  const statusStyle = STATUS_STYLES[booking.status];
  const isPaid = booking.paymentStatus === 'advance_paid' || booking.status === 'confirmed';
  const isRejected = booking.status === 'cancelled';
  const finishOtpSent = Boolean(booking.finishRequestedAt);

  const handleOpenMap = () => {
    promptBookingLocation({
      latitude: booking.latitude,
      longitude: booking.longitude,
      address: booking.address,
      label: `${booking.customerName} • ${booking.serviceName}`,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.mainInfo}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <Text style={styles.customerName}>{booking.customerName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      {booking.status === 'payment_pending' ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>Approved by you. Waiting for customer to pay 40% advance.</Text>
        </View>
      ) : null}

      {booking.status === 'confirmed' ? (
        <View style={[styles.infoBox, styles.infoBoxStart]}>
          <Text style={[styles.infoBoxText, styles.infoBoxTextStart]}>
            Ask customer for Start OTP from their email, then tap Start Puja.
          </Text>
        </View>
      ) : null}

      {booking.status === 'in_progress' && !finishOtpSent ? (
        <View style={[styles.infoBox, styles.infoBoxStart]}>
          <Text style={[styles.infoBoxText, styles.infoBoxTextStart]}>
            Puja is running. Tap Finish Puja when done — customer will get OTP by email.
          </Text>
        </View>
      ) : null}

      {booking.status === 'in_progress' && finishOtpSent ? (
        <View style={[styles.infoBox, styles.infoBoxStart]}>
          <Text style={[styles.infoBoxText, styles.infoBoxTextStart]}>
            Finish OTP sent to customer. Ask them and enter it below.
          </Text>
        </View>
      ) : null}

      {booking.status === 'awaiting_payment' ? (
        <View style={[styles.infoBox, styles.infoBoxPayment]}>
          <Text style={[styles.infoBoxText, styles.infoBoxTextPayment]}>
            Collect remaining {formatINR(booking.remainingAmount)} via cash or online.
          </Text>
        </View>
      ) : null}

      {isRejected ? (
        <View style={[styles.infoBox, styles.infoBoxRejected]}>
          <Text style={[styles.infoBoxText, styles.infoBoxTextRejected]}>
            You rejected this booking request.
          </Text>
        </View>
      ) : null}

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
        <Pressable
          style={[styles.mapBtn, isRejected && styles.mapBtnDisabled]}
          onPress={handleOpenMap}
          hitSlop={8}
          disabled={isRejected}
        >
          <Ionicons name="map-outline" size={20} color={C.primary} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        {isPaid || booking.paymentStatus === 'fully_paid' ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {booking.paymentStatus === 'fully_paid'
                ? 'Fully paid'
                : `40% paid • ${formatINR(booking.advanceAmount)}`}
            </Text>
          </View>
        ) : isRejected ? (
          <View style={[styles.tag, styles.tagRejected]}>
            <Text style={[styles.tagText, styles.tagRejectedText]}>Not confirmed</Text>
          </View>
        ) : (
          <View style={[styles.tag, styles.tagAwaiting]}>
            <Text style={[styles.tagText, styles.tagAwaitingText]}>Awaiting payment</Text>
          </View>
        )}
        <Text style={styles.totalPrice}>{formatINR(booking.totalPrice)}</Text>
      </View>

      {booking.status === 'confirmed' ? (
        <Pressable
          style={[styles.actionBtn, busy && styles.actionBtnDisabled]}
          onPress={() => onStart(booking)}
          disabled={busy}
        >
          <Ionicons name="play-circle-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Start Puja</Text>
        </Pressable>
      ) : null}

      {booking.status === 'in_progress' && !finishOtpSent ? (
        <Pressable
          style={[styles.actionBtn, styles.finishBtn, busy && styles.actionBtnDisabled]}
          onPress={() => onFinish(booking)}
          disabled={busy}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Finish Puja</Text>
        </Pressable>
      ) : null}

      {booking.status === 'in_progress' && finishOtpSent ? (
        <Pressable
          style={[styles.actionBtn, styles.finishBtn, busy && styles.actionBtnDisabled]}
          onPress={() => onVerifyFinishOtp(booking)}
          disabled={busy}
        >
          <Ionicons name="key-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Enter Finish OTP</Text>
        </Pressable>
      ) : null}

      {booking.status === 'awaiting_payment' ? (
        <View style={styles.paymentRow}>
          <Pressable
            style={[styles.secondaryBtn, busy && styles.actionBtnDisabled]}
            onPress={() => onCollectCash(booking)}
            disabled={busy}
          >
            <Ionicons name="cash-outline" size={18} color={C.primary} />
            <Text style={styles.secondaryBtnText}>Cash</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.onlineBtn, busy && styles.actionBtnDisabled]}
            onPress={() => onCollectOnline(booking)}
            disabled={busy}
          >
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Online</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

function OtpModal({
  visible,
  title,
  subtitle,
  loading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');

  const handleClose = () => {
    setOtp('');
    onClose();
  };

  const handleSubmit = () => {
    if (otp.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP from customer.');
      return;
    }
    onSubmit(otp.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>{subtitle}</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            editable={!loading}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalSubmitBtn, loading && styles.actionBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>Submit</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const keyExtractor = (item: PanditBooking) => String(item.id);

export function PanditBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const bookingsQuery = usePanditBookingsQuery(Boolean(token));
  const startPuja = useStartBookingPujaMutation();
  const requestFinish = useRequestFinishBookingPujaMutation();
  const verifyFinishOtp = useVerifyFinishBookingOtpMutation();
  const completeCash = useCompleteBookingCashMutation();
  const retryRemaining = useRetryRemainingPaymentMutation();
  const verifyRemaining = useVerifyRemainingPaymentMutation();

  const bookings = bookingsQuery.data?.data ?? [];
  const [busyBookingId, setBusyBookingId] = useState<number | null>(null);
  const [otpModal, setOtpModal] = useState<{
    bookingId: number;
    mode: 'start' | 'finish';
  } | null>(null);
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
      }
    }, [token, bookingsQuery.refetch]),
  );

  const closeOtpModal = () => setOtpModal(null);

  const handleStart = useCallback((booking: PanditBooking) => {
    setOtpModal({ bookingId: booking.id, mode: 'start' });
  }, []);

  const handleFinish = useCallback(
    async (booking: PanditBooking) => {
      setBusyBookingId(booking.id);
      try {
        const response = await requestFinish.mutateAsync(booking.id);
        Alert.alert('OTP Sent', response.message);
        setOtpModal({ bookingId: booking.id, mode: 'finish' });
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Could not finish puja');
      } finally {
        setBusyBookingId(null);
      }
    },
    [requestFinish],
  );

  const handleVerifyFinishOtp = useCallback((booking: PanditBooking) => {
    setOtpModal({ bookingId: booking.id, mode: 'finish' });
  }, []);

  const handleOtpSubmit = async (otp: string) => {
    if (!otpModal) return;

    setBusyBookingId(otpModal.bookingId);
    try {
      if (otpModal.mode === 'start') {
        const response = await startPuja.mutateAsync({ bookingId: otpModal.bookingId, otp });
        Alert.alert('Started', response.message);
      } else {
        const response = await verifyFinishOtp.mutateAsync({
          bookingId: otpModal.bookingId,
          otp,
        });
        Alert.alert('Verified', response.message);
      }
      closeOtpModal();
      void bookingsQuery.refetch();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'OTP verification failed');
    } finally {
      setBusyBookingId(null);
    }
  };

  const handleCollectCash = useCallback(
    (booking: PanditBooking) => {
      Alert.alert(
        'Confirm Cash Payment',
        `Mark remaining ${formatINR(booking.remainingAmount)} as received in cash?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Completed',
            onPress: async () => {
              setBusyBookingId(booking.id);
              try {
                const response = await completeCash.mutateAsync(booking.id);
                Alert.alert('Completed', response.message);
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Could not complete booking');
              } finally {
                setBusyBookingId(null);
              }
            },
          },
        ],
      );
    },
    [completeCash],
  );

  const handleCollectOnline = useCallback(
    async (booking: PanditBooking) => {
      setBusyBookingId(booking.id);
      try {
        const response = await retryRemaining.mutateAsync(booking.id);
        if (!response.payment) {
          Alert.alert('Error', 'Payment details are not available.');
          return;
        }
        setPaymentSession({
          bookingId: booking.id,
          payment: response.payment,
          customer: response.customer,
          description: `${booking.serviceName} • Remaining 60%`,
        });
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Could not start payment');
      } finally {
        setBusyBookingId(null);
      }
    },
    [retryRemaining],
  );

  const handlePaymentSuccess = async (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    if (!paymentSession) return;

    try {
      await verifyRemaining.mutateAsync({
        bookingId: paymentSession.bookingId,
        razorpayOrderId: payload.razorpayOrderId,
        razorpayPaymentId: payload.razorpayPaymentId,
        razorpaySignature: payload.razorpaySignature,
      });
      setPaymentSession(null);
      Alert.alert('Completed', 'Remaining payment successful. Booking is completed.');
      void bookingsQuery.refetch();
    } catch (error) {
      setPaymentSession(null);
      Alert.alert(
        'Payment Failed',
        error instanceof Error ? error.message : 'Could not verify payment',
      );
    }
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PanditBooking>) => (
      <BookingCard
        booking={item}
        busy={busyBookingId === item.id}
        onStart={handleStart}
        onFinish={handleFinish}
        onVerifyFinishOtp={handleVerifyFinishOtp}
        onCollectCash={handleCollectCash}
        onCollectOnline={handleCollectOnline}
      />
    ),
    [
      busyBookingId,
      handleStart,
      handleFinish,
      handleVerifyFinishOtp,
      handleCollectCash,
      handleCollectOnline,
    ],
  );

  const handleRefresh = useCallback(() => {
    void bookingsQuery.refetch();
  }, [bookingsQuery.refetch]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Bookings</Text>
      <Text style={styles.subtitle}>Manage confirmed pujas and collect remaining payment</Text>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : bookingsQuery.isError ? (
        <View style={styles.centerState}>
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
              <Ionicons name="clipboard-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>
                Bookings will appear here after you approve customer requests.
              </Text>
            </View>
          }
        />
      )}

      <OtpModal
        visible={Boolean(otpModal)}
        title={otpModal?.mode === 'start' ? 'Enter Start OTP' : 'Enter Finish OTP'}
        subtitle={
          otpModal?.mode === 'start'
            ? 'Ask the customer for the OTP sent to their email when they paid 40%.'
            : 'Ask the customer for the OTP sent after puja completion.'
        }
        loading={Boolean(otpModal && busyBookingId === otpModal.bookingId)}
        onClose={closeOtpModal}
        onSubmit={handleOtpSubmit}
      />

      <RazorpayCheckoutModal
        visible={Boolean(paymentSession)}
        payment={paymentSession?.payment ?? null}
        customer={paymentSession?.customer}
        description={paymentSession?.description ?? 'Remaining payment'}
        onSuccess={handlePaymentSuccess}
        onDismiss={() => setPaymentSession(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  subtitle: { marginTop: 4, marginBottom: 16, fontSize: 13, color: C.textMuted },
  listContent: { paddingTop: 4 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  mainInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '800', color: C.text },
  customerName: { marginTop: 4, fontSize: 13, color: C.textMuted, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  infoBox: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBoxStart: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  infoBoxPayment: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  infoBoxRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  infoBoxText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  infoBoxTextStart: { color: '#92400E' },
  infoBoxTextPayment: { color: '#C2410C' },
  infoBoxTextRejected: { color: '#B91C1C' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metaText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 19 },
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  mapBtnDisabled: { opacity: 0.45 },
  footer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
  },
  tagText: { fontSize: 11, fontWeight: '700', color: C.primary },
  tagAwaiting: { backgroundColor: '#DBEAFE' },
  tagAwaitingText: { color: '#1D4ED8' },
  tagRejected: { backgroundColor: '#FEE2E2' },
  tagRejectedText: { color: '#B91C1C' },
  totalPrice: { fontSize: 16, fontWeight: '800', color: C.primary },
  actionBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  finishBtn: { backgroundColor: '#15803D' },
  onlineBtn: { flex: 1 },
  actionBtnDisabled: { opacity: 0.7 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  paymentRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
  },
  secondaryBtnText: { color: C.primary, fontSize: 14, fontWeight: '800' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 14, color: C.textMuted },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: C.text },
  emptySubtitle: { marginTop: 8, fontSize: 14, lineHeight: 21, color: C.textMuted, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  modalSubtitle: { marginTop: 8, fontSize: 14, lineHeight: 20, color: C.textMuted },
  otpInput: {
    marginTop: 16,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    color: C.text,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: C.textMuted },
  modalSubmitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
