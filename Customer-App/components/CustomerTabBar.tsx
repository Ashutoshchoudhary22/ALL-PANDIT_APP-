import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeColors as C } from '@/constants/home-theme';

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  home: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  bookings: { label: 'Bookings', icon: 'calendar-outline', iconActive: 'calendar' },
  search: { label: 'Search', icon: 'search', iconActive: 'search' },
  history: { label: 'History', icon: 'time-outline', iconActive: 'time' },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

export function CustomerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          if (route.name === 'index' || route.name === 'explore') return null;

          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const isSearch = route.name === 'search';

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

          if (isSearch) {
            return (
              <PlatformPressable key={route.key} onPress={onPress} style={styles.searchSlot}>
                <View style={[styles.searchBtn, isFocused && styles.searchBtnActive]}>
                  <Ionicons name="search" size={26} color="#fff" />
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
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
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
  searchSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -28,
  },
  searchBtn: {
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
  searchBtnActive: {
    backgroundColor: C.primaryDark,
  },
});
