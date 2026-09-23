/**
 * B7 sanity check — proves the harness itself works before any real test
 * writing starts:
 *   1. Env vars are read through REAL source code (constants/app.ts), not
 *      re-implemented in the test.
 *   2. The native module mocks registered in jest.setup.ts actually load
 *      (storage, Agora, SignalR) and behave like their real counterparts
 *      enough for the modules that depend on them to run.
 *   3. test-utils' renderScreen mounts a real app component through the
 *      real provider stack without throwing.
 *
 * NOTE on scope: only a subset of `src/` has been staged into this sandbox
 * so far (see TEST_PLAN.md's file-by-file audit for what's confirmed vs.
 * pending). The render check below therefore targets a real, currently-
 * available leaf component (LucideIcon) rather than a full routed screen —
 * once every screen's dependency chain is staged in Part D/E, each screen
 * gets its own renderScreen-based test exercising this same mechanism.
 *
 * NOTE on require() vs import: the env-var tests below need a fresh module
 * instance per case (constants/app.ts reads `process.env` once, at module
 * evaluation time), which means `jest.resetModules()` + a synchronous
 * `require()` — this project's babel/CommonJS jest transform does not
 * support dynamic `import()` at runtime without `--experimental-vm-modules`,
 * so `require()` is the correct tool here, not a shortcut.
 */
import { LucideIcon } from '@components/ui/LucideIcon';
import { isAgoraAvailable } from '@services/agora/agoraEngine';
import { pushNotifications } from '@services/push/pushNotifications';
import { mmkvStorage, secureStorage } from '@services/storage';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { render } from '@testing-library/react-native';

import { mockHubConnection, mockSecureStoreState } from '../../jest.setup';
import { renderScreen } from '../../test-utils/renderScreen';

describe('B7 sanity — environment variables read through real source code', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    delete process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
    delete process.env.EXPO_PUBLIC_ALLOW_INSECURE;
  });

  it('falls back to the app.json extra.apiBaseUrl when EXPO_PUBLIC_API_BASE_URL is unset', () => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    delete process.env.EXPO_PUBLIC_API_TIMEOUT_MS;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { API_CONFIG } = require('@constants/app');

    // jest.setup.ts's expo-constants mock mirrors app.json's real `extra` block.
    expect(API_CONFIG.baseUrl).toBe('https://artist-api.mitro.live');
    expect(API_CONFIG.timeoutMs).toBe(20000);
  });

  it('EXPO_PUBLIC_API_BASE_URL overrides the app.json fallback, exactly as the real precedence comment describes', () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://staging.example.com';
    process.env.EXPO_PUBLIC_API_TIMEOUT_MS = '5000';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { API_CONFIG } = require('@constants/app');

    expect(API_CONFIG.baseUrl).toBe('https://staging.example.com');
    expect(API_CONFIG.timeoutMs).toBe(5000);
  });

  it('ALLOW_INSECURE_HTTP is false unless EXPO_PUBLIC_ALLOW_INSECURE is exactly "true"', () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_ALLOW_INSECURE = 'yes';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let mod = require('@constants/app');
    expect(mod.ALLOW_INSECURE_HTTP).toBe(false);

    jest.resetModules();
    process.env.EXPO_PUBLIC_ALLOW_INSECURE = 'true';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('@constants/app');
    expect(mod.ALLOW_INSECURE_HTTP).toBe(true);
  });
});

describe('B7 sanity — native module mocks load and behave like the real thing', () => {
  it('mmkvStorage (AsyncStorage-backed) round-trips a value', async () => {
    await mmkvStorage.setString('sanity-key', 'sanity-value');
    await expect(mmkvStorage.getString('sanity-key')).resolves.toBe('sanity-value');
  });

  it('secureStorage (expo-secure-store mock) round-trips a value via the exported in-memory map', async () => {
    await secureStorage.set('sanity-token', 'abc123');
    expect(mockSecureStoreState.get('sanity-token')).toBe('abc123');
    await expect(secureStorage.get('sanity-token')).resolves.toBe('abc123');
  });

  it('the Agora engine mock is reachable and isAgoraAvailable() reflects it', () => {
    expect(isAgoraAvailable()).toBe(true);
  });

  it('the SignalR HubConnectionBuilder mock builds a connection whose handlers can be triggered', () => {
    const connection = new HubConnectionBuilder()
      .withUrl('https://example.com/hubs/test')
      .withAutomaticReconnect()
      .configureLogging(0)
      .build();

    expect(connection).toBe(mockHubConnection);

    const received: unknown[] = [];
    connection.on('TestEvent', (payload: unknown) => received.push(payload));
    mockHubConnection.trigger('TestEvent', { ok: true });

    expect(received).toEqual([{ ok: true }]);
  });

  it('pushNotifications loads without throwing and no-ops setupListeners() outside login', () => {
    expect(() => pushNotifications.setupListeners()).not.toThrow();
  });
});

describe('B7 sanity — test-utils renders a real app component through the real provider stack', () => {
  it('renders LucideIcon (a real, unmodified src/ component) without throwing', () => {
    const { toJSON } = renderScreen(<LucideIcon name="check" color="#FFFFFF" />);
    expect(toJSON()).not.toBeNull();
  });

  it('plain RNTL render (no custom providers) still works, proving the mock chain does not require renderScreen to function', () => {
    const { toJSON } = render(<LucideIcon name="x" color="#000000" size={16} />);
    expect(toJSON()).not.toBeNull();
  });
});
