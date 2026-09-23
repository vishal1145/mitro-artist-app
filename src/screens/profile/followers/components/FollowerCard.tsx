import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { HelpIcon } from '@components/history';
import { LucideIcon, Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, webColors } from '@theme';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

import { activityText, BADGE_LABEL, BADGE_TINT, followerInitials, HINT_COINS, RADIUS } from '../formatters';

import type { Follower } from '@app-types/api';

interface FollowerCardProps {
  follower: Follower;
  onMessage: () => void;
}

/** One `.follower-card` — avatar image, or a gradient-initials fallback. */
export const FollowerCard = ({ follower: f, onMessage }: FollowerCardProps) => {
  const tint = BADGE_TINT[f.badge];

  return (
    <View style={styles.card}>
      {f.avatarUrl ? (
        <Image source={{ uri: f.avatarUrl }} style={styles.avatarImg} />
      ) : (
        <LinearGradient
          colors={webColors.avatarHot}
          start={gradientDirection.diagonal.start}
          end={gradientDirection.diagonal.end}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {followerInitials(f.displayName)}
          </Text>
        </LinearGradient>
      )}

      <View style={styles.main}>
        <View style={[styles.badge, { backgroundColor: tint.fill }]}>
          <Text style={[styles.badgeText, { color: tint.ink }]}>
            {BADGE_LABEL[f.badge]}
          </Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {f.displayName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {activityText(f)}
        </Text>
      </View>

      <View style={styles.right}>
        {/* .f-coins — gold figure + the faint (?) beside it */}
        <View style={styles.coinsRow}>
          <Text style={styles.coins}>
            {`${grouped(f.totalCoinsSpent)} coins`}
          </Text>
          <HelpIcon hint={HINT_COINS} />
        </View>
        <Pressable
          style={styles.msgBtn}
          onPress={onMessage}
          accessibilityRole="button"
          accessibilityLabel={`Message ${f.displayName}`}
        >
          <LucideIcon
            name="message-circle"
            size={rf(13)}
            color={webColors.muted}
          />
          <Text style={styles.msgBtnText}>Message</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 17,
    backgroundColor: webColors.surface,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    borderRadius: RADIUS,
  },
  /* .f-avatar — 52px circle, linear-gradient(135deg, #ff3fad, #6b2df4) */
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* .f-avatar-img — object-fit: cover */
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    resizeMode: 'cover',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(17.6),
    color: colors.white,
  },
  /* .f-main { flex: 1; min-width: 0 } */
  main: {
    flex: 1,
    minWidth: 0,
  },
  /* .f-badge — 0.625rem / 800 / 0.03em */
  badge: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    paddingVertical: 2,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    lineHeight: rf(15),
    letterSpacing: 0.3,
  },
  /* .f-main strong — 0.9rem / 700 */
  name: {
    fontFamily: fontFamily.bold,
    fontSize: rf(14.4),
    lineHeight: rf(20),
    color: webColors.textStrong,
  },

  /* .f-main small — 0.72rem / --premium-dim */
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: rf(11.52),
    lineHeight: rf(17),
    color: webColors.dim,
  },
  /* .f-right — column, right-aligned, gap 8 */
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  /* .f-coins — inline-flex, gap 4 */
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coins: {
    fontFamily: fontFamily.bold,
    fontSize: rf(14.08),
    color: webColors.gold,
  },
  /* .msg-btn — 0.72rem / 700 / surface-soft pill */
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 13,
    backgroundColor: webColors.surfaceSoft,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
  },

  msgBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(11.52),
    color: webColors.muted,
  },
});
