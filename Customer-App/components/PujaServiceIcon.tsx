import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { getPujaServiceStyle } from '@/constants/puja-services';
import { HomeColors as C } from '@/constants/home-theme';

type PujaServiceIconProps = {
  name: string;
  index?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

const SIZES = {
  sm: { outer: 56, icon: 26, radius: 28 },
  md: { outer: 64, icon: 30, radius: 16 },
  lg: { outer: 52, icon: 26, radius: 26 },
};

export function PujaServiceIcon({ name, index = 0, size = 'sm', style }: PujaServiceIconProps) {
  const cfg = getPujaServiceStyle(name, index);
  const dim = SIZES[size];
  const isRound = size === 'sm' || size === 'lg';

  const IconComponent = cfg.iconSet === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[cfg.bg, cfg.bgEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            width: dim.outer,
            height: dim.outer,
            borderRadius: isRound ? dim.radius : dim.radius,
          },
        ]}
      >
        <View style={[styles.innerRing, isRound && styles.innerRingRound]}>
          <IconComponent
            name={cfg.icon as never}
            size={dim.icon}
            color={cfg.color}
          />
        </View>
      </LinearGradient>
      <View
        style={[
          styles.goldAccent,
          {
            width: dim.outer + 4,
            height: dim.outer + 4,
            borderRadius: isRound ? (dim.outer + 4) / 2 : dim.radius + 2,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
  innerRing: {
    width: '82%',
    height: '82%',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  innerRingRound: {
    borderRadius: 999,
  },
  goldAccent: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 160, 23, 0.45)',
    zIndex: 0,
  },
});
