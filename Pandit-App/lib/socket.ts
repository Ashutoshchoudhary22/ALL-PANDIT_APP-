import { API_BASE_URL } from '@/constants/api';

export function getSocketUrl() {
  return API_BASE_URL.replace(/\/$/, '');
}
