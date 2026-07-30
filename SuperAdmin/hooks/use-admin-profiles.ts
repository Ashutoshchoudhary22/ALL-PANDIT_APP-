import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getPanditProfileApi,
  listCustomerProfilesApi,
  listPanditProfilesApi,
  PanditProfileStatus,
  updatePanditProfileStatusApi,
} from '@/services/admin-profiles.api';

export function usePanditProfilesQuery(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'pandit-profiles'],
    queryFn: listPanditProfilesApi,
    enabled,
  });
}

export function usePanditProfileQuery(profileId: number | null) {
  return useQuery({
    queryKey: ['admin', 'pandit-profile', profileId],
    queryFn: () => getPanditProfileApi(profileId!),
    enabled: profileId != null,
  });
}

export function useUpdatePanditProfileStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, status }: { profileId: number; status: PanditProfileStatus }) =>
      updatePanditProfileStatusApi(profileId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pandit-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pandit-profile', variables.profileId] });
    },
  });
}

export function useCustomerProfilesQuery(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'customer-profiles'],
    queryFn: listCustomerProfilesApi,
    enabled,
  });
}
