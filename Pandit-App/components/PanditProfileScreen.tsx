import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useMyPanditProfileQuery } from '@/hooks/use-pandit-profile';
import { useAuth } from '@/providers/AuthProvider';
import { PanditProfile } from '@/services/pandit-profile.api';

function formatLocation(profile: PanditProfile) {
  if (profile.latitude != null && profile.longitude != null) {
    return `${profile.latitude.toFixed(2)}, ${profile.longitude.toFixed(2)}`;
  }
  if (profile.cityId) return `City #${profile.cityId}`;
  return 'Location not set';
}

function StatCard({
  icon,
  value,
  label,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  iconColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

function NoProfileState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="person-circle-outline" size={72} color={C.primary} />
      </View>
      <Text style={styles.emptyTitle}>Profile Not Created</Text>
      <Text style={styles.emptySubtitle}>
        Create your pandit profile with personal details, documents and bank information to start
        receiving bookings on My-Pandit.
      </Text>
      <Pressable style={styles.createProfileBtn} onPress={() => router.push('/create-profile')}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.createProfileBtnText}>Create Profile</Text>
      </Pressable>
    </View>
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

function ProfileContent({ profile }: { profile: PanditProfile }) {
  const imageSource = profile.profileImage || DEMO_IMAGES.pandit1;
  const languages =
    profile.languages.length > 0 ? profile.languages : [profile.languageCode || 'Hindi'];

  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.photoWrap}>
            <CloudImage source={imageSource} preset="avatar" style={styles.photo} />
            {profile.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.verifiedText}>Verified Pandit</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}</Text>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.ratingPillText}>{profile.rating.toFixed(1)}</Text>
              </View>
            </View>
            <Text style={styles.experienceLine}>
              {profile.experienceYears > 0
                ? `${profile.experienceYears}+ Years of Experience`
                : 'Experience not added'}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={C.textMuted} />
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
          </View>
        </View>

        <View style={styles.languageRow}>
          {languages.map((lang) => (
            <Tag key={lang} label={lang} />
          ))}
          {profile.isOnline ? <Tag label="Online Now" /> : null}
        </View>

        {profile.sameDayBooking ? (
          <View style={styles.sameDayBanner}>
            <Ionicons name="flash" size={16} color={C.primary} />
            <Text style={styles.sameDayText}>Same Day Booking Available</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="star"
          iconColor={C.primary}
          value={`${profile.rating.toFixed(1)} (${profile.totalReviews})`}
          label="Rating"
        />
        <StatCard
          icon="calendar"
          iconColor={C.blue}
          value={String(profile.totalBookings)}
          label="Total Bookings"
        />
        <StatCard
          icon="time"
          iconColor={C.purple}
          value={profile.experienceYears > 0 ? `${profile.experienceYears}+ yrs` : '—'}
          label="Experience"
        />
        <StatCard
          icon="shield-checkmark"
          iconColor={C.success}
          value={profile.status}
          label="Profile Status"
        />
      </View>

      <SectionHeader title="About Pandit Ji" action=">" />
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

      <SectionHeader title="Languages Known" />
      <View style={styles.tagsRow}>
        {languages.map((lang) => (
          <Tag key={`lang-${lang}`} label={lang} />
        ))}
      </View>

      <SectionHeader title="Profile Details" />
      <View style={styles.detailsCard}>
        <DetailRow icon="call-outline" label="Mobile" value={profile.mobile} />
        <DetailRow icon="mail-outline" label="Email" value={profile.email || 'Not added'} />
        <DetailRow icon="person-outline" label="Gender" value={profile.gender} />
        <DetailRow
          icon="globe-outline"
          label="Online Status"
          value={profile.isOnline ? 'Online' : 'Offline'}
        />
      </View>

      <SectionHeader title="Photos" action="View All >" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
        {[imageSource, DEMO_IMAGES.banner, DEMO_IMAGES.pandit2].map((src, index) => (
          <CloudImage key={`${src}-${index}`} source={src} preset="service" style={styles.galleryImage} />
        ))}
      </ScrollView>

      <SectionHeader title="Reviews Summary" action="View All >" />
      <View style={styles.reviewSummaryCard}>
        <Text style={styles.reviewBigRating}>{profile.rating.toFixed(1)}</Text>
        <View style={styles.reviewStars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons
              key={i}
              name={i <= Math.round(profile.rating) ? 'star' : 'star-outline'}
              size={18}
              color="#FBBF24"
            />
          ))}
        </View>
        <Text style={styles.reviewCount}>{profile.totalReviews} Reviews</Text>
        <Text style={styles.reviewHint}>
          Individual review list will appear here once devotees start booking your services.
        </Text>
      </View>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={C.textMuted} />
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export function PanditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { token, isLoading: authLoading, signOut } = useAuth();
  const profileQuery = useMyPanditProfileQuery(Boolean(token));
  const profile = profileQuery.data?.data;
  const isNotFound =
    profileQuery.error instanceof Error &&
    (profileQuery.error.message.toLowerCase().includes('not found') ||
      profileQuery.error.message.includes('404'));

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
      <StatusBar style="dark" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topTitle}>Pandit Profile</Text>
        <View style={styles.topActions}>
          {profile ? (
            <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
              <Ionicons name="create-outline" size={16} color={C.primary} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>
          ) : null}
          <Ionicons name="share-social-outline" size={22} color={C.text} />
          <Ionicons name="heart-outline" size={22} color={C.text} />
        </View>
      </View>

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
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 110 },
            ]}
          >
            <ProfileContent profile={profile} />
            <LogoutButton onPress={handleLogout} />
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View>
              <Text style={styles.bottomPrice}>
                {profile.totalBookings > 0 ? `${profile.totalBookings} bookings` : 'New profile'}
              </Text>
              <Text style={styles.bottomSub}>Status: {profile.status}</Text>
            </View>
            <View style={styles.bottomActions}>
              <Pressable style={styles.chatBtn}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.primary} />
                <Text style={styles.chatBtnText}>Chat</Text>
              </Pressable>
              <Pressable style={styles.bookBtn}>
                <Ionicons name="calendar" size={18} color="#fff" />
                <Text style={styles.bookBtnText}>Book Now</Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF8' },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF8',
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.orangeBg,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: C.primary },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  stateText: { fontSize: 15, color: C.textMuted, textAlign: 'center' },
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  emptySubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: C.textMuted,
    textAlign: 'center',
  },
  createProfileBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createProfileBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  heroCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  heroTop: { flexDirection: 'row', gap: 14 },
  photoWrap: { position: 'relative' },
  photo: { width: 92, height: 92, borderRadius: 16, backgroundColor: C.border },
  verifiedBadge: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  heroInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 18, fontWeight: '800', color: C.text, flexShrink: 1 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  experienceLine: { marginTop: 6, fontSize: 13, color: C.textMuted, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  locationText: { fontSize: 12, color: C.textMuted },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  availabilityText: { fontSize: 12, color: C.success, fontWeight: '600' },
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  sameDayBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEDD5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sameDayText: { color: C.primary, fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { marginTop: 8, fontSize: 16, fontWeight: '800', color: C.text },
  statLabel: { marginTop: 4, fontSize: 11, color: C.textMuted },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  sectionAction: { fontSize: 13, fontWeight: '600', color: C.primary },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  aboutText: { fontSize: 14, lineHeight: 22, color: C.textMuted },
  aboutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  aboutItem: {
    width: '48%',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
  },
  aboutItemLabel: { fontSize: 11, color: C.textMuted },
  aboutItemValue: { marginTop: 4, fontSize: 15, fontWeight: '800', color: C.text },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  tagText: { fontSize: 12, fontWeight: '600', color: C.text },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 11, color: C.textMuted },
  detailValue: { marginTop: 2, fontSize: 14, fontWeight: '600', color: C.text, textTransform: 'capitalize' },
  galleryRow: { gap: 10, paddingBottom: 4 },
  galleryImage: { width: 120, height: 90, borderRadius: 12, backgroundColor: C.border },
  reviewSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewBigRating: { fontSize: 36, fontWeight: '800', color: C.text },
  reviewStars: { flexDirection: 'row', gap: 4, marginTop: 8 },
  reviewCount: { marginTop: 8, fontSize: 14, color: C.textMuted, fontWeight: '600' },
  reviewHint: {
    marginTop: 10,
    fontSize: 12,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPrice: { fontSize: 16, fontWeight: '800', color: C.text },
  bottomSub: { marginTop: 2, fontSize: 12, color: C.primary, fontWeight: '600' },
  bottomActions: { flexDirection: 'row', gap: 10 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatBtnText: { color: C.primary, fontWeight: '700' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bookBtnText: { color: '#fff', fontWeight: '700' },
  logoutBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 14,
  },
  logoutBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});
