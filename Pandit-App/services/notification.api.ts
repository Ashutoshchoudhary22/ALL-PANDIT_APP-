import { PanditBooking } from '@/services/booking.api';
import { advancePercentLabel } from '@/lib/booking-pricing';
import { apiClient } from '@/lib/axios';

export type PanditNotification = {
  id: string;
  serverId?: number;
  type: 'booking:new' | 'booking:confirmed';
  title: string;
  message: string;
  bookingId: number;
  read: boolean;
  createdAt: string;
  booking?: PanditBooking;
};

type ServerNotification = {
  id: number;
  type: PanditNotification['type'];
  title: string;
  message: string;
  bookingId: number | null;
  read: boolean;
  createdAt: string;
};

export function notificationFromServer(row: ServerNotification): PanditNotification {
  const bookingId = row.bookingId || 0;
  const id =
    row.type === 'booking:confirmed'
      ? `booking-confirmed-${bookingId || row.id}`
      : `booking-${bookingId || row.id}`;

  return {
    id,
    serverId: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    bookingId,
    read: row.read,
    createdAt: row.createdAt,
  };
}

export async function getMyNotificationsApi() {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { items: ServerNotification[]; unreadCount: number };
  }>('/api/notifications');
  return data;
}

export async function markNotificationsReadApi(payload: { ids?: number[]; all?: boolean }) {
  const { data } = await apiClient.patch<{ success: boolean; data: { updated: number } }>(
    '/api/notifications/read',
    payload,
  );
  return data;
}

export function notificationFromBooking(booking: PanditBooking): PanditNotification {
  return {
    id: `booking-${booking.id}`,
    type: 'booking:new',
    title: 'New Booking Request',
    message: `${booking.customerName} requested ${booking.serviceName}. Please review and approve.`,
    bookingId: booking.id,
    read: false,
    createdAt: booking.createdAt,
    booking,
  };
}

export function notificationFromConfirmedBooking(booking: PanditBooking): PanditNotification {
  return {
    id: `booking-confirmed-${booking.id}`,
    type: 'booking:confirmed',
    title: 'Payment Received',
    message: `${booking.customerName} paid ${advancePercentLabel()} advance for ${booking.serviceName}. Booking is confirmed.`,
    bookingId: booking.id,
    read: false,
    createdAt: booking.updatedAt || booking.createdAt,
    booking,
  };
}

export function mergeNotifications(
  existing: PanditNotification[],
  incoming: PanditNotification[],
) {
  const map = new Map(existing.map((item) => [item.id, item]));

  for (const item of incoming) {
    const current = map.get(item.id);
    map.set(item.id, current ? { ...item, read: current.read || item.read } : item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
