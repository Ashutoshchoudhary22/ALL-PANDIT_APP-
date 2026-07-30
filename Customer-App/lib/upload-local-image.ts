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
