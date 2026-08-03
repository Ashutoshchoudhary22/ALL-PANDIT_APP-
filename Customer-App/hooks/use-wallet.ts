import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createWalletTopupApi,
  getMyWalletApi,
  verifyWalletTopupApi,
  VerifyWalletTopupPayload,
} from '@/services/wallet.api';

export function useMyWalletQuery(enabled = true) {
  return useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: getMyWalletApi,
    enabled,
  });
}

export function useCreateWalletTopupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => createWalletTopupApi(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
    },
  });
}

export function useVerifyWalletTopupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyWalletTopupPayload) => verifyWalletTopupApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
    },
  });
}
