import { apiClient } from '@/lib/axios';

export type PanditBooking = {
  id: number;
  customerId: number;
  panditProfileId: number;
  panditName: string;
  customerName: string;
  customerMobile: string | null;
  customerProfileImage: string | null;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  specialRequirements: string | null;
  samagriRequired: boolean;
  basePrice: number;
  samagriCharge: number;
  totalPrice: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentStatus: 'pending' | 'advance_paid' | 'fully_paid';
  status:
    | 'payment_pending'
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'awaiting_payment'
    | 'cancelled'
    | 'completed';
  startedAt: string | null;
  finishRequestedAt: string | null;
  remainingPaymentMethod: 'cash' | 'online' | null;
  advancePaidAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingPaymentDetails = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  remainingAmount?: number;
  advanceAmount?: number;
};

export type BookingCustomerPrefill = {
  name?: string;
  email?: string;
  contact?: string;
};

export type RemainingPaymentResponse = {
  success: boolean;
  message: string;
  data: PanditBooking;
  payment?: BookingPaymentDetails;
  customer?: BookingCustomerPrefill;
};

export type VerifyRemainingPaymentPayload = {
  bookingId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export async function getPanditBookingsApi() {
  const { data } = await apiClient.get<{ success: boolean; data: PanditBooking[] }>(
    '/api/bookings/pandit/me',
  );
  return data;
}

export async function getPanditBookingRequestsApi() {
  const { data } = await apiClient.get<{ success: boolean; data: PanditBooking[] }>(
    '/api/bookings/pandit/requests',
  );
  return data;
}

export async function approvePanditBookingApi(bookingId: number) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: PanditBooking }>(
    `/api/bookings/pandit/${bookingId}/approve`,
  );
  return data;
}

export async function rejectPanditBookingApi(bookingId: number) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: PanditBooking }>(
    `/api/bookings/pandit/${bookingId}/reject`,
  );
  return data;
}

export async function startBookingPujaApi(bookingId: number, otp: string) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: PanditBooking }>(
    `/api/bookings/pandit/${bookingId}/start`,
    { otp },
  );
  return data;
}

export async function requestFinishBookingPujaApi(bookingId: number) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: PanditBooking }>(
    `/api/bookings/pandit/${bookingId}/request-finish`,
  );
  return data;
}

export async function verifyFinishBookingOtpApi(bookingId: number, otp: string) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: PanditBooking }>(
    `/api/bookings/pandit/${bookingId}/verify-finish-otp`,
    { otp },
  );
  return data;
}

export async function completeBookingCashApi(bookingId: number) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: PanditBooking }>(
    `/api/bookings/pandit/${bookingId}/complete-cash`,
  );
  return data;
}

export async function retryRemainingPaymentApi(bookingId: number) {
  const { data } = await apiClient.post<RemainingPaymentResponse>(
    `/api/bookings/pandit/${bookingId}/retry-remaining-payment`,
  );
  return data;
}

export async function verifyRemainingPaymentApi(payload: VerifyRemainingPaymentPayload) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: PanditBooking }>(
    '/api/bookings/verify-remaining-payment',
    payload,
  );
  return data;
}
