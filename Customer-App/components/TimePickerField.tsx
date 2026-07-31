import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeColors as C } from '@/constants/home-theme';

const TIME_OPTIONS = (() => {
  const slots: string[] = [];
  for (let hour = 6; hour <= 21; hour += 1) {
    for (const minute of [0, 30]) {
      const date = new Date(2000, 0, 1, hour, minute);
      slots.push(
        date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      );
    }
  }
  return slots;
})();

type TimePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function TimePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select time',
}: TimePickerFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setVisible(true)}>
        <Ionicons name="time-outline" size={18} color={C.textMuted} />
        <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={styles.card}>
            <Text style={styles.title}>Select Time</Text>
            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={(item) => item}
              style={styles.list}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onChange(item);
                      setVisible(false);
                    }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function timeLabelTo24Hour(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return value;
  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  value: { fontSize: 15, color: C.text },
  placeholder: { color: C.textLight },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  title: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 12, textAlign: 'center' },
  list: { maxHeight: 360 },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  optionSelected: { backgroundColor: '#FFF7ED' },
  optionText: { fontSize: 15, color: C.text, fontWeight: '600', textAlign: 'center' },
  optionTextSelected: { color: C.primary, fontWeight: '800' },
});
