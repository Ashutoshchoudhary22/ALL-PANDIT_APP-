import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminScreenHeader } from '@/components/AdminScreenHeader';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAuth } from '@/providers/AuthProvider';

const MENU_ITEMS = [
  { label: 'Manage Services', icon: 'flower-outline' as const, color: C.primary, bg: C.purpleBg },
  { label: 'Manage Coupons', icon: 'pricetag-outline' as const, color: C.warning, bg: C.orangeBg },
  { label: 'System Settings', icon: 'settings-outline' as const, color: C.info, bg: C.blueBg },
  { label: 'Notifications', icon: 'notifications-outline' as const, color: C.pink, bg: C.pinkBg },
  { label: 'Help & Support', icon: 'help-circle-outline' as const, color: C.cyan, bg: C.cyanBg },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const roleLabel = user?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AdminScreenHeader title="More" subtitle="Settings and account options" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <PremiumCard accent="gold">
          <View style={styles.profileCard}>
            <LinearGradient colors={[...C.headerGradient]} style={styles.profileAvatar}>
              <Ionicons name="shield-checkmark" size={28} color="#fff" />
            </LinearGradient>
            <View style={styles.profileText}>
              <Text style={styles.profileRole}>{roleLabel}</Text>
              <Text style={styles.profileEmail}>{user?.email || user?.mobile || 'Admin account'}</Text>
            </View>
          </View>
        </PremiumCard>

        <Text style={styles.sectionTitle}>Quick Menu</Text>
        <PremiumCard accent="none">
          <View style={styles.menuWrap}>
            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.label}
                style={[styles.menuRow, index < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
                onPress={() => {
                  if (item.label === 'Notifications') {
                    router.push('/notifications');
                  }
                }}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={C.textLight} />
              </Pressable>
            ))}
          </View>
        </PremiumCard>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <LinearGradient
            colors={[C.primaryLight, C.primary, C.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.borderGold,
  },
  profileText: {
    flex: 1,
  },
  profileRole: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 13,
    color: C.textMuted,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  menuWrap: {
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 160, 23, 0.15)',
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  logoutBtn: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
