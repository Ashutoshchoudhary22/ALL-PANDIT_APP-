import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { getSocketUrl } from '@/lib/socket';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { PanditBookingNotification } from '@/services/booking.api';

export function BookingNotificationListener() {
  const { token, user, isLoading } = useAuth();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isLoading || !token || user?.role !== 'pandit') {
      return;
    }

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('booking:new', (payload: PanditBookingNotification) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });

      addNotification({
        id: `booking-${payload.booking.id}`,
        type: 'booking:new',
        title: payload.title || 'New Booking Received',
        message: payload.message,
        bookingId: payload.booking.id,
        read: false,
        createdAt: payload.booking.createdAt || new Date().toISOString(),
        booking: payload.booking,
      });
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connect error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.role, isLoading, queryClient, addNotification]);

  return null;
}
