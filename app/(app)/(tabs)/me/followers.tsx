import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { InfoCallout, ListRow, Screen } from '@components/shared';
import { Avatar, Badge, Card, LogoBadge, Text, type BadgeTone } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

const PULSE = [
  { icon: 'checkmark-circle-outline' as IoniconName, label: 'Top Supporters', value: '128', tint: colors.warning },
  { icon: 'people-outline' as IoniconName, label: 'Session Regulars', value: '12', tint: colors.primary },
  { icon: 'star-outline' as IoniconName, label: 'Creator Rating', value: '4.9', tint: colors.warning },
];

const FOLLOWERS = [
  { initials: 'RS', name: 'Riya Sharma', sub: '12 sessions', coins: '12,450 coins', badge: 'TOP SUPPORTER', tone: 'success' as BadgeTone, avatar: colors.primaryDark },
  { initials: 'KM', name: 'Kabir Mehta', sub: '4 custom sessions', coins: '8,750 coins', badge: 'JOINED 8 SESSIONS', tone: 'primary' as BadgeTone, avatar: colors.primaryPressed },
  { initials: 'AR', name: 'Ananya Rao', sub: 'Followed today', coins: '2,100 coins', badge: 'NEW FOLLOWER', tone: 'warning' as BadgeTone, avatar: colors.warning },
];

/** Social tab — Followers. */
const FollowersScreen = () => {
  const router = useRouter();

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* App bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <LogoBadge variant="wave" size={wp(8)} />
          <Text variant="h3" style={styles.appBarTitle}>
            Followers
          </Text>
        </View>
        <View style={styles.appBarRight}>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/me/messages')}
            hitSlop={spacing.xs}
            accessibilityRole="button"
            accessibilityLabel="Open messages"
          >
            <Ionicons name="chatbubbles-outline" size={rf(22)} color={colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.walletBtn} onPress={() => router.push('/(app)/(tabs)/business/transactions')} accessibilityRole="button" accessibilityLabel="Open ledger">
            <Ionicons name="wallet-outline" size={rf(18)} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <InfoCallout tone="success" icon="information-circle-outline" linkLabel="Learn more about follower segmentation">
        <Text variant="caption" color="textSecondary">
          This is your full{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            follower list
          </Text>{' '}
          — everyone who follows you, tagged with badges like{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            Top Supporter
          </Text>
          ,{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            Session Regular
          </Text>
          , and{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            New Follower
          </Text>
          . Scan for the highest coin totals to spot who&apos;s worth a personal thank-you before you go live.{' '}
        </Text>
      </InfoCallout>

      {/* Audience Pulse */}
      <Card elevated style={styles.pulse}>
        <View style={styles.pulsePill}>
          <Ionicons name="heart-outline" size={rf(12)} color={colors.primary} />
          <Text variant="label" color="primary">
            AUDIENCE PULSE
          </Text>
        </View>
        <Text variant="display" style={styles.pulseValue}>
          48.2K
        </Text>
        <Text variant="caption" color="textSecondary">
          940 new followers joined this week with strong support from live gifts and paid sessions.
        </Text>

        <View style={styles.pulseList}>
          {PULSE.map((row) => (
            <ListRow
              key={row.label}
              icon={row.icon}
              iconTint={row.tint}
              title={row.label}
              value={row.value}
              style={styles.pulseRow}
            />
          ))}
        </View>
      </Card>

      <InfoCallout tone="neutral" icon="chatbubble-outline">
        <Text variant="caption" color="textSecondary">
          <Text variant="caption" color="onSurface" style={styles.bold}>
            Message with care:
          </Text>{' '}
          tapping Message opens a direct chat with that follower, so keep it warm and personal rather than a copy-pasted promo blast. Fans who feel spammed with sales pitches tend to unfollow fast — save broadcast-style announcements for your feed or livestream instead.
        </Text>
      </InfoCallout>

      {/* Follower cards */}
      {FOLLOWERS.map((f) => (
        <Card key={f.initials} style={styles.follower}>
          <View style={styles.followerTop}>
            <Avatar initials={f.initials} name={f.name} size="lg" color={f.avatar} />
            <View style={styles.followerInfo}>
              <Badge label={f.badge} tone={f.tone} />
              <Text variant="link" color="textPrimary" style={styles.followerName}>
                {f.name}
              </Text>
              <Text variant="caption" color="textMuted">
                {f.sub}
              </Text>
            </View>
            <Text variant="link" color="warning" style={styles.coins}>
              {f.coins}
            </Text>
          </View>

          <Pressable
            style={styles.messageBtn}
            onPress={() =>
              router.push({
                pathname: '/(app)/(modals)/chat-thread',
                params: { followerId: f.initials, name: f.name },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Message ${f.name}`}
          >
            <Ionicons name="chatbubble-outline" size={rf(15)} color={colors.textPrimary} />
            <Text variant="body" color="textPrimary">
              Message
            </Text>
          </Pressable>
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
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
    fontSize: rf(17),
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  walletBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bold: {
    fontFamily: fontFamily.bodySemibold,
  },

  // Audience Pulse
  pulse: {
    gap: spacing.xs,
  },
  pulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  pulseValue: {
    fontSize: rf(34),
  },
  pulseList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pulseRow: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },

  // Follower card
  follower: {
    gap: spacing.md,
  },
  followerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  followerInfo: {
    flex: 1,
    gap: spacing.xxs,
    alignItems: 'flex-start',
  },
  followerName: {
    marginTop: spacing.xxs,
  },
  coins: {
    marginTop: spacing.xxs,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default FollowersScreen;
