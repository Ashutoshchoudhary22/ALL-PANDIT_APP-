import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CreatePanditProfilePayload,
  createPanditProfileApi,
  getMyPanditProfileApi,
  updatePanditProfileApi,
  UpdatePanditProfilePayload,
} from '@/services/pandit-profile.api';

export function useMyPanditProfileQuery(enabled = true) {
  return useQuery({
    queryKey: ['pandit-profile', 'me'],
    queryFn: getMyPanditProfileApi,
    enabled,
    retry: false,
  });
}

export function useCreatePanditProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePanditProfilePayload) => createPanditProfileApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pandit-profile', 'me'] });
    },
  });
}

export function useUpdatePanditProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePanditProfilePayload) => updatePanditProfileApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pandit-profile', 'me'] });
    },
  });
}
