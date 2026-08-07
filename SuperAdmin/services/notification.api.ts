import { AdminRecentBooking } from '@/services/admin-stats.api';
import { PanditProfile } from '@/services/admin-profiles.api';

export type AdminNotificationType =
  | 'admin:booking:new'
  | 'admin:pandit:pending'
  | 'admin:pandit:update';

export type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  profileId?: number;
  bookingId?: number;
};

export function notificationFromPendingPandit(profile: PanditProfile): AdminNotification {
  return {
    id: `pandit-pending-${profile.id}`,
    type: 'admin:pandit:pending',
    title: 'New Pandit Registration',
    message: `${profile.name} submitted a profile for approval.`,
    read: false,
    createdAt: profile.memberSince || new Date().toISOString(),
    profileId: profile.id,
  };
}

export function notificationFromPanditUpdate(profile: PanditProfile): AdminNotification {
  return {
    id: `pandit-update-${profile.id}`,
    type: 'admin:pandit:update',
    title: 'Profile Update Request',
    message: `${profile.name} requested profile changes. Review and approve.`,
    read: false,
    createdAt: profile.pendingProfile?.submittedAt || new Date().toISOString(),
    profileId: profile.id,
  };
}

export function notificationFromBooking(booking: AdminRecentBooking): AdminNotification {
  return {
    id: `booking-${booking.id}`,
    type: 'admin:booking:new',
    title: 'New Booking',
    message: `${booking.customerName} booked ${booking.serviceName} with ${booking.panditName}.`,
    read: false,
    createdAt: booking.bookingDate
      ? `${booking.bookingDate}T${booking.bookingTime || '12:00:00'}`
      : new Date().toISOString(),
    bookingId: booking.id,
  };
}

export function buildAdminNotifications(
  profiles: PanditProfile[],
  recentBookings: AdminRecentBooking[],
): AdminNotification[] {
  const items: AdminNotification[] = [];

  for (const profile of profiles) {
    if (profile.status === 'pending') {
      items.push(notificationFromPendingPandit(profile));
    }
    if (profile.updateRequestStatus === 'pending') {
      items.push(notificationFromPanditUpdate(profile));
    }
  }

  for (const booking of recentBookings) {
    if (booking.status !== 'cancelled') {
      items.push(notificationFromBooking(booking));
    }
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function mergeNotifications(
  existing: AdminNotification[],
  incoming: AdminNotification[],
) {
  const map = new Map(existing.map((item) => [item.id, item]));

  for (const item of incoming) {
    const current = map.get(item.id);
    map.set(item.id, current ? { ...item, read: current.read } : item);
  }

  return Array.from(map.values())
    .filter((item) => incoming.some((next) => next.id === item.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
