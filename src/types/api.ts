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
  /** "pending" | "approved" | "rejected", as far as we've seen. */
  approvalStatus: string;
  rejectedReason: string | null;
  categoryId: string | null;
  categoryName: string | null;
}

/** `GET /api/artist/categories` — a bare array, no envelope. */
export interface ArtistCategory {
  id: string;
  name: string;
  description: string;
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
}

export interface FunWheelActivity {
  id: string;
  wheelId: string;
  activityName: string;
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
