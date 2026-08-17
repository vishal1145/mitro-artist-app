/** All API URLs in one place. Relative to API_CONFIG.baseUrl. */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    verifyOtp: '/auth/verify-otp',
    resendOtp: '/auth/resend-otp',
    logout: '/auth/logout',
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
