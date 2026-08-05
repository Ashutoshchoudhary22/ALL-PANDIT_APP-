import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeColors as C } from '@/constants/home-theme';
import { usePanditFilters } from '@/providers/PanditFiltersProvider';

type PanditFiltersButtonProps = {
  compact?: boolean;
  light?: boolean;
};

export function PanditFiltersButton({ compact = false, light = false }: PanditFiltersButtonProps) {
  const { openFilters, activeCount } = usePanditFilters();

  if (compact) {
    return (
      <Pressable
        style={[styles.iconBtn, light && styles.iconBtnLight]}
        onPress={openFilters}
        hitSlop={8}
      >
        <Ionicons name="options-outline" size={20} color={light ? C.maroon : C.primary} />
        {activeCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeCount}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.filterBtn} onPress={openFilters}>
      <Ionicons name="options-outline" size={20} color={C.primary} />
      <Text style={styles.filterText}>Filters</Text>
      {activeCount > 0 ? (
        <View style={styles.inlineBadge}>
          <Text style={styles.inlineBadgeText}>{activeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  inlineBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnLight: {
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
