import { Href, router } from 'expo-router';

export function goToSignIn() {
  router.replace('/sign-in' as Href);
}

export function goToHome() {
  router.replace('/(tabs)' as Href);
}
