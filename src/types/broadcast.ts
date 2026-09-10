/**
 * Live broadcasting — artist (host) side types. Mirrors the artist web's
 * broadcastService contract against /api/artist/broadcast/*.
 */

export interface StartBroadcastRequest {
  title: string;
  description?: string;
  language?: string;
  category?: string;
}

export interface StartBroadcastResponse {
  message: string;
  broadcastId: string;
  agoraChannelName: string;
  agoraUid: number;
  agoraToken: string;
  tokenExpiresAtUtc: string;
}

export interface BroadcastViewer {
  userId: string;
  displayName: string;
  connectionStatus: string;
  isMuted: boolean;
  firstJoinedAtUtc: string;
  reconnectCount: number;
}

export interface ListViewersResponse {
  viewerCount: number;
  viewers: BroadcastViewer[];
}

export type BroadcastActivityType = 'chat' | 'highlighted' | 'reaction' | 'reward' | 'fun_wheel';

export interface BroadcastActivityItem {
  type: BroadcastActivityType;
  id: string;
  userId: string;
  /** True when the host themselves sent this (render a HOST badge). */
  isArtist: boolean;
  displayName: string;
  avatarUrl: string | null;
  text: string | null;
  extra: string | null;
  iconUrl: string | null;
  priceCharged: number | null;
  /** reward/fun_wheel only: pending | fulfilled | refunded | cancelled. */
  status: string | null;
  createdAtUtc: string;
}

export interface BroadcastAnalytics {
  broadcastId: string;
  title: string;
  status: string;
  startedAtUtc: string | null;
  endedAtUtc: string | null;
  durationSeconds: number | null;
  peakViewerCount: number;
  currentViewerCount: number;
  totalUniqueViewers: number;
  chatMessageCount: number;
  reactionCount: number;
  reactionTokens: number;
  highlightedMessageCount: number;
  highlightedMessageTokens: number;
  rewardOrderCount: number;
  rewardOrderTokens: number;
  funWheelSpinCount: number;
  funWheelSpinTokens: number;
  totalRevenueTokens: number;
}

/** Pushed on the broadcast hub when the host marks a reward/spin fulfilled. */
export interface FulfillmentUpdatedPayload {
  kind: 'reward' | 'fun_wheel_spin';
  id: string;
  userId: string;
  itemName: string;
  status: string;
  updatedAtUtc: string;
}
