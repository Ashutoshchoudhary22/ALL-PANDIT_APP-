import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAdminDrawer } from '@/providers/AdminDrawerProvider';

type AdminScreenHeaderProps = {
  title: string;
  subtitle?: string;
  variant?: 'gradient' | 'plain';
  rightAction?: ReactNode;
};

export function AdminScreenHeader({
  title,
  subtitle,
  variant = 'gradient',
  rightAction,
}: AdminScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useAdminDrawer();

  if (variant === 'plain') {
    return (
      <View style={[styles.plainWrap, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={openDrawer} style={styles.menuBtn} hitSlop={12}>
          <Ionicons name="menu" size={24} color={C.text} />
        </Pressable>
        <View style={styles.textWrap}>
          <Text style={styles.plainTitle}>{title}</Text>
          {subtitle ? <Text style={styles.plainSubtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[...C.headerGradientDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientWrap, { paddingTop: insets.top + 10 }]}
    >
      <View style={styles.decorCircle} />
      <View style={styles.topRow}>
        <Pressable onPress={openDrawer} style={styles.menuBtnLight} hitSlop={12}>
          <Ionicons name="menu" size={24} color="#fff" />
        </Pressable>
        {rightAction}
      </View>
      <View style={styles.titleBlock}>
        <View style={styles.badgeRow}>
          <Ionicons name="shield-checkmark" size={14} color={C.goldLight} />
          <Text style={styles.badgeText}>Admin Panel</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientWrap: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtnLight: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    marginTop: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.35)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.82)',
  },
  plainWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: C.screenBg,
  },
  menuBtn: {
    padding: 4,
  },
  textWrap: {
    flex: 1,
  },
  plainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
  },
  plainSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: C.textMuted,
  },
});
