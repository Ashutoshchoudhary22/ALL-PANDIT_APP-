import { apiClient } from '@/lib/axios';
import { PanditProfile } from '@/services/admin-profiles.api';

export type AdminNotificationBooking = {
  id: number;
  customerName: string;
  panditName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: string;
  createdAt?: string | null;
};

export type AdminNotificationsFeed = {
  pendingPandits: Array<{ id: number; name: string; memberSince?: string | null }>;
  pendingProfileUpdates: Array<{ id: number; name: string; submittedAt?: string | null }>;
  recentBookings: AdminNotificationBooking[];
};

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

export function notificationFromBooking(booking: AdminNotificationBooking): AdminNotification {
  return {
    id: `booking-${booking.id}`,
    type: 'admin:booking:new',
    title: 'New Booking',
    message: `${booking.customerName} booked ${booking.serviceName} with ${booking.panditName}.`,
    read: false,
    createdAt:
      booking.createdAt ||
      (booking.bookingDate
        ? `${booking.bookingDate}T${booking.bookingTime || '12:00:00'}`
        : new Date().toISOString()),
    bookingId: booking.id,
  };
}

export function notificationFromPushData(data: {
  type: AdminNotificationType;
  title: string;
  message: string;
  bookingId?: number;
  profileId?: number;
  createdAt?: string;
}): AdminNotification {
  const id =
    data.type === 'admin:booking:new' && data.bookingId
      ? `booking-${data.bookingId}`
      : data.type === 'admin:pandit:pending' && data.profileId
        ? `pandit-pending-${data.profileId}`
        : data.type === 'admin:pandit:update' && data.profileId
          ? `pandit-update-${data.profileId}`
          : `push-${data.type}-${data.bookingId || data.profileId || Date.now()}`;

  return {
    id,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    createdAt: data.createdAt || new Date().toISOString(),
    bookingId: data.bookingId,
    profileId: data.profileId,
  };
}

export function buildAdminNotificationsFromFeed(feed: AdminNotificationsFeed): AdminNotification[] {
  const items: AdminNotification[] = [];

  for (const profile of feed.pendingPandits) {
    items.push({
      id: `pandit-pending-${profile.id}`,
      type: 'admin:pandit:pending',
      title: 'New Pandit Registration',
      message: `${profile.name} submitted a profile for approval.`,
      read: false,
      createdAt: profile.memberSince || new Date().toISOString(),
      profileId: profile.id,
    });
  }

  for (const profile of feed.pendingProfileUpdates) {
    items.push({
      id: `pandit-update-${profile.id}`,
      type: 'admin:pandit:update',
      title: 'Profile Update Request',
      message: `${profile.name} requested profile changes. Review and approve.`,
      read: false,
      createdAt: profile.submittedAt || new Date().toISOString(),
      profileId: profile.id,
    });
  }

  for (const booking of feed.recentBookings) {
    items.push(notificationFromBooking(booking));
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function buildAdminNotifications(
  profiles: PanditProfile[],
  recentBookings: AdminNotificationBooking[],
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

type AdminNotificationsFeedResponse = {
  success: boolean;
  data: AdminNotificationsFeed;
};

export async function getAdminNotificationsFeedApi() {
  const { data } = await apiClient.get<AdminNotificationsFeedResponse>('/api/admin/notifications');
  return data;
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

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
