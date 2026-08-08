import { useQuery } from '@tanstack/react-query';

import {
  getCustomerWalletTransactionsApi,
  listCustomerWalletsApi,
} from '@/services/admin-wallets.api';

export function useCustomerWalletsQuery(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'customer-wallets'],
    queryFn: listCustomerWalletsApi,
    enabled,
  });
}

export function useCustomerWalletTransactionsQuery(customerId: number | null) {
  return useQuery({
    queryKey: ['admin', 'customer-wallet-transactions', customerId],
    queryFn: () => getCustomerWalletTransactionsApi(customerId!),
    enabled: customerId != null,
  });
}
