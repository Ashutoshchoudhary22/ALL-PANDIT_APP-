import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getDevHostIp() {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.expoConfig?.hostUri?.replace(/^https?:\/\//, '');

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  return null;
}

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const devHost = getDevHostIp();
  if (devHost) {
    return `http://${devHost}:5300`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5300';
  }

  return 'http://localhost:5300';
}

export const API_BASE_URL = resolveApiBaseUrl();

export const AUTH_ENDPOINTS = {
  signup: '/api/auth/signup',
  verifyOtp: '/api/auth/verify-otp',
  resendOtp: '/api/auth/resend-otp',
  login: '/api/auth/login',
  forgotPassword: '/api/auth/forgot-password',
  me: '/api/auth/me',
} as const;

export const UPLOAD_ENDPOINTS = {
  status: '/api/uploads/status',
  image: '/api/uploads/image',
} as const;
