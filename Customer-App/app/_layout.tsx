import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthBootstrap } from '@/components/AuthBootstrap';
import { AuthSessionHandler } from '@/components/AuthSessionHandler';
import { RoleGuard } from '@/components/RoleGuard';
import { BookingApprovalListener } from '@/components/BookingApprovalListener';
import { PushNotificationHandler } from '@/components/PushNotificationHandler';
import { LiveLocationGate } from '@/components/LiveLocationGate';
import { LiveLocationTracker } from '@/components/LiveLocationTracker';
import { PanditFiltersHost } from '@/components/PanditFiltersHost';
import { SplashController } from '@/components/SplashController';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/providers/AuthProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { NotificationsProvider } from '@/providers/NotificationsProvider';
import { SavedPanditsProvider } from '@/providers/SavedPanditsProvider';
import { PanditFiltersProvider } from '@/providers/PanditFiltersProvider';
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
          <LanguageProvider>
          <SavedPanditsProvider>
          <NotificationsProvider>
          <PanditFiltersProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthSessionHandler />
              <RoleGuard />
              <AuthBootstrap />
              <SplashController />
              <LiveLocationGate role="customer">
                <LiveLocationTracker />
                <BookingApprovalListener />
                <PushNotificationHandler />
                <PanditFiltersHost />
                <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
                <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                <Stack.Screen name="sign-up" options={{ headerShown: false }} />
                <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
                <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                <Stack.Screen name="reset-password" options={{ headerShown: false }} />
                <Stack.Screen name="create-profile" options={{ headerShown: false }} />
                <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
                <Stack.Screen name="nearby-pandits" options={{ headerShown: false }} />
                <Stack.Screen name="saved-pandits" options={{ headerShown: false }} />
                <Stack.Screen name="all-puja-services" options={{ headerShown: false }} />
                <Stack.Screen name="pandit/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="book-pandit" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
            </LiveLocationGate>
            <StatusBar style="auto" />
          </ThemeProvider>
          </PanditFiltersProvider>
          </NotificationsProvider>
          </SavedPanditsProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
