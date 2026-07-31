import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloudImage } from '@/components/CloudImage';
import {
  formatPanditLanguages,
  formatPanditLocation,
} from '@/components/PanditProfileCard';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { HomeColors as C } from '@/constants/home-theme';
import { usePublicPanditProfileQuery } from '@/hooks/use-public-pandit-profile';
import { openBookPandit } from '@/lib/pandit-navigation';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

type PanditDetailScreenProps = {
  profileId: number;
};

function formatPrice(price: number) {
  return `₹${price.toLocaleString('en-IN')}`;
}

function InfoChip({
  icon,
  label,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'default' | 'success' | 'primary';
}) {
  const toneStyle =
    tone === 'success' ? styles.chipSuccess : tone === 'primary' ? styles.chipPrimary : styles.chipDefault;

  return (
    <View style={[styles.chip, toneStyle]}>
      <Ionicons
        name={icon}
        size={14}
        color={tone === 'success' ? C.success : tone === 'primary' ? C.primary : C.textMuted}
      />
      <Text
        style={[
          styles.chipText,
          tone === 'success' && styles.chipTextSuccess,
          tone === 'primary' && styles.chipTextPrimary,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function DetailContent({ pandit }: { pandit: PublicPanditProfile }) {
  const insets = useSafeAreaInsets();
  const imageSource = pandit.profileImage || DEMO_IMAGES.pandit1;

  const handleBook = useCallback(() => {
    openBookPandit(pandit.id);
  }, [pandit.id]);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.heroCard}>
          <View style={styles.photoWrap}>
            <CloudImage source={imageSource} preset="avatar" style={styles.photo} />
            {pandit.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.verifiedText}>Verified Pandit</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.name}>{pandit.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={C.star} />
            <Text style={styles.ratingText}>
              {pandit.rating.toFixed(1)} ({pandit.totalReviews} reviews)
            </Text>
          </View>

          <View style={styles.chipsRow}>
            {pandit.isAvailable ? (
              <InfoChip icon="checkmark-circle-outline" label="Available" tone="success" />
            ) : null}
            {pandit.sameDayBooking ? (
              <InfoChip icon="flash-outline" label="Same-day booking" tone="primary" />
            ) : null}
            {pandit.isOnline ? (
              <InfoChip icon="radio-button-on" label="Online now" tone="success" />
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={C.primary} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{formatPanditLocation(pandit)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="language-outline" size={18} color={C.primary} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Languages</Text>
              <Text style={styles.infoValue}>{formatPanditLanguages(pandit)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={18} color={C.primary} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>
                {pandit.experienceYears > 0
                  ? `${pandit.experienceYears}+ years`
                  : 'Experienced pandit'}
              </Text>
            </View>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Ionicons name="calendar-outline" size={18} color={C.primary} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Pujas Performed</Text>
              <Text style={styles.infoValue}>{pandit.totalBookings}</Text>
            </View>
          </View>
        </View>

        {pandit.bio ? (
          <>
            <Text style={styles.sectionTitle}>Bio</Text>
            <View style={styles.sectionCard}>
              <Text style={styles.bioText}>{pandit.bio}</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Puja Services & Pricing</Text>
        <View style={styles.sectionCard}>
          {pandit.pujaServices?.length ? (
            pandit.pujaServices.map((service, index) => (
              <View
                key={service.name}
                style={[
                  styles.serviceRow,
                  index === pandit.pujaServices.length - 1 && styles.serviceRowLast,
                ]}
              >
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Pricing will be shared on request.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.bookBtn} onPress={handleBook}>
          <Ionicons name="calendar-outline" size={20} color="#fff" />
          <Text style={styles.bookBtnText}>Book Now</Text>
        </Pressable>
      </View>
    </>
  );
}

export function PanditDetailScreen({ profileId }: PanditDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const query = usePublicPanditProfileQuery(profileId);
  const pandit = query.data?.data;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Pandit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {query.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>Loading pandit details...</Text>
        </View>
      ) : query.isError || !pandit ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.centerText}>Could not load pandit profile.</Text>
          <Pressable style={styles.retryBtn} onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <DetailContent pandit={pandit} />
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
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { marginTop: 12, fontSize: 14, color: C.textMuted },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  content: { padding: 16 },
  heroCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  photoWrap: { position: 'relative' },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: C.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  name: { marginTop: 16, fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingText: { fontSize: 14, color: C.textMuted, fontWeight: '600' },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipDefault: { backgroundColor: C.background },
  chipSuccess: { backgroundColor: '#F0FDF4' },
  chipPrimary: { backgroundColor: '#FFF7ED' },
  chipText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  chipTextSuccess: { color: C.success },
  chipTextPrimary: { color: C.primary },
  sectionTitle: { marginTop: 20, marginBottom: 10, fontSize: 16, fontWeight: '800', color: C.text },
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: C.textLight, textTransform: 'uppercase' },
  infoValue: { marginTop: 4, fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20 },
  bioText: { fontSize: 14, lineHeight: 22, color: C.textMuted },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  serviceRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  serviceName: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  servicePrice: { fontSize: 14, fontWeight: '800', color: C.primary },
  emptyText: { fontSize: 14, color: C.textMuted },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  bookBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
