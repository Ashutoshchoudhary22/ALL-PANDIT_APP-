import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CloudImage } from '@/components/CloudImage';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { HomeColors as C } from '@/constants/home-theme';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

const FALLBACK_IMAGES = [DEMO_IMAGES.pandit1, DEMO_IMAGES.pandit2, DEMO_IMAGES.pandit3];

export function formatPanditLanguages(pandit: PublicPanditProfile) {
  if (pandit.languages.length > 0) return pandit.languages.join(', ');
  return pandit.languageCode || 'Hindi';
}

export function formatPanditLocation(pandit: PublicPanditProfile) {
  if (pandit.liveLatitude != null && pandit.liveLongitude != null) {
    return `Live: ${pandit.liveLatitude.toFixed(4)}, ${pandit.liveLongitude.toFixed(4)}`;
  }
  return pandit.cityName || 'Location not set';
}

type PanditProfileCardProps = {
  pandit: PublicPanditProfile;
  index?: number;
  variant?: 'carousel' | 'list';
  serviceName?: string;
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
  onPress,
  onBook,
}: PanditProfileCardProps) {
  const imageSource = pandit.profileImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const isList = variant === 'list';
  const servicePrice = getServicePrice(pandit, serviceName);

  const cardContent = (
    <>
      <View style={[styles.imageWrap, isList && styles.imageWrapList]}>
        <CloudImage
          source={imageSource}
          preset="panditCard"
          style={[styles.image, isList && styles.imageList]}
        />
        {pandit.isVerified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
        {!isList ? (
          <Pressable style={styles.favBtn}>
            <Ionicons name="heart-outline" size={18} color={C.danger} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.body, isList && styles.bodyList]}>
        <Text style={styles.name} numberOfLines={1}>
          {pandit.name}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={C.star} />
          <Text style={styles.ratingText}>
            {pandit.rating.toFixed(1)} ({pandit.totalReviews})
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={C.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {formatPanditLocation(pandit)}
          </Text>
        </View>
        <Text style={styles.langText} numberOfLines={1}>
          {formatPanditLanguages(pandit)}
        </Text>
        <Text style={styles.experienceText}>
          {servicePrice != null
            ? `₹${servicePrice.toLocaleString('en-IN')} for ${serviceName}`
            : pandit.experienceYears > 0
              ? `${pandit.experienceYears}+ yrs experience`
              : 'Available to book'}
        </Text>

        {isList && onBook ? (
          <Pressable style={styles.bookBtn} onPress={() => onBook(pandit)}>
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={styles.bookBtnText}>Book Now</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.card, isList && styles.cardList]}
        onPress={() => onPress(pandit)}
      >
        {cardContent}
      </Pressable>
    );
  }

  return <View style={[styles.card, isList && styles.cardList]}>{cardContent}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardList: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowOpacity: 0.04,
  },
  imageWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  imageWrapList: {
    marginBottom: 0,
    width: 96,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: C.border,
  },
  imageList: {
    width: 96,
    height: 112,
  },
  body: {
    flex: 1,
  },
  bodyList: {
    flex: 1,
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.success,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    color: C.textMuted,
  },
  langText: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 2,
  },
  experienceText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.success,
    marginTop: 6,
  },
  bookBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
