/**
 * Route param types. Expo Router provides typed routes via the `typedRoutes`
 * experiment; these aliases document the params each route consumes and keep
 * navigation calls type-safe where params are passed.
 */

export type AuthRoute =
  | '/(auth)/onboarding'
  | '/(auth)/login'
  | '/(auth)/register'
  | '/(auth)/forgot-password'
  | '/(auth)/otp-verify'
  | '/(auth)/reset-password';

export type AppTabRoute =
  | '/(app)/(tabs)/home'
  | '/(app)/(tabs)/explore'
  | '/(app)/(tabs)/profile';

export type AppRoute = AuthRoute | AppTabRoute;

/** Params carried into the OTP verification screen. */
export interface OtpVerifyParams {
  /** 10-digit mobile number the code was sent to. */
  mobile: string;
  /** Where the OTP flow originated, so we can route correctly after verify. */
  origin: 'register' | 'forgot-password';
}

/** Params carried into the new-password screen, after the code is verified. */
export interface ResetPasswordParams {
  /** The verified number the reset applies to. */
  mobile: string;
}
