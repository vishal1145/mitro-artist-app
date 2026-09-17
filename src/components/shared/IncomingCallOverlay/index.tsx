import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Text } from '@components/ui';
import { privateCallApi } from '@services/api/privateCallApi';
import { useIncomingCallStore } from '@store';
import { colors, fontFamily, radius, spacing, TAB_BAR_SPACE } from '@theme';
import { rf, wp } from '@utils/responsive';
import { showToast } from '@utils/toast';

const URGENT_SEC = 5;

/** Routes where the pop-up must not appear — active call/room screens (it would
 *  collide with the live call), the dedicated request modal, and the private
 *  calls tab (which already lists pending requests inline). */
const HIDDEN_ON = [
  'private-call-room',
  'group-call-room',
  'live-broadcast-room',
  'incoming-call-request',
  'private-calls',
];

const secondsUntil = (iso: string): number =>
  Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));

/**
 * Global incoming private-call pop-up.
 *
 * Mounted once in the root layout so it floats over whichever screen the artist
 * is on — the RN equivalent of the web's shell-level `IncomingPrivateCallModal`.
 * It reads the earliest-expiring pending request from `useIncomingCallStore` and
 * sits just above the floating tab bar (never at the very bottom, so it clears
 * the footer).
 */
export const IncomingCallOverlay = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const request = useIncomingCallStore((s) => s.current);
  const dismiss = useIncomingCallStore((s) => s.dismiss);

  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [remaining, setRemaining] = useState(0);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.12, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const requestId = request?.requestId;
  const expiresAt = request?.expiresAtUtc;

  // Reset the button state whenever a different request takes the stage.
  useEffect(() => {
    setBusy(null);
  }, [requestId]);

  // Drive the countdown; auto-dismiss when it expires.
  useEffect(() => {
    if (!requestId || !expiresAt) return;
    setRemaining(secondsUntil(expiresAt));
    const id = setInterval(() => {
      const left = secondsUntil(expiresAt);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        dismiss(requestId);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [requestId, expiresAt, dismiss]);

  const onAccept = useCallback(async () => {
    if (busy || !request) return;
    setBusy('accept');
    const res = await privateCallApi.acceptRequest(request.requestId);
    if (res.success) {
      dismiss(request.requestId);
      router.push({
        pathname: '/(app)/(modals)/private-call-room',
        params: {
          connection: JSON.stringify(res.data),
          fanName: request.userDisplayName,
          ratePerMin: String(request.pricePerMinuteSnapshot),
        },
      });
    } else {
      showToast(res.error, 'error');
      setBusy(null);
    }
  }, [busy, request, dismiss, router]);

  const onReject = useCallback(async () => {
    if (busy || !request) return;
    setBusy('reject');
    await privateCallApi.rejectRequest(
      request.requestId,
      'Not available right now',
    );
    dismiss(request.requestId);
  }, [busy, request, dismiss]);

  if (!request) return null;
  if (HIDDEN_ON.some((r) => pathname?.includes(r))) return null;

  const urgent = remaining <= URGENT_SEC;

  return (
    <View
      style={[styles.wrap, { paddingBottom: insets.bottom + TAB_BAR_SPACE }]}
      pointerEvents="box-none"
    >
      <View style={styles.card}>
        <View style={styles.head}>
          <Animated.View style={[styles.iconWrap, pulseStyle]}>
            <Feather
              name="phone-incoming"
              size={rf(20)}
              color={colors.purple}
            />
          </Animated.View>
          <View style={styles.headText}>
            <Text variant="label" color="purple" style={styles.eyebrow}>
              INCOMING PRIVATE CALL
            </Text>
            <Text
              variant="bodyLg"
              color="textPrimary"
              style={styles.name}
              numberOfLines={1}
            >
              {request.userDisplayName || 'Someone'}
            </Text>
          </View>
          <Avatar
            initials={(request.userDisplayName || 'S')
              .slice(0, 1)
              .toUpperCase()}
            size="md"
          />
        </View>

        {request.message ? (
          <Text
            variant="bodySm"
            color="textSecondary"
            style={styles.message}
            numberOfLines={2}
          >
            &ldquo;{request.message}&rdquo;
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.priceRow}>
            <Feather name="zap" size={rf(12)} color={colors.gold} />
            <Text variant="caption" color="textPrimary">
              {request.initialChargeSnapshot} coins / 5 min
              <Text variant="caption" color="textMuted">
                {' '}
                ({request.pricePerMinuteSnapshot}/min after)
              </Text>
            </Text>
          </View>
          <Text
            variant="caption"
            color={urgent ? 'danger' : 'textMuted'}
            style={styles.countdown}
          >
            Expires in {remaining}s
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.reject]}
            onPress={onReject}
            disabled={busy !== null}
            accessibilityLabel="Reject call"
          >
            {busy === 'reject' ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <>
                <Feather name="x" size={rf(15)} color={colors.danger} />
                <Text variant="bodyLg" color="danger" style={styles.btnText}>
                  Reject
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.btn, styles.accept]}
            onPress={onAccept}
            disabled={busy !== null}
            accessibilityLabel="Accept call"
          >
            {busy === 'accept' ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Feather name="check" size={rf(15)} color={colors.white} />
                <Text variant="bodyLg" color="white" style={styles.btnText}>
                  Accept
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(140,77,255,0.35)',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: wp(11),
    height: wp(11),
    borderRadius: radius.full,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  eyebrow: {
    letterSpacing: 0.4,
  },
  name: {
    fontFamily: fontFamily.extrabold,
  },
  message: {
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.cardRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  countdown: {
    fontFamily: fontFamily.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: radius.pill,
  },
  reject: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  accept: {
    backgroundColor: colors.success,
  },
  btnText: {
    fontFamily: fontFamily.extrabold,
  },
});

export default IncomingCallOverlay;
