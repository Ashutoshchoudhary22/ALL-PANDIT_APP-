import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImageUploadField } from '@/components/ImageUploadField';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useMyPanditProfileQuery, useUpdatePanditProfileMutation } from '@/hooks/use-pandit-profile';
import { goToProfile } from '@/lib/auth-navigation';
import { uploadProfileImages } from '@/lib/upload-local-image';
import { useAuth } from '@/providers/AuthProvider';
import { PanditProfile } from '@/services/pandit-profile.api';

type Gender = 'male' | 'female' | 'other';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

function initFormFromProfile(profile: PanditProfile) {
  return {
    name: profile.name,
    gender: profile.gender,
    bio: profile.bio || '',
    experienceYears: String(profile.experienceYears),
    cityId: profile.cityId != null ? String(profile.cityId) : '',
    latitude: profile.latitude != null ? profile.latitude.toFixed(6) : '',
    longitude: profile.longitude != null ? profile.longitude.toFixed(6) : '',
    profilePhoto: profile.profileImage,
    aadhar: profile.aadharImage,
    panditCert: profile.panditCertificateImage,
    passbook: profile.passbookImage,
    bankAccountHolder: profile.bankAccountHolder || '',
    bankAccountNumber: profile.bankAccountNumber || '',
    bankIfsc: profile.bankIfsc || '',
    bankName: profile.bankName || '',
  };
}

export function EditPanditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { token, user, signIn } = useAuth();
  const profileQuery = useMyPanditProfileQuery(Boolean(token));
  const updateMutation = useUpdatePanditProfileMutation();

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [cityId, setCityId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [aadharUri, setAadharUri] = useState<string | null>(null);
  const [panditCertUri, setPanditCertUri] = useState<string | null>(null);
  const [passbookUri, setPassbookUri] = useState<string | null>(null);
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const profile = profileQuery.data?.data;
  const isBusy = submitting || updateMutation.isPending;

  useEffect(() => {
    if (!profile || initialized) return;
    const form = initFormFromProfile(profile);
    setName(form.name);
    setGender(form.gender);
    setBio(form.bio);
    setExperienceYears(form.experienceYears);
    setCityId(form.cityId);
    setLatitude(form.latitude);
    setLongitude(form.longitude);
    setProfilePhotoUri(form.profilePhoto);
    setAadharUri(form.aadhar);
    setPanditCertUri(form.panditCert);
    setPassbookUri(form.passbook);
    setBankAccountHolder(form.bankAccountHolder);
    setBankAccountNumber(form.bankAccountNumber);
    setBankIfsc(form.bankIfsc);
    setBankName(form.bankName);
    setInitialized(true);
  }, [profile, initialized]);

  const handleGetLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow location access.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
    } catch {
      Alert.alert('Location error', 'Could not get your current location.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;

    if (!name.trim() || !experienceYears.trim()) {
      Alert.alert('Required', 'Name and experience are required.');
      return;
    }

    setSubmitting(true);
    try {
      const { profileImage, aadharImage, panditCertificateImage, passbookImage } =
        await uploadProfileImages(token, {
          profilePhoto: profilePhotoUri,
          aadhar: aadharUri,
          panditCertificate: panditCertUri,
          passbook: passbookUri,
        });

      await updateMutation.mutateAsync({
        name: name.trim(),
        gender,
        bio: bio.trim() || undefined,
        experienceYears: Number(experienceYears),
        cityId: cityId ? Number(cityId) : undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        profileImage,
        aadharImage,
        panditCertificateImage,
        bankAccountHolder: bankAccountHolder.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
        bankName: bankName.trim() || undefined,
        passbookImage,
      });

      if (token && user && profileImage) {
        await signIn(token, { ...user, profileImage });
      }

      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => goToProfile() },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (profileQuery.isLoading || !initialized) {
    return (
      <View style={[styles.root, styles.centerState]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (profileQuery.error || !profile) {
    return (
      <View style={[styles.root, styles.centerState]}>
        <Text style={styles.errorText}>Could not load profile to edit.</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            <ImageUploadField
              label="Profile Photo"
              hint="Update your profile photo."
              value={profilePhotoUri}
              onChange={setProfilePhotoUri}
            />
            <Field label="Full Name *" placeholder="Full name" value={name} onChangeText={setName} />
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.genderChip, gender === option.value && styles.genderChipActive]}
                  onPress={() => setGender(option.value)}
                >
                  <Text style={[styles.genderChipText, gender === option.value && styles.genderChipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field label="Bio" placeholder="Bio" value={bio} onChangeText={setBio} multiline />
            <Field
              label="Experience (Years) *"
              placeholder="Years"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
            />
          </View>

          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <Field label="City ID" placeholder="City ID" value={cityId} onChangeText={setCityId} keyboardType="number-pad" />
            <Pressable
              style={[styles.locationBtn, fetchingLocation && styles.locationBtnDisabled]}
              onPress={handleGetLocation}
              disabled={fetchingLocation || isBusy}
            >
              {fetchingLocation ? (
                <ActivityIndicator color={C.primary} />
              ) : (
                <>
                  <Ionicons name="location" size={20} color={C.primary} />
                  <Text style={styles.locationBtnText}>Use Current Location</Text>
                </>
              )}
            </Pressable>
            {(latitude || longitude) && (
              <View style={styles.coordsRow}>
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>Latitude</Text>
                  <Text style={styles.coordValue}>{latitude || '—'}</Text>
                </View>
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>Longitude</Text>
                  <Text style={styles.coordValue}>{longitude || '—'}</Text>
                </View>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.card}>
            <ImageUploadField label="Aadhar Card" value={aadharUri} onChange={setAadharUri} />
            <ImageUploadField label="Pandit Certificate" value={panditCertUri} onChange={setPanditCertUri} />
          </View>

          <Text style={styles.sectionTitle}>Bank Details</Text>
          <View style={styles.card}>
            <Field label="Account Holder" value={bankAccountHolder} onChangeText={setBankAccountHolder} placeholder="Name" />
            <Field label="Account Number" value={bankAccountNumber} onChangeText={setBankAccountNumber} placeholder="Account number" keyboardType="number-pad" />
            <Field label="IFSC" value={bankIfsc} onChangeText={setBankIfsc} placeholder="IFSC" autoCapitalize="characters" />
            <Field label="Bank Name" value={bankName} onChangeText={setBankName} placeholder="Bank name" />
            <ImageUploadField label="Passbook Photo" value={passbookUri} onChange={setPassbookUri} />
          </View>

          <Pressable style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={isBusy}>
            {isBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={C.textLight}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF8' },
  flex: { flex: 1 },
  centerState: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, color: C.textMuted, textAlign: 'center' },
  backLink: { marginTop: 16 },
  backLinkText: { color: C.primary, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFDF8',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: C.text },
  headerSpacer: { width: 36 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { marginTop: 20, marginBottom: 10, fontSize: 16, fontWeight: '800', color: C.text },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  fieldWrap: { marginTop: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
  },
  genderChipActive: { backgroundColor: C.orangeBg, borderColor: C.primary },
  genderChipText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  genderChipTextActive: { color: C.primary },
  locationBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: C.orangeBg,
    borderRadius: 12,
    paddingVertical: 14,
  },
  locationBtnDisabled: { opacity: 0.7 },
  locationBtnText: { color: C.primary, fontSize: 15, fontWeight: '700' },
  coordsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  coordBox: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
  },
  coordLabel: { fontSize: 11, fontWeight: '600', color: C.textMuted },
  coordValue: { marginTop: 6, fontSize: 14, fontWeight: '700', color: C.text },
  submitBtn: {
    marginTop: 24,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
