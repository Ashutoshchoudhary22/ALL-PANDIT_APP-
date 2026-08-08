import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloudImage } from '@/components/CloudImage';
import { LanguageSelectModal } from '@/components/LanguageSelectModal';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { AppLanguage, normalizeAppLanguage } from '@/constants/i18n';
import { Brand, DashboardColors as C } from '@/constants/dashboard-theme';
import { useMyPanditProfileQuery, useUpdatePanditProfileMutation } from '@/hooks/use-pandit-profile';
import { getPanditGalleryPhotos } from '@/lib/pandit-gallery';
import { formatPanditAppLanguage } from '@/lib/pandit-preferences';
import { useTabBackToHome } from '@/lib/tab-navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage, useTranslation } from '@/providers/LanguageProvider';
import { PanditProfile } from '@/services/pandit-profile.api';

function formatLocation(profile: PanditProfile) {
  if (profile.cityName) return profile.cityName;
  if (profile.liveLatitude != null && profile.liveLongitude != null) {
    return 'Live location active';
  }
  if (profile.latitude != null && profile.longitude != null) {
    return 'Location set';
  }
  return 'Location not set';
}

function StatCard({
  icon,
  value,
  label,
  iconColor,
  bgColor,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  iconColor: string;
  bgColor: string;
  accent: 'gold' | 'maroon' | 'saffron';
}) {
  return (
    <PremiumCard style={styles.statCardWrap} innerStyle={styles.statCardInner} accent={accent}>
      <LinearGradient colors={[bgColor, '#FFFFFF']} style={styles.statGradient}>
        <View style={[styles.statIconWrap, { borderColor: `${iconColor}44` }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </PremiumCard>
  );
}

function Tag({ label, hero }: { label: string; hero?: boolean }) {
  return (
    <View style={[styles.tag, hero && styles.heroTag]}>
      <Text style={[styles.tagText, hero && styles.heroTagText]}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onActionPress,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? (
        onActionPress ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text style={styles.sectionAction}>{action}</Text>
          </Pressable>
        ) : (
          <Text style={styles.sectionAction}>{action}</Text>
        )
      ) : null}
    </View>
  );
}

function NoProfileState() {
  return (
    <PremiumCard accent="gold" innerStyle={styles.emptyCardInner}>
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="person-circle-outline" size={48} color={C.maroon} />
        </View>
        <Text style={styles.emptyOm}>ॐ</Text>
        <Text style={styles.emptyTitle}>Profile Not Created</Text>
        <Text style={styles.emptySubtitle}>
          Create your pandit profile with personal details, documents and bank information to start
          receiving bookings on ApnaAcharya.
        </Text>
        <Pressable style={styles.createProfileBtnWrap} onPress={() => router.push('/create-profile')}>
          <LinearGradient
            colors={[C.maroon, C.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createProfileBtn}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createProfileBtnText}>Create Profile</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </PremiumCard>
  );
}

function LogoutButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.logoutBtn} onPress={onPress}>
      <Ionicons name="log-out-outline" size={20} color="#DC2626" />
      <Text style={styles.logoutBtnText}>Logout</Text>
    </Pressable>
  );
}

function PreferencesSection({
  updating,
  onSelectLanguage,
}: {
  updating: boolean;
  onSelectLanguage: () => void;
}) {
  const { t, language } = useTranslation();
  const languageLabel = formatPanditAppLanguage(language, language);

  return (
    <>
      <SectionHeader title={t('profile.section.preferences')} />
      <View style={styles.preferencesGrid}>
        <PremiumCard style={styles.preferenceCardWrap} accent="saffron" innerStyle={styles.preferenceCardInner}>
          <Pressable
            style={[styles.preferenceItem, updating && styles.preferenceItemDisabled]}
            onPress={onSelectLanguage}
            disabled={updating}
          >
            <View style={[styles.preferenceIconWrap, { backgroundColor: '#FFF0E0' }]}>
              <Ionicons name="language-outline" size={18} color={C.primary} />
            </View>
            <Text style={styles.preferenceLabel}>{t('profile.pref.language')}</Text>
            <Text style={styles.preferenceValue} numberOfLines={1}>
              {languageLabel}
            </Text>
          </Pressable>
        </PremiumCard>
      </View>
    </>
  );
}

