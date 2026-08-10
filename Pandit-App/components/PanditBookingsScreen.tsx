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

import { RazorpayCheckoutModal } from '@/components/RazorpayCheckoutModal';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Brand, DashboardColors as C } from '@/constants/dashboard-theme';
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
import { advancePercentLabel, remainingPercentLabel } from '@/lib/booking-pricing';
import { callCustomerPhone, canShowCustomerContact } from '@/lib/phone-call';
import { useTabBackToHome } from '@/lib/tab-navigation';
import { useAuth } from '@/providers/AuthProvider';
import {
  BookingCustomerPrefill,
  BookingPaymentDetails,
  PanditBooking,
} from '@/services/booking.api';

const STATUS_STYLES: Record<
  PanditBooking['status'],
  {
    label: string;
    bg: string;
    text: string;
    icon: keyof typeof Ionicons.glyphMap;
    accent: 'gold' | 'maroon' | 'saffron' | 'none';
  }
> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#B45309', icon: 'time-outline', accent: 'gold' },
  payment_pending: {
    label: 'Approved',
    bg: '#DBEAFE',
    text: '#1D4ED8',
    icon: 'checkmark-circle-outline',
    accent: 'saffron',
  },
  confirmed: {
    label: 'Confirmed',
    bg: '#DCFCE7',
    text: '#15803D',
    icon: 'checkmark-circle-outline',
    accent: 'saffron',
  },
  in_progress: {
    label: 'In Progress',
    bg: '#FEF3C7',
    text: '#B45309',
    icon: 'play-circle-outline',
    accent: 'gold',
  },
  awaiting_payment: {
    label: 'Collect Payment',
    bg: '#FFEDD5',
    text: '#C2410C',
    icon: 'cash-outline',
    accent: 'maroon',
  },
  cancelled: {
    label: 'Rejected',
    bg: '#FEE2E2',
    text: '#B91C1C',
    icon: 'close-circle-outline',
    accent: 'maroon',
  },
  completed: {
    label: 'Completed',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    icon: 'checkmark-done-outline',
    accent: 'none',
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

function MetaPill({
  icon,
  text,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={13} color={C.maroon} />
      <Text style={styles.metaPillText} numberOfLines={2}>
        {text}
      </Text>
      {trailing}
    </View>
  );
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
  const showCustomerContact = canShowCustomerContact(booking);
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
        <View style={styles.mainInfo}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <View style={styles.customerRow}>
            <Ionicons name="person-circle-outline" size={14} color={C.textMuted} />
            <Text style={styles.customerName}>{booking.customerName}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon} size={11} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      {booking.status === 'payment_pending' ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>Approved by you. Waiting for customer to pay {advancePercentLabel()} advance.</Text>
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

      <View style={styles.metaGrid}>
        <MetaPill icon="calendar-outline" text={formatBookingDate(booking.bookingDate)} />
        <MetaPill icon="time-outline" text={formatBookingTime(booking.bookingTime)} />
        {showCustomerContact ? (
          <MetaPill
            icon="call-outline"
            text={booking.customerMobile ?? ''}
            trailing={
              <Pressable
                style={styles.callBtn}
                onPress={() => void callCustomerPhone(booking.customerMobile ?? '', booking.customerName)}
                hitSlop={8}
              >
                <Ionicons name="call" size={18} color="#fff" />
              </Pressable>
            }
          />
        ) : null}
        <MetaPill
          icon="location-outline"
          text={booking.address}
          trailing={
            <Pressable
              style={[styles.mapBtn, isRejected && styles.mapBtnDisabled]}
              onPress={handleOpenMap}
              hitSlop={8}
              disabled={isRejected}
            >
              <Ionicons name="map-outline" size={18} color={C.primary} />
            </Pressable>
          }
        />
      </View>

      <View style={styles.footer}>
        {isPaid || booking.paymentStatus === 'fully_paid' ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {booking.paymentStatus === 'fully_paid'
                ? 'Fully paid'
                : `${advancePercentLabel()} paid • ${formatINR(booking.advanceAmount)}`}
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
          style={[styles.actionBtnWrap, busy && styles.actionBtnDisabled]}
          onPress={() => onStart(booking)}
          disabled={busy}
        >
          <LinearGradient
            colors={[C.maroon, C.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtn}
          >
            <Ionicons name="play-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Start Puja</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      {booking.status === 'in_progress' && !finishOtpSent ? (
        <Pressable
          style={[styles.actionBtnWrap, busy && styles.actionBtnDisabled]}
          onPress={() => onFinish(booking)}
          disabled={busy}
        >
          <LinearGradient
            colors={[C.success, '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtn}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Finish Puja</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      {booking.status === 'in_progress' && finishOtpSent ? (
        <Pressable
          style={[styles.actionBtnWrap, busy && styles.actionBtnDisabled]}
          onPress={() => onVerifyFinishOtp(booking)}
          disabled={busy}
        >
          <LinearGradient
            colors={[C.maroon, C.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtn}
          >
            <Ionicons name="key-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Enter Finish OTP</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      {booking.status === 'awaiting_payment' ? (
        <View style={styles.paymentRow}>
          <Pressable
            style={[styles.secondaryBtn, busy && styles.actionBtnDisabled]}
            onPress={() => onCollectCash(booking)}
            disabled={busy}
          >
            <Ionicons name="cash-outline" size={18} color={C.maroon} />
            <Text style={styles.secondaryBtnText}>Cash</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtnWrap, styles.onlineBtnWrap, busy && styles.actionBtnDisabled]}
            onPress={() => onCollectOnline(booking)}
            disabled={busy}
          >
            <LinearGradient
              colors={[C.maroon, C.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtn}
            >
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Online</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </PremiumCard>
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <PremiumCard accent="gold" innerStyle={styles.modalCardInner} style={styles.modalCardWrap}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalOm}>ॐ</Text>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalSubtitle}>{subtitle}</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={C.textLight}
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
                style={[styles.modalSubmitWrap, loading && styles.actionBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={[C.maroon, C.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSubmitBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Submit</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </PremiumCard>
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
  useTabBackToHome();
  const bookingsQuery = usePanditBookingsQuery(Boolean(token));
  const startPuja = useStartBookingPujaMutation();
  const requestFinish = useRequestFinishBookingPujaMutation();
  const verifyFinishOtp = useVerifyFinishBookingOtpMutation();
  const completeCash = useCompleteBookingCashMutation();
  const retryRemaining = useRetryRemainingPaymentMutation();
  const verifyRemaining = useVerifyRemainingPaymentMutation();

  const bookings = bookingsQuery.data?.data ?? [];
  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' || b.status === 'payment_pending').length,
    [bookings],
  );
  const inProgressCount = useMemo(
    () => bookings.filter((b) => b.status === 'in_progress').length,
    [bookings],
  );
  const awaitingPaymentCount = useMemo(
    () => bookings.filter((b) => b.status === 'awaiting_payment').length,
    [bookings],
  );
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
          description: `${booking.serviceName} • Remaining ${remainingPercentLabel()}`,
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
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>Manage pujas & collect payments</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="calendar" size={22} color={C.maroon} />
            <Text style={styles.headerBadgeCount}>{bookings.length}</Text>
            <Text style={styles.headerBadgeLabel}>Total</Text>
          </View>
        </View>
        <View style={styles.headerDividerWrap}>
          <LotusDivider color={C.goldLight} width={200} />
        </View>
      </LinearGradient>

      <View style={styles.summaryStrip}>
        <PremiumCard accent="saffron" innerStyle={styles.summaryCardInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={C.success} />
            </View>
            <View>
              <Text style={styles.summaryValue}>{confirmedCount}</Text>
              <Text style={styles.summaryLabel}>Confirmed</Text>
            </View>
          </View>
        </PremiumCard>
        <PremiumCard accent="gold" innerStyle={styles.summaryCardInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="play-circle-outline" size={18} color={C.primary} />
            </View>
            <View>
              <Text style={styles.summaryValue}>{inProgressCount}</Text>
              <Text style={styles.summaryLabel}>In Progress</Text>
            </View>
          </View>
        </PremiumCard>
        <PremiumCard accent="maroon" innerStyle={styles.summaryCardInner} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#FFF0E0' }]}>
              <Ionicons name="cash-outline" size={18} color={C.primary} />
            </View>
            <View>
              <Text style={styles.summaryValue}>{awaitingPaymentCount}</Text>
              <Text style={styles.summaryLabel}>Collect Pay</Text>
            </View>
          </View>
        </PremiumCard>
      </View>

      {bookingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... loading bookings</Text>
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
          style={styles.list}
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
                  <Ionicons name="clipboard-outline" size={36} color={C.maroon} />
                </View>
                <Text style={styles.emptyOm}>ॐ</Text>
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptySubtitle}>
                  Bookings will appear here after you approve customer requests.
                </Text>
              </View>
            </PremiumCard>
          }
        />
      )}

      <OtpModal
        visible={Boolean(otpModal)}
        title={otpModal?.mode === 'start' ? 'Enter Start OTP' : 'Enter Finish OTP'}
        subtitle={
          otpModal?.mode === 'start'
            ? `Ask the customer for the OTP sent to their email when they paid ${advancePercentLabel()}.`
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
  root: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
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
  summaryCard: { flex: 1 },
  summaryCardInner: { padding: 10 },
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
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 10 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  cardInner: { padding: 14 },
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
  mainInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '800', color: C.maroon },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  customerName: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: '38%',
  },
  statusText: { fontSize: 10, fontWeight: '800', flexShrink: 1 },
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
  metaGrid: { gap: 8 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
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
  mapBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
  },
  mapBtnDisabled: { opacity: 0.45 },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(21, 128, 61, 0.25)',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 160, 23, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF0E0',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.15)',
  },
  tagText: { fontSize: 10, fontWeight: '800', color: C.primary },
  tagAwaiting: { backgroundColor: '#DBEAFE', borderColor: 'rgba(29, 78, 216, 0.15)' },
  tagAwaitingText: { color: '#1D4ED8' },
  tagRejected: { backgroundColor: '#FEE2E2', borderColor: 'rgba(185, 28, 28, 0.15)' },
  tagRejectedText: { color: '#B91C1C' },
  totalPrice: { fontSize: 16, fontWeight: '800', color: C.primary },
  actionBtnWrap: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  onlineBtnWrap: { flex: 1 },
  actionBtn: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnDisabled: { opacity: 0.7 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  paymentRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    backgroundColor: C.cream,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: { color: C.maroon, fontSize: 14, fontWeight: '800' },
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
  errorCardInner: { padding: 24 },
  errorContent: { alignItems: 'center' },
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
  retryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  emptyCardInner: { padding: 32, marginTop: 40 },
  emptyWrap: { alignItems: 'center' },
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
  emptyTitle: { marginTop: 8, fontSize: 18, fontWeight: '800', color: C.maroon },
  emptySubtitle: { marginTop: 8, fontSize: 14, lineHeight: 21, color: C.textMuted, textAlign: 'center' },
  modalOverlay: {
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
  modalCard: { paddingHorizontal: 20, paddingTop: 12 },
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
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.maroon, textAlign: 'center' },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  otpInput: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderGold,
    paddingHorizontal: 16,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    color: C.maroon,
    backgroundColor: C.cream,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '800', color: C.textMuted },
  modalSubmitWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalSubmitBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
