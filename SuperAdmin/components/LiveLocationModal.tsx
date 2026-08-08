import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { reverseGeocodeAddress } from '@/lib/reverse-geocode';

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

function buildMapHtml(latitude: number, longitude: number) {
  const lat = latitude.toFixed(6);
  const lon = longitude.toFixed(6);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #e2e8f0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lon}], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      L.marker([${lat}, ${lon}]).addTo(map);
    </script>
  </body>
</html>`;
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
  const mapHtml = buildMapHtml(latitude, longitude);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCurrentAddress(null);
      setAddressLoading(false);
      return;
    }

    let cancelled = false;
    setAddressLoading(true);
    setCurrentAddress(null);

    void reverseGeocodeAddress(latitude, longitude)
      .then((address) => {
        if (!cancelled) setCurrentAddress(address);
      })
      .catch(() => {
        if (!cancelled) setCurrentAddress('Address not available');
      })
      .finally(() => {
        if (!cancelled) setAddressLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, latitude, longitude]);

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

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View style={styles.mapWrap}>
              <WebView
                source={{ html: mapHtml }}
                style={styles.map}
                scrollEnabled={false}
                bounces={false}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.mapLoading}>
                    <Text style={styles.mapLoadingText}>Loading map...</Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.coordsCard}>
              <View style={styles.addressBlock}>
                <Text style={styles.coordLabel}>Current Address</Text>
                {addressLoading ? (
                  <View style={styles.addressLoadingRow}>
                    <ActivityIndicator size="small" color={C.primary} />
                    <Text style={styles.addressLoadingText}>Fetching address...</Text>
                  </View>
                ) : (
                  <Text style={styles.addressValue}>{currentAddress || 'Address not available'}</Text>
                )}
              </View>
              <View style={styles.divider} />
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
          </ScrollView>
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
    maxHeight: '88%',
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
  mapWrap: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.border,
  },
  map: {
    flex: 1,
    backgroundColor: C.border,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  mapLoadingText: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
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
  addressBlock: {
    paddingVertical: 12,
    gap: 8,
  },
  addressLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLoadingText: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },
  addressValue: {
    fontSize: 13,
    lineHeight: 20,
    color: C.text,
    fontWeight: '600',
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
