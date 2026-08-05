import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { HomeColors as C } from '@/constants/home-theme';

type PremiumCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  accent?: 'gold' | 'maroon' | 'saffron' | 'none';
  variant?: 'white' | 'cream';
};

const ACCENT_COLORS = {
  gold: C.gold,
  maroon: C.maroon,
  saffron: C.primary,
  none: 'transparent',
};

export function PremiumCard({
  children,
  style,
  innerStyle,
  accent = 'gold',
  variant = 'white',
}: PremiumCardProps) {
  const gradientColors = variant === 'cream' ? [C.cream, '#FFFFFF'] : ['#FFFFFF', C.cream];

  return (
    <View style={[styles.shadowWrap, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, innerStyle]}
      >
        {accent !== 'none' ? (
          <View style={[styles.accentBar, { backgroundColor: ACCENT_COLORS[accent] }]} />
        ) : null}
        {children}
      </LinearGradient>
      <View style={styles.goldRing} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    position: 'relative',
    shadowColor: '#6B1515',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.28)',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    opacity: 0.85,
  },
  goldRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.18)',
    zIndex: 2,
  },
});
