/**
 * Global Jest setup for Mitro Artist App.
 *
 * Mocks every native module the app depends on (see package.json + the real
 * imports found while auditing the source — TEST_PLAN.md §B4 lists the
 * confirmation source for each). Test files should NOT re-mock these unless
 * they need to override a specific return value for one test — do that with
 * `jest.spyOn`/`mockReturnValueOnce` on the already-mocked module, imported
 * from the real module path (Jest resolves it to the mock automatically).
 *
 * `afterEach` resets every mock and the two in-memory storage backends so
 * tests never leak state into one another.
 *
 * @testing-library/react-native v13 ships its Jest matchers built into the
 * main entry point (no separate `/extend-expect` import needed, unlike v12
 * and earlier) — nothing to import here for that.
 */

// ---------------------------------------------------------------------------
// react-native-gesture-handler / react-native-reanimated / worklets
// ---------------------------------------------------------------------------
// Official jest setup files — must run before anything imports RN.
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  // The mock's `call` immediately no-ops; the real module warns about this,
  // which is harmless in tests.
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-worklets', () => ({
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
  createWorkletRuntime: jest.fn(),
}));

// ---------------------------------------------------------------------------
// react-native-safe-area-context / react-native-screens
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    SafeAreaProvider: actual.SafeAreaProvider,
    SafeAreaView: actual.SafeAreaView,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

jest.mock('react-native-screens', () => {
  const actual = jest.requireActual('react-native-screens');
  return { ...actual, enableScreens: jest.fn() };
});

// ---------------------------------------------------------------------------
// expo-router — navigation. Every screen test overrides individual return
// values with `mockRouter.push` / `(useLocalSearchParams as jest.Mock)...`
// rather than re-mocking the module.
// ---------------------------------------------------------------------------
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
  navigate: jest.fn(),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
};

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: jest.fn(() => ({})),
    useGlobalSearchParams: jest.fn(() => ({})),
    useSegments: jest.fn(() => []),
    useFocusEffect: (effect: () => void | (() => void)) => {
      // Run the effect synchronously once, matching a mounted-and-focused
      // screen — tests that specifically exercise blur/refocus timing
      // override this with their own jest.mock per-file.
      React.useEffect(effect, []); // eslint-disable-line react-hooks/exhaustive-deps
    },
    useNavigation: () => ({
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      goBack: mockRouter.back,
    }),
    useRootNavigationState: () => ({ key: 'root' }),
    Link: ({ children }: { children: React.ReactNode }) => children,
    Stack: Object.assign(
      ({ children }: { children: React.ReactNode }) => children,
      { Screen: () => null },
    ),
    Tabs: Object.assign(
      ({ children }: { children: React.ReactNode }) => children,
      { Screen: () => null },
    ),
    Redirect: () => null,
    SplashScreen: { preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() },
  };
});

// ---------------------------------------------------------------------------
// AsyncStorage — backs @services/storage/mmkvStorage.ts. Official mock.
// ---------------------------------------------------------------------------
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// ---------------------------------------------------------------------------
// expo-secure-store — backs @services/storage/secureStorage.ts. In-memory
// Map so it round-trips like the real store; exported so tests can seed/read
// it directly (e.g. "assert the access token was actually persisted").
// ---------------------------------------------------------------------------
export const mockSecureStoreState = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreState.set(key, value);
  }),
  getItemAsync: jest.fn(async (key: string) => mockSecureStoreState.get(key) ?? null),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreState.delete(key);
  }),
}));

// ---------------------------------------------------------------------------
// expo-constants — Constants.expoConfig.extra drives API_CONFIG/useMock.
// Mirrors app.json's real `extra` block so constants/app.ts reads through
// real code, not a stand-in value. A test that wants a different `extra`
// value overrides `Constants.expoConfig` for that one test.
// ---------------------------------------------------------------------------
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiBaseUrl: 'https://artist-api.mitro.live',
        apiTimeoutMs: 20000,
        useMock: false,
        router: { origin: false },
      },
    },
    executionEnvironment: 'bare',
  },
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
}));

