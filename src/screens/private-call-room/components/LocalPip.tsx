import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { live } from '@components/live';
import { colors, radius } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface LocalPipProps {
  videoAvailable: boolean;
  camOn: boolean;
  videoKey: number;
}

/** The artist's own local preview, picture-in-picture in the call stage's corner. */
export const LocalPip = ({ videoAvailable, camOn, videoKey }: LocalPipProps) => (
  <View style={styles.pip}>
    {videoAvailable && camOn ? (
      <AgoraVideoView key={videoKey} uid={0} style={StyleSheet.absoluteFill} overlay />
    ) : (
      <View style={styles.pipPlaceholder}>
        <Feather name="video-off" size={rf(18)} color={colors.textMuted} />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  pip: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 16,
    width: wp(24),
    height: wp(33),
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: live.stageBg,
    borderWidth: 1,
    borderColor: live.overlayPillBorder,
  },
  pipPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
