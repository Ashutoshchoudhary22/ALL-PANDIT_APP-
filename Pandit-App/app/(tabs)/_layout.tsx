import { Tabs } from 'expo-router';

import { PanditTabBar } from '@/components/PanditTabBar';
import { TabAuthGuard } from '@/components/TabAuthGuard';
import { DashboardColors as C } from '@/constants/dashboard-theme';

export default function TabLayout() {
  return (
    <>
      <TabAuthGuard />
      <Tabs
        initialRouteName="index"
        tabBar={(props) => <PanditTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.primary,
          tabBarInactiveTintColor: C.textLight,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
    </>
  );
}
