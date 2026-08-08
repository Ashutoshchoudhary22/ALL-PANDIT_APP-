type NominatimReverseResponse = {
  display_name?: string;
};

export async function reverseGeocodeAddress(latitude: number, longitude: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'MyPanditSuperAdmin/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Could not fetch address');
  }

  const data = (await response.json()) as NominatimReverseResponse;
  const address = data.display_name?.trim();

  if (!address) {
    throw new Error('Address not found');
  }

  return address;
}
