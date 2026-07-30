import * as Location from 'expo-location';

export type CurrentAddress = {
  address: string;
  cityName: string;
  latitude: number;
  longitude: number;
};

function formatAddress(place: Location.LocationGeocodedAddress): string {
  if (place.formattedAddress) return place.formattedAddress;

  const streetLine = [place.streetNumber, place.street].filter(Boolean).join(' ');
  const parts = [
    streetLine,
    place.district,
    place.city,
    place.region,
    place.postalCode,
    place.country,
  ].filter((part): part is string => Boolean(part && part.trim()));

  return parts.join(', ');
}

function extractCityName(place: Location.LocationGeocodedAddress): string {
  return (place.city || place.district || place.subregion || place.region || '').trim();
}

export async function getCurrentAddress(): Promise<CurrentAddress> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to auto-fill your address.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;

  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = places[0];
  const address = place ? formatAddress(place) : '';
  const cityName = place ? extractCityName(place) : '';

  if (!address) {
    throw new Error('Could not determine your address. Please enter it manually.');
  }

  return { address, cityName, latitude, longitude };
}
