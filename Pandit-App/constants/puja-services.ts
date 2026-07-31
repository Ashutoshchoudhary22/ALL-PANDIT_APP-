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

export type PujaService = {
  name: PujaServiceName;
  price: number;
};

export type PujaServiceDraft = {
  name: PujaServiceName;
  price: string;
};

export function toPujaServiceDrafts(services: PujaService[] = []): PujaServiceDraft[] {
  return services.map((service) => ({
    name: service.name as PujaServiceName,
    price: String(service.price),
  }));
}

export function normalizePujaServices(drafts: PujaServiceDraft[]): PujaService[] {
  return drafts
    .filter((item) => item.price.trim())
    .map((item) => ({
      name: item.name,
      price: Math.round(Number(item.price)),
    }))
    .filter((item) => Number.isFinite(item.price) && item.price > 0);
}

export function validatePujaServices(drafts: PujaServiceDraft[]): string | null {
  if (drafts.length === 0) {
    return 'Please select at least one puja service and add its price.';
  }

  for (const item of drafts) {
    const price = Number(item.price);
    if (!item.price.trim() || !Number.isFinite(price) || price <= 0) {
      return `Please enter a valid price for ${item.name}.`;
    }
  }

  return null;
}
