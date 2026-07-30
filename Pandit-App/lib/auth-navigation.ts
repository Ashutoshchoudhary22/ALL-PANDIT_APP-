import { Href, router } from 'expo-router';

export function goToGetStarted() {
  router.replace('/' as Href);
}

export function goToSignIn() {
  router.push('/sign-in' as Href);
}

export function goToDashboard() {
  router.replace('/dashboard' as Href);
}

export function goToProfile() {
  router.replace('/profile' as Href);
}
