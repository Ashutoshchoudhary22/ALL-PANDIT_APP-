import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthBootstrap } from '@/components/AuthBootstrap';
import { AuthSessionHandler } from '@/components/AuthSessionHandler';
import { RoleGuard } from '@/components/RoleGuard';
import { BookingNotificationListener } from '@/components/BookingNotificationListener';
import { LiveLocationGate } from '@/components/LiveLocationGate';
import { LiveLocationTracker } from '@/components/LiveLocationTracker';
import { SplashController } from '@/components/SplashController';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/providers/AuthProvider';
import { NotificationsProvider } from '@/providers/NotificationsProvider';
import { QueryProvider } from '@/providers/QueryProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <NotificationsProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthSessionHandler />
              <RoleGuard />
              <AuthBootstrap />
              <SplashController />
          <LiveLocationGate role="pandit">
            <LiveLocationTracker />
            <BookingNotificationListener />
            <Stack initialRouteName="(tabs)">
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="booking-requests" options={{ headerShown: false }} />
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="sign-up" options={{ headerShown: false }} />
              <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
              <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="create-profile" options={{ headerShown: false }} />
              <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </LiveLocationGate>
          <StatusBar style="auto" />
          </ThemeProvider>
          </NotificationsProvider>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
