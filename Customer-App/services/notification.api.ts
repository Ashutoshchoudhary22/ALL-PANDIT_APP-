import { Booking } from '@/services/booking.api';
import { ADVANCE_RATE } from '@/lib/booking-pricing';
import { apiClient } from '@/lib/axios';

export type CustomerNotification = {
  id: string;
  serverId?: number;
  type:
    | 'booking:submitted'
    | 'booking:approved'
    | 'booking:rejected'
    | 'booking:finish_otp'
    | 'booking:review_request';
  title: string;
  message: string;
  bookingId: number;
  read: boolean;
  createdAt: string;
  booking?: Partial<Booking> & { panditName?: string };
};

type ServerNotification = {
  id: number;
  type: CustomerNotification['type'];
  title: string;
  message: string;
  bookingId: number | null;
  read: boolean;
  createdAt: string;
};

function clientNotificationId(type: CustomerNotification['type'], bookingId: number, serverId: number) {
  const prefix = {
    'booking:submitted': 'booking-submitted',
    'booking:approved': 'booking-approved',
    'booking:rejected': 'booking-rejected',
    'booking:finish_otp': 'booking-finish',
    'booking:review_request': 'booking-review',
  }[type];

  return bookingId ? `${prefix}-${bookingId}` : `notification-${serverId}`;
}

export function notificationFromServer(row: ServerNotification): CustomerNotification {
  return {
    id: clientNotificationId(row.type, row.bookingId || 0, row.id),
    serverId: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    bookingId: row.bookingId || 0,
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

export type CustomerBookingNotification = {
  type:
    | 'booking:submitted'
    | 'booking:approved'
    | 'booking:rejected'
    | 'booking:finish_otp'
    | 'booking:review_request'
    | 'booking:updated';
  title: string;
  message: string;
  booking: Booking;
};

export function notificationFromReviewRequest(booking: Booking): CustomerNotification {
  return {
    id: `booking-review-${booking.id}`,
    type: 'booking:review_request',
    title: 'Rate Your Puja Experience',
    message: `How was your ${booking.serviceName} with ${booking.panditName}? Share a rating and review.`,
    bookingId: booking.id,
    read: false,
    createdAt: booking.completedAt || booking.updatedAt || booking.createdAt,
    booking,
  };
}

export function notificationFromBooking(booking: Booking): CustomerNotification {
  return {
    id: `booking-approved-${booking.id}`,
    type: 'booking:approved',
    title: 'Booking Approved',
    message: `${booking.panditName} approved your ${booking.serviceName} booking. Pay ${Math.round(ADVANCE_RATE * 100)}% advance now to confirm.`,
    bookingId: booking.id,
    read: false,
    createdAt: booking.updatedAt || booking.createdAt,
    booking,
  };
}

export function mergeNotifications(
  existing: CustomerNotification[],
  incoming: CustomerNotification[],
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
