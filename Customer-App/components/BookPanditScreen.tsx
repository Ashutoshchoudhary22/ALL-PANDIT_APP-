import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloudImage } from '@/components/CloudImage';
import { DatePickerField, getTodayIsoDate } from '@/components/DatePickerField';
import { TimePickerField } from '@/components/TimePickerField';
import { DEMO_IMAGES } from '@/constants/cloudinary';
import { HomeColors as C } from '@/constants/home-theme';
import { useCreateBookingMutation } from '@/hooks/use-bookings';
import { useMyCustomerProfileQuery } from '@/hooks/use-customer-profile';
import { usePublicPanditProfileQuery } from '@/hooks/use-public-pandit-profile';
import { useMyWalletQuery } from '@/hooks/use-wallet';
import { calculateBookingPrice, formatINR, SAMAGRI_RATE, ADVANCE_RATE } from '@/lib/booking-pricing';
import { getCurrentAddress } from '@/lib/location';
import { useAuth } from '@/providers/AuthProvider';

type AddressSource = 'profile' | 'current';

type BookPanditScreenProps = {
  panditProfileId: number;
  initialServiceName?: string;
};

export function BookPanditScreen({ panditProfileId, initialServiceName }: BookPanditScreenProps) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const panditQuery = usePublicPanditProfileQuery(panditProfileId, Boolean(token));
  const profileQuery = useMyCustomerProfileQuery(Boolean(token));
  const walletQuery = useMyWalletQuery(Boolean(token));
  const createBooking = useCreateBookingMutation();
  const isSubmittingRef = useRef(false);

  const pandit = panditQuery.data?.data;
  const customerProfile = profileQuery.data?.data;

  const [serviceName, setServiceName] = useState(initialServiceName ?? '');
  const [bookingDate, setBookingDate] = useState(getTodayIsoDate);
  const [bookingTime, setBookingTime] = useState('');
  const [address, setAddress] = useState('');
  const [addressSource, setAddressSource] = useState<AddressSource | null>(null);
  const [bookingLatitude, setBookingLatitude] = useState<number | null>(null);
  const [bookingLongitude, setBookingLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [samagriRequired, setSamagriRequired] = useState(false);

  const profileAddress = useMemo(() => {
    if (!customerProfile) return '';
    return [customerProfile.address, customerProfile.cityName].filter(Boolean).join(', ');
  }, [customerProfile]);

  const hasProfileAddress = profileAddress.trim().length > 0;

  useEffect(() => {
    if (!hasProfileAddress || addressSource) return;

    setAddressSource('profile');
    setAddress(profileAddress);
    setBookingLatitude(customerProfile?.liveLatitude ?? customerProfile?.latitude ?? null);
    setBookingLongitude(customerProfile?.liveLongitude ?? customerProfile?.longitude ?? null);
  }, [hasProfileAddress, profileAddress, customerProfile, addressSource]);

  useEffect(() => {
    if (!pandit || serviceName) return;
    if (pandit.pujaServices.length === 1) {
      setServiceName(pandit.pujaServices[0].name);
    }
  }, [pandit, serviceName]);

  const selectedService = useMemo(
    () => pandit?.pujaServices.find((item) => item.name === serviceName),
    [pandit, serviceName],
  );

  const pricing = useMemo(
    () => calculateBookingPrice(selectedService?.price ?? 0, samagriRequired),
    [selectedService?.price, samagriRequired],
  );
  const walletBalance = walletQuery.data?.data.balance ?? 0;
  const canPayAdvanceWithWallet = walletBalance >= pricing.advanceAmount && pricing.advanceAmount > 0;

  const showBookingSuccess = (message: string, title = 'Request Sent') => {
    router.replace('/(tabs)/bookings');
    Alert.alert(title, message);
  };

  const handleSelectProfileAddress = () => {
    if (!hasProfileAddress) {
      Alert.alert(
        'Profile address missing',
        'Add your address in Profile first, or use current location for this booking.',
      );
      return;
    }

    setAddressSource('profile');
    setAddress(profileAddress);
    setBookingLatitude(customerProfile?.liveLatitude ?? customerProfile?.latitude ?? null);
    setBookingLongitude(customerProfile?.liveLongitude ?? customerProfile?.longitude ?? null);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const result = await getCurrentAddress();
      const fullAddress = [result.address, result.cityName].filter(Boolean).join(', ');
      setAddressSource('current');
      setAddress(fullAddress);
      setBookingLatitude(result.latitude);
      setBookingLongitude(result.longitude);
    } catch (error) {
      Alert.alert(
        'Location Error',
        error instanceof Error ? error.message : 'Could not fetch your current location.',
      );
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current || createBooking.isPending) {
      return;
    }

    if (!serviceName) {
      Alert.alert('Required', 'Please select a puja service.');
      return;
    }
    if (!bookingDate || !bookingTime) {
      Alert.alert('Required', 'Please select booking date and time.');
      return;
    }
    if (!address.trim() || !addressSource) {
      Alert.alert('Required', 'Please select profile address or use current location.');
      return;
    }

    isSubmittingRef.current = true;

    try {
      const response = await createBooking.mutateAsync({
        panditProfileId,
        serviceName,
        bookingDate,
        bookingTime,
        address: address.trim(),
        latitude: bookingLatitude ?? undefined,
        longitude: bookingLongitude ?? undefined,
        specialRequirements: specialRequirements.trim() || undefined,
        samagriRequired,
      });

      showBookingSuccess(
        response.message || 'Your booking request has been sent to the pandit for approval.',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit booking';
      const alreadySent =
        message.includes('already sent') ||
        message.includes('pending booking request') ||
        message.includes('already have an active booking');

      if (alreadySent) {
        showBookingSuccess(message);
        return;
      }

      if (message.includes('approved') && message.includes('Bookings tab')) {
        showBookingSuccess(
          `${message}\n\nPay ${Math.round(ADVANCE_RATE * 100)}% advance via Wallet or Online from your bookings.`,
          'Payment Pending',
        );
        return;
      }

      Alert.alert('Error', message);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const isSubmitting = createBooking.isPending;

  if (panditQuery.isLoading) {
    return (
      <View style={[styles.root, styles.centerState]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (panditQuery.isError || !pandit) {
    return (
      <View style={[styles.root, styles.centerState]}>
        <Text style={styles.errorText}>Could not load pandit details.</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const imageSource = pandit.profileImage || DEMO_IMAGES.pandit1;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Book Pandit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        >
          <View style={styles.panditCard}>
            <CloudImage source={imageSource} preset="avatar" style={styles.avatar} />
            <View style={styles.panditInfo}>
              <Text style={styles.panditName}>{pandit.name}</Text>
              <Text style={styles.panditMeta}>
                {pandit.rating.toFixed(1)} ★ • {pandit.experienceYears}+ yrs
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Puja Service *</Text>
          <View style={styles.card}>
            <View style={styles.chipRow}>
              {pandit.pujaServices.map((service) => {
                const selected = service.name === serviceName;
                return (
                  <Pressable
                    key={service.name}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setServiceName(service.name)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{service.name}</Text>
                    <Text style={[styles.chipPrice, selected && styles.chipTextActive]}>
                      {formatINR(service.price)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.card}>
            <DatePickerField
              label="Select Date *"
              value={bookingDate}
              onChange={setBookingDate}
              placeholder="Select booking date"
              mode="future"
            />
            <TimePickerField
              label="Select Time *"
              value={bookingTime}
              onChange={setBookingTime}
              placeholder="Select booking time"
            />
            <TimePickerField
              label="Select Time *"
              value={bookingTime}
              onChange={setBookingTime}
              placeholder="Select booking time"
            />

            <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Puja Address *</Text>
            <View style={styles.addressSelectRow}>
              <Pressable
                style={[
                  styles.addressSelectBtn,
                  addressSource === 'profile' && styles.addressSelectBtnActive,
                  !hasProfileAddress && styles.addressSelectBtnDisabled,
                ]}
                onPress={handleSelectProfileAddress}
                disabled={!hasProfileAddress}
              >
                <Ionicons
                  name="home-outline"
                  size={16}
                  color={addressSource === 'profile' ? C.primary : C.textMuted}
                />
                <Text
                  style={[
                    styles.addressSelectText,
                    addressSource === 'profile' && styles.addressSelectTextActive,
                  ]}
                >
                  Profile Address
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.addressSelectBtn,
                  addressSource === 'current' && styles.addressSelectBtnActive,
                  locating && styles.addressSelectBtnDisabled,
                ]}
                onPress={handleUseCurrentLocation}
                disabled={locating}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={addressSource === 'current' ? C.primary : C.textMuted}
                    />
                    <Text
                      style={[
                        styles.addressSelectText,
                        addressSource === 'current' && styles.addressSelectTextActive,
                      ]}
                    >
                      Current Location
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, styles.inputMultiline, styles.inputReadOnly]}
              placeholder="Select profile address or current location"
              placeholderTextColor={C.textLight}
              value={address}
              editable={false}
              multiline
            />
            <Text style={styles.addressHint}>
              Address is selected from your profile or GPS. It cannot be typed manually.
            </Text>
            </View>

            <Field
              label="Special Requirements"
              value={specialRequirements}
              onChangeText={setSpecialRequirements}
              placeholder="Any special instructions for the pandit"
              multiline
            />
          </View>

          <Text style={styles.sectionTitle}>Samagri Required?</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.toggleLabel}>Include samagri / puja materials</Text>
                <Text style={styles.toggleHint}>
                  Adds {Math.round(SAMAGRI_RATE * 100)}% to the base service price
                </Text>
              </View>
              <Switch
                value={samagriRequired}
                onValueChange={setSamagriRequired}
                trackColor={{ false: C.border, true: '#FDBA74' }}
                thumbColor={samagriRequired ? C.primary : '#fff'}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Price Calculation</Text>
          <View style={styles.priceCard}>
            <PriceRow label="Service Price" value={formatINR(pricing.basePrice)} />
            <PriceRow
              label="Samagri Charge"
              value={samagriRequired ? formatINR(pricing.samagriCharge) : '₹0'}
            />
            <View style={styles.divider} />
            <PriceRow
              label={`Advance After Approval (${Math.round(ADVANCE_RATE * 100)}%)`}
              value={formatINR(pricing.advanceAmount)}
              bold
            />
            <PriceRow label="Pay Later" value={formatINR(pricing.remainingAmount)} />
            <View style={styles.divider} />
            <PriceRow label="Total Amount" value={formatINR(pricing.totalPrice)} />
          </View>

          <View style={styles.walletInfoCard}>
            <View style={styles.walletInfoTop}>
              <Ionicons name="wallet-outline" size={20} color={C.primary} />
              <Text style={styles.walletInfoTitle}>Wallet Balance: {formatINR(walletBalance)}</Text>
            </View>
            <Text style={styles.walletInfoText}>
              After pandit approves your request, open the Bookings tab to pay {Math.round(ADVANCE_RATE * 100)}% advance using{' '}
              <Text style={styles.walletInfoBold}>Pay with Wallet</Text> or{' '}
              <Text style={styles.walletInfoBold}>Pay Online</Text>.
            </Text>
            {canPayAdvanceWithWallet ? (
              <Text style={styles.walletInfoReady}>
                Your wallet has enough balance for the advance payment.
              </Text>
            ) : pricing.advanceAmount > 0 ? (
              <Text style={styles.walletInfoLow}>
                Add money in Profile → Wallet if you want to pay advance from wallet.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.submitText}>Send Booking Request</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
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
      />
    </View>
  );
}

function PriceRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, bold && styles.priceLabelBold]}>{label}</Text>
      <Text style={[styles.priceValue, bold && styles.priceValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  centerState: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, color: C.textMuted },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: C.text },
  headerSpacer: { width: 40 },
  content: { padding: 16 },
  panditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.border },
  panditInfo: { flex: 1 },
  panditName: { fontSize: 16, fontWeight: '800', color: C.text },
  panditMeta: { marginTop: 4, fontSize: 13, color: C.textMuted },
  sectionTitle: { marginTop: 20, marginBottom: 10, fontSize: 16, fontWeight: '800', color: C.text },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    width: '48%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
  },
  chipActive: { backgroundColor: '#FFF7ED', borderColor: C.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  chipPrice: { marginTop: 4, fontSize: 12, fontWeight: '800', color: C.text },
  chipTextActive: { color: C.primary },
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
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  inputReadOnly: {
    backgroundColor: '#F3F4F6',
    color: C.textMuted,
  },
  addressSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addressSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
  },
  addressSelectBtnActive: {
    backgroundColor: '#FFF7ED',
    borderColor: C.primary,
  },
  addressSelectBtnDisabled: {
    opacity: 0.55,
  },
  addressSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textAlign: 'center',
  },
  addressSelectTextActive: {
    color: C.primary,
  },
  addressHint: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: C.textLight,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTextWrap: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  toggleHint: { marginTop: 4, fontSize: 12, color: C.textMuted, lineHeight: 18 },
  priceCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: { fontSize: 14, color: C.textMuted, fontWeight: '600' },
  priceLabelBold: { color: C.text, fontWeight: '800', fontSize: 15 },
  priceValue: { fontSize: 14, fontWeight: '700', color: C.text },
  priceValueBold: { fontSize: 18, fontWeight: '800', color: C.primary },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 6 },
  walletInfoCard: {
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  walletInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },
  walletInfoText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: C.textMuted,
  },
  walletInfoBold: {
    fontWeight: '800',
    color: C.text,
  },
  walletInfoReady: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: C.success,
  },
  walletInfoLow: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
