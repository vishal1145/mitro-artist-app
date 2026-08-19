import { memo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily } from '@theme';
import { rf } from '@utils/responsive';

export interface SectionLabelProps {
  children: string;
  /** Hairline rule above the label, separating it from the block before. */
  divider?: boolean;
  /** Show a circular "?" affordance beside the label. */
  onHelp?: () => void;
  helpLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Uppercase muted section heading, optionally preceded by a rule. */
const SectionLabelComponent = ({
  children,
  divider = false,
  onHelp,
  helpLabel = 'More information',
  style,
}: SectionLabelProps) => (
  <View style={[styles.wrap, divider ? styles.divider : null, style]}>
    <Text variant="label" color="textMuted">
      {children}
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

export const SectionLabel = memo(SectionLabelComponent);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
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
