import { Booking } from '@/services/booking.api';

export type CustomerNotification = {
  id: string;
  type: 'booking:approved';
  title: string;
  message: string;
  bookingId: number;
  read: boolean;
  createdAt: string;
  booking?: Partial<Booking> & { panditName?: string };
};

export type CustomerBookingNotification = {
  type: 'booking:approved';
  title: string;
  message: string;
  booking: {
    id: number;
    panditName: string;
    serviceName: string;
    advanceAmount: number;
    status: string;
    updatedAt?: string;
    createdAt?: string;
  };
};

export function notificationFromBooking(booking: Booking): CustomerNotification {
  return {
    id: `booking-approved-${booking.id}`,
    type: 'booking:approved',
    title: 'Booking Approved',
    message: `${booking.panditName} approved your ${booking.serviceName} booking. Pay 40% advance now to confirm.`,
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
    map.set(item.id, current ? { ...item, read: current.read } : item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
