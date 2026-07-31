import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeColors as C } from '@/constants/home-theme';
import {
  DISTANCE_OPTIONS,
  EXPERIENCE_OPTIONS,
  FILTER_LANGUAGE_OPTIONS,
  OnlineFilter,
  PRICE_PRESETS,
  RATING_OPTIONS,
  SortOption,
} from '@/lib/pandit-filters';
import { usePanditFilters } from '@/providers/PanditFiltersProvider';

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ChipRow<T extends string | number | null>({
  options,
  value,
  onChange,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.label)}
            style={[styles.chip, selected && styles.chipActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiChipRow({
  options,
  values,
  onToggle,
}: {
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <Pressable
            key={option}
            style={[styles.chip, selected && styles.chipActive]}
            onPress={() => onToggle(option)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: '#FDBA74' }}
        thumbColor={value ? C.primary : '#fff'}
      />
    </View>
  );
}

type PanditFiltersModalProps = {
  hasCustomerLocation?: boolean;
};

export function PanditFiltersModal({ hasCustomerLocation = false }: PanditFiltersModalProps) {
  const insets = useSafeAreaInsets();
  const {
    isOpen,
    closeFilters,
    draftFilters,
    updateDraftFilters,
    applyFilters,
    resetFilters,
  } = usePanditFilters();

  const selectedPricePreset =
    PRICE_PRESETS.find(
      (preset) => preset.min === draftFilters.minPrice && preset.max === draftFilters.maxPrice,
    )?.label ?? 'Any';

  const toggleLanguage = (language: string) => {
    const exists = draftFilters.languages.includes(language);
    updateDraftFilters({
      languages: exists
        ? draftFilters.languages.filter((item) => item !== language)
        : [...draftFilters.languages, language],
    });
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={closeFilters}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeFilters} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter Pandits</Text>
            <Pressable onPress={closeFilters} hitSlop={12}>
              <Ionicons name="close" size={24} color={C.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <SectionTitle title="Rating" />
            <ChipRow
              options={RATING_OPTIONS}
              value={draftFilters.minRating}
              onChange={(value) => updateDraftFilters({ minRating: value })}
            />

            <SectionTitle title="Price" />
            <ChipRow
              options={PRICE_PRESETS.map((preset) => ({ label: preset.label, value: preset.label }))}
              value={selectedPricePreset}
              onChange={(label) => {
                const preset = PRICE_PRESETS.find((item) => item.label === label);
                updateDraftFilters({
                  minPrice: preset?.min ?? null,
                  maxPrice: preset?.max ?? null,
                });
              }}
            />

            <SectionTitle title="Language" />
            <MultiChipRow
              options={FILTER_LANGUAGE_OPTIONS}
              values={draftFilters.languages}
              onToggle={toggleLanguage}
            />

            <SectionTitle title="Experience" />
            <ChipRow
              options={EXPERIENCE_OPTIONS}
              value={draftFilters.minExperience}
              onChange={(value) => updateDraftFilters({ minExperience: value })}
            />

            <SectionTitle title="Availability" />
            <ToggleRow
              label="Available pandits only"
              value={draftFilters.availableOnly}
              onChange={(value) => updateDraftFilters({ availableOnly: value })}
            />

            <SectionTitle title="Distance" />
            {!hasCustomerLocation ? (
              <Text style={styles.helperText}>
                Enable location in your profile to filter pandits by distance.
              </Text>
            ) : null}
            <ChipRow
              options={DISTANCE_OPTIONS}
              value={draftFilters.maxDistanceKm}
              onChange={(value) => updateDraftFilters({ maxDistanceKm: value })}
            />

            <SectionTitle title="Online / Offline" />
            <ChipRow<OnlineFilter>
              options={[
                { label: 'Any', value: 'any' },
                { label: 'Online', value: 'online' },
                { label: 'Offline', value: 'offline' },
              ]}
              value={draftFilters.onlineStatus}
              onChange={(value) => updateDraftFilters({ onlineStatus: value })}
            />

            <SectionTitle title="Verified" />
            <ToggleRow
              label="Verified pandits only"
              value={draftFilters.verifiedOnly}
              onChange={(value) => updateDraftFilters({ verifiedOnly: value })}
            />

            <SectionTitle title="Same Day Booking" />
            <ToggleRow
              label="Same-day booking available"
              value={draftFilters.sameDayOnly}
              onChange={(value) => updateDraftFilters({ sameDayOnly: value })}
            />

            <SectionTitle title="Sort By" />
            <ChipRow<SortOption>
              options={[
                { label: 'Rating', value: 'rating' },
                { label: 'Price', value: 'price' },
                { label: 'Experience', value: 'experience' },
                { label: 'Distance', value: 'distance' },
              ]}
              value={draftFilters.sortBy}
              onChange={(value) => updateDraftFilters({ sortBy: value })}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetText}>Clear All</Text>
            </Pressable>
            <Pressable style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
  },
  chipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  chipTextActive: {
    color: C.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  helperText: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  resetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMuted,
  },
  applyBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
