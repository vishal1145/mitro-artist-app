import { memo } from 'react';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';

/**
 * Lucide icons, reproduced verbatim from the Artist Web's `lucide-react`
 * (v0.468.0) so replicated screens use the SAME glyphs as the web instead of
 * a lookalike from another icon font.
 *
 * Paths are copied 1:1 from node_modules/lucide-react/dist/esm/icons/*.js.
 * Default lucide attrs: 24x24 viewBox, fill none, stroke currentColor,
 * stroke-width 2, round caps and joins.
 */
export type LucideIconName =
  | 'arrow-left'
  | 'check'
  | 'clock-3'
  | 'coins'
  | 'history'
  | 'phone'
  | 'phone-off'
  | 'shield-check'
  | 'user'
  | 'x';

export interface LucideIconProps {
  name: LucideIconName;
  /** Matches lucide's `size` prop — sets both width and height. */
  size?: number;
  color: string;
  strokeWidth?: number;
}

const PHONE_D =
  'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z';

const PHONE_OFF_D =
  'M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91';

const SHIELD_CHECK_D =
  'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z';

const LucideIconComponent = ({
  name,
  size = 24,
  color,
  strokeWidth = 2,
}: LucideIconProps) => {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'arrow-left' ? (
        <>
          <Path d="m12 19-7-7 7-7" {...common} />
          <Path d="M19 12H5" {...common} />
        </>
      ) : null}

      {name === 'check' ? <Path d="M20 6 9 17l-5-5" {...common} /> : null}

      {name === 'clock-3' ? (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Polyline points="12 6 12 12 16.5 12" {...common} />
        </>
      ) : null}

      {name === 'coins' ? (
        <>
          <Circle cx="8" cy="8" r="6" {...common} />
          <Path d="M18.09 10.37A6 6 0 1 1 10.34 18" {...common} />
          <Path d="M7 6h1v4" {...common} />
          <Path d="m16.71 13.88.7.71-2.82 2.82" {...common} />
        </>
      ) : null}

      {name === 'history' ? (
        <>
          <Path
            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
            {...common}
          />
          <Path d="M3 3v5h5" {...common} />
          <Path d="M12 7v5l4 2" {...common} />
        </>
      ) : null}

      {name === 'phone' ? <Path d={PHONE_D} {...common} /> : null}

      {name === 'phone-off' ? (
        <>
          <Path d={PHONE_OFF_D} {...common} />
          <Path d="M22 2 2 22" {...common} />
        </>
      ) : null}

      {name === 'shield-check' ? (
        <>
          <Path d={SHIELD_CHECK_D} {...common} />
          <Path d="m9 12 2 2 4-4" {...common} />
        </>
      ) : null}

      {name === 'user' ? (
        <>
          <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" {...common} />
          <Circle cx="12" cy="7" r="4" {...common} />
        </>
      ) : null}

      {name === 'x' ? (
        <>
          <Path d="M18 6 6 18" {...common} />
          <Path d="m6 6 12 12" {...common} />
        </>
      ) : null}
    </Svg>
  );
};

export const LucideIcon = memo(LucideIconComponent);
