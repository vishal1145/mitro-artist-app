import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { LucideIcon } from '@components/ui/LucideIcon';

import { C } from '../colors';
import { styles } from '../styles';

export const ProfilePictureSection = ({
  avatarUrl,
  stageName,
  onChange,
  isUploading,
}: {
  avatarUrl: string | null;
  stageName?: string | null;
  onChange: () => void;
  isUploading: boolean;
}) => {
  const initial = stageName ? stageName.substring(0, 2).toUpperCase() : 'AR';
  return (
    <View style={styles.avatarRow}>
      <LinearGradient
        colors={[C.pink, C.violet]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatarBig}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarBigImg} contentFit="cover" />
        ) : (
          <Text style={styles.avatarBigText}>{initial}</Text>
        )}
      </LinearGradient>
      <Pressable
        style={[styles.btnFile, isUploading ? { opacity: 0.7 } : null]}
        onPress={onChange}
        disabled={isUploading}
      >
        <LucideIcon name="camera" size={13} color={C.text} />
        <Text style={styles.btnFileText}>{isUploading ? 'Uploading...' : 'Change Avatar'}</Text>
      </Pressable>
    </View>
  );
};
