import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { AdminPanditReview } from '@/services/admin-reviews.api';

type AdminPanditReviewsModalProps = {
  visible: boolean;
  panditName: string;
  mobile: string;
  profileImage: string | null;
  rating: number;
  totalReviews: number;
  reviews: AdminPanditReview[];
  isLoading: boolean;
  onDismiss: () => void;
};

function formatReviewDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color="#FBBF24"
        />
      ))}
    </View>
  );
}

function ReviewRow({ item }: { item: AdminPanditReview }) {
  return (
    <PremiumCard accent="none" innerStyle={styles.reviewInner}>
      <View style={styles.reviewHeader}>
        {item.customerProfileImage ? (
          <Image source={{ uri: item.customerProfileImage }} style={styles.customerAvatar} contentFit="cover" />
        ) : (
          <View style={[styles.customerAvatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{item.customerName.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.reviewHeaderText}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.reviewMeta}>
            {item.serviceName} · {formatReviewDate(item.createdAt)}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>

      <StarRow rating={item.rating} />

      {item.comment ? (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      ) : (
        <Text style={styles.reviewCommentMuted}>No written feedback provided.</Text>
      )}
    </PremiumCard>
  );
}

export function AdminPanditReviewsModal({
  visible,
  panditName,
  mobile,
  profileImage,
  rating,
  totalReviews,
  reviews,
  isLoading,
  onDismiss,
}: AdminPanditReviewsModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.panditAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.panditAvatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{panditName.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>{panditName}</Text>
              <Text style={styles.subtitle}>{mobile}</Text>
            </View>
          </View>
          <Pressable onPress={onDismiss} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={C.text} />
          </Pressable>
        </View>

        <PremiumCard accent="gold" innerStyle={styles.summaryCard}>
          <Text style={styles.summaryRating}>{rating.toFixed(1)}</Text>
          <StarRow rating={Math.round(rating)} size={18} />
          <Text style={styles.summaryCount}>
            {totalReviews} review{totalReviews === 1 ? '' : 's'}
          </Text>
        </PremiumCard>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <Text style={styles.loaderText}>Loading reviews...</Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ReviewRow item={item} />}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 24 },
              reviews.length === 0 && styles.emptyList,
            ]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <PremiumCard accent="purple" innerStyle={styles.emptyCard}>
                <Ionicons name="star-outline" size={36} color={C.textLight} />
                <Text style={styles.emptyTitle}>No reviews yet</Text>
                <Text style={styles.emptySubtitle}>
                  Customer ratings will appear here after completed pujas.
                </Text>
              </PremiumCard>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
  },
  panditAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
  },
  avatarFallback: {
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: C.textMuted,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    alignItems: 'center',
  },
  summaryRating: {
    fontSize: 32,
    fontWeight: '900',
    color: C.primaryDark,
  },
  summaryCount: {
    marginTop: 8,
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 14,
    color: C.textMuted,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  reviewInner: {
    padding: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  reviewHeaderText: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  reviewMeta: {
    marginTop: 2,
    fontSize: 11,
    color: C.textMuted,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
  },
  reviewComment: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: C.text,
  },
  reviewCommentMuted: {
    marginTop: 10,
    fontSize: 12,
    color: C.textMuted,
    fontStyle: 'italic',
  },
  separator: {
    height: 10,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  emptySubtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
});
