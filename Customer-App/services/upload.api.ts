import { API_BASE_URL } from '@/constants/api';
import { CloudinaryFolder } from '@/constants/cloudinary';
import axios from 'axios';

export type UploadImageResponse = {
  success: boolean;
  message: string;
  data?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    folder: string;
  };
};

export type CloudinaryStatusResponse = {
  success: boolean;
  data?: {
    configured: boolean;
    cloudName: string | null;
    folders: string[];
  };
};

export async function getCloudinaryStatusApi() {
  const { data } = await axios.get<CloudinaryStatusResponse>(
    `${API_BASE_URL}/api/uploads/status`,
  );
  return data;
}

export async function uploadImageApi(
  localUri: string,
  token: string,
  folder: CloudinaryFolder = 'profiles',
) {
  const formData = new FormData();
  const filename = localUri.split('/').pop() || `photo-${Date.now()}.jpg`;
  const extension = filename.split('.').pop()?.toLowerCase();
  const mimeType =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : extension === 'gif'
          ? 'image/gif'
          : 'image/jpeg';

  formData.append('image', {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);
  formData.append('folder', folder);

  const { data } = await axios.post<UploadImageResponse>(
    `${API_BASE_URL}/api/uploads/image`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    },
  );

  return data;
}

export async function deleteImageApi(publicId: string, token: string) {
  const { data } = await axios.delete<{ success: boolean; message: string }>(
    `${API_BASE_URL}/api/uploads/image`,
    {
      params: { publicId },
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}
