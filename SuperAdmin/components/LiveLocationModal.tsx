import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import { reverseGeocodeAddress } from '@/lib/reverse-geocode';
import {
  getLocationHistoryApi,
  getLocationTrackingStatusApi,
  LocationHistoryDate,
  LocationHistoryPoint,
  setLocationTrackingApi,
} from '@/services/admin-location.api';

type LiveLocationModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: number;
  role: 'customer' | 'pandit';
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

function formatPointTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildMapHtml(
  latitude: number,
  longitude: number,
  trailPoints: LocationHistoryPoint[] = [],
) {
  const lat = latitude.toFixed(6);
  const lon = longitude.toFixed(6);
  const trailJson = JSON.stringify(
    trailPoints.map((point) => [point.latitude, point.longitude]),
  );

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
      var current = [${lat}, ${lon}];
      var trail = ${trailJson};
      var map = L.map('map', { zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      if (trail.length > 0) {
        var line = L.polyline(trail, { color: '#2563EB', weight: 4, opacity: 0.85 }).addTo(map);
        L.circleMarker(trail[0], {
          radius: 7,
          color: '#16A34A',
          fillColor: '#16A34A',
          fillOpacity: 1,
          weight: 2
        }).addTo(map).bindPopup('Start');
        if (trail.length > 1) {
          L.circleMarker(trail[trail.length - 1], {
            radius: 7,
            color: '#DC2626',
            fillColor: '#DC2626',
            fillOpacity: 1,
            weight: 2
          }).addTo(map).bindPopup('Latest saved point');
        }
        map.fitBounds(line.getBounds(), { padding: [28, 28] });
      } else {
        map.setView(current, 15);
      }

      L.marker(current).addTo(map).bindPopup('Current live location');
    </script>
  </body>
</html>`;
}

export function LiveLocationModal({
  visible,
  onClose,
  userId,
  role,
  name,
  latitude,
  longitude,
  updatedAt,
  cityName,
}: LiveLocationModalProps) {
  const insets = useSafeAreaInsets();
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [historyDates, setHistoryDates] = useState<LocationHistoryDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [historyPoints, setHistoryPoints] = useState<LocationHistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const mapHtml = useMemo(
    () => buildMapHtml(latitude, longitude, trackingEnabled ? historyPoints : []),
    [latitude, longitude, historyPoints, trackingEnabled],
  );

  const loadHistory = async (date?: string | null) => {
    setHistoryLoading(true);
    try {
      const response = await getLocationHistoryApi({ userId, role, date });
      setHistoryPoints(response.data.points);
    } catch (error) {
      Alert.alert(
        'Location History',
        error instanceof Error ? error.message : 'Could not load location history',
      );
      setHistoryPoints([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadTrackingState = async () => {
    setTrackingLoading(true);
    try {
      const response = await getLocationTrackingStatusApi(userId, role);
      setTrackingEnabled(response.data.trackingEnabled);
      setHistoryDates(response.data.dates);
      if (response.data.trackingEnabled) {
        const nextDate = selectedDate ?? response.data.dates[0]?.date ?? null;
        setSelectedDate(nextDate);
        await loadHistory(nextDate);
      } else {
        setSelectedDate(null);
        setHistoryPoints([]);
      }
    } catch (error) {
      Alert.alert(
        'Location Tracking',
        error instanceof Error ? error.message : 'Could not load tracking status',
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      setCurrentAddress(null);
      setAddressLoading(false);
      setTrackingEnabled(false);
      setTrackingLoading(false);
      setTrackingSaving(false);
      setHistoryDates([]);
      setSelectedDate(null);
      setHistoryPoints([]);
      setHistoryLoading(false);
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

    void loadTrackingState();

    return () => {
      cancelled = true;
    };
  }, [visible, latitude, longitude, userId, role]);

  const handleToggleTracking = async (enabled: boolean) => {
    setTrackingSaving(true);
    try {
      await setLocationTrackingApi({
        userId,
        role,
        enabled,
        latitude: enabled ? latitude : undefined,
        longitude: enabled ? longitude : undefined,
      });
      setTrackingEnabled(enabled);
      if (enabled) {
        await loadTrackingState();
      } else {
        setHistoryDates([]);
        setSelectedDate(null);
        setHistoryPoints([]);
      }
    } catch (error) {
      Alert.alert(
        'Location Tracking',
        error instanceof Error ? error.message : 'Could not update tracking',
      );
    } finally {
      setTrackingSaving(false);
    }
  };

  const handleSelectDate = async (date: string | null) => {
    setSelectedDate(date);
    await loadHistory(date);
  };

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

          <View style={styles.trackCard}>
            <View style={styles.trackTextWrap}>
              <Text style={styles.trackTitle}>Track Movement</Text>
              <Text style={styles.trackHint}>
                {trackingEnabled
                  ? 'Saving coordinates on every live location update'
                  : 'Turn ON to save all coordinates in database'}
              </Text>
            </View>
            {trackingLoading ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Switch
                value={trackingEnabled}
                onValueChange={handleToggleTracking}
                disabled={trackingSaving}
                trackColor={{ false: C.border, true: '#86EFAC' }}
                thumbColor={trackingEnabled ? C.success : '#fff'}
              />
            )}
          </View>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View style={styles.mapWrap}>
              <WebView
                key={`${latitude}-${longitude}-${historyPoints.length}-${selectedDate ?? 'all'}`}
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

            {trackingEnabled ? (
              <>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>Movement History</Text>
                  <Text style={styles.historyMeta}>
                    {historyPoints.length} point{historyPoints.length === 1 ? '' : 's'}
                  </Text>
                </View>

                {historyDates.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateRow}
                  >
                    <Pressable
                      style={[styles.dateChip, selectedDate === null && styles.dateChipActive]}
                      onPress={() => void handleSelectDate(null)}
                    >
                      <Text
                        style={[
                          styles.dateChipText,
                          selectedDate === null && styles.dateChipTextActive,
                        ]}
                      >
                        All
                      </Text>
                    </Pressable>
                    {historyDates.map((item) => (
                      <Pressable
                        key={item.date}
                        style={[
                          styles.dateChip,
                          selectedDate === item.date && styles.dateChipActive,
                        ]}
                        onPress={() => void handleSelectDate(item.date)}
                      >
                        <Text
                          style={[
                            styles.dateChipText,
                            selectedDate === item.date && styles.dateChipTextActive,
                          ]}
                        >
                          {formatDateLabel(item.date)} ({item.pointCount})
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.emptyHistoryText}>
                    No saved coordinates yet. Points will appear as the user moves with the app open.
                  </Text>
                )}

                {historyLoading ? (
                  <View style={styles.historyLoading}>
                    <ActivityIndicator size="small" color={C.primary} />
                    <Text style={styles.historyLoadingText}>Loading route...</Text>
                  </View>
                ) : historyPoints.length > 0 ? (
                  <View style={styles.pointsCard}>
                    {historyPoints.map((point, index) => (
                      <View
                        key={point.id}
                        style={[
                          styles.pointRow,
                          index === historyPoints.length - 1 && styles.pointRowLast,
                        ]}
                      >
                        <View style={styles.pointIndexWrap}>
                          <Text style={styles.pointIndex}>{index + 1}</Text>
                        </View>
                        <View style={styles.pointTextWrap}>
                          <Text style={styles.pointTime}>{formatPointTime(point.recordedAt)}</Text>
                          <Text style={styles.pointCoords}>
                            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}

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
              <Text style={styles.liveText}>
                {trackingEnabled
                  ? 'Blue line shows saved movement route'
                  : 'Live GPS coordinates from mobile app'}
              </Text>
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
    maxHeight: '92%',
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
    marginBottom: 12,
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
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  trackTextWrap: { flex: 1 },
  trackTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  trackHint: { marginTop: 4, fontSize: 12, lineHeight: 17, color: C.textMuted },
  mapWrap: {
    width: '100%',
    height: 240,
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
  historyHeader: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  historyMeta: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  dateRow: { gap: 8, paddingVertical: 12 },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#fff',
  },
  dateChipActive: {
    borderColor: C.primary,
    backgroundColor: '#FFF7ED',
  },
  dateChipText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  dateChipTextActive: { color: C.primary },
  emptyHistoryText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
  },
  historyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  historyLoadingText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  pointsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    overflow: 'hidden',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pointRowLast: { borderBottomWidth: 0 },
  pointIndexWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointIndex: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
  pointTextWrap: { flex: 1 },
  pointTime: { fontSize: 13, fontWeight: '700', color: C.text },
  pointCoords: { marginTop: 2, fontSize: 12, color: C.textMuted },
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
  liveText: { fontSize: 12, color: C.textMuted, fontWeight: '600', textAlign: 'center' },
});
