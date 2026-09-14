/** Private (1:1) calls — artist (host) side types. Mirrors the artist web's
 * privateCallService contract against /api/artist/private-call/*. */

export interface PrivateCallRequestItem {
  requestId: string;
  userId: string;
  userDisplayName: string;
  message: string | null;
  pricePerMinuteSnapshot: number;
  initialChargeSnapshot: number;
  expiresAtUtc: string;
  createdAtUtc: string;
}

export interface PrivateCallConnectionResponse {
  message: string;
  privateCallId: string;
  agoraChannelName: string;
  agoraUid: number;
  agoraToken: string;
  tokenExpiresAtUtc: string;
}

export interface PrivateCallActiveSession {
  hasActiveSession: boolean;
  privateCallId?: string;
  status?: string;
  userId?: string;
  pricePerMinuteSnapshot?: number;
  artistJoinedAtUtc?: string | null;
  userJoinedAtUtc?: string | null;
  paidThroughUtc?: string | null;
}

/** One past 1:1 call, newest first. Mirrors the web's PrivateCallHistoryItem. */
export interface PrivateCallHistoryItem {
  privateCallId: string;
  userId: string;
  status: string;
  acceptedAtUtc: string | null;
  endedAtUtc: string | null;
  endReason: string | null;
  totalChargedMinutes: number;
  totalCoinsCharged: number;
  totalRefundedCoins: number;
}

/**
 * Pushed on the private-call hub from minute 6 onward (`AdditionalMinuteCharged`)
 * — minutes 1-5 are covered by the initial charge taken at accept time.
 */
export interface CallCostUpdatePayload {
  privateCallId?: string;
  minuteNumber: number;
  tokensCharged?: number;
  totalCoinsCharged: number;
}

/** `RewardPurchased` push during a private call. */
export interface PrivateCallRewardPush {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rewardName: string;
  priceCharged: number;
  createdAtUtc: string;
}

/** `FunWheelSpun` push during a private call. */
export interface PrivateCallFunWheelPush {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  activityName: string;
  priceCharged: number;
  createdAtUtc: string;
}
