import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

/**
 * Thin wrapper around react-native-agora's RtcSurfaceView. Lazy-requires the
 * native module so the JS still loads in Expo Go / on devices where the
 * native lib is missing (renders an empty view instead of crashing).
 *
 * uid 0  → the local camera (host preview / own PIP).
 * uid >0 → a remote participant's video (private-call peer).
 */
let RtcSurfaceView: React.ComponentType<{ canvas: { uid: number }; style?: StyleProp<ViewStyle>; zOrderMediaOverlay?: boolean }> | null =
  null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-agora');
  RtcSurfaceView = mod?.RtcSurfaceView ?? null;
} catch {
  RtcSurfaceView = null;
}

export function AgoraVideoView({
  uid,
  style,
  overlay,
}: {
  uid: number;
  style?: StyleProp<ViewStyle>;
  /** Render above other surfaces (used for the small local PIP). */
  overlay?: boolean;
}) {
  if (!RtcSurfaceView) {
    return <View style={style} />;
  }
  return <RtcSurfaceView style={style} canvas={{ uid }} zOrderMediaOverlay={overlay} />;
}

export function isAgoraVideoAvailable(): boolean {
  return RtcSurfaceView !== null;
}
