import { Tabs } from 'expo-router';

import { CustomerTabBar } from '@/components/CustomerTabBar';
import { TabAuthGuard } from '@/components/TabAuthGuard';
import { HomeColors as C } from '@/constants/home-theme';
import { useAuth } from '@/providers/AuthProvider';

export default function TabLayout() {
  const { token } = useAuth();

  return (
    <>
      <TabAuthGuard />
      <Tabs
        initialRouteName={token ? 'home' : 'index'}
        backBehavior="history"
        tabBar={(props) => <CustomerTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: true,
          tabBarActiveTintColor: C.primary,
          tabBarInactiveTintColor: C.textLight,
        }}>
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </>
  );
}
