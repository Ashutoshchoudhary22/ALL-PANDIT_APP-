import axios from 'axios';

import { API_BASE_URL } from '@/constants/api';

let authTokenGetter: (() => string | null) | null = null;
let unauthorizedHandler: (() => Promise<void>) | null = null;
let isHandlingUnauthorized = false;

export function setAuthTokenGetter(getter: () => string | null) {
  authTokenGetter = getter;
}

export function setUnauthorizedHandler(handler: (() => Promise<void>) | null) {
  unauthorizedHandler = handler;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = authTokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const hadAuth = Boolean(authTokenGetter?.());
    const url = error.config?.url || '';
    const isAuthAttempt = /\/api\/auth\/(login|signup|verify-otp|forgot-password|reset-password)/.test(
      url,
    );

    if (
      status === 401 &&
      hadAuth &&
      !isAuthAttempt &&
      unauthorizedHandler &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true;
      try {
        await unauthorizedHandler();
      } finally {
        isHandlingUnauthorized = false;
      }
    }

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return Promise.reject(
        new Error(
          'Cannot reach server. Check backend is running and phone is on same WiFi.',
        ),
      );
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    return Promise.reject(new Error(message));
  },
);
