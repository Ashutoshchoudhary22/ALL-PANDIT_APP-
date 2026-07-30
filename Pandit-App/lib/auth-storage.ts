import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthUser } from '@/services/auth.api';

const AUTH_TOKEN_KEY = 'my_pandit_auth_token';
const AUTH_USER_KEY = 'my_pandit_auth_user';

export async function saveAuthSession(token: string, user: AuthUser) {
  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, token],
    [AUTH_USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
}
