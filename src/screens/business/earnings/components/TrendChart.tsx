import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { fontFamily, webColors } from '@theme';
import { grouped, shortWeekday } from '@utils/format';
import { rf } from '@utils/responsive';

/* -------------------------------------------------------------------------- */
/* EarningsTrendChart — the web canvas, redrawn as gradient bars.              */
/* -------------------------------------------------------------------------- */

interface TrendChartProps {
  points: { date: string; tokens: number }[];
}

export const TrendChart = ({ points }: TrendChartProps) => {
  const data =
    points.length > 0 ? points : [{ date: new Date().toISOString(), tokens: 0 }];
  const peak = Math.max(0, ...data.map((d) => d.tokens));

  return (
    <View style={styles.chart}>
      {data.map((point, i) => (
        <View key={`${point.date}-${i}`} style={styles.barCol}>
          <Text style={styles.barValue}>{grouped(point.tokens)}</Text>
          <View style={styles.barTrack}>
            <LinearGradient
              colors={['#ff3fad', '#33e6ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.bar,
                { height: peak > 0 ? `${Math.max(4, (point.tokens / peak) * 100)}%` : 4 },
              ]}
            />
          </View>
          <Text style={styles.barDay}>{shortWeekday(point.date)}</Text>
        </View>
      ))}
    </View>
  );
};

/* trend bars ------------------------------------------------------------ */
const styles = StyleSheet.create({
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    height: 200,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  barValue: {
    color: webColors.dim,
    fontFamily: fontFamily.bold,
    fontSize: rf(9),
    lineHeight: rf(12),
  },
  barTrack: {
    alignSelf: 'stretch',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    width: '100%',
  },
  barDay: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11),
    lineHeight: rf(14),
  },
});
