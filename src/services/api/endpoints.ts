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
    /** The full coin ledger, newest first. Paged with `?take=&skip=`. */
    transactions: '/api/artist/earnings/transactions',
  },
  /** Live broadcasting — artist (host) side. Hub: /hubs/broadcast. */
  broadcast: {
    start: '/api/artist/broadcast/start',
    confirmConnected: (id: string) => `/api/artist/broadcast/${id}/confirm-connected`,
    rejoin: (id: string) => `/api/artist/broadcast/${id}/rejoin`,
    connectionLost: (id: string) => `/api/artist/broadcast/${id}/connection-lost`,
    heartbeat: (id: string) => `/api/artist/broadcast/${id}/heartbeat`,
    end: (id: string) => `/api/artist/broadcast/${id}/end`,
    viewers: (id: string) => `/api/artist/broadcast/${id}/viewers`,
    activity: (id: string) => `/api/artist/broadcast/${id}/activity`,
    chat: (id: string) => `/api/artist/broadcast/${id}/chat`,
    muteViewer: (id: string, userId: string) => `/api/artist/broadcast/${id}/viewers/${userId}/mute`,
    unmuteViewer: (id: string, userId: string) => `/api/artist/broadcast/${id}/viewers/${userId}/unmute`,
    removeViewer: (id: string, userId: string) => `/api/artist/broadcast/${id}/viewers/${userId}/remove`,
    highlightedPrice: (id: string) => `/api/artist/broadcast/${id}/highlighted-message-price`,
    analytics: (id: string) => `/api/artist/broadcast/${id}/analytics`,
    /** Paged with `?take=&skip=`. */
    history: '/api/artist/broadcast/history',
    historySummary: '/api/artist/broadcast/history/summary',
  },
  /** Group calls — artist (host) side. Hub: /hubs/group-call. */
  groupCall: {
    create: '/api/artist/group-call',
    start: (id: string) => `/api/artist/group-call/${id}/start`,
    confirmConnected: (id: string) => `/api/artist/group-call/${id}/confirm-connected`,
    rejoin: (id: string) => `/api/artist/group-call/${id}/rejoin`,
    connectionLost: (id: string) => `/api/artist/group-call/${id}/connection-lost`,
    cancel: (id: string) => `/api/artist/group-call/${id}/cancel`,
    end: (id: string) => `/api/artist/group-call/${id}/end`,
    participants: (id: string) => `/api/artist/group-call/${id}/participants`,
    approve: (id: string, userId: string) => `/api/artist/group-call/${id}/participants/${userId}/approve`,
    reject: (id: string, userId: string) => `/api/artist/group-call/${id}/participants/${userId}/reject`,
    remove: (id: string, userId: string) => `/api/artist/group-call/${id}/participants/${userId}/remove`,
    mute: (id: string, userId: string) => `/api/artist/group-call/${id}/participants/${userId}/mute`,
    unmute: (id: string, userId: string) => `/api/artist/group-call/${id}/participants/${userId}/unmute`,
    heartbeat: (id: string) => `/api/artist/group-call/${id}/heartbeat`,
    highlightedPrice: (id: string) => `/api/artist/group-call/${id}/highlighted-message-price`,
    refundThreshold: (id: string) => `/api/artist/group-call/${id}/refund-threshold`,
    activity: (id: string) => `/api/artist/group-call/${id}/activity`,
    chat: (id: string) => `/api/artist/group-call/${id}/chat`,
    analytics: (id: string) => `/api/artist/group-call/${id}/analytics`,
    history: '/api/artist/group-call/history',
    historySummary: '/api/artist/group-call/history/summary',
  },
  /** Private (1:1) calls — artist side. Hub: /hubs/private-call. */
  privateCall: {
    settings: '/api/artist/private-call/settings',
    requests: '/api/artist/private-call/requests',
    accept: (id: string) => `/api/artist/private-call/requests/${id}/accept`,
    reject: (id: string) => `/api/artist/private-call/requests/${id}/reject`,
    connect: (id: string) => `/api/artist/private-call/${id}/connect`,
    end: (id: string) => `/api/artist/private-call/${id}/end`,
    connectionLost: (id: string) => `/api/artist/private-call/${id}/connection-lost`,
    heartbeat: (id: string) => `/api/artist/private-call/${id}/heartbeat`,
    active: '/api/artist/private-call/active',
    history: '/api/artist/private-call/history',
  },
  /** Reward-order fulfillment queue (host delivers rewards fans bought). */
  rewardOrders: {
    list: '/api/artist/reward-orders',
    fulfill: (id: string) => `/api/artist/reward-orders/${id}/fulfill`,
  },
  /** Fun-wheel spin fulfillment queue. */
  funWheelSpins: {
    list: '/api/artist/fun-wheel-spins',
    fulfill: (id: string) => `/api/artist/fun-wheel-spins/${id}/fulfill`,
  },
  /** Read-only followers list, with badges + engagement summary. */
  followers: {
    list: '/api/artist/followers',
  },
  /** In-app notifications. The hub itself lives at NOTIFICATIONS.hubPath. */
  notifications: {
    /** `?take=` — newest first. */
    list: '/api/artist/notifications',
    unreadCount: '/api/artist/notifications/unread-count',
    read: (id: string) => `/api/artist/notifications/${id}/read`,
    readAll: '/api/artist/notifications/read-all',
  },
  /** Paid private messages — artist side (replies are free). Hub: /hubs/private-message. */
  privateMessages: {
    /** `?take=` — inbox, one row per fan, most recent first. */
    list: '/api/artist/private-messages',
    /** `?page=&pageSize=` — the thread with one fan. */
    conversation: (userId: string) => `/api/artist/private-messages/${userId}`,
    /** Free artist reply. */
    reply: (userId: string) => `/api/artist/private-messages/${userId}/reply`,
    read: (userId: string) => `/api/artist/private-messages/${userId}/read`,
    /** Edit (PUT) / delete (DELETE) the artist's own reply, by message id. */
    message: (messageId: string) => `/api/artist/private-messages/message/${messageId}`,
  },
  /** FCM device registration for push notifications. */
  devices: {
    register: '/api/artist/devices/register',
    unregister: '/api/artist/devices/unregister',
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
