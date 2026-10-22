import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

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

/**
 * Widest the app's content ever gets. Every phone is narrower, so phones are
 * unchanged; tablets and unfolded foldables render a centred phone-width column
 * (see app/_layout.tsx).
 */
export const MAX_APP_WIDTH = 480;

/** Current app column width / window height, read live (fold, rotation, split screen). */
const appWidth = (): number => Math.min(Dimensions.get('window').width, MAX_APP_WIDTH);
const appHeight = (): number => Dimensions.get('window').height;

/** App column dimensions, exported for edge cases (e.g. full-bleed images). */
export const SCREEN = {
  get width(): number {
    return appWidth();
  },
  get height(): number {
    return appHeight();
  },
};

/** Live app column width for render-time layout maths. */
export const useAppWidth = (): number => Math.min(useWindowDimensions().width, MAX_APP_WIDTH);

/** Percentage of screen width -> device-independent pixels. */
export const wp = (percentage: number): number => {
  const value = (appWidth() * percentage) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/** Percentage of screen height -> device-independent pixels. */
export const hp = (percentage: number): number => {
  const value = (appHeight() * percentage) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/**
 * Font size — returned verbatim (no width scaling) so the artist app's type
 * scale matches the user app's fixed sizes pixel-for-pixel on every device.
 */
export const rf = (size: number): number => Math.round(PixelRatio.roundToNearestPixel(size));

/** True on wider viewports (tablets, large foldables). */
export const isTablet = (): boolean => Dimensions.get('window').width >= 768;
