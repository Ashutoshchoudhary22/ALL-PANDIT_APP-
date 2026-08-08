import { apiClient } from '@/lib/axios';

export type AdminCustomerWallet = {
  customerId: number;
  customerName: string;
  mobile: string;
  profileImage: string | null;
  balance: number;
  updatedAt: string | null;
  transactionCount: number;
};

export type AdminWalletTransaction = {
  id: number;
  type: 'topup' | 'debit_advance' | 'debit_remaining' | 'refund' | 'adjustment';
  amount: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  description: string | null;
  referenceType: 'razorpay' | 'booking' | 'admin' | null;
  referenceId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
};

export type AdminCustomerWalletDetail = {
  customerId: number;
  customerName: string;
  mobile: string;
  profileImage: string | null;
  balance: number;
  updatedAt: string | null;
  transactions: AdminWalletTransaction[];
};

type ListWalletsResponse = {
  success: boolean;
  data: {
    totalBalance: number;
    wallets: AdminCustomerWallet[];
  };
};

type WalletDetailResponse = {
  success: boolean;
  data: AdminCustomerWalletDetail;
};

export async function listCustomerWalletsApi() {
  const { data } = await apiClient.get<ListWalletsResponse>('/api/admin/wallets');
  return data;
}

export async function getCustomerWalletTransactionsApi(customerId: number) {
  const { data } = await apiClient.get<WalletDetailResponse>(
    `/api/admin/wallets/${customerId}/transactions`,
  );
  return data;
}