// ---------------------------------------------------------------------------
// expo-font / expo-splash-screen / expo-status-bar / expo-system-ui
// ---------------------------------------------------------------------------
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
  loadAsync: jest.fn(async () => {}),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
  setOptions: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(async () => {}),
}));

// ---------------------------------------------------------------------------
// expo-linear-gradient / expo-blur / expo-image / react-native-svg
// Rendered as plain View/Image stand-ins — enough for RNTL text/role queries,
// no native rendering required.
// ---------------------------------------------------------------------------
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return { Image, ImageBackground: Image };
});

// ---------------------------------------------------------------------------
// expo-image-picker — permission + picker result mocks. Default: granted +
// user cancels. Tests override the return value per case (granted/denied/
// blocked, picked/cancelled).
// ---------------------------------------------------------------------------
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
    granted: true,
    canAskAgain: true,
  })),
  getMediaLibraryPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
    granted: true,
    canAskAgain: true,
  })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  MediaTypeOptions: { Images: 'Images' },
}));

// ---------------------------------------------------------------------------
// expo-clipboard
// ---------------------------------------------------------------------------
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
  getStringAsync: jest.fn(async () => ''),
}));

// ---------------------------------------------------------------------------
// expo-haptics / expo-device / expo-local-authentication / expo-file-system /
// expo-linking — declared dependencies; mocked defensively even where no
// staged file imports them yet, so an as-yet-unaudited screen doesn't crash
// the whole suite. TEST_PLAN.md's Part D pass confirms per-file which of
// these are actually reachable and prunes any that turn out unused.
// ---------------------------------------------------------------------------
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'Test Device',
  osName: 'Android',
  osVersion: '14',
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => false),
  isEnrolledAsync: jest.fn(async () => false),
  authenticateAsync: jest.fn(async () => ({ success: false })),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock-documents/',
  cacheDirectory: 'file:///mock-cache/',
  getInfoAsync: jest.fn(async () => ({ exists: true, isDirectory: false, size: 0 })),
  readAsStringAsync: jest.fn(async () => ''),
  writeAsStringAsync: jest.fn(async () => {}),
  deleteAsync: jest.fn(async () => {}),
  uploadAsync: jest.fn(async () => ({ status: 200, body: '{}' })),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `mitroartist://${path}`),
  openURL: jest.fn(async () => {}),
  openSettings: jest.fn(async () => {}),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(async () => null),
}));

// expo-keep-awake is NOT a declared dependency of this app (confirmed against
// package.json) — no mock is registered for it. TEST_PLAN.md flags this as a
// ⚠️/🐞 item: the "screen stays awake during a live broadcast/call" mobile
// requirement has no traced implementation yet. Do not add a mock here to
// paper over that; a real import will fail loudly until it's resolved.

// ---------------------------------------------------------------------------
// @react-native-firebase/app + /messaging — push notifications.
// Exported handle lets tests fire foreground/background/quit-tap events.
// ---------------------------------------------------------------------------
export const mockMessagingHandlers: {
  onMessage: ((msg: unknown) => void) | null;
  onNotificationOpenedApp: ((msg: unknown) => void) | null;
  onTokenRefresh: ((token: string) => void) | null;
} = { onMessage: null, onNotificationOpenedApp: null, onTokenRefresh: null };

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => 'mock-fcm-token'),
  requestPermission: jest.fn(async () => 1 /* AuthorizationStatus.AUTHORIZED */),
  getInitialNotification: jest.fn(async () => null),
  onMessage: jest.fn((_messaging: unknown, handler: (msg: unknown) => void) => {
    mockMessagingHandlers.onMessage = handler;
    return jest.fn();
  }),
  onNotificationOpenedApp: jest.fn(
    (_messaging: unknown, handler: (msg: unknown) => void) => {
      mockMessagingHandlers.onNotificationOpenedApp = handler;
      return jest.fn();
    },
  ),
  onTokenRefresh: jest.fn((_messaging: unknown, handler: (token: string) => void) => {
    mockMessagingHandlers.onTokenRefresh = handler;
    return jest.fn();
  }),
  setBackgroundMessageHandler: jest.fn(),
  AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
}));

