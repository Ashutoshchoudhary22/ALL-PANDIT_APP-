import { io, Socket } from 'socket.io-client';

import { API_BASE_URL } from '@/constants/api';

export function getSocketUrl() {
  return API_BASE_URL.replace(/\/$/, '');
}

export function createAuthenticatedSocket(token: string): Socket {
  return io(getSocketUrl(), {
    auth: { token },
    // Polling first is more reliable on React Native / Expo Go.
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });
}
