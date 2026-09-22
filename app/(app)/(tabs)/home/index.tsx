import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EarningsBar, Screen, Skeleton, VerificationBanner } from '@components/shared';
import { Card, LucideIcon, Text } from '@components/ui';
import type { LucideIconName } from '@components/ui';
import { useBroadcastHistory, useEarningsSummary } from '@hooks/useInsights';
import { useFollowers } from '@hooks/useFollowers';
import { useVerificationGate } from '@hooks/useVerificationGate';
import { useNotificationStore } from '@store';
import { colors, fontFamily, layout, radius, spacing, typography, webColors } from '@theme';
import { compactCount, duration, formatTokens, grouped, relativeShort, shortDate } from '@utils/format';
import { notificationVisual } from '@utils/notifications';
import { rf } from '@utils/responsive';

/** How many past broadcasts / notifications the dashboard panels show. */
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
  const summary: { icon: LucideIconName; tint: string; fill: string; label: string; value: string }[] = [
    { icon: 'coins', tint: colors.gold, fill: colors.warningSoft, label: 'Total Coins', value: earnings ? grouped(earnings.totalTokens) : '—' },
    { icon: 'clock-3', tint: colors.purple, fill: colors.purpleSoft, label: 'Pending', value: earnings ? grouped(earnings.pendingTokens) : '—' },
    { icon: 'wallet', tint: colors.green, fill: colors.successChip, label: 'Available', value: earnings ? grouped(earnings.availableTokens) : '—' },
    { icon: 'radio', tint: colors.cyan, fill: colors.cyanSoft, label: 'Recent Shows', value: String(recentShows) },
  ];

  const topNotes = (notes ?? []).slice(0, NOTES_COUNT);

  // Full-page skeleton on first load — mirrors the web dashboard's isLoading state
  // (skeleton hero, summary strip and two panels) instead of a bare screen.
  const showSkeleton = loadingEarnings && !earnings;
  const renderSkeleton = () => (
    <>
      <View style={[styles.hero, styles.heroSkeleton]}>
        <Skeleton width={150} height={16} round={6} />
        <Skeleton width="80%" height={26} round={8} />
        <View style={styles.heroPills}>
          <Skeleton width={120} height={26} round={999} />
          <Skeleton width={104} height={26} round={999} />
          <Skeleton width={96} height={26} round={999} />
        </View>
        <Skeleton height={48} round={12} />
        <Skeleton height={46} round={12} />
        <Skeleton height={46} round={12} />
      </View>

      <View style={styles.summaryStrip}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.summaryCell}>
            <Skeleton width={36} height={36} round={10} />
            <View style={styles.summaryBody}>
              <Skeleton width="60%" height={10} round={6} />
              <Skeleton width="45%" height={18} round={6} />
            </View>
          </View>
        ))}
      </View>

      {[0, 1].map((p) => (
        <Card key={p} style={styles.panel}>
          <View style={styles.panelHead}>
            <Skeleton width={150} height={16} round={6} />
            <Skeleton width={34} height={34} round={10} />
          </View>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.bcastRow}>
              <Skeleton width={34} height={34} round={10} />
              <View style={styles.bcastMain}>
                <Skeleton width="65%" height={12} round={6} />
                <Skeleton width="40%" height={10} round={6} />
              </View>
              <Skeleton width={46} height={14} round={6} />
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
      <LinearGradient
        colors={['#0A0817', '#160C2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroEyebrow}>
          <Text style={styles.heroEyebrowText}>CREATOR DASHBOARD</Text>
        </View>
        <Text style={styles.heroTitle}>Manage streams, sessions, earnings, and your audience.</Text>

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

        <Pressable style={styles.heroPrimary} onPress={() => guard(() => router.push('/(app)/(tabs)/live'))} accessibilityRole="button" accessibilityLabel="Start Live">
          <LinearGradient colors={['#FF3FAD', '#7B35FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroPrimaryFill}>
            <LucideIcon name="radio" size={rf(16)} color={colors.white} />
            <Text style={styles.heroPrimaryText}>Start Live</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.heroSecondary} onPress={() => guard(() => router.push('/(app)/(tabs)/calls/schedule-session'))} accessibilityRole="button" accessibilityLabel="Schedule Session">
          <LucideIcon name="calendar-days" size={rf(15)} color={colors.white} />
          <Text style={styles.heroSecondaryText}>Schedule Session</Text>
        </Pressable>
        <Pressable style={styles.heroSecondary} onPress={() => guard(() => router.push('/(app)/(tabs)/calls/private-calls'))} accessibilityRole="button" accessibilityLabel="Private Calls">
          <LucideIcon name="phone" size={rf(15)} color={colors.white} />
          <Text style={styles.heroSecondaryText}>Private Calls</Text>
        </Pressable>
      </LinearGradient>

      {/* ── Info callout ── */}
      <View style={styles.callout}>
        <View style={styles.calloutIcon}>
          <LucideIcon name="info" size={rf(15)} color={colors.cyan} />
        </View>
        <Text variant="bodySm" color="textSecondary" style={styles.calloutText}>
          This is your <Text style={styles.calloutStrong}>command center</Text> — a snapshot of coins earned, recent
          broadcasts, and alerts that need attention. Head to Earnings or Broadcast History for the full breakdown.
        </Text>
      </View>

      {/* ── Summary strip ── */}
      <View style={styles.summaryStrip}>
        {summary.map((cell) => (
          <View key={cell.label} style={styles.summaryCell}>
            <View style={[styles.summaryIc, { backgroundColor: cell.fill }]}>
              <LucideIcon name={cell.icon} size={rf(15)} color={cell.tint} />
            </View>
            <View style={styles.summaryBody}>
              <Text variant="caption" color="textMuted" numberOfLines={1}>{cell.label}</Text>
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
          <View style={styles.panelTitle}>
            <LucideIcon name="radio" size={rf(15)} color={colors.pink} />
            <Text variant="h3">Recent Broadcasts</Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(app)/(tabs)/calls/broadcast-history')} hitSlop={8} accessibilityRole="button" accessibilityLabel="View full broadcast history">
            <LucideIcon name="bar-chart-3" size={rf(17)} color={colors.textMuted} />
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
          broadcasts.map((b) => (
            <Pressable
              key={b.broadcastId}
              style={styles.bcastRow}
              onPress={() => router.push('/(app)/(tabs)/calls/broadcast-history')}
              accessibilityRole="button"
              accessibilityLabel={b.title}
            >
              <View style={[styles.bcastIcon, { backgroundColor: b.endReason === CLEAN_END ? colors.successChip : colors.warningSoft }]}>
                <LucideIcon name="radio" size={rf(15)} color={b.endReason === CLEAN_END ? colors.green : colors.gold} />
              </View>
              <View style={styles.bcastMain}>
                <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>{b.title}</Text>
                <Text variant="bodySm" color="textMuted" numberOfLines={1}>
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
          <View style={styles.panelTitle}>
            <LucideIcon name="bell" size={rf(15)} color={colors.pink} />
            <Text variant="h3">Notifications</Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(app)/(tabs)/home/notifications')} hitSlop={8} accessibilityRole="button" accessibilityLabel="View all notifications">
            <LucideIcon name="chevron-right" size={rf(17)} color={colors.textMuted} />
          </Pressable>
        </View>

        {topNotes.length === 0 ? (
          <Text variant="bodySm" color="textMuted" style={styles.emptyLine}>
            You&apos;re all caught up — no new notifications.
          </Text>
        ) : (
          topNotes.map((n) => {
            const visual = notificationVisual(n.type);
            return (
              <Pressable
                key={n.id}
                style={styles.noteRow}
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

  // Hero — dark premium card (matches web .creator-hero)
  hero: {
    borderRadius: radius.hero,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 18,
    gap: 10,
    marginTop: spacing.sm,
  },
  heroSkeleton: { backgroundColor: 'rgba(255,255,255,0.02)' },
  /** Stacks the verify strip over the topbar, matching `.creator-main`'s 20px. */
  headerStack: { gap: 20 },

  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrowText: {
    ...typography.eyebrow,
    /**
     * `.creator-hero span` is gradient-filled text on web (`--premium-gradient`
     * through `background-clip: text`), with `#ff9bcc` declared as the fallback.
     * Left uncoloured this inherited the body white — the one eyebrow in the app
     * that did. Every other screen's eyebrow already uses this pink.
     */
    color: webColors.pinkLight,
  },
  heroTitle: {
    ...typography.h1,
  },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2, marginBottom: 4 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7,10,20,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  heroPillText: {
    ...typography.bodySm,
  },
  heroPrimary: { height: 48, borderRadius: 12, overflow: 'hidden' },
  heroPrimaryFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroPrimaryText: {
    ...typography.button,
  },
  heroSecondary: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(255,255,255,0.065)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroSecondaryText: {
    ...typography.buttonSm,
  },

  // Info callout
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: 'rgba(52,231,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52,231,255,0.25)',
    borderLeftWidth: 3,
    borderLeftColor: colors.cyan,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  calloutIcon: { marginTop: 1 },
  calloutText: { flex: 1, lineHeight: rf(18) },
  calloutStrong: { fontFamily: fontFamily.bold, color: colors.textPrimary },

  // Summary strip — 2×2 grid on mobile
  summaryStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryCell: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryIc: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryBody: { flex: 1, gap: 3, minWidth: 0 },
  summaryValue: {
    ...typography.metric,
  },

  // Panels
  panel: { gap: spacing.md },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.cardRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowSkeleton: { gap: 10 },
  emptyLine: { lineHeight: rf(18) },

  // Broadcast row
  bcastRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bcastIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bcastMain: { flex: 1, gap: 2 },
  bcastEarn: { fontFamily: fontFamily.bold, fontSize: rf(13), color: colors.green },
  bcastEarnZero: { color: colors.textMuted },

  // Notification row
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  noteIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  noteMain: { flex: 1, gap: 3 },
  noteTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  noteTitle: { flex: 1 },
});

export default HomeScreen;
