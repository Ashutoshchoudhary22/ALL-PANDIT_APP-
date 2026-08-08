import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Socket } from 'socket.io-client';

import {
  removePanditBookingRequestFromCache,
  upsertPanditBookingInCache,
  upsertPanditBookingRequestInCache,
} from '@/lib/booking-realtime';
import { advancePercentLabel } from '@/lib/booking-pricing';
import { createAuthenticatedSocket } from '@/lib/socket';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { PanditBooking } from '@/services/booking.api';
import {
  notificationFromBooking,
  notificationFromConfirmedBooking,
} from '@/services/notification.api';

export type PanditBookingNotification = {
  type: 'booking:new' | 'booking:confirmed';
  title: string;
  message: string;
  booking: PanditBooking;
};

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
      upsertPanditBookingRequestInCache(queryClient, payload.booking);

      addNotification({
        ...notificationFromBooking(payload.booking),
        title: payload.title || 'New Booking Request',
        message: payload.message,
      });
    });

    socket.on('booking:confirmed', (payload: PanditBookingNotification) => {
      removePanditBookingRequestFromCache(queryClient, payload.booking.id);
      upsertPanditBookingInCache(queryClient, payload.booking);
      queryClient.invalidateQueries({ queryKey: ['pandit', 'earnings'] });

      addNotification({
        ...notificationFromConfirmedBooking(payload.booking),
        title: payload.title || 'Payment Received',
        message: payload.message,
      });

      Alert.alert(
        payload.title || 'Payment Received',
        payload.message || `Customer paid ${advancePercentLabel()} advance. Booking is confirmed.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'View Booking',
            onPress: () => router.push('/(tabs)/bookings'),
          },
        ],
      );
    });

    socket.on('booking:request_updated', (payload: { type: string; booking: PanditBooking }) => {
      removePanditBookingRequestFromCache(queryClient, payload.booking.id);
      if (payload.type === 'booking:approved') {
        upsertPanditBookingInCache(queryClient, payload.booking);
      }
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
