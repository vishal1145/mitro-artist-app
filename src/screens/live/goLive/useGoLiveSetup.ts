import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { settingsApi } from '@services/api/settingsApi';
import {
  destroyAgoraEngine,
  isAgoraAvailable,
  requestCallPermissions,
  setLocalAudioEnabled,
  setLocalVideoEnabled,
  startLocalPreview,
} from '@services/agora/agoraEngine';
import { activeBroadcastStore } from '@services/broadcast/activeBroadcast';

import type { UseGoLiveSetupResult } from './types';

/**
 * All Go Live pre-flight state: form fields, device-toggle state, the reward
 * menu count, the real camera/mic preview lifecycle (redirect-if-already-
 * broadcasting, permissions + preview start, warm-engine handoff to the live
 * room), and the simulated device-readiness timers.
 */
export const useGoLiveSetup = (): UseGoLiveSetupResult => {
  const router = useRouter();
  const videoAvailable = isAgoraAvailable();

  // Empty by default — the artist fills these in, exactly like the web.
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Music');
  const [description, setDescription] = useState('');
  const [highlightedPrice, setHighlightedPrice] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [ready, setReady] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [activeRewards, setActiveRewards] = useState<number | null>(null);

  const goingToRoomRef = useRef(false);

  // Re-fetch on every focus (not just mount) so a reward added in Settings and
  // then navigated back to reflects the new count immediately.
  useFocusEffect(
    useCallback(() => {
      settingsApi.getRewardMenu().then((res) => {
        if (res.success) setActiveRewards(res.data.filter((r) => r.isActive).length);
      });
    }, []),
  );

  // Start a real local camera/mic preview whenever this tab is focused, so the
  // artist sees their own feed and the on/off toggles actually control the
  // hardware — exactly like the web Go Live screen. Released on blur unless
  // we're handing the warm engine off to the live room.
  useFocusEffect(
    useCallback(() => {
      goingToRoomRef.current = false;
      let cancelled = false;
      (async () => {
        // Already broadcasting → jump straight back into the live room instead
        // of showing a "resume" button (no extra layer).
        const active = await activeBroadcastStore.get();
        if (cancelled) return;
        if (active) {
          goingToRoomRef.current = true;
          router.replace('/(app)/(modals)/live-broadcast-room');
          return;
        }
        await requestCallPermissions();
        if (cancelled || !videoAvailable) return;
        startLocalPreview();
        setLocalVideoEnabled(cameraOn);
        setLocalAudioEnabled(micOn);
        setReady(true);
        // Remount the surface a beat after the pipeline is up so it binds.
        setVideoKey((k) => k + 1);
        setTimeout(() => !cancelled && setVideoKey((k) => k + 1), 700);
      })();
      return () => {
        cancelled = true;
        if (!goingToRoomRef.current) {
          destroyAgoraEngine();
          setReady(false);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoAvailable]),
  );

  const toggleCamera = () => {
    setCameraOn((v) => {
      const next = !v;
      setLocalVideoEnabled(next);
      if (next) setVideoKey((k) => k + 1);
      return next;
    });
  };
  const toggleMic = () => {
    setMicOn((v) => {
      const next = !v;
      setLocalAudioEnabled(next);
      return next;
    });
  };

  const priceValid = highlightedPrice.trim().length > 0 && Number(highlightedPrice) > 0;
  const canGoLive = title.trim().length > 0 && priceValid;

  const goLive = () => {
    if (!canGoLive) return;
    goingToRoomRef.current = true; // keep the warm camera engine for the room

    router.push({
      pathname: '/(app)/(modals)/live-broadcast-room',
      params: {
        sessionConfig: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          highlightedMessagePrice: highlightedPrice ? Number(highlightedPrice) : undefined,
        }),
      },
    });
  };

  const caption = cameraOn || micOn
    ? `Camera and mic are ${cameraOn && micOn ? 'on' : cameraOn ? 'on (mic off)' : 'on (camera off)'}. You're not visible to anyone yet.`
    : 'Camera and mic are off. Turn them on below when you’re ready to preview.';

  // Mirrors the web's `devicesReady`: a device that's ON is "ready" only once its
  // track has had a beat to acquire; a device that's OFF never blocks. So a fresh
  // ON device shows "Checking your setup…" briefly, then "You're all set".
  const [camReady, setCamReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  useEffect(() => {
    if (!videoAvailable || !cameraOn) {
      setCamReady(false);
      return;
    }
    setCamReady(false);
    const t = setTimeout(() => setCamReady(true), 1400);
    return () => clearTimeout(t);
  }, [cameraOn, videoAvailable]);
  useEffect(() => {
    if (!videoAvailable || !micOn) {
      setMicReady(false);
      return;
    }
    setMicReady(false);
    const t = setTimeout(() => setMicReady(true), 1400);
    return () => clearTimeout(t);
  }, [micOn, videoAvailable]);
  const devicesReady = (!cameraOn || camReady) && (!micOn || micReady);

  return {
    videoAvailable,
    title,
    setTitle,
    category,
    setCategory,
    description,
    setDescription,
    highlightedPrice,
    setHighlightedPrice,
    cameraOn,
    micOn,
    ready,
    videoKey,
    activeRewards,
    toggleCamera,
    toggleMic,
    priceValid,
    canGoLive,
    goLive,
    caption,
    devicesReady,
  };
};
