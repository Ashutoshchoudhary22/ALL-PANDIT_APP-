import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { LiveLocationModal } from '@/components/LiveLocationModal';
import { DashboardColors as C } from '@/constants/dashboard-theme';

type LiveLocationIconButtonProps = {
  userId: number;
  role: 'customer' | 'pandit';
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  updatedAt?: string | null;
  cityName?: string | null;
  size?: number;
};

export function LiveLocationIconButton({
  userId,
  role,
  name,
  latitude,
  longitude,
  updatedAt,
  cityName,
  size = 20,
}: LiveLocationIconButtonProps) {
  const [visible, setVisible] = useState(false);
  const hasLocation = latitude != null && longitude != null;

  const handlePress = () => {
    if (!hasLocation) {
      Alert.alert('Live Location', 'Live location is not available yet for this profile.');
      return;
    }
    setVisible(true);
  };

  return (
    <>
      <Pressable
        style={[styles.btn, hasLocation ? styles.btnActive : styles.btnInactive]}
        onPress={handlePress}
        hitSlop={8}
      >
        <Ionicons
          name={hasLocation ? 'location' : 'location-outline'}
          size={size}
          color={hasLocation ? C.success : C.textLight}
        />
      </Pressable>

      {hasLocation ? (
        <LiveLocationModal
          visible={visible}
          onClose={() => setVisible(false)}
          userId={userId}
          role={role}
          name={name}
          latitude={latitude}
          longitude={longitude}
          updatedAt={updatedAt}
          cityName={cityName}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: C.greenBg,
  },
  btnInactive: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
  },
});
