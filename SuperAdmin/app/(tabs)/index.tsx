import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ADMIN_COLORS } from '@/constants/admin-theme';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={28} color={ADMIN_COLORS.primary} />
        </View>
        <Text style={styles.title}>Super Admin Dashboard</Text>
        <Text style={styles.subtitle}>
          Welcome{user?.email ? `, ${user.email}` : ''}. Manage My-Pandit platform from here.
        </Text>
        {user?.role ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: '800',
    color: ADMIN_COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: ADMIN_COLORS.label,
    textAlign: 'center',
    lineHeight: 22,
  },
  roleBadge: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: ADMIN_COLORS.primary,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    marginTop: 48,
    height: 52,
    borderRadius: 26,
    backgroundColor: ADMIN_COLORS.primary,
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
