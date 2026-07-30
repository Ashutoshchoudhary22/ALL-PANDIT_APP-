import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';

type LiveLocationModalProps = {
  visible: boolean;
  onClose: () => void;
  name: string;
  latitude: number;
  longitude: number;
  updatedAt?: string | null;
  cityName?: string | null;
};

function formatUpdatedAt(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function staticMapUrl(latitude: number, longitude: number) {
  const lat = latitude.toFixed(6);
  const lon = longitude.toFixed(6);
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=14&size=640x280&markers=${lat},${lon},red-pushpin`;
}

export function LiveLocationModal({
  visible,
  onClose,
  name,
  latitude,
  longitude,
  updatedAt,
  cityName,
}: LiveLocationModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="location" size={22} color={C.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Live Location</Text>
              <Text style={styles.subtitle}>{name}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={C.textMuted} />
            </Pressable>
          </View>

          <Image
            source={{ uri: staticMapUrl(latitude, longitude) }}
            style={styles.map}
            contentFit="cover"
          />

          <View style={styles.coordsCard}>
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>{latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>{longitude.toFixed(6)}</Text>
            </View>
            {cityName ? (
              <>
                <View style={styles.divider} />
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>City</Text>
                  <Text style={styles.coordValue}>{cityName}</Text>
                </View>
              </>
            ) : null}
            <View style={styles.divider} />
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>Last updated</Text>
              <Text style={styles.coordValue}>{formatUpdatedAt(updatedAt)}</Text>
            </View>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live GPS coordinates from mobile app</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: C.text },
  subtitle: { marginTop: 2, fontSize: 13, color: C.textMuted },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: C.border,
  },
  coordsCard: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  coordLabel: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  coordValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: C.text,
    fontWeight: '700',
  },
  divider: { height: 1, backgroundColor: C.border },
  liveBadge: {
    marginTop: 14,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.success,
  },
  liveText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
});
