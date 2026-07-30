import {
  CLOUDINARY_BASE_URL,
  CLOUDINARY_CLOUD_NAME,
  IMAGE_PRESETS,
  ImagePreset,
} from '@/constants/cloudinary';

export function isCloudinaryUrl(source: string) {
  return source.includes('res.cloudinary.com');
}

export function isRemoteUrl(source: string) {
  return source.startsWith('http://') || source.startsWith('https://');
}

/**
 * Builds an optimized Cloudinary delivery URL from a public ID or passes through full URLs.
 */
export function getCloudinaryUrl(
  source: string | null | undefined,
  preset: ImagePreset = 'avatar',
): string | undefined {
  if (!source?.trim()) return undefined;

  const trimmed = source.trim();

  if (isRemoteUrl(trimmed)) {
    return trimmed;
  }

  const transforms = IMAGE_PRESETS[preset];
  const publicId = trimmed.replace(/^\/+/, '');
  return `${CLOUDINARY_BASE_URL}/${transforms}/${publicId}`;
}

export function getCloudinaryCloudName() {
  return CLOUDINARY_CLOUD_NAME;
}
