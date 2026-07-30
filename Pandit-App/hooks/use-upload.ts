import { useMutation, useQuery } from '@tanstack/react-query';

import { CloudinaryFolder } from '@/constants/cloudinary';
import {
  deleteImageApi,
  getCloudinaryStatusApi,
  uploadImageApi,
} from '@/services/upload.api';

export function useCloudinaryStatusQuery() {
  return useQuery({
    queryKey: ['cloudinary-status'],
    queryFn: getCloudinaryStatusApi,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadImageMutation() {
  return useMutation({
    mutationFn: ({
      uri,
      token,
      folder,
    }: {
      uri: string;
      token: string;
      folder?: CloudinaryFolder;
    }) => uploadImageApi(uri, token, folder),
  });
}

export function useDeleteImageMutation() {
  return useMutation({
    mutationFn: ({ publicId, token }: { publicId: string; token: string }) =>
      deleteImageApi(publicId, token),
  });
}
