import { Ionicons } from '@expo/vector-icons';
import { Href, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAuth } from '@/providers/AuthProvider';

const DRAWER_WIDTH = 288;

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
          style={[styles.drawer, drawerStyle, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.drawerHeader}>
            <View style={styles.drawerAvatar}>
              <Ionicons name="shield-checkmark" size={24} color={C.primary} />
            </View>
            <View style={styles.drawerHeaderText}>
              <Text style={styles.drawerTitle}>My-Pandit Admin</Text>
              <Text style={styles.drawerSubtitle}>{roleLabel}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={C.textMuted} />
            </Pressable>
          </View>

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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerHeaderText: {
    flex: 1,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  drawerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textLight,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: C.purpleBg,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.background,
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
    fontWeight: '700',
  },
});
