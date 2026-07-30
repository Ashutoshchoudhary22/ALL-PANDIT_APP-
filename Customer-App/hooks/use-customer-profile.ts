import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CreateCustomerProfilePayload,
  UpdateCustomerProfilePayload,
  createCustomerProfileApi,
  getMyCustomerProfileApi,
  updateCustomerProfileApi,
} from '@/services/customer-profile.api';

export function useMyCustomerProfileQuery(enabled = true) {
  return useQuery({
    queryKey: ['customer-profile', 'me'],
    queryFn: getMyCustomerProfileApi,
    enabled,
    retry: false,
  });
}

export function useCreateCustomerProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerProfilePayload) => createCustomerProfileApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile', 'me'] });
    },
  });
}

export function useUpdateCustomerProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCustomerProfilePayload) => updateCustomerProfileApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile', 'me'] });
    },
  });
}
