import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, type ColorToken } from '@theme';

export interface TimelineRowProps {
  title: string;
  /** Secondary line — date, duration, viewers, etc. */
  meta: string;
  /** Trailing amount, right-aligned so a stack of rows forms a clean column. */
  value?: string;
  valueColor?: ColorToken;
  /** Colour of the status dot in the gutter. */
  dotColor: string;
  /** Last row in the stack — suppresses the rail below the dot. */
  last?: boolean;
  onPress?: () => void;
}

/**
 * A history entry on a vertical timeline: status dot in a fixed gutter, linked
 * to the next dot by a hairline rail, with the title/meta and trailing amount.
 */
const TimelineRowComponent = ({
  title,
  meta,
  value,
  valueColor = 'green',
  dotColor,
  last = false,
  onPress,
}: TimelineRowProps) => {
  const body = (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      {last ? null : <View style={styles.rail} />}

      <View style={styles.gutter}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      </View>

      <View style={styles.text}>
        <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="bodySm" color="textMuted" numberOfLines={1}>
          {meta}
        </Text>
      </View>

      {value ? (
        <Text variant="bodySm" color={valueColor} style={styles.value}>
          {value}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) {
    return body;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={meta}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {body}
    </Pressable>
  );
};

export const TimelineRow = memo(TimelineRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    // The row owns the gap so the rail can run through it to the next dot.
    paddingBottom: 16,
  },
  rowLast: {
    paddingBottom: 0,
  },
  // Centred under the 8pt dot; stops exactly where the next dot begins.
  rail: {
    position: 'absolute',
    left: 3.5,
    top: 16,
    bottom: -6,
    width: 1.5,
    backgroundColor: colors.cardRaised,
  },
  gutter: {
    width: 8,
    alignItems: 'center',
    paddingTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  value: {
    fontFamily: fontFamily.bold,
    paddingTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
