import { CloudinaryFolder } from '@/constants/cloudinary';
import { uploadImageApi } from '@/services/upload.api';

export async function uploadLocalImageIfNeeded(
  uri: string | null | undefined,
  token: string,
  folder: CloudinaryFolder = 'profiles',
): Promise<string | undefined> {
  if (!uri?.trim()) return undefined;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri.trim();

  const result = await uploadImageApi(uri, token, folder);
  if (!result.success || !result.data?.url) {
    throw new Error(result.message || 'Upload failed');
  }

  return result.data.url;
}

export async function uploadProfileImages(
  token: string,
  images: {
    profilePhoto?: string | null;
    aadhar?: string | null;
    panditCertificate?: string | null;
    passbook?: string | null;
  },
) {
  const profileImage = await uploadLocalImageIfNeeded(images.profilePhoto, token, 'profiles');
  const aadharImage = await uploadLocalImageIfNeeded(images.aadhar, token, 'documents');
  const panditCertificateImage = await uploadLocalImageIfNeeded(
    images.panditCertificate,
    token,
    'documents',
  );
  const passbookImage = await uploadLocalImageIfNeeded(images.passbook, token, 'documents');

  return { profileImage, aadharImage, panditCertificateImage, passbookImage };
}
