import { Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export const PROFILE_RETURN_PARAM = 'returnTo';
export const PROFILE_RETURN_VALUE = 'profile';

export function isProfileReturn(params: Record<string, string | string[] | undefined>) {
  const value = params[PROFILE_RETURN_PARAM] ?? params.returnTo;
  return value === PROFILE_RETURN_VALUE || value === 'profile';
}

export function navigateFromProfile(target: Href) {
  if (typeof target === 'string') {
    router.push({
      pathname: target,
      params: { [PROFILE_RETURN_PARAM]: PROFILE_RETURN_VALUE },
    } as Href);
    return;
  }

  router.push({
    ...target,
    params: {
      ...(typeof target === 'object' && 'params' in target ? target.params : {}),
      [PROFILE_RETURN_PARAM]: PROFILE_RETURN_VALUE,
    },
  } as Href);
}

export function backFromProfileLinkedScreen() {
  router.replace('/(tabs)/profile' as Href);
}

export function leaveProfileLinkedScreen(fallback?: () => void) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  if (fallback) {
    fallback();
    return;
  }

  backFromProfileLinkedScreen();
}

export function useProfileReturnBackHandler(enabled = true) {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const shouldReturnToProfile = isProfileReturn(params);

  useEffect(() => {
    if (!enabled || !shouldReturnToProfile) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      backFromProfileLinkedScreen();
      return true;
    });

    return () => subscription.remove();
  }, [enabled, shouldReturnToProfile]);

  return shouldReturnToProfile;
}
