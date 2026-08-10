import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardColors as C } from '@/constants/dashboard-theme';
import {
  areAllPanditPermissionsGranted,
  getPanditPermissionStatus,
  requestAllPanditPermissions,
} from '@/lib/app-permissions';
import { requestLiveLocationPermission } from '@/lib/live-location';
import { useAuth } from '@/providers/AuthProvider';

type LiveLocationGateProps = {
  children: ReactNode;
  role: 'customer' | 'pandit';
};

const LiveLocationGrantedContext = createContext(true);

export function useLiveLocationGranted() {
  return useContext(LiveLocationGrantedContext);
}

async function getPermissionWithTimeout(timeoutMs = 5000) {
  return Promise.race([
    Location.getForegroundPermissionsAsync(),
    new Promise<Location.PermissionResponse>((_, reject) => {
      setTimeout(() => reject(new Error('Location permission check timed out')), timeoutMs);
    }),
  ]);
}

export function LiveLocationGate({ children, role }: LiveLocationGateProps) {
  const insets = useSafeAreaInsets();
  const { token, user, isLoading, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const [permissionsOk, setPermissionsOk] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  const shouldEnforce = Platform.OS !== 'web' && Boolean(token && user?.role === role);
  const isPandit = role === 'pandit';
  const canUseApp = !shouldEnforce || permissionsOk;
  const showLoadingOverlay = shouldEnforce && isLoading;

  const refreshPermission = useCallback(
    async (silent = false) => {
      if (!shouldEnforce) {
        setPermissionsOk(true);
        setChecking(false);
        return;
      }

      if (!silent) {
        setChecking(true);
      }

      try {
        if (isPandit) {
          const status = await getPanditPermissionStatus();
          setPermissionsOk(areAllPanditPermissionsGranted(status));
        } else {
          const { status } = await getPermissionWithTimeout();
          setPermissionsOk(status === 'granted');
        }
      } catch {
        setPermissionsOk(false);
      } finally {
        setChecking(false);
      }
    },
    [isPandit, shouldEnforce],
  );

  useEffect(() => {
    void refreshPermission(false);
  }, [refreshPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshPermission(true);
      }
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const handleAllow = async () => {
    setRequesting(true);
    setShowSettingsHint(false);

    try {
      if (isPandit) {
        const status = await requestAllPanditPermissions();
        setPermissionsOk(areAllPanditPermissionsGranted(status));
        if (!areAllPanditPermissionsGranted(status)) {
          setShowSettingsHint(true);
        }
      } else {
        const ok = await requestLiveLocationPermission();
        setPermissionsOk(ok);
        if (!ok) {
          setShowSettingsHint(true);
        }
      }
    } finally {
      setRequesting(false);
      await refreshPermission(true);
    }
  };

  const handleOpenSettings = () => {
    void Linking.openSettings();
  };

  return (
    <LiveLocationGrantedContext.Provider value={canUseApp}>
      <View style={styles.root}>
        <View
          style={[
            styles.content,
            !canUseApp && !showLoadingOverlay ? styles.blockedContent : null,
          ]}
          pointerEvents={!canUseApp && !showLoadingOverlay ? 'none' : 'auto'}
        >
          {children}
        </View>

        {showLoadingOverlay ? (
          <View style={[styles.loadingOverlay, { paddingTop: insets.top }]}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : null}

        <Modal
          visible={shouldEnforce && !permissionsOk && !checking && !isLoading}
          animationType="fade"
          transparent
          statusBarTranslucent
        >
          <View style={styles.overlay}>
            <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.iconWrap}>
                <Ionicons name="location" size={36} color={C.primary} />
              </View>
              <Text style={styles.title}>Access your location</Text>
              <Text style={styles.message}>
                Allow location and notifications to receive bookings and share your live position
                with customers.
              </Text>

              <Pressable
                style={[styles.allowBtn, requesting && styles.btnDisabled]}
                onPress={handleAllow}
                disabled={requesting}
              >
                {requesting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.allowText}>Allow Access</Text>
                )}
              </Pressable>

              {showSettingsHint ? (
                <Pressable style={styles.settingsBtn} onPress={handleOpenSettings}>
                  <Text style={styles.settingsText}>Open Settings</Text>
                </Pressable>
              ) : null}

              <Pressable style={styles.logoutBtn} onPress={() => signOut()}>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </LiveLocationGrantedContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  blockedContent: { opacity: 0.35 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
    zIndex: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
  },
  allowBtn: {
    marginTop: 22,
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  allowText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  settingsBtn: {
    marginTop: 12,
    paddingVertical: 10,
  },
  settingsText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 8,
    paddingVertical: 8,
  },
  logoutText: {
    color: C.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
