import { apiClient } from '@/lib/axios';

export type PanditBooking = {
  id: number;
  customerId: number;
  panditProfileId: number;
  panditName: string;
  customerName: string;
  customerMobile: string | null;
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
  paymentStatus: 'pending' | 'advance_paid' | 'fully_paid';
  status: 'payment_pending' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
};

export type PanditBookingNotification = {
  type: 'booking:new';
  title: string;
  message: string;
  booking: PanditBooking;
};

export async function getPanditBookingsApi() {
  const { data } = await apiClient.get<{ success: boolean; data: PanditBooking[] }>(
    '/api/bookings/pandit/me',
  );
  return data;
}
