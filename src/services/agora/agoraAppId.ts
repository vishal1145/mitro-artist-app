import { AGORA_APP_ID } from '@constants/app';
import { configApi } from '@services/api/configApi';
import { mmkvStorage } from '@services/storage';
import { logger } from '@utils/logger';

/**
 * Where the Agora App ID comes from.
 *
 * The backend owns it (app_setting -> `GET /api/artist/config`), exactly as
 * the artist web does in `agoraClientService`. It is cached in memory for the
 * synchronous call sites that initialise the RTC engine, and mirrored to
 * device storage so a cold start already has it before the network answers.
 *
 * `EXPO_PUBLIC_AGORA_APP_ID` stays as the last-resort fallback: the very
 * first launch on a fresh install, or local dev with no backend running.
 */
const STORAGE_KEY = 'mitro.artist.agoraAppId';

let cached: string | null = null;

/** Read the last known value from device storage into memory. Call at boot. */
export async function primeAgoraAppId(): Promise<void> {
  if (cached) return;
  const stored = await mmkvStorage.getString(STORAGE_KEY);
  if (stored) cached = stored;
}

/**
 * Fetch and cache the current value. Fire-and-forget at boot and again after
 * login — never blocks a render, and a failure just leaves the last known
 * value (or the env fallback) in place.
 */
export async function loadAgoraAppId(): Promise<void> {
  const result = await configApi.getArtistConfig();
  if (!result.success) {
    logger.warn('Agora App ID not loaded from /api/artist/config', {
      error: result.error,
    });
    return;
  }
  const appId = result.data.agoraAppId;
  if (!appId) return;
  cached = appId;
  await mmkvStorage.setString(STORAGE_KEY, appId);
}

/**
 * The App ID to initialise the engine with. Synchronous, because every
 * join/publish call site already assumes one is available.
 */
export function getAgoraAppId(): string {
  if (cached) return cached;
  if (!AGORA_APP_ID) {
    logger.error(
      'Agora App ID unavailable — /api/artist/config has not loaded and EXPO_PUBLIC_AGORA_APP_ID is unset',
    );
  }
  return AGORA_APP_ID;
}
