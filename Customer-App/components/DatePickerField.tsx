import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeColors as C } from '@/constants/home-theme';

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode?: 'past' | 'future';
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function formatDisplay(value: string): string {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  mode = 'past',
}: DatePickerFieldProps) {
  const today = new Date();
  const initial = toDate(value) || new Date(2000, 0, 1);

  const [visible, setVisible] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const selectedDate = toDate(value);

  const openPicker = () => {
    const base = toDate(value) || new Date(2000, 0, 1);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setVisible(true);
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isNextMonthDisabled =
    mode === 'past'
      ? viewYear > today.getFullYear() ||
        (viewYear === today.getFullYear() && viewMonth >= today.getMonth())
      : false;

  const isDayDisabled = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return mode === 'future' ? dayStart < todayStart : dayStart > todayStart;
  };

  const isSelected = (day: number) =>
    Boolean(
      selectedDate &&
        selectedDate.getFullYear() === viewYear &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getDate() === day,
    );

  const handleSelectDay = (day: number) => {
    onChange(toIsoDateString(viewYear, viewMonth, day));
    setVisible(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={openPicker}>
        <Ionicons name="calendar-outline" size={18} color={C.textMuted} />
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={styles.card}>
            <View style={styles.navRow}>
              <Pressable onPress={() => setViewYear((y) => y - 1)} hitSlop={8} style={styles.navBtn}>
                <Ionicons name="play-back" size={14} color={C.textMuted} />
              </Pressable>
              <Pressable onPress={goPrevMonth} hitSlop={8} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={C.text} />
              </Pressable>
              <Text style={styles.monthYearText}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={goNextMonth}
                hitSlop={8}
                disabled={isNextMonthDisabled}
                style={styles.navBtn}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isNextMonthDisabled ? C.border : C.text}
                />
              </Pressable>
              <Pressable onPress={() => setViewYear((y) => y + 1)} hitSlop={8} style={styles.navBtn}>
                <Ionicons name="play-forward" size={14} color={C.textMuted} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={styles.cell} />;
                }

                const disabled = isDayDisabled(day);
                const selected = isSelected(day);

                return (
                  <Pressable
                    key={day}
                    style={[styles.cell, selected && styles.cellSelected]}
                    onPress={() => handleSelectDay(day)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        disabled && styles.dayTextDisabled,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CELL_SIZE = '14.2857%';

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
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: { padding: 4 },
  monthYearText: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1, textAlign: 'center' },
  weekRow: { flexDirection: 'row', marginTop: 16 },
  weekdayText: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: C.textLight,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: C.primary,
    borderRadius: 999,
  },
  dayText: { fontSize: 14, color: C.text, fontWeight: '600' },
  dayTextDisabled: { color: C.border },
  dayTextSelected: { color: '#fff', fontWeight: '800' },
  closeBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 10 },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: C.textMuted },
});
