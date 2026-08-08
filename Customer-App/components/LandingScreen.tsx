import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlideToAction } from '@/components/SlideToAction';
import { useTranslation } from '@/providers/LanguageProvider';

const LANDING_BG = '#FFF8F0';

export function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.imageWrap, { paddingTop: insets.top }]}>
        <Image
          source={require('@/assets/landing.png')}
          style={styles.landingImage}
          resizeMode="contain"
        />
        <LinearGradient
          colors={['transparent', 'rgba(61, 21, 21, 0.08)', 'rgba(61, 21, 21, 0.35)']}
          locations={[0.55, 0.82, 1]}
          style={styles.imageGradient}
          pointerEvents="none"
        />
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
    backgroundColor: LANDING_BG,
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: LANDING_BG,
  },
  landingImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  footer: {
    paddingHorizontal: 28,
    alignItems: 'center',
    backgroundColor: LANDING_BG,
  },
  slideWrap: {
    width: '100%',
  },
});
