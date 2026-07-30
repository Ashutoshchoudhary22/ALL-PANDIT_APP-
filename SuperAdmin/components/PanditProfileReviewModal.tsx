import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import {
  usePanditProfileQuery,
  useUpdatePanditProfileStatusMutation,
} from '@/hooks/use-admin-profiles';
import { PanditProfile } from '@/services/admin-profiles.api';

type PanditProfileReviewModalProps = {
  profileId: number | null;
  visible: boolean;
  onClose: () => void;
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value?.trim() || '—'}</Text>
    </View>
  );
}

function DocumentCard({
  label,
  uri,
  onPress,
}: {
  label: string;
  uri: string | null;
  onPress: (uri: string, label: string) => void;
}) {
  return (
    <View style={styles.docCard}>
      <Text style={styles.docLabel}>{label}</Text>
      {uri ? (
        <Pressable onPress={() => onPress(uri, label)}>
          <Image source={{ uri }} style={styles.docImage} contentFit="cover" />
          <View style={styles.docOverlay}>
            <Ionicons name="expand-outline" size={18} color="#fff" />
            <Text style={styles.docOverlayText}>Tap to view full</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.docMissing}>
          <Ionicons name="document-outline" size={28} color={C.textLight} />
          <Text style={styles.docMissingText}>Not uploaded</Text>
        </View>
      )}
    </View>
  );
}

function ReviewContent({
  profile,
  onClose,
}: {
  profile: PanditProfile;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const statusMutation = useUpdatePanditProfileStatusMutation();
  const [preview, setPreview] = useState<{ uri: string; label: string } | null>(null);

  const isPending = profile.status === 'pending';
  const isBusy = statusMutation.isPending;

  const handleStatusUpdate = (status: 'approved' | 'rejected') => {
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
              onSuccess: (response) => {
                Alert.alert('Success', response.message || 'Status updated');
                onClose();
              },
              onError: (error) => {
                Alert.alert('Error', error instanceof Error ? error.message : 'Update failed');
              },
            },
          );
        },
      },
    ]);
  };

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.profileHeader}>
          {profile.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.profileHeaderText}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.subMeta}>
              {profile.gender} • {profile.experienceYears} yrs experience
            </Text>
            <Text style={styles.subMeta}>{profile.cityName || 'City not set'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.sectionCard}>
          <InfoRow label="Mobile" value={profile.mobile} />
          <InfoRow label="Email" value={profile.email} />
        </View>

        {profile.bio ? (
          <>
            <Text style={styles.sectionTitle}>Bio</Text>
            <View style={styles.sectionCard}>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Bank Details</Text>
        <View style={styles.sectionCard}>
          <InfoRow label="Account Holder" value={profile.bankAccountHolder} />
          <InfoRow label="Account Number" value={profile.bankAccountNumber} />
          <InfoRow label="IFSC" value={profile.bankIfsc} />
          <InfoRow label="Bank Name" value={profile.bankName} />
        </View>

        <Text style={styles.sectionTitle}>Documents</Text>
        <Text style={styles.sectionHint}>Review all uploaded documents before approve/reject.</Text>

        <DocumentCard
          label="Profile Photo"
          uri={profile.profileImage}
          onPress={(uri, label) => setPreview({ uri, label })}
        />
        <DocumentCard
          label="Aadhar Card"
          uri={profile.aadharImage}
          onPress={(uri, label) => setPreview({ uri, label })}
        />
        <DocumentCard
          label="Pandit Certificate"
          uri={profile.panditCertificateImage}
          onPress={(uri, label) => setPreview({ uri, label })}
        />
        <DocumentCard
          label="Passbook / Cancelled Cheque"
          uri={profile.passbookImage}
          onPress={(uri, label) => setPreview({ uri, label })}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {isPending || profile.status === 'rejected' ? (
          <Pressable
            style={[styles.approveBtn, isBusy && styles.btnDisabled]}
            onPress={() => handleStatusUpdate('approved')}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.approveText}>Approve</Text>
              </>
            )}
          </Pressable>
        ) : null}

        {isPending || profile.status === 'approved' ? (
          <Pressable
            style={[styles.rejectBtn, isBusy && styles.btnDisabled]}
            onPress={() => handleStatusUpdate('rejected')}
            disabled={isBusy}
          >
            <Ionicons name="close-circle" size={20} color={C.danger} />
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={preview != null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.previewRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreview(null)} />
          <View style={[styles.previewCard, { marginTop: insets.top + 20, marginBottom: insets.bottom + 20 }]}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{preview?.label}</Text>
              <Pressable onPress={() => setPreview(null)} hitSlop={12}>
                <Ionicons name="close" size={24} color={C.text} />
              </Pressable>
            </View>
            {preview ? (
              <Image source={{ uri: preview.uri }} style={styles.previewImage} contentFit="contain" />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

export function PanditProfileReviewModal({ profileId, visible, onClose }: PanditProfileReviewModalProps) {
  const insets = useSafeAreaInsets();
  const query = usePanditProfileQuery(visible ? profileId : null);
  const profile = query.data?.data;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Review Pandit Profile</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={C.text} />
          </Pressable>
        </View>

        {query.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : query.isError || !profile ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>Could not load profile details.</Text>
            <Pressable style={styles.retryBtn} onPress={() => query.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <ReviewContent profile={profile} onClose={onClose} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  closeBtn: { padding: 4 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, color: C.textMuted },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  content: { padding: 16 },
  profileHeader: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.purpleBg },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.primary },
  profileHeaderText: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: C.text },
  subMeta: { marginTop: 4, fontSize: 13, color: C.textMuted },
  sectionTitle: { marginTop: 18, marginBottom: 8, fontSize: 15, fontWeight: '800', color: C.text },
  sectionHint: { marginBottom: 10, fontSize: 12, color: C.textMuted, lineHeight: 18 },
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoRow: { marginBottom: 10 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: C.textLight, textTransform: 'uppercase' },
  infoValue: { marginTop: 4, fontSize: 14, fontWeight: '600', color: C.text },
  bioText: { fontSize: 14, lineHeight: 21, color: C.textMuted },
  docCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  docLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 10 },
  docImage: { width: '100%', height: 180, borderRadius: 12, backgroundColor: C.border },
  docOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  docOverlayText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  docMissing: {
    height: 120,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  docMissingText: { fontSize: 12, color: C.textLight },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  approveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: C.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  approveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  rejectText: { color: C.danger, fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.7 },
  previewRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  previewTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  previewImage: { flex: 1, width: '100%' },
});
