import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily } from '@theme';
import { rf } from '@utils/responsive';

export interface InsightLineProps {
  /** Emphasised opening clause, rendered bold in primary text. */
  lead: string;
  /** Muted remainder. Rendered on the same paragraph as `lead`. */
  tail?: ReactNode;
  /** Show a circular "?" affordance at the end of the line. */
  onHelp?: () => void;
  helpLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The one-line coaching note that sits under each screen's heading —
 * a bold takeaway followed by muted supporting copy.
 */
const InsightLineComponent = ({
  lead,
  tail,
  onHelp,
  helpLabel = 'Why this matters',
  style,
}: InsightLineProps) => (
  <View style={[styles.wrap, style]}>
    <Text variant="bodySm" color="textSecondary" style={styles.text}>
      <Text style={styles.lead}>{lead}</Text>
      {tail ? <>{tail}</> : null}
    </Text>

    {onHelp ? (
      <Pressable
        onPress={onHelp}
        hitSlop={8}
        style={styles.help}
        accessibilityRole="button"
        accessibilityLabel={helpLabel}
      >
        <Text style={styles.helpMark} color="textMuted">
          ?
        </Text>
      </Pressable>
    ) : null}
  </View>
);

export const InsightLine = memo(InsightLineComponent);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
  },
  lead: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  help: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.cardRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpMark: {
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
  },
});
