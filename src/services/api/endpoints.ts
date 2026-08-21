/** All API URLs in one place. Relative to API_CONFIG.baseUrl. */
export const ENDPOINTS = {
  /** Artist auth. Every path below is confirmed against Swagger. */
  auth: {
    login: '/api/artist/auth/login',
    /** Sign-up step 3 — only succeeds after the phone is verified. */
    register: '/api/artist/auth/register',
    /** Sign-up step 1. */
    sendRegistrationOtp: '/api/artist/auth/send-registration-otp',
    /** Sign-up step 2. */
    verifyRegistrationOtp: '/api/artist/auth/verify-registration-otp',
    /** Password reset, steps 1-3. */
    sendPasswordResetOtp: '/api/artist/auth/forgot-password/send-otp',
    verifyPasswordResetOtp: '/api/artist/auth/forgot-password/verify-otp',
    resetPassword: '/api/artist/auth/forgot-password/reset',
    /** Bodyless — reads the refresh cookie the server set at login. */
    refresh: '/api/artist/auth/refresh',
    logout: '/api/artist/auth/logout',
    /** `?name=` — live availability check for the sign-up stage name. */
    stageNameCheck: '/api/artist/auth/stage-name-check',
  },
  /** Authenticated artist routes. All require a Bearer token. */
  profile: {
    me: '/api/artist/profile/me',
    update: '/api/artist/profile/update',
    categories: '/api/artist/categories',
    changePassword: '/api/artist/change-password',
    changeStageName: '/api/artist/change-stage-name',
    sendChangePhoneOtp: '/api/artist/send-change-phone-otp',
    verifyChangePhoneOtp: '/api/artist/verify-change-phone-otp',
    /** Presigned upload, then confirm — see profileApi.uploadAvatar. */
    avatarUploadUrl: '/api/artist/avatar/upload-url',
    avatar: '/api/artist/avatar',
    photoUploadUrl: '/api/artist/photos/upload-url',
    /** GET lists the gallery, POST attaches a freshly uploaded photo. */
    photos: '/api/artist/photos',
    photo: (photoId: string) => `/api/artist/photos/${photoId}`,
  },
  /**
   * Creator settings. Read-only so far — no write endpoints confirmed for
   * toggling a reward, adding one, or editing the wheel.
   */
  settings: {
    rewardMenu: '/api/artist/settings/reward-menu',
    funWheel: '/api/artist/settings/fun-wheel',
    funWheelActivities: '/api/artist/settings/fun-wheel/activities',
  },
  earnings: {
    summary: '/api/artist/earnings/summary',
  },
  broadcast: {
    /** Paged with `?take=&skip=`. */
    history: '/api/artist/broadcast/history',
  },
  user: {
    profile: '/user/profile',
  },
  home: {
    feed: '/home/feed',
  },
  explore: {
    search: '/explore/search',
  },
} as const;
