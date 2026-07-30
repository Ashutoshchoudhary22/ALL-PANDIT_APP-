import { useEffect, useRef } from 'react';
import type { LocationSubscription } from 'expo-location';

import { useLiveLocationGranted } from '@/components/LiveLocationGate';
import { startLiveLocationWatch } from '@/lib/live-location';
import { useAuth } from '@/providers/AuthProvider';
import { updateCustomerLiveLocationApi } from '@/services/customer-profile.api';

export function LiveLocationTracker() {
  const { token, user } = useAuth();
  const locationGranted = useLiveLocationGranted();
  const subscriptionRef = useRef<LocationSubscription | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'customer' || !locationGranted) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const subscription = await startLiveLocationWatch(async (coords) => {
        try {
          await updateCustomerLiveLocationApi(coords);
        } catch {
          // Profile may not exist yet — ignore until created.
        }
      });

      if (cancelled) {
        subscription?.remove();
        return;
      }

      subscriptionRef.current = subscription;
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [token, user?.role, locationGranted]);

  return null;
}
