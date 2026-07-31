import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CloudImage } from '@/components/CloudImage';
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

type PanditBookingRequestCardProps = {
  booking: PanditBooking;
  approving?: boolean;
  rejecting?: boolean;
  onApprove: (booking: PanditBooking) => void;
  onReject: (booking: PanditBooking) => void;
};

export function PanditBookingRequestCard({
  booking,
  approving,
  rejecting,
  onApprove,
  onReject,
}: PanditBookingRequestCardProps) {
  const busy = approving || rejecting;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <CloudImage source={DEMO_IMAGES.customer} preset="avatar" style={styles.customerAvatar} />
        <View style={styles.bookingInfo}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={C.textMuted} />
            <Text style={styles.metaText} numberOfLines={2}>
              {booking.address}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
            <Text style={styles.metaText}>
              {formatBookingDate(booking.bookingDate)} • {formatBookingTime(booking.bookingTime)}
            </Text>
          </View>
        </View>
        <Text style={styles.price}>{formatINR(booking.totalPrice)}</Text>
      </View>

      {booking.specialRequirements ? (
        <Text style={styles.note} numberOfLines={2}>
          Note: {booking.specialRequirements}
        </Text>
      ) : null}

      <View style={styles.bookingActions}>
        <Pressable
          style={[styles.acceptBtn, busy && styles.btnDisabled]}
          onPress={() => onApprove(booking)}
          disabled={busy}
        >
          {approving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.acceptBtnText}>Accept</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.rejectBtn, busy && styles.btnDisabled]}
          onPress={() => onReject(booking)}
          disabled={busy}
        >
          {rejecting ? (
            <ActivityIndicator color={C.danger} size="small" />
          ) : (
            <Text style={styles.rejectBtnText}>Reject</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.border,
  },
  bookingInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '700', color: C.text },
  serviceName: { fontSize: 13, color: C.textMuted, marginTop: 2, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { flex: 1, fontSize: 12, color: C.textMuted },
  price: { fontSize: 16, fontWeight: '800', color: C.success },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },
  bookingActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  acceptBtn: {
    flex: 1,
    backgroundColor: C.success,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rejectBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.danger,
  },
  rejectBtnText: { color: C.danger, fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.7 },
});
