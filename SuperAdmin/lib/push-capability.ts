import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** Push notifications require a dev build or production APK — not Expo Go. */
export function isPushNotificationsAvailable() {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;
  if (isExpoGo()) return false;
  return true;
}
