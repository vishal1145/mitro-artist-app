import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, gradientDirection, gradients } from '@theme';
import { rf } from '@utils/responsive';

export interface RingAvatarProps {
  initials: string;
  /**
   * Uploaded profile picture. Falls back to initials when absent, so a
   * not-yet-set avatar and a failed load look the same rather than blank.
   */
  imageUrl?: string | null;
  /** Outer diameter including the ring. */
  size?: number;
  /** Ring thickness. */
  ring?: number;
  /** Pill badge overlapping the bottom edge, e.g. "READY". */
  badge?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Profile avatar wrapped in the full accent-wheel ring, with an optional
 * status pill straddling its lower edge.
 */
const RingAvatarComponent = ({
  initials,
  imageUrl,
  size = 96,
  ring = 3,
  badge,
  style,
}: RingAvatarProps) => {
  const inner = size - ring * 2;

  return (
    <View style={[styles.wrap, { width: size }, style]}>
      <LinearGradient
        colors={gradients.ring}
        start={gradientDirection.diagonal.start}
        end={gradientDirection.diagonal.end}
        style={[styles.ring, { width: size, height: size, borderRadius: size / 2, padding: ring }]}
      >
        <LinearGradient
          colors={gradients.avatar}
          start={gradientDirection.diagonal.start}
          end={gradientDirection.diagonal.end}
          style={[styles.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: inner, height: inner, borderRadius: inner / 2 }}
              contentFit="cover"
              transition={150}
              accessibilityLabel="Profile picture"
            />
          ) : (
            <Text style={[styles.initials, { fontSize: inner * 0.34 }]}>{initials}</Text>
          )}
        </LinearGradient>
      </LinearGradient>

      {badge ? (
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const RingAvatar = memo(RingAvatarComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fontFamily.extrabold,
    color: colors.white,
  },
  // Straddles the ring's lower edge.
  badge: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.screen,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  badgeText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(9),
    letterSpacing: 0.8,
    color: colors.green,
  },
});
