import { SuperAdminDashboard } from '@/components/SuperAdminDashboard';
import { useAuth } from '@/providers/AuthProvider';

export default function DashboardScreen() {
  const { user } = useAuth();

  const adminName =
    user?.email?.split('@')[0]?.replace(/[._]/g, ' ') ||
    (user?.role === 'superadmin' ? 'Super Admin' : 'Admin');

  return <SuperAdminDashboard adminName={adminName} notificationCount={8} />;
}
