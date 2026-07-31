import { PanditFiltersModal } from '@/components/PanditFiltersModal';
import { useMyCustomerProfileQuery } from '@/hooks/use-customer-profile';
import { useAuth } from '@/providers/AuthProvider';

export function PanditFiltersHost() {
  const { token } = useAuth();
  const profileQuery = useMyCustomerProfileQuery(Boolean(token));
  const profile = profileQuery.data?.data;

  const hasCustomerLocation =
    (profile?.liveLatitude != null && profile?.liveLongitude != null) ||
    (profile?.latitude != null && profile?.longitude != null);

  return <PanditFiltersModal hasCustomerLocation={hasCustomerLocation} />;
}
