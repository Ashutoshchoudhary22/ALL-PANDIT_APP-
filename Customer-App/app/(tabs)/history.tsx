import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeColors as C } from '@/constants/home-theme';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 }]}>
      <Text style={styles.title}>History</Text>
      <View style={styles.placeholder}>
        <Ionicons name="time-outline" size={48} color={C.textLight} />
        <Text style={styles.placeholderText}>Your booking history will appear here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 24 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderText: { fontSize: 15, color: C.textMuted },
});
