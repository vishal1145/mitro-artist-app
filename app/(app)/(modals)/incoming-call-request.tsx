import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@components/shared';
import { Avatar, Card, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

/** Seconds before the request auto-declines. */
const AUTO_DECLINE_SEC = 24;
/** Below this the countdown turns red. */
const URGENT_SEC = 5;

const IncomingCallRequestScreen = () => {
  const router = useRouter();
  const { requestId, fan, offer } = useLocalSearchParams<{
    requestId?: string;
    fan?: string;
    offer?: string;
  }>();

  const fanName = fan ?? 'Riya Sharma';
  const rate = offer ?? '24 tk/min';

  const [remaining, setRemaining] = useState(AUTO_DECLINE_SEC);
  const [declined, setDeclined] = useState(false);
  /** Guards against the timer firing after the user already acted. */
  const settled = useRef(false);

  const dismiss = useCallback(() => {
    if (settled.current) {
      return;
    }
    settled.current = true;
    router.replace('/(app)/(tabs)/calls/private-calls');
  }, [router]);

  const accept = useCallback(() => {
    if (settled.current) {
      return;
    }
    settled.current = true;
    router.replace({
      pathname: '/(app)/(modals)/private-call-room',
      params: { callId: requestId ?? 'call_001', fanId: fanName, ratePerMin: '24' },
    });
  }, [router, requestId, fanName]);

  // Tick down once a second; at zero mark declined, then dismiss.
  useEffect(() => {
    if (settled.current) {
      return;
    }

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setDeclined(true);
          // Let the "Call declined" state show briefly before leaving.
          setTimeout(dismiss, 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [dismiss]);

  const urgent = remaining <= URGENT_SEC;
  const progress: `${number}%` = `${(remaining / AUTO_DECLINE_SEC) * 100}%`;
  const label = declined
    ? 'Call declined'
    : `Auto-declines in 0:${String(remaining).padStart(2, '0')}`;

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.body}>
        <Text variant="label" color="primary" style={styles.kicker}>
          INCOMING PRIVATE CALL
        </Text>

        {/* Caller */}
        <View style={styles.caller}>
          <View style={styles.avatarRing}>
            <Avatar initials="RS" name={fanName} size="xl" />
          </View>
          <Text variant="h2" align="center">
            {fanName}
          </Text>
          <View style={styles.pills}>
            <View style={[styles.pill, styles.pillWarning]}>
              <Ionicons name="star" size={rf(13)} color={colors.warning} />
              <Text variant="caption" color="warning">
                Top Supporter
              </Text>
            </View>
            <View style={[styles.pill, styles.pillNeutral]}>
              <Text variant="caption" color="textSecondary">
                12 sessions
              </Text>
            </View>
          </View>
        </View>

        {/* Offer */}
        <Card style={styles.offer}>
          <View style={styles.offerRow}>
            <Text variant="caption" color="textMuted">
              Rate
            </Text>
            <Text variant="label" color="textPrimary">
              {rate}
            </Text>
          </View>
          <View style={styles.offerRow}>
            <Text variant="caption" color="textMuted">
              Minimum
            </Text>
            <Text variant="label" color="textPrimary">
              5 min (120 tk)
            </Text>
          </View>
          <View style={styles.offerRow}>
            <Text variant="caption" color="textMuted">
              Fan Balance
            </Text>
            <Text variant="label" color="textPrimary">
              12,450 coins
            </Text>
          </View>
        </Card>

        {/* Countdown */}
        <View style={styles.countdown}>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: progress },
                urgent ? styles.fillUrgent : null,
              ]}
            />
          </View>
          <Text variant="label" color={urgent || declined ? 'error' : 'warning'}>
            {label}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={dismiss}
            disabled={declined}
            accessibilityRole="button"
            accessibilityLabel="Decline call"
          >
            <Text variant="link" color="textSecondary">
              Decline
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.acceptBtn, declined ? styles.disabled : null]}
            onPress={accept}
            disabled={declined}
            accessibilityRole="button"
            accessibilityLabel="Accept call"
          >
            <Ionicons name="call" size={rf(18)} color={colors.successBg} />
            <Text variant="link" color="successBg" style={styles.acceptLabel}>
              Accept
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={dismiss}
          hitSlop={spacing.sm}
          accessibilityRole="button"
          accessibilityLabel="Block this fan"
        >
          <Text variant="caption" color="textMuted">
            Block this fan
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  kicker: {
    letterSpacing: 2,
  },

  caller: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarRing: {
    padding: wp(2),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pillWarning: {
    backgroundColor: colors.warningChip,
  },
  pillNeutral: {
    backgroundColor: colors.surfaceElevated,
  },

  offer: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  countdown: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    alignSelf: 'stretch',
    height: wp(1),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.warning,
  },
  fillUrgent: {
    backgroundColor: colors.error,
  },

  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: wp(16),
    borderRadius: radius.lg,
  },
  declineBtn: {
    backgroundColor: colors.surfaceElevated,
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  acceptLabel: {
    fontFamily: fontFamily.bodySemibold,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IncomingCallRequestScreen;
