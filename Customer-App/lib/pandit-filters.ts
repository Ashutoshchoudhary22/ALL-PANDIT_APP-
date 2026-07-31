import { PublicPanditProfile } from '@/services/pandit-profile.api';

export type OnlineFilter = 'any' | 'online' | 'offline';
export type SortOption = 'rating' | 'price' | 'distance' | 'experience';

export type PanditFilters = {
  minRating: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  languages: string[];
  minExperience: number | null;
  availableOnly: boolean;
  maxDistanceKm: number | null;
  onlineStatus: OnlineFilter;
  verifiedOnly: boolean;
  sameDayOnly: boolean;
  sortBy: SortOption;
};

export const DEFAULT_PANDIT_FILTERS: PanditFilters = {
  minRating: null,
  minPrice: null,
  maxPrice: null,
  languages: [],
  minExperience: null,
  availableOnly: false,
  maxDistanceKm: null,
  onlineStatus: 'any',
  verifiedOnly: false,
  sameDayOnly: false,
  sortBy: 'rating',
};

export const FILTER_LANGUAGE_OPTIONS = ['Hindi', 'English', 'Sanskrit'] as const;

export const RATING_OPTIONS = [
  { label: 'Any', value: null },
  { label: '3+', value: 3 },
  { label: '3.5+', value: 3.5 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
] as const;

export const EXPERIENCE_OPTIONS = [
  { label: 'Any', value: null },
  { label: '5+ yrs', value: 5 },
  { label: '10+ yrs', value: 10 },
  { label: '15+ yrs', value: 15 },
  { label: '20+ yrs', value: 20 },
] as const;

export const DISTANCE_OPTIONS = [
  { label: 'Any', value: null },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
] as const;

export const PRICE_PRESETS = [
  { label: 'Any', min: null, max: null },
  { label: 'Under ₹2k', min: null, max: 2000 },
  { label: '₹2k–5k', min: 2000, max: 5000 },
  { label: '₹5k–10k', min: 5000, max: 10000 },
  { label: '₹10k+', min: 10000, max: null },
] as const;

type FilterContext = {
  serviceName?: string;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getPanditCoordinates(pandit: PublicPanditProfile) {
  if (pandit.liveLatitude != null && pandit.liveLongitude != null) {
    return { latitude: pandit.liveLatitude, longitude: pandit.liveLongitude };
  }
  if (pandit.latitude != null && pandit.longitude != null) {
    return { latitude: pandit.latitude, longitude: pandit.longitude };
  }
  return null;
}

export function getPanditPrice(pandit: PublicPanditProfile, serviceName?: string) {
  const services = pandit.pujaServices ?? [];
  if (serviceName) {
    return services.find((service) => service.name === serviceName)?.price ?? null;
  }
  if (services.length === 0) return null;
  return Math.min(...services.map((service) => service.price));
}

function panditMatchesLanguage(pandit: PublicPanditProfile, languages: string[]) {
  if (languages.length === 0) return true;

  const panditLanguages = pandit.languages.length
    ? pandit.languages
    : [pandit.languageCode || 'Hindi'];

  return languages.some((language) =>
    panditLanguages.some((item) => item.toLowerCase() === language.toLowerCase()),
  );
}

export function countActiveFilters(filters: PanditFilters) {
  let count = 0;
  if (filters.minRating != null) count += 1;
  if (filters.minPrice != null || filters.maxPrice != null) count += 1;
  if (filters.languages.length > 0) count += 1;
  if (filters.minExperience != null) count += 1;
  if (filters.availableOnly) count += 1;
  if (filters.maxDistanceKm != null) count += 1;
  if (filters.onlineStatus !== 'any') count += 1;
  if (filters.verifiedOnly) count += 1;
  if (filters.sameDayOnly) count += 1;
  if (filters.sortBy !== DEFAULT_PANDIT_FILTERS.sortBy) count += 1;
  return count;
}

export function filterAndSortPandits(
  pandits: PublicPanditProfile[],
  filters: PanditFilters,
  context: FilterContext = {},
) {
  const { serviceName, customerLatitude, customerLongitude } = context;
  const hasCustomerLocation =
    customerLatitude != null &&
    customerLongitude != null &&
    Number.isFinite(customerLatitude) &&
    Number.isFinite(customerLongitude);

  const distanceMap = new Map<number, number>();

  let result = pandits.filter((pandit) => {
    if (filters.minRating != null && pandit.rating < filters.minRating) return false;
    if (filters.availableOnly && !pandit.isAvailable) return false;
    if (filters.verifiedOnly && !pandit.isVerified) return false;
    if (filters.sameDayOnly && !pandit.sameDayBooking) return false;
    if (filters.onlineStatus === 'online' && !pandit.isOnline) return false;
    if (filters.onlineStatus === 'offline' && pandit.isOnline) return false;
    if (!panditMatchesLanguage(pandit, filters.languages)) return false;
    if (filters.minExperience != null && pandit.experienceYears < filters.minExperience) return false;

    const price = getPanditPrice(pandit, serviceName);
    if (filters.minPrice != null && (price == null || price < filters.minPrice)) return false;
    if (filters.maxPrice != null && (price == null || price > filters.maxPrice)) return false;

    if (filters.maxDistanceKm != null) {
      if (!hasCustomerLocation) return false;
      const coords = getPanditCoordinates(pandit);
      if (!coords) return false;
      const distance = getDistanceKm(
        customerLatitude,
        customerLongitude,
        coords.latitude,
        coords.longitude,
      );
      distanceMap.set(pandit.id, distance);
      if (distance > filters.maxDistanceKm) return false;
    }

    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price': {
        const priceA = getPanditPrice(a, serviceName) ?? Number.MAX_SAFE_INTEGER;
        const priceB = getPanditPrice(b, serviceName) ?? Number.MAX_SAFE_INTEGER;
        return priceA - priceB;
      }
      case 'experience':
        return b.experienceYears - a.experienceYears;
      case 'distance': {
        if (!hasCustomerLocation) return 0;
        const distA = distanceMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const distB = distanceMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return distA - distB;
      }
      case 'rating':
      default:
        return b.rating - a.rating;
    }
  });

  return result;
}
