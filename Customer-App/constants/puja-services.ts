export type PujaIconSet = 'ionicons' | 'material';

export type PujaServiceStyle = {
  icon: string;
  iconSet: PujaIconSet;
  bg: string;
  bgEnd: string;
  color: string;
};

export const PUJA_SERVICE_OPTIONS = [
  'Marriage Puja',
  'Griha Pravesh',
  'Satyanarayan Katha',
  'Birthday Puja',
  'Sunderkand Path',
  'Business Opening',
  'Havan',
  'Navratri Puja',
  'Bhagwat Katha',
  'Shradh',
  'Rudrabhishek',
  'Mundan',
  'Mahamrityunjaya Jaap',
  'Ganesh Puja',
  'Lakshmi Puja',
  'Saraswati Puja',
  'Durga Puja',
  'Kali Puja',
  'Shiv Puja',
  'Vishnu Puja',
  'Ram Katha',
  'Shiv Mahapuran Katha',
  'Akhand Ramayan Path',
  'Hanuman Chalisa Path',
  'Grah Shanti Puja',
  'Navgraha Puja',
  'Vastu Shanti Puja',
  'Bhoomi Pujan',
  'Shilanyas Puja',
  'Office Puja',
  'Shop Opening Puja',
  'Vehicle Puja',
  'Factory Puja',
  'Lakshmi Kuber Puja',
  'Dhanteras Puja',
  'Ayudha Puja',
  'Namkaran Sanskar',
  'Annaprashan Sanskar',
  'Vidyarambh Sanskar',
  'Janeu Sanskar',
  'Engagement Puja',
  'Wedding Anniversary Puja',
  'Baby Shower Puja',
  'Kaal Sarp Dosh Puja',
  'Mangal Dosh Puja',
  'Pitra Dosh Puja',
  'Shani Shanti Puja',
  'Rahu Ketu Shanti Puja',
  'Chandi Path',
  'Gayatri Havan',
  'Chandi Havan',
  'Sudarshan Havan',
  'Putra Kameshti Yagya',
  'Antyeshti Sanskar',
  'Terahvi Kriya',
  'Asthi Visarjan',
  'Narayan Bali Puja',
  'Tripindi Shradh',
] as const;

export type PujaServiceName = (typeof PUJA_SERVICE_OPTIONS)[number];

