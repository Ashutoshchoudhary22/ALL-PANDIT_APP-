import { Booking, BookingStatus } from '@/services/booking.api';

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'pending',
  'payment_pending',
  'confirmed',
  'in_progress',
  'awaiting_payment',
];

export const HISTORY_BOOKING_STATUSES: BookingStatus[] = ['completed', 'cancelled'];

export function isActiveBooking(status: BookingStatus) {
  return ACTIVE_BOOKING_STATUSES.includes(status);
}

export function isHistoryBooking(status: BookingStatus) {
  return HISTORY_BOOKING_STATUSES.includes(status);
}

export function formatBookingDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatBookingTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatCompletedAt(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getHistorySortTime(booking: Booking) {
  if (booking.completedAt) return new Date(booking.completedAt).getTime();
  return new Date(booking.updatedAt || `${booking.bookingDate}T00:00:00`).getTime();
}

export function sortHistoryBookings(bookings: Booking[]) {
  return [...bookings].sort((a, b) => getHistorySortTime(b) - getHistorySortTime(a));
}

export function getRecentBookingSortTime(booking: Booking) {
  return new Date(booking.updatedAt || booking.createdAt || `${booking.bookingDate}T00:00:00`).getTime();
}

export function sortRecentBookings(bookings: Booking[], limit = 3) {
  return [...bookings]
    .sort((a, b) => getRecentBookingSortTime(b) - getRecentBookingSortTime(a))
    .slice(0, limit);
}
