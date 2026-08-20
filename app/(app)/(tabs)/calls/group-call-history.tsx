import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  InsightLine,
  PageHeader,
  ProgressBar,
  Screen,
  SectionLabel,
  TimelineRow,
} from '@components/shared';
import { Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

interface Upcoming {
  id: string;
  /** Date heading this session sits under. */
  group: string;
  title: string;
  when: string;
  price: string;
  filled: number;
  total: number;
  /** Startable now — otherwise the CTA is a disabled "Starts later". */
  startable?: boolean;
}

const UPCOMING: Upcoming[] = [
  {
    id: 'gs_101',
    group: 'Today',
    title: 'Mixing Masterclass: Vocals',
    when: 'Today · 7:00 PM',
    price: '4,000 tk',
    filled: 8,
    total: 10,
    startable: true,
  },
  {
    id: 'gs_102',
    group: 'Thu, Aug 21',
    title: 'Songwriting Q&A',
    when: 'Aug 21 · 6:30 PM',
    price: '1,500 tk',
    filled: 3,
    total: 12,
  },
];

const PAST = [
  {
    id: 'gs_098',
    title: 'Late Night Q&A',
    meta: 'Aug 12 · 10 seats sold',
    earned: '+2,400 tk',
    dot: colors.violet,
  },
  {
    id: 'gs_094',
    title: 'Beat-making Circle',
    meta: 'Aug 5 · 7 seats',
    earned: '+1,900 tk',
    dot: colors.pink,
  },
];

/** Group sessions — lifetime earnings, what's scheduled, and what's finished. */
const GroupSessionsScreen = () => {
  const router = useRouter();

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <PageHeader
          title="Group Sessions"
          onBack={() => router.back()}
          right={
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/calls/schedule-session')}
              style={styles.newBtn}
              accessibilityRole="button"
              accessibilityLabel="Schedule a new session"
            >
              <Text variant="bodySm" color="white" style={styles.newLabel}>
                + New
              </Text>
            </Pressable>
          }
        />
      }
    >

      {/* Lifetime total */}
      <View style={styles.hero}>
        <Text style={styles.heroValue}>14.2k tk</Text>
        <Text variant="bodySm" color="textMuted">
          from 9 sessions
        </Text>
      </View>

      <InsightLine style={styles.insight} lead="Today's 7 PM class is nearly full" />

      <SectionLabel divider style={styles.sectionLabel} onHelp={() => undefined}>
        UPCOMING
      </SectionLabel>

      {UPCOMING.map((s, i) => (
        <View key={s.id} style={[styles.session, i > 0 ? styles.sessionDivider : null]}>
          <Text variant="bodySm" color="textPrimary" style={styles.groupLabel}>
            {s.group}
          </Text>

          <View style={styles.sessionHead}>
            <Text variant="h3" style={styles.sessionTitle} numberOfLines={1}>
              {s.title}
            </Text>
            <View style={styles.pricePill}>
              <Text variant="bodySm" color="gold" style={styles.priceLabel}>
                {s.price}
              </Text>
            </View>
          </View>

          <Text variant="bodySm" color="textMuted" style={styles.sessionWhen}>
            {s.when}
          </Text>

          <View style={styles.seatRow}>
            <ProgressBar value={s.filled / s.total} />
            <Text variant="bodySm" color="textMuted">
              {s.filled}/{s.total} seats
            </Text>
          </View>

          {s.startable ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/(modals)/group-call-room',
                  params: { sessionId: s.id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Start ${s.title}`}
              style={styles.cta}
            >
              <LinearGradient
                colors={gradients.cta}
                start={gradientDirection.horizontal.start}
                end={gradientDirection.horizontal.end}
                style={styles.ctaFill}
              >
                <Text style={styles.ctaLabel}>Start session</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={[styles.cta, styles.ctaLater]}>
              <Text variant="bodyLg" color="textMuted" style={styles.ctaLaterLabel}>
                Starts later
              </Text>
            </View>
          )}
        </View>
      ))}

      <SectionLabel divider style={styles.sectionLabel}>
        PAST SESSIONS
      </SectionLabel>

      {PAST.map((p, i) => (
        <TimelineRow
          key={p.id}
          title={p.title}
          meta={p.meta}
          value={p.earned}
          dotColor={p.dot}
          last={i === PAST.length - 1}
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/home/broadcast-detail',
              params: { broadcastId: p.id },
            })
          }
        />
      ))}

    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },

  newBtn: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newLabel: {
    fontFamily: fontFamily.bold,
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 12,
  },
  heroValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(28),
    lineHeight: rf(33),
    color: colors.gold,
  },
  insight: {
    marginTop: 16,
  },

  sectionLabel: {
    marginTop: 12,
    marginBottom: 16,
  },

  session: {
    paddingBottom: 4,
  },
  sessionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
    marginTop: 20,
  },
  groupLabel: {
    fontFamily: fontFamily.bold,
    marginBottom: 12,
  },
  sessionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionTitle: {
    flex: 1,
  },
  pricePill: {
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  priceLabel: {
    fontFamily: fontFamily.bold,
  },
  sessionWhen: {
    marginTop: 4,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },

  cta: {
    height: 48,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 16,
  },
  ctaFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    color: colors.white,
  },
  // Not yet startable — dashed outline reads as "waiting", not "broken".
  ctaLater: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  ctaLaterLabel: {
    fontFamily: fontFamily.bold,
  },

  footnote: {
    marginTop: 28,
  },
});

export default GroupSessionsScreen;
