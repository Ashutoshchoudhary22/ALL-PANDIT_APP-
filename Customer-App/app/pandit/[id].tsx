import { useLocalSearchParams } from 'expo-router';

import { PanditDetailScreen } from '@/components/PanditDetailScreen';

export default function PanditDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profileId = Number(id);

  if (!Number.isFinite(profileId)) {
    return null;
  }

  return <PanditDetailScreen profileId={profileId} />;
}
