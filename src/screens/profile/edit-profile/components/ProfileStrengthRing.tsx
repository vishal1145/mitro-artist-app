import { Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

import { C } from '../colors';
import { styles } from '../styles';

const RING_R = 36;
const RING_CIRC = 2 * Math.PI * RING_R;

export const ProfileStrengthRing = ({ pct }: { pct: number }) => {
  const offset = RING_CIRC * (1 - pct / 100);
  return (
    <View style={styles.ringWrap}>
      <Svg width={88} height={88}>
        <Defs>
          <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={C.pink} />
            <Stop offset="1" stopColor={C.violet} />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={44}
          cy={44}
          r={RING_R}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={8}
          fill="none"
        />
        <G rotation={-90} originX={44} originY={44}>
          <Circle
            cx={44}
            cy={44}
            r={RING_R}
            stroke="url(#ringGrad)"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${RING_CIRC} ${RING_CIRC}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={styles.ringNum} pointerEvents="none">
        <Text style={styles.ringNumBig}>{pct}%</Text>
        <Text style={styles.ringNumSmall}>complete</Text>
      </View>
    </View>
  );
};
