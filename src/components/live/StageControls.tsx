import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '@theme';
import { rf, wp } from '@utils/responsive';

import { live } from './liveTokens';

export interface StageControlsProps {
  camOn: boolean;
  micOn: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  /** Omitted when the native video engine isn't available. */
  onFlipCamera?: () => void;
  /**
   * Hide the camera button entirely — for audio-only rooms, where there is no
   * camera to toggle. Defaults to showing it.
   */
  showCamera?: boolean;
  /**
   * Override the top offset — used in fullscreen so the cluster clears the
   * status-bar / notch (pass the safe-area top inset). Defaults to 12.
   */
  topOffset?: number;
}

/**
 * Camera / mic / flip cluster pinned to the top-right of a room's video stage.
 * Same circles, dark glass fill and red "muted" treatment as the broadcast
 * studio's quick controls.
 */
export const StageControls = memo(
  ({
    camOn,
    micOn,
    onToggleCam,
    onToggleMic,
    onFlipCamera,
    showCamera = true,
    topOffset,
  }: StageControlsProps) => (
    <View style={[styles.row, topOffset != null && { top: topOffset }]}>
      {showCamera ? (
        <Pressable
          style={[styles.btn, !camOn && styles.btnMuted]}
          onPress={onToggleCam}
          accessibilityRole="button"
          accessibilityLabel="Toggle camera"
        >
          <Feather
            name={camOn ? 'video' : 'video-off'}
            size={rf(16)}
            color={camOn ? colors.textPrimary : live.mutedIcon}
          />
        </Pressable>
      ) : null}
      <Pressable
        style={[styles.btn, !micOn && styles.btnMuted]}
        onPress={onToggleMic}
        accessibilityRole="button"
        accessibilityLabel="Toggle mic"
      >
        <Feather
          name={micOn ? 'mic' : 'mic-off'}
          size={rf(16)}
          color={micOn ? colors.textPrimary : live.mutedIcon}
        />
      </Pressable>
      {onFlipCamera ? (
        <Pressable
          style={styles.btn}
          onPress={onFlipCamera}
          accessibilityRole="button"
          accessibilityLabel="Flip camera"
        >
          <Feather name="refresh-cw" size={rf(16)} color={colors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  ),
);
StageControls.displayName = 'StageControls';

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.full,
    backgroundColor: colors.chipSurfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMuted: {
    borderWidth: 1,
    borderColor: live.mutedBorder,
    backgroundColor: live.mutedBg,
  },
});
