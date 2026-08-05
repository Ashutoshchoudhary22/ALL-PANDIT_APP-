import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlideToAction } from '@/components/SlideToAction';
import { LotusDivider } from '@/components/ui/LotusDivider';
import { Brand, HomeColors as C } from '@/constants/home-theme';

export function LandingScreen() {
  const insets = useSafeAreaInsets();

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
        <Text style={styles.om}>ॐ</Text>
        <Text style={styles.tagline}>{Brand.tagline}</Text>
        <Text style={styles.subtitle}>
          Book verified Acharyas for Puja, Havan and all sacred rituals
        </Text>
        <LotusDivider width={160} />
        <View style={styles.slideWrap}>
          <SlideToAction label="Begin Your Journey" onComplete={() => router.push('/sign-in')} />
        </View>
        <Text style={styles.footerNote}>Trusted pandits • Transparent pricing • On-time service</Text>
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
    gap: 10,
  },
  om: {
    fontSize: 28,
    color: C.goldLight,
    fontWeight: '300',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255, 248, 240, 0.92)',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  slideWrap: {
    width: '100%',
    marginTop: 6,
  },
  footerNote: {
    marginTop: 14,
    fontSize: 11,
    color: 'rgba(255, 248, 240, 0.65)',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
