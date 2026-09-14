import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LogoBadge } from '@components/ui/LogoBadge';
import { Text } from '@components/ui/Text';
import { useConversations } from '@hooks/usePrivateMessages';
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

/** Top strip shared by the tab roots: brand or earnings on the left, messages
 * + bell on the right. */
const EarningsBarComponent = ({
  amount = '',
  caption = 'EARNED',
  brand = false,
  onPressAmount,
  onPressBell,
  unread = false,
}: EarningsBarProps) => {
  const router = useRouter();
  const { data: convos } = useConversations();
  const messagesUnread = (convos ?? []).reduce((n, c) => n + (c.unreadCount ?? 0), 0);

  return (
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
            <Feather name="zap" size={rf(14)} color={colors.gold} />
          </View>
          <View>
            <Text style={styles.amount}>{amount}</Text>
            <Text style={styles.caption} color="textMuted">
              {caption}
            </Text>
          </View>
        </Pressable>
      )}

      <View style={styles.right}>
        {/* Notifications leads and messages sits in the outer corner — the
            order fans/artists expect, and what was asked for explicitly. */}
        {onPressBell ? (
          <Pressable
            style={styles.iconBtn}
            onPress={onPressBell}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Feather name="bell" size={rf(18)} color={colors.textSecondary} />
            {unread ? <View style={styles.dot} /> : null}
          </Pressable>
        ) : null}

        <Pressable
          style={styles.iconBtn}
          onPress={() => router.push('/(app)/(tabs)/me/messages')}
          accessibilityRole="button"
          accessibilityLabel="Messages"
        >
          <Feather name="message-circle" size={rf(18)} color={colors.textSecondary} />
          {messagesUnread > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>
    </View>
  );
};

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
    fontSize: rf(17),
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
    fontSize: rf(13),
    color: colors.gold,
  },
  caption: {
    fontFamily: fontFamily.bold,
    fontSize: rf(9),
    letterSpacing: 0.8,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
});
