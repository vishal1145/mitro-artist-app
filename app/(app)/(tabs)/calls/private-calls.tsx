import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import { privateCallApi } from '@services/api/privateCallApi';
import { activePrivateCallStore } from '@services/privateCall/activePrivateCall';
import { profileApi } from '@services/api/profileApi';
import { showToast } from '@utils/toast';
import type {
  PrivateCallHistoryItem,
  PrivateCallRequestItem,
} from '@app-types/privateCall';
import {
  fontFamily,
  gradientDirection,
  palette,
  webColors,
  webGradients,
} from '@theme';
import { rf } from '@utils/responsive';

/* Timings copied from the web screen (PrivateCallScreen.tsx). The backend
 * auto-expires a pending request 60s after it's created — the tick only drives
 * the countdown label. */
const COUNTDOWN_TICK_MS = 1000;
const REQUEST_POLL_MS = 8000;
const HISTORY_PAGE_SIZE = 20;
/** How close to the bottom (px) the history list must be before the next page loads. */
const HISTORY_SCROLL_THRESHOLD_PX = 48;

const secondsUntil = (iso: string): number =>
  Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));

/**
 * Wall-clock span between accept and end as a compact "1h 5m" / "12m 34s" /
 * "45s". Null when either edge is missing (the call never connected).
 */
const formatCallDuration = (
  acceptedAtUtc: string | null,
  endedAtUtc: string | null,
): string | null => {
  if (!acceptedAtUtc || !endedAtUtc) return null;
  const ms = new Date(endedAtUtc).getTime() - new Date(acceptedAtUtc).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

type HistoryTone = 'ok' | 'warn' | 'bad' | 'neutral';

/**
 * Raw status / end_reason strings aren't meant for display — translate them
 * into a short label plus a tone so History reads at a glance.
 */
const historyStatusMeta = (
  status: string,
  endReason: string | null,
): { label: string; tone: HistoryTone } => {
  if (status === 'failed') return { label: 'Failed', tone: 'bad' };
  if (status === 'cancelled') return { label: 'Cancelled', tone: 'neutral' };
  if (status === 'terminated') {
    return endReason === 'admin_terminated'
      ? { label: 'Ended by admin', tone: 'neutral' }
      : { label: 'Terminated', tone: 'bad' };
  }
  switch (endReason) {
    case 'user_ended':
    case 'artist_ended':
      return { label: 'Ended normally', tone: 'ok' };
    case 'insufficient_balance':
      return { label: 'Low balance', tone: 'warn' };
    case 'user_reconnect_timeout':
    case 'artist_reconnect_timeout':
    case 'both_disconnected':
      return { label: 'Connection dropped', tone: 'warn' };
    case 'join_timeout':
      return { label: 'Never connected', tone: 'bad' };
    case 'technical_failure':
    case 'token_failure':
      return { label: 'Technical issue', tone: 'bad' };
    case 'admin_terminated':
      return { label: 'Ended by admin', tone: 'neutral' };
    case 'platform_ended':
      return { label: 'Ended by platform', tone: 'neutral' };
    default:
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        tone: 'neutral',
      };
  }
};

const TONE_FILL: Record<HistoryTone, string> = {
  ok: webColors.greenPill,
  warn: webColors.goldTone,
  bad: webColors.dangerTone,
  neutral: webColors.chip,
};

const TONE_INK: Record<HistoryTone, string> = {
  ok: webColors.green,
  warn: webColors.gold,
  bad: webColors.danger,
  neutral: webColors.chipText,
};

/** One loading row of the History list — mirrors the web's `.mitro-skel` set. */
const HistorySkeletonRow = () => (
  <View style={styles.historyRow}>
    <Skeleton width={30} height={30} round={10} />
    <View style={styles.historySkelText}>
      <Skeleton width="55%" height={12} round={6} />
      <Skeleton width="75%" height={10} round={6} />
    </View>
    <Skeleton width={54} height={14} round={6} />
  </View>
);

