import type {
  ArtistConversationSummary,
  PrivateMessageConversationResponse,
  ReplyPrivateMessageResponse,
  Result,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Paid private messages — artist side. Replies are always free. Same
 * `Result<T>` contract as the other services (nothing throws). The realtime
 * half is in @services/realtime/privateMessageHub.
 */
export const privateMessageApi = {
  /**
   * Turn paid private messages on/off, and set what a fan pays per message.
   *
   * Mirrors the artist web's `privateMessageService.setSettings` exactly: the
   * price key is omitted entirely when the artist left the field blank, so the
   * backend keeps whatever price it already had.
   */
  async setSettings(
    acceptsPrivateMessages: boolean,
    pricePerMessage?: number,
  ): Promise<Result<null>> {
    try {
      await api.put(ENDPOINTS.privateMessages.settings, {
        acceptsPrivateMessages,
        ...(pricePerMessage !== undefined ? { pricePerMessage } : {}),
      });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Inbox — one row per fan, most recent first. Bare array. */
  async listConversations(take = 50): Promise<Result<ArtistConversationSummary[]>> {
    try {
      const res = await api.get<ArtistConversationSummary[]>(
        ENDPOINTS.privateMessages.list,
        { params: { take } },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** The thread with one fan. */
  async getConversation(
    userId: string,
    page = 1,
    pageSize = 50,
  ): Promise<Result<PrivateMessageConversationResponse>> {
    try {
      const res = await api.get<PrivateMessageConversationResponse>(
        ENDPOINTS.privateMessages.conversation(userId),
        { params: { page, pageSize } },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Free artist reply. `replyToMessageId` threads it under a quoted message. */
  async reply(
    userId: string,
    messageText: string,
    replyToMessageId?: string | null,
  ): Promise<Result<ReplyPrivateMessageResponse>> {
    try {
      const res = await api.post<ReplyPrivateMessageResponse>(
        ENDPOINTS.privateMessages.reply(userId),
        { messageText, replyToMessageId: replyToMessageId ?? null },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Edit the artist's own reply — only while the fan hasn't read it. */
  async editMessage(messageId: string, messageText: string): Promise<Result<null>> {
    try {
      await api.put(ENDPOINTS.privateMessages.message(messageId), { messageText });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Soft-delete the artist's own reply — only while the fan hasn't read it. */
  async deleteMessage(messageId: string): Promise<Result<null>> {
    try {
      await api.delete(ENDPOINTS.privateMessages.message(messageId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Marks the fan's messages in this thread as read. */
  async markRead(userId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.privateMessages.read(userId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
