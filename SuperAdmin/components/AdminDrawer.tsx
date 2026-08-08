import { Ionicons } from '@expo/vector-icons';
import { Href, router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAuth } from '@/providers/AuthProvider';

const DRAWER_WIDTH = 300;

type AdminDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  matchPaths: string[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'grid-outline',
    href: '/(tabs)',
    matchPaths: ['/', '/index', '/(tabs)', '/(tabs)/index'],
  },
  {
    id: 'pandit-profiles',
    label: 'Pandit Profile',
    icon: 'person-outline',
    href: '/pandit-profiles',
    matchPaths: ['/pandit-profiles'],
  },
  {
    id: 'customer-profiles',
    label: 'Customer Profile',
    icon: 'people-outline',
    href: '/customer-profiles',
    matchPaths: ['/customer-profiles'],
  },
  {
    id: 'customer-wallets',
    label: 'Customer Wallets',
    icon: 'wallet-outline',
    href: '/customer-wallets',
    matchPaths: ['/customer-wallets'],
  },
  {
    id: 'pandit-reviews',
    label: 'Pandit Reviews',
    icon: 'star-outline',
    href: '/pandit-reviews',
    matchPaths: ['/pandit-reviews'],
  },
];

function isActivePath(pathname: string, item: MenuItem) {
  if (item.matchPaths.includes(pathname)) return true;
  if (item.id === 'dashboard' && (pathname === '/' || pathname.startsWith('/(tabs)'))) {
    return true;
  }
  return pathname.startsWith(item.href as string);
}

export function AdminDrawer({ visible, onClose }: AdminDrawerProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user } = useAuth();
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(visible ? 0 : -DRAWER_WIDTH, { duration: 240 });
    overlayOpacity.value = withTiming(visible ? 1 : 0, { duration: 240 });
  }, [visible, overlayOpacity, translateX]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleNavigate = (item: MenuItem) => {
    onClose();
    if (item.id === 'dashboard') {
      router.replace('/(tabs)');
      return;
    }
    router.push(item.href);
  };

  const roleLabel = user?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[styles.drawer, drawerStyle, { paddingBottom: insets.bottom + 16 }]}
        >
          <LinearGradient
            colors={[...C.headerGradientDeep]}
            style={[styles.drawerHeader, { paddingTop: insets.top + 18 }]}
          >
            <View style={styles.drawerAvatar}>
              <Ionicons name="shield-checkmark" size={26} color="#fff" />
            </View>
            <View style={styles.drawerHeaderText}>
              <Text style={styles.drawerTitle}>ApnaAcharya Admin</Text>
              <Text style={styles.drawerSubtitle}>{roleLabel}</Text>
              {user?.email ? <Text style={styles.drawerEmail}>{user.email}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </LinearGradient>

          <View style={styles.drawerBody}>
            <Text style={styles.sectionLabel}>Modules</Text>

            {MENU_ITEMS.map((item) => {
              const active = isActivePath(pathname, item);
              return (
                <Pressable
                  key={item.id}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => handleNavigate(item)}
                >
                  <View style={[styles.menuIconWrap, active && styles.menuIconWrapActive]}>
                    <Ionicons name={item.icon} size={20} color={active ? C.primary : C.textMuted} />
                  </View>
                  <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{item.label}</Text>
                  {active ? <Ionicons name="chevron-forward" size={16} color={C.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76, 29, 149, 0.45)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: C.screenBg,
    shadowColor: C.shadow,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 160, 23, 0.25)',
  },
  drawerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: C.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerHeaderText: {
    flex: 1,
    paddingTop: 2,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
  drawerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  drawerEmail: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBody: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.12)',
  },
  menuItemActive: {
    backgroundColor: C.purpleBg,
    borderColor: C.borderGold,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.screenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapActive: {
    backgroundColor: '#EDE9FE',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  menuLabelActive: {
    color: C.primary,
    fontWeight: '800',
  },
});
