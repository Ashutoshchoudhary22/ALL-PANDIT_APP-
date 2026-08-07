import { PlaceholderTabScreen } from '@/components/PlaceholderTabScreen';

export default function UsersScreen() {
  return (
    <PlaceholderTabScreen
      title="Users"
      subtitle="Manage pandits, customers and admin accounts."
      icon="people"
      features={[
        'Role-based user management',
        'Account status and verification',
        'Bulk actions and audit logs',
      ]}
    />
  );
}
