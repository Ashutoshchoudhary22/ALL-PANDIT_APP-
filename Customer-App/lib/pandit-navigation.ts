import { router } from 'expo-router';

export function openPanditsForService(service?: string) {
  if (service) {
    router.push({
      pathname: '/nearby-pandits',
      params: { service },
    });
    return;
  }

  router.push('/nearby-pandits');
}

export function openBookPandit(panditProfileId: number, serviceName?: string) {
  router.push({
    pathname: '/book-pandit',
    params: {
      panditId: String(panditProfileId),
      ...(serviceName ? { service: serviceName } : {}),
    },
  });
}
