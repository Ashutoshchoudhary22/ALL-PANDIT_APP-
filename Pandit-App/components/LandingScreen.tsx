import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlideToAction } from '@/components/SlideToAction';
import { goToSignIn } from '@/lib/auth-navigation';

export function LandingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('@/assets/landing1.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <SlideToAction label="Get Started" onComplete={goToSignIn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A0A3E',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 0, 26, 0.2)',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
  },
});
