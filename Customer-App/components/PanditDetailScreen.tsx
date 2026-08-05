import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { Brand, HomeColors as C } from '@/constants/home-theme';
import { usePublicPanditProfileQuery } from '@/hooks/use-public-pandit-profile';
import { getPanditGalleryPhotos } from '@/lib/pandit-gallery';
import { openBookPandit } from '@/lib/pandit-navigation';
import { useSavedPandits } from '@/providers/SavedPanditsProvider';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

type PanditDetailScreenProps = {
  profileId: number;
};

function formatPrice(price: number) {
  return `₹${price.toLocaleString('en-IN')}`;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
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
  const galleryPhotos = getPanditGalleryPhotos(pandit);

  const handleBook = useCallback(() => {
    openBookPandit(pandit.id);
  }, [pandit.id]);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <LinearGradient
          colors={[C.maroon, C.maroonLight, C.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.photoFrame}>
            <CloudImage source={imageSource} preset="avatar" style={styles.photo} />
            {pandit.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={C.maroon} />
                <Text style={styles.verifiedText}>Verified Pandit</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.heroGreeting}>{Brand.greeting}</Text>
          <Text style={styles.name}>{pandit.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={C.gold} />
            <Text style={styles.ratingText}>
              {pandit.rating.toFixed(1)} ({pandit.totalReviews} reviews)
            </Text>
          </View>

          <View style={styles.chipsRow}>
            {pandit.isAvailable ? (
              <InfoChip icon="checkmark-circle-outline" label="Available" tone="success" />
            ) : (
              <InfoChip icon="time-outline" label="Busy with puja" tone="primary" />
            )}
            {pandit.sameDayBooking ? (
              <InfoChip icon="flash-outline" label="Same-day booking" tone="primary" />
            ) : null}
            {pandit.isOnline ? (
              <InfoChip icon="radio-button-on" label="Online now" tone="success" />
            ) : null}
          </View>
        </LinearGradient>

        <SectionHeader title="About" />
        <PremiumCard accent="maroon" innerStyle={styles.sectionCardInner}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="location-outline" size={16} color={C.maroon} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{formatPanditLocation(pandit)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="language-outline" size={16} color={C.maroon} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Languages</Text>
              <Text style={styles.infoValue}>{formatPanditLanguages(pandit)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="briefcase-outline" size={16} color={C.maroon} />
            </View>
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
            <View style={styles.infoIconWrap}>
              <Ionicons name="calendar-outline" size={16} color={C.maroon} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Pujas Performed</Text>
              <Text style={styles.infoValue}>{pandit.totalBookings}</Text>
            </View>
          </View>
        </PremiumCard>

        {pandit.bio ? (
          <>
            <SectionHeader title="Bio" />
            <PremiumCard accent="gold" innerStyle={styles.bioCardInner}>
              <Text style={styles.bioText}>{pandit.bio}</Text>
            </PremiumCard>
          </>
        ) : null}

        {galleryPhotos.length > 0 ? (
          <>
            <SectionHeader title="Photos" />
            <PremiumCard accent="saffron" innerStyle={styles.galleryCardInner}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryRow}
              >
                {galleryPhotos.map((src, index) => (
                  <CloudImage
                    key={`${src}-${index}`}
                    source={src}
                    preset="service"
                    style={styles.galleryImage}
                  />
                ))}
              </ScrollView>
            </PremiumCard>
          </>
        ) : null}

        <SectionHeader title="Puja Services & Pricing" />
        <PremiumCard accent="saffron" innerStyle={styles.sectionCardInner}>
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
        </PremiumCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[styles.bookBtnWrap, !pandit.isAvailable && styles.bookBtnDisabledWrap]}
          onPress={handleBook}
          disabled={!pandit.isAvailable}
        >
          <LinearGradient
            colors={pandit.isAvailable ? [C.maroon, C.primary] : [C.textMuted, C.textMuted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtn}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.bookBtnText}>
              {pandit.isAvailable ? 'Book Now' : 'Currently Unavailable'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
}

export function PanditDetailScreen({ profileId }: PanditDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const query = usePublicPanditProfileQuery(profileId);
  const pandit = query.data?.data;
  const { isSaved, toggleSaved } = useSavedPandits();
  const saved = pandit ? isSaved(pandit.id) : false;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={C.maroon} />
        </Pressable>
        <Text style={styles.topTitle}>Pandit Profile</Text>
        {pandit ? (
          <Pressable
            style={styles.saveHeaderBtn}
            onPress={() => void toggleSaved(pandit)}
            hitSlop={8}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? C.primary : C.maroon}
            />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </LinearGradient>

      {query.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>{Brand.greeting}... loading profile</Text>
        </View>
      ) : query.isError || !pandit ? (
        <View style={styles.centerState}>
          <PremiumCard accent="maroon" innerStyle={styles.errorCardInner}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
              <Text style={styles.errorTitle}>Could not load pandit profile</Text>
              <Pressable style={styles.retryBtnWrap} onPress={() => query.refetch()}>
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
        <DetailContent pandit={pandit} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  saveHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  headerSpacer: { width: 38 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  centerText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  errorCardInner: { padding: 24 },
  errorContent: { alignItems: 'center', gap: 12 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: C.maroon, textAlign: 'center' },
  retryBtnWrap: { borderRadius: 12, overflow: 'hidden' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: '800' },
  content: { padding: 16 },
  heroCard: {
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  photoFrame: {
    padding: 3,
    borderRadius: 58,
    backgroundColor: C.gold,
    position: 'relative',
  },
  photo: { width: 110, height: 110, borderRadius: 55, backgroundColor: C.border },
  verifiedBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.cream,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  verifiedText: { color: C.maroon, fontSize: 10, fontWeight: '800' },
  heroGreeting: {
    marginTop: 16,
    fontSize: 12,
    color: C.goldLight,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: { marginTop: 4, fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ratingText: { fontSize: 14, color: 'rgba(255,248,240,0.9)', fontWeight: '700' },
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
  chipDefault: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,130,0.25)' },
  chipSuccess: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(134,239,172,0.35)' },
  chipPrimary: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,130,0.3)' },
  chipText: { fontSize: 12, fontWeight: '700', color: C.goldLight },
  chipTextSuccess: { color: '#BBF7D0' },
  chipTextPrimary: { color: C.goldLight },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: C.primary },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.maroon },
  sectionCardInner: { padding: 14 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 160, 23, 0.15)',
  },
  infoRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: C.textLight, textTransform: 'uppercase' },
  infoValue: { marginTop: 4, fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 20 },
  bioCardInner: { padding: 16 },
  bioText: { fontSize: 14, lineHeight: 22, color: C.textMuted },
  galleryCardInner: { padding: 12 },
  galleryRow: { gap: 10, paddingBottom: 4 },
  galleryImage: {
    width: 140,
    height: 105,
    borderRadius: 12,
    backgroundColor: C.border,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 160, 23, 0.15)',
  },
  serviceRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  serviceName: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  servicePrice: { fontSize: 14, fontWeight: '800', color: C.primary },
  emptyText: { fontSize: 14, color: C.textMuted },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.cream,
    borderTopWidth: 1,
    borderTopColor: C.borderGold,
  },
  bookBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  bookBtnDisabledWrap: { opacity: 0.85 },
  bookBtn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
