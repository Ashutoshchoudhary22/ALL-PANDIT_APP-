import { BackHandler, Platform } from 'react-native';

export const APP_ROLE = 'pandit' as const;

let isExiting = false;

export function isWrongRole(role?: string | null) {
  return Boolean(role && role !== APP_ROLE);
}

export function exitAppForWrongRole() {
  if (isExiting) return;
  isExiting = true;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.close();
    }
    return;
  }

  BackHandler.exitApp();
}
