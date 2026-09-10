import type { Result } from '@app-types/api';
import type {
  CreateGroupCallRequest,
  CreateGroupCallResponse,
  GroupCallActivityItem,
  GroupCallConnectionResponse,
  GroupCallParticipant,
} from '@app-types/groupCall';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Group calls — artist (host) side. Same `Result<T>` contract as the other
 * services. Realtime half is in @services/realtime/groupCallHub.
 */
export const groupCallApi = {
  async create(payload: CreateGroupCallRequest): Promise<Result<CreateGroupCallResponse>> {
    try {
      const res = await api.post<CreateGroupCallResponse>(ENDPOINTS.groupCall.create, payload);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Go live — returns the host's Agora channel/uid/token. */
  async start(groupCallId: string): Promise<Result<GroupCallConnectionResponse>> {
    try {
      const res = await api.post<GroupCallConnectionResponse>(ENDPOINTS.groupCall.start(groupCallId));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async confirmConnected(groupCallId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.groupCall.confirmConnected(groupCallId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async cancel(groupCallId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.groupCall.cancel(groupCallId), reason ? { reason } : {});
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async end(groupCallId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.groupCall.end(groupCallId), reason ? { reason } : {});
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getParticipants(groupCallId: string): Promise<Result<GroupCallParticipant[]>> {
    try {
      const res = await api.get<GroupCallParticipant[]>(ENDPOINTS.groupCall.participants(groupCallId));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async approveParticipant(groupCallId: string, userId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.groupCall.approve(groupCallId, userId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async rejectParticipant(groupCallId: string, userId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.groupCall.reject(groupCallId, userId), reason ? { reason } : {});
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async removeParticipant(groupCallId: string, userId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.groupCall.remove(groupCallId, userId), reason ? { reason } : {});
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async muteParticipant(groupCallId: string, userId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.groupCall.mute(groupCallId, userId), reason ? { reason } : {});
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async unmuteParticipant(groupCallId: string, userId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.groupCall.unmute(groupCallId, userId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getActivity(groupCallId: string, take = 100): Promise<Result<GroupCallActivityItem[]>> {
    try {
      const res = await api.get<GroupCallActivityItem[]>(ENDPOINTS.groupCall.activity(groupCallId), {
        params: { take },
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async sendChatMessage(
    groupCallId: string,
    messageText: string,
  ): Promise<Result<{ message: string; id: string; createdAtUtc: string }>> {
    try {
      const res = await api.post<{ message: string; id: string; createdAtUtc: string }>(
        ENDPOINTS.groupCall.chat(groupCallId),
        { messageText },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
