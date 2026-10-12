import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EarningsBar, Screen, Skeleton, VerificationBanner } from '@components/shared';
import { Button, Card, GradientButton, LucideIcon, Text } from '@components/ui';
import type { LucideIconName } from '@components/ui';
import { useBroadcastHistory, useEarningsSummary } from '@hooks/useInsights';
import { useFollowers } from '@hooks/useFollowers';
import { useVerificationGate } from '@hooks/useVerificationGate';
import { useNotificationStore } from '@store';
import { colors, fontFamily, fontSize, gradientDirection, gradients, layout, lineHeight, radius, spacing, typography, webColors } from '@theme';
import { compactCount, duration, formatTokens, grouped, relativeShort, shortDate } from '@utils/format';
import { notificationVisual } from '@utils/notifications';
import { rf } from '@utils/responsive';

/** How many past broadcasts / notifications the dashboard panels show. */
/** Same studio photo the web dashboard hero uses (main.tsx neonStudioImage). */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80';

const RECENT_COUNT = 5;
const NOTES_COUNT = 5;

/** A broadcast that ended cleanly is neutral; anything else is flagged gold. */
const CLEAN_END = 'Ended by artist';

/* -------------------------------------------------------------------------- */
/*  Screen — mirrors the artist-web Creator Dashboard                          */
/* -------------------------------------------------------------------------- */