function ProfileContent({
  profile,
  preferencesUpdating,
  onSelectLanguage,
}: {
  profile: PanditProfile;
  preferencesUpdating: boolean;
  onSelectLanguage: () => void;
}) {
  const imageSource = profile.profileImage || DEMO_IMAGES.pandit1;
  const photoSource =
    profile.updateRequestStatus === 'pending' && profile.pendingProfile
      ? profile.pendingProfile
      : profile;
  const galleryPhotos = getPanditGalleryPhotos(photoSource);
  const languages =
    profile.languages.length > 0 ? profile.languages : [profile.languageCode || 'Hindi'];

  return (
    <>
      <LinearGradient
        colors={[C.maroon, C.maroonLight, C.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View style={styles.photoFrame}>
            <View style={styles.photoWrap}>
              <CloudImage source={imageSource} preset="avatar" style={styles.photo} />
              {profile.isVerified ? (
                <View style={styles.verifiedTick}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroGreeting}>{Brand.greeting}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}</Text>
              {profile.isVerified ? (
                <Ionicons name="shield-checkmark" size={18} color={C.goldLight} />
              ) : null}
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color={C.gold} />
              <Text style={styles.ratingPillText}>{profile.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.experienceLine}>
              {profile.experienceYears > 0
                ? `${profile.experienceYears}+ Years of Experience`
                : 'Experience not added'}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,248,240,0.85)" />
              <Text style={styles.locationText}>{formatLocation(profile)}</Text>
            </View>
            <View style={styles.availabilityRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: profile.isAvailable ? C.success : C.textLight },
                ]}
              />
              <Text style={styles.availabilityText}>
                {profile.isAvailable ? 'Available for Booking' : 'Currently Unavailable'}
              </Text>
            </View>
            {profile.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={C.maroon} />
                <Text style={styles.verifiedText}>Verified Pandit</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.languageRow}>
          {languages.map((lang) => (
            <Tag key={lang} label={lang} hero />
          ))}
          {profile.isOnline ? <Tag label="Online Now" hero /> : null}
        </View>

        {profile.sameDayBooking ? (
          <View style={styles.sameDayBanner}>
            <Ionicons name="flash" size={16} color={C.primary} />
            <Text style={styles.sameDayText}>Same Day Booking Available</Text>
          </View>
        ) : null}
      </LinearGradient>

      {profile.updateRequestStatus === 'pending' ? (
        <View style={styles.updatePendingBanner}>
          <Ionicons name="hourglass-outline" size={18} color="#1D4ED8" />
          <Text style={styles.updatePendingBannerText}>
            Your profile changes are submitted for Super Admin approval. Customers will continue to
            see your current profile until approved.
          </Text>
        </View>
      ) : null}

      {profile.updateRequestStatus === 'rejected' ? (
        <View style={styles.rejectedBanner}>
          <Ionicons name="close-circle-outline" size={18} color={C.danger} />
          <Text style={styles.rejectedBannerText}>
            Your last profile update was rejected. Edit and submit again, or your current live profile
            stays unchanged.
          </Text>
        </View>
      ) : null}

      {profile.status === 'pending' ? (
        <View style={styles.pendingBanner}>
          <Ionicons name="time-outline" size={18} color="#D97706" />
          <Text style={styles.pendingBannerText}>
            Your profile is under review. A green verified tick will appear once Super Admin approves it.
          </Text>
        </View>
      ) : null}

      {profile.status === 'rejected' ? (
        <View style={styles.rejectedBanner}>
          <Ionicons name="close-circle-outline" size={18} color={C.danger} />
          <Text style={styles.rejectedBannerText}>
            Your profile was rejected. Please update your documents and contact support if needed.
          </Text>
        </View>
      ) : null}

      {profile.status === 'approved' && profile.isVerified ? (
        <View style={styles.approvedBanner}>
          <Ionicons name="checkmark-circle" size={18} color={C.success} />
          <Text style={styles.approvedBannerText}>
            Your profile is verified. Customers can now see you on their dashboard.
          </Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <StatCard
          icon="star"
          iconColor={C.gold}
          bgColor={C.orangeBg}
          accent="gold"
          value={`${profile.rating.toFixed(1)} (${profile.totalReviews})`}
          label="Rating"
        />
        <StatCard
          icon="calendar"
          iconColor={C.blue}
          bgColor="#EFF6FF"
          accent="saffron"
          value={String(profile.totalBookings)}
          label="Total Bookings"
        />
        <StatCard
          icon="time"
          iconColor={C.purple}
          bgColor={C.purpleBg}
          accent="maroon"
          value={profile.experienceYears > 0 ? `${profile.experienceYears}+ yrs` : '—'}
          label="Experience"
        />
        <StatCard
          icon="shield-checkmark"
          iconColor={C.success}
          bgColor={C.greenBg}
          accent="gold"
          value={profile.status}
          label="Profile Status"
        />
      </View>

      <SectionHeader title="About Pandit Ji" action="Edit →" onActionPress={() => router.push('/edit-profile')} />
      <PremiumCard accent="maroon" innerStyle={styles.aboutCardInner}>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            {profile.bio ||
              'Add your bio to tell devotees about your experience, rituals performed and spiritual guidance.'}
          </Text>
          <View style={styles.aboutGrid}>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutItemLabel}>Experience</Text>
              <Text style={styles.aboutItemValue}>
                {profile.experienceYears > 0 ? `${profile.experienceYears}+ Years` : '—'}
              </Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutItemLabel}>Performing Since</Text>
              <Text style={styles.aboutItemValue}>{profile.performingSince ?? '—'}</Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutItemLabel}>Pujas Performed</Text>
              <Text style={styles.aboutItemValue}>{profile.totalBookings}+</Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutItemLabel}>Verified</Text>
              <Text style={styles.aboutItemValue}>{profile.isVerified ? 'Yes' : 'Pending'}</Text>
            </View>
          </View>
        </View>
      </PremiumCard>

      <SectionHeader title="Languages Known" />
      <View style={styles.tagsRow}>
        {languages.map((lang) => (
          <Tag key={`lang-${lang}`} label={lang} />
        ))}
      </View>

      <PreferencesSection
        updating={preferencesUpdating}
        onSelectLanguage={onSelectLanguage}
      />

      <SectionHeader title="Profile Details" />
      <PremiumCard accent="gold" innerStyle={styles.detailsCardInner}>
        <View style={styles.detailsCard}>
          <DetailRow icon="call-outline" label="Mobile" value={profile.mobile} />
          <DetailRow icon="mail-outline" label="Email" value={profile.email || 'Not added'} />
          <DetailRow icon="person-outline" label="Gender" value={profile.gender} />
          <DetailRow
            icon="globe-outline"
            label="Online Status"
            value={profile.isOnline ? 'Online' : 'Offline'}
            isLast
          />
        </View>
      </PremiumCard>

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
      ) : (
        <>
          <SectionHeader title="Photos" />
          <PremiumCard accent="saffron" innerStyle={styles.galleryEmptyInner}>
          <View style={styles.galleryEmpty}>
            <Ionicons name="images-outline" size={28} color={C.textLight} />
            <Text style={styles.galleryEmptyText}>
              Add profile and gallery photos from Edit Profile.
            </Text>
          </View>
        </PremiumCard>
        </>
      )}

      <SectionHeader
        title="Reviews Summary"
        action="View All >"
        onActionPress={() => router.push('/reviews')}
      />
      <PremiumCard accent="gold" innerStyle={styles.reviewCardInner}>
        <View style={styles.reviewSummaryCard}>
          <Text style={styles.reviewBigRating}>{profile.rating.toFixed(1)}</Text>
          <View style={styles.reviewStars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= Math.round(profile.rating) ? 'star' : 'star-outline'}
                size={18}
                color={C.gold}
              />
            ))}
          </View>
          <Text style={styles.reviewCount}>{profile.totalReviews} Reviews</Text>
          <Text style={styles.reviewHint}>
            {profile.totalReviews > 0
              ? 'Tap View All to read customer feedback.'
              : 'Individual review list will appear here once devotees start booking your services.'}
          </Text>
        </View>
      </PremiumCard>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={16} color={C.maroon} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export function PanditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { token, user, isLoading: authLoading, signOut, signIn } = useAuth();
  useTabBackToHome();
  const profileQuery = useMyPanditProfileQuery(Boolean(token));
  const updateProfileMutation = useUpdatePanditProfileMutation();
  const profile = profileQuery.data?.data;
  const { refetch } = profileQuery;
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void refetch();
      }
    }, [token, refetch]),
  );

  const isNotFound =
    profileQuery.error instanceof Error &&
    (profileQuery.error.message.toLowerCase().includes('not found') ||
      profileQuery.error.message.includes('404'));

  const handleSelectLanguage = () => {
    if (!profile) return;
    setLanguageModalVisible(true);
  };

  const handleLanguageChange = (optionCode: AppLanguage) => {
    if (!profile) return;

    const nextLanguage = normalizeAppLanguage(optionCode);
    if (nextLanguage === language) {
      setLanguageModalVisible(false);
      return;
    }

    updateProfileMutation.mutate(
      { languageCode: optionCode },
      {
        onSuccess: async () => {
          await setLanguage(nextLanguage);
          if (token && user) {
            await signIn(token, { ...user, languageCode: optionCode });
          }
          setLanguageModalVisible(false);
        },
        onError: (error) => {
          Alert.alert(
            t('common.error'),
            error instanceof Error ? error.message : t('profile.language.errorFallback'),
          );
        },
      },
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[C.maroon, C.maroonLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <View>
          <Text style={styles.topOm}>ॐ</Text>
          <Text style={styles.topTitle}>My Profile</Text>
        </View>
        <View style={styles.topActions}>
          {profile ? (
            <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')} hitSlop={8}>
              <Ionicons name="create-outline" size={18} color={C.maroon} />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      {authLoading || profileQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : !token ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Please sign in to view your profile</Text>
        </View>
      ) : isNotFound ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            styles.emptyScroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          <NoProfileState />
          <LogoutButton onPress={handleLogout} />
        </ScrollView>
      ) : profileQuery.error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>{profileQuery.error.message}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => profileQuery.refetch()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : profile ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 110 },
          ]}
        >
          <ProfileContent
            profile={profile}
            preferencesUpdating={updateProfileMutation.isPending}
            onSelectLanguage={handleSelectLanguage}
          />
          <LogoutButton onPress={handleLogout} />
        </ScrollView>
      ) : null}

      <LanguageSelectModal
        visible={languageModalVisible}
        selectedCode={language}
        saving={updateProfileMutation.isPending}
        onClose={() => setLanguageModalVisible(false)}
        onSelect={handleLanguageChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topOm: { fontSize: 14, color: C.goldLight, marginBottom: 2 },
  topTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  stateText: { fontSize: 15, color: C.textMuted, textAlign: 'center' },
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },
  emptyCardInner: { padding: 0 },
  emptyState: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 24, gap: 8 },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  emptyOm: { fontSize: 22, color: C.gold, marginTop: 4 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.maroon, textAlign: 'center' },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: C.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  createProfileBtnWrap: { marginTop: 16, borderRadius: 14, overflow: 'hidden', width: '100%' },
  createProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createProfileBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTop: { flexDirection: 'row', gap: 16 },
  photoFrame: {
    padding: 3,
    borderRadius: 50,
    backgroundColor: C.gold,
  },
  photoWrap: { position: 'relative' },
  photo: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.border },
  verifiedTick: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.cream,
  },
  verifiedBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.cream,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  verifiedText: { color: C.maroon, fontSize: 10, fontWeight: '800' },
  heroInfo: { flex: 1, gap: 3, justifyContent: 'center' },
  heroGreeting: { fontSize: 12, color: C.goldLight, fontWeight: '600', letterSpacing: 0.5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', flexShrink: 1 },
  ratingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,130,0.35)',
  },
  ratingPillText: { color: C.goldLight, fontSize: 12, fontWeight: '800' },
  experienceLine: { marginTop: 4, fontSize: 12, color: 'rgba(255,248,240,0.85)', fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 12, color: 'rgba(255,248,240,0.85)', fontWeight: '500' },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  availabilityText: { fontSize: 12, color: C.goldLight, fontWeight: '700' },
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  sameDayBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,130,0.25)',
  },
  sameDayText: { color: C.goldLight, fontWeight: '700', fontSize: 13 },
  pendingBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingBannerText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#92400E', fontWeight: '500' },
  updatePendingBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  updatePendingBannerText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#1E3A8A', fontWeight: '500' },
  rejectedBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectedBannerText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#B91C1C', fontWeight: '500' },
  approvedBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  approvedBannerText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#166534', fontWeight: '600' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  statCardWrap: { width: '48%' },
  statCardInner: { padding: 0, overflow: 'hidden' },
  statGradient: { padding: 14, minHeight: 118 },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  statValue: { marginTop: 10, fontSize: 16, fontWeight: '800', color: C.maroon },
  statLabel: { marginTop: 2, fontSize: 11, color: C.textMuted, fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.maroon },
  sectionAction: { fontSize: 13, fontWeight: '700', color: C.primary },
  aboutCardInner: { padding: 0 },
  aboutCard: { padding: 16 },
  aboutText: { fontSize: 14, lineHeight: 22, color: C.textMuted },
  aboutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  aboutItem: {
    width: '48%',
    backgroundColor: C.creamDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  aboutItemLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  aboutItemValue: { marginTop: 4, fontSize: 15, fontWeight: '800', color: C.maroon },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: C.creamDark,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  tagText: { fontSize: 12, fontWeight: '700', color: C.maroon },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,215,130,0.3)',
  },
  heroTagText: { color: C.goldLight },
  detailsCardInner: { padding: 0 },
  detailsCard: { paddingVertical: 4 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 160, 23, 0.15)',
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  detailValue: { marginTop: 2, fontSize: 14, fontWeight: '700', color: C.text, textTransform: 'capitalize' },
  galleryCardInner: { padding: 12 },
  galleryRow: { gap: 10, paddingBottom: 4 },
  galleryImage: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: C.border,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  galleryEmptyInner: { padding: 0 },
  galleryEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  galleryEmptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19 },
  reviewCardInner: { padding: 0 },
  reviewSummaryCard: { padding: 20, alignItems: 'center' },
  reviewBigRating: { fontSize: 40, fontWeight: '800', color: C.maroon },
  reviewStars: { flexDirection: 'row', gap: 4, marginTop: 8 },
  reviewCount: { marginTop: 8, fontSize: 14, color: C.textMuted, fontWeight: '700' },
  reviewHint: {
    marginTop: 10,
    fontSize: 12,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  logoutBtn: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 15,
  },
  logoutBtnText: { color: C.danger, fontSize: 15, fontWeight: '800' },
  preferencesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  preferenceCardWrap: { width: '48%' },
  preferenceCardInner: { padding: 0 },
  preferenceItem: {
    padding: 14,
    alignItems: 'flex-start',
    gap: 2,
    minHeight: 96,
    justifyContent: 'flex-start',
  },
  preferenceItemDisabled: { opacity: 0.6 },
  preferenceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.2)',
  },
  preferenceLabel: { fontSize: 11, color: C.textMuted, marginTop: 6, fontWeight: '500' },
  preferenceValue: { fontSize: 13, fontWeight: '800', color: C.maroon },
});