const PREMIUM: Record<string, PujaServiceStyle> = {
  'Marriage Puja': { icon: 'ring', iconSet: 'material', bg: '#FFE8E8', bgEnd: '#FFD4D4', color: '#9B1C1C' },
  'Griha Pravesh': { icon: 'home-variant', iconSet: 'material', bg: '#E8F0FF', bgEnd: '#D4E4FF', color: '#1E40AF' },
  'Satyanarayan Katha': { icon: 'book-open-page-variant', iconSet: 'material', bg: '#FCE8F4', bgEnd: '#F8D4EA', color: '#9D174D' },
  'Birthday Puja': { icon: 'cake-variant', iconSet: 'material', bg: '#FFF0F5', bgEnd: '#FFE0EC', color: '#BE185D' },
  'Sunderkand Path': { icon: 'book-open-variant', iconSet: 'material', bg: '#F3E8FF', bgEnd: '#E9D5FF', color: '#6B21A8' },
  'Business Opening': { icon: 'storefront', iconSet: 'ionicons', bg: '#E0F2FE', bgEnd: '#BAE6FD', color: '#0369A1' },
  Havan: { icon: 'fire', iconSet: 'material', bg: '#FFF0E0', bgEnd: '#FFE0C2', color: '#C2410C' },
  'Navratri Puja': { icon: 'candle', iconSet: 'material', bg: '#FEF3C7', bgEnd: '#FDE68A', color: '#B45309' },
  'Bhagwat Katha': { icon: 'book-cross', iconSet: 'material', bg: '#EDE9FE', bgEnd: '#DDD6FE', color: '#5B21B6' },
  Shradh: { icon: 'hands-pray', iconSet: 'material', bg: '#F3F4F6', bgEnd: '#E5E7EB', color: '#374151' },
  Rudrabhishek: { icon: 'water', iconSet: 'material', bg: '#E0E7FF', bgEnd: '#C7D2FE', color: '#3730A3' },
  Mundan: { icon: 'baby-face-outline', iconSet: 'material', bg: '#DCFCE7', bgEnd: '#BBF7D0', color: '#15803D' },
  'Mahamrityunjaya Jaap': { icon: 'meditation', iconSet: 'material', bg: '#E0E7FF', bgEnd: '#C7D2FE', color: '#4338CA' },
  'Ganesh Puja': { icon: 'elephant', iconSet: 'material', bg: '#FEF9C3', bgEnd: '#FEF08A', color: '#A16207' },
  'Lakshmi Puja': { icon: 'flower-tulip', iconSet: 'material', bg: '#FEF3C7', bgEnd: '#FDE68A', color: '#CA8A04' },
  'Saraswati Puja': { icon: 'music-note', iconSet: 'material', bg: '#E0F2FE', bgEnd: '#BAE6FD', color: '#0284C7' },
  'Durga Puja': { icon: 'star-circle', iconSet: 'material', bg: '#FCE7F3', bgEnd: '#FBCFE8', color: '#BE123C' },
  'Kali Puja': { icon: 'moon-waning-crescent', iconSet: 'material', bg: '#FEE2E2', bgEnd: '#FECACA', color: '#991B1B' },
  'Shiv Puja': { icon: 'om', iconSet: 'material', bg: '#E0E7FF', bgEnd: '#C7D2FE', color: '#4338CA' },
  'Vishnu Puja': { icon: 'infinity', iconSet: 'material', bg: '#DBEAFE', bgEnd: '#BFDBFE', color: '#1D4ED8' },
  'Ram Katha': { icon: 'book-account', iconSet: 'material', bg: '#FFEDD5', bgEnd: '#FED7AA', color: '#C2410C' },
  'Hanuman Chalisa Path': { icon: 'shield-sun', iconSet: 'material', bg: '#FEE2E2', bgEnd: '#FECACA', color: '#DC2626' },
  'Grah Shanti Puja': { icon: 'orbit', iconSet: 'material', bg: '#EDE9FE', bgEnd: '#DDD6FE', color: '#7C3AED' },
  'Navgraha Puja': { icon: 'solar-system', iconSet: 'material', bg: '#F3E8FF', bgEnd: '#E9D5FF', color: '#7E22CE' },
  'Vastu Shanti Puja': { icon: 'compass-rose', iconSet: 'material', bg: '#ECFDF5', bgEnd: '#D1FAE5', color: '#047857' },
  'Bhoomi Pujan': { icon: 'terrain', iconSet: 'material', bg: '#DCFCE7', bgEnd: '#BBF7D0', color: '#166534' },
  'Vehicle Puja': { icon: 'car-side', iconSet: 'material', bg: '#E0F2FE', bgEnd: '#BAE6FD', color: '#0369A1' },
  'Office Puja': { icon: 'office-building', iconSet: 'material', bg: '#F1F5F9', bgEnd: '#E2E8F0', color: '#475569' },
  'Shop Opening Puja': { icon: 'store', iconSet: 'material', bg: '#FFF7ED', bgEnd: '#FFEDD5', color: '#EA580C' },
  'Namkaran Sanskar': { icon: 'baby-carriage', iconSet: 'material', bg: '#FCE7F3', bgEnd: '#FBCFE8', color: '#DB2777' },
  'Janeu Sanskar': { icon: 'ribbon', iconSet: 'material', bg: '#FFFBEB', bgEnd: '#FEF3C7', color: '#D97706' },
  'Engagement Puja': { icon: 'heart', iconSet: 'material', bg: '#FFE4E6', bgEnd: '#FECDD3', color: '#E11D48' },
  'Antyeshti Sanskar': { icon: 'candle', iconSet: 'material', bg: '#F3F4F6', bgEnd: '#E5E7EB', color: '#4B5563' },
  More: { icon: 'grid', iconSet: 'ionicons', bg: '#FEF9C3', bgEnd: '#FEF08A', color: '#CA8A04' },
};

