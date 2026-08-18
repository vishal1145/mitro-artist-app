import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthBackground, Screen } from '@components/shared';
import { Badge, Card, LogoBadge, Text } from '@components/ui';
import { colors, fontFamily, gradients, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

/* -------------------------------------------------------------------------- */
/*  Data (static demo content — mirrors the reference design)                 */
/* -------------------------------------------------------------------------- */

const STATS = [
  { icon: 'cash-outline' as IoniconName, label: 'PENDING', value: '674', unit: 'tk', unitColor: 'textMuted' as const, tint: colors.warning },
  { icon: 'people-outline' as IoniconName, label: 'FOLLOWERS', value: '48.2', unit: 'K', unitColor: 'success' as const, tint: colors.success },
];

const BROADCASTS = [
  { id: 'bc_001', title: 'Midnight Synthwave', duration: '45m', views: '1.2K', likes: '342', earned: '+ 150 tk', date: 'Yesterday', gradient: gradients.cta, icon: 'musical-notes' as IoniconName },
  { id: 'bc_002', title: 'Acoustic Chill Session', duration: '1h 20m', views: '890', likes: '210', earned: '+ 85 tk', date: 'Oct 24', gradient: gradients.primary, icon: 'musical-note' as IoniconName },
  { id: 'bc_003', title: 'Weekly Q&A #12', duration: '30m', views: '2.1K', likes: '560', earned: '+ 320 tk', date: 'Oct 20', gradient: gradients.brand, icon: 'chatbubbles-outline' as IoniconName },
];

type AlertRoute =
  | '/(app)/(tabs)/home/notifications'
  | '/(app)/(tabs)/home/reward-fulfillment';

const ALERTS: {
  icon: IoniconName;
  highlight: boolean;
  lead: string;
  body: string;
  time: string;
  route: AlertRoute;
}[] = [
  {
    icon: 'gift',
    highlight: true,
    lead: 'Rewards:',
    body: ' 3 fan rewards are waiting on delivery — 1 is due today.',
    time: '10 minutes ago',
    route: '/(app)/(tabs)/home/reward-fulfillment',
  },
  {
    icon: 'sparkles',
    highlight: false,
    lead: 'System:',
    body: " You've reached a new milestone! 48K followers unlocked.",
    time: '2 hours ago',
    route: '/(app)/(tabs)/home/notifications',
  },
  {
    icon: 'megaphone-outline',
    highlight: false,
    lead: '',
    body: 'Your upcoming scheduled session "Tech Talk Tuesdays" is in 24 hours.',
    time: 'Yesterday',
    route: '/(app)/(tabs)/home/notifications',
  },
];

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

const IconChip = ({ icon, tint, round = false }: { icon: IoniconName; tint?: string; round?: boolean }) => (
  <View style={[styles.chip, round ? styles.chipRound : null]}>
    <Ionicons name={icon} size={rf(18)} color={tint ?? colors.textSecondary} />
  </View>
);

const SectionTitle = ({ icon, children }: { icon?: IoniconName; children: ReactNode }) => (
  <View style={styles.sectionTitleRow}>
    {icon ? <Ionicons name={icon} size={rf(18)} color={colors.primary} style={styles.sectionTitleIcon} /> : null}
    <Text variant="h3" style={styles.sectionTitle}>
      {children}
    </Text>
  </View>
);

/** Decorative faux "mini dashboard" used behind the analytics/audience cards. */
const PreviewPanel = ({ height, overlay }: { height: number; overlay?: ReactNode }) => (
  <View style={[styles.preview, { height }]}>
    <View style={styles.previewSidebar}>
      <View style={styles.previewDot} />
      {[0.9, 0.6, 0.75, 0.5, 0.65].map((w, i) => (
        <View key={i} style={[styles.previewLine, { width: `${w * 100}%` }]} />
      ))}
    </View>
    <View style={styles.previewMain}>
      <View style={styles.previewPillRow}>
        <View style={styles.previewPill} />
        <View style={styles.previewPill} />
      </View>
      <View style={styles.previewChart}>
        {[0.4, 0.7, 0.5, 0.85, 0.6, 0.95, 0.55].map((h, i) => (
          <View key={i} style={[styles.previewBar, { height: `${h * 100}%` }]} />
        ))}
      </View>
      {[0.8, 0.65, 0.7].map((w, i) => (
        <View key={i} style={[styles.previewRow, { width: `${w * 100}%` }]} />
      ))}
    </View>
    {overlay ? <View style={styles.previewOverlay}>{overlay}</View> : null}
  </View>
);

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

const HomeScreen = () => {
  const router = useRouter();

  return (
    <Screen scrollable background={<AuthBackground />} contentContainerStyle={styles.content}>
      {/* App bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <LogoBadge variant="wave" size={wp(8)} />
          <Text variant="h3" style={styles.appBarTitle}>
            Dashboard
          </Text>
        </View>
        <View style={styles.appBarRight}>
          <Pressable onPress={() => router.push('/(app)/(tabs)/home/notifications')} hitSlop={spacing.xs} accessibilityRole="button" accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={rf(22)} color={colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.avatar} onPress={() => router.push('/(app)/(tabs)/me')} accessibilityRole="button" accessibilityLabel="Profile">
            <Ionicons name="person" size={rf(18)} color={colors.onPrimaryContrast} />
          </Pressable>
        </View>
      </View>

      {/* Search — opens the dedicated Search screen */}
      <Pressable
        style={styles.searchBar}
        onPress={() => router.push('/(app)/(tabs)/home/search')}
        accessibilityRole="search"
        accessibilityLabel="Search sessions, followers and transactions"
      >
        <Ionicons name="search" size={rf(17)} color={colors.textMuted} />
        <Text variant="body" color="inputPlaceholder">
          Search sessions, followers, transactions
        </Text>
      </Pressable>

      {/* Hero */}
      <View style={styles.hero}>
        <Text variant="h1" style={styles.heroTitle}>
          Creator Hub
        </Text>
        <Text variant="body" color="textSecondary" style={styles.heroSubtitle}>
          Manage streams, sessions, earnings, and your audience.
        </Text>
        <View style={styles.heroButtons}>
          <Pressable style={styles.heroButton} onPress={() => router.push('/(app)/(tabs)/live')} accessibilityRole="button" accessibilityLabel="Start Live">
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroButtonFill}
            >
              <Ionicons name="videocam" size={rf(18)} color={colors.ctaDark} />
              <Text variant="link" color="ctaDark">
                Start Live
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={[styles.heroButton, styles.heroButtonSurface]} onPress={() => router.push('/(app)/(tabs)/calls/schedule-session')} accessibilityRole="button" accessibilityLabel="Schedule">
            <Ionicons name="calendar-outline" size={rf(18)} color={colors.textPrimary} />
            <Text variant="link" color="textPrimary">
              Schedule
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {STATS.map((stat) => (
          <Pressable
            key={stat.label}
            style={styles.statCard}
            onPress={() =>
              router.push(
                stat.label === 'PENDING'
                  ? '/(app)/(tabs)/business'
                  : '/(app)/(tabs)/me/followers',
              )
            }
            accessibilityRole="button"
            accessibilityLabel={stat.label}
          >
            <Card style={styles.statCardInner}>
              <View style={styles.statTop}>
                <IconChip icon={stat.icon} tint={stat.tint} />
                <Text variant="label" color="textMuted">
                  {stat.label}
                </Text>
              </View>
              <View style={styles.statValueRow}>
                <Text variant="h1" style={styles.statValue}>
                  {stat.value}
                </Text>
                <Text variant="caption" color={stat.unitColor} style={styles.statUnit}>
                  {stat.unit}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Analytics Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle>Analytics Overview</SectionTitle>
          <Pressable onPress={() => router.push('/(app)/(tabs)/calls/broadcast-history')} hitSlop={spacing.xs} accessibilityRole="button" accessibilityLabel="Analytics details">
            <Text variant="label" color="primary">
              Details
            </Text>
          </Pressable>
        </View>
        <PreviewPanel height={wp(46)} />
      </View>

      {/* Recent Broadcasts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle icon="time-outline">Recent Broadcasts</SectionTitle>
          <Badge label="5 Shows" tone="neutral" />
        </View>

        {BROADCASTS.map((show) => (
          <Card
            key={show.id}
            style={styles.broadcast}
            onPress={() =>
              router.push({
                pathname: '/(app)/(tabs)/home/broadcast-detail',
                params: { broadcastId: show.id },
              })
            }
          >
            <View style={styles.thumb}>
              <LinearGradient colors={show.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thumbFill}>
                <Ionicons name={show.icon} size={rf(20)} color={colors.textPrimary} />
              </LinearGradient>
              <View style={styles.durationChip}>
                <Text variant="caption" color="white" style={styles.durationText}>
                  {show.duration}
                </Text>
              </View>
            </View>

            <View style={styles.broadcastBody}>
              <Text variant="link" color="textPrimary" numberOfLines={1}>
                {show.title}
              </Text>
              <View style={styles.broadcastStats}>
                <Ionicons name="eye-outline" size={rf(14)} color={colors.textMuted} />
                <Text variant="caption" color="textMuted" style={styles.broadcastStat}>
                  {show.views}
                </Text>
                <Ionicons name="heart-outline" size={rf(14)} color={colors.textMuted} style={styles.broadcastStatIcon} />
                <Text variant="caption" color="textMuted" style={styles.broadcastStat}>
                  {show.likes}
                </Text>
              </View>
            </View>

            <View style={styles.broadcastMeta}>
              <Badge label={show.earned} tone="success" />
              <Text variant="caption" color="textMuted" style={styles.broadcastDate}>
                {show.date}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Audience map */}
      <PreviewPanel
        height={wp(38)}
        overlay={
          <View style={styles.audienceOverlay}>
            <View style={styles.audienceScrim} />
            <View style={styles.audienceLabel}>
              <IconChip icon="globe-outline" tint={colors.primary} round />
              <Text variant="label" color="onSurface">
                Audience Map Unlocked
              </Text>
            </View>
          </View>
        }
      />

      {/* Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle icon="notifications-outline">Alerts</SectionTitle>
          <View style={styles.alertDot} />
        </View>

        {ALERTS.map((alert, i) => (
          <Card
            key={i}
            style={[styles.alert, alert.highlight ? styles.alertHighlight : null]}
            onPress={() => router.push(alert.route)}
            accessibilityLabel={alert.lead ? `${alert.lead}${alert.body}` : alert.body}
          >
            <IconChip icon={alert.icon} tint={alert.highlight ? colors.primary : colors.textSecondary} round />
            <View style={styles.alertBody}>
              <Text variant="body" color="textSecondary">
                {alert.lead ? (
                  <Text variant="body" color="primary" style={styles.alertLead}>
                    {alert.lead}
                  </Text>
                ) : null}
                {alert.body}
              </Text>
              <Text variant="caption" color="textMuted" style={styles.alertTime}>
                {alert.time}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
};

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },

  // App bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appBarTitle: {
    fontFamily: fontFamily.heading,
    fontSize: rf(17),
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  // Hero
  hero: {
    gap: spacing.xs,
  },
  heroTitle: {
    fontFamily: fontFamily.display,
    fontSize: rf(26),
  },
  heroSubtitle: {
    maxWidth: '92%',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroButton: {
    flex: 1,
    height: wp(13),
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  heroButtonFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  heroButtonSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    gap: spacing.sm,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  statValue: {
    fontFamily: fontFamily.display,
    fontSize: rf(23),
  },
  statUnit: {
    marginBottom: rf(4),
  },

  // Icon chip
  chip: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.md,
    backgroundColor: colors.iconChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRound: {
    borderRadius: radius.full,
  },

  // Section
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitleIcon: {
    marginRight: spacing.xxs,
  },
  sectionTitle: {
    fontFamily: fontFamily.heading,
    fontSize: rf(17),
  },

  // Preview panel (faux dashboard)
  preview: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    overflow: 'hidden',
  },
  previewSidebar: {
    width: '22%',
    backgroundColor: colors.background,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  previewDot: {
    width: wp(4),
    height: wp(4),
    borderRadius: radius.full,
    backgroundColor: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  previewLine: {
    height: rf(4),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  previewMain: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  previewPillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewPill: {
    flex: 1,
    height: wp(7),
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  previewChart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  previewBar: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  previewRow: {
    height: rf(5),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Audience map
  audienceOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  audienceScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  audienceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },

  // Broadcast card
  broadcast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: wp(19),
    height: wp(17),
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumbFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChip: {
    position: 'absolute',
    left: spacing.xxs,
    bottom: spacing.xxs,
    borderRadius: radius.sm,
    backgroundColor: colors.chipSurfaceStrong,
    paddingHorizontal: spacing.xs,
    paddingVertical: rf(1),
  },
  durationText: {
    fontSize: rf(10),
  },
  broadcastBody: {
    flex: 1,
    gap: spacing.xs,
  },
  broadcastStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  broadcastStat: {
    marginLeft: spacing.xxs,
  },
  broadcastStatIcon: {
    marginLeft: spacing.sm,
  },
  broadcastMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  broadcastDate: {
    marginTop: spacing.xxs,
  },

  // Alerts
  alertDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: radius.full,
    backgroundColor: colors.error,
  },
  alert: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  alertHighlight: {
    borderLeftWidth: wp(0.8),
    borderLeftColor: colors.primary,
    backgroundColor: colors.surfaceRaised,
  },
  alertBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  alertLead: {
    fontFamily: fontFamily.bodySemibold,
  },
  alertTime: {
    marginTop: spacing.xxs,
  },
});

export default HomeScreen;
