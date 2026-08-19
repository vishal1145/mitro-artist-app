import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LogoBadge } from '@components/ui/LogoBadge';
import { Text } from '@components/ui/Text';
import { colors, fontFamily, radius } from '@theme';
import { rf } from '@utils/responsive';

export interface EarningsBarProps {
  /** Formatted total, e.g. "1.2k tk". Ignored when `brand` is set. */
  amount?: string;
  /** Caption under the amount. */
  caption?: string;
  /**
   * Show the Mitro mark instead of the earnings pill — for screens where the
   * running total isn't the point.
   */
  brand?: boolean;
  onPressAmount?: () => void;
  onPressBell?: () => void;
  /** Red dot on the bell. */
  unread?: boolean;
}

/** Top strip shared by the tab roots: brand or earnings on the left, bell right. */
const EarningsBarComponent = ({
  amount = '',
  caption = 'EARNED',
  brand = false,
  onPressAmount,
  onPressBell,
  unread = false,
}: EarningsBarProps) => (
  <View style={styles.row}>
    {brand ? (
      <View style={styles.brand}>
        <LogoBadge variant="wave" size={38} />
        <Text style={styles.brandName}>Mitro</Text>
      </View>
    ) : (
      <Pressable
        style={styles.pill}
        onPress={onPressAmount}
        disabled={!onPressAmount}
        accessibilityRole="button"
        accessibilityLabel={`${amount} ${caption.toLowerCase()}`}
      >
        <View style={styles.icon}>
          <Ionicons name="flash" size={rf(14)} color={colors.gold} />
        </View>
        <View>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.caption} color="textMuted">
            {caption}
          </Text>
        </View>
      </Pressable>
    )}

    {onPressBell ? (
      <Pressable
        style={styles.bell}
        onPress={onPressBell}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={rf(18)} color={colors.textSecondary} />
        {unread ? <View style={styles.bellDot} /> : null}
      </Pressable>
    ) : null}
  </View>
);

export const EarningsBar = memo(EarningsBarComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandName: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(19),
    color: colors.textPrimary,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.pill,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 6,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(15),
    color: colors.gold,
  },
  caption: {
    fontFamily: fontFamily.bold,
    fontSize: rf(9),
    letterSpacing: 0.8,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
});
