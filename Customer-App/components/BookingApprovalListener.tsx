import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Socket } from 'socket.io-client';

import { upsertCustomerBookingInCache } from '@/lib/booking-realtime';
import { ADVANCE_RATE } from '@/lib/booking-pricing';
import { createAuthenticatedSocket } from '@/lib/socket';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Booking } from '@/services/booking.api';
import {
  CustomerBookingNotification,
  notificationFromBooking,
  notificationFromReviewRequest,
} from '@/services/notification.api';

function handleCustomerBookingSocketEvent(
  payload: CustomerBookingNotification,
  options: {
    queryClient: ReturnType<typeof useQueryClient>;
    addNotification: ReturnType<typeof useNotifications>['addNotification'];
    showAlert?: boolean;
  },
) {
  const booking = payload.booking as Booking;
  upsertCustomerBookingInCache(options.queryClient, booking);

  if (payload.type === 'booking:approved') {
    options.addNotification(notificationFromBooking(booking));
    if (options.showAlert !== false) {
      Alert.alert(
        payload.title || 'Booking Approved',
        `${payload.message || `Your booking was approved. Pay ${Math.round(ADVANCE_RATE * 100)}% advance now to confirm.`}\n\nYou can pay via Wallet or Online from Bookings.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Pay Now',
            onPress: () => router.push('/(tabs)/bookings'),
          },
        ],
      );
    }
    return;
  }

  if (payload.type === 'booking:rejected') {
    if (options.showAlert !== false) {
      Alert.alert(payload.title || 'Booking Rejected', payload.message);
    }
    return;
  }

  if (payload.type === 'booking:finish_otp') {
    options.addNotification({
      id: `booking-finish-otp-${booking.id}-${Date.now()}`,
      type: 'booking:finish_otp',
      title: payload.title || 'Puja Completion OTP',
      message: payload.message,
      bookingId: booking.id,
      read: false,
      createdAt: booking.updatedAt || new Date().toISOString(),
      booking,
    });

    if (options.showAlert !== false) {
      Alert.alert(
        payload.title || 'Puja Completion OTP',
        payload.message || 'Check your email for the OTP and share it with pandit ji.',
        [
          { text: 'OK' },
          {
            text: 'View Bookings',
            onPress: () => router.push('/(tabs)/bookings'),
          },
        ],
      );
    }
    return;
  }

  if (payload.type === 'booking:review_request') {
    options.addNotification(notificationFromReviewRequest(booking));

    if (options.showAlert !== false) {
      Alert.alert(
        payload.title || 'Rate Your Puja Experience',
        payload.message || 'Please share your rating for the completed puja.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Rate Now',
            onPress: () => router.push('/(tabs)/home'),
          },
        ],
      );
    }
  }
}

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

    const onBookingEvent = (payload: CustomerBookingNotification) => {
      handleCustomerBookingSocketEvent(payload, {
        queryClient,
        addNotification,
      });
    };

    socket.on('connect', () => {
      console.log('Customer socket connected');
    });

    socket.on('booking:updated', onBookingEvent);

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
