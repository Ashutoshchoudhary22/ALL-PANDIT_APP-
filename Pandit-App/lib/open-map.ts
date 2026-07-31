import { Alert, Linking, Platform } from 'react-native';

type MapLocationInput = {
  latitude?: number | null;
  longitude?: number | null;
  address: string;
  label?: string;
};

function hasCoordinates(input: MapLocationInput) {
  return input.latitude != null && input.longitude != null;
}

function buildViewUrl(input: MapLocationInput) {
  if (hasCoordinates(input)) {
    const query = `${input.latitude},${input.longitude}`;
    if (Platform.OS === 'ios') {
      return `http://maps.apple.com/?ll=${query}&q=${encodeURIComponent(input.label || input.address)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  const query = encodeURIComponent(input.address);
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?q=${query}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function buildDirectionsUrl(input: MapLocationInput) {
  if (hasCoordinates(input)) {
    const destination = `${input.latitude},${input.longitude}`;
    if (Platform.OS === 'ios') {
      return `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }

  const destination = encodeURIComponent(input.address);
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}

async function openMapUrl(url: string) {
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('Unable to open maps', 'No maps app is available on this device.');
    return;
  }
  await Linking.openURL(url);
}

export async function openMapView(input: MapLocationInput) {
  if (!input.address.trim() && !hasCoordinates(input)) {
    Alert.alert('Location unavailable', 'No location found for this booking.');
    return;
  }
  await openMapUrl(buildViewUrl(input));
}

export async function openMapDirections(input: MapLocationInput) {
  if (!input.address.trim() && !hasCoordinates(input)) {
    Alert.alert('Location unavailable', 'No location found for this booking.');
    return;
  }
  await openMapUrl(buildDirectionsUrl(input));
}

export function promptBookingLocation(input: MapLocationInput) {
  if (!input.address.trim() && !hasCoordinates(input)) {
    Alert.alert('Location unavailable', 'No location found for this booking.');
    return;
  }

  Alert.alert('Booking Location', input.address, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'View on Map', onPress: () => void openMapView(input) },
    { text: 'Get Directions', onPress: () => void openMapDirections(input) },
  ]);
}
