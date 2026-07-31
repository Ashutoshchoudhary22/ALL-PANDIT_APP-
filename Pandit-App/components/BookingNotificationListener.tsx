import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { io, Socket } from 'socket.io-client';

import { getSocketUrl } from '@/lib/socket';
import { useAuth } from '@/providers/AuthProvider';
import { PanditBookingNotification } from '@/services/booking.api';

function formatBookingDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function BookingNotificationListener() {
  const { token, user, isLoading } = useAuth();
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

      const booking = payload.booking;
      Alert.alert(
        payload.title || 'New Booking Received',
        `${payload.message}\n\nService: ${booking.serviceName}\nDate: ${formatBookingDate(booking.bookingDate)}\nAdvance Paid: ₹${booking.advanceAmount.toLocaleString('en-IN')}`,
        [{ text: 'OK' }],
      );
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connect error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.role, isLoading, queryClient]);

  return null;
}
