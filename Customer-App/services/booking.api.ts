import { apiClient } from '@/lib/axios';

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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingPayload = {
  panditProfileId: number;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  specialRequirements?: string;
  samagriRequired: boolean;
};

export async function createBookingApi(payload: CreateBookingPayload) {
  const { data } = await apiClient.post<{ success: boolean; message: string; data: Booking }>(
    '/api/bookings',
    payload,
  );
  return data;
}

export async function getMyBookingsApi() {
  const { data } = await apiClient.get<{ success: boolean; data: Booking[] }>('/api/bookings/me');
  return data;
}
