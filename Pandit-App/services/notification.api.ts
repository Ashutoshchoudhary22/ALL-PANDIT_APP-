import { PanditBooking } from '@/services/booking.api';

export type PanditNotification = {
  id: string;
  type: 'booking:new' | 'booking:confirmed';
  title: string;
  message: string;
  bookingId: number;
  read: boolean;
  createdAt: string;
  booking?: PanditBooking;
};

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
    message: `${booking.customerName} paid 40% advance for ${booking.serviceName}. Booking is confirmed.`,
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
    map.set(item.id, current ? { ...item, read: current.read } : item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
