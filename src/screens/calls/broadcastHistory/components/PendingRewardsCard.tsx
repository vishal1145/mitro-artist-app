import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { CalloutStrong, CalloutText, WebCallout } from '@components/history';
import { LucideIcon, Text } from '@components/ui';
import type { RewardOrder } from '@app-types/api';
import { fontFamily, gradientDirection, webColors, webGradients } from '@theme';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

interface PendingRewardsCardProps {
  pendingOrders: RewardOrder[];
  fulfillingId: string | null;
  onFulfill: (order: RewardOrder) => void;
}

export const PendingRewardsCard = ({ pendingOrders, fulfillingId, onFulfill }: PendingRewardsCardProps) => (
  <>
    <WebCallout tone="gold">
      <CalloutText>
        <CalloutStrong>Fulfill rewards promptly</CalloutStrong> — fans notice when a shoutout
        or song request never arrives, and that erodes trust fast. Quick delivery keeps fans
        confident enough to tip and book again on your next broadcast.
      </CalloutText>
    </WebCallout>

    <LinearGradient
      colors={webGradients.rewardsCard}
      start={gradientDirection.diagonal.start}
      end={gradientDirection.diagonal.end}
      style={styles.rewardsCard}
    >
      <View style={styles.rewardsEyebrow}>
        <LucideIcon name="check" size={rf(12)} color={webColors.gold} />
        <Text style={styles.rewardsEyebrowText}>To fulfill</Text>
      </View>
      <Text style={styles.rewardsHeading}>Pending Reward Deliveries</Text>

      <View style={styles.pendingList}>
        {pendingOrders.map((order) => (
          <View key={order.id} style={styles.pendingRow}>
            <Text style={styles.pendingWho}>
              <Text style={styles.pendingName}>{order.rewardName}</Text> for{' '}
              {order.buyerDisplayName} ·{' '}
              <Text style={styles.pendingAmt}>{grouped(order.priceCharged)} coins</Text>
            </Text>
            <Pressable
              style={styles.btnGhost}
              onPress={() => onFulfill(order)}
              disabled={fulfillingId === order.id}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${order.rewardName} fulfilled`}
            >
              <LucideIcon name="check" size={rf(12)} color={webColors.green} />
              <Text style={styles.btnGhostText}>
                {fulfillingId === order.id ? 'Marking…' : 'Mark fulfilled'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </LinearGradient>
  </>
);

/* rewards-card ---------------------------------------------------------- */
const styles = StyleSheet.create({
  rewardsCard: {
    borderColor: webColors.panelBorder,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rewardsEyebrow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: webColors.goldChip,
    borderColor: webColors.goldCalloutBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rewardsEyebrowText: {
    color: webColors.gold,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10.5),
    letterSpacing: 0.53,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  rewardsHeading: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(16),
    lineHeight: rf(21),
    marginBottom: 12,
  },
  pendingList: {
    gap: 8,
  },
  pendingRow: {
    alignItems: 'center',
    backgroundColor: webColors.innerCard,
    borderColor: webColors.hairline06,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  pendingWho: {
    color: webColors.muted,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.6),
    lineHeight: rf(18),
  },
  pendingName: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
  },
  pendingAmt: {
    color: webColors.gold,
    fontFamily: fontFamily.semibold,
  },
  btnGhost: {
    alignItems: 'center',
    borderColor: webColors.greenGhostBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  btnGhostText: {
    color: webColors.green,
    fontFamily: fontFamily.bold,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
});
