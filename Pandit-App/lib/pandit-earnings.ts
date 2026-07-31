import { PanditBooking } from '@/services/booking.api';

export type MonthEarning = {
  monthKey: string;
  label: string;
  amount: number;
  bookingCount: number;
};

export type PanditEarningsSummary = {
  todayAmount: number;
  todayBookingCount: number;
  currentMonthAmount: number;
  currentMonthBookingCount: number;
  currentMonthLabel: string;
  monthlyBreakdown: MonthEarning[];
  todayBookingsCount: number;
  upcomingBookingsCount: number;
  completedBookingsCount: number;
};

function getLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const parsed = new Date(year, month - 1, 1);
  return parsed.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function isConfirmedBooking(booking: PanditBooking) {
  return booking.status === 'confirmed' || booking.status === 'completed';
}

function bookingEarningAmount(booking: PanditBooking) {
  return booking.advanceAmount;
}

export function computePanditEarnings(bookings: PanditBooking[]): PanditEarningsSummary {
  const today = getLocalIsoDate();
  const currentMonthKey = getMonthKey();

  const confirmed = bookings.filter(isConfirmedBooking);

  const todayBookings = confirmed.filter((booking) => booking.bookingDate === today);
  const todayAmount = todayBookings.reduce((sum, booking) => sum + bookingEarningAmount(booking), 0);

  const monthMap = new Map<string, { amount: number; bookingCount: number }>();

  for (const booking of confirmed) {
    const monthKey = booking.bookingDate.slice(0, 7);
    const current = monthMap.get(monthKey) ?? { amount: 0, bookingCount: 0 };
    monthMap.set(monthKey, {
      amount: current.amount + bookingEarningAmount(booking),
      bookingCount: current.bookingCount + 1,
    });
  }

  const monthlyBreakdown = Array.from(monthMap.entries())
    .map(([monthKey, stats]) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      amount: stats.amount,
      bookingCount: stats.bookingCount,
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  const currentMonthStats = monthMap.get(currentMonthKey) ?? { amount: 0, bookingCount: 0 };

  const upcomingBookingsCount = confirmed.filter((booking) => booking.bookingDate > today).length;
  const completedBookingsCount = confirmed.filter((booking) => booking.status === 'completed').length;

  return {
    todayAmount,
    todayBookingCount: todayBookings.length,
    currentMonthAmount: currentMonthStats.amount,
    currentMonthBookingCount: currentMonthStats.bookingCount,
    currentMonthLabel: formatMonthLabel(currentMonthKey),
    monthlyBreakdown,
    todayBookingsCount: todayBookings.length,
    upcomingBookingsCount,
    completedBookingsCount,
  };
}

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}
