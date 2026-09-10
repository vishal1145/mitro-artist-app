import { Dimensions, PixelRatio } from 'react-native';

/**
 * Responsive scaling helpers.
 *
 * Usage rules (enforced project-wide):
 *  - font sizes      -> rf()
 *  - padding/margin  -> wp() or hp()
 *  - width/height    -> wp() / hp() / flex
 *  - border radius   -> wp()
 * Never hardcode raw pixel values in StyleSheet.
 *
 * NOTE: font sizes are intentionally NOT width-scaled. The user app ships a
 * fixed type scale (raw pixel sizes, no device scaling), and the artist app
 * must match it 1:1 on every screen — width-scaling made every label ~15%
 * larger than the user app on typical phones. `rf()` therefore returns the
 * declared size verbatim, matching spacing.ts's "measures identically to the
 * user app on every device" contract.
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Raw screen dimensions, exported for edge cases (e.g. full-bleed images). */
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} as const;

/** Percentage of screen width -> device-independent pixels. */
export const wp = (percentage: number): number => {
  const value = (SCREEN_WIDTH * percentage) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/** Percentage of screen height -> device-independent pixels. */
export const hp = (percentage: number): number => {
  const value = (SCREEN_HEIGHT * percentage) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/**
 * Font size — returned verbatim (no width scaling) so the artist app's type
 * scale matches the user app's fixed sizes pixel-for-pixel on every device.
 */
export const rf = (size: number): number => Math.round(PixelRatio.roundToNearestPixel(size));

/** True on wider viewports (tablets, large foldables). */
export const isTablet = (): boolean => SCREEN_WIDTH >= 768;
