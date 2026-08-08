import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlideToAction } from '@/components/SlideToAction';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { goToSignIn } from '@/lib/auth-navigation';

export function LandingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.imageWrap, { paddingTop: insets.top }]}>
        <Image
          source={require('@/assets/landing.png')}
          style={styles.landingImage}
          resizeMode="contain"
        />
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <SlideToAction label="Get Started" onComplete={goToSignIn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: C.cream,
  },
  landingImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 28,
    backgroundColor: C.cream,
  },
});
