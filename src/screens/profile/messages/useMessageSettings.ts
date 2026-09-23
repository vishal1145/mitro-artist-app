import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { useConversations } from '@hooks/usePrivateMessages';
import { useProfile } from '@hooks/useProfile';
import { queryKeys } from '@constants/queryKeys';
import { privateMessageApi } from '@services/api/privateMessageApi';
import { showToast } from '@utils/toast';

import type { ArtistConversationSummary } from '@app-types/api';

export interface UseMessageSettingsResult {
  conversations: ArtistConversationSummary[];
  isLoading: boolean;
  unread: number;

  profile: ReturnType<typeof useProfile>['data'];
  loadingSettings: boolean;
  acceptsMessages: boolean;

  settingsOpen: boolean;
  openSettings: () => void;
  /** No-ops while a save is in flight — same guard as the web. */
  closeSettings: () => void;

  price: string;
  setPrice: (value: string) => void;
  saving: boolean;
  saveSettings: (nextAccepts: boolean) => Promise<void>;

  openThread: (c: ArtistConversationSummary) => void;
}

/** Fan inbox data + the accept-messages settings popup. */
export const useMessageSettings = (): UseMessageSettingsResult => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useConversations();
  const conversations = data ?? [];
  const unread = conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0);

  /*
   * Accepting messages (and the per-message price) lives on the artist
   * profile — exactly where the web reads it from via `getMe()`. It is only
   * ever written through `privateMessageApi.setSettings`.
   */
  const { data: profile, isLoading: loadingSettings } = useProfile();
  const acceptsMessages = !!profile?.acceptsPrivateMessages;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill from the saved price the way the web does — only when there is one.
  useEffect(() => {
    if (profile?.privateMessagePrice) setPrice(String(profile.privateMessagePrice));
  }, [profile?.privateMessagePrice]);

  /**
   * One button drives both directions, like the web: it sends the *opposite*
   * of the current state. A blank price is left out of the payload entirely.
   */
  const saveSettings = async (nextAccepts: boolean) => {
    if (saving) return;
    setSaving(true);
    const priceValue = price ? Number(price) : undefined;
    const res = await privateMessageApi.setSettings(nextAccepts, priceValue);
    setSaving(false);

    if (!res.success) {
      // No optimistic flip — the switch stays where the backend left it.
      showToast(res.error, 'error');
      return;
    }
    showToast(
      nextAccepts ? 'Private messages turned on.' : 'Private messages turned off.',
      'success',
    );
    setSettingsOpen(false);
    // Re-read the profile so the pill and price reflect what was actually saved.
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.me() });
  };

  const openThread = (c: ArtistConversationSummary) => {
    router.push({
      pathname: '/(app)/(modals)/chat-thread',
      params: {
        userId: c.userId,
        name: c.userDisplayName ?? 'Fan',
        avatarUrl: c.userAvatarUrl ?? '',
      },
    });
  };

  return {
    conversations,
    isLoading,
    unread,
    profile,
    loadingSettings,
    acceptsMessages,
    settingsOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => {
      if (!saving) setSettingsOpen(false);
    },
    price,
    setPrice,
    saving,
    saveSettings,
    openThread,
  };
};
