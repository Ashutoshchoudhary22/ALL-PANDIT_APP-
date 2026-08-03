import { PanditBooking } from '@/services/booking.api';
import { advancePercentLabel, remainingPercentLabel } from '@/lib/booking-pricing';

export type MonthEarning = {
  monthKey: string;
  label: string;
  amount: number;
  bookingCount: number;
};

export type EarningPaymentMethod = 'online' | 'cash';

export type EarningTransaction = {
  id: string;
  bookingId: number;
  customerName: string;
  serviceName: string;
  amount: number;
  paymentMethod: EarningPaymentMethod;
  paymentLabel: string;
  paidAt: string;
  sortKey: number;
};

export type PanditEarningsSummary = {
  totalEarned: number;
  todayAmount: number;
  todayTransactionCount: number;
  todayBookingCount: number;
  todayBookingsCount: number;
  upcomingBookingsCount: number;
  currentMonthAmount: number;
  currentMonthTransactionCount: number;
  currentMonthBookingCount: number;
  currentMonthLabel: string;
  monthlyBreakdown: MonthEarning[];
  transactions: EarningTransaction[];
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

function parsePaidAt(value: string | null | undefined, fallback: string) {
  if (!value) return { iso: fallback, sortKey: new Date(fallback).getTime() || 0 };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { iso: fallback, sortKey: new Date(fallback).getTime() || 0 };
  }
  return { iso: value, sortKey: parsed.getTime() };
}

export function buildEarningTransactions(bookings: PanditBooking[]): EarningTransaction[] {
  const transactions: EarningTransaction[] = [];

  for (const booking of bookings) {
    const fallbackDate = `${booking.bookingDate}T${booking.bookingTime || '12:00:00'}`;

    if (booking.advancePaidAt || booking.paymentStatus === 'advance_paid' || booking.paymentStatus === 'fully_paid') {
      const paid = parsePaidAt(booking.advancePaidAt, booking.updatedAt || fallbackDate);
      transactions.push({
        id: `${booking.id}-advance`,
        bookingId: booking.id,
        customerName: booking.customerName,
        serviceName: booking.serviceName,
        amount: booking.advanceAmount,
        paymentMethod: 'online',
        paymentLabel: `${advancePercentLabel()} Advance • Online`,
        paidAt: paid.iso,
        sortKey: paid.sortKey,
      });
    }

    if (
      booking.status === 'completed' &&
      booking.paymentStatus === 'fully_paid' &&
      booking.remainingAmount > 0
    ) {
      const method: EarningPaymentMethod =
        booking.remainingPaymentMethod === 'cash' ? 'cash' : 'online';
      const paid = parsePaidAt(booking.completedAt, booking.updatedAt || fallbackDate);
      transactions.push({
        id: `${booking.id}-remaining`,
        bookingId: booking.id,
        customerName: booking.customerName,
        serviceName: booking.serviceName,
        amount: booking.remainingAmount,
        paymentMethod: method,
        paymentLabel: `${remainingPercentLabel()} Remaining • ${method === 'cash' ? 'Cash' : 'Online'}`,
        paidAt: paid.iso,
        sortKey: paid.sortKey,
      });
    }
  }

  return transactions.sort((a, b) => b.sortKey - a.sortKey);
}

export function computePanditEarnings(bookings: PanditBooking[]): PanditEarningsSummary {
  const today = getLocalIsoDate();
  const currentMonthKey = getMonthKey();
  const transactions = buildEarningTransactions(bookings);

  const totalEarned = transactions.reduce((sum, item) => sum + item.amount, 0);

  const todayTransactions = transactions.filter((item) => {
    const paidDate = getLocalIsoDate(new Date(item.paidAt));
    return paidDate === today;
  });
  const todayAmount = todayTransactions.reduce((sum, item) => sum + item.amount, 0);

  const monthMap = new Map<string, { amount: number; bookingCount: number }>();
  for (const item of transactions) {
    const monthKey = getLocalIsoDate(new Date(item.paidAt)).slice(0, 7);
    const current = monthMap.get(monthKey) ?? { amount: 0, bookingCount: 0 };
    monthMap.set(monthKey, {
      amount: current.amount + item.amount,
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
  const completedBookingsCount = bookings.filter((booking) => booking.status === 'completed').length;

  const todayBookings = bookings.filter((booking) => booking.bookingDate === today);
  const confirmedOrBeyond = bookings.filter(
    (booking) =>
      booking.status === 'confirmed' ||
      booking.status === 'in_progress' ||
      booking.status === 'awaiting_payment' ||
      booking.status === 'completed',
  );
  const upcomingBookingsCount = confirmedOrBeyond.filter((booking) => booking.bookingDate > today).length;

  return {
    totalEarned,
    todayAmount,
    todayTransactionCount: todayTransactions.length,
    todayBookingCount: todayBookings.filter((b) => confirmedOrBeyond.some((c) => c.id === b.id)).length,
    todayBookingsCount: todayBookings.length,
    upcomingBookingsCount,
    currentMonthAmount: currentMonthStats.amount,
    currentMonthTransactionCount: currentMonthStats.bookingCount,
    currentMonthBookingCount: currentMonthStats.bookingCount,
    currentMonthLabel: formatMonthLabel(currentMonthKey),
    monthlyBreakdown,
    transactions,
    completedBookingsCount,
  };
}

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatEarningDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatEarningTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
