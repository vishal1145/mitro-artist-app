import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { privateCallApi } from '@services/api/privateCallApi';
import { activePrivateCallStore } from '@services/privateCall/activePrivateCall';
import { profileApi } from '@services/api/profileApi';
import { showToast } from '@utils/toast';
import type {
  PrivateCallHistoryItem,
  PrivateCallRequestItem,
} from '@app-types/privateCall';

import { COUNTDOWN_TICK_MS, HISTORY_PAGE_SIZE, REQUEST_POLL_MS } from './format';
import type { UsePrivateCallsResult } from './types';

/** All private-calls logic. The screen component renders state; it holds none. */
export const usePrivateCalls = (): UsePrivateCallsResult => {
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

  /**
   * Fired by `Screen` once the page itself is scrolled near its bottom. The
   * list is no longer its own scroller, so this is the only paging trigger.
   */
  const handleHistoryEndReached = useCallback(() => {
    void loadMoreHistory();
  }, [loadMoreHistory]);

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

  return {
    acceptsPrivateCalls,
    pricePerMinute,
    setPricePerMinute,
    isSavingSettings,
    isLoadingSettings,
    requests,
    busyRequestId,
    activeCallId,
    history,
    isLoadingHistory,
    isLoadingMoreHistory,
    handleSaveSettings,
    acceptRequest,
    declineRequest,
    handleHistoryEndReached,
  };
};
