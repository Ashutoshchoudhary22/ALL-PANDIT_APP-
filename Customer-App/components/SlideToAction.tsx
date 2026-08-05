import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { HomeColors as C } from '@/constants/home-theme';

const THUMB_SIZE = 44;
const TRACK_HEIGHT = 60;
const PADDING = 8;

type SlideToActionProps = {
  label: string;
  onComplete: () => void;
  resetKey?: string | number;
};

export function SlideToAction({ label, onComplete, resetKey }: SlideToActionProps) {
  const maxSlide = useSharedValue(0);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const completed = useSharedValue(false);

  useEffect(() => {
    completed.value = false;
    translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
  }, [resetKey, label, completed, translateX]);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    maxSlide.value = Math.max(width - THUMB_SIZE - PADDING * 2, 0);
  };

  const handleComplete = () => {
    onComplete();
    setTimeout(() => {
      completed.value = false;
      translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
    }, 250);
  };

  const pan = Gesture.Pan()
    .activeOffsetX(8)
    .failOffsetY([-20, 20])
    .onBegin(() => {
      'worklet';
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (completed.value) return;
      const next = Math.min(Math.max(startX.value + e.translationX, 0), maxSlide.value);
      translateX.value = next;
    })
    .onEnd(() => {
      'worklet';
      if (completed.value) return;
      const threshold = maxSlide.value * 0.72;
      if (translateX.value >= threshold) {
        completed.value = true;
        translateX.value = withSpring(maxSlide.value, { damping: 20, stiffness: 200 });
        runOnJS(handleComplete)();
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + 54,
  }));

  const labelStyle = useAnimatedStyle(() => {
    const max = maxSlide.value || 1;
    const opacity = interpolate(
      translateX.value,
      [0, max * 0.45, max],
      [1, 0.35, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <View style={styles.track} onLayout={onLayout}>
      <Animated.View style={[styles.fill, fillStyle]} />
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Ionicons name="arrow-forward" size={18} color={C.maroon} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(107, 21, 21, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 160, 23, 0.45)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 107, 0, 0.35)',
    borderRadius: TRACK_HEIGHT / 2,
  },
  label: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  thumb: {
    position: 'absolute',
    left: PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: C.cream,
    borderWidth: 2,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
