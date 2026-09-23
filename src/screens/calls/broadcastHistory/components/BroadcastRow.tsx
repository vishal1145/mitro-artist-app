import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { CardDetail, HelpIcon, HistoryCard, MetricGrid, MetricTile } from '@components/history';
import { LucideIcon, Text } from '@components/ui';
import type { BroadcastAnalytics, BroadcastHistoryItem } from '@app-types/api';
import { fontFamily, gradientDirection, palette, webColors, webGradients } from '@theme';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

import { analyticsTiles, broadcastMetaLine } from '../format';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';

interface BroadcastRowProps {
  item: BroadcastHistoryItem;
  isOpen: boolean;
  analytics: BroadcastAnalytics | undefined;
  loadingAnalytics: boolean;
  onToggle: (broadcastId: string) => void;
}

export const BroadcastRow = ({ item, isOpen, analytics, loadingAnalytics, onToggle }: BroadcastRowProps) => {
  const hasEarnings = item.totalRevenueTokens > 0;
  return (
    <HistoryCard>
      <View style={styles.showRow}>
        <View style={styles.showIcon}>
          <LucideIcon name="radio" size={rf(18)} color={webColors.green} />
        </View>

        <Pressable
          style={styles.showMain}
          onPress={() => onToggle(item.broadcastId)}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${isOpen ? 'hide' : 'show'} analytics`}
        >
          <Text numberOfLines={1} style={styles.showTitle}>
            {item.title}
          </Text>
          <Text style={styles.showMeta}>{broadcastMetaLine(item)}</Text>
        </Pressable>

        <View style={styles.showRight}>
          <View style={styles.showEarnRow}>
            <Text style={hasEarnings ? styles.showEarn : styles.showEarnZero}>
              {hasEarnings ? `+${grouped(item.totalRevenueTokens)}` : '0'}
            </Text>
            <HelpIcon
              hint="Total coins this specific broadcast earned — chat highlights, reactions, reward orders, and fun-wheel spins combined."
              size={11}
            />
          </View>
          <Pressable
            onPress={() => onToggle(item.broadcastId)}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            style={isOpen ? styles.analyticsBtnOn : styles.analyticsBtn}
          >
            {isOpen ? (
              <LinearGradient
                colors={webGradients.activePill}
                start={gradientDirection.diagonal.start}
                end={gradientDirection.diagonal.end}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <LucideIcon
              name="bar-chart-3"
              size={rf(12)}
              color={isOpen ? palette.white : webColors.muted}
            />
            <Text style={isOpen ? styles.analyticsTextOn : styles.analyticsText}>
              {isOpen ? 'Hide' : 'Analytics'}
            </Text>
          </Pressable>
        </View>
      </View>

      {isOpen ? (
        <CardDetail>
          {loadingAnalytics || !analytics || analytics.broadcastId !== item.broadcastId ? (
            <AnalyticsSkeleton />
          ) : (
            <MetricGrid>
              {analyticsTiles(analytics).map((tile) => (
                <MetricTile
                  key={tile.key}
                  icon={tile.icon}
                  iconColor={tile.color}
                  label={tile.label}
                  value={tile.value}
                  barPct={tile.barPct}
                  caption={tile.caption}
                  hint={tile.hint}
                />
              ))}
            </MetricGrid>
          )}
        </CardDetail>
      ) : null}
    </HistoryCard>
  );
};

/* show list ------------------------------------------------------------- */
const styles = StyleSheet.create({
  showRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  showIcon: {
    alignItems: 'center',
    backgroundColor: webColors.greenPill,
    borderColor: webColors.greenChipBorder,
    borderRadius: 11,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  showMain: {
    flex: 1,
    minWidth: 0,
  },
  showTitle: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
    marginBottom: 2,
  },
  showMeta: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
  showRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  /** `.show-earn { display: inline-flex; align-items: center; gap: 3px }`. */
  showEarnRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  showEarn: {
    color: webColors.green,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  showEarnZero: {
    color: webColors.dim,
    fontFamily: fontFamily.medium,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  analyticsBtn: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  analyticsBtnOn: {
    alignItems: 'center',
    borderColor: palette.transparent,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  analyticsText: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
  analyticsTextOn: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
});
