/**
 * API response & domain types. No `any` anywhere in the app — model the
 * server contract explicitly here and import from @types.
 */

/** Result<T> pattern — every service call returns this discriminated union. */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Standard envelope our API wraps successful payloads in. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * The artist as the API returns it.
 * `GET/POST /api/artist/auth/*` responds with exactly these three fields.
 */
export interface Artist {
  id: string;
  stageName: string;
  /** Server-side gate, e.g. "Pending" | "Approved" | "Rejected". */
  approvalStatus: string;
}

/** Authenticated user, as the app models it. */
export interface User {
  id: string;
  name: string;
  /** Not returned by the artist auth endpoints. */
  email?: string;
  username?: string;
  avatarUrl?: string;
  createdAt?: string;
  /** Straight from the API — drives the approval gate. */
  approvalStatus?: string;
}

export interface AuthTokens {
  accessToken: string;
  /**
   * Optional: the artist API issues an access token only. When it's absent
   * the interceptor cannot silently renew, so a 401 logs the user out.
   */
  refreshToken?: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

/** Raw login/register response body — no `data` envelope on these routes. */
export interface ArtistAuthResponse {
  accessToken: string;
  artist: Artist;
}

// --- Request payloads ---

export interface LoginPayload {
  /** One field: the server accepts either the mobile number or the stage name. */
  phoneOrStageName: string;
  password: string;
}

export type SocialProviderId = 'google' | 'apple';

export interface RegisterPayload {
  /** 10-digit national mobile number, digits only. */
  phone: string;
  /** Stage name / handle. */
  stageName: string;
  password: string;
}

/**
 * Both OTP flows start the same way — a phone number, nothing else.
 *
 * Registration is a three-call sequence, not one POST:
 *   1. send-registration-otp   { phone }
 *   2. verify-registration-otp { phone, otp }
 *   3. register                { phone, stageName, password }
 *
 * Step 3 fails with "Phone verification expired" if it doesn't follow step 2
 * closely enough, so the app runs them back to back.
 *
 * Password reset mirrors it:
 *   1. forgot-password/send-otp   { phone }
 *   2. forgot-password/verify-otp { phone, otp }
 *   3. forgot-password/reset      { phone, newPassword, confirmPassword }
 */
export interface SendOtpPayload {
  phone: string;
}

/**
 * `otp` is echoed back by the server while SMS delivery is stubbed, and the
 * app shows it on the verify screen. Typed optional so the hint disappears by
 * itself once a real provider stops returning it.
 */
export interface SendOtpResponse {
  message: string;
  otp?: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

/** Final step of password reset. The server checks the two match as well. */
export interface ResetPasswordPayload {
  phone: string;
  newPassword: string;
  confirmPassword: string;
}

/** Bodies that carry only a human-readable status line. */
export interface MessageResponse {
  message: string;
}

/**
 * `POST /refresh` takes no body — it authenticates off the `myartist_art_rt`
 * cookie the server set at login, and answers with a bare token.
 */
export interface RefreshResponse {
  accessToken: string;
}

export interface StageNameCheckResponse {
  stageName: string;
  isAvailable: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Artist profile                                                            */
/* -------------------------------------------------------------------------- */

/**
 * `GET /api/artist/profile/me`, exactly as the server returns it.
 *
 * The nullable fields really do come back as `null` on a fresh account, not
 * absent — so they're typed `| null` rather than optional. Screens have to
 * handle the empty case anyway, and `null` says "not set yet" more honestly
 * than an undefined key.
 */
export interface ArtistProfile {
  id: string;
  phone: string;
  stageName: string;
  aboutMe: string | null;
  bio: string | null;
  avatarUrl: string | null;
  languages: string[];
  skills: string[];
  workTime: string | null;
  /** Read-only balance. Changed by earnings and payouts, never by the form. */
  walletTokens: number;
  privateShowTokenPerMinute: number;
  groupShowTokenPerMinute: number;
  /** Read-only here — no confirmed endpoint toggles it yet. */
  acceptsPrivateCalls: boolean;
  /**
   * Paid private messages. The source of truth the artist web reads back from
   * `getMe()` — toggled through `privateMessageApi.setSettings`, never here.
   */
  acceptsPrivateMessages?: boolean;
  /** What a fan pays to send one message. */
  privateMessagePrice?: number;
  /** "pending" | "approved" | "rejected", as far as we've seen. */
  approvalStatus: string;
  rejectedReason: string | null;
  categoryId: string | null;
  categoryName: string | null;
  /** Second level under `categoryId`; null when the artist hasn't picked one. */
  subcategoryId: string | null;
  subcategoryName: string | null;
  /**
   * KYC verification state, from the same `/profile/me` payload the web reads
   * (`artistProfileService.getMe().kycStatus`): "" / "pending" / "approved" /
   * "rejected". Drives the KYC nudge on the Me tab.
   */
  kycStatus?: string | null;
}

/**
 * KYC verification state — `GET /api/artist/kyc`, same shape the web's
 * `kycService.getKycStatus()` reads. Numbers come back masked.
 */
export interface KycStatus {
  /** "" | "pending" | "approved" | "rejected". */
  status: string;
  approvalStatus?: string | null;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
  panFrontUploaded?: boolean;
  aadhaarFrontUploaded?: boolean;
  aadhaarBackUploaded?: boolean;
  rejectionReason?: string | null;
  adminMessage?: string | null;
}

/** The three KYC documents the backend accepts. */
export type KycDocumentType = 'pan_front' | 'aadhaar_front' | 'aadhaar_back';

/** `POST /api/artist/kyc/documents/upload-url`. */
export interface KycUploadUrlPayload {
  documentType: string;
  fileName: string;
  contentType: string;
}

/** Presign response — the app sends `objectKey` (fallback `publicUrl`) to pan/aadhaar. */
export interface KycUploadUrlResponse {
  uploadUrl: string;
  objectKey?: string;
  publicUrl?: string;
  expiresAtUtc?: string;
}

/** `GET /api/artist/kyc/documents/{type}/view-url`. */
export interface KycViewUrlResponse {
  viewUrl?: string;
  url?: string;
}

/** `PUT /api/artist/kyc/pan`. `panFrontKey` omitted keeps the stored document. */
export interface SavePanPayload {
  panNumber: string;
  panFrontKey?: string;
}

/** `PUT /api/artist/kyc/aadhaar`. Keys omitted keep the stored documents. */
export interface SaveAadhaarPayload {
  aadhaarNumber: string;
  aadhaarFrontKey?: string;
  aadhaarBackKey?: string;
}

/** `PUT /api/artist/kyc/bank-account`. */
export interface SaveBankAccountPayload {
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: string;
}

/** Payout bank account — `GET /api/artist/kyc/bank-account`. Masked. */
export interface BankAccount {
  accountHolderName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  accountType?: string | null;
}

/** `GET /api/artist/categories` — a bare array, no envelope. */
export interface ArtistCategory {
  id: string;
  name: string;
  description: string;
}

/**
 * `GET /api/artist/subcategories?categoryId=…` — the second level under a
 * primary category. Same controller and shape as `ArtistCategory`;
 * `description` is optional because the endpoint's 200 is untyped in swagger.
 */
export interface ArtistSubcategory {
  id: string;
  name: string;
  description?: string;
}

/**
 * `PUT /api/artist/profile/update`.
 *
 * Every field is optional so a screen can save just the part it owns — the
 * Settings bio box shouldn't have to resend the artist's rates to change one
 * line of text.
 */
export interface UpdateProfilePayload {
  aboutMe?: string;
  bio?: string;
  languages?: string[];
  skills?: string[];
  workTime?: string;
  /** Token price per minute for 1:1 calls. */
  privateShowTokenPerMinute?: number;
  /** Token price per minute for group sessions. */
  groupShowTokenPerMinute?: number;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** `POST /api/artist/profile/category` — sets the primary category. */
export interface UpdateCategoryPayload {
  categoryId: string;
  /**
   * Optional second level under the primary category.
   *
   * Spelled `subcategoryId`, all lowercase, because that is what the server's
   * `UpdateArtistCategoryRequest` declares (MyArtist.Artist.Api swagger) — a
   * camel-cased `subCategoryId` is silently ignored.
   */
  subcategoryId?: string | null;
}

export interface ChangeStageNamePayload {
  stageName: string;
}

/** Changing the number is its own OTP exchange, on the authenticated routes. */
export interface SendChangePhoneOtpPayload {
  newPhone: string;
}

export interface VerifyChangePhoneOtpPayload {
  newPhone: string;
  otp: string;
}

/* ------------------------------ Media ------------------------------------ */

/**
 * Step 1 of an upload. The server hands back a short-lived presigned URL;
 * the file goes straight to storage, never through the API.
 */
export interface UploadUrlPayload {
  fileName: string;
  contentType: string;
}

export interface UploadUrlResponse {
  /** PUT the raw file here. No auth header — the signature is the auth. */
  uploadUrl: string;
  /** Where the file will be readable once the PUT succeeds. */
  publicUrl: string;
  expiresAtUtc: string;
}

/** Step 3 of the avatar upload: point the profile at the stored file. */
export interface SetAvatarPayload {
  avatarUrl: string;
}

/** Step 3 of a gallery upload: attach the stored file to the artist. */
export interface SavePhotoPayload {
  photoUrl: string;
}

/* -------------------------------------------------------------------------- */
/*  Creator settings — reward menu & fun wheel                                */
/* -------------------------------------------------------------------------- */

/** One entry in the artist's reward menu. `GET /settings/reward-menu`. */
export interface RewardMenuItem {
  id: string;
  rewardName: string;
  rewardTokens: number;
  description: string | null;
  /** Inactive rewards stay in the list but are hidden from fans. */
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

/**
 * `POST /settings/reward-menu`. Returns the created `RewardMenuItem`.
 *
 * `description` is sent as null — the server fills it with the reward name,
 * so there's no point asking the artist for it twice.
 */
export interface CreateRewardPayload {
  rewardName: string;
  rewardTokens: number;
  description: string | null;
}

/** `POST /settings/fun-wheel/activities`. The wheel is implied by the token. */
export interface CreateActivityPayload {
  activityName: string;
  /** Relative odds [1, 1000]; omitted defaults to 1 server-side. */
  weight?: number;
}

/** `PUT /settings/fun-wheel/{wheelId}` — rename / reprice the wheel. */
export interface UpdateFunWheelPayload {
  wheelName: string;
  pricePerSpin: number;
}

/**
 * `PUT /settings/fun-wheel/activities/{activityId}`.
 * Omit `weight` to leave the existing odds untouched, as the web does.
 */
export interface UpdateActivityPayload {
  activityName: string;
  weight?: number | null;
}

export interface FunWheelActivity {
  id: string;
  wheelId: string;
  activityName: string;
  /** Relative odds; may be absent on older rows — treat missing as 1. */
  weight?: number | null;
  description: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

/** `GET /settings/fun-wheel` — a single wheel with its activities inline. */
export interface FunWheel {
  id: string;
  wheelName: string;
  pricePerSpin: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  activities: FunWheelActivity[];
}

/* -------------------------------------------------------------------------- */
/*  Earnings                                                                  */
/* -------------------------------------------------------------------------- */

export interface EarningsBucket {
  /** e.g. "pending" | "available" | "paid_out". */
  status: string;
  tokens: number;
  count: number;
}

export interface EarningsSource {
  /** e.g. "fun_wheel_spin" | "reward_purchase" | "reaction". */
  sourceType: string;
  tokens: number;
  count: number;
}

export interface EarningsDay {
  /** Midnight UTC for the day. */
  date: string;
  tokens: number;
}

/** `GET /api/artist/earnings/summary`. */
export interface EarningsSummary {
  totalTokens: number;
  totalTransactions: number;
  /** Earned but not yet cleared for withdrawal. */
  pendingTokens: number;
  availableTokens: number;
  paidOutTokens: number;
  byStatus: EarningsBucket[];
  bySource: EarningsSource[];
  /** Oldest first, always seven entries including zero days. */
  last7Days: EarningsDay[];
}

/**
 * One credit in the coin ledger, as `GET /api/artist/earnings/transactions`
 * returns it. Newest first. Bare array — no envelope.
 *
 * `reaction*` / `groupCall*` are only populated for their matching
 * `sourceType`; everything else leaves them null.
 */
export interface EarningsTransaction {
  id: string;
  /** Same vocabulary as `EarningsSource.sourceType`. */
  sourceType: string;
  /** The call / message / spin the credit came from. */
  sourceId: string;
  amountTokens: number;
  /** e.g. "pending" | "available" | "paid_out". */
  status: string;
  createdAtUtc: string;
  fromUserId: string;
  fromDisplayName: string;
  /** Human-readable line the server already composed, e.g. "Private call — minute 17". */
  description: string;
  reactionIconUrl: string | null;
  reactionName: string | null;
  groupCallId: string | null;
  groupCallTitle: string | null;
}

export interface EarningsTransactionsQuery {
  take: number;
  skip?: number;
}

/* -------------------------------------------------------------------------- */
/*  Broadcasts                                                                */
/* -------------------------------------------------------------------------- */

/** One past broadcast, as `GET /api/artist/broadcast/history` returns it. */
export interface BroadcastHistoryItem {
  broadcastId: string;
  title: string;
  category: string;
  /** e.g. "ended" | "live". */
  status: string;
  startedAtUtc: string;
  /** Null while still live. */
  endedAtUtc: string | null;
  durationSeconds: number;
  /** "Ended by artist", "artist_reconnect_timeout", … */
  endReason: string | null;
  peakViewerCount: number;
  totalUniqueViewers: number;
  totalRevenueTokens: number;
}

export interface BroadcastHistoryQuery {
  take: number;
  skip: number;
}

/**
 * Lifetime broadcast totals — `GET /api/artist/broadcast/history/summary`.
 * Computed DB-side (COUNT/SUM/AVG), so it stays accurate no matter how many
 * broadcasts the artist has ever hosted, unlike summing a page of `history`.
 */
export interface BroadcastHistorySummary {
  totalShows: number;
  totalRevenueTokens: number;
  totalUniqueViewers: number;
  avgDurationSeconds: number | null;
}

/** Per-broadcast breakdown — `GET /api/artist/broadcast/{id}/analytics`. */
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

/* -------------------------------------------------------------------------- */
/*  Group calls                                                               */
/* -------------------------------------------------------------------------- */

/** One past group call, as `GET /api/artist/group-call/history` returns it. */
export interface GroupCallHistoryItem {
  groupCallId: string;
  title: string;
  /** "ended" | "cancelled" | "terminated" | "failed" | … */
  status: string;
  startedAtUtc: string | null;
  endedAtUtc: string | null;
  durationSeconds: number | null;
  endReason: string | null;
  peakParticipantCount: number;
  totalRequests: number;
  totalRevenueTokens: number;
}

/** Server-side status filter for the group-call history list + summary. */
export type GroupCallHistoryFilter = 'all' | 'ended' | 'cancelled';

export interface GroupCallHistoryQuery {
  take: number;
  skip: number;
  status: GroupCallHistoryFilter;
}

/** Lifetime group-call totals — `GET /api/artist/group-call/history/summary`. */
export interface GroupCallHistorySummary {
  totalCalls: number;
  totalRevenueTokens: number;
  avgDurationSeconds: number | null;
}

/** Per-call breakdown — `GET /api/artist/group-call/{id}/analytics`. */
export interface GroupCallAnalytics {
  groupCallId: string;
  title: string;
  status: string;
  startedAtUtc: string | null;
  endedAtUtc: string | null;
  durationSeconds: number | null;
  peakParticipantCount: number;
  currentParticipantCount: number;
  totalRequests: number;
  totalApproved: number;
  totalRejected: number;
  totalJoined: number;
  reconnectedParticipants: number;
  totalRevenueTokens: number;
  entryRevenueTokens: number;
  highlightedMessageRevenueTokens: number;
  reactionRevenueTokens: number;
  rewardRevenueTokens: number;
  funWheelRevenueTokens: number;
  refundCount: number;
  refundedTokens: number;
  netArtistEarningTokens: number;
}

/* -------------------------------------------------------------------------- */
/*  Reward orders — fan-purchased rewards awaiting fulfillment                */
/* -------------------------------------------------------------------------- */

/** `GET /api/artist/reward-orders`. */
export interface RewardOrder {
  id: string;
  broadcastId: string;
  userId: string;
  buyerDisplayName: string;
  rewardName: string;
  priceCharged: number;
  /** "pending" | "fulfilled" | … */
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

/* -------------------------------------------------------------------------- */
/*  Followers                                                                 */
/* -------------------------------------------------------------------------- */

export type FollowerBadge =
  | 'new_follower'
  | 'top_supporter'
  | 'session_regular'
  | 'returning_fan'
  | 'follower';

/** One row in the followers list — `GET /api/artist/followers`. */
export interface Follower {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  followedAtUtc: string;
  totalCoinsSpent: number;
  interactionCount: number;
  badge: FollowerBadge;
}

export interface FollowersSummary {
  totalFollowers: number;
  newFollowersThisWeek: number;
  topSupporterCount: number;
  sessionRegularCount: number;
}

export interface FollowersResponse {
  summary: FollowersSummary;
  followers: Follower[];
}

/**
 * An entry in the artist's photo gallery.
 *
 * `id` and `photoUrl` are the two fields the app actually uses — the grid
 * renders the URL and DELETE takes the id. Anything else the server sends is
 * carried but ignored.
 */
export interface ArtistPhoto {
  id: string;
  photoUrl: string;
  createdAtUtc?: string;
}

/* -------------------------------------------------------------------------- */
/*  Notifications                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `GET /api/artist/notifications` and the SignalR `NotificationReceived`
 * payload — identical shape either way.
 *
 * `type` is deliberately a bare string, not a union: the server can add new
 * kinds (today it sends "private_call_request", "new_follower", "system")
 * without a client release, so nothing here should switch exhaustively on it.
 */
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceType: string | null;
  referenceId: string | null;
  /** App-relative path the notification should deep-link to, if any. */
  actionUrl: string | null;
  isRead: boolean;
  createdAtUtc: string;
}

/** `GET .../unread-count`, and the same shape `read` / `read-all` answer with. */
export interface UnreadCountResponse {
  unreadCount: number;
}

export type DevicePlatform = 'ios' | 'android';

/** `POST /api/artist/devices/register`. */
export interface RegisterDevicePayload {
  fcmToken: string;
  platform: DevicePlatform;
}

/** `POST /api/artist/devices/unregister`. */
export interface UnregisterDevicePayload {
  fcmToken: string;
}


/* ---- Paid private messages (artist side) ---------------------------------
 * Mirrors MyArtist.Artist.Api PrivateMessagesController. Replies are free;
 * the paid user→artist send lives on the User API. */

/** One row in the artist's message inbox. */
export interface ArtistConversationSummary {
  userId: string;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  lastMessageText: string;
  lastMessageSenderType: 'user' | 'artist';
  lastMessageAtUtc: string;
  unreadCount: number;
}

/** One message in a 1:1 fan thread. */
export interface PrivateMessageItem {
  id: string;
  senderType: 'user' | 'artist';
  messageText: string;
  privateCallId: string | null;
  priceCharged: number;
  readAtUtc: string | null;
  createdAtUtc: string;
  /** Edit/delete are only accepted while the fan hasn't read the message yet. */
  editedAtUtc?: string | null;
  isDeleted?: boolean;
  /** Reply threading — the quoted message this one replies to. */
  replyToMessageId?: string | null;
  replyToText?: string | null;
  replyToSenderType?: 'user' | 'artist' | null;
}

export interface PrivateMessageConversationResponse {
  items: PrivateMessageItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ReplyPrivateMessageResponse {
  message: string;
  messageId: string;
  createdAtUtc: string;
}

/* -------------------------------------------------------------------------- */
/*  Runtime configuration                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `GET /api/artist/config` — values the backend owns rather than the build.
 *
 * Only `agoraAppId` is consumed today; anything else the server adds is
 * carried but ignored, exactly as the artist web treats it.
 */
export interface ArtistRuntimeConfig {
  agoraAppId?: string | null;
}
