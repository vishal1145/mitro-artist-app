import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { fontFamily, webColors } from '@theme';
import { rf } from '@utils/responsive';

import { pieSegments, type PieSource } from '../format';

/* -------------------------------------------------------------------------- */
/* SourcePieChart — react-native-svg donut, matching the web SVG 1:1.          */
/* -------------------------------------------------------------------------- */

interface SourcePieChartProps {
  sources: PieSource[];
  totalTokens: number;
}

export const SourcePieChart = ({ sources, totalTokens }: SourcePieChartProps) => {
  const size = 216;
  const r = 82;
  const strokeWidth = 28;
  const cx = size / 2;
  const cy = size / 2;

  const segments = pieSegments(sources, totalTokens, r);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#0d0c1f" strokeWidth={strokeWidth} />
      {segments.map((segment) => (
        <Circle
          key={segment.sourceType}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={segment.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${segment.len} ${segment.gapRemainder}`}
          strokeDashoffset={segment.dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <SvgText
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill={webColors.textStrong}
        fontFamily={fontFamily.extrabold}
        fontSize={rf(22)}
      >
        {totalTokens.toLocaleString()}
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fill={webColors.dim}
        fontFamily={fontFamily.bold}
        fontSize={rf(10)}
      >
        COINS
      </SvgText>
    </Svg>
  );
};
