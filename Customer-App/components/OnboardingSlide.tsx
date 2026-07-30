import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlideToAction } from '@/components/SlideToAction';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZES = [90, 160, 240, 330, 420, 520];
const AUTO_PLAY_MS = 3000;

export type OnboardingSlideData = {
  id: string;
  title: string;
  subtitle: string;
  logoText?: string;
};

type LoopSlide = OnboardingSlideData & { key: string };

type OnboardingCarouselProps = {
  slides: OnboardingSlideData[];
  buttonText?: string;
  lastButtonText?: string;
  onFinish?: () => void;
};

function SlideItem({ item }: { item: OnboardingSlideData }) {
  return (
    <View style={styles.slide}>
      <View style={styles.glow} />

      <View style={styles.ringsArea} pointerEvents="none">
        {RING_SIZES.map((size, index) => (
          <View
            key={size}
            style={[
              styles.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderStyle: index % 2 === 0 ? 'dashed' : 'solid',
                opacity: 0.55 - index * 0.06,
              },
            ]}
          />
        ))}

        <View style={styles.logoWrap}>
          <LinearGradient
            colors={['#C084FC', '#8B5CF6', '#7C3AED']}
            style={styles.logoCircle}
          >
            <Text style={styles.omSymbol}>{item.logoText ?? 'ॐ'}</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );
}

export function OnboardingCarousel({
  slides,
  buttonText = 'Get Started',
  lastButtonText = 'Get Started',
  onFinish,
}: OnboardingCarouselProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<LoopSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const loopIndexRef = useRef(0);
  const isJumping = useRef(false);
  const isDragging = useRef(false);

  // Forward-only loop: [...slides, firstClone]
  const loopData = useMemo<LoopSlide[]>(() => {
    if (slides.length <= 1) {
      return slides.map((s) => ({ ...s, key: s.id }));
    }
    const first = slides[0];
    return [
      ...slides.map((s) => ({ ...s, key: s.id })),
      { ...first, key: `clone-first-${first.id}` },
    ];
  }, [slides]);

  const canLoop = slides.length > 1;

  const toRealIndex = (loopIndex: number) => {
    if (!canLoop) return loopIndex;
    if (loopIndex >= slides.length) return 0;
    return loopIndex;
  };

  const scrollToLoopIndex = (index: number, animated = true) => {
    listRef.current?.scrollToIndex({ index, animated });
    loopIndexRef.current = index;
  };

  useEffect(() => {
    if (!canLoop) return;

    const timer = setInterval(() => {
      if (isDragging.current || isJumping.current) return;

      const next = loopIndexRef.current + 1;
      scrollToLoopIndex(next, true);
    }, AUTO_PLAY_MS);

    return () => clearInterval(timer);
  }, [canLoop, slides.length]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isJumping.current) return;

    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    loopIndexRef.current = index;

    // Last clone → jump to real first (seamless forward loop)
    if (canLoop && index === loopData.length - 1) {
      isJumping.current = true;
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
        loopIndexRef.current = 0;
        setActiveIndex(0);
        isJumping.current = false;
      });
      return;
    }

    // Prevent reverse wrap: if somehow before 0, stay on first
    if (index < 0) {
      scrollToLoopIndex(0, false);
      setActiveIndex(0);
      return;
    }

    setActiveIndex(toRealIndex(index));
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isJumping.current) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index >= 0 && index < slides.length) {
      loopIndexRef.current = index;
      if (index !== activeIndex) setActiveIndex(index);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1A0A3E', '#12062E', '#0A001A', '#050010']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        ref={listRef}
        data={loopData}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <SlideItem item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.list}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          isDragging.current = true;
        }}
        onScrollEndDrag={() => {
          isDragging.current = false;
        }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <SlideToAction
          label={lastButtonText || buttonText}
          onComplete={() => onFinish?.()}
          resetKey={activeIndex}
        />
      </View>
    </View>
  );
}

/** @deprecated Prefer OnboardingCarousel for multi-slide swipe */
export type OnboardingSlideProps = {
  title: string;
  subtitle: string;
  buttonText?: string;
  logoText?: string;
  totalDots?: number;
  activeDotIndex?: number;
  onButtonPress?: () => void;
};

export function OnboardingSlide({
  title,
  subtitle,
  buttonText = 'Get Started',
  logoText = 'ॐ',
  onButtonPress,
}: OnboardingSlideProps) {
  return (
    <OnboardingCarousel
      slides={[{ id: '1', title, subtitle, logoText }]}
      lastButtonText={buttonText}
      onFinish={onButtonPress}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A001A',
  },
  list: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#7C3AED',
    opacity: 0.22,
  },
  ringsArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.2,
    borderColor: 'rgba(167, 139, 250, 0.45)',
  },
  logoWrap: {
    zIndex: 2,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  omSymbol: {
    fontSize: 46,
    color: '#F5F3FF',
    fontWeight: '700',
    lineHeight: 54,
  },
  textBlock: {
    paddingHorizontal: 28,
    paddingBottom: 8,
    minHeight: 120,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 14,
    color: 'rgba(200, 190, 220, 0.75)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 28,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(180, 170, 200, 0.35)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#A855F7',
  },
});
