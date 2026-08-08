import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CloudImage } from '@/components/CloudImage';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { PanditBooking } from '@/services/booking.api';

function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatBookingDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
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

type PanditBookingRequestCardProps = {
  booking: PanditBooking;
  approving?: boolean;
  rejecting?: boolean;
  onApprove: (booking: PanditBooking) => void;
  onReject: (booking: PanditBooking) => void;
};

export const PanditBookingRequestCard = memo(function PanditBookingRequestCard({
  booking,
  approving,
  rejecting,
  onApprove,
  onReject,
}: PanditBookingRequestCardProps) {
  const busy = approving || rejecting;
  const avatarSource = booking.customerProfileImage || DEMO_IMAGES.customer;

  return (
    <PremiumCard accent="gold" innerStyle={styles.cardInner}>
      <View style={styles.cardTop}>
        <View style={styles.avatarFrame}>
          <CloudImage source={avatarSource} preset="avatar" style={styles.customerAvatar} />
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <View style={styles.serviceRow}>
            <Ionicons name="flame-outline" size={14} color={C.primary} />
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
          </View>
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.price}>{formatINR(booking.totalPrice)}</Text>
          <Text style={styles.priceLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <MetaPill icon="location-outline" text={booking.address} />
        <MetaPill
          icon="calendar-outline"
          text={`${formatBookingDate(booking.bookingDate)} • ${formatBookingTime(booking.bookingTime)}`}
        />
      </View>

      {booking.specialRequirements ? (
        <View style={styles.noteBox}>
          <View style={styles.noteHeader}>
            <Ionicons name="document-text-outline" size={14} color={C.maroon} />
            <Text style={styles.noteLabel}>Special Requirements</Text>
          </View>
          <Text style={styles.note} numberOfLines={3}>
            {booking.specialRequirements}
          </Text>
        </View>
      ) : null}

      <View style={styles.bookingActions}>
        <Pressable
          style={[styles.acceptBtnWrap, busy && styles.btnDisabled]}
          onPress={() => onApprove(booking)}
          disabled={busy}
        >
          <LinearGradient
            colors={[C.success, '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptBtn}
          >
            {approving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.acceptBtnText}>Accept</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <Pressable
          style={[styles.rejectBtn, busy && styles.btnDisabled]}
          onPress={() => onReject(booking)}
          disabled={busy}
        >
          {rejecting ? (
            <ActivityIndicator color={C.danger} size="small" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={16} color={C.danger} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </>
          )}
        </Pressable>
      </View>
    </PremiumCard>
  );
});

const styles = StyleSheet.create({
  cardInner: {
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarFrame: {
    padding: 2,
    borderRadius: 26,
    backgroundColor: C.gold,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.4)',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.border,
    borderWidth: 2,
    borderColor: C.cream,
  },
  bookingInfo: {
    flex: 1,
    gap: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.maroon,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  serviceName: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: C.success,
  },
  priceLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
    marginTop: 1,
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
    fontSize: 12,
    color: C.text,
    lineHeight: 17,
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
  },
  note: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  acceptBtnWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    color: C.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