// ---------------------------------------------------------------------------
// react-native-agora — lazily `require()`d by @services/agora/agoraEngine.ts,
// so the mock must expose `createAgoraRtcEngine` and the engine instance it
// returns needs every method agoraEngine.ts calls. `mockAgoraEngine` is
// exported so a test can simulate `onJoinChannelSuccess`, `onUserJoined`,
// `onError`, etc. by calling the handler object the module under test
// registered via `registerEventHandler`.
// ---------------------------------------------------------------------------
export const mockAgoraEngine = {
  initialize: jest.fn(),
  setChannelProfile: jest.fn(),
  registerEventHandler: jest.fn(),
  unregisterEventHandler: jest.fn(),
  startPreview: jest.fn(),
  stopPreview: jest.fn(),
  enableVideo: jest.fn(),
  enableLocalVideo: jest.fn(),
  enableLocalAudio: jest.fn(),
  setClientRole: jest.fn(),
  joinChannel: jest.fn(() => 0),
  leaveChannel: jest.fn(),
  release: jest.fn(),
  muteLocalAudioStream: jest.fn(),
  muteLocalVideoStream: jest.fn(),
  switchCamera: jest.fn(),
};

jest.mock(
  'react-native-agora',
  () => ({
    createAgoraRtcEngine: jest.fn(() => mockAgoraEngine),
    ChannelProfileType: {
      ChannelProfileLiveBroadcasting: 1,
      ChannelProfileCommunication: 0,
    },
    ClientRoleType: { ClientRoleBroadcaster: 1, ClientRoleAudience: 2 },
    ConnectionStateType: {
      ConnectionStateDisconnected: 1,
      ConnectionStateConnecting: 2,
      ConnectionStateConnected: 3,
      ConnectionStateReconnecting: 4,
      ConnectionStateFailed: 5,
    },
    RemoteVideoState: { RemoteVideoStateStopped: 0, RemoteVideoStateFailed: 4 },
    RemoteAudioState: { RemoteAudioStateStopped: 0, RemoteAudioStateFailed: 4 },
  }),
  { virtual: false },
);

// ---------------------------------------------------------------------------
// @microsoft/signalr — every hub module builds its own HubConnection via
// HubConnectionBuilder, so the mock builder returns one shared fake
// connection object per `.build()` call. `mockHubConnection` exposes the
// handler map (`.on(event, cb)` registrations) so a test can do
// `mockHubConnection.trigger('ActivityAdded', payload)` to simulate a
// server push, and `.state` to simulate connected/disconnected.
// ---------------------------------------------------------------------------
function createMockHubConnection() {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const reconnectedHandlers: Array<() => void> = [];
  const reconnectingHandlers: Array<() => void> = [];
  const closeHandlers: Array<() => void> = [];
  return {
    state: 'Disconnected',
    start: jest.fn(async function (this: { state: string }) {
      this.state = 'Connected';
    }),
    stop: jest.fn(async function (this: { state: string }) {
      this.state = 'Disconnected';
    }),
    invoke: jest.fn(async () => undefined),
    on: jest.fn((event: string, cb: (...args: unknown[]) => void) => {
      handlers.set(event, cb);
    }),
    off: jest.fn((event: string) => {
      handlers.delete(event);
    }),
    onreconnected: jest.fn((cb: () => void) => reconnectedHandlers.push(cb)),
    onreconnecting: jest.fn((cb: () => void) => reconnectingHandlers.push(cb)),
    onclose: jest.fn((cb: () => void) => closeHandlers.push(cb)),
    // Test helpers (not part of the real HubConnection surface):
    trigger: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args),
    triggerReconnected: () => reconnectedHandlers.forEach((cb) => cb()),
    triggerReconnecting: () => reconnectingHandlers.forEach((cb) => cb()),
    triggerClose: () => closeHandlers.forEach((cb) => cb()),
  };
}

export let mockHubConnection = createMockHubConnection();

jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn().mockImplementation(() => ({
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    configureLogging: jest.fn().mockReturnThis(),
    build: jest.fn(() => mockHubConnection),
  })),
  HubConnectionState: {
    Disconnected: 'Disconnected',
    Connecting: 'Connecting',
    Connected: 'Connected',
    Disconnecting: 'Disconnecting',
    Reconnecting: 'Reconnecting',
  },
  LogLevel: { Warning: 2, Error: 3, None: 6 },
}));