const FALLBACK_STYLES: PujaServiceStyle[] = [
  { icon: 'hands-pray', iconSet: 'material', bg: '#FFF7ED', bgEnd: '#FFEDD5', color: '#C2410C' },
  { icon: 'candle', iconSet: 'material', bg: '#FEF3C7', bgEnd: '#FDE68A', color: '#B45309' },
  { icon: 'om', iconSet: 'material', bg: '#E0E7FF', bgEnd: '#C7D2FE', color: '#4338CA' },
  { icon: 'star-four-points', iconSet: 'material', bg: '#F3E8FF', bgEnd: '#E9D5FF', color: '#7E22CE' },
];

export const HOME_PUJA_CATEGORIES = [
  { id: '1', label: 'Marriage Puja' },
  { id: '2', label: 'Griha Pravesh' },
  { id: '3', label: 'Satyanarayan Katha' },
  { id: '4', label: 'Havan' },
  { id: '5', label: 'Rudrabhishek' },
  { id: '6', label: 'Sunderkand Path' },
  { id: '7', label: 'More' },
] as const;

function matchByKeyword(name: string): PujaServiceStyle | null {
  const n = name.toLowerCase();

  if (n.includes('marriage') || n.includes('wedding') || n.includes('engagement') || n.includes('anniversary')) {
    return PREMIUM['Marriage Puja'];
  }
  if (n.includes('griha') || n.includes('vastu') || n.includes('bhoomi') || n.includes('shilanyas')) {
    return PREMIUM['Griha Pravesh'];
  }
  if (n.includes('havan') || n.includes('yagya') || n.includes('homa')) {
    return PREMIUM.Havan;
  }
  if (n.includes('shradh') || n.includes('antyeshti') || n.includes('terahvi') || n.includes('asthi') || n.includes('tripindi') || n.includes('narayan bali')) {
    return PREMIUM.Shradh;
  }
  if (n.includes('katha') || n.includes('path') || n.includes('chalisa') || n.includes('ramayan') || n.includes('puran')) {
    return PREMIUM['Satyanarayan Katha'];
  }
  if (n.includes('ganesh')) return PREMIUM['Ganesh Puja'];
  if (n.includes('lakshmi') || n.includes('kuber') || n.includes('dhanteras')) return PREMIUM['Lakshmi Puja'];
  if (n.includes('saraswati') || n.includes('vidyarambh')) return PREMIUM['Saraswati Puja'];
  if (n.includes('durga') || n.includes('navratri') || n.includes('chandi')) return PREMIUM['Durga Puja'];
  if (n.includes('shiv') || n.includes('rudra') || n.includes('mahamrityunjaya')) return PREMIUM['Shiv Puja'];
  if (n.includes('vishnu') || n.includes('satyanarayan')) return PREMIUM['Vishnu Puja'];
  if (n.includes('hanuman')) return PREMIUM['Hanuman Chalisa Path'];
  if (n.includes('dosh') || n.includes('shani') || n.includes('rahu') || n.includes('mangal') || n.includes('kaal sarp') || n.includes('pitra')) {
    return PREMIUM['Grah Shanti Puja'];
  }
  if (n.includes('navgraha') || n.includes('grah')) return PREMIUM['Navgraha Puja'];
  if (n.includes('vehicle') || n.includes('ayudha')) return PREMIUM['Vehicle Puja'];
  if (n.includes('office') || n.includes('factory') || n.includes('shop') || n.includes('business')) {
    return PREMIUM['Business Opening'];
  }
  if (n.includes('mundan') || n.includes('namkaran') || n.includes('annapras') || n.includes('baby') || n.includes('janeu')) {
    return PREMIUM.Mundan;
  }
  if (n.includes('birthday')) return PREMIUM['Birthday Puja'];

  return null;
}

export function getPujaServiceStyle(name: string, index: number): PujaServiceStyle {
  if (PREMIUM[name]) return PREMIUM[name];
  const keyword = matchByKeyword(name);
  if (keyword) return keyword;
  return FALLBACK_STYLES[index % FALLBACK_STYLES.length];
}
