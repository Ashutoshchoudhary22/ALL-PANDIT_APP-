import { Image, ImageStyle, ImageResizeMode, StyleProp, View } from 'react-native';

import { ImagePreset } from '@/constants/cloudinary';
import { getCloudinaryUrl } from '@/lib/cloudinary';

type CloudImageProps = {
  source?: string | null;
  preset?: ImagePreset;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

export function CloudImage({
  source,
  preset = 'avatar',
  style,
  resizeMode = 'cover',
}: CloudImageProps) {
  const uri = getCloudinaryUrl(source, preset);

  if (!uri) {
    return (
      <View
        style={[
          style,
          { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
        ]}
      />
    );
  }

  return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
}
