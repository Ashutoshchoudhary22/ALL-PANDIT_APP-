import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { useAdminDrawer } from '@/providers/AdminDrawerProvider';

type AdminScreenHeaderProps = {
  title: string;
  subtitle?: string;
  light?: boolean;
};

export function AdminScreenHeader({ title, subtitle, light = false }: AdminScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useAdminDrawer();

  const textColor = light ? '#fff' : C.text;
  const subColor = light ? 'rgba(255,255,255,0.8)' : C.textMuted;
  const iconColor = light ? '#fff' : C.text;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }, light && styles.wrapLight]}>
      <Pressable onPress={openDrawer} style={styles.menuBtn} hitSlop={12}>
        <Ionicons name="menu" size={24} color={iconColor} />
      </Pressable>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: C.background,
  },
  wrapLight: {
    backgroundColor: C.primary,
  },
  menuBtn: {
    padding: 4,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
  },
});
