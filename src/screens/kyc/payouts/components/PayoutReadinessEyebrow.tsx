import Svg, {
  Defs,
  G,
  Path,
  Stop,
  Text as SvgText,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';

import { fontFamily, webGradients } from '@theme';
import { rf } from '@utils/responsive';

import { styles } from '../styles';

const SHIELD_CHECK_D =
  'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z';
const SHIELD_CHECK_TICK = 'm9 12 2 2 4-4';

/**
 * `.eyebrow` paints its text with `--premium-gradient` via
 * `background-clip: text`, which React Native cannot do on a `<Text>`; this
 * draws the same three stops (#FF3FAD 0%, #8C4DFF 52%, #34E7FF 100%, 135deg)
 * as an SVG fill instead. Inherited size is the 16px body default, weight 800,
 * icon 12px, gap 8px, margin-bottom 12px.
 */
export const PayoutReadinessEyebrow = () => {
  const box = rf(20);
  const icon = rf(12);
  const scale = icon / 24;
  const dy = (box - icon) / 2;
  return (
    <Svg height={box} width={rf(200)} style={styles.eyebrow}>
      <Defs>
        <SvgLinearGradient id="premiumInk" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={webGradients.premium[0]} />
          <Stop offset="0.52" stopColor={webGradients.premium[1]} />
          <Stop offset="1" stopColor={webGradients.premium[2]} />
        </SvgLinearGradient>
      </Defs>
      <G transform={`translate(0 ${dy}) scale(${scale})`}>
        <Path
          d={SHIELD_CHECK_D}
          stroke="url(#premiumInk)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={SHIELD_CHECK_TICK}
          stroke="url(#premiumInk)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
      <SvgText
        x={icon + rf(8)}
        y={box - rf(5)}
        fill="url(#premiumInk)"
        fontFamily={fontFamily.extrabold}
        fontSize={rf(16)}
      >
        Payout readiness
      </SvgText>
    </Svg>
  );
};
