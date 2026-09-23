import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { webColors } from '@theme';

import { styles } from '../styles';

/** `.wheel-visual` — a 6-stop conic gradient on the web; drawn as six 60°
 *  wedges here because React Native has no conic gradient. Same colours,
 *  same order, same angles. */
export const WheelVisual = () => (
  <View style={styles.wheelVisual}>
    <Svg width={40} height={40} viewBox="0 0 100 100">
      {webColors.wheelSlices.map((fill, i) => {
        const a0 = (i * 60 - 90) * (Math.PI / 180);
        const a1 = ((i + 1) * 60 - 90) * (Math.PI / 180);
        const x0 = 50 + 50 * Math.cos(a0);
        const y0 = 50 + 50 * Math.sin(a0);
        const x1 = 50 + 50 * Math.cos(a1);
        const y1 = 50 + 50 * Math.sin(a1);
        return (
          <Path key={fill} d={`M50 50 L${x0} ${y0} A50 50 0 0 1 ${x1} ${y1} Z`} fill={fill} />
        );
      })}
    </Svg>
  </View>
);