/** Private 1:1 calls — availability switch, incoming requests, and history. */
const PrivateCallsScreen = () => {
  const router = useRouter();

  const [acceptsPrivateCalls, setAcceptsPrivateCalls] = useState(false);
  const [pricePerMinute, setPricePerMinute] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [requests, setRequests] = useState<PrivateCallRequestItem[]>([]);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  /** A call already running — the artist backed out without ending it. */
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const [history, setHistory] = useState<PrivateCallHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  const historyRef = useRef<PrivateCallHistoryItem[]>([]);
  const loadingMoreRef = useRef(false);

  // Countdown re-render tick for the pending-request rows.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), COUNTDOWN_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Availability + price come off the artist profile.
  useEffect(() => {
    let cancelled = false;
    profileApi.getProfile().then((r) => {
      if (cancelled) return;
      if (r.success) {
        setAcceptsPrivateCalls(!!r.data.acceptsPrivateCalls);
        if (typeof r.data.privateShowTokenPerMinute === 'number') {
          setPricePerMinute(String(r.data.privateShowTokenPerMinute));
        }
      }
      setIsLoadingSettings(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * The backend knows whether a call is still running, so ask it rather than
   * trusting only the local record — that is what the web's PrivateCallScreen
   * does. Remember the id so the room can reconnect to it.
   */
  useEffect(() => {
    let cancelled = false;
    privateCallApi.getActive().then((r) => {
      if (cancelled || !r.success) return;
      if (r.data.hasActiveSession && r.data.privateCallId) {
        setActiveCallId(r.data.privateCallId);
        activePrivateCallStore.savePointer(r.data.privateCallId, {
          userId: r.data.userId,
          ratePerMin: r.data.pricePerMinuteSnapshot,
        });
      } else {
        setActiveCallId(null);
        activePrivateCallStore.clear();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshRequests = useCallback(() => {
    privateCallApi.getRequests().then((r) => r.success && setRequests(r.data));
  }, []);

  useEffect(() => {
    refreshRequests();
    const id = setInterval(refreshRequests, REQUEST_POLL_MS);
    return () => clearInterval(id);
  }, [refreshRequests]);

  const refreshHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    const res = await privateCallApi.getHistory(HISTORY_PAGE_SIZE, 0);
    if (res.success) {
      historyRef.current = res.data;
      setHistory(res.data);
      setHasMoreHistory(res.data.length === HISTORY_PAGE_SIZE);
    }
    setIsLoadingHistory(false);
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  /** Appends the next page — fired once the list is scrolled near its bottom. */
  const loadMoreHistory = useCallback(async () => {
    if (isLoadingHistory || loadingMoreRef.current || !hasMoreHistory) return;
    loadingMoreRef.current = true;
    setIsLoadingMoreHistory(true);
    const res = await privateCallApi.getHistory(
      HISTORY_PAGE_SIZE,
      historyRef.current.length,
    );
    if (res.success) {
      historyRef.current = [...historyRef.current, ...res.data];
      setHistory(historyRef.current);
      setHasMoreHistory(res.data.length === HISTORY_PAGE_SIZE);
    }
    setIsLoadingMoreHistory(false);
    loadingMoreRef.current = false;
  }, [hasMoreHistory, isLoadingHistory]);

  const handleHistoryScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      if (
        contentSize.height - contentOffset.y - layoutMeasurement.height <=
        HISTORY_SCROLL_THRESHOLD_PX
      ) {
        loadMoreHistory();
      }
    },
    [loadMoreHistory],
  );

  // Turn 1:1 calls on/off (and save the price). Fans can only send requests
  // while this is ON — same contract as the web.
  const handleSaveSettings = useCallback(async () => {
    const next = !acceptsPrivateCalls;
    const trimmed = pricePerMinute.trim();
    const price = trimmed === '' ? undefined : Number(trimmed);
    if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
      showToast('Enter a price per minute greater than 0.', 'error');
      return;
    }
    setIsSavingSettings(true);
    const res = await privateCallApi.setSettings(next, price);
    if (res.success) {
      setAcceptsPrivateCalls(next);
      showToast('Private call settings updated.', 'success');
    } else {
      showToast(res.error, 'error');
    }
    setIsSavingSettings(false);
  }, [acceptsPrivateCalls, pricePerMinute]);

  const acceptRequest = useCallback(
    async (req: PrivateCallRequestItem) => {
      setBusyRequestId(req.requestId);
      const res = await privateCallApi.acceptRequest(req.requestId);
      if (res.success) {
        setRequests((prev) =>
          prev.filter((p) => p.requestId !== req.requestId),
        );
        router.push({
          pathname: '/(app)/(modals)/private-call-room',
          params: {
            connection: JSON.stringify(res.data),
            fanName: req.userDisplayName,
            ratePerMin: String(req.pricePerMinuteSnapshot),
          },
        });
      } else {
        showToast(res.error, 'error');
      }
      setBusyRequestId(null);
    },
    [router],
  );

  const declineRequest = useCallback(async (req: PrivateCallRequestItem) => {
    setBusyRequestId(req.requestId);
    await privateCallApi.rejectRequest(
      req.requestId,
      'Not available right now',
    );
    setRequests((prev) => prev.filter((p) => p.requestId !== req.requestId));
    setBusyRequestId(null);
  }, []);

  const on = acceptsPrivateCalls;

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
    >
      {/* Header — back button, eyebrow, title */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <LucideIcon
            name="arrow-left"
            size={18}
            color={webColors.textStrong}
          />
        </Pressable>
        <View style={styles.headerCopy}>
          <View style={styles.eyebrow}>
            <LucideIcon name="phone" size={13} color={webColors.pinkLight} />
            <Text style={styles.eyebrowText}>Private Call</Text>
          </View>
          <Text style={styles.h1}>Private Calls</Text>
        </View>
      </View>

      <Text style={styles.pageSub}>
        1:1 paid calls — a fan requests, you accept or reject, then connect for
        a live call.
      </Text>

      {/* A call is still running — the only way back into it. */}
      {activeCallId ? (
        <Pressable
          style={styles.resumeCard}
          onPress={() => router.push('/(app)/(modals)/private-call-room')}
          accessibilityRole="button"
          accessibilityLabel="Rejoin call in progress"
        >
          <View style={styles.resumeDot} />
          <View style={styles.resumeCopy}>
            <Text style={styles.resumeTitle}>Call in progress</Text>
            <Text style={styles.resumeSub}>
              You left without ending it — the fan is still being billed.
            </Text>
          </View>
          <View style={styles.resumeCta}>
            <LucideIcon name="phone" size={14} color={webColors.onGreen} />
            <Text style={styles.resumeCtaText}>Rejoin</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.grid}>
        <View style={styles.mainCol}>
          {/* Accept private calls */}
          <LinearGradient
            colors={on ? webGradients.settingsOn : webGradients.settingsOff}
            start={gradientDirection.diagonal.start}
            end={gradientDirection.diagonal.end}
            style={[
              styles.settingsCard,
              on ? styles.settingsCardOn : styles.settingsCardOff,
            ]}
          >
            <View style={styles.settingsCopy}>
              <View
                style={[styles.settingsIcon, on ? styles.settingsIconOn : null]}
              >
                <LucideIcon
                  name="shield-check"
                  size={18}
                  color={on ? webColors.green : webColors.gold}
                />
              </View>
              <View style={styles.settingsCopyText}>
                <View style={styles.settingsTitleRow}>
                  <Text style={styles.settingsTitle}>Accept private calls</Text>
                  {!isLoadingSettings ? (
                    <View
                      style={[
                        styles.statusPill,
                        on ? styles.statusPillOn : styles.statusPillOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: on ? webColors.green : webColors.white50 },
                        ]}
                      >
                        {on ? 'ON' : 'OFF'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.settingsSub}>
                  Fans can send 1:1 call requests. First 5 minutes are charged
                  upfront.
                </Text>
              </View>
            </View>

            <View style={styles.settingsForm}>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon} pointerEvents="none">
                  <LucideIcon
                    name="coins"
                    size={13}
                    color={webColors.white40}
                  />
                </View>
                <TextInput
                  value={pricePerMinute}
                  onChangeText={setPricePerMinute}
                  placeholder="Price"
                  placeholderTextColor={webColors.white40}
                  keyboardType="number-pad"
                  editable={!isLoadingSettings}
                  style={styles.input}
                  accessibilityLabel="Price per minute"
                />
                <View style={styles.inputSuffix} pointerEvents="none">
                  <Text style={styles.inputSuffixText}>/min</Text>
                </View>
              </View>

              <Pressable
                onPress={handleSaveSettings}
                disabled={isSavingSettings || isLoadingSettings}
                accessibilityRole="button"
                accessibilityLabel={
                  on ? 'Turn off private calls' : 'Turn on private calls'
                }
                style={({ pressed }) => [
                  styles.ctaWrap,
                  pressed ? styles.pressed : null,
                ]}
              >
                <LinearGradient
                  colors={webGradients.greenCta}
                  start={gradientDirection.diagonal.start}
                  end={gradientDirection.diagonal.end}
                  style={[
                    styles.cta,
                    isSavingSettings || isLoadingSettings
                      ? styles.ctaDisabled
                      : null,
                  ]}
                >
                  <Text style={styles.ctaLabel}>
                    {isSavingSettings
                      ? 'Saving...'
                      : on
                        ? 'Turn off'
                        : 'Turn on'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>

          {!isLoadingSettings ? (
            <Text style={styles.priceNote}>
              {`Changing the price only saves when you tap the ${on ? '"Turn off"' : '"Turn on"'} button above.`}
            </Text>
          ) : null}

          {/* Pending requests */}
          <View style={styles.panel}>
            <LinearGradient
              colors={webGradients.panel}
              start={gradientDirection.diagonal.start}
              end={gradientDirection.diagonal.end}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.panelHeader}>
              <LucideIcon name="phone" size={19} color={webColors.textStrong} />
              <Text
                style={styles.panelTitle}
              >{`Pending requests (${requests.length})`}</Text>
            </View>

            <ScrollView
              style={styles.panelList}
              contentContainerStyle={styles.panelListContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {requests.length === 0 && !isLoadingSettings && !on ? (
                <View style={styles.emptyState}>
                  <LucideIcon
                    name="phone-off"
                    size={28}
                    color={webColors.gold}
                  />
                  <Text style={[styles.emptyText, styles.emptyTextOff]}>
                    <Text style={styles.emptyStrong}>
                      Private calls are off.
                    </Text>
                    {
                      ' Turn them on above so fans can start sending you requests.'
                    }
                  </Text>
                </View>
              ) : null}

              {requests.length === 0 && (isLoadingSettings || on) ? (
                <View style={styles.emptyState}>
                  <LucideIcon
                    name="phone"
                    size={28}
                    color={webColors.textSoft}
                  />
                  <Text style={styles.emptyText}>
                    No pending requests right now — they&apos;ll show up here
                    the moment a fan sends one.
                  </Text>
                </View>
              ) : null}

              {requests.map((r) => {
                const secsLeft = secondsUntil(r.expiresAtUtc);
                const busy = busyRequestId === r.requestId;
                return (
                  <View key={r.requestId} style={styles.viewerRow}>
                    <LinearGradient
                      colors={webGradients.avatar}
                      start={gradientDirection.diagonal.start}
                      end={gradientDirection.diagonal.end}
                      style={styles.viewerAvatar}
                    >
                      <LucideIcon
                        name="user"
                        size={16}
                        color={webColors.textStrong}
                      />
                    </LinearGradient>

                    <View style={styles.viewerBody}>
                      <Text style={styles.viewerName} numberOfLines={1}>
                        {r.userDisplayName || 'Guest'}
                      </Text>
                      <View style={styles.viewerStatus}>
                        <Text style={styles.viewerStatusText} numberOfLines={1}>
                          {`${r.message ? `"${r.message}" — ` : ''}${r.initialChargeSnapshot} tokens for 5 min • `}
                        </Text>
                        <LucideIcon
                          name="clock-3"
                          size={12}
                          color={webColors.textSoft}
                        />
                        <Text
                          style={styles.viewerStatusText}
                        >{` ${secsLeft}s left`}</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => acceptRequest(r)}
                      disabled={busy || secsLeft === 0}
                      style={[
                        styles.circleBtn,
                        busy || secsLeft === 0
                          ? styles.circleBtnDisabled
                          : null,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Accept call from ${r.userDisplayName}`}
                    >
                      {busy ? (
                        <ActivityIndicator
                          size="small"
                          color={webColors.textSoft}
                        />
                      ) : (
                        <LucideIcon
                          name="check"
                          size={15}
                          color={webColors.textSoft}
                        />
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => declineRequest(r)}
                      disabled={busy}
                      style={[
                        styles.circleBtn,
                        busy ? styles.circleBtnDisabled : null,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Reject call from ${r.userDisplayName}`}
                    >
                      <LucideIcon
                        name="x"
                        size={15}
                        color={webColors.textSoft}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* History */}
        <View style={styles.sideCard}>
          <LinearGradient
            colors={webGradients.sideCard}
            start={gradientDirection.diagonal.start}
            end={gradientDirection.diagonal.end}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.sideCardHead}>
            <LucideIcon name="history" size={18} color={webColors.textStrong} />
            <Text style={styles.sideCardTitle}>History</Text>
          </View>
          <Text style={styles.sideCardSub}>
            Every past private call, most recent first.
          </Text>

          {isLoadingHistory ? (
            <View style={styles.historyList}>
              {[0, 1, 2, 3].map((i) => (
                <HistorySkeletonRow key={i} />
              ))}
            </View>
          ) : history.length === 0 ? (
            <View style={styles.historyEmpty}>
              <LucideIcon name="phone" size={32} color={webColors.textSoft} />
              <Text style={styles.emptyText}>No past private calls yet.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.historyList}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleHistoryScroll}
            >
              {history.map((item, i) => {
                const meta = historyStatusMeta(item.status, item.endReason);
                const duration = formatCallDuration(
                  item.acceptedAtUtc,
                  item.endedAtUtc,
                );
                const last = i === history.length - 1 && !isLoadingMoreHistory;
                return (
                  <View
                    key={item.privateCallId}
                    style={[
                      styles.historyRow,
                      last ? styles.historyRowLast : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.historyIcon,
                        { backgroundColor: TONE_FILL[meta.tone] },
                      ]}
                    >
                      <LucideIcon
                        name="phone"
                        size={15}
                        color={TONE_INK[meta.tone]}
                      />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {meta.label}
                      </Text>
                      <Text style={styles.historyMeta} numberOfLines={1}>
                        {`${item.acceptedAtUtc ? new Date(item.acceptedAtUtc).toLocaleString() : 'never accepted'}${duration ? ` • ${duration}` : ''}`}
                      </Text>
                    </View>
                    <View style={styles.historyAmount}>
                      <LucideIcon
                        name="coins"
                        size={13}
                        color={webColors.textStrong}
                      />
                      <Text style={styles.historyAmountText}>
                        {item.totalCoinsCharged.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {isLoadingMoreHistory ? (
                <>
                  <HistorySkeletonRow />
                  <HistorySkeletonRow />
                </>
              ) : null}
            </ScrollView>
          )}

          <Text style={styles.historyNote}>
            Per-minute totals aren&apos;t tracked yet — only the flat initial
            charge shows above until per-minute billing ships.
          </Text>
        </View>
      </View>
    </Screen>
  );
};

/* Every value below is the computed style of the matching web element
 * (Mitro.Artist.UI — .gsched-* / .pcall-* / .bcast-* / .broadcast-users-panel)
 * at mobile widths, where `.creator-main` pads the page by 12px and the
 * two-column `.gsched-grid` collapses to one column. */
const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },

  /* --- .gsched-header --- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: webColors.circleBorder,
    backgroundColor: webColors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(11.52),
    lineHeight: rf(14),
    letterSpacing: 0.69,
    textTransform: 'uppercase',
    color: webColors.pinkLight,
  },
  h1: {
    marginTop: 4,
    fontFamily: fontFamily.bold,
    fontSize: rf(22.4),
    lineHeight: rf(25.76),
    color: webColors.textStrong,
  },
  /* .pcall-page-sub — page gap 20 plus its own -10 margin-top. */
  pageSub: {
    marginTop: 10,
    fontFamily: fontFamily.regular,
    fontSize: rf(13.6),
    lineHeight: rf(21.08),
    color: webColors.white50,
  },

  /* --- .gsched-grid / .pcall-main-col --- */
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: webColors.greenBorder,
    borderRadius: 14,
    backgroundColor: webColors.greenPill,
  },
  resumeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: webColors.green,
  },
  resumeCopy: { flex: 1, minWidth: 0, gap: 2 },
  resumeTitle: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(14),
    color: webColors.textStrong,
  },
  resumeSub: {
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
    color: webColors.textSoft,
  },
  resumeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: webColors.green,
  },
  resumeCtaText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12.5),
    color: webColors.onGreen,
  },
  grid: {
    marginTop: 20,
    gap: 20,
  },
  mainCol: {
    gap: 16,
  },

  /* --- .bcast-price-card.pcall-settings-card --- */
  settingsCard: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  settingsCardOn: {
    borderColor: webColors.greenBorder,
  },
  settingsCardOff: {
    borderColor: webColors.cardBorder,
  },
  settingsCopy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    marginTop: 1,
    borderRadius: 16,
    backgroundColor: webColors.goldChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconOn: {
    backgroundColor: webColors.greenChip,
  },
  settingsCopyText: {
    flex: 1,
  },
  settingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  settingsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: rf(15.04),
    lineHeight: rf(18),
    color: webColors.textStrong,
  },
  /* .pcall-status-pill — the web's 1px ring is drawn as a border here. */
  statusPill: {
    marginLeft: 8,
    paddingVertical: 1,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillOn: {
    backgroundColor: webColors.greenPill,
    borderColor: webColors.greenRing,
  },
  statusPillOff: {
    backgroundColor: webColors.offPill,
    borderColor: webColors.offPillRing,
  },
  statusPillText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10.56),
    lineHeight: rf(13),
    letterSpacing: 0.53,
  },
  settingsSub: {
    marginTop: 3,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.48),
    lineHeight: rf(16.85),
    color: webColors.textSoft,
  },

  /* --- .bcast-price-card-form.pcall-settings-form --- */
  settingsForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  /* The web input shrinks to fill the row at phone widths. */
  inputWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    height: 40,
    paddingLeft: 30,
    paddingRight: 38,
    paddingVertical: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: webColors.inputBorder,
    backgroundColor: webColors.inputFill,
    fontFamily: fontFamily.regular,
    fontSize: rf(16),
    color: webColors.textStrong,
    textAlignVertical: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 11,
    zIndex: 1,
  },
  inputSuffix: {
    position: 'absolute',
    right: 11,
    zIndex: 1,
  },
  inputSuffixText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(11.52),
    lineHeight: rf(14),
    color: webColors.white40,
  },
  ctaWrap: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  cta: {
    height: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaLabel: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(16),
    lineHeight: rf(19),
    color: webColors.onGreen,
  },
  pressed: {
    opacity: 0.9,
  },

  /* .gcall-note.pcall-price-note — the web also drops it to 65% opacity. */
  priceNote: {
    marginBottom: 12.5,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.48),
    lineHeight: rf(18.72),
    color: webColors.textSoft,
    opacity: 0.65,
  },

  /* --- .broadcast-users-panel --- */
  panel: {
    height: 240,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    backgroundColor: webColors.panelFill,
    overflow: 'hidden',
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.38,
    shadowRadius: 29,
    elevation: 8,
  },
  panelHeader: {
    height: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: webColors.panelHeader,
  },
  panelTitle: {
    fontFamily: fontFamily.bold,
    fontSize: rf(16),
    lineHeight: rf(19),
    color: webColors.textStrong,
  },
  panelList: {
    flex: 1,
  },
  panelListContent: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
  },

  /* --- .gcall-empty-state.pcall-empty-state --- */
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 14,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: rf(16),
    lineHeight: rf(24.8),
    textAlign: 'center',
    color: webColors.textSoft,
  },
  emptyTextOff: {
    color: webColors.gold,
  },
  emptyStrong: {
    fontFamily: fontFamily.bold,
    color: webColors.textStrong,
  },

  /* --- .bcast-activity-row.bcast-viewer-row --- */
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  viewerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerName: {
    flexShrink: 1,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(13.76),
    lineHeight: rf(19.3),
    color: webColors.textStrong,
  },
  viewerStatus: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  viewerStatusText: {
    fontFamily: fontFamily.regular,
    fontSize: rf(12.16),
    lineHeight: rf(17),
    color: webColors.textSoft,
  },
  circleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: webColors.offPillRing,
    backgroundColor: webColors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnDisabled: {
    opacity: 0.6,
  },

  /* --- .gsched-side-card.pcall-history-card --- */
  sideCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    backgroundColor: webColors.sideCardFill,
    overflow: 'hidden',
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 21,
    elevation: 6,
  },
  sideCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideCardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: rf(15.68),
    lineHeight: rf(19),
    color: webColors.textStrong,
  },
  sideCardSub: {
    marginTop: 4,
    marginBottom: 14,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.16),
    lineHeight: rf(17.02),
    color: webColors.white40,
  },

  /* --- .pcall-history-list / .pcall-history-row --- */
  historyList: {
    maxHeight: 420,
    marginTop: 4,
    paddingRight: 4,
  },
  historyEmpty: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: webColors.hairline,
  },
  historyRowLast: {
    borderBottomWidth: 0,
  },
  historySkelText: {
    flex: 1,
    gap: 7,
  },
  historyIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13.12),
    lineHeight: rf(16),
    textTransform: 'capitalize',
    color: webColors.textStrong,
  },
  historyMeta: {
    fontFamily: fontFamily.regular,
    fontSize: rf(11.52),
    lineHeight: rf(17.86),
    color: webColors.white45,
  },
  historyAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyAmountText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(12.8),
    lineHeight: rf(16),
    color: webColors.textStrong,
  },
  historyNote: {
    marginTop: 14,
    fontFamily: fontFamily.regular,
    fontSize: rf(13.6),
    lineHeight: rf(20.4),
    color: webColors.textSoft,
  },
});

export default PrivateCallsScreen;
