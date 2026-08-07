import { PlaceholderTabScreen } from '@/components/PlaceholderTabScreen';

export default function BookingsScreen() {
  return (
    <PlaceholderTabScreen
      title="Bookings"
      subtitle="View and manage all platform bookings."
      icon="calendar"
      features={[
        'Live booking status tracking',
        'Refund and cancellation controls',
        'Pandit assignment overview',
      ]}
    />
  );
}
