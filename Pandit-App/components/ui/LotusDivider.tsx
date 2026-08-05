import { StyleSheet, View } from 'react-native';

import { DashboardColors as C } from '@/constants/dashboard-theme';

type LotusDividerProps = {
  width?: number;
  color?: string;
};

export function LotusDivider({ width = 120, color = C.gold }: LotusDividerProps) {
  return (
    <View style={[styles.wrap, { width }]}>
      <View style={[styles.line, { backgroundColor: color }]} />
      <View style={[styles.lotus, { borderColor: color }]}>
        <View style={[styles.petal, styles.petalLeft, { backgroundColor: color }]} />
        <View style={[styles.petal, styles.petalCenter, { backgroundColor: color }]} />
        <View style={[styles.petal, styles.petalRight, { backgroundColor: color }]} />
      </View>
      <View style={[styles.line, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.7,
  },
  lotus: {
    width: 14,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    position: 'absolute',
    borderRadius: 6,
  },
  petalCenter: {
    width: 5,
    height: 8,
    top: 1,
  },
  petalLeft: {
    width: 4,
    height: 6,
    left: 1,
    top: 3,
    transform: [{ rotate: '-28deg' }],
    opacity: 0.85,
  },
  petalRight: {
    width: 4,
    height: 6,
    right: 1,
    top: 3,
    transform: [{ rotate: '28deg' }],
    opacity: 0.85,
  },
});
