import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import { useCreatePanditProfileMutation } from '@/hooks/use-pandit-profile';
import { goToProfile } from '@/lib/auth-navigation';
import { uploadProfileImages } from '@/lib/upload-local-image';
import { useAuth } from '@/providers/AuthProvider';

type Gender = 'male' | 'female' | 'other';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export function CreatePanditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { token, user, signIn } = useAuth();
  const createMutation = useCreatePanditProfileMutation();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [cityId, setCityId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [profilePhotoLocalUri, setProfilePhotoLocalUri] = useState<string | null>(null);
  const [aadharLocalUri, setAadharLocalUri] = useState<string | null>(null);
  const [panditCertLocalUri, setPanditCertLocalUri] = useState<string | null>(null);
  const [passbookLocalUri, setPassbookLocalUri] = useState<string | null>(null);
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const isBusy = submitting || createMutation.isPending;

  const handleGetLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please allow location access to automatically set your coordinates.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
    } catch {
      Alert.alert('Location error', 'Could not get your current location. Please try again.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to create your profile.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    if (!experienceYears.trim()) {
      Alert.alert('Required', 'Please enter your experience in years.');
      return;
    }

    if (!profilePhotoLocalUri) {
      Alert.alert('Required', 'Please upload your profile photo.');
      return;
    }

    if (!aadharLocalUri) {
      Alert.alert('Required', 'Please upload your Aadhar card photo.');
      return;
    }

    if (!panditCertLocalUri) {
      Alert.alert('Required', 'Please upload your Pandit certificate.');
      return;
    }

    if (!bankAccountHolder.trim() || !bankAccountNumber.trim() || !bankIfsc.trim() || !bankName.trim()) {
      Alert.alert('Required', 'Please fill all bank details.');
      return;
    }

    if (!passbookLocalUri) {
      Alert.alert('Required', 'Please upload your passbook photo.');
      return;
    }

    setSubmitting(true);

    try {
      const { profileImage, aadharImage, panditCertificateImage, passbookImage } =
        await uploadProfileImages(token, {
          profilePhoto: profilePhotoLocalUri,
          aadhar: aadharLocalUri,
          panditCertificate: panditCertLocalUri,
          passbook: passbookLocalUri,
        });

      if (!profileImage) {
        throw new Error('Profile photo upload failed. Please try again.');
      }

      await createMutation.mutateAsync({
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
        bankAccountHolder: bankAccountHolder.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankName: bankName.trim(),
        passbookImage,
      });

      if (token && user) {
        await signIn(token, { ...user, profileImage });
      }

      Alert.alert('Success', 'Your pandit profile has been submitted for review.', [
        {
          text: 'OK',
          onPress: () => goToProfile(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Pandit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <Text style={styles.intro}>
            Complete your profile with personal details, documents and bank information to start
            receiving bookings.
          </Text>

          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            <ImageUploadField
              label="Profile Photo *"
              hint="Upload a clear photo of yourself. This will appear on your pandit profile."
              value={profilePhotoLocalUri}
              onChange={setProfilePhotoLocalUri}
              uploading={submitting}
            />
            <Field label="Full Name *" placeholder="e.g. Pt. Rakesh Tripathi" value={name} onChangeText={setName} />
            <Text style={styles.fieldLabel}>Gender *</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.genderChip, selected && styles.genderChipActive]}
                    onPress={() => setGender(option.value)}
                  >
                    <Text style={[styles.genderChipText, selected && styles.genderChipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Field
              label="Bio"
              placeholder="Tell devotees about your experience and rituals..."
              value={bio}
              onChangeText={setBio}
              multiline
            />
            <Field
              label="Experience (Years) *"
              placeholder="e.g. 10"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
            />
          </View>

          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <Field label="City ID" placeholder="e.g. 101" value={cityId} onChangeText={setCityId} keyboardType="number-pad" />

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

            {latitude || longitude ? (
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
            ) : (
              <Text style={styles.locationHint}>
                Tap the button above to automatically capture your GPS coordinates.
              </Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.card}>
            <ImageUploadField
              label="Aadhar Card *"
              hint="Upload a clear photo of your Aadhar card."
              value={aadharLocalUri}
              onChange={setAadharLocalUri}
              uploading={submitting}
            />
            <ImageUploadField
              label="Pandit Certificate *"
              hint="Upload your pandit / priest certificate or qualification proof."
              value={panditCertLocalUri}
              onChange={setPanditCertLocalUri}
              uploading={submitting}
            />
          </View>

          <Text style={styles.sectionTitle}>Bank Details</Text>
          <View style={styles.card}>
            <Field label="Account Holder Name *" placeholder="Name as per bank" value={bankAccountHolder} onChangeText={setBankAccountHolder} />
            <Field label="Account Number *" placeholder="Bank account number" value={bankAccountNumber} onChangeText={setBankAccountNumber} keyboardType="number-pad" />
            <Field label="IFSC Code *" placeholder="e.g. SBIN0001234" value={bankIfsc} onChangeText={setBankIfsc} autoCapitalize="characters" />
            <Field label="Bank Name *" placeholder="e.g. State Bank of India" value={bankName} onChangeText={setBankName} />
            <ImageUploadField
              label="Passbook Photo *"
              hint="Upload first page of passbook or cancelled cheque."
              value={passbookLocalUri}
              onChange={setPassbookLocalUri}
              uploading={submitting}
            />
          </View>

          <Pressable
            style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Profile</Text>
            )}
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
  placeholder: string;
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
  intro: { fontSize: 14, lineHeight: 21, color: C.textMuted, marginBottom: 8 },
  sectionTitle: { marginTop: 20, marginBottom: 10, fontSize: 16, fontWeight: '800', color: C.text },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
  locationHint: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
    textAlign: 'center',
  },
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
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
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
