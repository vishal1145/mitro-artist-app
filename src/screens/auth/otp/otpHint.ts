/**
 * The code the server echoes back instead of texting it, shared between the
 * screen that requests an OTP and the screen that verifies it.
 *
 * Both auth flows use it — sign-up and password reset — so it lives on its own
 * rather than riding along with either flow's payload. Kept out of route
 * params for the same reason the password is: navigation state is persisted
 * and logged, and a one-time code doesn't belong there.
 *
 * Temporary by design. Once a real SMS provider fronts the endpoint the
 * server stops returning `otp`, this stays null, and the on-screen hint
 * disappears without any code change.
 */
let hint: string | null = null;

export const setOtpHint = (value?: string): void => {
  hint = value ?? null;
};

export const getOtpHint = (): string | null => hint;

export const clearOtpHint = (): void => {
  hint = null;
};
