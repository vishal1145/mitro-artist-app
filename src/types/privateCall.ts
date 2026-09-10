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

/** Pushed on the private-call hub each billed minute. */
export interface CallCostUpdatePayload {
  minuteNumber: number;
  totalCoinsCharged: number;
}
