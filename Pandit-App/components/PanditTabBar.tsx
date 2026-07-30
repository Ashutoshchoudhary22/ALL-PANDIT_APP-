import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
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

export function PanditTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
                <View style={[styles.calendarBtn, isFocused && styles.calendarBtnActive]}>
                  <Ionicons name="calendar" size={26} color="#fff" />
                </View>
              </PlatformPressable>
            );
          }

          return (
            <PlatformPressable key={route.key} onPress={onPress} style={styles.tab}>
              <Ionicons
                name={isFocused ? config.iconActive : config.icon}
                size={22}
                color={isFocused ? C.primary : C.textLight}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {config.label}
              </Text>
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
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    marginHorizontal: 0,
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textLight,
  },
  tabLabelActive: {
    color: C.primary,
    fontWeight: '700',
  },
  calendarSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -28,
  },
  calendarBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  calendarBtnActive: {
    backgroundColor: C.primaryDark,
  },
});
