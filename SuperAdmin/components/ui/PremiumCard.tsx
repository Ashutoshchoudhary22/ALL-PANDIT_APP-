import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { AdminShadow, DashboardColors as C } from '@/constants/dashboard-theme';

type PremiumCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  accent?: 'purple' | 'gold' | 'none';
  variant?: 'white' | 'cream';
};

const ACCENT_COLORS = {
  purple: C.primary,
  gold: C.gold,
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
    <View style={[styles.shadowWrap, AdminShadow.card, style]}>
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
    borderRadius: 18,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    opacity: 0.9,
  },
  goldRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
    zIndex: 2,
  },
});
