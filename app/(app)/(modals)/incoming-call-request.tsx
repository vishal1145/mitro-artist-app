import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Text } from '@components/ui';
import { privateCallApi } from '@services/api/privateCallApi';
import { incomingCallNative } from '@services/push/incomingCallNative';
import { colors, fontFamily, radius, spacing } from '@theme';
import { parseServerUtcMs } from '@utils/format';
import { rf, wp } from '@utils/responsive';
import { showToast } from '@utils/toast';

const URGENT_SEC = 5;

const IncomingCallRequestScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    fan?: string;
    message?: string;
    pricePerMinute?: string;
    initialCharge?: string;
    expiresAt?: string;
    auto?: string;
  }>();

  const requestId = params.requestId;
  const fanName = params.fan || 'Someone';
  const message = params.message || '';
  const pricePerMinute = Number(params.pricePerMinute) || 0;
  const initialCharge = Number(params.initialCharge) || 0;

  const secsUntilExpiry = () => {
    if (!params.expiresAt) return 24;
    const at = parseServerUtcMs(params.expiresAt) ?? Date.now() + 60_000;
    return Math.max(0, Math.floor((at - Date.now()) / 1000));
  };

  const [remaining, setRemaining] = useState(secsUntilExpiry());
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const settled = useRef(false);

  useEffect(() => {
    // Vibrate phone while ringing (pattern: wait 0ms, vibrate 800ms, wait 600ms, repeat)
    Vibration.vibrate([0, 800, 600, 800, 600], true);
    return () => {
      Vibration.cancel();
    };
  }, []);

  const dismiss = useCallback(() => {
    Vibration.cancel();
    if (requestId) incomingCallNative.cancel(requestId);
    if (settled.current) return;
    settled.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/calls/private-calls');
  }, [requestId, router]);

  const accept = useCallback(async () => {
    if (settled.current || !requestId) return;
    Vibration.cancel();
    incomingCallNative.cancel(requestId);
    setBusy('accept');
    const res = await privateCallApi.acceptRequest(requestId);
    if (res.success) {
      settled.current = true;
      router.replace({
        pathname: '/(app)/(modals)/private-call-room',
        params: {
          connection: JSON.stringify(res.data),
          fanName,
          ratePerMin: String(pricePerMinute),
        },
      });
    } else {
      showToast(res.error, 'error');
      if (
        res.code === 'INSUFFICIENT_BALANCE' ||
        res.error.toLowerCase().includes('coins') ||
        res.error.toLowerCase().includes('balance')
      ) {
        dismiss();
        return;
      }
      setBusy(null);
    }
  }, [requestId, router, fanName, pricePerMinute, dismiss]);

  const reject = useCallback(async () => {
    if (settled.current || !requestId) return;
    Vibration.cancel();
    incomingCallNative.cancel(requestId);
    setBusy('reject');
    await privateCallApi.rejectRequest(requestId, 'Not available right now');
    dismiss();
  }, [requestId, dismiss]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setTimeout(dismiss, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [dismiss]);

  // Opened from the incoming-call notification's Accept / Decline: run that
  // action once on mount (same code path as tapping the buttons).
  const autoHandled = useRef(false);
  useEffect(() => {
    if (autoHandled.current || !requestId) return;
    if (params.auto === 'accept') {
      autoHandled.current = true;
      void accept();
    } else if (params.auto === 'reject') {
      autoHandled.current = true;
      void reject();
    }
  }, [params.auto, requestId, accept, reject]);

  const urgent = remaining <= URGENT_SEC;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Feather name="phone-incoming" size={rf(26)} color={colors.pink} />
        </View>
        <Text variant="h2" color="textPrimary" align="center" style={styles.title}>
          Incoming private call
        </Text>

        <Avatar initials={fanName.slice(0, 1).toUpperCase()} size="lg" />
        <Text variant="h3" color="textPrimary" align="center">{fanName}</Text>

        {message ? (
          <Text variant="bodySm" color="textSecondary" align="center" style={styles.message}>
            &ldquo;{message}&rdquo;
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Feather name="zap" size={rf(13)} color={colors.gold} />
          <Text variant="bodySm" color="textPrimary" align="center">
            {initialCharge} coins for the first 5 minutes
            <Text variant="bodySm" color="textMuted"> ({pricePerMinute}/min after)</Text>
          </Text>
        </View>

        <Text variant="bodyLg" color={urgent ? 'danger' : 'textMuted'} style={styles.countdown}>
          Auto-declines in {remaining}s
        </Text>

        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.reject]} onPress={reject} disabled={busy !== null}>
            {busy === 'reject' ? <ActivityIndicator size="small" color={colors.onError} /> : (
              <>
                <Feather name="x" size={rf(16)} color={colors.onError} />
                <Text variant="bodyLg" color="onError" style={styles.btnText}>Reject</Text>
              </>
            )}
          </Pressable>
          <Pressable style={[styles.btn, styles.accept]} onPress={accept} disabled={busy !== null}>
            {busy === 'accept' ? <ActivityIndicator size="small" color={colors.white} /> : (
              <>
                <Feather name="check" size={rf(16)} color={colors.white} />
                <Text variant="bodyLg" color="white" style={styles.btnText}>Accept</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.hero,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: wp(16),
    height: wp(16),
    borderRadius: radius.full,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { fontFamily: fontFamily.extrabold },
  message: { fontStyle: 'italic', marginTop: 2 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  countdown: { marginTop: spacing.xs, fontFamily: fontFamily.bold },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignSelf: 'stretch' },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 52, borderRadius: radius.pill },
  reject: { backgroundColor: colors.error },
  accept: { backgroundColor: colors.success },
  btnText: { fontFamily: fontFamily.extrabold },
});

export default IncomingCallRequestScreen;
