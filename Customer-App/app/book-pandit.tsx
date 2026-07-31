import { useLocalSearchParams } from 'expo-router';

import { BookPanditScreen } from '@/components/BookPanditScreen';

export default function BookPanditRoute() {
  const { panditId, service } = useLocalSearchParams<{ panditId: string; service?: string }>();
  const profileId = Number(panditId);

  if (!Number.isFinite(profileId)) {
    return null;
  }

  return (
    <BookPanditScreen
      panditProfileId={profileId}
      initialServiceName={typeof service === 'string' ? service : undefined}
    />
  );
}
