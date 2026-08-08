import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/AdminScreenHeader';
import { LiveLocationIconButton } from '@/components/LiveLocationIconButton';
import { PanditProfileReviewModal } from '@/components/PanditProfileReviewModal';
import { AdminEmptyState } from '@/components/ui/AdminEmptyState';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import {
  usePanditProfilesQuery,
  useUpdatePanditProfileStatusMutation,
  useUpdatePanditProfileUpdateRequestMutation,
} from '@/hooks/use-admin-profiles';
import { PanditProfile } from '@/services/admin-profiles.api';

function statusStyle(status: string) {
  switch (status) {
    case 'approved':
      return { bg: '#DCFCE7', text: '#16A34A', label: 'Approved' };
    case 'rejected':
      return { bg: '#FEE2E2', text: '#DC2626', label: 'Rejected' };
    case 'pending':
    default:
      return { bg: '#FEF3C7', text: '#D97706', label: 'Pending' };
  }
}

function updateRequestStyle(status?: string) {
  if (status === 'pending') {
    return { bg: '#DBEAFE', text: '#1D4ED8', label: 'Update Pending' };
  }
  if (status === 'rejected') {
    return { bg: '#FEE2E2', text: '#DC2626', label: 'Update Rejected' };
  }
  return null;
}

type PanditProfileRowProps = {
  profile: PanditProfile;
  onView: (profileId: number) => void;
  onApprove: (profile: PanditProfile) => void;
  onReject: (profile: PanditProfile) => void;
  onApproveUpdate: (profile: PanditProfile) => void;
  onRejectUpdate: (profile: PanditProfile) => void;
  updating: boolean;
};

