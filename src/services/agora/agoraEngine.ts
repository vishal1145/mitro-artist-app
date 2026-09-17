import { PermissionsAndroid, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { getAgoraAppId } from './agoraAppId';

/**
 * Artist-side Agora engine. Unlike the fan app (which mostly joins as an
 * audience member), the artist is the PUBLISHER: they broadcast their own
 * camera + mic to viewers (live broadcast, group call host) or into a 1:1
 * private call. Camera/mic are dangerous Android runtime permissions, so
 * `app.json` declaring them only lets the OS *ask*; we still have to request
 * them at runtime before publishing or the local capture silently no-ops.
 */
export async function requestCallPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    return (
      results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

export interface AgoraHostHandlers {
  /** A viewer / peer started publishing (only relevant for private calls). */
  onRemoteUserJoined?: (uid: number) => void;
  onRemoteUserLeft?: (uid: number) => void;
  onRemoteVideoOn?: (uid: number, on: boolean) => void;
  onRemoteAudioOn?: (uid: number, on: boolean) => void;
  /** Fired once the local publisher has actually joined the channel. */
  onJoinSuccess?: () => void;
  onError?: (message: string) => void;
  onConnectionStateChanged?: (
    state: 'Disconnected' | 'Connecting' | 'Connected' | 'Reconnecting' | 'Failed',
  ) => void;
}

export const AGORA_UNAVAILABLE_MESSAGE =
  'Live video is not available on this device. Chat, reactions, gifts and the fun wheel still work.';

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let rtc: typeof import('react-native-agora') | null | undefined;
let nativeUnavailable = false;

function loadRtc() {
  if (IS_EXPO_GO || nativeUnavailable) return null;
  if (rtc === undefined) {
    try {
      const mod = require('react-native-agora') as typeof import('react-native-agora');
      rtc = typeof mod?.createAgoraRtcEngine === 'function' ? mod : null;
    } catch {
      rtc = null;
    }
  }
  return rtc;
}

export function isAgoraAvailable(): boolean {
  return loadRtc() !== null;
}

let engine: import('react-native-agora').IRtcEngine | null = null;
let currentHandler: import('react-native-agora').IRtcEngineEventHandler | null = null;
let previewStarted = false;

function getEngine() {
  const mod = loadRtc();
  if (!mod) return null;
  if (!engine) {
    try {
      const created = mod.createAgoraRtcEngine();
      created.initialize({ appId: getAgoraAppId() });
      created.setChannelProfile(mod.ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine = created;
    } catch {
      nativeUnavailable = true;
      rtc = null;
      engine = null;
      return null;
    }
  }
  return engine;
}

/**
 * Start local camera/mic capture immediately (before joinChannel) so the
 * host's own preview (RtcSurfaceView uid 0) has a live pipeline to bind to
 * the instant the screen mounts. Safe to call repeatedly.
 */
export function startLocalPreview() {
  if (previewStarted) return;
  const mod = loadRtc();
  const eng = mod ? getEngine() : null;
  if (!mod || !eng) return;
  try {
    eng.startPreview();
    eng.enableVideo();
    eng.enableLocalVideo(true);
    eng.enableLocalAudio(true);
    previewStarted = true;
  } catch {
    // joinAsHost retries this setup; this is just an early head start.
  }
}

function resetPreviewState() {
  previewStarted = false;
}

function attachHandler(
  eng: import('react-native-agora').IRtcEngine,
  mod: typeof import('react-native-agora'),
  handlers: AgoraHostHandlers,
) {
  const { RemoteAudioState, RemoteVideoState, ConnectionStateType } = mod;
  const CONNECTION_LABEL: Record<
    number,
    'Disconnected' | 'Connecting' | 'Connected' | 'Reconnecting' | 'Failed'
  > = {
    [ConnectionStateType.ConnectionStateDisconnected]: 'Disconnected',
    [ConnectionStateType.ConnectionStateConnecting]: 'Connecting',
    [ConnectionStateType.ConnectionStateConnected]: 'Connected',
    [ConnectionStateType.ConnectionStateReconnecting]: 'Reconnecting',
    [ConnectionStateType.ConnectionStateFailed]: 'Failed',
  };

  const handler: import('react-native-agora').IRtcEngineEventHandler = {
    onJoinChannelSuccess: () => {
      handlers.onJoinSuccess?.();
    },
    onUserJoined: (_c, remoteUid) => handlers.onRemoteUserJoined?.(remoteUid),
    onUserOffline: (_c, remoteUid) => handlers.onRemoteUserLeft?.(remoteUid),
    onRemoteVideoStateChanged: (_c, remoteUid, state) => {
      // Frozen (a network stall) still counts as "on" — only Stopped/Failed
      // means the remote actually turned their camera off.
      const on =
        state !== RemoteVideoState.RemoteVideoStateStopped &&
        state !== RemoteVideoState.RemoteVideoStateFailed;
      handlers.onRemoteVideoOn?.(remoteUid, on);
    },
    onRemoteAudioStateChanged: (_c, remoteUid, state) => {
      const on =
        state !== RemoteAudioState.RemoteAudioStateStopped &&
        state !== RemoteAudioState.RemoteAudioStateFailed;
      handlers.onRemoteAudioOn?.(remoteUid, on);
    },
    onConnectionStateChanged: (_c, state) => {
      const label = CONNECTION_LABEL[state];
      if (label) handlers.onConnectionStateChanged?.(label);
    },
    onError: (err, msg) => handlers.onError?.(msg || `Agora error ${err}`),
  };

  if (currentHandler) {
    try {
      eng.unregisterEventHandler(currentHandler);
    } catch {
      // no-op
    }
  }
  currentHandler = handler;
  eng.registerEventHandler(handler);
}

/**
 * Join as the HOST of a live broadcast or group call — broadcaster role in a
 * LiveBroadcasting channel, publishing camera + mic. Viewers join the same
 * channel as audience (fan app).
 */
export function joinAsHost(
  channelName: string,
  uid: number,
  token: string,
  handlers: AgoraHostHandlers,
) {
  const mod = loadRtc();
  const eng = mod ? getEngine() : null;
  if (!mod || !eng) {
    setTimeout(() => handlers.onError?.(AGORA_UNAVAILABLE_MESSAGE), 0);
    return;
  }
  if (!getAgoraAppId()) {
    setTimeout(() => handlers.onError?.('Live video is not available right now. Please try again later.'), 0);
    return;
  }
  try {
    attachHandler(eng, mod, handlers);
    const { ClientRoleType, ChannelProfileType } = mod;
    startLocalPreview();
    eng.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    const joinResult = eng.joinChannel(token, channelName, uid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      autoSubscribeAudio: true,
      autoSubscribeVideo: true,
      publishCameraTrack: true,
      publishMicrophoneTrack: true,
    });
    if (joinResult !== 0) {
      setTimeout(() => handlers.onError?.(`Couldn't go live (code ${joinResult}). Please try again.`), 0);
    }
  } catch {
    nativeUnavailable = true;
    rtc = null;
    engine = null;
    currentHandler = null;
    setTimeout(() => handlers.onError?.(AGORA_UNAVAILABLE_MESSAGE), 0);
  }
}

/**
 * Symmetric 1:1 private call — both sides publish and subscribe in a
 * Communication-profile channel.
 */
export function joinPrivateCallChannel(
  channelName: string,
  uid: number,
  token: string,
  handlers: AgoraHostHandlers,
) {
  const mod = loadRtc();
  const eng = mod ? getEngine() : null;
  if (!mod || !eng) {
    setTimeout(() => handlers.onError?.(AGORA_UNAVAILABLE_MESSAGE), 0);
    return;
  }
  if (!getAgoraAppId()) {
    setTimeout(() => handlers.onError?.('Live video is not available right now. Please try again later.'), 0);
    return;
  }
  try {
    attachHandler(eng, mod, handlers);
    const { ChannelProfileType } = mod;
    startLocalPreview();
    // Communication profile: every participant always publishes/subscribes —
    // do NOT set clientRole here or joinChannel can reject with error -2.
    const joinResult = eng.joinChannel(token, channelName, uid, {
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
      autoSubscribeAudio: true,
      autoSubscribeVideo: true,
      publishCameraTrack: true,
      publishMicrophoneTrack: true,
    });
    if (joinResult !== 0) {
      setTimeout(() => handlers.onError?.(`Couldn't start the call (code ${joinResult}). Please try again.`), 0);
    }
  } catch {
    nativeUnavailable = true;
    rtc = null;
    engine = null;
    currentHandler = null;
    setTimeout(() => handlers.onError?.(AGORA_UNAVAILABLE_MESSAGE), 0);
  }
}

export function setLocalAudioEnabled(enabled: boolean) {
  if (!engine) return;
  try {
    engine.muteLocalAudioStream(!enabled);
  } catch {
    // no-op
  }
}

export function setLocalVideoEnabled(enabled: boolean) {
  if (!engine) return;
  try {
    engine.muteLocalVideoStream(!enabled);
    engine.enableLocalVideo(enabled);
  } catch {
    // no-op
  }
}

export function switchCamera() {
  if (!engine) return;
  try {
    engine.switchCamera();
  } catch {
    // no-op
  }
}

export function leaveChannel() {
  resetPreviewState();
  if (!engine) return;
  try {
    engine.stopPreview();
    engine.leaveChannel();
  } catch {
    // no-op
  }
}

export function destroyAgoraEngine() {
  resetPreviewState();
  if (!engine) return;
  try {
    if (currentHandler) {
      engine.unregisterEventHandler(currentHandler);
      currentHandler = null;
    }
    engine.leaveChannel();
    engine.release();
  } catch {
    // no-op
  } finally {
    engine = null;
  }
}
