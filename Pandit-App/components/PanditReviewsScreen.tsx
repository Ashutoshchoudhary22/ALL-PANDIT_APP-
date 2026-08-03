import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloudImage } from '@/components/CloudImage';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useMyPanditProfileQuery } from '@/hooks/use-pandit-profile';
import { usePanditReviewsQuery } from '@/hooks/use-pandit-reviews';
import { useAuth } from '@/providers/AuthProvider';
import { PanditReview } from '@/services/review.api';

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
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

function ReviewCard({ review }: { review: PanditReview }) {
  const avatarSource = review.customerProfileImage || DEMO_IMAGES.customer;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <CloudImage source={avatarSource} preset="avatar" style={styles.customerAvatar} />
        <View style={styles.reviewHeaderText}>
          <Text style={styles.customerName}>{review.customerName}</Text>
          <Text style={styles.reviewMeta}>
            {review.serviceName} · {formatReviewDate(review.createdAt)}
          </Text>
        </View>
        <View style={styles.ratingWrap}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>

      <StarRow rating={review.rating} />

      {review.comment ? (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      ) : (
        <Text style={styles.reviewCommentMuted}>No written feedback provided.</Text>
      )}
    </View>
  );
}

function SummaryCard({ rating, totalReviews }: { rating: number; totalReviews: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryRating}>{rating.toFixed(1)}</Text>
      <StarRow rating={Math.round(rating)} size={18} />
      <Text style={styles.summaryCount}>
        {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
      </Text>
    </View>
  );
}

export function PanditReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const profileQuery = useMyPanditProfileQuery(Boolean(token));
  const reviewsQuery = usePanditReviewsQuery(Boolean(token));
  const reviews = reviewsQuery.data?.data ?? [];
  const profile = profileQuery.data?.data;

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void profileQuery.refetch();
        void reviewsQuery.refetch();
      }
    }, [token, profileQuery.refetch, reviewsQuery.refetch]),
  );

  const averageRating = profile?.rating ?? 0;
  const totalReviews = profile?.totalReviews ?? reviews.length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={styles.headerSpacer} />
      </View>

      {reviewsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ReviewCard review={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            reviews.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={reviewsQuery.isRefetching} onRefresh={() => reviewsQuery.refetch()} />
          }
          ListHeaderComponent={
            totalReviews > 0 ? (
              <SummaryCard rating={averageRating} totalReviews={totalReviews} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="star-outline" size={48} color={C.textLight} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySubtitle}>
                Customer ratings and feedback will appear here after completed pujas.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: C.text },
  headerSpacer: { width: 40 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  separator: { height: 12 },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryRating: { fontSize: 36, fontWeight: '800', color: C.text },
  summaryCount: { marginTop: 8, fontSize: 14, color: C.textMuted, fontWeight: '600' },
  reviewCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.border,
  },
  reviewHeaderText: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '700', color: C.text },
  reviewMeta: { marginTop: 2, fontSize: 12, color: C.textMuted },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: C.text },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 10 },
  reviewComment: { marginTop: 10, fontSize: 14, lineHeight: 21, color: C.text },
  reviewCommentMuted: { marginTop: 10, fontSize: 13, color: C.textMuted, fontStyle: 'italic' },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: C.text },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
});
