import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

import { DatePickerField } from '@/components/DatePickerField';
import { ImageUploadField } from '@/components/ImageUploadField';
import { HomeColors as C } from '@/constants/home-theme';
import { useCreateCustomerProfileMutation } from '@/hooks/use-customer-profile';
import { goToProfile } from '@/lib/auth-navigation';
import { getCurrentAddress } from '@/lib/location';
import { uploadLocalImageIfNeeded } from '@/lib/upload-local-image';
import { useAuth } from '@/providers/AuthProvider';

type Gender = 'male' | 'female' | 'other';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export function CreateCustomerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { token, user, signIn } = useAuth();
  const createMutation = useCreateCustomerProfileMutation();

  const [photoLocalUri, setPhotoLocalUri] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [cityName, setCityName] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const isBusy = submitting || createMutation.isPending;

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const result = await getCurrentAddress();
      setAddress(result.address);
      setCityName(result.cityName);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
    } catch (error) {
      Alert.alert(
        'Location error',
        error instanceof Error ? error.message : 'Could not fetch your current location.',
      );
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to create your profile.');
      return;
    }

    if (!firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Location required', 'Please tap Use Current Location to fetch your address.');
      return;
    }

    setSubmitting(true);

    try {
      const profileImage = await uploadLocalImageIfNeeded(photoLocalUri, token, 'profiles');

      await createMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        gender,
        dob: dob.trim() || undefined,
        address: address.trim() || undefined,
        cityName: cityName.trim() || undefined,
        latitude,
        longitude,
        profileImage,
      });

      if (user && profileImage) {
        await signIn(token, { ...user, profileImage });
      }

      Alert.alert('Success', 'Your profile has been created.', [
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
        <Text style={styles.headerTitle}>Create Profile</Text>
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
            Tell us a bit about yourself so pandits and our team can personalize your experience.
          </Text>

          <View style={styles.card}>
            <ImageUploadField
              label="Profile Photo"
              value={photoLocalUri}
              onChange={setPhotoLocalUri}
              uploading={submitting}
              circular
            />

            <Field label="First Name *" placeholder="e.g. Rahul" value={firstName} onChangeText={setFirstName} />
            <Field label="Last Name" placeholder="e.g. Sharma" value={lastName} onChangeText={setLastName} />

            <Text style={styles.fieldLabel}>Gender</Text>
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

            <DatePickerField label="Date of Birth" value={dob} onChange={setDob} />

            <View style={styles.addressLabelRow}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Pressable
                style={[styles.locationBtn, locating && styles.locationBtnDisabled]}
                onPress={handleUseCurrentLocation}
                disabled={locating}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <>
                    <Ionicons name="location" size={14} color={C.primary} />
                    <Text style={styles.locationBtnText}>Use Current Location</Text>
                  </>
                )}
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, styles.inputMultiline, styles.inputReadOnly]}
              placeholder="Tap Use Current Location to fetch address"
              placeholderTextColor={C.textLight}
              value={address}
              editable={false}
              multiline
            />
            <Text style={styles.addressHint}>Address can only be set using your current location.</Text>
          </View>

          <Pressable
            style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Profile</Text>
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
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
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
  card: {
    marginTop: 16,
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
  addressLabelRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF5EC',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  locationBtnDisabled: { opacity: 0.7 },
  locationBtnText: { fontSize: 11, fontWeight: '700', color: C.primary },
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
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  inputReadOnly: {
    backgroundColor: '#F3F4F6',
    color: C.textMuted,
  },
  addressHint: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: C.textLight,
  },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
  },
  genderChipActive: { backgroundColor: '#FFF5EC', borderColor: C.primary },
  genderChipText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  genderChipTextActive: { color: C.primary },
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
