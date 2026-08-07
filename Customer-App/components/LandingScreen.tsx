import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlideToAction } from '@/components/SlideToAction';
import { HomeColors as C } from '@/constants/home-theme';
import { useTranslation } from '@/providers/LanguageProvider';

export function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('@/assets/landing.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <LinearGradient
        colors={['transparent', 'rgba(61, 21, 21, 0.15)', 'rgba(61, 21, 21, 0.88)']}
        locations={[0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={styles.mandalaCorner} />
        <View style={styles.mandalaCornerRight} />
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
        <View style={styles.slideWrap}>
          <SlideToAction label={t('landing.beginJourney')} onComplete={() => router.push('/sign-in')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.maroonDark,
  },
  content: {
    flex: 1,
  },
  mandalaCorner: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    opacity: 0.6,
  },
  mandalaCornerRight: {
    position: 'absolute',
    top: 20,
    right: 28,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  footer: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  slideWrap: {
    width: '100%',
  },
});
