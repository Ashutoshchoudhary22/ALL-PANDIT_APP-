import { Alert, Linking } from 'react-native';

import { PanditBooking } from '@/services/booking.api';

export function canShowCustomerContact(
  booking: Pick<PanditBooking, 'paymentStatus' | 'customerMobile'>,
) {
  const advancePaid =
    booking.paymentStatus === 'advance_paid' || booking.paymentStatus === 'fully_paid';

  return advancePaid && Boolean(booking.customerMobile?.trim());
}

export async function callCustomerPhone(mobile: string, customerName?: string) {
  const cleaned = mobile.replace(/[^\d+]/g, '');
  if (!cleaned) {
    Alert.alert('Phone unavailable', 'Customer phone number is not available.');
    return;
  }

  const url = `tel:${cleaned}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Unable to call', 'Calling is not supported on this device.');
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Unable to call',
      customerName
        ? `Could not start a call to ${customerName}.`
        : 'Could not start the phone call.',
    );
  }
}
