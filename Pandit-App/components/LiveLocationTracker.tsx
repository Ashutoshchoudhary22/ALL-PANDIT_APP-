import { useEffect, useRef } from 'react';
import type { LocationSubscription } from 'expo-location';

import { useLiveLocationGranted } from '@/components/LiveLocationGate';
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from '@/lib/background-location';
import { startLiveLocationWatch } from '@/lib/live-location';
import { useAuth } from '@/providers/AuthProvider';
import { updatePanditLiveLocationApi } from '@/services/pandit-profile.api';

export function LiveLocationTracker() {
  const { token, user } = useAuth();
  const locationGranted = useLiveLocationGranted();
  const subscriptionRef = useRef<LocationSubscription | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'pandit' || !locationGranted) {
      void stopBackgroundLocationTracking();
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      return;
    }

    let cancelled = false;

    void startBackgroundLocationTracking().catch((error) => {
      console.warn('Background location start failed:', error);
    });

    (async () => {
      const subscription = await startLiveLocationWatch(async (coords) => {
        try {
          await updatePanditLiveLocationApi(coords);
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
      void stopBackgroundLocationTracking();
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [token, user?.role, locationGranted]);

  return null;
}
