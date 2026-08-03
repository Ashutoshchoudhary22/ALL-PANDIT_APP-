import { apiClient } from '@/lib/axios';

export type BookingStatus =
  | 'payment_pending'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_payment'
  | 'cancelled'
  | 'completed';
export type PaymentStatus = 'pending' | 'advance_paid' | 'fully_paid';

export type Booking = {
  id: number;
  customerId: number;
  panditProfileId: number;
  panditName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  specialRequirements: string | null;
  samagriRequired: boolean;
  basePrice: number;
  samagriCharge: number;
  totalPrice: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: BookingStatus;
  needsReview?: boolean;
  reviewRating?: number | null;
  advancePaymentMethod?: 'razorpay' | 'wallet' | null;
  walletAdvanceAmount?: number;
  sessionOtp?: string;
  sessionOtpPurpose?: 'start' | 'finish';
  sessionOtpHint?: string;
  startedAt?: string | null;
  finishRequestedAt?: string | null;
  remainingPaymentMethod?: 'cash' | 'online' | null;
  advancePaidAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingPayload = {
  panditProfileId: number;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  latitude?: number;
  longitude?: number;
  specialRequirements?: string;
  samagriRequired: boolean;
};

export type BookingPaymentDetails = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  advanceAmount: number;
};

export type BookingCustomerPrefill = {
  name?: string;
  email?: string;
  contact?: string;
};

export type CreateBookingResponse = {
  success: boolean;
  message: string;
  data: Booking;
  payment?: BookingPaymentDetails;
  customer?: BookingCustomerPrefill;
};

export type VerifyBookingPaymentPayload = {
  bookingId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export async function createBookingApi(payload: CreateBookingPayload) {
  const { data } = await apiClient.post<CreateBookingResponse>('/api/bookings', payload);
  return data;
}

export async function verifyBookingPaymentApi(payload: VerifyBookingPaymentPayload) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: Booking }>(
    '/api/bookings/verify-payment',
    payload,
  );
  return data;
}

export type RetryBookingPaymentResponse = CreateBookingResponse;

export async function retryBookingPaymentApi(bookingId: number) {
  const { data } = await apiClient.post<RetryBookingPaymentResponse>(
    `/api/bookings/${bookingId}/retry-payment`,
  );
  return data;
}

export async function payBookingWithWalletApi(bookingId: number) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: Booking }>(
    `/api/bookings/${bookingId}/pay-with-wallet`,
  );
  return data;
}

export async function cancelBookingApi(bookingId: number) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: Booking }>(
    `/api/bookings/${bookingId}/cancel`,
  );
  return data;
}

export async function getMyBookingsApi() {
  const { data } = await apiClient.get<{ success: boolean; data: Booking[] }>('/api/bookings/me');
  return data;
}

export async function submitBookingReviewApi(
  bookingId: number,
  payload: { rating: number; comment?: string },
) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: Booking }>(
    `/api/bookings/${bookingId}/review`,
    payload,
  );
  return data;
}
