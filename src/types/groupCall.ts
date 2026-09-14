/**
 * Group calls — artist (host) side types. Mirrors the artist web's
 * groupCallService contract against /api/artist/group-call/*.
 */
import type { BroadcastActivityItem, FulfillmentUpdatedPayload } from './broadcast';

export type GroupCallActivityItem = BroadcastActivityItem;
export type { FulfillmentUpdatedPayload };

export interface CreateGroupCallRequest {
  title: string;
  description?: string;
  maxParticipants: number;
  audioOrVideoMode?: 'audio' | 'video';
  entryPrice: number;
  requiresApproval: boolean;
  scheduledStartAtUtc?: string | null;
  expectedDurationMinutes?: number;
}

export interface CreateGroupCallResponse {
  message: string;
  groupCallId: string;
}

export interface GroupCallConnectionResponse {
  message: string;
  groupCallId: string;
  agoraChannelName: string;
  agoraUid: number;
  agoraToken: string;
  tokenExpiresAtUtc: string;
}

/**
 * Verbatim from the artist web's `GroupCallParticipantStatus`. The app used to
 * guess at `pending_approval`, which the API never sends — so join requests
 * never matched and the approve UI never appeared.
 */
export type GroupCallParticipantStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'authorized'
  | 'joining'
  | 'connected'
  | 'reconnecting'
  | 'left'
  | 'removed'
  | 'call_ended'
  | 'failed';

export interface GroupCallParticipant {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: GroupCallParticipantStatus;
  entryFeeCharged: number;
  requestedAtUtc: string;
  approvedAtUtc: string | null;
  joinedAtUtc: string | null;
  leftAtUtc: string | null;
  isRemoved: boolean;
  isMuted: boolean;
  rejectionReason: string | null;
}
