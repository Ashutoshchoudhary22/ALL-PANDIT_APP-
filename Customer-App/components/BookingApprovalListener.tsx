import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Socket } from 'socket.io-client';

import { createAuthenticatedSocket } from '@/lib/socket';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { CustomerBookingNotification } from '@/services/notification.api';

export function BookingApprovalListener() {
  const { token, user, isLoading } = useAuth();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isLoading || !token || user?.role !== 'customer') {
      return;
    }

    const socket = createAuthenticatedSocket(token);

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Customer socket connected');
    });

    socket.on('booking:approved', (payload: CustomerBookingNotification) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'me'] });

      addNotification({
        id: `booking-approved-${payload.booking.id}`,
        type: 'booking:approved',
        title: payload.title || 'Booking Approved',
        message: payload.message,
        bookingId: payload.booking.id,
        read: false,
        createdAt: payload.booking.updatedAt || payload.booking.createdAt || new Date().toISOString(),
        booking: payload.booking,
      });

      Alert.alert(
        payload.title || 'Booking Approved',
        payload.message || 'Your booking was approved. Pay 40% advance now to confirm.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Pay Now',
            onPress: () => router.push('/(tabs)/bookings'),
          },
        ],
      );
    });

    socket.on('connect_error', (error) => {
      console.warn('Customer socket connect error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.role, isLoading, queryClient, addNotification]);

  return null;
}
