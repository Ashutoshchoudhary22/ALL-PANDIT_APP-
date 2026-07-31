import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Socket } from 'socket.io-client';

import { createAuthenticatedSocket } from '@/lib/socket';
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

    const socket = createAuthenticatedSocket(token);

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Pandit socket connected');
    });

    socket.on('booking:new', (payload: PanditBookingNotification) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'requests'] });

      addNotification({
        id: `booking-${payload.booking.id}`,
        type: 'booking:new',
        title: payload.title || 'New Booking Request',
        message: payload.message,
        bookingId: payload.booking.id,
        read: false,
        createdAt: payload.booking.createdAt || new Date().toISOString(),
        booking: payload.booking,
      });
    });

    socket.on('booking:confirmed', (payload: PanditBookingNotification) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'pandit', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['pandit', 'earnings'] });

      addNotification({
        id: `booking-confirmed-${payload.booking.id}`,
        type: 'booking:confirmed',
        title: payload.title || 'Payment Received',
        message: payload.message,
        bookingId: payload.booking.id,
        read: false,
        createdAt: payload.booking.updatedAt || payload.booking.createdAt || new Date().toISOString(),
        booking: payload.booking,
      });

      Alert.alert(
        payload.title || 'Payment Received',
        payload.message || 'Customer paid 40% advance. Booking is confirmed.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'View Booking',
            onPress: () => router.push('/(tabs)/bookings'),
          },
        ],
      );
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