const HomeScreen = () => {
  const router = useRouter();
  const notes = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const { data: earnings, isLoading: loadingEarnings } = useEarningsSummary();
  const { data: broadcasts, isLoading: loadingBroadcasts } = useBroadcastHistory(RECENT_COUNT);
  const { data: followersData } = useFollowers();
  // Web gates go-live / schedule / private-calls behind KYC + approval, and
  // shows the strip above the topbar only on this screen.
  const { banner, guard, goToKyc } = useVerificationGate();

  const recentShows = broadcasts?.length ?? 0;
  const pending = earnings ? grouped(earnings.pendingTokens) : '—';

  // Summary strip — same four cells as the web dashboard, same order. The web
  // prints these as a bare grouped number (`toLocaleString()`), no unit: the
  // cell label already says what the figure is.
  const summary: { icon: LucideIconName; tint: string; fill: string; border: string; label: string; value: string }[] = [
    { icon: 'coins', tint: colors.gold, fill: colors.warningBg, border: colors.warningBorder, label: 'Total Coins', value: earnings ? grouped(earnings.totalTokens) : '—' },
    { icon: 'clock-3', tint: colors.purple, fill: colors.purpleSoft, border: webColors.purpleChipBorder, label: 'Pending', value: earnings ? grouped(earnings.pendingTokens) : '—' },
    { icon: 'wallet', tint: colors.green, fill: colors.successBg, border: colors.successBorder, label: 'Available', value: earnings ? grouped(earnings.availableTokens) : '—' },
    { icon: 'radio', tint: colors.cyan, fill: colors.infoSoft, border: colors.infoBorder, label: 'Recent Shows', value: String(recentShows) },
  ];

  const topNotes = (notes ?? []).slice(0, NOTES_COUNT);

  // Full-page skeleton on first load — mirrors the web dashboard's isLoading state
  // (skeleton hero, summary strip and two panels) instead of a bare screen.
  const showSkeleton = loadingEarnings && !earnings;
  const renderSkeleton = () => (
    <>
      <View style={[styles.hero, styles.heroSkeleton]}>
        <Skeleton width={150} height={16} round={6} />
        <Skeleton width="80%" height={26} round={radius.sm} />
        <View style={styles.heroPills}>
          <Skeleton width={120} height={26} round={999} />
          <Skeleton width={104} height={26} round={999} />
          <Skeleton width={96} height={26} round={999} />
        </View>
        <Skeleton height={44} round={radius.sm} />
        <Skeleton height={44} round={radius.sm} />
        <Skeleton height={44} round={radius.sm} />
      </View>

      <View style={styles.summaryStrip}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.summaryCell}>
            <Skeleton width={40} height={40} round={radius.sm} />
            <View style={styles.summaryBody}>
              <Skeleton width="60%" height={10} round={radius.xs} />
              <Skeleton width="45%" height={18} round={radius.xs} />
            </View>
          </View>
        ))}
      </View>

      {[0, 1].map((p) => (
        <Card key={p} style={styles.panel}>
          <View style={styles.panelHead}>
            <Skeleton width={150} height={16} round={radius.xs} />
            <Skeleton width={72} height={16} round={radius.xs} />
          </View>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.bcastRow}>
              <Skeleton width={40} height={40} round={radius.sm} />
              <View style={styles.bcastMain}>
                <Skeleton width="65%" height={12} round={radius.xs} />
                <Skeleton width="40%" height={10} round={radius.xs} />
              </View>
              <Skeleton width={46} height={14} round={radius.xs} />
            </View>
          ))}
        </Card>
      ))}
    </>
  );

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <View style={styles.headerStack}>
          {/* Brand bar first: on a phone the banner is tall enough that putting
              it above pushes the Mitro header off the top of the screen. */}
          <EarningsBar
            brand
            onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
            unread={unreadCount > 0}
          />
          {banner ? (
            <VerificationBanner banner={banner} onPressAction={goToKyc} />
          ) : null}
        </View>
      }
    >
      {showSkeleton ? renderSkeleton() : (
      <>
      {/* ── Creator hero (dark, web-matched) ── */}
      <View style={styles.hero}>
        <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        <LinearGradient
          pointerEvents="none"
          colors={gradients.heroPhotoScrim}
          start={gradientDirection.horizontal.start}
          end={gradientDirection.horizontal.end}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroEyebrow}>
          <LucideIcon name="layout-dashboard" size={rf(14)} color={colors.pink} />
          <Text style={styles.heroEyebrowText}>CREATOR DASHBOARD</Text>
        </View>
        <Text style={styles.heroTitle}>Manage streams, sessions, earnings, and your audience.</Text>

        {/* One-line hint inside the hero (web dv2-hint) — replaces the old callout card. */}
        <View style={styles.heroHint}>
          <LucideIcon name="info" size={rf(14)} color={colors.textSecondary} />
          <Text variant="bodySm" color="textSecondary" style={styles.heroHintText}>
            Your command center: a snapshot of coins earned, recent broadcasts, and alerts that need attention. Head to{' '}
            <Text style={styles.calloutStrong}>Earnings</Text> or <Text style={styles.calloutStrong}>Broadcast History</Text> for the full breakdown.
          </Text>
        </View>

        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <LucideIcon name="clock-3" size={rf(12)} color={colors.pink} />
            <Text style={styles.heroPillText}>{pending} coins pending</Text>
          </View>
          <View style={styles.heroPill}>
            <LucideIcon name="radio" size={rf(12)} color={colors.pink} />
            <Text style={styles.heroPillText}>{recentShows} recent shows</Text>
          </View>
          <View style={styles.heroPill}>
            <LucideIcon name="heart" size={rf(12)} color={colors.pink} />
            <Text style={styles.heroPillText}>{compactCount(followersData?.summary?.totalFollowers ?? 0)} followers</Text>
          </View>
        </View>

        <View style={styles.heroActions}>
          <GradientButton label="Start Live" leftIcon="radio" fullWidth={false} onPress={() => guard(() => router.push('/(app)/(tabs)/live'))} />
          <Button variant="secondary" style={styles.heroBtn} fullWidth={false} label="Schedule Session" leftIcon="calendar" onPress={() => guard(() => router.push('/(app)/(tabs)/calls/schedule-session'))} />
          <Button variant="secondary" style={styles.heroBtn} fullWidth={false} label="Private Calls" leftIcon="phone" onPress={() => guard(() => router.push('/(app)/(tabs)/calls/private-calls'))} />
        </View>
      </View>

      {/* ── Summary strip ── */}
      <View style={styles.summaryStrip}>
        {summary.map((cell) => (
          <View key={cell.label} style={styles.summaryCell}>
            <View style={[styles.summaryIc, { backgroundColor: cell.fill, borderColor: cell.border }]}>
              <LucideIcon name={cell.icon} size={rf(17)} color={cell.tint} />
            </View>
            <View style={styles.summaryBody}>
              <Text variant="label" color="textSecondary" numberOfLines={1}>{cell.label}</Text>
              {loadingEarnings && cell.label !== 'Recent Shows' ? (
                <Skeleton width={48} height={18} round={6} />
              ) : (
                <Text style={styles.summaryValue}>{cell.value}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* ── Recent Broadcasts panel ── */}
      <Card style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitleText}>Recent Broadcasts</Text>
          <Pressable style={styles.panelLink} onPress={() => router.push('/(app)/(tabs)/calls/broadcast-history')} hitSlop={12} accessibilityRole="button" accessibilityLabel="View full broadcast history">
            <LucideIcon name="bar-chart-3" size={rf(15)} color={colors.pink} />
            <Text style={styles.panelLinkText}>View all</Text>
          </Pressable>
        </View>

        {loadingBroadcasts ? (
          <View style={styles.rowSkeleton}>
            <Skeleton height={44} round={radius.md} />
            <Skeleton height={44} round={radius.md} />
            <Skeleton height={44} round={radius.md} />
          </View>
        ) : !broadcasts?.length ? (
          <Text variant="bodySm" color="textMuted" style={styles.emptyLine}>
            No ended broadcasts yet. They&apos;ll show up here once you end a live show.
          </Text>
        ) : (
          broadcasts.map((b, idx) => (
            <Pressable
              key={b.broadcastId}
              style={[styles.bcastRow, idx > 0 ? styles.rowDivider : null]}
              onPress={() => router.push('/(app)/(tabs)/calls/broadcast-history')}
              accessibilityRole="button"
              accessibilityLabel={b.title}
            >
              <View style={[styles.bcastIcon, b.endReason === CLEAN_END ? null : styles.bcastIconWarn]}>
                <LucideIcon name="radio" size={rf(16)} color={b.endReason === CLEAN_END ? colors.pink : colors.gold} />
              </View>
              <View style={styles.bcastMain}>
                <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>{b.title}</Text>
                <Text variant="label" color="textSecondary" numberOfLines={1} style={styles.bcastMeta}>
                  {shortDate(b.startedAtUtc)} · {duration(b.durationSeconds)} · Peak {compactCount(b.peakViewerCount)} viewers
                </Text>
              </View>
              <Text style={[styles.bcastEarn, b.totalRevenueTokens === 0 ? styles.bcastEarnZero : null]}>
                {b.totalRevenueTokens > 0 ? `+${formatTokens(b.totalRevenueTokens)}` : '0 coins'}
              </Text>
            </Pressable>
          ))
        )}
      </Card>

      {/* ── Notifications panel ── */}
      <Card style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitleText}>Notifications</Text>
          <Pressable style={styles.panelLink} onPress={() => router.push('/(app)/(tabs)/home/notifications')} hitSlop={12} accessibilityRole="button" accessibilityLabel="View all notifications">
            <Text style={styles.panelLinkText}>View all</Text>
            <LucideIcon name="chevron-right" size={rf(15)} color={colors.pink} />
          </Pressable>
        </View>

        {topNotes.length === 0 ? (
          <Text variant="bodySm" color="textMuted" style={styles.emptyLine}>
            You&apos;re all caught up — no new notifications.
          </Text>
        ) : (
          topNotes.map((n, idx) => {
            const visual = notificationVisual(n.type);
            return (
              <Pressable
                key={n.id}
                style={[styles.noteRow, idx > 0 ? styles.rowDivider : null]}
                onPress={() => router.push('/(app)/(tabs)/home/notifications')}
                accessibilityRole="button"
                accessibilityLabel={`${n.title}. ${n.body}`}
              >
                <LinearGradient
                  colors={['rgba(255,63,173,0.42)', 'rgba(52,231,255,0.2)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.noteIcon}
                >
                  <LucideIcon name={visual.icon} size={rf(15)} color={colors.white} />
                </LinearGradient>
                <View style={styles.noteMain}>
                  <View style={styles.noteTop}>
                    <Text variant="bodyLg" color="textPrimary" numberOfLines={1} style={styles.noteTitle}>{n.title}</Text>
                    <Text variant="label" color={n.isRead ? 'textMuted' : 'pink'}>
                      {n.isRead ? relativeShort(n.createdAtUtc) : 'NEW'}
                    </Text>
                  </View>
                  <Text variant="bodySm" color="textMuted" numberOfLines={2}>{n.body}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </Card>
      </>
      )}
    </Screen>
  );
};

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 20,
    gap: spacing.md,
  },

  // Hero — web .dv2-hero: surface fill + pink/violet/info wash, 1px border, radius-base
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.hero,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + spacing.xxs,
    gap: spacing.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  heroSkeleton: { backgroundColor: colors.surfaceSoft },
  /** Stacks the verify strip over the topbar, matching `.creator-main`'s 20px. */
  headerStack: { gap: 20 },

  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heroEyebrowText: {
    ...typography.eyebrow,
    // web .dv2-eyebrow: mono uppercase in --color-brand-pink
    color: colors.pink,
  },
  heroHint: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  heroHintText: { flex: 1, lineHeight: lineHeight.small },
  heroTitle: {
    ...typography.h1,
  },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  heroPillText: {
    ...typography.bodySm,
  },
  // Secondary hero buttons sit over the photo, so they need a solid fill + stronger border to read as buttons.
  heroBtn: { backgroundColor: colors.glassSurface, borderColor: colors.borderStrong },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },

  calloutStrong: { fontFamily: fontFamily.bold, color: colors.textPrimary },

  // KPI row — web .dv2-kpi (stacked icon / label / value on phones), 2×2 grid
  summaryStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  summaryCell: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: layout.cardPadding,
  },
  summaryIc: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: { alignSelf: 'stretch', gap: spacing.xxs, minWidth: 0 },
  summaryValue: {
    ...typography.numLg,
  },

  // Panels
  panel: { gap: spacing.sm },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  panelTitleText: { ...typography.metric, flex: 1 },
  panelLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, minHeight: 44 },
  panelLinkText: { ...typography.link, color: colors.pink },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  rowSkeleton: { gap: 10 },
  emptyLine: { lineHeight: lineHeight.small },

  // Broadcast row
  bcastRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  bcastIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bcastIconWarn: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
  bcastMeta: { textTransform: 'none' },
  bcastMain: { flex: 1, gap: spacing.xxs },
  bcastEarn: { fontFamily: fontFamily.mono, fontSize: fontSize.small, color: colors.green },
  bcastEarnZero: { color: colors.textMuted },

  // Notification row
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  noteIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: webColors.circleBorder, overflow: 'hidden' },
  noteMain: { flex: 1, gap: 3 },
  noteTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  noteTitle: { flex: 1 },
});

export default HomeScreen;
