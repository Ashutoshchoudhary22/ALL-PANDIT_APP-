import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CloudImage } from '@/components/CloudImage';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { HomeColors as C } from '@/constants/home-theme';
import { getDistanceKm, getPanditCoordinates } from '@/lib/pandit-filters';
import { useSavedPandits } from '@/providers/SavedPanditsProvider';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

const FALLBACK_IMAGES = [DEMO_IMAGES.pandit1, DEMO_IMAGES.pandit2, DEMO_IMAGES.pandit3];

export function formatPanditLanguages(pandit: PublicPanditProfile) {
  if (pandit.languages.length > 0) return pandit.languages.join(', ');
  return pandit.languageCode || 'Hindi';
}

type LocationOptions = {
  customerLatitude?: number | null;
  customerLongitude?: number | null;
};

function formatDistance(km: number) {
  if (km < 1) return `${Math.max(Math.round(km * 1000), 100)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function formatPanditLocation(pandit: PublicPanditProfile, options: LocationOptions = {}) {
  const city = pandit.cityName?.trim();
  const { customerLatitude, customerLongitude } = options;
  const hasCustomerLocation =
    customerLatitude != null &&
    customerLongitude != null &&
    Number.isFinite(customerLatitude) &&
    Number.isFinite(customerLongitude);

  let distanceLabel: string | null = null;
  if (hasCustomerLocation) {
    const coords = getPanditCoordinates(pandit);
    if (coords) {
      const km = getDistanceKm(
        customerLatitude,
        customerLongitude,
        coords.latitude,
        coords.longitude,
      );
      distanceLabel = formatDistance(km);
    }
  }

  if (city && distanceLabel) return `${city} · ${distanceLabel}`;
  if (city) return city;
  if (distanceLabel) return distanceLabel;
  if (getPanditCoordinates(pandit)) return 'Nearby you';
  return 'Location not set';
}

type PanditProfileCardProps = {
  pandit: PublicPanditProfile;
  index?: number;
  variant?: 'carousel' | 'list';
  serviceName?: string;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
  onPress?: (pandit: PublicPanditProfile) => void;
  onBook?: (pandit: PublicPanditProfile) => void;
};

function getServicePrice(pandit: PublicPanditProfile, serviceName?: string) {
  if (!serviceName) return null;
  const match = pandit.pujaServices?.find((service) => service.name === serviceName);
  return match?.price ?? null;
}

export function PanditProfileCard({
  pandit,
  index = 0,
  variant = 'carousel',
  serviceName,
  customerLatitude,
  customerLongitude,
  onPress,
  onBook,
}: PanditProfileCardProps) {
  const { isSaved, toggleSaved } = useSavedPandits();
  const saved = isSaved(pandit.id);
  const imageSource = pandit.profileImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const isList = variant === 'list';
  const servicePrice = getServicePrice(pandit, serviceName);
  const locationLabel = formatPanditLocation(pandit, { customerLatitude, customerLongitude });

  const handleToggleSaved = () => {
    void toggleSaved(pandit);
  };

  const cardContent = (
    <>
      <View style={[styles.imageWrap, isList && styles.imageWrapList]}>
        <View style={[styles.imageFrame, isList && styles.imageFrameList]}>
          <CloudImage
            source={imageSource}
            preset="panditCard"
            style={[styles.image, isList && styles.imageList]}
          />
          {pandit.isOnline ? (
            <View style={styles.onlineDotWrap}>
              <View style={styles.onlineDot} />
            </View>
          ) : null}
        </View>

        {pandit.isVerified ? (
          <LinearGradient
            colors={[C.maroon, C.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifiedBadge}
          >
            <Ionicons name="shield-checkmark" size={11} color="#fff" />
            <Text style={styles.verifiedText}>Verified</Text>
          </LinearGradient>
        ) : null}

        <Pressable style={styles.saveBtn} onPress={handleToggleSaved} hitSlop={8}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={saved ? C.maroon : C.textMuted}
          />
        </Pressable>
      </View>

      <View style={[styles.body, isList && styles.bodyList]}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {pandit.name}
          </Text>
          {pandit.isAvailable ? (
            <View style={styles.availablePill}>
              <Text style={styles.availableText}>Available</Text>
            </View>
          ) : (
            <View style={styles.busyPill}>
              <Text style={styles.busyText}>Busy</Text>
            </View>
          )}
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={13} color={C.gold} />
            <Text style={styles.ratingText}>{pandit.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.reviewCount}>({pandit.totalReviews} reviews)</Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons name="location" size={13} color={C.primary} />
          <Text style={styles.locationText} numberOfLines={isList ? 2 : 1}>
            {locationLabel}
          </Text>
        </View>

        <View style={styles.langPill}>
          <Ionicons name="language-outline" size={12} color={C.maroon} />
          <Text style={styles.langText} numberOfLines={1}>
            {formatPanditLanguages(pandit)}
          </Text>
        </View>

        <Text style={styles.experienceText}>
          {servicePrice != null
            ? `₹${servicePrice.toLocaleString('en-IN')} · ${serviceName}`
            : pandit.experienceYears > 0
              ? `${pandit.experienceYears}+ years experience`
              : 'Ready to book'}
        </Text>

        {isList && onBook ? (
          <Pressable
            style={styles.bookBtnWrap}
            onPress={() => onBook(pandit)}
            disabled={!pandit.isAvailable}
          >
            <LinearGradient
              colors={pandit.isAvailable ? [C.maroon, C.primary] : ['#9CA3AF', '#6B7280']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtn}
            >
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={styles.bookBtnText}>
                {pandit.isAvailable ? 'Book Now' : 'Currently Busy'}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>
    </>
  );

  const cardStyle = [styles.card, isList && styles.cardList];

  if (onPress) {
    return (
      <Pressable style={cardStyle} onPress={() => onPress(pandit)}>
        {isList ? (
          <LinearGradient
            colors={['#FFFFFF', C.cream]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {cardContent}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{cardContent}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardList: {
    width: '100%',
    flexDirection: 'row',
    padding: 14,
    gap: 14,
    borderRadius: 20,
    borderColor: 'rgba(212, 160, 23, 0.35)',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  imageWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  imageWrapList: {
    marginBottom: 0,
    width: 102,
  },
  imageFrame: {
    borderRadius: 14,
    padding: 2,
    backgroundColor: C.gold,
  },
  imageFrameList: {
    borderRadius: 16,
  },
  image: {
    width: '100%',
    height: 124,
    borderRadius: 12,
    backgroundColor: C.border,
  },
  imageList: {
    width: 98,
    height: 118,
    borderRadius: 14,
  },
  onlineDotWrap: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.success,
  },
  body: {
    flex: 1,
  },
  bodyList: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  saveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: C.maroon,
  },
  availablePill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  availableText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.success,
  },
  busyPill: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  busyText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.danger,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.creamDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  ratingText: {
    fontSize: 12,
    color: C.maroon,
    fontWeight: '800',
  },
  reviewCount: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 8,
    backgroundColor: C.cream,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  locationText: {
    flex: 1,
    fontSize: 11,
    color: C.text,
    fontWeight: '600',
    lineHeight: 15,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  langText: {
    flex: 1,
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  experienceText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.primary,
    marginTop: 8,
  },
  bookBtnWrap: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
