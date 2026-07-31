import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  PUJA_SERVICE_OPTIONS,
  PujaServiceDraft,
  PujaServiceName,
} from '@/constants/puja-services';
import { DashboardColors as C } from '@/constants/dashboard-theme';

type Props = {
  value: PujaServiceDraft[];
  onChange: (next: PujaServiceDraft[]) => void;
  disabled?: boolean;
};

export function PujaServicesField({ value, onChange, disabled = false }: Props) {
  const [search, setSearch] = useState('');
  const selectedNames = new Set(value.map((item) => item.name));

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return PUJA_SERVICE_OPTIONS;
    return PUJA_SERVICE_OPTIONS.filter((name) => name.toLowerCase().includes(query));
  }, [search]);

  const toggleService = (name: PujaServiceName) => {
    if (disabled) return;

    if (selectedNames.has(name)) {
      onChange(value.filter((item) => item.name !== name));
      return;
    }

    onChange([...value, { name, price: '' }]);
  };

  const updatePrice = (name: PujaServiceName, price: string) => {
    onChange(value.map((item) => (item.name === name ? { ...item, price } : item)));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Select the pujas you offer and enter your price for each (in ₹).
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search puja..."
        placeholderTextColor={C.textLight}
        value={search}
        onChangeText={setSearch}
        editable={!disabled}
      />

      <View style={styles.chipGrid}>
        {filteredOptions.map((name) => {
          const selected = selectedNames.has(name);
          return (
            <Pressable
              key={name}
              style={[styles.chip, selected && styles.chipActive, disabled && styles.chipDisabled]}
              onPress={() => toggleService(name)}
              disabled={disabled}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]} numberOfLines={2}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filteredOptions.length === 0 ? (
        <Text style={styles.emptyText}>No puja found for &quot;{search.trim()}&quot;</Text>
      ) : null}

      {value.length > 0 ? (
        <View style={styles.priceList}>
          <Text style={styles.priceListTitle}>Selected Services & Prices</Text>
          {value.map((item) => (
            <View key={item.name} style={styles.priceRow}>
              <Text style={styles.priceLabel} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Price"
                  placeholderTextColor={C.textLight}
                  value={item.price}
                  onChangeText={(text) => updatePrice(item.name, text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  editable={!disabled}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: C.textMuted,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    width: '48%',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: C.orangeBg,
    borderColor: C.primary,
  },
  chipDisabled: { opacity: 0.7 },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
    textAlign: 'center',
  },
  chipTextActive: { color: C.primary },
  priceList: {
    marginTop: 16,
    gap: 10,
  },
  priceListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  priceInputWrap: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 10,
  },
  currency: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMuted,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
});
