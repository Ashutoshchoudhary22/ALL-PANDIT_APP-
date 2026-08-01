import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeColors as C } from '@/constants/home-theme';
import { Booking } from '@/services/booking.api';

type ReviewPromptBannerProps = {
  booking: Booking;
  submitting?: boolean;
  onDismiss: () => void;
  onSubmit: (payload: { rating: number; comment: string }) => void;
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

export function ReviewPromptBanner({
  booking,
  submitting = false,
  onDismiss,
  onSubmit,
}: ReviewPromptBannerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const insets = useSafeAreaInsets();

  const openModal = () => {
    setRating(0);
    setComment('');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit({ rating, comment: comment.trim() });
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="star" size={18} color="#F59E0B" />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Rate your puja experience</Text>
            <Text style={styles.bannerMessage} numberOfLines={2}>
              How was {booking.serviceName} with {booking.panditName}?
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onDismiss} hitSlop={8}>
            <Ionicons name="close" size={18} color={C.textMuted} />
          </Pressable>
        </View>
        <Pressable style={styles.rateBtn} onPress={openModal}>
          <Text style={styles.rateBtnText}>Rate & Review</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Review</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={C.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              {booking.serviceName} • {booking.panditName}
            </Text>

            <Text style={styles.fieldLabel}>Your Rating</Text>
            <StarPicker value={rating} onChange={setRating} />

            <Text style={styles.fieldLabel}>Review (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Tell others about your experience..."
              placeholderTextColor={C.textLight}
              multiline
              value={comment}
              onChangeText={setComment}
              editable={!submitting}
            />

            <Pressable
              style={[styles.submitBtn, (rating < 1 || submitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={rating < 1 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  bannerMessage: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  rateBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: C.textMuted,
    fontWeight: '600',
  },
  fieldLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: C.textMuted,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  commentInput: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
