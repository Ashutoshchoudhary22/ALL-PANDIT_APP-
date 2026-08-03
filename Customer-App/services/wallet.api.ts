import { apiClient } from '@/lib/axios';
import { BookingCustomerPrefill, BookingPaymentDetails } from '@/services/booking.api';

export type WalletTransaction = {
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

export type WalletSummary = {
  balance: number;
  updatedAt: string | null;
  transactions: WalletTransaction[];
};

export type WalletTopupPaymentDetails = BookingPaymentDetails & {
  topupAmount: number;
};

export type CreateWalletTopupResponse = {
  success: boolean;
  message: string;
  payment: WalletTopupPaymentDetails;
  customer?: BookingCustomerPrefill;
};

export type VerifyWalletTopupPayload = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export async function getMyWalletApi() {
  const { data } = await apiClient.get<{ success: boolean; data: WalletSummary }>('/api/wallet/me');
  return data;
}

export async function createWalletTopupApi(amount: number) {
  const { data } = await apiClient.post<CreateWalletTopupResponse>('/api/wallet/topup', { amount });
  return data;
}

export async function verifyWalletTopupApi(payload: VerifyWalletTopupPayload) {
  const { data } = await apiClient.post<{
    success: boolean;
    message: string;
    data: { balance: number; creditedAmount: number };
  }>('/api/wallet/verify-topup', payload);
  return data;
}
