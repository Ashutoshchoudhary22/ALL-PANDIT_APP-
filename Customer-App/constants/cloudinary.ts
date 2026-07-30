export const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';

export const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export type CloudinaryFolder =
  | 'profiles'
  | 'pandits'
  | 'services'
  | 'banners'
  | 'documents'
  | 'general';

export type ImagePreset = 'avatar' | 'panditCard' | 'banner' | 'service' | 'thumbnail';

export const IMAGE_PRESETS: Record<ImagePreset, string> = {
  avatar: 'w_120,h_120,c_fill,g_face,q_auto,f_auto',
  panditCard: 'w_400,h_300,c_fill,g_face,q_auto,f_auto',
  banner: 'w_800,h_400,c_fill,q_auto,f_auto',
  service: 'w_260,h_200,c_fill,q_auto,f_auto',
  thumbnail: 'w_80,h_80,c_fill,q_auto,f_auto',
};

/** Demo images from Cloudinary's public demo account */
export const DEMO_IMAGES = {
  avatar: 'sample',
  pandit1: 'samples/people/boy-snow-hoodie',
  pandit2: 'samples/people/smiling-man',
  pandit3: 'samples/people/kitchen-bar',
  customer: 'samples/people/bicycle',
  banner: 'samples/food/spices',
  serviceMarriage: 'samples/people/wedding-couple',
  serviceGriha: 'samples/architecture/building-front',
} as const;
