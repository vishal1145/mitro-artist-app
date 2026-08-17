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
  | '/(auth)/otp-verify';

export type AppTabRoute =
  | '/(app)/(tabs)/home'
  | '/(app)/(tabs)/explore'
  | '/(app)/(tabs)/profile';

export type AppRoute = AuthRoute | AppTabRoute;

/** Params carried into the OTP verification screen. */
export interface OtpVerifyParams {
  email: string;
  /** Where the OTP flow originated, so we can route correctly after verify. */
  origin: 'register' | 'forgot-password';
}
