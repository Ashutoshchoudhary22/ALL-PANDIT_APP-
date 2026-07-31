import { PanditBooking } from '@/services/booking.api';

export type PanditNotification = {
  id: string;
  type: 'booking:new';
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
    title: 'New Booking Received',
    message: `${booking.customerName} booked ${booking.serviceName}. 40% advance paid.`,
    bookingId: booking.id,
    read: false,
    createdAt: booking.createdAt,
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