// ---------------------------------------------------------------------------
// react-native-toast-message
// ---------------------------------------------------------------------------
jest.mock('react-native-toast-message', () => {
  const Toast = ({ children }: { children?: import('react').ReactNode }) => children ?? null;
  Toast.show = jest.fn();
  Toast.hide = jest.fn();
  return { __esModule: true, default: Toast };
});

// ---------------------------------------------------------------------------
// @expo-google-fonts/* — the root layout imports ~10 font weights from 3
// packages. Under jest-expo these resolve to numeric font-asset ids; the
// actual value doesn't matter since useFonts itself is mocked above, but the
// imports must resolve without hitting the filesystem.
// ---------------------------------------------------------------------------
jest.mock('@expo-google-fonts/inter', () => ({
  Inter_400Regular: 1,
  Inter_500Medium: 2,
  Inter_600SemiBold: 3,
}));
jest.mock('@expo-google-fonts/jetbrains-mono', () => ({
  JetBrainsMono_500Medium: 4,
  JetBrainsMono_600SemiBold: 5,
}));
jest.mock('@expo-google-fonts/plus-jakarta-sans', () => ({
  PlusJakartaSans_400Regular: 6,
  PlusJakartaSans_500Medium: 7,
  PlusJakartaSans_600SemiBold: 8,
  PlusJakartaSans_700Bold: 9,
  PlusJakartaSans_800ExtraBold: 10,
}));

// ---------------------------------------------------------------------------
// Core RN: AppState / BackHandler / Keyboard / Alert / Platform helpers.
// ---------------------------------------------------------------------------
import { AppState, Alert } from 'react-native';

/** Drive AppState changes in a test: `fireAppStateChange('background')`. */
export const fireAppStateChange = (state: 'active' | 'background' | 'inactive'): void => {
  // @ts-expect-error -- RN's AppState mock exposes this internal emit hook.
  AppState._eventHandlers?.change?.forEach((cb: (s: string) => void) => cb(state));
  const listeners = (AppState.addEventListener as jest.Mock).mock.calls
    .filter(([type]: [string]) => type === 'change')
    .map(([, cb]: [string, (s: string) => void]) => cb);
  listeners.forEach((cb) => cb(state));
};

jest.spyOn(AppState, 'addEventListener');

/**
 * Press a button in the most recent `Alert.alert(...)` call by its visible
 * text, e.g. `pressAlertButton('End broadcast?', 'End')`.
 */
export const pressAlertButton = (title: string, buttonText: string): void => {
  const alertSpy = Alert.alert as jest.Mock;
  const call = [...alertSpy.mock.calls].reverse().find(([t]) => t === title);
  const buttons = call?.[2] as Array<{ text?: string; onPress?: () => void }> | undefined;
  const button = buttons?.find((b) => b.text === buttonText);
  button?.onPress?.();
};

jest.spyOn(Alert, 'alert');

// ---------------------------------------------------------------------------
// Silence known-noisy, non-actionable warnings only. Never swallow a real
// console.error/warn beyond these exact prefixes — a test that trips an
// unlisted warning should fail loudly, not disappear.
// ---------------------------------------------------------------------------
const SILENCED_WARNING_PATTERNS = [
  /Animated: `useNativeDriver`/,
  /new NativeEventEmitter/,
];

const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const message = String(args[0]);
    if (SILENCED_WARNING_PATTERNS.some((pattern) => pattern.test(message))) return;
    originalConsoleError(...args);
  });
  jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const message = String(args[0]);
    if (SILENCED_WARNING_PATTERNS.some((pattern) => pattern.test(message))) return;
    originalConsoleWarn(...args);
  });
});

// ---------------------------------------------------------------------------
// Reset everything between tests so no test can leak state into the next.
// ---------------------------------------------------------------------------
afterEach(() => {
  jest.clearAllMocks();
  mockSecureStoreState.clear();
  mockHubConnection = createMockHubConnection();
  mockMessagingHandlers.onMessage = null;
  mockMessagingHandlers.onNotificationOpenedApp = null;
  mockMessagingHandlers.onTokenRefresh = null;
});
