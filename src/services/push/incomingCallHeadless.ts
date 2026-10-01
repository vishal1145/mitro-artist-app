import { SECURE_KEYS } from '@constants';
import { ENDPOINTS, api } from '@services/api';
import { secureStorage } from '@services/storage';
import { logger } from '@utils/logger';

/**
 * Headless JS task "IncomingCallDecline" - started natively when the artist taps
 * Decline on the call notification, possibly with the app fully killed. The
 * normal app bootstrap never ran, so the auth store is empty; read the access
 * token straight from secure storage and call the same reject endpoint the
 * in-app screen uses (privateCallApi.rejectRequest).
 */
export const declineIncomingCall = async (data: { requestId?: string }): Promise<void> => {
  const requestId = data?.requestId;
  if (!requestId) return;

  try {
    const token = await secureStorage.get(SECURE_KEYS.accessToken);
    if (!token) {
      logger.warn('Decline from notification: no signed-in artist');
      return;
    }
    await api.post(
      ENDPOINTS.privateCall.reject(requestId),
      { reason: 'Declined from notification' },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (error) {
    // Best effort - the request auto-expires on the backend after 60s anyway.
    logger.warn('Decline from notification failed', { error: String(error) });
  }
};
