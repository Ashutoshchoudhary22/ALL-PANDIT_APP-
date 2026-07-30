import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardColors as C } from '@/constants/dashboard-theme';

type ImageUploadFieldProps = {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (uri: string | null) => void;
  uploading?: boolean;
};

export function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  uploading = false,
}: ImageUploadFieldProps) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Pressable style={styles.box} onPress={pickImage} disabled={uploading}>
        {value ? (
          <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="cloud-upload-outline" size={28} color={C.primary} />
            <Text style={styles.placeholderText}>Tap to upload photo</Text>
          </View>
        )}

        {uploading ? (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : null}
      </Pressable>

      {value ? (
        <Pressable onPress={() => onChange(null)} style={styles.removeBtn}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: '700', color: C.text },
  hint: { marginTop: 4, fontSize: 12, color: C.textMuted, lineHeight: 18 },
  box: {
    marginTop: 10,
    height: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  removeBtn: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4 },
  removeText: { color: C.danger, fontSize: 13, fontWeight: '600' },
});
