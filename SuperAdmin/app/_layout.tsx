import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthBootstrap } from '@/components/AuthBootstrap';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PushNotificationHandler } from '@/components/PushNotificationHandler';
import { SplashController } from '@/components/SplashController';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AdminDrawerProvider } from '@/providers/AdminDrawerProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { NotificationsProvider } from '@/providers/NotificationsProvider';
import { QueryProvider } from '@/providers/QueryProvider';

export const unstable_settings = {
  initialRouteName: 'sign-in',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <NotificationsProvider>
            <AdminDrawerProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <ErrorBoundary>
                  <AuthBootstrap />
                  <SplashController />
                  <PushNotificationHandler />
                  <Stack initialRouteName="sign-in">
                    <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="pandit-profiles" options={{ headerShown: false }} />
                    <Stack.Screen name="customer-profiles" options={{ headerShown: false }} />
                    <Stack.Screen name="customer-wallets" options={{ headerShown: false }} />
                    <Stack.Screen name="pandit-reviews" options={{ headerShown: false }} />
                    <Stack.Screen name="notifications" options={{ headerShown: false }} />
                    <Stack.Screen name="sign-up" options={{ headerShown: false }} />
                    <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
                    <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                    <Stack.Screen name="reset-password" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                  </Stack>
                </ErrorBoundary>
                <StatusBar style="auto" />
              </ThemeProvider>
            </AdminDrawerProvider>
          </NotificationsProvider>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