function PanditProfileRow({
  profile,
  onView,
  onApprove,
  onReject,
  onApproveUpdate,
  onRejectUpdate,
  updating,
}: PanditProfileRowProps) {
  const badge = statusStyle(profile.status);
  const updateBadge = updateRequestStyle(profile.updateRequestStatus);
  const isPendingInitial = profile.status === 'pending';
  const isUpdatePending = profile.updateRequestStatus === 'pending';

  return (
    <PremiumCard accent="purple" innerStyle={styles.rowInner}>
      <View style={styles.row}>
      <View style={styles.rowTop}>
        {profile.profileImage ? (
          <Image source={{ uri: profile.profileImage }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.meta}>
            {profile.cityName || 'City not set'} • {profile.experienceYears} yrs exp
          </Text>
        <Text style={styles.contact}>{profile.mobile}</Text>
      </View>

        <View style={styles.actions}>
          <LiveLocationIconButton
            userId={profile.userId}
            role="pandit"
            name={profile.name}
            latitude={profile.liveLatitude}
            longitude={profile.liveLongitude}
            updatedAt={profile.liveLocationAt}
            cityName={profile.cityName}
          />
          <Pressable style={styles.viewBtn} onPress={() => onView(profile.id)} hitSlop={8}>
            <Ionicons name="eye-outline" size={20} color={C.primary} />
          </Pressable>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
          {updateBadge ? (
            <View style={[styles.badge, { backgroundColor: updateBadge.bg }]}>
              <Text style={[styles.badgeText, { color: updateBadge.text }]}>{updateBadge.label}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {isPendingInitial ? (
        <View style={styles.decisionRow}>
          <Pressable
            style={[styles.approveChip, updating && styles.chipDisabled]}
            onPress={() => onApprove(profile)}
            disabled={updating}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.approveChipText}>Approve Profile</Text>
          </Pressable>
          <Pressable
            style={[styles.rejectChip, updating && styles.chipDisabled]}
            onPress={() => onReject(profile)}
            disabled={updating}
          >
            <Ionicons name="close" size={16} color={C.danger} />
            <Text style={styles.rejectChipText}>Reject</Text>
          </Pressable>
        </View>
      ) : null}

      {isUpdatePending ? (
        <View style={styles.decisionRow}>
          <Pressable
            style={[styles.approveChip, updating && styles.chipDisabled]}
            onPress={() => onApproveUpdate(profile)}
            disabled={updating}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.approveChipText}>Approve Update</Text>
          </Pressable>
          <Pressable
            style={[styles.rejectChip, updating && styles.chipDisabled]}
            onPress={() => onRejectUpdate(profile)}
            disabled={updating}
          >
            <Ionicons name="close" size={16} color={C.danger} />
            <Text style={styles.rejectChipText}>Reject Update</Text>
          </Pressable>
        </View>
      ) : null}
      </View>
    </PremiumCard>
  );
}

export function PanditProfilesScreen() {
  const insets = useSafeAreaInsets();
  const query = usePanditProfilesQuery();
  const statusMutation = useUpdatePanditProfileStatusMutation();
  const updateRequestMutation = useUpdatePanditProfileUpdateRequestMutation();
  const [reviewProfileId, setReviewProfileId] = useState<number | null>(null);
  const profiles = query.data?.data ?? [];
  const updating = statusMutation.isPending || updateRequestMutation.isPending;

  const confirmStatusUpdate = (profile: PanditProfile, status: 'approved' | 'rejected') => {
    const title = status === 'approved' ? 'Approve Profile' : 'Reject Profile';
    const message =
      status === 'approved'
        ? `Approve ${profile.name}'s pandit profile?`
        : `Reject ${profile.name}'s pandit profile?`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: status === 'approved' ? 'Approve' : 'Reject',
        style: status === 'approved' ? 'default' : 'destructive',
        onPress: () => {
          statusMutation.mutate(
            { profileId: profile.id, status },
            {
              onSuccess: (response) => Alert.alert('Success', response.message || 'Status updated'),
              onError: (error) =>
                Alert.alert('Error', error instanceof Error ? error.message : 'Update failed'),
            },
          );
        },
      },
    ]);
  };

  const confirmUpdateRequest = (profile: PanditProfile, action: 'approve' | 'reject') => {
    const title = action === 'approve' ? 'Approve Profile Update' : 'Reject Profile Update';
    const message =
      action === 'approve'
        ? `Publish ${profile.name}'s profile changes for all customers?`
        : `Reject ${profile.name}'s profile changes? Current live profile will stay unchanged.`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'approve' ? 'Approve' : 'Reject',
        style: action === 'approve' ? 'default' : 'destructive',
        onPress: () => {
          updateRequestMutation.mutate(
            { profileId: profile.id, action },
            {
              onSuccess: (response) => Alert.alert('Success', response.message || 'Update reviewed'),
              onError: (error) =>
                Alert.alert('Error', error instanceof Error ? error.message : 'Update failed'),
            },
          );
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader title="Pandit Profiles" subtitle="Review, approve or reject pandit profiles" />

      {query.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : query.isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.danger} />
          <Text style={styles.errorText}>Could not load pandit profiles.</Text>
          <Pressable style={styles.retryBtn} onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PanditProfileRow
              profile={item}
              onView={setReviewProfileId}
              onApprove={(profile) => confirmStatusUpdate(profile, 'approved')}
              onReject={(profile) => confirmStatusUpdate(profile, 'rejected')}
              onApproveUpdate={(profile) => confirmUpdateRequest(profile, 'approve')}
              onRejectUpdate={(profile) => confirmUpdateRequest(profile, 'reject')}
              updating={updating}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            profiles.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />}
          ListEmptyComponent={
            <AdminEmptyState
              icon="person-outline"
              title="No pandit profiles yet"
              subtitle="Pandit profiles will appear here once created."
            />
          }
        />
      )}

      <PanditProfileReviewModal
        profileId={reviewProfileId}
        visible={reviewProfileId != null}
        onClose={() => setReviewProfileId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.screenBg },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { marginTop: 12, fontSize: 15, color: C.textMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  emptyList: { flexGrow: 1 },
  rowInner: { padding: 0 },
  row: { padding: 14 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: C.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.purpleBg },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.primary },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: C.text },
  meta: { marginTop: 3, fontSize: 12, color: C.textMuted },
  contact: { marginTop: 2, fontSize: 12, color: C.textLight },
  actions: { alignItems: 'flex-end', gap: 8 },
  viewBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  decisionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approveChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.success,
  },
  rejectChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  approveChipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  rejectChipText: { color: C.danger, fontSize: 13, fontWeight: '700' },
  chipDisabled: { opacity: 0.6 },
  separator: { height: 12 },
});
