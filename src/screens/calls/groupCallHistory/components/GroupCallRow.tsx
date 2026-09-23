import { Pressable, StyleSheet, View } from 'react-native';

import { CardDetail, HelpIcon, HistoryCard } from '@components/history';
import { LucideIcon, Text } from '@components/ui';
import type { GroupCallAnalytics, GroupCallHistoryItem } from '@app-types/api';
import { fontFamily, webColors } from '@theme';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

import { earningsHint, groupCallMetaLine, statusChip, statusChipInk } from '../format';
import { AnalyticsDetail } from './AnalyticsDetail';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';

interface GroupCallRowProps {
  item: GroupCallHistoryItem;
  isOpen: boolean;
  analytics: GroupCallAnalytics | undefined;
  loadingAnalytics: boolean;
  onToggle: (groupCallId: string) => void;
}

export const GroupCallRow = ({ item, isOpen, analytics, loadingAnalytics, onToggle }: GroupCallRowProps) => {
  const hasEarnings = item.totalRevenueTokens > 0;
  return (
    <HistoryCard>
      <Pressable
        style={styles.callRow}
        onPress={() => onToggle(item.groupCallId)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${item.title}, ${isOpen ? 'collapse' : 'expand'} details`}
      >
        <View style={styles.callIcon}>
          <LucideIcon name="video" size={rf(18)} color={webColors.purple} />
        </View>

        <View style={styles.callMain}>
          <View style={styles.callTitleRow}>
            <Text numberOfLines={1} style={styles.callTitle}>
              {item.title}
            </Text>
            <View style={statusChip(item.status)}>
              <Text style={statusChipInk(item.status)}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.callMeta}>{groupCallMetaLine(item)}</Text>
        </View>

        <View style={styles.callRight}>
          <Text style={hasEarnings ? styles.callEarn : styles.callEarnZero}>
            {hasEarnings ? `+${grouped(item.totalRevenueTokens)} coins` : '0 coins'}
          </Text>
          <HelpIcon hint={earningsHint(item)} />
          <View style={isOpen ? styles.chevOpen : undefined}>
            <LucideIcon
              name="chevron-down"
              size={rf(16)}
              color={isOpen ? webColors.textStrong : webColors.dim}
            />
          </View>
        </View>
      </Pressable>

      {isOpen ? (
        <CardDetail>
          {loadingAnalytics || !analytics || analytics.groupCallId !== item.groupCallId ? (
            <AnalyticsSkeleton />
          ) : (
            <AnalyticsDetail analytics={analytics} item={item} />
          )}
        </CardDetail>
      ) : null}
    </HistoryCard>
  );
};

/* call list ------------------------------------------------------------- */
const styles = StyleSheet.create({
  callRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  callIcon: {
    alignItems: 'center',
    backgroundColor: webColors.purpleChip,
    borderColor: webColors.purpleChipBorder,
    borderRadius: 11,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  callMain: {
    flex: 1,
    minWidth: 0,
  },
  callTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
    minWidth: 0,
  },
  callTitle: {
    color: webColors.textStrong,
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  callMeta: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
  callRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  callEarn: {
    color: webColors.gold,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  callEarnZero: {
    color: webColors.dim,
    fontFamily: fontFamily.medium,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  chevOpen: {
    transform: [{ rotate: '180deg' }],
  },
});
