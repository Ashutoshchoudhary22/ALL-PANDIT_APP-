import { PlaceholderTabScreen } from '@/components/PlaceholderTabScreen';

export default function ReportsScreen() {
  return (
    <PlaceholderTabScreen
      title="Reports"
      subtitle="Revenue, bookings and platform analytics."
      icon="bar-chart"
      features={[
        'Daily and monthly revenue charts',
        'Booking conversion analytics',
        'Export PDF and CSV reports',
      ]}
    />
  );
}
