import { memo } from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

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
  | 'alert-triangle'
  | 'arrow-left'
  | 'badge-check'
  | 'bar-chart-3'
  | 'bell'
  | 'building'
  | 'calendar-days'
  | 'camera'
  | 'check'
  | 'chevron-down'
  | 'chevron-right'
  | 'circle-dollar-sign'
  | 'circle-help'
  | 'circle-check'
  | 'circle-check-big'
  | 'clock-3'
  | 'cloud-upload'
  | 'compass'
  | 'credit-card'
  | 'disc'
  | 'eye'
  | 'eye-off'
  | 'file-text'
  | 'globe'
  | 'hash'
  | 'image'
  | 'landmark'
  | 'lock'
  | 'map-pin'
  | 'mic'
  | 'gift'
  | 'coins'
  | 'heart'
  | 'history'
  | 'info'
  | 'layout-dashboard'
  | 'message-circle'
  | 'pencil'
  | 'phone'
  | 'phone-off'
  | 'pie-chart'
  | 'plus'
  | 'radio'
  | 'shield-check'
  | 'sparkles'
  | 'star'
  | 'triangle-alert'
  | 'user-round'
  | 'video'
  | 'user'
  | 'users'
  | 'wallet'
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

const ALERT_TRIANGLE_D =
  'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3';

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

      {name === 'alert-triangle' ? (
        <>
          <Path d={ALERT_TRIANGLE_D} {...common} />
          <Path d="M12 9v4" {...common} />
          <Path d="M12 17h.01" {...common} />
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

      {name === 'users' ? (
        <>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...common} />
          <Circle cx="9" cy="7" r="4" {...common} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" {...common} />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" {...common} />
        </>
      ) : null}

      {name === 'x' ? (
        <>
          <Path d="M18 6 6 18" {...common} />
          <Path d="m6 6 12 12" {...common} />
        </>
      ) : null}

      {name === 'layout-dashboard' ? (
        <>
          <Rect x="3" y="3" width="7" height="9" rx="1" {...common} />
          <Rect x="14" y="3" width="7" height="5" rx="1" {...common} />
          <Rect x="14" y="12" width="7" height="9" rx="1" {...common} />
          <Rect x="3" y="16" width="7" height="5" rx="1" {...common} />
        </>
      ) : null}

      {name === 'chevron-down' ? <Path d="m6 9 6 6 6-6" {...common} /> : null}

      {name === 'circle-dollar-sign' ? (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" {...common} />
          <Path d="M12 18V6" {...common} />
        </>
      ) : null}

      {name === 'pie-chart' ? (
        <>
          <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" {...common} />
          <Path d="M22 12A10 10 0 0 0 12 2v10z" {...common} />
        </>
      ) : null}

      {name === 'sparkles' ? (
        <>
          <Path
            d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
            {...common}
          />
          <Path d="M20 3v4" {...common} />
          <Path d="M22 5h-4" {...common} />
          <Path d="M4 17v2" {...common} />
          <Path d="M5 18H3" {...common} />
        </>
      ) : null}

      {name === 'circle-help' ? (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" {...common} />
          <Path d="M12 17h.01" {...common} />
        </>
      ) : null}

      {name === 'star' ? (
        <Path
          d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
          {...common}
        />
      ) : null}

      {name === 'user-round' ? (
        <>
          <Circle cx="12" cy="8" r="5" {...common} />
          <Path d="M20 21a8 8 0 0 0-16 0" {...common} />
        </>
      ) : null}

      {name === 'video' ? (
        <>
          <Path
            d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"
            {...common}
          />
          <Rect x="2" y="6" width="14" height="12" rx="2" {...common} />
        </>
      ) : null}

      {/* lucide Gift — rect + 3 paths, v0.468.0 verbatim. */}
      {name === 'gift' ? (
        <>
          <Rect x="3" y="8" width="18" height="4" rx="1" {...common} />
          <Path d="M12 8v13" {...common} />
          <Path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" {...common} />
          <Path
            d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"
            {...common}
          />
        </>
      ) : null}

      {/* lucide Disc — two concentric circles. */}
      {name === 'disc' ? (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Circle cx="12" cy="12" r="2" {...common} />
        </>
      ) : null}

      {name === 'radio' ? (
        <>
          <Path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" {...common} />
          <Path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" {...common} />
          <Circle cx="12" cy="12" r="2" {...common} />
          <Path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" {...common} />
          <Path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" {...common} />
        </>
      ) : null}

      {name === 'heart' ? (
        <Path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          {...common}
        />
      ) : null}

      {name === 'calendar-days' ? (
        <>
          <Path d="M8 2v4" {...common} />
          <Path d="M16 2v4" {...common} />
          <Rect x="3" y="4" width="18" height="18" rx="2" {...common} />
          <Path d="M3 10h18" {...common} />
          <Path d="M8 14h.01" {...common} />
          <Path d="M12 14h.01" {...common} />
          <Path d="M16 14h.01" {...common} />
          <Path d="M8 18h.01" {...common} />
          <Path d="M12 18h.01" {...common} />
          <Path d="M16 18h.01" {...common} />
        </>
      ) : null}

      {name === 'info' ? (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Path d="M12 16v-4" {...common} />
          <Path d="M12 8h.01" {...common} />
        </>
      ) : null}

      {name === 'wallet' ? (
        <>
          <Path
            d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
            {...common}
          />
          <Path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" {...common} />
        </>
      ) : null}

      {name === 'bar-chart-3' ? (
        <>
          <Path d="M3 3v16a2 2 0 0 0 2 2h16" {...common} />
          <Path d="M18 17V9" {...common} />
          <Path d="M13 17V5" {...common} />
          <Path d="M8 17v-3" {...common} />
        </>
      ) : null}

      {name === 'bell' ? (
        <>
          <Path d="M10.268 21a2 2 0 0 0 3.464 0" {...common} />
          <Path
            d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
            {...common}
          />
        </>
      ) : null}

      {name === 'badge-check' ? (
        <>
          <Path
            d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
            {...common}
          />
          <Path d="m9 12 2 2 4-4" {...common} />
        </>
      ) : null}

      {name === 'triangle-alert' ? (
        <>
          <Path
            d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
            {...common}
          />
          <Path d="M12 9v4" {...common} />
          <Path d="M12 17h.01" {...common} />
        </>
      ) : null}

      {name === 'circle-check-big' ? (
        <>
          <Path d="M21.801 10A10 10 0 1 1 17 3.335" {...common} />
          <Path d="m9 11 3 3L22 4" {...common} />
        </>
      ) : null}

      {name === 'message-circle' ? (
        <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" {...common} />
      ) : null}

      {name === 'chevron-right' ? (
        <Path d="m9 18 6-6-6-6" {...common} />
      ) : null}

      {name === 'circle-check' ? (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Path d="m9 12 2 2 4-4" {...common} />
        </>
      ) : null}

      {name === 'file-text' ? (
        <>
          <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" {...common} />
          <Path d="M14 2v4a2 2 0 0 0 2 2h4" {...common} />
          <Path d="M10 9H8" {...common} />
          <Path d="M16 13H8" {...common} />
          <Path d="M16 17H8" {...common} />
        </>
      ) : null}

      {name === 'credit-card' ? (
        <>
          <Rect x="2" y="5" width="20" height="14" rx="2" {...common} />
          <Line x1="2" x2="22" y1="10" y2="10" {...common} />
        </>
      ) : null}

      {name === 'landmark' ? (
        <>
          <Line x1="3" x2="21" y1="22" y2="22" {...common} />
          <Line x1="6" x2="6" y1="18" y2="11" {...common} />
          <Line x1="10" x2="10" y1="18" y2="11" {...common} />
          <Line x1="14" x2="14" y1="18" y2="11" {...common} />
          <Line x1="18" x2="18" y1="18" y2="11" {...common} />
          <Polygon points="12 2 20 7 4 7" {...common} />
        </>
      ) : null}

      {name === 'building' ? (
        <>
          <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" {...common} />
          <Path d="M9 22v-4h6v4" {...common} />
          <Path d="M8 6h.01" {...common} />
          <Path d="M16 6h.01" {...common} />
          <Path d="M12 6h.01" {...common} />
          <Path d="M12 10h.01" {...common} />
          <Path d="M12 14h.01" {...common} />
          <Path d="M16 10h.01" {...common} />
          <Path d="M16 14h.01" {...common} />
          <Path d="M8 10h.01" {...common} />
          <Path d="M8 14h.01" {...common} />
        </>
      ) : null}

      {name === 'map-pin' ? (
        <>
          <Path
            d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
            {...common}
          />
          <Circle cx="12" cy="10" r="3" {...common} />
        </>
      ) : null}

      {name === 'hash' ? (
        <>
          <Line x1="4" x2="20" y1="9" y2="9" {...common} />
          <Line x1="4" x2="20" y1="15" y2="15" {...common} />
          <Line x1="10" x2="8" y1="3" y2="21" {...common} />
          <Line x1="16" x2="14" y1="3" y2="21" {...common} />
        </>
      ) : null}

      {name === 'cloud-upload' ? (
        <>
          <Path d="M12 13v8" {...common} />
          <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" {...common} />
          <Path d="m8 17 4-4 4 4" {...common} />
        </>
      ) : null}

      {name === 'compass' ? (
        <>
          <Path
            d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"
            {...common}
          />
          <Circle cx="12" cy="12" r="10" {...common} />
        </>
      ) : null}

      {name === 'pencil' ? (
        <>
          <Path
            d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
            {...common}
          />
          <Path d="m15 5 4 4" {...common} />
        </>
      ) : null}

      {name === 'lock' ? (
        <>
          <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" {...common} />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...common} />
        </>
      ) : null}

      {name === 'camera' ? (
        <>
          <Path
            d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
            {...common}
          />
          <Circle cx="12" cy="13" r="3" {...common} />
        </>
      ) : null}

      {name === 'eye' ? (
        <>
          <Path
            d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
            {...common}
          />
          <Circle cx="12" cy="12" r="3" {...common} />
        </>
      ) : null}

      {name === 'eye-off' ? (
        <>
          <Path
            d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
            {...common}
          />
          <Path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" {...common} />
          <Path
            d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
            {...common}
          />
          <Path d="m2 2 20 20" {...common} />
        </>
      ) : null}

      {name === 'image' ? (
        <>
          <Rect width="18" height="18" x="3" y="3" rx="2" ry="2" {...common} />
          <Circle cx="9" cy="9" r="2" {...common} />
          <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" {...common} />
        </>
      ) : null}

      {name === 'plus' ? (
        <>
          <Path d="M5 12h14" {...common} />
          <Path d="M12 5v14" {...common} />
        </>
      ) : null}

      {name === 'globe' ? (
        <>
          <Circle cx="12" cy="12" r="10" {...common} />
          <Path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" {...common} />
          <Path d="M2 12h20" {...common} />
        </>
      ) : null}

      {name === 'mic' ? (
        <>
          <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" {...common} />
          <Path d="M19 10v2a7 7 0 0 1-14 0v-2" {...common} />
          <Line x1="12" x2="12" y1="19" y2="22" {...common} />
        </>
      ) : null}
    </Svg>
  );
};

export const LucideIcon = memo(LucideIconComponent);
