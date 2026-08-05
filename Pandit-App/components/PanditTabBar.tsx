import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { PlatformPressable } from '@react-navigation/elements';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAuth } from '@/providers/AuthProvider';

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  dashboard: { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
  bookings: { label: 'Bookings', icon: 'clipboard-outline', iconActive: 'clipboard' },
  calendar: { label: 'Calendar', icon: 'calendar', iconActive: 'calendar' },
  earnings: { label: 'Earnings', icon: 'wallet-outline', iconActive: 'wallet' },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

export function PanditTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const currentRoute = state.routes[state.index];
  const isPublicScreen = currentRoute.name === 'index' || currentRoute.name === 'explore';

  if (isPublicScreen || !token) {
    return null;
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        <LinearGradient colors={['#FFFFFF', C.cream]} style={StyleSheet.absoluteFill} />
        <View style={styles.goldLine} />
        {state.routes.map((route, index) => {
          if (route.name === 'index' || route.name === 'explore') return null;

          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const isCalendar = route.name === 'calendar';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCalendar) {
            return (
              <PlatformPressable key={route.key} onPress={onPress} style={styles.calendarSlot}>
                <LinearGradient
                  colors={[C.maroon, C.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.calendarBtn, isFocused && styles.calendarBtnActive]}
                >
                  <Ionicons name="calendar" size={26} color="#fff" />
                </LinearGradient>
              </PlatformPressable>
            );
          }

          return (
            <PlatformPressable key={route.key} onPress={onPress} style={styles.tab}>
              <Ionicons
                name={isFocused ? config.iconActive : config.icon}
                size={22}
                color={isFocused ? C.maroon : C.textLight}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {config.label}
              </Text>
              {isFocused ? <View style={styles.activeDot} /> : null}
            </PlatformPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: C.maroonDark,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  goldLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: C.gold,
    opacity: 0.35,
    borderRadius: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textLight,
  },
  tabLabelActive: {
    color: C.maroon,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primary,
    marginTop: 1,
  },
  calendarSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -28,
  },
  calendarBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: C.cream,
    shadowColor: C.maroon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarBtnActive: {
    transform: [{ scale: 1.04 }],
  },
});
