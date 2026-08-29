import { NOTIFICATIONS } from '@constants/app';
import type {
  NotificationItem,
  RegisterDevicePayload,
  Result,
  UnreadCountResponse,
  UnregisterDevicePayload,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * In-app notifications + FCM device registration.
 *
 * Same `Result<T>` contract as the other services — nothing in here throws.
 * The realtime half (SignalR) lives in @services/realtime/notificationHub;
 * this module is REST only.
 */
export const notificationApi = {
  /** Newest first. Bare array — no envelope. */
  async getNotifications(
    take: number = NOTIFICATIONS.take,
  ): Promise<Result<NotificationItem[]>> {
    try {
      const res = await api.get<NotificationItem[]>(ENDPOINTS.notifications.list, {
        params: { take },
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getUnreadCount(): Promise<Result<UnreadCountResponse>> {
    try {
      const res = await api.get<UnreadCountResponse>(
        ENDPOINTS.notifications.unreadCount,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Marks one notification read. Responds with the fresh unread count. */
  async markRead(id: string): Promise<Result<UnreadCountResponse>> {
    try {
      const res = await api.post<UnreadCountResponse>(ENDPOINTS.notifications.read(id));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async markAllRead(): Promise<Result<UnreadCountResponse>> {
    try {
      const res = await api.post<UnreadCountResponse>(ENDPOINTS.notifications.readAll);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Registers (or refreshes) this device's FCM token for push delivery. */
  async registerDevice(payload: RegisterDevicePayload): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.devices.register, payload);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Best-effort — called on logout so a shared/reset device stops receiving push. */
  async unregisterDevice(payload: UnregisterDevicePayload): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.devices.unregister, payload);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
