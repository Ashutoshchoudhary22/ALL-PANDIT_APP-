import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
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

import { AdminPanditReviewsModal } from '@/components/AdminPanditReviewsModal';
import { AdminScreenHeader } from '@/components/AdminScreenHeader';
import { AdminEmptyState } from '@/components/ui/AdminEmptyState';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import {
  usePanditReviewSummariesQuery,
  usePanditReviewsAdminQuery,
} from '@/hooks/use-admin-reviews';
import { AdminPanditReviewSummary } from '@/services/admin-reviews.api';

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
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

function PanditReviewCard({
  pandit,
  onPress,
}: {
  pandit: AdminPanditReviewSummary;
  onPress: (pandit: AdminPanditReviewSummary) => void;
}) {
  return (
    <Pressable onPress={() => onPress(pandit)}>
      <PremiumCard accent="gold" innerStyle={styles.cardInner}>
        <View style={styles.cardRow}>
          {pandit.profileImage ? (
            <Image source={{ uri: pandit.profileImage }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{pandit.name.charAt(0)}</Text>
            </View>
          )}

          <View style={styles.cardBody}>
            <Text style={styles.panditName}>{pandit.name}</Text>
            <Text style={styles.mobile}>{pandit.mobile}</Text>
            <View style={styles.ratingRow}>
              <StarRow rating={Math.round(pandit.rating)} />
              <Text style={styles.ratingValue}>{pandit.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.meta}>
              {pandit.reviewCount} review{pandit.reviewCount === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.viewWrap}>
            <View style={styles.viewRow}>
              <Text style={styles.viewText}>View</Text>
              <Ionicons name="chevron-forward" size={14} color={C.primary} />
            </View>
          </View>
        </View>

        {pandit.latestReview ? (
          <View style={styles.latestReviewWrap}>
            <Text style={styles.latestReviewLabel}>Latest Review</Text>
            <StarRow rating={pandit.latestReview.rating} size={11} />
            <Text style={styles.latestReviewComment} numberOfLines={2}>
              {pandit.latestReview.comment || 'No written feedback provided.'}
            </Text>
          </View>
        ) : (
          <Text style={styles.noReviewText}>No reviews yet</Text>
        )}
      </PremiumCard>
    </Pressable>
  );
}

export function PanditReviewsAdminScreen() {
  const insets = useSafeAreaInsets();
  const summariesQuery = usePanditReviewSummariesQuery();
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const reviewsQuery = usePanditReviewsAdminQuery(selectedProfileId);

  const pandits = summariesQuery.data?.data.pandits ?? [];
  const totalReviews = summariesQuery.data?.data.totalReviews ?? 0;
  const averageRating = summariesQuery.data?.data.averageRating ?? 0;
  const selectedPandit = useMemo(
    () => pandits.find((pandit) => pandit.profileId === selectedProfileId) ?? null,
    [selectedProfileId, pandits],
  );
  const reviewDetail = reviewsQuery.data?.data;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader
        title="Pandit Reviews"
        subtitle="Tap a pandit to view all customer reviews"
      />

      {summariesQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : summariesQuery.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.errorText}>Could not load pandit reviews.</Text>
          <Pressable style={styles.retryBtn} onPress={() => summariesQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={pandits}
          keyExtractor={(item) => String(item.profileId)}
          renderItem={({ item }) => (
            <PanditReviewCard pandit={item} onPress={(pandit) => setSelectedProfileId(pandit.profileId)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            pandits.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={summariesQuery.isRefetching}
              onRefresh={() => summariesQuery.refetch()}
              tintColor={C.primary}
            />
          }
          ListHeaderComponent={
            totalReviews > 0 ? (
              <PremiumCard accent="purple" innerStyle={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.summaryLabel}>Platform Reviews</Text>
                    <Text style={styles.summaryValue}>{totalReviews}</Text>
                    <View style={styles.summaryRatingRow}>
                      <StarRow rating={Math.round(averageRating)} size={14} />
                      <Text style={styles.summaryRatingText}>{averageRating.toFixed(1)} avg</Text>
                    </View>
                  </View>
                  <View style={styles.summaryBadge}>
                    <Ionicons name="star" size={22} color="#FBBF24" />
                  </View>
                </View>
                <Text style={styles.summaryMeta}>
                  {pandits.filter((pandit) => pandit.reviewCount > 0).length} pandits with reviews
                </Text>
              </PremiumCard>
            ) : null
          }
          ListEmptyComponent={
            <AdminEmptyState
              icon="star-outline"
              title="No pandit reviews yet"
              subtitle="Customer reviews will appear here after completed pujas."
            />
          }
        />
      )}

      <AdminPanditReviewsModal
        visible={selectedProfileId != null}
        panditName={reviewDetail?.name || selectedPandit?.name || 'Pandit'}
        mobile={reviewDetail?.mobile || selectedPandit?.mobile || ''}
        profileImage={reviewDetail?.profileImage || selectedPandit?.profileImage || null}
        rating={reviewDetail?.rating ?? selectedPandit?.rating ?? 0}
        totalReviews={reviewDetail?.totalReviews ?? selectedPandit?.reviewCount ?? 0}
        reviews={reviewDetail?.reviews ?? []}
        isLoading={reviewsQuery.isLoading}
        onDismiss={() => setSelectedProfileId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: C.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  summaryCard: {
    marginBottom: 14,
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: '900',
    color: C.primaryDark,
  },
  summaryRatingRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  summaryBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryMeta: {
    marginTop: 8,
    fontSize: 12,
    color: C.textLight,
  },
  cardInner: {
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
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
  cardBody: {
    flex: 1,
    gap: 2,
  },
  panditName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },
  mobile: {
    fontSize: 12,
    color: C.textMuted,
  },
  ratingRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '800',
    color: C.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    color: C.textLight,
  },
  viewWrap: {
    alignItems: 'flex-end',
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  latestReviewWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 160, 23, 0.15)',
    gap: 4,
  },
  latestReviewLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  latestReviewComment: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
  },
  noReviewText: {
    marginTop: 10,
    fontSize: 11,
    color: C.textLight,
    fontStyle: 'italic',
  },
});
