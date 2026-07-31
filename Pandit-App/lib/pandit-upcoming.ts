import { PanditBooking } from '@/services/booking.api';

function getLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function bookingDateTimeValue(booking: PanditBooking) {
  const time = booking.bookingTime?.match(/^(\d{1,2}):(\d{2})/);
  const hours = time ? Number(time[1]) : 0;
  const minutes = time ? Number(time[2]) : 0;
  const parsed = new Date(`${booking.bookingDate}T00:00:00`);
  parsed.setHours(hours, minutes, 0, 0);
  return parsed.getTime();
}

export function getUpcomingPujas(bookings: PanditBooking[]) {
  const today = getLocalIsoDate();

  return bookings
    .filter((booking) => booking.status === 'confirmed' && booking.bookingDate >= today)
    .sort((a, b) => bookingDateTimeValue(a) - bookingDateTimeValue(b));
}

export function formatUpcomingBadge(bookingDate: string) {
  const today = getLocalIsoDate();
  const tomorrow = getLocalIsoDate(new Date(Date.now() + 86400000));

  if (bookingDate === today) return 'Today';
  if (bookingDate === tomorrow) return 'Tomorrow';

  const parsed = new Date(`${bookingDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return bookingDate;

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatUpcomingDateTime(bookingDate: string, bookingTime: string) {
  const parsed = new Date(`${bookingDate}T00:00:00`);
  const dateLabel = Number.isNaN(parsed.getTime())
    ? bookingDate
    : parsed.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const match = bookingTime.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return `${dateLabel} • ${bookingTime}`;

  const timeDate = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
  const timeLabel = timeDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${dateLabel} • ${timeLabel}`;
}
