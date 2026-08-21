import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, radius } from '@theme';
import { pressable } from '@utils/press';
import { rf } from '@utils/responsive';

export interface PhotoViewerProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  onDelete?: () => void;
}

/**
 * Full-screen viewer for a gallery photo.
 *
 * The grid crops every tile to a square, so this is the only place the artist
 * can see what they actually uploaded — `contentFit="contain"` on black, at
 * full width.
 */
const PhotoViewerComponent = ({ visible, uri, onClose, onDelete }: PhotoViewerProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Tapping anywhere off the controls closes, as viewers usually do. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            transition={150}
            // Matches the grid — see the note there on reused storage keys.
            cachePolicy="none"
            accessibilityLabel="Photo"
          />
        ) : null}

        {/* Dev only: the URL this tile is actually pointing at. If the picture
            above isn't the one that was uploaded, this says where it came
            from — which separates a client bug from a storage one without
            anyone having to read the Metro console. */}
        {__DEV__ && uri ? (
          <Text
            variant="bodySm"
            color="textMuted"
            style={[styles.debugUrl, { top: insets.top + 60 }]}
            selectable
          >
            {uri}
          </Text>
        ) : null}

        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={[styles.close, { top: insets.top + 12 }]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Feather name="x" size={rf(18)} color={colors.white} />
        </Pressable>

        {onDelete ? (
          <Pressable
            onPress={onDelete}
            style={pressable([styles.delete, { bottom: insets.bottom + 24 }])}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <Feather name="trash-2" size={rf(14)} color={colors.red} />
            <Text variant="bodySm" color="red" style={styles.deleteLabel}>
              Remove
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
};

export const PhotoViewer = memo(PhotoViewerComponent);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayStrong,
  },
  image: {
    width: '100%',
    height: '80%',
  },
  debugUrl: {
    position: 'absolute',
    left: 16,
    right: 16,
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayDim,
  },
  delete: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  deleteLabel: {
    fontFamily: fontFamily.bold,
  },
});
