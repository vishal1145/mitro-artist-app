import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { API_CONFIG, SECURE_KEYS } from '@constants/app';
import { queryKeys } from '@constants/queryKeys';
import { queryClient } from '@services/queryClient';
import { secureStorage } from '@services/storage';
import { logger } from '@utils/logger';

/**
 * App-wide listener for fan messages (route: /hubs/private-message).
 *
 * `privateMessageHub` is conversation-scoped and only lives while a chat is
 * open, so a fan's message sent while the artist was on any other screen used
 * to arrive silently. This keeps one standing connection for the signed-in
 * artist, joins their inbox group (`JoinArtistInbox` — the backend reads the
 * artist id from the JWT) and toasts every `PrivateMessageInbox` push.
 *
 * Lifecycle rides auth (see authStore start/stopNotifications). Never throws.
 */

const HUB_URL = `${API_CONFIG.baseUrl}/hubs/private-message`;
const EVENT = 'PrivateMessageInbox';
const PREVIEW_MAX = 80;

export type PrivateMessageInboxPayload = {
  id: string;
  userId: string;
  senderDisplayName?: string | null;
  messageText: string;
  priceCharged?: number;
  createdAtUtc: string;
};

let connection: HubConnection | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
let stopped = true;
/** Fan whose chat is open right now — their messages already show in-thread. */
let openChatUserId: string | null = null;
const seen = new Set<string>();
const listeners = new Set<(p: PrivateMessageInboxPayload) => void>();

const getAccessToken = async (): Promise<string> =>
  (await secureStorage.get(SECURE_KEYS.accessToken)) ?? '';

const joinInbox = async (c: HubConnection) => {
  try {
    await c.invoke('JoinArtistInbox');
  } catch (error) {
    // Older backend without the inbox group — stay quiet, chat still works.
    logger.warn('Private message inbox join failed', { error: String(error) });
  }
};

const showInboxToast = (p: PrivateMessageInboxPayload) => {
  const name = p.senderDisplayName?.trim() || 'A fan';
  const text = (p.messageText ?? '').trim();
  Toast.show({
    type: 'appNotification',
    text1: `New message from ${name}`,
    text2: text.length > PREVIEW_MAX ? `${text.slice(0, PREVIEW_MAX)}…` : text,
    props: { type: 'private_message' },
    position: 'top',
    visibilityTime: 4000,
    onPress: () => {
      Toast.hide();
      router.push({
        pathname: '/(app)/(modals)/chat-thread',
        params: { userId: p.userId, name },
      } as never);
    },
  });
};

const handle = (p: PrivateMessageInboxPayload) => {
  if (!p?.id || seen.has(p.id)) return;
  seen.add(p.id);
  if (seen.size > 200) seen.clear();
  // Messages list + unread badge pick the new message up straight away.
  void queryClient.invalidateQueries({ queryKey: queryKeys.messages.list() });
  listeners.forEach((l) => {
    try {
      l(p);
    } catch {
      /* listener errors never break the toast */
    }
  });
  if (p.userId && p.userId === openChatUserId) return;
  showInboxToast(p);
};

const scheduleRetry = () => {
  if (stopped) return;
  if (retryTimer) clearTimeout(retryTimer);
  const delay = Math.min(30000, 2000 * Math.pow(1.5, retryAttempt++));
  retryTimer = setTimeout(() => void privateMessageInboxHub.connect(), delay);
};

export const privateMessageInboxHub = {
  async connect(): Promise<void> {
    stopped = false;
    if (connection && connection.state !== HubConnectionState.Disconnected) return;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (!(await getAccessToken())) return;

    const c = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: getAccessToken })
      .withAutomaticReconnect()
      // Warnings/errors from a flaky socket are retried here; don't paint the
      // red dev overlay for every drop.
      .configureLogging(LogLevel.None)
      .build();
    connection = c;

    c.on(EVENT, handle);
    c.onreconnected(() => {
      retryAttempt = 0;
      void joinInbox(c);
    });
    c.onclose(() => {
      if (connection === c) connection = null;
      scheduleRetry();
    });

    try {
      await c.start();
      retryAttempt = 0;
      await joinInbox(c);
    } catch (error) {
      logger.warn('Private message inbox hub failed to connect, will retry', { error: String(error) });
      if (connection === c) connection = null;
      scheduleRetry();
    }
  },

  async disconnect(): Promise<void> {
    stopped = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    retryAttempt = 0;
    const c = connection;
    connection = null;
    if (!c) return;
    try {
      await c.stop();
    } catch {
      /* ignore */
    }
  },

  /** Chat screen tells us which fan is open so we don't toast over the thread. */
  setOpenChat(userId: string | null): void {
    openChatUserId = userId;
  },

  /** e.g. the Messages list refreshing unread counts. Returns an unsubscribe. */
  subscribe(listener: (p: PrivateMessageInboxPayload) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
