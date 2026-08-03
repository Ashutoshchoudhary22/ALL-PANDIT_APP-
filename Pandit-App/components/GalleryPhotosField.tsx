import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardColors as C } from '@/constants/dashboard-theme';

const MAX_PHOTOS = 10;

type GalleryPhotosFieldProps = {
  label?: string;
  hint?: string;
  value: string[];
  onChange: (uris: string[]) => void;
  disabled?: boolean;
};

export function GalleryPhotosField({
  label = 'Gallery Photos',
  hint = 'Add photos of your puja work. These appear on your public profile.',
  value,
  onChange,
  disabled = false,
}: GalleryPhotosFieldProps) {
  const pickPhotos = async () => {
    if (value.length >= MAX_PHOTOS) {
      Alert.alert('Limit reached', `You can add up to ${MAX_PHOTOS} gallery photos.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - value.length,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const next = [...value];
      for (const asset of result.assets) {
        if (asset.uri && next.length < MAX_PHOTOS) next.push(asset.uri);
      }
      onChange(next);
    }
  };

  const removePhoto = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {value.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.photoWrap}>
            <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
            {!disabled ? (
              <Pressable style={styles.removeBtn} onPress={() => removePhoto(index)} hitSlop={6}>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        ))}

        {!disabled && value.length < MAX_PHOTOS ? (
          <Pressable style={styles.addBtn} onPress={pickPhotos}>
            <Ionicons name="add" size={28} color={C.primary} />
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: '700', color: C.text },
  hint: { marginTop: 4, fontSize: 12, color: C.textMuted, lineHeight: 18 },
  row: { gap: 10, paddingTop: 10, paddingBottom: 4 },
  photoWrap: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.border,
  },
  photo: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 4,
  },
  addText: { fontSize: 12, fontWeight: '600', color: C.primary },
});
