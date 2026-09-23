# Part D — Full File Audit (in progress)

Companion to TEST_PLAN.md. This document is built incrementally, one domain at a time, each backed by a full read of the real source. Section order below matches audit order, not file-tree order.

---

# Section 1: Foundational layer (constants, utils, theme, types, zustand stores)

# Audit: Mitro Artist App — Foundational Layer (constants, utils, theme, types, stores)

---

## src/constants/index.ts

**Type:** constants (barrel/re-export) · **Purpose:** Re-exports everything from `app.ts` and `queryKeys.ts` as the single `@constants` import surface.

**Exports:** `APP`, `API_CONFIG`, `ALLOW_INSECURE_HTTP`, `SECURE_KEYS`, `STORAGE_KEYS`, `TIMING`, `REGEX`, `NOTIFICATIONS`, `queryKeys` — all pure re-exports, no logic of its own.

**Testable behaviors:**
- [ ] Importing `@constants` exposes exactly these named exports (a compile-time/shape test, e.g. `Object.keys` sanity or just importing each name).
- No branches, no runtime logic — nothing else to unit test.

**Priority:** P2 (pure re-export, no logic).

**Bugs/notes:** None. Note `AGORA_APP_ID` is defined in `app.ts` but **not** re-exported here — anything importing `@constants` cannot get it (must import from `@constants/app` directly). Confirm this is intentional before assuming it's dead.

---

## src/constants/app.ts

**Type:** constants · **Purpose:** App-wide constant values (API config, storage keys, timing, regex, notification paging) sourced from env vars / `expo-constants` with hardcoded fallbacks.

**Exports (all `as const` objects/values, no functions):**
- `APP: { name: 'Mitro Artist', scheme: 'mitroartist' }`
- `API_CONFIG: { baseUrl: string, timeoutMs: number }` — computed from `process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? 'https://api.mitro.app'`, and `Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? extra.apiTimeoutMs ?? 20000)`
- `ALLOW_INSECURE_HTTP: boolean` — `process.env.EXPO_PUBLIC_ALLOW_INSECURE === 'true'`
- `AGORA_APP_ID: string` — `process.env.EXPO_PUBLIC_AGORA_APP_ID ?? ''`
- `SECURE_KEYS: { accessToken, refreshToken }`
- `STORAGE_KEYS: { hasOnboarded, themePreference, lastEmail }`
- `TIMING: { searchDebounceMs: 400, otpResendCooldownSec: 60, otpMaxAttempts: 3, tokenRefreshRetries: 1 }`
- `REGEX: { httpsOnly: /^https:\/\//i }`
- `NOTIFICATIONS: { take: 30, hubPath: '/hubs/notification', hubEvent: 'NotificationReceived' }`

**Testable behaviors:** This is module-level computation driven by `process.env` and `Constants.expoConfig`, evaluated once at import time — testing means mocking `process.env` / `expo-constants` **before** the module is imported (`jest.resetModules()` + re-require pattern), then asserting:
- [ ] `API_CONFIG.baseUrl` falls back correctly through the 3-level chain: env var set → uses it; env unset but `extra.apiBaseUrl` set → uses that; both unset → `'https://api.mitro.app'`.
- [ ] `API_CONFIG.timeoutMs` same 3-level fallback, and that `Number(...)` coercion works for a string env var (e.g. `"15000"` → `15000`), and doesn't produce `NaN` silently for a garbage string (worth documenting current behavior: `Number("abc")` → `NaN`, no guard).
- [ ] `ALLOW_INSECURE_HTTP` is `true` only for the exact string `'true'` — `'TRUE'`, `'1'`, `true` (boolean-typed env, impossible in RN but conceptually), `undefined` all yield `false`.
- [ ] `AGORA_APP_ID` defaults to `''` when unset.
- [ ] `REGEX.httpsOnly` matches `'https://x'`, doesn't match `'http://x'` or `'HTTPS://x'` (it's case-insensitive via `/i` flag — confirm `'HTTPS://x'` DOES match, since flag is present) — worth a test to nail down casing behavior precisely.
- [ ] Static object shapes (`SECURE_KEYS`, `STORAGE_KEYS`, `TIMING`, `NOTIFICATIONS`) — snapshot/shape tests, not really "behavior" but worth locking values since other modules depend on exact key strings (e.g. `notificationHub` uses `NOTIFICATIONS.hubPath`/`hubEvent`).

**Priority:** P0 (feeds API base URL / timeout / insecure-HTTP gate used everywhere; env fallback chain is exactly the kind of logic that silently breaks).

**Bugs/notes:**
- Line 27: large stray whitespace/indentation before the `ALLOW_INSECURE_HTTP` doc comment — cosmetic only, likely an accidental paste artifact, not a functional bug.
- `API_CONFIG.timeoutMs` has no `Number.isNaN` guard — a malformed `EXPO_PUBLIC_API_TIMEOUT_MS` env var silently produces `NaN`, which would flow into axios' `timeout` option. Worth a defensive test / flag for the API client, not fixed here.

---

## src/constants/queryKeys.ts

**Type:** constants (TanStack Query key factory) · **Purpose:** Centralized, type-safe query key factories per domain (auth, profile, settings, earnings, kyc, broadcast, groupCall, rewardOrders, followers, messages, user, home, explore).

**Exports:** `queryKeys` — a single nested `const` object. Every leaf is either a literal tuple (`all`) or a factory function returning a `const` tuple, e.g.:
- `queryKeys.auth.session(): readonly ['auth','session']`
- `queryKeys.auth.stageName(name: string): readonly ['auth','stageName', string]`
- `queryKeys.profile.subcategories(categoryId: string): readonly [...]`
- `queryKeys.earnings.transactions(take: number, skip: number): readonly [...]`
- `queryKeys.broadcast.history(take: number, skip: number)`, `.historySummary()`, `.analytics(broadcastId: string)`
- `queryKeys.groupCall.history(take, skip, status: string)`, `.historySummary(status)`, `.analytics(groupCallId)`
- `queryKeys.rewardOrders.pending()`
- `queryKeys.followers.list()`
- `queryKeys.messages.thread(userId: string)`
- `queryKeys.user.byId(id: string)`
- `queryKeys.explore.search(term: string)`
- ...and each domain's `.all` array.

**Testable behaviors (pure — exact array-equality tests):**
- [ ] Every `.all` literal equals expected tuple, e.g. `queryKeys.auth.all` → `['auth']`.
- [ ] Every factory spreads `.all` correctly and appends args in order, e.g. `queryKeys.earnings.transactions(30, 0)` → `['earnings','transactions',30,0]`.
- [ ] Parameterized keys change identity/value with different args (`queryKeys.user.byId('a')` !== `queryKeys.user.byId('b')` in value), confirming cache-key uniqueness per id.
- [ ] Keys are **new arrays** each call (no caching) — `queryKeys.auth.session() !== queryKeys.auth.session()` by reference but `.toEqual` by value — relevant since TanStack Query does deep-equality on keys, so reference identity doesn't matter, but worth asserting deep-equality.
- [ ] Edge inputs: empty string args (`stageName('')`, `search('')`), numeric zero args (`transactions(0, 0)`), that these don't get special-cased/dropped.

**Priority:** P1 (pure, deterministic, widely used for cache invalidation — a typo here silently breaks invalidation across screens, but it's not "money logic" so not P0).

**Bugs/notes:** None found — consistent factory pattern throughout, no missing `all` spread, no stray literals.

---

## src/utils/responsive.ts

**Type:** pure util (device-metric helpers) · **Purpose:** Percentage-of-screen → dp converters (`wp`/`hp`), a verbatim-passthrough font-size helper (`rf`), and a tablet breakpoint check. Reads `Dimensions.get('window')` **once at module load** into module-level constants `SCREEN_WIDTH`/`SCREEN_HEIGHT`.

**Exports:**
- `SCREEN: { width: number, height: number }` — snapshot of `Dimensions.get('window')` at import time.
- `wp(percentage: number): number` — `Math.round(PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100))`
- `hp(percentage: number): number` — same for height.
- `rf(size: number): number` — `Math.round(PixelRatio.roundToNearestPixel(size))` (no width scaling — returns size back through pixel-rounding only).
- `isTablet(): boolean` — `SCREEN_WIDTH >= 768`

**Testable behaviors:**
- [ ] `wp(0)` → `0`; `wp(100)` → `SCREEN_WIDTH` (rounded); `wp(50)` → half, rounded.
- [ ] `wp(negative)` → negative result (no clamping — document current behavior, e.g. `wp(-10)`).
- [ ] `hp` mirrors `wp` for height.
- [ ] `rf(size)` returns the input size run through `PixelRatio.roundToNearestPixel` then `Math.round` — with `PixelRatio.roundToNearestPixel` mocked as identity, `rf(14)` → `14`; with a mocked ratio (e.g. 2x/3x), verify it snaps to nearest device pixel rather than scaling by width (this is the whole point of the file per its doc comment — must NOT scale by `SCREEN_WIDTH`).
- [ ] `isTablet()` boundary: `SCREEN_WIDTH = 767` → `false`; `768` → `true`; `769` → `true`.
- [ ] `SCREEN` object reflects whatever `Dimensions.get('window')` returned at mock time — testing requires mocking `react-native`'s `Dimensions.get` **before** import (module-level snapshot, not reactive to rotation).

**Priority:** P0 (touches every screen's layout via `wp`/`hp`/`rf`; `rf`'s "no width scaling" contract is a documented, easy-to-regress design decision worth locking in a test).

**Bugs/notes:** `SCREEN`/`SCREEN_WIDTH`/`SCREEN_HEIGHT` are captured once at module import and never updated on rotation/fold — this is presumably intentional for this app's target devices but is a real behavioral fact worth a comment-level test (`wp`/`hp` do NOT react to `Dimensions` change events; no listener is registered).

---

## src/utils/index.ts

**Type:** utils (barrel/re-export) · **Purpose:** Re-exports the public surface of `logger`, `errorHandler`, `responsive`, `notifications`, and `validators`.

**Exports:** `logger`, `Logger` (type), `normalizeError`, `getErrorMessage`, `ERROR_MESSAGES`, `NormalizedError` (type), `wp`, `hp`, `rf`, `isTablet`, `SCREEN`, `resolveNotificationRoute`, `navigateToNotification`, `showNotificationToast`, `notificationVisual`, `NotificationVisual` (type), `LIMITS`, `nameSchema`, `emailSchema`, `passwordSchema`, `usernameSchema`, `otpSchema`, `phoneSchema`, `searchSchema`, `textareaSchema`, `passwordStrength`.

**Testable behaviors:**
- [ ] Each re-exported name is importable from `@utils` and identical (`===`) to the same export from its source module.
- No runtime logic beyond re-export.

**Priority:** P2 (pure re-export).

**Bugs/notes:** `toast.ts`, `earnings.ts`, `press.ts`, `formatElapsed.ts`, and `format.ts` are **not** re-exported here (they're presumably imported directly, e.g. `@utils/format`, `@utils/toast`). Not a bug, just confirms the barrel is partial — don't assume `@utils` exposes everything in the folder. Also confirmed earlier: `mobileSchema`, `authPasswordSchema`, `displayNameSchema`, `stageNameSchema`, `authPasswordStrength` (all exported from `validators.ts`) are likewise omitted from this barrel but are used directly via `@utils/validators` in 8+ screens/hooks — not dead code, just an inconsistent barrel.

---

## src/utils/validators.ts

**Type:** pure util (Zod schema factory + 2 pure functions) · **Purpose:** Single source of truth for all form validation — Zod schemas for name/email/password/username/OTP/phone/search/textarea, plus two independent password-strength scoring functions.

**Exports:**
- `LIMITS: { name:{min:2,max:50}, email:{max:255}, password:{min:8,max:64}, username:{min:3,max:30}, otp:{length:6}, search:{min:1,max:100}, textarea:{min:10,max:500}, phone:{max:16} }`
- `nameSchema: ZodString` — trim, min 2, max 50, regex `^[A-Za-z\s]+$`
- `emailSchema: ZodString` — trim, lowercase, min 1, max 255, `.email()`
- `passwordSchema: ZodString` — min 8, max 64, requires upper+lower+digit+special (4 separate `.regex()` calls, all must pass)
- `usernameSchema: ZodString` — trim, min 3, max 30, regex `^[A-Za-z0-9_]+$`
- `otpSchema: ZodString` — exact length 6, regex `^\d{6}$`
- `phoneSchema: ZodString` — trim, regex E.164 `^\+[1-9]\d{6,14}$`
- `mobileSchema: ZodString` — trim, regex `^\d{10}$` (10-digit national number, no country code)
- `authPasswordSchema: ZodString` — min 8 only (no complexity requirement — deliberately looser than `passwordSchema`)
- `displayNameSchema: ZodString` — trim, min 3, max 24
- `stageNameSchema: ZodString` — trim, min 3, max 20, regex `^[a-z0-9_]+$` (lowercase only, unlike `usernameSchema` which allows mixed case)
- `authPasswordStrength(value: string): number` — 0..3, +1 for length≥8, +1 for digit present, +1 for special-char present (does NOT check upper/lower case, unlike `passwordStrength`)
- `searchSchema: ZodString` — trim, min 1, max 100
- `textareaSchema: ZodString` — trim, min 10, max 500
- `passwordStrength(value: string): number` — 0..4, +1 for length≥8, +1 for (upper AND lower both present, counted as ONE point not two), +1 for digit, +1 for special char

**Exhaustive testable behaviors (Zod schemas — test via `.safeParse()`/`.parse()`):**
- [ ] `nameSchema`: `"John"` passes; `"J"` fails (min 2); 51-char string fails (max 50); `"John123"` fails (regex — digits not allowed); `"  John  "` → trims to `"John"`; `""` fails min; whitespace-only `"   "` → trims to `""` → fails min.
- [ ] `emailSchema`: `"Test@Example.com"` → lowercased to `"test@example.com"`; `""` fails ("Email is required"); 256+ char local part fails max; `"not-an-email"` fails `.email()`; leading/trailing spaces trimmed before validation.
- [ ] `passwordSchema`: `"Abcd123!"` passes (8 chars, all 4 classes); `"abcd123!"` fails (no uppercase); `"ABCD123!"` fails (no lowercase); `"Abcdefg!"` fails (no digit); `"Abcdefg1"` fails (no special char); `"Ab1!"` fails min length; 65-char string fails max.
- [ ] `usernameSchema`: `"john_doe1"` passes; `"jo"` fails min 3; 31-char fails max; `"john doe"` fails regex (space not allowed); `"john-doe"` fails regex (hyphen not allowed).
- [ ] `otpSchema`: `"123456"` passes; `"12345"` fails length; `"1234567"` fails length; `"12345a"` fails regex (non-digit) even though length is 6.
- [ ] `phoneSchema`: `"+919876543210"` passes; `"9876543210"` fails (missing `+`); `"+0123456789"` fails (leading digit after `+` can't be 0 per `[1-9]`); `"+1234567"` (7 digits after country code, min 6+1=7 total after +) — verify boundary exactly at `\d{6,14}`, i.e. `+1` + 6 digits is the shortest valid, `+1`+14 digits the longest.
- [ ] `mobileSchema`: `"9876543210"` (10 digits) passes; `"987654321"` (9) fails; `"98765432101"` (11) fails; `"+919876543210"` fails (regex is exactly `^\d{10}$`, no `+` allowed).
- [ ] `authPasswordSchema`: `"12345678"` passes (length only, no complexity); `"1234567"` fails.
- [ ] `displayNameSchema`: `"Jo"` fails (min 3); `"Joe"` passes; 24-char passes; 25-char fails; trims whitespace.
- [ ] `stageNameSchema`: `"abc_123"` passes; `"ABC"` fails regex (uppercase not allowed, unlike `usernameSchema`); `"ab"` fails min 3; 21-char fails max 20.
- [ ] `searchSchema`: `""` fails min 1; 100-char passes; 101-char fails; trims.
- [ ] `textareaSchema`: 9-char fails min 10; 10-char passes; 500-char passes; 501-char fails; trims (so a 10-char string padded with spaces to look longer could trim below min — worth a specific test: `"  short  "` after trim might fall under 10 even if raw length ≥10).

**`authPasswordStrength` (pure function, 0..3):**
- [ ] `""` → 0
- [ ] `"1234567"` (7 chars, has digit) → 1 (digit only, length<8)
- [ ] `"abcdefgh"` (8 chars, no digit, no special) → 1 (length only)
- [ ] `"abcdefg1"` (8 chars + digit, no special) → 2
- [ ] `"abcdefg1!"` (8+ chars, digit, special) → 3
- [ ] `"!!!"` (special only, no length, no digit) → 1
- [ ] Score is a simple sum — no upper/lower check at all (distinguish from `passwordStrength`).

**`passwordStrength` (pure function, 0..4):**
- [ ] `""` → 0
- [ ] `"abcdefgh"` (8 chars, no upper, no digit/special) → 1
- [ ] `"Abcdefgh"` (8 chars + upper+lower) → 2
- [ ] `"Abcdefg1"` (8 chars + case + digit) → 3
- [ ] `"Abcdefg1!"` (all four) → 4
- [ ] `"ABCDEFGH"` (only uppercase, no lowercase) → upper/lower point NOT awarded (requires both) → 1 (length only)
- [ ] `"abcdefg1!"` (lowercase + digit + special, no uppercase) → 3, not 4 (case point requires BOTH cases)
- [ ] 7-char password with digit+special+mixed case → case point + digit point + special point but NOT length point → 3 (verifies the length gate is independent from the others).

**Priority:** P0 (auth/validation logic used across every form screen — exactly the "money/auth/validation" category called out).

**Bugs/notes:**
- `authPasswordStrength` and `passwordStrength` are near-duplicates with subtly different scoring (3 vs 4 points, different upper/lower handling) and different call sites — not a bug, but a real footgun: a test suite (or a future refactor) could easily conflate the two. Worth flagging as "two similarly-named, differently-scored functions — verify each call site uses the intended one" (`PasswordStrengthMeter` component and `useStageNameAvailability`/register flow both reference schemas from this file — confirm which strength fn each uses).
- `usernameSchema` allows mixed-case + digits + underscore; `stageNameSchema` allows lowercase-only + digits + underscore — both exist and are easy to confuse; worth a test asserting they reject each other's edge cases (e.g. uppercase stage name).

---

## src/utils/earnings.ts

**Type:** pure util (lookup-table label/icon resolvers) · **Purpose:** Maps server `sourceType` codes to display labels/icons/hints, for the Earnings breakdown (app-native styling) and separately for the Transaction History screen (verbatim web parity).

**Exports:**
- `sourceLabel(sourceType: string): string` — `SOURCE_META[sourceType]?.label ?? titleCase(sourceType.replace(/_/g,' '))`
- `sourceIcon(sourceType: string): FeatherIconName` — `SOURCE_META[sourceType]?.icon ?? 'zap'`
- `webSourceLabel(sourceType: string): string` — `WEB_SOURCE_LABELS[sourceType] ?? sourceType.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())`
- `webSourceHint(sourceType: string): string` — `WEB_SOURCE_HINTS[sourceType] ?? 'Coins earned from this activity.'`

Known keys in all three maps: `private_call_minute` (SOURCE_META only — not in WEB_* maps), `private_call_initial_5_minutes`, `fun_wheel_spin`, `reward_purchase`, `highlighted_message`, `reaction`, `group_call_entry`.

**Exhaustive testable behaviors:**
- [ ] `sourceLabel('private_call_minute')` → `'Private / min'`
- [ ] `sourceLabel('fun_wheel_spin')` → `'Fun wheel'`
- [ ] `sourceLabel('unknown_type')` → falls back to `titleCase('unknown type')` → `'Unknown type'` (only first letter capitalized, not title-cased per-word — confirm `titleCase` from `format.ts` is single-letter-cap, not "Title Case Every Word").
- [ ] `sourceLabel('')` → `SOURCE_META['']` is undefined → `titleCase('')` → `''` (since `format.ts`'s `titleCase('')` returns `''` for zero-length).
- [ ] `sourceIcon('reaction')` → `'heart'`; `sourceIcon('unknown')` → `'zap'`.
- [ ] `webSourceLabel('private_call_initial_5_minutes')` → `'Private Call (First 5 Minutes)'`
- [ ] `webSourceLabel('private_call_minute')` → **NOT** in `WEB_SOURCE_LABELS`, falls back to generic prettify: `'private_call_minute'.replace(/_/g,' ')` → `'private call minute'`, then `.replace(/\b\w/g, up)` → `'Private Call Minute'` (per-word capitalization — different fallback shape than `sourceLabel`'s `titleCase`, which only caps the first letter). This divergence between the two fallbacks is a real, distinct testable behavior.
- [ ] `webSourceLabel('')` → `''.replace(...)` → `''`.
- [ ] `webSourceHint('reward_purchase')` → the exact hint string; `webSourceHint('nonexistent')` → `'Coins earned from this activity.'`.
- [ ] All 6 `SOURCE_META` keys × all 6 `WEB_SOURCE_LABELS`/`WEB_SOURCE_HINTS` keys should be enumerated in a table-driven test to lock every label/icon/hint string exactly (these are user-facing copy — any accidental edit should fail a test).

**Priority:** P0 (money-earnings display logic, shown on every Earnings/Transactions screen; fallback-string logic is genuinely branchy and easy to regress).

**Bugs/notes:**
- `SOURCE_META` includes `private_call_minute`, but `WEB_SOURCE_LABELS`/`WEB_SOURCE_HINTS` do **not** — so `webSourceLabel('private_call_minute')` and `webSourceHint('private_call_minute')` both silently fall back to generic copy instead of a curated one, even though the equivalent web-native `sourceLabel`/`sourceIcon` have a curated entry for it. This may be intentional (comment says "verbatim from Artist Web lines 47-54" — if the web itself doesn't have this key, this is parity, not a bug) but it's a real asymmetry worth a test to lock in and flag to the team since it's a plausible copy-paste gap.
- `titleCase` (from `format.ts`, used by `sourceLabel`'s fallback) capitalizes only the first character; `webSourceLabel`'s fallback capitalizes every word — two different "unknown type" formats reach the UI depending on which function is called. Worth confirming this divergence is intentional (per the file's own comment, it says these are "deliberately separate" — but only justifies why they're separate functions, not why their *fallback casing* differs).

---

## src/utils/logger.ts

**Type:** pure-ish util (the sanctioned logging façade; has one non-pure branch: `__DEV__`/`Constants` global reads) · **Purpose:** Single logging entry point with dev/prod branching and automatic redaction of sensitive fields before any output.

**Exports:**
- `logger: { debug(message, meta?), info(message, meta?), warn(message, meta?), error(message, meta?) }` — all `(message: string, meta?: Record<string, unknown>) => void`
- `Logger` (type) — `typeof logger`

**Internal (not exported, but indirectly testable via `logger.*` output):** `isDev()`, `isSensitiveKey(key)`, `redact(value, seen)`, `write(level, message, meta)`, `report(level, message, meta)` (no-op stub).

**Exhaustive testable behaviors (mock `console.*`, mock `__DEV__`/`Constants.expoConfig`):**
- [ ] `logger.debug(msg, meta)` in dev (`__DEV__=true` AND `Constants.expoConfig.extra.apiBaseUrl !== undefined`) → calls `console.log('[DEBUG]', msg, redactedMeta)`.
- [ ] `logger.debug(msg)` when `__DEV__=false` → no console call at all (not even suppressed-but-called; literally short-circuited by `isDev()`).
- [ ] `logger.debug(msg)` when `__DEV__=true` but `Constants.expoConfig.extra.apiBaseUrl === undefined` → **also silent** (see bug note below) — `isDev()` returns false.
- [ ] `logger.info/warn/error` always call `write()` regardless of `isDev()` — but `write()` itself branches on `__DEV__` (not `isDev()`) for whether to hit console vs `report()`.
- [ ] In dev (`__DEV__=true`): `logger.info` → `console.log('[INFO]', msg, meta?)`; `logger.warn` → `console.warn('[WARN]', ...)`; `logger.error` → `console.error('[ERROR]', ...)`. Verify tag casing and that `meta` is omitted from args entirely when `undefined` (not passed as `undefined`) vs included when present.
- [ ] In prod (`__DEV__=false`): `logger.info` → no console call AND `report()` NOT called (only warn/error call `report`). `logger.warn`/`logger.error` → no console call, but `report(level, message, safeMeta)` invoked (currently a no-op, so only testable by exposing/mocking `report` — since it's not exported, this may only be testable via a spy that will never trigger visible side effects; document as "currently unobservable from outside the module").
- [ ] Redaction: `redact({password: 'x', nested: {token: 'y'}})` → `{password: '[REDACTED]', nested: {token: '[REDACTED]'}}`.
- [ ] `isSensitiveKey` matching is case-insensitive and strips non-letters before matching (`normalized = key.toLowerCase().replace(/[^a-z]/g,'')`) — so `"Access-Token"` → `"accesstoken"` → matches `'accesstoken'` in the list; `"confirm_password"` → `"confirmpassword"` → matches; `"my_pin_code"` → `"mypincode"` → **still matches** because it merely does `.includes('pin')` and `"mypincode"` contains `"pin"` — a **false-positive redaction** risk worth testing explicitly (e.g. `"opinion"` → `"opinion"` contains `"pin"` → also falsely redacted! `"pinion"` isn't a real field but `"discipline"` contains none of the keys — still, any key containing the substring `"pin"`, `"otp"`, `"ssn"`, `"cvv"`, `"secret"`, `"token"` anywhere will be redacted even if unrelated, e.g. a field named `"skinTone"` contains no match, but `"campaign"` contains `"pin"` → **redacted incorrectly**). This substring-match-after-stripping-non-letters is a real, testable false-positive surface.
- [ ] `redact` handles circular references: `const a = {}; a.self = a; redact(a)` → `{self: '[Circular]'}` without stack overflow.
- [ ] `redact` handles arrays: `redact([{password:'x'}, 'plain'])` → `[{password:'[REDACTED]'}, 'plain']`.
- [ ] `redact(null)` → `null`; `redact(42)` → `42`; `redact('str')` → `'str'` (primitives pass through unchanged, object check is `typeof !== 'object'` so this also lets functions pass through as-is, worth noting — `redact` is not designed to catch functions in meta, though metadata realistically won't contain functions).
- [ ] `redact` called with no `meta` argument at all (`logger.info('msg')`) → `write` computes `safeMeta = undefined`, no crash.

**Priority:** P0 (used everywhere; the redaction logic directly guards against leaking tokens/passwords into logs — a real security-adjacent surface, and the substring false-positive is a genuine, demonstrable defect class worth testing even if judged low-severity).

**Bugs/notes:**
- **Lines 34–35 (`isDev`)**: `const isDev = () => Constants.expoConfig?.extra?.apiBaseUrl !== undefined && __DEV__;` — `logger.debug()` is gated not just on `__DEV__` but also on `extra.apiBaseUrl` being present in the Expo config `extra` block. Since `API_CONFIG.baseUrl` in `constants/app.ts` primarily reads `process.env.EXPO_PUBLIC_API_BASE_URL` (with `extra.apiBaseUrl` only as a secondary fallback), a dev build that sets the API URL purely via the `EXPO_PUBLIC_*` env var (and never populates `app.json`'s `extra.apiBaseUrl`) will have `isDev()` return `false` and **`logger.debug` will silently never log, even in development**. This looks like an accidental coupling to an unrelated config field rather than a deliberate dev/prod switch — flag explicitly, don't fix.
- **`isSensitiveKey`** (lines 37-40): substring matching after stripping non-letter characters causes false positives on innocuous keys that merely *contain* a sensitive substring (e.g., any key containing `"pin"`, `"otp"`, `"ssn"`, `"token"`, `"secret"`, `"cvv"` as a substring — `"campaign"`, `"skinTone"` variants, `"hotpath"` contains `"otp"`, etc.) — worth a table-driven test enumerating both true positives and these false positives to document current (possibly-intended, over-cautious) behavior.
- `report()` is an intentional no-op stub (documented) — not a bug, just currently unobservable/untestable beyond "doesn't throw."

---

## src/utils/format.ts

**Type:** pure util (display formatters) · **Purpose:** Every number/date/duration formatter used for consistent display across the app (compact counts, token labels, grouped thousands, initials, dates, durations, relative time).

**Exports (all pure functions):**
- `compactCount(value: number): string`
- `formatTokens(value: number): string` — `` `${compactCount(value)} coins` ``
- `grouped(value: number): string`
- `initialsFrom(name: string | undefined | null): string`
- `titleCase(value: string): string`
- `shortDate(iso: string): string`
- `shortDateTime(iso: string): string`
- `duration(seconds: number): string`
- `webDuration(seconds: number | null | undefined): string`
- `webDateTime(iso: string): string`
- `relativeShort(iso: string): string`
- `shortWeekday(iso: string): string`

**Exhaustive testable behaviors:**

`compactCount`:
- [ ] `0` → `'0'`; `999` → `'999'` (branch: `<1000`)
- [ ] `1000` → `'1k'` (exactly at boundary, `.toFixed(1)` trimmed of `.0`)
- [ ] `1240` → `'1.2k'`
- [ ] `9999` → `'10.0'` rounds up on `.toFixed(1)` → trimmed → `'10k'` (edge: still `<10_000` bucket but displays "10k", not "9999" or "10.0k")
- [ ] `10_000` → `'10.0K'` → trimmed → `'10K'` (branch: `<1_000_000`, uppercase K)
- [ ] `48_200` → `'48.2K'`
- [ ] `999_999` → `'1000.0'` → trimmed → `'1000K'` (edge: rounds to look like a million but stays in the K bucket/branch — a real display oddity worth locking with a test)
- [ ] `1_000_000` → `'1.0M'` → trimmed → `'1M'`
- [ ] `2_500_000` → `'2.5M'`
- [ ] Negative input, e.g. `-5` → `'-5'` (falls into `<1000` branch, returned verbatim — no negative-number formatting exists past that, e.g. `-1500` → `'-1.5k'`, since `-1500 < 1000` is true, so actually ALL negative numbers hit the first branch regardless of magnitude — worth a test confirming `compactCount(-50000)` → `'-50000'`, not `'-50K'`, since `-50000 < 1000` is true).

`formatTokens`: `formatTokens(1240)` → `'1.2k coins'`; `formatTokens(0)` → `'0 coins'`.

`grouped`:
- [ ] `18552` → `'18,552'`
- [ ] `0` → `'0'`
- [ ] `999` → `'999'` (no comma under 1000)
- [ ] `1000` → `'1,000'`
- [ ] `1234.567` → `Math.round` first → `1235` → `'1,235'` (confirms rounding happens before grouping, and rounds .567 up)
- [ ] `1234.4` → rounds to `1234` → `'1,234'`
- [ ] Negative: `-18552` → confirm exact output (likely `'-18,552'` — regex should still group digits correctly ignoring the sign, verify with an actual test since the lookahead-based regex interacts with the leading `-` character in a non-obvious way).
- [ ] `1_000_000` → `'1,000,000'` (multi-group).

`initialsFrom`:
- [ ] `'John'` → `'JO'`
- [ ] `'J'` → `'J'` (single char, slice(0,2) of length-1 string)
- [ ] `undefined` → `'?'`; `null` → `'?'`
- [ ] `''` (empty string, NOT nullish) → `''` (does **not** fall back to `'?'` since `?? '?'` only substitutes on `null`/`undefined`, not `''`) — flag as edge case worth explicit test/decision.
- [ ] `'john'` (lowercase) → `'JO'` (uppercased regardless of input case)
- [ ] Multi-byte/emoji names, e.g. `'😀name'` — `.slice(0,2)` on a string with a surrogate pair could split a code point in half; worth at least one test documenting current (likely broken-glyph) behavior, not necessarily fixing it.

`titleCase`:
- [ ] `'pending'` → `'Pending'`
- [ ] `''` → `''` (guarded by `value.length` ternary)
- [ ] `'Pending'` (already capitalized) → `'Pending'` (no-op, idempotent)
- [ ] `'p'` (single char) → `'P'`
- [ ] Only the FIRST character is capitalized — `'multi word string'` → `'Multi word string'` (rest untouched, including subsequent words) — distinct from `webSourceLabel`'s per-word capitalization in `earnings.ts`.

`shortDate`/`shortDateTime`/`webDateTime`:
- [ ] Valid ISO string → correctly formatted locale string (mock `Date`/locale or just assert shape via regex, since exact locale-rendering is environment-dependent — tests should pin `Intl`/timezone or accept a pattern match).
- [ ] Invalid ISO string (e.g. `'not-a-date'`) → all three return `''` (guarded by `Number.isNaN(date.getTime())`).
- [ ] Empty string `''` as input → `new Date('')` is `Invalid Date` → `''`.

`duration`:
- [ ] `0` → `'0s'`
- [ ] `44` → `'44s'`
- [ ] `59` → `'59s'`
- [ ] `60` → `'1m'` (branch switch to minutes)
- [ ] `59.9` (fractional, `<60`) → `Math.round(59.9)` = `60` → but STILL takes the `<60` string branch since the `<60` check is on the raw `seconds` param, not the rounded value — so `duration(59.9)` → `'60s'`, a real edge case: the branch decision uses unrounded input while the displayed value is rounded, producing a `"60s"` output even though 60 seconds "should" be `"1m"` per the `>=60` rule — worth flagging as a genuine inconsistency to test/document.
- [ ] `61` → totalMinutes = round(61/60)=1 → `'1m'`
- [ ] `90` → totalMinutes = round(1.5)=2 (rounds half up per JS `Math.round`) → `'2m'`
- [ ] `3600` → totalMinutes=60, hours=1, minutes=0 → `'1h 0m'`
- [ ] `4800` (1h 20m) → `'1h 20m'`
- [ ] Negative seconds, e.g. `-5` → `<60` branch → `Math.max(0, Math.round(-5))` → `'0s'` (clamped, confirmed safe — contrast with `formatElapsed.ts` which has no such clamp).

`webDuration`:
- [ ] `null` → `'—'`; `undefined` → `'—'`
- [ ] `0` → `'0m 0s'`
- [ ] `65` → `'1m 5s'`
- [ ] `3661` → `'61m 1s'` (never rolls up to hours, unlike `duration` — confirmed distinct contract)
- [ ] `-10` → `Math.max(0, Math.floor(-10))` → `0` → `'0m 0s'` (clamped)
- [ ] Fractional: `65.9` → `Math.floor` → `65` → `'1m 5s'`

`relativeShort`:
- [ ] Invalid ISO → `''`
- [ ] `Date.now()` (0 min ago) → `'NOW'`
- [ ] 30 seconds ago (`minutes=0`, `<1`) → `'NOW'`
- [ ] 5 minutes ago → `'5M'`
- [ ] 59 minutes ago → `'59M'`
- [ ] 60 minutes ago → hours branch → `'1H'`
- [ ] 23 hours ago → `'23H'`
- [ ] 24 hours ago → days branch → `'1D'`
- [ ] 6 days ago → `'6D'`
- [ ] 7 days ago → falls through to `shortDate(iso)` (e.g. `'Aug 17'`)
- [ ] **Future timestamp** (iso later than now) → `minutes` is negative → `minutes < 1` is `true` → returns `'NOW'` for ANY future time, no matter how far — a real, testable (likely unintended) edge case worth flagging: a clock-skewed server timestamp slightly in the future would display "NOW" rather than erroring or showing something sensible.

`shortWeekday`:
- [ ] Valid ISO → 3-letter weekday (e.g. `'Mon'`)
- [ ] Invalid ISO → `''`

**Priority:** P0 — this is the canonical example of the "money/formatting used across many screens" category (tokens, earnings totals, durations, dates all funnel through here).

**Bugs/notes:**
- `duration()`: the `<60` branch check uses the raw `seconds` argument while the returned string uses `Math.round(seconds)` — for input `59.5`–`59.999...`, the branch takes the seconds path but rounds up to display `"60s"`, which visually reads like it should have taken the minutes branch. Flag as a genuine boundary inconsistency (file/line: `src/utils/format.ts:74-77`).
- `relativeShort()`: no floor/clamp on negative `minutes` — any future ISO timestamp displays `'NOW'` (file/line: `src/utils/format.ts:130-133`). Contrast with `duration`/`webDuration`, which both explicitly `Math.max(0, ...)` their inputs; `relativeShort` has no equivalent guard, just an implicit one via the `<1` check swallowing negatives.
- `compactCount()`: negative numbers of any magnitude fall into the `<1000` branch and are returned as plain integers with no `k`/`K`/`M` suffix ever applied (since every subsequent check is also "less than a positive threshold" and thus trivially true for negatives) — confirmed via code reading, not just inference (file/line: `src/utils/format.ts:10-20`).
- `initialsFrom('')` returns `''`, not `'?'` — the nullish-coalescing operator doesn't catch empty string (file/line: `src/utils/format.ts:39-40`).

---

## src/utils/toast.ts

**Type:** util (thin wrapper around `react-native-toast-message`, side-effecting) · **Purpose:** Two independent toast systems: `showToast` (legacy "appNotification" card, ~28 existing call sites) and `showPopupToast`/`hidePopupToast` (new "popupToast" card, web-parity for forms/auth/API feedback).

**Exports:**
- `ToastKind = 'success' | 'error' | 'info'` (type)
- `showToast(message: string, kind: ToastKind = 'info', detail?: string): void`
- `PopupToastType = 'success' | 'error' | 'warning' | 'alert' | 'info'` (type)
- `POPUP_TOAST_DURATION_MS = 3500`
- `POPUP_TOAST_TYPE = 'popupToast'`
- `showPopupToast(message: string, type: PopupToastType = 'info'): void`
- `hidePopupToast(): void`

**Testable behaviors (mock `react-native-toast-message`'s `Toast.show`/`Toast.hide`, assert call args):**
- [ ] `showToast('msg')` → `Toast.show` called with `{type:'appNotification', text1:'msg', text2:undefined, props:{type:'info'}, position:'top', visibilityTime:3000}` (default `kind='info'`).
- [ ] `showToast('msg', 'error', 'detail')` → `text2:'detail'`, `props:{type:'error'}`.
- [ ] `showToast('msg', 'success')` → `props:{type:'success'}`.
- [ ] `showPopupToast('msg')` → default `type='info'`, `Toast.show` called with `{type:'popupToast', text1:'msg', props:{type:'info'}, position:'top', topOffset:0, visibilityTime:3500, autoHide:true}`.
- [ ] `showPopupToast('msg', 'warning')` → `props:{type:'warning'}`.
- [ ] `showPopupToast('')` (empty message) → **early return, `Toast.show` NOT called at all** — this is the one real branch in the file.
- [ ] `showPopupToast('   ')` (whitespace-only) → **not** trimmed/guarded — `!message` is falsy only for empty string, so a whitespace-only string DOES call `Toast.show` (worth testing this asymmetry vs the empty-string guard).
- [ ] `hidePopupToast()` → calls `Toast.hide()` with no args.
- [ ] `showToast` has NO empty-message guard (`showToast('')` still calls `Toast.show` unconditionally) — asymmetric with `showPopupToast`'s guard; worth a test documenting the difference.

**Priority:** P1 (branchy enough — default params, one guard clause, two independent toast systems that are easy to conflate — but it's UI-feedback plumbing, not money/auth logic, so not P0).

**Bugs/notes:** `showPopupToast` guards against falsy `message` but not whitespace-only strings (`!message` doesn't catch `'   '`); `showToast` has no such guard at all — the two functions are inconsistent in this respect. Not necessarily a bug (may be intentional, since `showToast`'s call sites presumably always pass real content) but worth flagging as an inconsistency between the two "toast" APIs living side by side.

---

## src/utils/errorHandler.ts

**Type:** pure util (error normalization) · **Purpose:** Converts any thrown value (Axios error, plain `Error`, string, already-normalized `AuthError`) into a safe `NormalizedError` with user-facing copy — the single place raw API error bodies are parsed.

**Exports:**
- `ERROR_MESSAGES: { network, timeout, unauthorized, forbidden, notFound, rateLimited, server, validation, unknown }` — 9 literal strings.
- `class AuthError extends Error` — marker class; constructor `(message: string)`, sets `this.name = 'AuthError'`.
- `interface NormalizedError { message: string; status?: number; code?: string; isNetworkError: boolean }`
- `normalizeError(error: unknown): NormalizedError`
- `getErrorMessage(error: unknown): string` — `normalizeError(error).message`

**Internal (not exported but fully exercised through `normalizeError`):** `isAxiosError`, `messageForStatus`, `validationMessage`, `text`, `clientMessage`.

**Exhaustive testable behaviors (via `normalizeError`, mocking axios-error shapes):**

Axios branch (`error.isAxiosError === true`):
- [ ] `error.code === 'ECONNABORTED'` → `{message: ERROR_MESSAGES.timeout, code:'ECONNABORTED', isNetworkError:true}` (checked BEFORE the `!error.response` check — verify this ordering: a timeout with no response still hits this branch first).
- [ ] No `error.response` (network error, no timeout code) → `{message: ERROR_MESSAGES.network, code: error.code, isNetworkError:true}`.
- [ ] `error.response.status = 401`, no body → `messageForStatus(401)` → `ERROR_MESSAGES.unauthorized`; `isNetworkError:false`; `status:401`.
- [ ] `403` → forbidden; `404` → notFound; `422` → validation; `429` → rateLimited; `500`/`503`/any `>=500` → server; any other unlisted 4xx (e.g. `418`, `400`) → falls to `messageForStatus`'s final `return ERROR_MESSAGES.unknown` UNLESS `clientMessage` supplies a body-derived message first (see below — `400` is `<500` so `clientMessage` is tried first).
- [ ] **Server message preferred for 4xx**: `status=400`, body `{message:'Account not found.'}` → returned message is `'Account not found.'`, NOT the generic unknown/validation copy.
- [ ] Body is `ApiErrorBody` with `errors: {StageName:['must be at least 6 chars']}` (ASP.NET ProblemDetails) → `validationMessage` extracts `'must be at least 6 chars'` (first non-empty string found, iterating `Object.values(errors)` in insertion order) — this is the HIGHEST priority field, checked before `message`/`error`/`detail`/`title`.
- [ ] `errors` value can be a single string instead of an array (`errors: {Field: 'msg'}` not `errors: {Field: ['msg']}`) — `validationMessage` normalizes via `Array.isArray(value) ? value : [value]`, so both shapes work.
- [ ] `errors` with an empty array for a field (`{Field: []}`) → that field contributes nothing, function continues to next field or returns `null` if no field has a non-empty string.
- [ ] `errors` with whitespace-only string (`{Field: ['   ']}`) → `entry.trim().length > 0` is `false` → skipped, not returned.
- [ ] Body has NO `errors` but has `message: 'custom'` → returns `'custom'` (2nd priority).
- [ ] Body has `error: 'custom'` only (no `message`) → 3rd priority.
- [ ] Body has `detail: 'custom'` only → 4th priority.
- [ ] Body has `title: 'One or more validation errors occurred.'` only (bare ProblemDetails with no `errors` object, or `errors` object present but empty) → 5th/last priority, falls to `title`.
- [ ] Body is a bare string (not JSON) e.g. `"Bad request"` → `clientMessage` short-circuits to `text(body)` → `'Bad request'`.
- [ ] Body is `undefined`/`null`/`{}` (no usable field) → `clientMessage` returns `null` → falls back to `messageForStatus(status)`.
- [ ] `status >= 500` → `clientMessage` returns `null` UNCONDITIONALLY (body ignored entirely, even if it has a nice `message`) → always `messageForStatus` → `ERROR_MESSAGES.server`. This is a deliberate, testable branch: confirm a 500 with a helpful body message is still shown the generic "server" copy, never the raw body.
- [ ] `code` extraction: `body?.code` used when body is an object; `undefined` when body is a string.
- [ ] `logger.warn('API error', {...})` is called for every axios-response branch (spy on `logger.warn` to confirm it fires with `{status, url, code}`).

Non-axios branches:
- [ ] `error instanceof AuthError` → `{message: error.message, isNetworkError:false}` — **no `logger` call** (explicitly not re-logged, per comment) — confirm via spy that `logger.error`/`logger.warn` are NOT called for this branch.
- [ ] `error instanceof Error` (plain, not AuthError) → `{message: ERROR_MESSAGES.unknown, isNetworkError:false}`, AND `logger.error('Unhandled error', {name, message})` IS called (verify original error's real message is logged even though the user-facing message is generic).
- [ ] `error` is a plain string, e.g. `throw 'oops'` → not `instanceof Error`, not `AuthError`, not axios → falls to final `else` → `logger.error('Unknown error value', {value: String(error)})` → `{message: ERROR_MESSAGES.unknown, isNetworkError:false}`.
- [ ] `error` is `undefined`/`null`/a number/an object without `isAxiosError` → same final branch, `String(error)` correctly stringifies (`String(null)` → `'null'`, `String(undefined)` → `'undefined'`, `String(42)` → `'42'`).

`getErrorMessage`:
- [ ] `getErrorMessage(anyError)` === `normalizeError(anyError).message` for every case above (thin wrapper, but worth 2-3 spot tests).

`AuthError` class:
- [ ] `new AuthError('msg').name === 'AuthError'`
- [ ] `new AuthError('msg') instanceof Error === true`
- [ ] `new AuthError('msg').message === 'msg'`

**Priority:** P0 — explicitly money/auth/validation-adjacent (this is THE function that decides what error text a user sees for every failed API call across the whole app, including auth 401s and payment/earnings-related validation errors).

**Bugs/notes:**
- `messageForStatus` has no explicit `400` case — a bare `400` with no usable body message falls all the way to the final `return ERROR_MESSAGES.unknown`, not `ERROR_MESSAGES.validation` — worth confirming this is intentional (only `422` maps to "validation" copy; a `400` model-binding error either gets a body-derived message via `clientMessage` first, or falls to the generic "unknown" message, not "Please check the highlighted fields"). This is a plausible mismatch worth a test + flag, not a fix.
- No functional bugs found otherwise — the priority-ordering (`errors` > `message` > `error` > `detail` > `title`) is deliberate and well-documented, and is exactly the kind of thing that should be locked down with tests since a body-shape change from the backend would silently break user-facing copy.

---

## src/utils/press.ts

**Type:** pure util (RN `Pressable` style-callback factory) · **Purpose:** One shared "dim while pressed" interaction style so every tappable element in the app has consistent feedback.

**Exports:** `pressable(base?: StyleProp<ViewStyle>) => ({pressed}: {pressed: boolean}) => StyleProp<ViewStyle>`

**Exhaustive testable behaviors:**
- [ ] `pressable(baseStyle)({pressed: true})` → `[baseStyle, {opacity: 0.62}]` (array, second element is the `styles.pressed` StyleSheet-created object).
- [ ] `pressable(baseStyle)({pressed: false})` → `[baseStyle, null]`.
- [ ] `pressable()({pressed: true})` (no base arg) → `[undefined, {opacity: 0.62}]`.
- [ ] `pressable()({pressed: false})` → `[undefined, null]`.
- [ ] `pressable(baseStyle)` returns a NEW closure each call (not memoized) — calling it twice with the same `{pressed}` produces two array instances that are `.toEqual` but not `===` — worth noting if any consumer does reference-equality checks (unlikely, but a real fact about the function).

**Priority:** P2 (trivial, single ternary-equivalent branch, no money/auth/validation logic — but it IS genuinely branching so borderline P1; given how small/mechanical it is, P2 is fair, though a quick 4-case test table is nearly free).

**Bugs/notes:** None.

---

## src/utils/notifications.ts

**Type:** util (routing/visual resolution + 2 side-effecting functions) · **Purpose:** Central place mapping a `NotificationItem` to (a) the screen it should navigate to, (b) its icon/tint, and (c) triggering navigation/toast side effects — used identically whether the notification came from the realtime hub, a push tap, or the in-app list.

**Exports:**
- `resolveNotificationRoute(item: Pick<NotificationItem,'type'|'actionUrl'|'referenceId'>): string` — **pure**, the main logic to test.
- `interface NotificationVisual { icon: LucideIconName; tint: string; fill: string }`
- `notificationVisual(type: string): NotificationVisual` — **pure** lookup with fallback.
- `navigateToNotification(item: NotificationItem): void` — side-effecting (`router.push`).
- `showNotificationToast(item: NotificationItem): void` — side-effecting (`Toast.show`, with an `onPress` closure calling `Toast.hide()` + `navigateToNotification(item)`).

**Exhaustive testable behaviors:**

`resolveNotificationRoute` (4 branches, precise priority order):
- [ ] `type='private_message'` (regardless of `actionUrl`/`referenceId`, even if `actionUrl` is also a valid `/`-prefixed path) → `'/(app)/(tabs)/me/messages'` — **this branch wins over `actionUrl`**, confirm with a case where `actionUrl='/(app)/(tabs)/home/notifications'` is ALSO set, to prove `private_message` overrides it.
- [ ] `type` is anything else, `actionUrl` starts with `'/'` → returns `actionUrl` verbatim (e.g. `'/(app)/(tabs)/home'`).
- [ ] `actionUrl` does NOT start with `'/'` (e.g. `'https://...'`, `''`, or `'private-messages'` relative path) → falls through, does NOT return it.
- [ ] `actionUrl=null`, `type='private_call_request'`, `referenceId='abc'` → `'/(app)/(modals)/incoming-call-request?requestId=abc'`.
- [ ] `type='private_call_request'` but `referenceId=null` → does NOT take that branch (both conditions required) → falls to final default.
- [ ] `type='private_call_request'`, `actionUrl` is a `/`-prefixed User-web route (per the comment, e.g. `'/private-messages'` which DOES start with `/`) → **actionUrl branch wins** since it's checked before the `private_call_request` branch — confirms the check order is: `private_message` type > `actionUrl` prefix > `private_call_request`+referenceId > default. Worth a targeted test since the code comment explicitly calls out this exact scenario as the reason for checking `private_message` FIRST (before `actionUrl`) but the `private_call_request` case is checked AFTER `actionUrl` — asymmetric treatment of the two special types, correctly documented but easy to break silently.
- [ ] All other type/actionUrl combos (unknown type, no actionUrl, no referenceId) → `'/(app)/(tabs)/home/notifications'` (default fallback).
- [ ] `actionUrl=''` (falsy but not null) → `''.startsWith('/')` is `false` → doesn't match branch 2 → correctly falls through.

`notificationVisual`:
- [ ] Every one of the 9 explicit keys (`private_call_request`, `private_message`, `new_follower`, `kyc_approved`, `kyc_rejected`, `account_status_changed`, `system`, `success`, `error`, `info`) returns its exact `{icon, tint, fill}` triple — table-driven test locking all 9.
- [ ] Unknown type (e.g. `'foo'`, `''`) → `DEFAULT_VISUAL = {icon:'bell', tint:colors.pink, fill:colors.pinkSoft}`.

`navigateToNotification` (side effect, mock `expo-router`'s `router.push`):
- [ ] Calls `router.push(resolveNotificationRoute(item))` — verify it delegates to the pure function rather than duplicating routing logic (spy on `resolveNotificationRoute` isn't directly mockable since it's in the same module — instead assert `router.push` was called with the SAME value `resolveNotificationRoute(item)` would independently produce, for a few representative items).

`showNotificationToast` (side effect, mock `react-native-toast-message`):
- [ ] `Toast.show` called with `{type:'appNotification', text1:item.title, text2:item.body, props:{type:item.type}, onPress: fn}`.
- [ ] Invoking the captured `onPress` callback calls `Toast.hide()` THEN `navigateToNotification(item)` (order matters — assert call order via a jest mock call-order check or sequential spies).

**Priority:** P1 (genuinely branching, used by 3 entry points per its own doc comment — hub, push, in-app toast — but it's routing/UI-chrome logic, not money/auth, so P1 not P0; the priority-order subtlety between `private_message` and `private_call_request` handling makes it worth real test coverage though).

**Bugs/notes:** The asymmetry between `private_message` (checked before `actionUrl`) and `private_call_request` (checked after `actionUrl`) is explicitly explained in the code comment for the `private_message` case only — it does not explain why `private_call_request` is NOT given the same override treatment. Not necessarily a bug (may be intentional: server's `actionUrl` might correctly cover call-requests in some cases) but it's an asymmetric priority order that's easy to break in a refactor and deserves a locking test.

---

## src/utils/formatElapsed.ts

**Type:** pure util (single formatter) · **Purpose:** `mm:ss` / `h:mm:ss` duration formatter shared by the three live call/broadcast room screens (previously triplicated inline).

**Exports:** `formatElapsed(t: number): string`

**Exhaustive testable behaviors:**
- [ ] `0` → `'00:00'`
- [ ] `5` → `'00:05'`
- [ ] `59` → `'00:59'`
- [ ] `60` → `'01:00'`
- [ ] `3599` → `'59:59'`
- [ ] `3600` → `'1:00:00'` (crosses into `h>0` branch — note the hour segment is NOT zero-padded to 2 digits, e.g. `'1:00:00'` not `'01:00:00'` — the `pad()` helper is only applied within each segment's own 2-digit width, and hours themselves are printed via `pad(h)` too... wait: re-check — `pad(h)` IS applied to hours too (`` `${pad(h)}:${pad(m)}:${pad(s)}` ``), so `h=1` → `pad(1)` → `'01'` → confirm actual output is `'01:00:00'`. Verify precisely by reading the code again: `pad = (n) => String(n).padStart(2,'0')`; return is `` h>0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}` ``. So yes, `3600` → `'01:00:00'`, not `'1:00:00'` — correct the checklist item above to `'01:00:00'`.
- [ ] `3661` → `'01:01:01'`
- [ ] `36000` (10h) → `'10:00:00'` (3-digit-safe? `pad(10)` → `String(10).padStart(2,'0')` → `'10'`, no truncation, fine).
- [ ] `359999` (99h 59m 59s) → `'99:59:59'` — and beyond, e.g. `360000` → `'100:00:00'` (hours segment exceeds 2 digits naturally since `padStart` only pads UP to 2, never truncates — confirm this is fine, not a bug).
- [ ] Non-integer input, e.g. `65.7` → `Math.floor` is used for `h`/`m` division but `s = t % 60` on a float leaves `s` fractional (`65.7 % 60 = 5.7`) → `pad(5.7)` → `String(5.7).padStart(2,'0')` → `'5.7'` (length already ≥2, so `padStart` is a no-op) → result `'01:05.7'` — a REAL, demonstrable bug: fractional seconds are not floored/rounded, producing a malformed `mm:ss.s`-shaped string instead of the intended `mm:ss`. This is a concrete, testable defect.
- [ ] Negative input, e.g. `-5` → `h = Math.floor(-5/3600) = -1` (JS floor of negative fraction rounds toward -∞, not 0) → `m = Math.floor((-5 % 3600)/60)`; `-5 % 3600 = -5` in JS (sign follows dividend) → `Math.floor(-5/60) = -1` → `s = -5 % 60 = -5` → `pad(-1)` → `String(-1).padStart(2,'0')` → `'-1'` (already length 2, no padding) → full result would render something like `'-1:-1:-5'`-shaped garbage (since `h=-1 !== 0` → truthy → takes the `h>0` ternary's FALSE path is wrong too — wait `h > 0` for `h=-1` is `false`, so it actually takes the `mm:ss` branch: `` `${pad(m)}:${pad(s)}` `` → `pad(-1)` + `:` + `pad(-5)` → `'-1:-5'`) — confirmed malformed/garbage output for negative input, a real edge case with no guard, unlike `duration()`/`webDuration()` in `format.ts` which both explicitly clamp with `Math.max(0, ...)`.

**Priority:** P0 (shown live, continuously updating, on every call/broadcast room screen — it's simple but has a genuine fractional-input bug and no negative-input guard, both worth locking in tests; also it's a near-duplicate of `duration()`/`webDuration()` in `format.ts` with a third, different output contract, which is itself worth documenting).

**Bugs/notes:**
- **Confirmed bug**: no `Math.floor`/`Math.round` applied to the `s` computation (`const s = t % 60;`) — a fractional `t` (e.g. `65.7`) produces a fractional `s` (`5.7`) that is NOT floored before formatting, so `pad(s)` can emit a non-2-digit, decimal-containing string like `'5.7'` instead of `'05'` (file/line: `src/utils/formatElapsed.ts:10-14`). Contrast with `duration()` in `format.ts`, which explicitly does `Math.round(seconds)`.
- **No negative-input guard**: unlike `duration()` and `webDuration()` (both `Math.max(0, ...)`-clamped), `formatElapsed` has zero guarding against negative `t`, producing garbage like `'-1:-5'` for `t=-5` (file/line: whole function). In practice call-elapsed timers shouldn't go negative, but there's no defensive floor, and this is a real, demonstrable difference in defensiveness from its sibling formatters in the same codebase.
- This is effectively a third, independently-implemented duration formatter alongside `duration()` and `webDuration()` in `format.ts` — worth flagging to the team as duplication risk (three subtly different `mm:ss`-family functions with three different edge-case behaviors), not fixing here.

---

## src/theme/typography.ts

**Type:** theme (mostly static config; contains real computed values via `rf()`) · **Purpose:** Font family/weight/size tokens and the `typography` style-object registry consumed by every `<Text>`-rendering component.

**Exports:**
- `fontFamily: Record<string, string>` — 8 role names + legacy aliases, all resolving to `PlusJakartaSans_*` family strings — static, no computation.
- `fontWeight: Record<string,'400'|'500'|'600'|'700'|'800'>` — static.
- `fontSize: Record<string, number>` — every value computed as `rf(N)` for various `N` — since `rf` (from `responsive.ts`) is `Math.round(PixelRatio.roundToNearestPixel(size))`, these are effectively `size` verbatim under an identity-mocked `PixelRatio`, but genuinely computed at import time.
- `TypographyVariant` (type) — union of ~19 variant names.
- `typography: Record<TypographyVariant, TextStyle>` — 19 entries, each `{fontFamily, fontSize, lineHeight, letterSpacing?, textTransform?}`.

**Testable behaviors:**
- [ ] With `PixelRatio.roundToNearestPixel` mocked as identity, `fontSize.numHero === 30`, `fontSize.h1 === 23`, `fontSize.badge === 9`, etc. — a full table-driven snapshot of all ~20 `fontSize` keys against their literal source numbers (30,28,23,16,15,14,14,12,10,11,17,14,13,9,11,12,14,15,16,23,28,30,14) is the main "logic" here (it's a pass-through of `rf`, so really this is testing that `rf` is wired correctly and that no key's declared size silently drifted).
- [ ] `typography.h1.fontFamily === fontFamily.extrabold`; each of the 19 `typography` entries' `fontFamily` reference matches the correct `fontFamily.*` token (a mapping-correctness check — e.g. `typography.label.textTransform === 'uppercase'`, `typography.eyebrow.letterSpacing === 0.7`).
- [ ] Legacy aliases resolve to the SAME values as their "spec" counterparts: `typography.display` deep-equals `typography.numHero`'s shape (both extrabold, `fontSize.numHero`, `lineHeight: rf(36)`, `letterSpacing: -0.5`) — confirmed identical object literals by inspection, worth a `.toEqual` test to prevent future drift between the two.
- [ ] `typography.caption` deep-equals `typography.bodySm` (explicitly documented as "identical values, kept for compat") — lock with `.toEqual`.
- [ ] `fontWeight` satisfies `Record<string, TextStyle['fontWeight']>` — runtime values are correct STRING numerals (`'400'` not `400`) since RN's `fontWeight` style prop expects strings.

**Priority:** P2 for the static parts (pure config, no branches); the "legacy alias must stay identical to its spec counterpart" invariants are the only real regression-risk worth a couple of `.toEqual` tests — overall still P2 since there's no conditional logic, just a data table.

**Bugs/notes:** None functional. `fontSize.body === fontSize.bodyLg === rf(14)` (both 14) and `fontSize.md === fontSize.body` (both `rf(14)`, legacy alias) — intentional overlaps per the "legacy alias" design, not bugs.

---

## src/theme/index.ts

**Type:** theme (barrel/aggregate) · **Purpose:** Re-exports every theme sub-module and builds one convenience `theme` object plus its `Theme` type.

**Exports:** Re-exports `authGlow`, `callStatusStyle`, `callUi`, `colors`, `gradientDirection`, `gradientGlow`, `gradients`, `palette`, `webColors`, `webGradients` (from `colors.ts`); `HIT_TARGET`, `layout`, `radius`, `size`, `spacing`, `TAB_BAR_SPACE` (from `spacing.ts`); `fontFamily`, `fontSize`, `fontWeight`, `typography` (from `typography.ts`); plus types `ColorToken`, `GradientToken`, `CtaGradientToken`, `SpacingToken`, `RadiusToken`, `SizeToken`, `LayoutToken`, `TypographyVariant`.
- `theme = { colors, spacing, radius, size, layout, typography } as const` — a convenience aggregate.
- `Theme` (type) — `typeof theme`.

**Testable behaviors:**
- [ ] `theme.colors === colors` (same reference, since it's a direct property assignment, not a copy) — same for `spacing`, `radius`, `size`, `layout`, `typography`.
- [ ] Every re-exported name is importable from `@theme` — shape/reference check.

**Priority:** P2 (pure aggregation, zero logic).

**Bugs/notes:** `theme` aggregate omits `gradients`, `fontFamily`, `fontWeight`, `webColors`, etc. — intentional partial convenience object per its own doc comment ("convenience aggregate... whole theme object" is a slight overstatement since it's not actually the WHOLE theme — worth a one-line note, not a bug).

---

## src/theme/colors.ts

**Type:** theme (color tokens; contains one genuinely pure computed function) · **Purpose:** The full color system — raw `palette`, role-based `colors`, `gradients`, glow/direction helpers, web-parity `webColors`/`webGradients`, call-room `callUi`, and `callStatusStyle` lookup table.

**Exports:**
- `palette`, `colors`, `gradients`, `gradientDirection`, `authGlow`, `gradientGlow`, `webColors`, `webGradients`, `callUi` — all static `const` objects (no runtime branching), BUT many values are computed at module-load time via the internal (non-exported) `withAlpha(hex, alpha)` helper.
- `callStatusStyle: Record<string, {label,color,bg}>` — static lookup table, 4 keys (`fulfilled`, `pending`, `refunded`, `cancelled`).
- Types: `ColorToken`, `GradientToken`, `CtaGradientToken`.

**Internal, not exported:** `withAlpha(hex: string, alpha: number): string` — the ONE pure, genuinely-testable-as-a-function piece of this file: `` `rgba(${r}, ${g}, ${b}, ${alpha})` `` from a `#rrggbb` hex.

**Testable behaviors:**
- [ ] Since `withAlpha` isn't exported, its correctness can only be verified indirectly through the exported constants that use it — e.g. assert exact string values: `colors.pinkSoft === 'rgba(255, 63, 173, 0.15)'` (pink `#FF3FAD` → r=255,g=63,b=173, alpha=0.15), `colors.errorBg === 'rgba(255, 92, 122, 0.15)'` (danger `#FF5C7A`), `colors.borderGold === 'rgba(255, 200, 107, 0.35)'` (gold `#FFC86B`, alpha 0.35), `colors.scrim === 'rgba(7, 6, 20, 0.65)'` (background `#070614`, alpha 0.65) — a table-driven test of every `withAlpha(...)`-derived token would both lock the exact hex→rgba math AND implicitly test the un-exported helper's correctness (hex parsing via `parseInt(slice, 16)`, alpha pass-through, string template format with `, ` separators).
- [ ] `callStatusStyle` — 4 explicit entries, table-driven test of each `{label, color, bg}` triple; lookup for an unknown key (e.g. `callStatusStyle['unknown']`) → `undefined` (it's a plain `Record`, no default/fallback unlike `notificationVisual` — worth flagging as a genuine difference: consumers must handle `undefined` themselves).
- [ ] `ColorToken`/`GradientToken`/`CtaGradientToken` are `keyof typeof` — compile-time only, not runtime-testable, but worth a type-level smoke test (e.g. `const t: ColorToken = 'pink'` compiles) if the project has type-testing infra; otherwise skip.
- [ ] Static object identity/shape checks for `gradients.brandWide`, `gradients.ring` (5-stop array), etc. — mostly snapshot-worthy rather than "behavior," but worth confirming array lengths/order since consumers (e.g. `LinearGradient`) are order-sensitive.

**Priority:** P1 (the hex→rgba math via `withAlpha` is the one piece of real, deterministic logic in an otherwise-static file, and dozens of tokens depend on it being correct — a single off-by-one in the hex slicing would silently mis-color the entire app; still not P0 since it's presentation, not money/auth).

**Bugs/notes:** `withAlpha` is not exported, so it cannot be unit-tested in isolation — tests must go through the derived constants. Not a bug, but worth flagging to the test-writing phase: consider whether to add a scoped test that imports the module and spot-checks 4-5 `rgba(...)` outputs rather than trying to reach the private function directly. No parsing bugs found (hex slicing indices `0-2`, `2-4`, `4-6` are correct for a 6-char hex).

---

## src/theme/spacing.ts

**Type:** theme (constants; contains 2 real computed values) · **Purpose:** Spacing/radius/size scale plus two derived geometry constants (`TAB_BAR_SPACE`, `HIT_TARGET`) used to reserve scroll-view bottom padding above the floating tab bar.

**Exports:**
- `spacing`, `radius`, `size`, `layout` — static `const` objects (base scale + component-specific values + legacy aliases).
- `LIVE_OVERHANG` — **not exported** (module-private `const`), computed as `layout.liveCircle * layout.liveOutsideRatio + layout.liveRing` = `56 * 0.36 + 5` = `20.16 + 5` = `25.16`.
- `TAB_BAR_SPACE: number` — **exported**, computed as `layout.navInsetBottom + layout.navHeight + LIVE_OVERHANG + 16` = `10 + 64 + 25.16 + 16` = `115.16`.
- `HIT_TARGET = 44`.
- Types: `SpacingToken`, `RadiusToken`, `SizeToken`, `LayoutToken`.

**Testable behaviors:**
- [ ] `TAB_BAR_SPACE === 115.16` — exact arithmetic lock (`10 + 64 + (56*0.36+5) + 16`); this is the ONE genuinely computed, testable numeric derivation in the file, and it's directly consumed by `useTabBarSpace.ts` and the `Screen` component for every scrollable tab screen's bottom padding — a regression here (e.g. someone tweaking `layout.liveCircle` without realizing `TAB_BAR_SPACE` depends on it) would visually clip content across the app.
- [ ] `HIT_TARGET === 44`.
- [ ] Static shape/value checks for `spacing` (10 keys), `radius` (13 keys incl. legacy aliases — confirm `radius.xl === radius.card` is NOT necessarily true: `radius.xl=20`, `radius.card=18` — these are actually DIFFERENT despite both being "legacy-ish" named — worth a test explicitly distinguishing `radius.lg` (20) from `radius.xl` (20, same value, different semantic name) vs `radius.card`/`radius.input`/`radius.button` (all 18, same value) — a table test would catch an accidental value change to any of these aliases.
- [ ] `layout.screenPadding === 16`, `layout.cardPadding === 22`, etc. — full table.

**Priority:** P1 (the `TAB_BAR_SPACE`/`LIVE_OVERHANG` arithmetic is real, derived, easy-to-silently-break logic that affects every tab screen's layout — worth locking with an exact-value test even though the rest of the file is static config).

**Bugs/notes:** None found — arithmetic is straightforward and matches its own doc comments. Note `radius.lg` (20) and `radius.xl` (20) are numerically identical but semantically distinct names (spec scale vs legacy alias) — not a bug, just worth being precise about in tests (don't assume "xl > lg" numerically, they're equal here).

---

## src/store/index.ts

**Type:** store (barrel/re-export) · **Purpose:** Single import surface for all 4 Zustand stores + the auth-interceptor wiring function.

**Exports:** `useAuthStore`, `connectAuthInterceptors`, `useAppStore`, `useNotificationStore`, `useIncomingCallStore` — pure re-exports.

**Testable behaviors:** Import-shape check only; no logic.

**Priority:** P2.

**Bugs/notes:** None.

---

## src/store/notificationStore.ts

**Type:** Zustand store (async actions + realtime hub wiring) · **Purpose:** Owns the in-app notification list/badge/hub-connection lifecycle, driven by auth (not by any screen mounting).

**Initial state shape:**
```
{ items: [], unreadCount: 0, hydrated: false, refreshing: false,
  take: NOTIFICATIONS.take /* 30 */, hasMore: true, loadingMore: false }
```

**Actions (all on `NotificationState`):**
- `loadMore(): Promise<void>`
- `init(): Promise<void>`
- `teardown(): void`
- `refresh(): Promise<void>`
- `markRead(id: string): Promise<void>`
- `markAllRead(): Promise<void>`
- `ingest(item: NotificationItem): void`

**Module-level pure helpers (exported implicitly via behavior, not directly exported):** `sigOf(n)`, `dedupeNotifications(items)`.

### Dedup logic — verified exactly as follows:
`sigOf(n) = \`${n.type}|${n.referenceType ?? ''}|${n.referenceId ?? ''}|${n.title}|${n.body}\`` — a composite signature string.
`dedupeNotifications(items)` iterates the array once, maintaining two `Set`s (`seenId`, `seenSig`); an item is dropped if EITHER its `id` was already seen OR its `sigOf` signature was already seen; otherwise it's kept and both sets are updated. **This is applied only to a single freshly-fetched array** (used in `init`, `loadMore`, `refresh`) — it does NOT merge against the store's existing `items`.
`ingest(item)` (the hub/push convergence point) does its OWN inline dedup, NOT via `dedupeNotifications`: `get().items.some(existing => existing.id === item.id || sigOf(existing) === sigOf(item))` — if any existing item matches by id OR signature, the new item is silently dropped (`return` before the `set(...)` call). Confirmed: **id+signature dedup across hub+push convergence is real and matches the described behavior** — a duplicate delivered via both the SignalR hub and an FCM push (different server-generated `id`s, same `type`/`referenceType`/`referenceId`/`title`/`body`) is correctly collapsed to one entry.

**Exhaustive testable behaviors:**

`dedupeNotifications` (pure, easiest to unit test directly):
- [ ] `[]` → `[]`
- [ ] Single item → `[item]`
- [ ] Two items, identical `id` → second dropped, only first kept (first-occurrence-wins order preserved).
- [ ] Two items, different `id` but same `sigOf` (same type/referenceType/referenceId/title/body) → second dropped.
- [ ] Two items, same `id` but different content → still dropped by id match alone (id takes priority, content ignored once id matches — though in practice same id implies same everything from a real API).
- [ ] Three items where item 3 duplicates item 1 by signature but item 2 is unique → result is `[item1, item2]` (order preserved, only true duplicates removed).
- [ ] `referenceType`/`referenceId` both `null` — `sigOf` uses `?? ''` so two items both with null refs but same type/title/body ARE considered duplicates (nullish-coalesced to empty string, not distinguished from an empty-string reference).

`sigOf`:
- [ ] Exact string format verification: `sigOf({type:'a', referenceType:'b', referenceId:'c', title:'t', body:'bd'})` → `'a|b|c|t|bd'`.
- [ ] `referenceType: null, referenceId: undefined` → both become `''` in the signature (note: `referenceType` on `NotificationItem` is typed `string|null`, never `undefined`, but `sigOf`'s `?? ''` handles both defensively).

`loadMore`:
- [ ] Called while `loadingMore=true` → no-op (early return, no API call — verify `notificationApi.getNotifications` NOT called).
- [ ] Called while `hasMore=false` → no-op.
- [ ] Success path: `take=30` → `nextTake=60`; sets `loadingMore:true` synchronously before the await; on success, `items = dedupeNotifications(result.data)` (full REPLACE, not append — confirm this, since the API returns the full widened window, not just the new page); `take=60`; `hasMore = result.data.length >= 60`; `loadingMore:false`.
- [ ] Failure path (`result.success=false`): `logger.warn` called; `loadingMore:false`; `items`/`take`/`hasMore` all UNCHANGED (verify state before/after are equal on those 3 fields).

`init`:
- [ ] Calls `getNotifications(30)` and `getUnreadCount()` in parallel (`Promise.all`).
- [ ] Both succeed → `items = dedupeNotifications(list)`, `unreadCount = count`, `hydrated:true`, `take:30`, `hasMore = list.length >= 30`.
- [ ] List fails, count succeeds → `items=[]`, `unreadCount=count` (still uses the successful count), `hydrated:true`, `hasMore:false`, AND `logger.warn` called once for the list failure.
- [ ] Both fail → `items=[]`, `unreadCount:0`, `hydrated:true`, `hasMore:false`, 2 `logger.warn` calls.
- [ ] Regardless of success/failure, `notificationHub.setHandler(fn)` is called (with a function that calls `get().ingest`) and `notificationHub.connect()` is awaited — verify these ALWAYS run (not gated on fetch success).

`teardown`:
- [ ] `notificationHub.setHandler(null)` called; `notificationHub.disconnect()` called (fire-and-forget `void`); state reset to EXACT initial shape (`items:[], unreadCount:0, hydrated:false, refreshing:false, take:NOTIFICATIONS.take, hasMore:true, loadingMore:false`) — verify this matches the true initial state field-for-field (it does, by inspection).

`refresh`:
- [ ] Uses CURRENT `take` (the already-widened window), not the default 30 — e.g. if `take` is already 60 from a prior `loadMore`, refresh re-fetches 60, not 30 (confirms "pull-to-refresh doesn't collapse the scrolled-open list").
- [ ] Sets `refreshing:true` before the await, `refreshing:false` after, always (even on failure).
- [ ] List succeeds → `items` replaced, `hasMore` recomputed against `windowSize`; list fails → `items`/`hasMore` PRESERVED via `get().items`/`get().hasMore` fallback (not reset to empty, unlike `init`'s failure path — a real, testable asymmetry between `init` and `refresh` failure handling).
- [ ] Count succeeds/fails independently of list — same fallback pattern (`get().unreadCount` on failure).

`markRead(id)`:
- [ ] `id` not found in `items` → no-op, no API call, no state change.
- [ ] `id` found but `isRead` already `true` → no-op, no API call (guard: `!target || target.isRead`).
- [ ] `id` found, unread → OPTIMISTIC update happens synchronously first: that item's `isRead` flipped to `true`, `unreadCount = Math.max(0, unreadCount - 1)` (clamped, so it can't go negative even if state was already inconsistent).
- [ ] API succeeds → `unreadCount` OVERWRITTEN with server's authoritative `result.data.unreadCount` (may differ from the optimistic decrement — worth a test where server returns a different count than `optimistic - 1`, confirming server value wins).
- [ ] API fails → optimistic change to `items`/`unreadCount` is NOT rolled back (only `logger.warn` is called) — a real, testable asymmetry vs `markAllRead`, which DOES roll back on failure. Confirmed by reading: `markRead`'s failure branch has no `set({items: ...})` rollback, unlike `markAllRead`'s explicit `set({items: previous})`.

`markAllRead`:
- [ ] Optimistic: all items' `isRead=true`, `unreadCount=0`, synchronously before the API call.
- [ ] API succeeds → `unreadCount` set to server's value (could theoretically differ from 0, e.g. a race with a new unread arriving server-side between optimistic-set and response — worth a test asserting server value wins over the optimistic `0`).
- [ ] API fails → ROLLBACK: `items` restored to the pre-optimistic snapshot (`previous`), `logger.warn` called. Note: `unreadCount` is NOT explicitly rolled back in the failure branch (only `items` is restored) — worth flagging as a potential inconsistency: after a failed `markAllRead`, `items` reverts to their original `isRead` values but `unreadCount` stays at the optimistic `0`, producing a state where read/unread item flags don't match the displayed badge count. This is a real, demonstrable discrepancy.

`ingest(item)`:
- [ ] `item.type === 'private_call_request'` → `useIncomingCallStore.getState().refresh()` is called (fire-and-forget `void`) — regardless of whether the item turns out to be a duplicate (this check happens BEFORE the dedup check, confirmed by code order) — worth a test: even a duplicate `private_call_request` notification still triggers an incoming-call refresh, since that side effect isn't gated on the dedup outcome.
- [ ] Duplicate by id or signature (matches an existing item) → early return, `set()` NOT called, `showNotificationToast` NOT called.
- [ ] Non-duplicate, `item.isRead === true` → prepended to `items`, `unreadCount` UNCHANGED (ternary: `item.isRead ? state.unreadCount : state.unreadCount + 1`), and `showNotificationToast` NOT called (`if (!item.isRead)` guard).
- [ ] Non-duplicate, `item.isRead === false` → prepended, `unreadCount + 1`, `showNotificationToast(item)` IS called.
- [ ] Prepend order: item goes to the FRONT of `items` (`[item, ...state.items]`), confirming newest-first ordering is maintained by the hub-push path (contrast with the fetch-replace paths where order comes from the server).

**Priority:** P0 (real branching state machine with optimistic updates, rollback asymmetries, and the explicitly-called-out dedup logic — directly named in the task brief as needing verification).

**Bugs/notes:**
- **Confirmed asymmetry**: `markRead`'s failure path does NOT roll back the optimistic `items`/`unreadCount` change (only logs a warning), while `markAllRead`'s failure path DOES roll back `items` (but notably still leaves `unreadCount` at the optimistic `0`, not restored) — file/line: `src/store/notificationStore.ts:163-201`. Both are worth flagging: `markRead` risks a permanently-wrong "read" flag on a failed server write; `markAllRead`'s rollback is partial (items restored, count not).
- `refresh()`'s failure handling silently preserves stale `items`/`hasMore` (via `get().items`), while `init()`'s failure handling resets `items` to `[]` — different failure semantics between what's nominally "the same fetch" in two different lifecycle moments; worth documenting as intentional-or-not.
- `ingest`'s `private_call_request` → `useIncomingCallStore.refresh()` side effect fires even for a notification later determined to be a duplicate (dedup check happens after) — likely harmless (refresh is idempotent) but is a real ordering fact worth a test.

---

## src/store/appStore.ts

**Type:** Zustand store (simple, async, MMKV-backed) · **Purpose:** Persisted "has onboarded" flag plus a `hydrated` bootstrap flag, both backed by `mmkvStorage`.

**Initial state:** `{ hasOnboarded: false, hydrated: false }`

**Actions:**
- `bootstrap(): Promise<void>` — reads `mmkvStorage.getBoolean(STORAGE_KEYS.hasOnboarded)`, sets `{hasOnboarded, hydrated:true}`.
- `completeOnboarding(): Promise<void>` — sets `{hasOnboarded:true}` SYNCHRONOUSLY first, then awaits `mmkvStorage.setBoolean(..., true)` (fire-after-set, "optimistic" persistence).
- `resetOnboarding(): Promise<void>` — mirrors `completeOnboarding` with `false`.

**Exhaustive testable behaviors (mock `mmkvStorage`):**
- [ ] `bootstrap()` when storage returns `true` → `hasOnboarded:true, hydrated:true`.
- [ ] `bootstrap()` when storage returns `false`/`undefined` (unset key) → `hasOnboarded: <whatever getBoolean resolves falsy to>, hydrated:true` — worth confirming exactly what `mmkvStorage.getBoolean` returns for an unset key (likely `false`, but that's in `services/storage`, out of scope here — just note the store trusts whatever comes back verbatim).
- [ ] `bootstrap()` if `mmkvStorage.getBoolean` REJECTS — **no try/catch exists** in this action, unlike `authStore.bootstrap`'s explicit try/catch — an exception here would propagate as an unhandled promise rejection rather than being caught and turned into a safe fallback state. Real, testable gap worth flagging.
- [ ] `completeOnboarding()`: state flips to `true` BEFORE the storage write resolves — testable via a controlled/delayed mock promise, asserting `useAppStore.getState().hasOnboarded === true` synchronously after calling (not awaiting) `completeOnboarding()`.
- [ ] `completeOnboarding()` if `mmkvStorage.setBoolean` rejects → state remains `hasOnboarded:true` (already set optimistically) even though persistence failed silently (no catch, no rollback, no log) — a real, testable gap: a failed persist leaves in-memory state inconsistent with disk with zero error surfaced.
- [ ] `resetOnboarding()` — mirror of the above with `false`.

**Priority:** P1 (small state machine, genuinely async with an optimistic-write pattern and an unguarded storage call — not money/auth but it does gate the onboarding flow's persistence correctness).

**Bugs/notes:**
- `bootstrap()` has no `try/catch` around `mmkvStorage.getBoolean` — contrast directly with `authStore.bootstrap()`, which wraps its `secureStorage.get` in try/catch and falls back to a safe `unauthenticated` state on error. `appStore.bootstrap()` has no equivalent safety net (file/line: `src/store/appStore.ts:25-28`).
- `completeOnboarding`/`resetOnboarding` have no error handling around `mmkvStorage.setBoolean` at all — a failed write is silent and unrecoverable within this module (file/line: `src/store/appStore.ts:30-39`).

---

## src/store/incomingCallStore.ts

**Type:** Zustand store (polling + module-level singleton timer state) · **Purpose:** App-wide watcher for incoming private-call requests; polls the pending-requests endpoint while the artist is signed in and surfaces the earliest-expiring, not-yet-actioned request for a global overlay.

**Module-level (NOT Zustand state — plain module variables, shared across the whole app since ES modules are singletons):**
- `let pollTimer: ReturnType<typeof setInterval> | null = null`
- `const resolved = new Set<string>()` — request IDs the artist has already actioned this session.
- `POLL_MS = 6000` — **confirmed: polls every 6 seconds**, matching the prior context.

**Initial Zustand state:** `{ current: null }`

**Actions:**
- `start(): void`
- `stop(): void`
- `refresh(): Promise<void>`
- `dismiss(requestId: string): void`

**Pure helpers (module-level, not exported):**
- `isLive(r): boolean` — `new Date(r.expiresAtUtc).getTime() > Date.now()`
- `pickNext(items): PrivateCallRequestItem | null` — filters to `!resolved.has(id) && isLive(r)`, sorts ascending by `expiresAtUtc`, returns the first (earliest-expiring) or `null`.

### Poll mechanism — verified exactly:
`start()`: **idempotent** — if `pollTimer` is already non-null, returns immediately (no double-interval). Otherwise it (1) fires `refresh()` immediately (fire-and-forget `void`), then (2) sets `pollTimer = setInterval(() => void get().refresh(), 6000)`. So **every 6 seconds, `refresh()` is invoked**, which does a network call (`privateCallApi.getRequests()`) and reconciles `current`.
`stop()`: clears the interval via `clearInterval(pollTimer)`, sets `pollTimer = null`, clears the `resolved` Set entirely, and sets `current: null`. This is the ONLY way polling stops (called from `authStore`'s `stopNotifications()` on logout).

**Exhaustive testable behaviors:**

`isLive` (pure, easiest unit target — though not exported, test indirectly via `refresh`/`pickNext` behavior, or consider it as documented behavior to assert against):
- [ ] `expiresAtUtc` in the future → `true`; in the past → `false`; exactly `Date.now()` (edge, unlikely to hit exactly in a real test but worth a "equal" case documented as `false` since `>` is strict, not `>=`).

`pickNext`:
- [ ] `[]` → `null`.
- [ ] All items expired → `null`.
- [ ] All items in `resolved` → `null` (even if still live).
- [ ] One live, un-resolved item → returned.
- [ ] Multiple live, un-resolved items with different `expiresAtUtc` → the one with the SOONEST expiry is returned (ascending sort, take first).
- [ ] Mix of resolved-live, unresolved-expired, and one unresolved-live → only the valid one returned, others filtered.
- [ ] Two items with IDENTICAL `expiresAtUtc` → order is whatever `Array.prototype.sort`'s stability gives (stable in modern JS engines) — worth a test documenting current tie-break behavior (first-in-array wins, since sort is stable and the comparator returns 0 for ties).

`start()`:
- [ ] First call: `pollTimer` was `null` → `refresh()` called once immediately, `setInterval` registered. (Mock timers: `jest.useFakeTimers()`, spy on `refresh`.)
- [ ] Calling `start()` again while already polling → NO second `refresh()` call, NO second interval registered (idempotency — verify via `jest.spyOn(global, 'setInterval')` call count staying at 1).
- [ ] After registering, advancing fake timers by 6000ms → `refresh()` called again (2nd time total); advancing by 6000ms again → 3rd call; advancing by only 5999ms → still only 2 calls (boundary).

`stop()`:
- [ ] Called while polling → `clearInterval` invoked with the right timer id, `pollTimer` reset to `null` (verify a subsequent `start()` after `stop()` successfully re-registers a NEW interval — i.e. polling can be restarted), `resolved` cleared, `current: null`.
- [ ] Called when NOT polling (`pollTimer` already `null`) → `clearInterval` is NOT called (guarded by `if (pollTimer)`), but `resolved.clear()` and `set({current:null})` STILL run unconditionally — worth a test confirming state is still reset even if there was nothing to stop.
- [ ] After `stop()`, advancing fake timers by any amount → `refresh()` is NOT called again (interval genuinely cleared, not just logically ignored).

`refresh()`:
- [ ] API failure (`res.success=false`) → early return, `current` UNCHANGED (not cleared, not touched at all).
- [ ] API success, no `current` set yet → `set({current: pickNext(res.data)})`.
- [ ] API success, `current` already set AND its id is in `resolved` → skips the "keep current" branch (since `!resolved.has(currentId)` is false) → falls through to `pickNext` reconciliation (which will also exclude it via `resolved`, so effectively it gets replaced/cleared).
- [ ] API success, `current` set, NOT resolved, and STILL present + still live in the new `res.data` → **kept and REPLACED with the fresh copy from `res.data`** (`set({current: still})`), i.e. its fields (like updated `expiresAtUtc`, if the server ever changes it) get refreshed WITHOUT going through `pickNext`'s re-sort — this early-return path is a distinct branch from the general reconciliation, worth its own test: the currently-shown request is never swapped out from under the user just because a different request now expires sooner.
- [ ] API success, `current` set, NOT resolved, but the matching item is no longer in `res.data` (e.g. it expired server-side and was dropped) → falls through to general `pickNext` reconciliation (the early-return `if (still && isLive(still))` fails since `still` is `undefined`).
- [ ] API success, `current` set, NOT resolved, matching item found in `res.data` but `isLive(still)` is now `false` (expired) → also falls through to general reconciliation (early-return condition requires BOTH found AND live).

`dismiss(requestId)`:
- [ ] Adds `requestId` to `resolved` (verify subsequent `pickNext`/`refresh` calls exclude it, even if the server still returns it as pending).
- [ ] If `current.requestId === requestId` → `current` set to `null` immediately (synchronous UI clear, doesn't wait for next poll).
- [ ] If `current.requestId !== requestId` (dismissing something not currently shown, e.g. from a list view rather than the overlay) → `current` UNCHANGED.
- [ ] Dismissing the SAME id twice → idempotent, no error (Set add is a no-op on duplicate, second `current` check just finds it already null or already a different request).

**Priority:** P0 — explicitly the file called out in the brief for the 6-second poll verification; also genuinely branchy business logic (earliest-expiry selection, resolved-set exclusion, "don't swap the visible request out from under the user" reconciliation) directly gating a live call-request UX.

**Bugs/notes:**
- **Module-level mutable state** (`pollTimer`, `resolved`) lives OUTSIDE the Zustand store, at module scope. This means: (a) it persists across `stop()`/`start()` cycles correctly within one process, but (b) **it will leak across test cases** unless each test explicitly calls `stop()` or the test suite resets modules (`jest.resetModules()`) between tests — a naive test that calls `start()` in one test and doesn't `stop()` it will leave a real `setInterval` running (or, if fake timers are shared, corrupt `resolved`'s contents) for the next test. This is a genuine testability hazard worth calling out explicitly to whoever writes these tests, not a runtime bug, but definitely something that will cause flaky/interdependent tests if not handled (file/line: `src/store/incomingCallStore.ts:35-37`).
- `refresh()`'s "keep current, refresh its data" branch (lines 74-83) bypasses `resolved` filtering for the CURRENT item's continued display as long as it's not in `resolved` and still live — but it does NOT re-check whether a DIFFERENT, more-urgently-expiring request has arrived in the meantime; only the general `pickNext` path (which fully re-evaluates all candidates) would surface a more-urgent one. So while the currently-shown request remains live, a newer/sooner-expiring request is effectively queued behind it until the current one resolves/expires — this is very likely intentional (explicitly commented: "rather than swapping it out from under the artist mid-decision") but is a real, non-obvious behavior worth a dedicated test rather than an assumption.

---

## src/store/authStore.ts

**Type:** Zustand store (async, orchestrates 3 other stores + secure storage + query cache) · **Purpose:** Source-of-truth in-memory mirror of the encrypted-storage auth session; owns login/bootstrap/logout and fans out session-start/stop side effects to notifications, incoming-call polling, and push registration.

**Initial state:** `{ status: 'idle', hydrated: false, token: null, user: null }`

**Actions:**
- `bootstrap(): Promise<void>`
- `authenticate(session: AuthSession): Promise<void>`
- `updateTokens(tokens: AuthTokens): void`
- `logout(): Promise<void>`

**Also exported:** `connectAuthInterceptors(): void` — wires `registerAuthHandlers({onAuthFailure, onTokensRefreshed})` from the API layer to call `useAuthStore.getState().logout()` / `.updateTokens()` respectively (breaks a circular import between the API interceptor layer and the store).

**Module-level private helpers:**
- `startNotifications()` — calls `useNotificationStore.getState().init()` (fire-and-forget), `useIncomingCallStore.getState().start()` (sync), `pushNotifications.register()` (fire-and-forget).
- `stopNotifications()` — calls `useNotificationStore.getState().teardown()` (sync), `useIncomingCallStore.getState().stop()` (sync), `pushNotifications.unregister()` (fire-and-forget).
- `persistSession(session)` — writes access token to secure storage always; writes refresh token IF present, ELSE explicitly REMOVES any stale refresh token (`secureStorage.remove`).

**Exhaustive testable behaviors:**

`bootstrap()`:
- [ ] `secureStorage.get` resolves a token string → `{token, status:'authenticated', hydrated:true}`, AND `startNotifications()` is called (verify `notificationStore.init`, `incomingCallStore.start`, `pushNotifications.register` all fire).
- [ ] `secureStorage.get` resolves `null`/`undefined` (no stored token) → `{token: null, status:'unauthenticated', hydrated:true}`, AND `startNotifications()` is **NOT** called (gated by `if (token)`).
- [ ] `secureStorage.get` THROWS/rejects → caught by `try/catch` → `logger.error('Auth bootstrap failed', {...})` called, state set to `{token:null, status:'unauthenticated', hydrated:true}` — confirms this path IS defensively guarded (contrast with `appStore.bootstrap`, which has no such guard).

`authenticate(session)`:
- [ ] Calls `persistSession(session)` and AWAITS it before proceeding (verify ordering: storage write happens before `queryClient.clear()` and `set(...)`).
- [ ] `persistSession`: `session.tokens.refreshToken` present → `secureStorage.set(refreshToken key, value)` called; absent (`undefined`) → `secureStorage.remove(refreshToken key)` called instead (NOT skipped — this is an explicit branch, not a no-op, per the code comment about not leaving a stale token from a previous session).
- [ ] `queryClient.clear()` is called (verify via spy) BEFORE the `set({token, user, status:'authenticated'})` call — order matters per the code comment ("before the new one's screens mount").
- [ ] After `set(...)`, `startNotifications()` is called (unconditionally on every successful `authenticate`, unlike `bootstrap` which gates on token presence — `authenticate` always has a token by definition here).

`updateTokens(tokens)`:
- [ ] `set({token: tokens.accessToken})` — ONLY the token field is updated; `user`/`status`/`hydrated` are left untouched (verify by calling with a pre-existing `user` set and confirming it survives).
- [ ] Note: `tokens.refreshToken` is IGNORED entirely by this action (not persisted to secure storage, not stored in state) — this action only updates the in-memory access token, presumably because it's meant for the interceptor's silent-refresh callback where only the access token rotates. Worth a test explicitly confirming refresh-token changes are NOT written to storage via this path (only `persistSession`, called from `authenticate`, touches the refresh token).

`logout()`:
- [ ] Call order (critical, verify via spy call-order): `stopNotifications()` FIRST (synchronously, though its internals include fire-and-forget async calls), THEN `authApi.logout()` awaited inside a try/catch, THEN `secureStorage.removeMany([accessToken, refreshToken])`, THEN `queryClient.clear()`, THEN `set({token:null, user:null, status:'unauthenticated'})`.
- [ ] `authApi.logout()` succeeds → proceeds normally to local cleanup.
- [ ] `authApi.logout()` REJECTS → caught by try/catch, `logger.warn('Server logout failed...', {...})` called, but local cleanup (`secureStorage.removeMany`, `queryClient.clear`, `set(...)`) STILL runs regardless — confirms "local cleanup happens regardless" per the code comment; a test should assert final state is `unauthenticated` even when the server call throws.
- [ ] Final `status` is ALWAYS `'unauthenticated'` after `logout()` resolves, regardless of the server call's outcome.
- [ ] `stopNotifications()`'s 3 calls (`notificationStore.teardown`, `incomingCallStore.stop`, `pushNotifications.unregister`) all fire even if a LATER step (e.g. `authApi.logout`) fails — they're not inside the try/catch, they run first unconditionally.

`connectAuthInterceptors()`:
- [ ] Calling it registers handlers via `registerAuthHandlers` (verify via spy) — `onAuthFailure` handler, when invoked, calls `useAuthStore.getState().logout()` (fire-and-forget `void`); `onTokensRefreshed` handler, when invoked with `tokens`, calls `useAuthStore.getState().updateTokens(tokens)`.
- [ ] This function has no return value and its only effect is the registration call — test by invoking the captured handlers directly and asserting the expected store methods were triggered.

**Priority:** P0 — explicitly auth logic (session lifecycle, token persistence, cross-store orchestration on login/logout) — squarely in the P0 category called out in the brief.

**Bugs/notes:**
- No functional bugs found; the file is unusually well-guarded (try/catch on `bootstrap`, explicit stale-refresh-token cleanup, deliberate cleanup-regardless-of-server-response on `logout`) compared to `appStore.ts`'s bare storage calls — worth noting as a POSITIVE pattern to mirror when testing `appStore.ts`'s gaps.
- One subtlety worth flagging as a test-design note rather than a bug: `startNotifications`/`stopNotifications` call several OTHER stores' actions (`useNotificationStore`, `useIncomingCallStore`, `pushNotifications`) as real side effects — testing `authStore` in isolation requires mocking `@services/api`, `@services/push/pushNotifications`, `@services/queryClient`, `@services/storage`, `./notificationStore`, and `./incomingCallStore` all together, since `authStore.ts` imports and directly calls into the other two stores (not just via events) — a true unit test of `authStore` alone will need fairly heavy mocking of its 6 direct dependencies.

---

## src/types/index.ts

**Type:** types (pure re-export, zero runtime code) · **Purpose:** Central `@app-types`/`@types` barrel re-exporting every domain type from `api.ts` and `navigation.ts`.

**Testable behaviors:** None — this file contains only `export type { ... } from './api'` and `export type { ... } from './navigation'` statements, which are fully erased at compile time and produce no JavaScript output. There is nothing to unit test.

**Priority:** P2 / Excluded.

**Bugs/notes:** Purely mechanical — confirmed it re-exports the majority (not literally all) of `api.ts`'s types; a few types defined in `api.ts` (e.g. `KycStatus`, `KycDocumentType`, `ArtistSubcategory`, `UpdateCategoryPayload`, `UpdateFunWheelPayload`, `UpdateActivityPayload`, `EarningsTransaction`, `EarningsTransactionsQuery`, `ArtistConversationSummary`, `PrivateMessageItem`, `PrivateMessageConversationResponse`, `ReplyPrivateMessageResponse`, `ArtistRuntimeConfig`, `KycUploadUrlPayload/Response`, `KycViewUrlResponse`, `SavePanPayload`, `SaveAadhaarPayload`, `SaveBankAccountPayload`, `BankAccount`) are **not** re-exported through this barrel — consumers presumably import those directly from `@app-types/api`. Not a bug, just worth noting the barrel is partial (same pattern as `utils/index.ts`).

---

## src/types/api.ts

**Type:** types (pure interface/type declarations, zero runtime code) · **Purpose:** The full API/domain contract — every request payload and response shape the app talks to the artist backend with.

**Testable behaviors:** None at runtime — every export is an `interface` or `type` alias (including `Result<T>` discriminated union, `SocialProviderId`, `FollowerBadge`, `GroupCallHistoryFilter`, `DevicePlatform`), all erased by TypeScript compilation. There are no functions, no default values, no runtime validation logic in this file to exercise with Jest.

**Priority:** P2 / Excluded — per the task's own instruction, no fake checklist invented.

**Bugs/notes:** Not a bug, but worth flagging for the team (not for testing): `BroadcastAnalytics` is defined identically (field-for-field) in BOTH `src/types/api.ts` (lines 554-574) and `src/types/broadcast.ts` (lines 55-75) — two separate, structurally-identical interfaces with the same name in different files. TypeScript allows this since they're never both imported under the same name in one scope, but it's duplication that could drift out of sync silently if one copy is edited and the other isn't.

---

## src/types/navigation.ts

**Type:** types (pure type declarations, zero runtime code) · **Purpose:** Route-name unions and route-param interfaces for `expo-router` typed navigation.

**Testable behaviors:** None — `AuthRoute`, `AppTabRoute`, `AppRoute` (string literal unions) and `OtpVerifyParams`/`ResetPasswordParams` (interfaces) are all compile-time-only constructs with no runtime representation.

**Priority:** P2 / Excluded.

**Bugs/notes:** None to flag. Worth noting `AppTabRoute` only lists `home`/`explore`/`profile` — doesn't include e.g. a `me`/`live` tab that other files reference by string (e.g. `'/(app)/(tabs)/me/messages'` in `utils/notifications.ts`) — those are untyped string literals elsewhere in the app rather than going through this union, which is a pre-existing type-coverage gap, not something to write a Jest test for.

---

## src/types/broadcast.ts

**Type:** types (pure interface/type declarations, zero runtime code) · **Purpose:** Live-broadcast (host side) request/response/hub-push shapes.

**Testable behaviors:** None — every export (`StartBroadcastRequest/Response`, `BroadcastViewer`, `ListViewersResponse`, `BroadcastActivityType`, `BroadcastActivityItem`, `BroadcastAnalytics`, `FulfillmentUpdatedPayload`) is a type-only construct.

**Priority:** P2 / Excluded.

**Bugs/notes:** See the `BroadcastAnalytics` duplication note under `types/api.ts` above — this file's copy is the one referenced by `groupCall.ts`'s re-export as well as likely the broadcast screens directly.

---

## src/types/images.d.ts

**Type:** types (ambient module declarations, zero runtime code) · **Purpose:** Lets TypeScript understand static image imports (`.png`/`.jpg`/`.jpeg`/`.webp`/`.gif`) as resolving to a Metro asset-module `number`.

**Testable behaviors:** None — `declare module '*.ext' { const content: number; export default content; }` blocks are pure ambient type declarations, erased entirely at compile time, no JS emitted.

**Priority:** P2 / Excluded.

**Bugs/notes:** None. Confirmed no `.svg` declaration exists here — if the app imports SVGs as React components (common with `react-native-svg-transformer`), that would need a separate declaration file; not in scope to verify further here, just flagging as a possible gap for whoever maintains asset imports (not a testable behavior).

---

## src/types/groupCall.ts

**Type:** types (pure interface/type declarations, zero runtime code, but has ONE re-export line worth noting) · **Purpose:** Group-call (host side) request/response/participant shapes; reuses `BroadcastActivityItem`/`FulfillmentUpdatedPayload` from `broadcast.ts` via aliasing.

**Testable behaviors:** None — `GroupCallActivityItem` (= `BroadcastActivityItem` alias), `FulfillmentUpdatedPayload` (re-exported, not redefined — correctly avoids the duplication seen with `BroadcastAnalytics`), `CreateGroupCallRequest/Response`, `GroupCallConnectionResponse`, `GroupCallParticipantStatus` (11-member string union), `GroupCallParticipant` — all type-only.

**Priority:** P2 / Excluded.

**Bugs/notes:** None — this file is a good counter-example to the `BroadcastAnalytics` duplication: it correctly re-exports `FulfillmentUpdatedPayload` via `export type { FulfillmentUpdatedPayload }` instead of redefining it, avoiding drift. The doc comment on `GroupCallParticipantStatus` explicitly notes a past bug (the app used to guess `pending_approval`, which the API never sends) — historical context only, already fixed in this version, nothing to test here.

---

## src/types/privateCall.ts

**Type:** types (pure interface/type declarations, zero runtime code) · **Purpose:** Private (1:1) call (host side) request/response/hub-push shapes, including the exact `PrivateCallRequestItem` shape consumed by `incomingCallStore.ts`.

**Testable behaviors:** None — `PrivateCallRequestItem`, `PrivateCallConnectionResponse`, `PrivateCallActiveSession`, `PrivateCallHistoryItem`, `CallCostUpdatePayload`, `PrivateCallRewardPush`, `PrivateCallFunWheelPush` are all type-only.

**Priority:** P2 / Excluded.

**Bugs/notes:** None. Worth cross-referencing for the store test-writing phase: `PrivateCallRequestItem.requestId` and `.expiresAtUtc` are the two fields `incomingCallStore.ts`'s `isLive`/`pickNext`/`dismiss` actually operate on — a test fixture builder for this type should make those two fields easy to vary independently.

---

## src/navigation/stackOptions.ts

**Type:** navigation (static config object) · **Purpose:** Shared `screenOptions` for every nested tab `<Stack>` — hides the native header (screens render their own) and sets a consistent background.

**Exports:** `tabStackOptions: StackProps['screenOptions']` — `{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }`.

**Testable behaviors:**
- [ ] `tabStackOptions.headerShown === false`
- [ ] `tabStackOptions.animation === 'slide_from_right'`
- [ ] `tabStackOptions.contentStyle.backgroundColor === colors.background` (i.e. `'#070614'`) — ties this file's correctness to `theme/colors.ts`'s `palette.background` staying in sync; a shape/value snapshot test is the entirety of what's testable here.

**Priority:** P2 (single static object literal, zero branches).

**Bugs/notes:** None.

---

## src/navigation/useTabBarSpace.ts

**Type:** navigation (trivial hook-shaped wrapper around a constant) · **Purpose:** Returns `TAB_BAR_SPACE` from `theme/spacing.ts` so scrollable tab screens know how much bottom padding to reserve.

**Exports:** `useTabBarSpace(): number` — `() => TAB_BAR_SPACE`, a pure function with a `use*` name but NO React hook internals (no `useState`/`useEffect`/context read) — it can be called like a plain function in tests without any React rendering harness.

**Testable behaviors:**
- [ ] `useTabBarSpace() === TAB_BAR_SPACE` (imported directly from `@theme` for comparison) — i.e. `=== 115.16` per the computed value verified in the `theme/spacing.ts` section above.
- [ ] Calling it multiple times returns the same value every time (it's a pure constant getter, no memoization needed since there's no computation per call).

**Priority:** P2 (one-line passthrough, no branching — though it IS the thing that would immediately reveal a regression in `TAB_BAR_SPACE`'s arithmetic if that's tested here instead of/in addition to `spacing.ts`).

**Bugs/notes:** None. Despite the `use` prefix (React hook naming convention), this is safely callable outside a React render — worth noting explicitly in the test file so whoever writes it doesn't reach for `@testing-library/react-hooks`/`renderHook` unnecessarily.

---

## src/services/queryClient.ts

**Type:** services (singleton config object) · **Purpose:** The app's single shared `QueryClient` instance, exported so non-React code (`authStore`) can call `.clear()` on logout/login to prevent cross-account cache bleed.

**Exports:** `queryClient: QueryClient` — constructed once with `defaultOptions.queries = { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false }`.

**Testable behaviors:**
- [ ] `queryClient.getDefaultOptions().queries.retry === 1`
- [ ] `queryClient.getDefaultOptions().queries.staleTime === 30_000`
- [ ] `queryClient.getDefaultOptions().queries.refetchOnWindowFocus === false`
- [ ] `queryClient` is a genuine singleton — importing this module twice (from different files) yields the SAME instance (`===`), which is the entire point of pulling it out of the root layout — verify via two separate `require`/`import` call sites in a test resolving to reference-equal objects (standard for ESM/CJS module caching, but worth one explicit test given how load-bearing this singleton-ness is for `authStore.logout`/`authenticate`'s `queryClient.clear()` calls to actually wipe the SAME cache the screens read from).
- [ ] `queryClient.clear()` (exercised indirectly, e.g. by seeding a query into the cache via `queryClient.setQueryData(['x'], 1)`, calling `.clear()`, then asserting `queryClient.getQueryData(['x'])` is `undefined`) — this is really testing TanStack Query's own `.clear()` behavior rather than this module's code, but a smoke test here would catch a future accidental swap to a non-shared/new `QueryClient` instance somewhere in the app.

**Priority:** P1 (not money/auth logic itself, but its correct singleton-ness is a load-bearing invariant for `authStore`'s cross-account cache-wipe guarantee — worth at least the singleton-identity test even though the file itself has zero branches).

**Bugs/notes:** None found in this file. Its correctness is really "is this actually a singleton and is `authStore` calling `.clear()` on the SAME instance the app's `QueryClientProvider` uses" — that provider wiring lives in `app/_layout.tsx` (out of scope for this audit) but is worth a one-line flag: this file alone can't prove the app actually renders `<QueryClientProvider client={queryClient}>` with this exact export; that's an integration concern beyond what a unit test of this file can cover.

---

**33 files audited, approximately 340+ distinct testable behaviors identified across P0/P1/P2** (P0: `constants/app.ts`, `utils/responsive.ts`, `utils/validators.ts`, `utils/earnings.ts`, `utils/logger.ts`, `utils/format.ts`, `utils/errorHandler.ts`, `utils/formatElapsed.ts`, `store/notificationStore.ts`, `store/incomingCallStore.ts`, `store/authStore.ts` — 11 files; P1: `constants/queryKeys.ts`, `utils/toast.ts`, `utils/notifications.ts`, `theme/colors.ts`, `theme/spacing.ts`, `store/appStore.ts`, `services/queryClient.ts` — 7 files; P2/Excluded: `constants/index.ts`, `utils/index.ts`, `utils/press.ts`, `theme/typography.ts`, `theme/index.ts`, `store/index.ts`, `types/index.ts`, `types/api.ts`, `types/navigation.ts`, `types/broadcast.ts`, `types/images.d.ts`, `types/groupCall.ts`, `types/privateCall.ts`, `navigation/stackOptions.ts`, `navigation/useTabBarSpace.ts` — 15 files).

---

# Section 2: Services (api client/interceptors, storage, agora, push, realtime hubs)

# Audit: src/services/ — Mitro Artist App

Source of file list: `find src/services -type f` (35 files, confirmed current — no `liveDeliveryApi` alias exists elsewhere, no additional files beyond what's below).

---

## src/services/api/

### `src/services/api/client.ts`
**Type:** API client (axios instance factory)
**Purpose:** Creates the two axios instances (`api`, `refreshClient`) the whole app uses, and warns (never throws) if the configured base URL isn't HTTPS.
**Exports:** `api: AxiosInstance`, `refreshClient: AxiosInstance`
**Dependencies:** `axios`; `@constants/app` (`ALLOW_INSECURE_HTTP`, `API_CONFIG`, `REGEX`); `@utils/logger`. No native modules.

**Testable behaviors:**
- Module-load side effect: if `REGEX.httpsOnly.test(API_CONFIG.baseUrl)` is false AND (`__DEV__` is true OR `ALLOW_INSECURE_HTTP` is true) → `logger.warn('API base URL is not HTTPS', ...)` is called, with `allowedBy` = `'dev build'` when `__DEV__` else `'EXPO_PUBLIC_ALLOW_INSECURE'`.
- If URL isn't HTTPS AND neither dev nor insecure-allowed → `logger.error(...)` is called instead of warn.
- If URL is HTTPS → neither logger call fires.
- Must never throw during module evaluation (this is the entire design point of the file — a thrown error here kills app boot). A test should assert import doesn't throw under a bad `baseUrl`.
- `api` and `refreshClient` are both created with `withCredentials: true`, `Content-Type: application/json`, `Accept: application/json`, and `baseURL`/`timeout` from `API_CONFIG`.
- Since this reads `API_CONFIG` and `__DEV__` at **import time**, testing the branches requires `jest.resetModules()` + re-mocking `@constants/app` per test, not runtime mutation.

**Priority:** P0 (every request in the app goes through `api`; the insecure-HTTP guard is a real security control, and refreshClient underlies the whole auth-refresh path).

**Bugs/notes:** None found; behavior matches its own extensive comments. Note the module-scope `if` block means this is awkward to unit test in isolation — needs isolated module registry per test case.

---

### `src/services/api/interceptors.ts`
**Type:** Interceptor (request/response middleware + token-refresh orchestration)
**Purpose:** Attaches the bearer token to every request, enforces HTTPS at request time, and implements single-flight silent token refresh on 401 with retry-once semantics.
**Exports:** `registerAuthHandlers({ onAuthFailure, onTokensRefreshed })`, `attachInterceptors()`
**Dependencies:** `axios` types; `@constants` (`ALLOW_INSECURE_HTTP`, `API_CONFIG`, `REGEX`, `SECURE_KEYS`, `TIMING`); `@services/storage` (`secureStorage`); `@app-types/api`; `@utils/errorHandler` (`AuthError`); `@utils/logger`; local `./client` (`api`, `refreshClient`), `./endpoints` (`ENDPOINTS`).

**Testable behaviors (request interceptor, registered via `attachInterceptors`):**
1. `registerAuthHandlers` stores `onAuthFailure`/`onTokensRefreshed` in module-level closures — assert they're actually invoked later (not just stored).
2. Request interceptor: builds `url = config.baseURL ?? API_CONFIG.baseUrl + (config.url ?? '')`. If `!REGEX.httpsOnly.test(url) && !__DEV__ && !ALLOW_INSECURE_HTTP` → rejects with `AuthError('This build can only connect over HTTPS...')`, and does **not** attach a token.
3. Otherwise (HTTPS, or dev/insecure-allowed): reads `secureStorage.get(SECURE_KEYS.accessToken)`; if truthy, sets `Authorization: Bearer <token>` header via `config.headers.set`; if falsy, no header is set — request proceeds without Authorization.
4. Request interceptor error passthrough: rejects with the same `AxiosError` unchanged.

**Testable behaviors (response interceptor / refresh flow):**
5. Non-error responses pass through unchanged.
6. On error: `isRefreshCall = original.url === ENDPOINTS.auth.refresh`; `retryCount = original._retryCount ?? 0`.
7. **401 branch entered** only when `status === 401 && original exists && !isRefreshCall && retryCount < TIMING.tokenRefreshRetries` (retries = 1, so only one retry attempt total per request).
8. On entering 401 branch: increments `original._retryCount`, then calls `performRefresh()` — but **only starts a new refresh if `refreshPromise` is null** (single-flight: concurrent 401s share one in-flight refresh promise). Must test that two simultaneous 401s trigger exactly one `refreshClient.post` call.
9. `refreshPromise` is reset to `null` immediately after awaiting it (not in a `finally`) — a test should check the module handles overlapping calls right (there is a narrow bug window discussed below).
10. If refresh returns a token: sets `Authorization: Bearer <newToken>` on `original`, retries via `api(original)`, and resolves with that retried request's result.
11. If refresh returns `null` (refresh failed): calls `onAuthFailure?.()` (awaited) then still rejects with the *original* error.
12. If `onAuthFailure` was never registered (`null`): no-ops safely (optional chaining), still rejects.
13. If status is 401 but `isRefreshCall` is true (the refresh call itself 401'd) → skips the whole retry branch, straight rejects — this is what prevents infinite refresh loops.
14. If status is 401 but `retryCount >= TIMING.tokenRefreshRetries` (already retried once) → skips branch, rejects (prevents infinite retry).
15. Any non-401 error status → straight rejects, no refresh attempted.

**`performRefresh()` internal behavior (exercised indirectly via the 401 flow, not exported):**
16. Calls `refreshClient.post(ENDPOINTS.auth.refresh)` with no body (cookie-based).
17. On success: builds `AuthTokens{accessToken}`, calls `secureStorage.set(SECURE_KEYS.accessToken, token)`, calls `onTokensRefreshed?.(tokens)`, returns the token string.
18. On failure (any thrown error, including network/5xx from the bare `refreshClient`): logs `logger.warn('Token refresh failed', ...)`, returns `null` — never throws out of `performRefresh`.

**Priority:** P0 — this is the entire auth/token critical path (silent refresh, logout-on-failure, HTTPS enforcement).

**Bugs/suspicious logic:**
- **Line 117–119 (`refreshPromise = refreshPromise ?? performRefresh(); ... refreshPromise = null;`)**: This is a single-flight pattern but has a subtle race: if two 401s land back-to-back synchronously, both read `refreshPromise` before either awaits, so it correctly de-dupes — fine. But the promise is nulled out unconditionally after `await refreshPromise`, by *whichever* caller happens to await it — including callers who did NOT start it. This is standard single-flight and works because both awaiters get the same resolved value, so it's not actually a bug, just worth a concurrency test (two parallel 401'd requests → exactly 1 `refreshClient.post` call, both requests eventually retried with the same new token).
- No explicit test coverage need flagged, but worth noting: `original._retryCount` is mutated on the shared `config` object, so a request object reused across calls (unlikely with axios) could carry stale retry counts — low risk, not a bug in practice.

---

### `src/services/api/mock.ts`
**Type:** Service wrapper / dev fixture helper
**Purpose:** Global `USE_MOCK` switch plus `mocked()`/`mockedError()` promise helpers used by API modules to serve fixtures instead of network calls (per the file comments, though none of the 20 audited resource modules currently branch on `USE_MOCK` — see note below).
**Exports:** `USE_MOCK: boolean`, `mocked<T>(value, delayMs?)`, `mockedError(message?, delayMs?)`
**Dependencies:** `expo-constants`. No native modules beyond that.

**Testable behaviors:**
1. `USE_MOCK` resolution precedence (module-load-time, needs `jest.resetModules()` per case):
   - `process.env.EXPO_PUBLIC_USE_MOCK === 'false'` → `false` (explicit override wins even over `extra.useMock: true`).
   - `process.env.EXPO_PUBLIC_USE_MOCK === 'true'` → `true`.
   - Neither env var set/matching → falls back to `Constants.expoConfig?.extra?.useMock ?? false`.
   - `Constants.expoConfig` undefined → `false`.
2. `mocked(value)` resolves with `value` after `MOCK_DELAY_MS` (450ms default), or after a custom `delayMs` argument — use `jest.useFakeTimers()` + `jest.advanceTimersByTime`.
3. `mockedError(message)` rejects with `new Error(message)` (default `'Mock failure'`) after the delay.

**Priority:** P2 (dev-only fixture switch; jest.setup mocks `expo-constants` with `useMock: false`, so this rarely engages in prod code paths). Worth testing purely for the precedence logic since it's a real footgun (silently serving fixtures in prod would be bad) — bump to P1 for the precedence-branch tests specifically.

**Bugs/notes:** As currently read, **no audited API module in `src/services/api/` actually branches on `USE_MOCK`** — every module (`authApi`, `profileApi`, etc.) always calls the real `api.*` methods. The mock switch and `mocked()`/`mockedError()` helpers appear to be dead/unused infrastructure at this layer (possibly wired in elsewhere, e.g. React Query hooks not in this audit's scope — worth flagging to the team, not fixing).

---

### `src/services/api/endpoints.ts`
**Type:** Pure data module (URL map)
**Purpose:** Single source of truth for every API path, several as functions taking IDs.
**Exports:** `ENDPOINTS` (const object, deeply nested, `as const`).
**Dependencies:** None.

**Testable behaviors:** This is static data — the only "behavior" is the ID-interpolating functions, e.g.:
- `ENDPOINTS.profile.photo(photoId)` → `` `/api/artist/photos/${photoId}` ``
- `ENDPOINTS.broadcast.confirmConnected/rejoin/connectionLost/heartbeat/end/viewers/activity/chat/muteViewer/unmuteViewer/removeViewer/highlightedPrice/analytics` — all template functions, each worth one assertion that it interpolates the given id(s) correctly (especially the two-arg ones like `muteViewer(id, userId)`).
- `ENDPOINTS.groupCall.*` — same pattern, 12 id-taking functions.
- `ENDPOINTS.privateCall.*` — 6 id-taking functions.
- `ENDPOINTS.kyc.documentViewUrl(documentType)`.
- `ENDPOINTS.rewardOrders.fulfill`, `ENDPOINTS.funWheelSpins.fulfill`.
- `ENDPOINTS.privateMessages.conversation/reply/read/message/messageForMe/conversationDelete`.
- `ENDPOINTS.settings.reward/rewardStatus/funWheelById/funWheelStatus/funWheelActivity`.

**Priority:** P1 for the id-interpolation functions (a typo'd template literal silently breaks a resource path in production — cheap to snapshot-test all of them in one table-driven test), P2 for the static string constants.

**Bugs/notes:** None found; every path is plausible and internally consistent with the resource API modules that consume it. `user.profile` (`/user/profile`) and `home.feed`/`explore.search` at the bottom look like leftover/unused fan-app-style routes never referenced by any of the 20 resource modules read in this audit — worth a grep to confirm dead.

---

### `src/services/api/index.ts`
**Type:** Barrel/hub
**Purpose:** Re-exports the public surface of the `api/` directory.
**Exports:** `api`, `refreshClient`, `attachInterceptors`, `registerAuthHandlers`, `ENDPOINTS`, `authApi`, `profileApi`, `insightsApi`, `kycApi`, `settingsApi`, `notificationApi`, `privateMessageApi`, `followersApi`, `configApi`, `rewardOrdersApi`, `contentTypeFor`, `fileNameFor`, `putFileToSignedUrl`, `USE_MOCK`, `mocked`, `mockedError`.
**Dependencies:** All the sibling files in this directory.

**Testable behaviors:** Barrel re-export — the only meaningful test is "importing from `@services/api` yields the expected named exports" (a smoke test, if anything).

**Priority:** P2.

**Bugs/notes:** **`broadcastApi`, `groupCallApi`, `privateCallApi`, and `funWheelSpinsApi` are NOT re-exported from this barrel**, even though their files exist and are actively used elsewhere in the app (confirmed via grep — screens import them directly from `@services/api/broadcastApi` etc., not from `@services/api`). Not necessarily a bug (direct imports work fine and avoid barrel bloat), but it's an inconsistency worth flagging: three of the biggest/most-used API modules are invisible to anyone importing only `@services/api`.

---

### `src/services/api/authApi.ts`
**Type:** API client (per-resource)
**Purpose:** Auth: login, sign-up (3-step OTP flow), password reset (3-step), logout, stage-name availability check.
**Exports:** `authApi` object with `login`, `sendRegistrationOtp`, `verifyRegistrationOtp`, `register`, `checkStageName`, `sendPasswordResetOtp`, `verifyPasswordResetOtp`, `resetPassword`, `logout`.
**Dependencies:** `@app-types/api` types; `@utils/errorHandler` (`getErrorMessage`); local `./client` (`api`), `./endpoints`.

**Testable behaviors:**
- `toSession(res)` mapping (private, exercised via `login`/`register`): maps `res.artist.{id,stageName,approvalStatus}` → `user.{id,name,username,approvalStatus}` (note `name` AND `username` both get `stageName` — verify both fields), and `res.accessToken` → `tokens.accessToken`.
- `login(payload)`: success → `POST ENDPOINTS.auth.login` with payload, returns `{success:true, data: toSession(res.data)}`. Failure (any thrown/rejected) → `{success:false, error: getErrorMessage(error)}`.
- `sendRegistrationOtp`: success/failure pass-through of `SendOtpResponse`.
- `verifyRegistrationOtp`: success/failure pass-through of `MessageResponse`.
- `register`: success → session via `toSession`; failure path (esp. the documented 400 "Phone verification expired" case) → `Result` failure with server message surfaced via `getErrorMessage`.
- `checkStageName(name)`: `GET` with `params: { name }`; success/failure.
- `sendPasswordResetOtp` / `verifyPasswordResetOtp` / `resetPassword`: each success/failure, each hitting its distinct endpoint.
- `logout()`: `POST ENDPOINTS.auth.logout` (no body), success → `{success:true, data:null}`; failure → `Result` failure. Note: **logout never throws even on network failure** — caller must decide whether that's desired (it means "sign out locally" proceeds regardless).
- Every one of the 9 methods needs both a success-path test (mock axios resolves) and a failure-path test (mock axios rejects, e.g. with an `AxiosError` shaped for `getErrorMessage` to normalize) — 18 behaviors total, all P0 since this is the auth critical path.

**Priority:** P0 (entirely auth/session).

**Bugs/notes:** None found. Consistent `Result<T>` contract throughout, matches its own header comment.

---

### `src/services/api/broadcastApi.ts`
**Type:** API client (per-resource, host-side live broadcasting REST half)
**Purpose:** Start/confirm/rejoin/end a broadcast, manage viewers (mute/unmute/remove), chat, pricing, analytics. Realtime half lives in `broadcastHub.ts`.
**Exports:** `broadcastApi` with 13 methods: `start`, `confirmConnected`, `rejoin`, `reportConnectionLost`, `heartbeat`, `end`, `getViewers`, `getActivity`, `sendChatMessage`, `muteViewer`, `unmuteViewer`, `removeViewer`, `setHighlightedMessagePrice`, `getAnalytics`.
**Dependencies:** `@app-types/api`, `@app-types/broadcast`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors (each has a success + failure branch → 26 total, but listing distinguishing details):**
- `start(payload)`: `POST broadcast.start` with payload → returns Agora channel/uid/token (`StartBroadcastResponse`). **P0** — this is the call-connection critical path (money/live-session start).
- `confirmConnected(id)`: `POST` no body, void response mapped to `null`.
- `rejoin(id)`: `POST broadcast.rejoin(id)` no payload → fresh `StartBroadcastResponse`. **P0**.
- `reportConnectionLost(id)`: `POST` no body.
- `heartbeat(id)`: `POST` no body — liveness ping.
- `end(id, reason?)`: conditionally sends `{reason}` vs `{}` depending on whether `reason` is truthy — test both branches explicitly.
- `getViewers(id)`: `GET` → `ListViewersResponse`.
- `getActivity(id, take=100)`: `GET` with `params:{take}`; verify default `take` value used when omitted, and custom value when passed.
- `sendChatMessage(id, messageText)`: `POST` with `{messageText}` body → returns `{message,id,createdAtUtc}`.
- `muteViewer(id, userId, reason?)`: conditional body `{reason}` vs `{}`.
- `unmuteViewer(id, userId)`: `POST` no body.
- `removeViewer(id, userId, reason?)`: conditional body like `muteViewer`.
- `setHighlightedMessagePrice(id, price)`: `PUT` with `{price}`. Money-adjacent — **P0**.
- `getAnalytics(id)`: `GET` → `BroadcastAnalytics`.

**Priority:** P0 for `start`/`rejoin`/`confirmConnected`/`reportConnectionLost`/`heartbeat`/`end`/`setHighlightedMessagePrice` (call-connection + money path), P1 for viewer moderation and read endpoints (`getViewers`/`getActivity`/`getAnalytics`/chat).

**Bugs/notes:** None found. Consistent conditional-body pattern for optional `reason` across `end`/`muteViewer`/`removeViewer` — worth one shared test helper.

---

### `src/services/api/configApi.ts`
**Type:** API client (single-endpoint)
**Purpose:** Fetches backend-owned runtime config (currently just the Agora App ID), consumed by `agoraAppId.ts`.
**Exports:** `configApi.getArtistConfig()`.
**Dependencies:** `@app-types/api`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors:**
- Success: `GET ENDPOINTS.config` → `{success:true, data: ArtistRuntimeConfig}`.
- Failure: any thrown error → `{success:false, error: getErrorMessage(error)}`.

**Priority:** P0 — indirectly gates whether Agora can initialize at all (call-connection critical path runs through this).

**Bugs/notes:** None.

---

### `src/services/api/followersApi.ts`
**Type:** API client (single-endpoint, read-only)
**Purpose:** Followers list + engagement summary.
**Exports:** `followersApi.getFollowers()`.
**Dependencies:** `@app-types/api`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors:** Success (`GET followers.list` → `FollowersResponse`) and failure branch.

**Priority:** P2 (read-only, no money/auth/call impact).

**Bugs/notes:** None.

---

### `src/services/api/groupCallApi.ts`
**Type:** API client (per-resource, host-side group calls REST half)
**Purpose:** Create/start/rejoin/cancel/end a group call; manage participants (approve/reject/remove/mute/unmute); pricing (highlighted message + refund threshold); chat/activity. Realtime half in `groupCallHub.ts`.
**Exports:** `groupCallApi` with 15 methods: `create`, `start`, `rejoin`, `heartbeat`, `setHighlightedMessagePrice`, `setRefundThreshold`, `confirmConnected`, `cancel`, `end`, `getParticipants`, `approveParticipant`, `rejectParticipant`, `removeParticipant`, `muteParticipant`, `unmuteParticipant`, `getActivity`, `sendChatMessage`.
**Dependencies:** `@app-types/api`, `@app-types/groupCall`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors (success+failure per method, 17 methods → 34 total; key branch details):**
- `create(payload)`: `POST groupCall.create` → `CreateGroupCallResponse`. **P0** (starts the money-bearing session).
- `start(id)` / `rejoin(id)`: each → `GroupCallConnectionResponse` (Agora channel/uid/token). **P0**.
- `heartbeat(id)`, `confirmConnected(id)`: void POST → `null`.
- `setHighlightedMessagePrice(id, price)`: `PUT` `{price}`. **P0** (pricing/money).
- `setRefundThreshold(id, minServiceMinutesForRefund)`: `PUT` `{minServiceMinutesForRefund}` — note the parameter is `number | null`, test the explicit-null case (clearing the threshold) separately from a numeric value. **P0** (money/refund logic).
- `cancel(id, reason?)` / `end(id, reason?)`: conditional body like broadcastApi.
- `getParticipants(id)`: `GET` → `GroupCallParticipant[]`.
- `approveParticipant`/`rejectParticipant(reason?)`/`removeParticipant(reason?)`/`muteParticipant(reason?)`/`unmuteParticipant`: each own endpoint; the three with `reason?` need both conditional-body branches tested.
- `getActivity(id, take=100)`: default vs custom `take`.
- `sendChatMessage(id, messageText)`: same shape as broadcastApi's.

**Priority:** P0 for `create`/`start`/`rejoin`/`heartbeat`/`confirmConnected`/`cancel`/`end`/`setHighlightedMessagePrice`/`setRefundThreshold` (call-connection + money), P1 for participant moderation and chat/activity reads.

**Bugs/notes:** None found. `ENDPOINTS.groupCall.analytics/history/historySummary` are defined in `endpoints.ts` but not called from this module — they're correctly consumed by `insightsApi.ts` instead, so this is by design, not a bug.

---

### `src/services/api/insightsApi.ts`
**Type:** API client (per-resource, read-only dashboard/history)
**Purpose:** Earnings summary + transaction ledger, broadcast/group-call history + summaries + per-session analytics.
**Exports:** `insightsApi` with 8 methods: `getEarningsSummary`, `getEarningsTransactions`, `getBroadcastHistory`, `getBroadcastHistorySummary`, `getBroadcastAnalytics`, `getGroupCallHistory`, `getGroupCallHistorySummary`, `getGroupCallAnalytics`.
**Dependencies:** `@app-types/api`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors (success+failure per method → 16):**
- `getEarningsSummary()`: `GET earnings.summary`. Money-adjacent (display only, no write) — **P1**, but flag as money-related.
- `getEarningsTransactions(query)`: `GET` with `params: query` — verify the whole query object is forwarded as-is (paging params).
- `getBroadcastHistory(query)` / `getGroupCallHistory(query)`: same pattern, params forwarded verbatim.
- `getBroadcastHistorySummary()`, `getGroupCallHistorySummary(status)`: the latter sends `params:{status}` — test that the `GroupCallHistoryFilter` value round-trips.
- `getBroadcastAnalytics(id)` / `getGroupCallAnalytics(id)`: id-interpolated GET.

**Priority:** P1 (read-only financial reporting — wrong numbers are bad but not a broken transaction).

**Bugs/notes:** None found.

---

### `src/services/api/kycApi.ts`
**Type:** API client (per-resource) + upload orchestration
**Purpose:** KYC status/documents/PAN/Aadhaar/bank-account read+write, mirroring the web's `kycService`.
**Exports:** `kycApi` with 8 methods: `getStatus`, `getBankAccount`, `uploadDocument`, `getViewUrl`, `savePan`, `saveAadhaar`, `saveBankAccount`, `submitKyc`.
**Dependencies:** `@app-types/api`; `@utils/errorHandler`; `./client`, `./endpoints`, `./uploadFile` (`contentTypeFor`, `fileNameFor`, `putFileToSignedUrl`).

**Testable behaviors:**
- `getStatus()`: standard success/failure.
- `getBankAccount()`: **distinctive branch** — on success, `res.data ?? null` (handles a literally-empty body); on **any thrown error** (including a 404), swallows it entirely and resolves `{success:true, data:null}` — this is the one method in the whole audited surface that turns a failure into a *success* result. Must test: (a) 404 → success/null, (b) 500/network error → **also** success/null (the catch has no status check, so a real outage is silently treated the same as "no bank account yet" — see bug note below), (c) 200 with body → success/body.
- `uploadDocument(fileUri, documentType)`: 3-step flow — `POST kyc.documentsUploadUrl` (presign) → `putFileToSignedUrl(uploadUrl, fileUri, contentType)` → resolve to a key computed as `objectKey || publicUrl || uploadUrl.split('?')[0] || ''` (test each fallback tier independently, plus the `?` split when `uploadUrl` has no query string). Failure at any of the 3 steps → single failure `Result`. **P0** (KYC/payout gating — money path).
- `getViewUrl(documentType)`: success maps `res.data?.viewUrl || res.data?.url || ''` — test both field names and the empty fallback.
- `savePan` / `saveAadhaar` / `saveBankAccount`: standard `PUT` success/failure. **P0** (bank account = money path).
- `submitKyc()`: standard `POST` success/failure. **P0** (gates payout eligibility).

**Priority:** P0 throughout (KYC/payout is money-adjacent), except `getViewUrl` which is P1 (display-only).

**Bugs/suspicious logic:**
- **`getBankAccount` (lines 40–47)**: the bare `catch { return {success:true,data:null} }` doesn't distinguish 404 ("no account yet", the documented intent) from a genuine network/server error. A real outage would silently render as "no bank account on file" instead of an error state — worth a dedicated test asserting this behavior exists as documented, and flagging to the team that it may want a status-code check (`error.response?.status === 404`) rather than blanket-catching everything.

---

### `src/services/api/liveDeliveryApi.ts`
**Type:** API client (per-resource) — **duplicate/dead file**
**Purpose:** Byte-for-byte identical to `rewardOrdersApi.ts`: same `RewardOrder`/`FunWheelSpinOrder` interfaces, same `rewardOrdersApi` and `funWheelSpinsApi` exported object names, same method bodies.
**Exports:** `rewardOrdersApi`, `funWheelSpinsApi` (colliding names with `rewardOrdersApi.ts`).
**Dependencies:** identical to `rewardOrdersApi.ts`.

**Testable behaviors:** Same list as `rewardOrdersApi.ts` below (do not duplicate test effort — see bug note).

**Priority:** N/A — flagged as dead code, not for test-writing effort.

**Bugs/dead code:** **Confirmed dead file.** Grepped the whole `src/` tree for `liveDeliveryApi` — no file imports it, and it is not re-exported from `api/index.ts`. It is an exact duplicate of `rewardOrdersApi.ts` (same content, same exported symbol names `rewardOrdersApi`/`funWheelSpinsApi`). This is almost certainly a leftover from a file rename/refactor (the task description's own framing — "some of these may have been touched by a concurrent refactor" — matches this exactly: `liveDeliveryApi.ts` looks like an abandoned rename target or an accidental copy-paste that never got wired up or deleted). **Do not write tests against this file** — flag it to be deleted; testing it would just duplicate `rewardOrdersApi.ts` coverage for a module nothing imports.

---

### `src/services/api/notificationApi.ts`
**Type:** API client (per-resource, REST half of in-app notifications + FCM device registration)
**Purpose:** List/unread-count/mark-read notifications; register/unregister the device's FCM token. Realtime half in `notificationHub.ts`.
**Exports:** `notificationApi` with 6 methods: `getNotifications`, `getUnreadCount`, `markRead`, `markAllRead`, `registerDevice`, `unregisterDevice`.
**Dependencies:** `@constants/app` (`NOTIFICATIONS`); `@app-types/api`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors (success+failure per method → 12):**
- `getNotifications(take = NOTIFICATIONS.take)`: `GET` with `params:{take}` — test default vs explicit `take`.
- `getUnreadCount()`: `GET` → `UnreadCountResponse`.
- `markRead(id)`: `POST notifications.read(id)` → returns fresh `UnreadCountResponse` (not void — verify body is passed through, not synthesized).
- `markAllRead()`: `POST notifications.readAll` → fresh `UnreadCountResponse`.
- `registerDevice(payload)`: `POST devices.register` with `{fcmToken, platform}`. **P0** (push delivery depends on this being called correctly — used by `pushNotifications.register`).
- `unregisterDevice(payload)`: `POST devices.unregister`. **P1** (best-effort per its own comment).

**Priority:** P1 overall (notifications aren't money/auth-critical), `registerDevice`/`unregisterDevice` P0-adjacent since `pushNotifications.ts` depends on them for its own critical behaviors.

**Bugs/notes:** None found.

---

### `src/services/api/privateCallApi.ts`
**Type:** API client (per-resource, host-side 1:1 call REST half)
**Purpose:** Turn 1:1 calls on/off + pricing, accept/reject requests, connect/reconnect, end, heartbeat, history, active-session lookup. Realtime half in `privateCallHub.ts`.
**Exports:** `privateCallApi` with 9 methods: `setSettings`, `getRequests`, `acceptRequest`, `rejectRequest`, `connect`, `end`, `reportConnectionLost`, `heartbeat`, `getHistory`, `getActive` (10 total, `getActive` was listed separately at the end).
**Dependencies:** `@app-types/api`, `@app-types/privateCall`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors:**
- `newIdempotencyKey()` (private helper, exercised only through `acceptRequest`): produces `` `pc-${Date.now()}-${random}` `` — a test can mock `Date.now`/`Math.random` and assert the header is generated fresh per call (not memoized) and matches the pattern `/^pc-\d+-[a-z0-9]{8}$/`.
- `setSettings(acceptsPrivateCalls, pricePerMinute?)`: `PUT` with `{acceptsPrivateCalls, pricePerMinute}` — note `pricePerMinute` is **always included in the body even when `undefined`** (unlike `privateMessageApi.setSettings`, which conditionally omits it — see bug note below). **P0** (pricing/money).
- `getRequests()`: `GET` → `PrivateCallRequestItem[]`.
- `acceptRequest(requestId)`: `POST privateCall.accept(id)` with `undefined` body and a per-call `Idempotency-Key` header → `PrivateCallConnectionResponse` (Agora details). **P0** — call-connection critical path, and the idempotency key is specifically there to prevent double-accept/double-charge, so a test must assert the header is present and unique across two calls.
- `rejectRequest(requestId, reason?)`: conditional body.
- `connect(privateCallId)`: `POST` (reconnect) → fresh `PrivateCallConnectionResponse`. **P0**.
- `end(privateCallId, reason?)`: conditional body. **P0** (ends a billed session).
- `reportConnectionLost(id)`: `POST` no body.
- `heartbeat(id)`: `POST` no body. **P0** (liveness for a billed call).
- `getHistory(take=20, skip=0)`: `GET` with `params:{take,skip}` — test defaults and explicit paging.
- `getActive()`: `GET privateCall.active` → `PrivateCallActiveSession`. **P0** (drives whether the app reconnects the artist into a live billed call on relaunch).

**Priority:** P0 for the whole module except `getHistory`/`getRequests` display reads (P1).

**Bugs/suspicious logic:**
- **`setSettings` (lines 21–34)**: always sends `pricePerMinute` in the body, even as `undefined` (which axios/JSON.stringify will drop from the JSON payload anyway, so the *wire* behavior is probably fine — `undefined` values are omitted by `JSON.stringify`). But compare directly against `privateMessageApi.setSettings`, which explicitly spreads the key in only when defined. Not a functional bug (both end up omitting the key from the JSON body when undefined), but it's inconsistent style between two nearly-identical methods — worth a test that pins down current behavior (`JSON.stringify({a:1,b:undefined})` → `{"a":1}`) so a future "helpful" refactor to one file doesn't silently change wire behavior relative to its sibling.

---

### `src/services/api/privateMessageApi.ts`
**Type:** API client (per-resource, paid-DM REST half)
**Purpose:** Settings (accept/price), inbox, conversation thread, reply (free), edit/delete own messages, delete-for-me, delete-conversation, mark-read.
**Exports:** `privateMessageApi` with 9 methods: `setSettings`, `listConversations`, `getConversation`, `reply`, `editMessage`, `deleteMessage`, `deleteMessageForMe`, `deleteConversation`, `markRead`.
**Dependencies:** `@app-types/api`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors (success+failure per method → 18):**
- `setSettings(acceptsPrivateMessages, pricePerMessage?)`: body is `{acceptsPrivateMessages, ...(pricePerMessage !== undefined ? {pricePerMessage} : {})}` — **explicitly** test that omitting `pricePerMessage` sends a body with no `pricePerMessage` key at all (verifiable via the mock call's actual second argument, not just via JSON serialization), vs. passing `0` (falsy but defined) actually includes the key — this is the key edge case (`0` must not be treated as "omit"). **P0** (pricing/money).
- `listConversations(take=50)`: default vs explicit `take`.
- `getConversation(userId, page=1, pageSize=50)`: defaults vs explicit paging params.
- `reply(userId, messageText, replyToMessageId?)`: body includes `replyToMessageId: replyToMessageId ?? null` — test both the threaded-reply case and the plain-reply case (undefined → null).
- `editMessage(messageId, messageText)`: `PUT`.
- `deleteMessage(messageId)`: `DELETE` — "delete for everyone", per comment pushes a live `PrivateMessageDeleted` event (that's the hub's job, not this file's — just confirm the REST call fires).
- `deleteMessageForMe(messageId)`: `DELETE` different endpoint (`messageForMe`).
- `deleteConversation(userId)`: `DELETE conversationDelete(userId)`.
- `markRead(userId)`: `POST`.

**Priority:** P0 for `setSettings` (money) and `reply`/`deleteMessage` (core message integrity), P1 for reads/markRead/deleteForMe.

**Bugs/notes:** None found; the `pricePerMessage !== undefined` guard is deliberate and well-documented against the web's identical behavior.

---

### `src/services/api/profileApi.ts`
**Type:** API client (per-resource) + upload orchestration
**Purpose:** Profile read/update, categories/subcategories, password/stage-name change, phone-change OTP flow, avatar/photo gallery upload (3-step presign flows), photo delete.
**Exports:** `profileApi` with 12 methods: `getProfile`, `getCategories`, `getSubcategories`, `updateProfile`, `updateCategory`, `changePassword`, `changeStageName`, `sendChangePhoneOtp`, `verifyChangePhoneOtp`, `uploadAvatar`, `getPhotos`, `uploadPhoto`, `deletePhoto` (13 total).
**Dependencies:** `@app-types/api`; `@utils/errorHandler`; `@utils/logger`; `./client`, `./endpoints`, `./uploadFile`.

**Testable behaviors:**
- `getProfile()` / `getCategories()` / `getSubcategories(categoryId)` (params forwarded) / `getPhotos()`: standard reads.
- `updateProfile(payload)` / `updateCategory(payload)`: standard writes.
- `changePassword(payload)`: **P0** (auth-adjacent — credential change).
- `changeStageName(payload)`: P1 (identity, not auth).
- `sendChangePhoneOtp(payload)` / `verifyChangePhoneOtp(payload)`: **P0** (auth-adjacent — changes the phone tied to the account).
- `uploadAvatar(fileUri)`: 3-step — presign (`POST avatarUploadUrl`) → `putFileToSignedUrl` → `POST avatar {avatarUrl: presign.data.publicUrl}` → resolves `presign.data.publicUrl`. Test failure at each of the 3 steps independently (presign fails / upload-to-storage fails / confirm-POST fails) → single failure `Result` each time, no partial success ever surfaced.
- `getPhotos()`: bare array.
- `uploadPhoto(fileUri)`: same 3-step shape as `uploadAvatar` but also calls `logger.info('Photo presigned', {pickedFrom, publicUrl})` before the actual upload — a test can assert this log fires with the right args (it's explicitly there as an early-warning signal for a server bug per the inline comment about duplicate `publicUrl`s). Same 3-failure-point coverage as `uploadAvatar`.
- `deletePhoto(photoId)`: `DELETE profile.photo(photoId)`.

**Priority:** P0 for `changePassword`/`sendChangePhoneOtp`/`verifyChangePhoneOtp` (auth path), P1 for everything else (profile display/media, no money/call impact).

**Bugs/notes:** None found; the "same `publicUrl` for two different photos" scenario is explicitly documented as a known server-side risk the logging is meant to surface, not a client bug.

---

### `src/services/api/rewardOrdersApi.ts`
**Type:** API client (per-resource, host fulfillment queue)
**Purpose:** List/fulfill reward orders and fun-wheel-spin orders (two related but distinct queues in one file).
**Exports:** `rewardOrdersApi` (`list`, `fulfill`), `funWheelSpinsApi` (`list`, `fulfill`); also exports the `RewardOrder` and `FunWheelSpinOrder` interfaces.
**Dependencies:** `@app-types/api`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors (success+failure per method → 8):**
- `rewardOrdersApi.list(status='pending', take=100, broadcastId?)`: `params: {status: status ?? '', take, ...(broadcastId ? {broadcastId} : {})}` — test: (a) default status → `'pending'`; (b) explicit `null` status → sent as `''` (empty string, not omitted — distinct branch from "use default"); (c) `broadcastId` provided vs omitted (conditional spread).
- `rewardOrdersApi.fulfill(orderId)`: `POST rewardOrders.fulfill(orderId)`. **P0** (this delivers a good/service the fan paid for — money-adjacent fulfillment).
- `funWheelSpinsApi.list(status='pending', take=100, sessionId?)`: same three-branch pattern as above, with `sessionId` instead of `broadcastId`.
- `funWheelSpinsApi.fulfill(spinId)`: `POST funWheelSpins.fulfill(spinId)`. **P0** (same fulfillment-of-paid-item reasoning).

**Priority:** P0 for both `fulfill` methods, P1 for `list`.

**Bugs/notes:** None found in this file itself — see `liveDeliveryApi.ts` above for the duplicate-file finding.

---

### `src/services/api/settingsApi.ts`
**Type:** API client (per-resource, creator settings: reward menu + fun wheel)
**Purpose:** Full CRUD for the reward menu and the fun wheel (including its activities), mirroring the web's `artistSettingsService`.
**Exports:** `settingsApi` with 10 methods: `getRewardMenu`, `createReward`, `getFunWheel`, `createActivity`, `updateFunWheel`, `setFunWheelActive`, `deleteFunWheel`, `updateActivity`, `setRewardActive`, `updateReward`; also exports `DeleteWheelResult` type (a union distinct from the standard `Result<T>`).
**Dependencies:** `axios` (for `axios.isAxiosError`); `@app-types/api`; `@utils/errorHandler`; `./client`, `./endpoints`.

**Testable behaviors:**
- `getRewardMenu()`: bare-array GET.
- `createReward(payload)`: `POST` → created `RewardMenuItem` with id.
- `getFunWheel()`: **distinctive branch** — server can answer 200 with `{message: "Fun wheel not found."}` instead of a real wheel or a 404. Logic: `wheel = body && typeof body === 'object' && 'id' in body ? body as FunWheel : null`. Must test: (a) real wheel body (has `id`) → returned as-is; (b) `{message: "..."}` body (no `id`) → collapsed to `null`, still `success:true`; (c) actual thrown/network error → `success:false`. This is a **P0-adjacent correctness case** — the file's own comment says a wrong guard here previously crashed the whole Settings screen on `wheel.activities.length` for new artists, so this is a regression-prone area.
- `createActivity(payload)`: `POST`, returns `null` regardless of body (caller must refetch) — confirm the method doesn't try to parse/return the response body.
- `updateFunWheel(wheelId, payload)` / `setFunWheelActive(wheelId, isActive)` (PATCH) / `updateActivity(activityId, payload)`: standard writes, verify PATCH vs PUT verb choice specifically since it's called out as matching the web.
- `deleteFunWheel(wheelId)`: **distinctive branch** — on success, standard `{success:true,data:null}`. On error: if `axios.isAxiosError(error) && error.response?.status === 409` → returns `{success:false, conflict:true, error: message || defaultMsg}`, where `message` comes from `(error.response.data as {message?:string})?.message`. Test all three: (a) success, (b) 409 with a server message (message used verbatim), (c) 409 with no/empty message (default `"This fun wheel has spin history and can't be deleted."` used), (d) non-409 error (falls through to the generic `getErrorMessage` path, `conflict` field absent). **P0** — this is a genuine business-rule branch (can't-delete-with-history) that a naive test suite would easily miss if it only checked the happy path.
- `setRewardActive(id, isActive)` (PATCH) / `updateReward(id, payload)` (PUT): standard writes.

**Priority:** P0 for `getFunWheel` (crash-history regression) and `deleteFunWheel` (409 business rule), P1 for the rest (settings, not money/call-connection directly, though reward/wheel pricing feeds into money elsewhere).

**Bugs/notes:** None found in current code — both distinctive branches described above are deliberate fixes per the inline comments, not bugs, but they are exactly the kind of logic a shallow test suite skips, so call them out for the test-writing phase.

---

### `src/services/api/uploadFile.ts`
**Type:** Service wrapper (native upload helper, not an axios-based API client)
**Purpose:** PUTs a local file straight to a presigned storage URL using `expo-file-system/legacy`'s `uploadAsync` (deliberately bypassing the shared `api` axios instance and blob conversion). Also provides MIME/filename helpers used by `kycApi`/`profileApi`.
**Exports:** `putFileToSignedUrl(uploadUrl, fileUri, contentType)`, `contentTypeFor(fileName)`, `fileNameFor(uri)`.
**Dependencies:** `expo-file-system/legacy` (`FileSystemUploadType`, `getInfoAsync`, `uploadAsync`); `@utils/logger`. Native module: Expo FileSystem.

**Testable behaviors:**
- `putFileToSignedUrl`:
  1. Calls `getInfoAsync(fileUri)` first and logs `'Uploading file'` with `bytes: info.exists ? info.size : 'missing'` — test both the `exists:true` (logs numeric size) and `exists:false` (logs `'missing'`) branches.
  2. Calls `uploadAsync(uploadUrl, fileUri, {httpMethod:'PUT', uploadType: BINARY_CONTENT, headers: {'Content-Type': contentType, 'x-amz-acl':'public-read'}})` — assert headers exactly, especially the hardcoded ACL (signature-critical per the comment).
  3. **`uploadAsync` resolves on ANY status** (documented quirk) — so success requires manually checking `result.status`. Branch: `status < 200 || status >= 300` → error path; else → success path (logs `'File uploaded to storage'`, resolves `void`).
  4. On error branch: `storageErrorCode(result.body)` extracts `<Code>...</Code>` via regex from an S3/Spaces XML error body. Test: (a) body contains a `<Code>SignatureDoesNotMatch</Code>` → thrown `Error('Upload failed (SignatureDoesNotMatch). Please try again.')`; (b) body present but no `<Code>` tag → thrown generic `Error('Upload failed. Please try again.')`; (c) `result.body` undefined → same generic message, and `storageErrorCode('')` must not throw.
  5. Also test the `logger.warn('Storage upload rejected', {status, code, body: result.body?.slice(0,300)})` call fires on failure with the truncated body.
- `contentTypeFor(fileName)`: extension → MIME table. Branches: `png`→`image/png`, `webp`→`image/webp`, `heic`/`heif`→`image/heic`, `gif`→`image/gif`, anything else (including no extension) → `image/jpeg` (default/fallback branch). Case-insensitivity: test `.PNG` uppercase too (`.toLowerCase()` is applied).
- `fileNameFor(uri)`: strips query string (`uri.split('?')[0]`), takes the last path segment; if that segment contains a `.` → returned as-is; else → falls back to `` `upload-${Date.now()}.jpg` ``. Test: (a) normal `file:///.../photo.jpg` → `photo.jpg`; (b) URI with `?token=...` query string → query stripped before extracting name; (c) URI with no extension/dot in the last segment → generated fallback name (mock `Date.now`); (d) URI ending in `/` (empty last segment) → also falls back (falsy `last`).

**Priority:** P0 — this is the literal bytes-on-the-wire step for every avatar/photo/KYC-document upload; a signature mismatch here silently breaks all uploads app-wide, and the multi-tier error-code extraction is exactly the kind of logic that regresses silently.

**Bugs/notes:** None found; the file's own comments pre-empt the two most common mistakes (blob conversion unreliability, ACL header signature coverage) and the code matches them.

---

## src/services/storage/

### `src/services/storage/index.ts`
**Type:** Barrel/hub
**Purpose:** Re-exports `secureStorage`, `mmkvStorage`, `storage` (alias), and their types.
**Exports:** as named above.
**Dependencies:** `./secureStorage`, `./mmkvStorage`.

**Testable behaviors:** Barrel smoke test only.
**Priority:** P2.
**Bugs/notes:** None.

---

### `src/services/storage/mmkvStorage.ts`
**Type:** Service wrapper (non-sensitive persistent KV store)
**Purpose:** Async wrapper around `AsyncStorage` (despite the filename, it is **not** MMKV yet — the header comment explicitly says it's a placeholder pending an EAS dev build, kept AsyncStorage-backed so it runs in Expo Go). Used for non-sensitive data (active-call records, Agora App ID cache, etc.) — explicitly NOT for tokens.
**Exports:** `mmkvStorage` (`getString`, `getBoolean`, `getJSON<T>`, `setString`, `setBoolean`, `setJSON`, `remove`, `clearAll`), `storage` (minimal alias: `set`/`getString`/`delete`/`clearAll`), type `MmkvStorage`.
**Dependencies:** `@react-native-async-storage/async-storage`; `@utils/logger`. Native module: AsyncStorage (mocked in jest.setup via the official async-storage jest mock).

**Testable behaviors:**
- `getString(key)`: success → returns stored value or `null`; on thrown error from `AsyncStorage.getItem` → caught, `logger.warn` fires, returns `null` (never throws).
- `getBoolean(key)`: returns `true` iff `getString(key) === 'true'` exactly — test `'false'`, `null`, `'TRUE'` (wrong case), and any other string all resolve `false`.
- `getJSON<T>(key)`: `raw == null` → `null` (no parse attempted). `raw` present but invalid JSON → caught, `logger.warn('storage.getJSON parse failed', ...)`, returns `null`. Valid JSON → parsed and returned as `T`.
- `setString(key, value)`: success → calls `AsyncStorage.setItem`; on thrown error → caught, `logger.warn`, resolves anyway (never throws/rejects).
- `setBoolean(key, value)`: delegates to `setString(key, value ? 'true' : 'false')`.
- `setJSON(key, value)`: delegates to `setString(key, JSON.stringify(value))` — test with an object containing `undefined` values (JSON.stringify drops them) since callers rely on this for optional fields.
- `remove(key)`: success/failure (caught, warn-logged, never throws).
- `clearAll()`: success/failure (caught, warn-logged, never throws).
- `storage` alias: each of `set`/`getString`/`delete`/`clearAll` correctly delegates to the corresponding `mmkvStorage` method (not reimplemented).

**Priority:** P1 (not on the money/auth path directly, but every active-call-record store and the Agora App ID cache depend on it working correctly — a silent failure here means "rejoin my live broadcast" silently loses state, which is a real user-facing failure even if not literally money). Bump `getJSON`/`setJSON` to P0-adjacent since they underlie all three "active session" recovery stores.

**Bugs/notes:** None found; every method is defensively wrapped and never throws, matching its "silent, best-effort" design intent.

---

### `src/services/storage/secureStorage.ts`
**Type:** Service wrapper (encrypted storage for tokens/PII)
**Purpose:** Wraps `expo-secure-store` for access-token storage; explicitly the ONLY approved place for tokens.
**Exports:** `secureStorage` (`set`, `get`, `remove`, `removeMany`), type `SecureStorage`.
**Dependencies:** `expo-secure-store`; `@utils/logger`. Native module: SecureStore (mocked in jest.setup with an in-memory `Map`).

**Testable behaviors:**
- `set(key, value)`: calls `SecureStore.setItemAsync(key, value, OPTIONS)` with `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`. **On failure: logs `logger.error` then RETHROWS** — this is the one storage method in the whole audited surface that does NOT swallow errors; test that the rejection propagates to the caller (contrast with every other method here and in `mmkvStorage`, which all swallow). **P0** — a caller like `performRefresh` relies on `secureStorage.set` either succeeding or throwing loudly, not silently no-op'ing a token write.
- `get(key)`: success → returns stored value or `null`. Failure → caught, `logger.error`, returns `null` (does NOT rethrow, asymmetric with `set`) — test this asymmetry explicitly, it's easy to assume symmetric error handling and miss it.
- `remove(key)`: failure → caught, `logger.error`, resolves anyway (does not rethrow).
- `removeMany(keys)`: `Promise.all(keys.map(key => this.remove(key)))` — since `remove` never rejects, this always resolves once every individual removal (success or logged-failure) completes; test with a mix of keys where the underlying mock is set to fail for one key, confirming `removeMany` still resolves and every key's removal was still attempted (not short-circuited).

**Priority:** P0 throughout — this is literally where the access token lives; the interceptor's entire refresh flow (`interceptors.ts` line 58: `secureStorage.set(SECURE_KEYS.accessToken, ...)`) depends on `set`'s rethrow behavior being correct, and login/logout depend on `get`/`remove`/`removeMany`.

**Bugs/suspicious logic:**
- **Asymmetric error handling between `set` (rethrows) and `get`/`remove` (swallow)** is very likely intentional (a failed *write* of a fresh token should be visible/handled by the caller; a failed *read* should degrade to "no token" rather than crash a render), but it is the single easiest thing for a future refactor to accidentally "fix" into consistency and break the refresh flow. Flag as a **must-test-explicitly** behavior, not a bug — but worth a comment in the test file cross-referencing this audit entry so nobody "cleans it up" later.
- `removeMany`'s use of `this.remove` inside a plain object literal (not a class) relies on `this` binding correctly when called as `secureStorage.removeMany(...)` — safe in normal use, but would break if `removeMany` were ever destructured off the object (e.g. `const {removeMany} = secureStorage`) and called standalone. Not a current bug (no call site does this — confirm via grep before testing), just a fragility worth one regression test (call via the object, not destructured) to pin the working pattern.

---

## src/services/agora/

### `src/services/agora/agoraAppId.ts`
**Type:** Service wrapper (Agora config cache)
**Purpose:** Resolves/caches the Agora App ID: in-memory cache, mirrored to `mmkvStorage`, backed by `configApi`, with an env-var last-resort fallback.
**Exports:** `primeAgoraAppId()`, `loadAgoraAppId()`, `getAgoraAppId()`.
**Dependencies:** `@constants/app` (`AGORA_APP_ID`); `@services/api/configApi` (`configApi`); `@services/storage` (`mmkvStorage`); `@utils/logger`.

**Testable behaviors:**
- Module-level `cached` starts `null` (per test file, needs `jest.resetModules()` between cases since this is closure state, not resettable any other way).
- `primeAgoraAppId()`: if `cached` already truthy → no-op, does NOT read storage (test that `mmkvStorage.getString` is NOT called in this case). If `cached` is null: reads `mmkvStorage.getString(STORAGE_KEY)`; if a stored value exists → sets `cached` to it; if storage returns `null` → `cached` stays `null`.
- `loadAgoraAppId()`: calls `configApi.getArtistConfig()`.
  - Failure (`result.success === false`) → `logger.warn('Agora App ID not loaded from /api/artist/config', {error})`, `cached` unchanged, storage NOT written.
  - Success but `result.data.agoraAppId` falsy (empty string/undefined) → returns early, `cached` unchanged, storage NOT written — test this branch specifically, it's easy to only test "success with a real id".
  - Success with a real `agoraAppId` → sets `cached = appId` AND `mmkvStorage.setString(STORAGE_KEY, appId)` — both effects must be asserted.
- `getAgoraAppId()` (synchronous):
  - `cached` truthy → returns it directly, no side effects.
  - `cached` falsy AND `AGORA_APP_ID` (env fallback) falsy → `logger.error('Agora App ID unavailable...')` fires, then returns `AGORA_APP_ID` (which is falsy — i.e., returns `''`/`undefined`, an unusable value that callers like `agoraEngine.joinAsHost` explicitly check for).
  - `cached` falsy AND `AGORA_APP_ID` truthy → returns the env fallback silently, no error log.

**Priority:** P0 — every Agora join call (`joinAsHost`, `joinPrivateCallChannel`, `getEngine`'s `initialize`) is gated on this returning a usable App ID; this is squarely on the call-connection critical path.

**Bugs/notes:** None found. The three-tier fallback (memory → storage → env) and the two independent write sites (memory cache + persisted storage) are both correctly implemented per the header comment's stated design.

---

### `src/services/agora/agoraEngine.ts`
**Type:** Native wrapper (Agora RTC engine facade) — the file explicitly named for deep enumeration per the task instructions.
**Purpose:** Lazily loads `react-native-agora` (guarded against Expo Go, where the native module doesn't exist), creates/reuses a single `IRtcEngine` instance, and exposes host-publish join/leave/mute/switch-camera functions plus a normalized event-handler bridge.
**Exports (every exported function, enumerated):**
1. `requestCallPermissions(): Promise<boolean>`
2. `isAgoraAvailable(): boolean`
3. `startLocalPreview(): void`
4. `joinAsHost(channelName, uid, token, handlers): void`
5. `joinPrivateCallChannel(channelName, uid, token, handlers): void`
6. `setLocalAudioEnabled(enabled: boolean): void`
7. `setLocalVideoEnabled(enabled: boolean): void`
8. `switchCamera(): void`
9. `leaveChannel(): void`
10. `destroyAgoraEngine(): void`
- Plus exported constant `AGORA_UNAVAILABLE_MESSAGE` and type `AgoraHostHandlers`.

**Dependencies:** `react-native` (`PermissionsAndroid`, `Platform`); `expo-constants` (`Constants`, `ExecutionEnvironment`) — used to detect Expo Go; `react-native-agora` (lazily `require`d, NOT statically imported — critical for testability, see below); local `./agoraAppId` (`getAgoraAppId`).

**Module-level state (all closure variables — must reset between tests via `jest.resetModules()`):** `IS_EXPO_GO` (computed once at import), `rtc` (cached module ref, `undefined` = not yet attempted, `null` = load failed/unavailable), `nativeUnavailable` (boolean, latched true after a native crash), `engine` (the singleton `IRtcEngine` or `null`), `currentHandler` (the currently-registered event handler object or `null`), `previewStarted` (boolean).

**Exact call sequences per exported function (this is what jest.setup.ts's `mockAgoraEngine` must be asserted against):**

1. **`requestCallPermissions()`**:
   - `Platform.OS !== 'android'` → returns `true` immediately, no native call (iOS/web branch).
   - Android: `PermissionsAndroid.requestMultiple([CAMERA, RECORD_AUDIO])` → returns `true` only if **both** are `GRANTED`; any other combination (one granted, one denied, both denied) → `false`.
   - Android + `requestMultiple` throws → caught, returns `false`.

2. **`isAgoraAvailable()`**: calls `loadRtc()` internally, returns `loadRtc() !== null`.
   - `loadRtc()` internal branches (not exported, only reachable via `isAgoraAvailable`/other exports):
     - `IS_EXPO_GO === true` → returns `null` immediately, `require('react-native-agora')` never called.
     - `nativeUnavailable === true` (latched from an earlier failure) → returns `null` immediately, no re-require attempted.
     - Otherwise, first call: `require('react-native-agora')`; if it throws → caches `rtc = null`. If it succeeds but `mod.createAgoraRtcEngine` isn't a function → also `rtc = null`. If it succeeds and has a valid `createAgoraRtcEngine` → caches `rtc = mod`.
     - Subsequent calls: since `rtc !== undefined`, returns the cached value without re-requiring (test: `require`/mock factory called at most once across multiple `isAgoraAvailable()` calls).

3. **`startLocalPreview()`**:
   - Sequence when available and not already started: `getEngine()` → `eng.startPreview()` → `eng.enableVideo()` → `eng.enableLocalVideo(true)` → `eng.enableLocalAudio(true)` → sets `previewStarted = true`. Assert **exact call order** against `mockAgoraEngine`.
   - `previewStarted` already `true` → no-op, none of the four engine methods called (idempotency guard — test calling twice, assert single set of calls).
   - `loadRtc()` returns null or `getEngine()` returns null → no-op, no throw.
   - Any engine call throws → caught silently (comment: "joinAsHost retries this setup"), `previewStarted` stays `false`.
   - `getEngine()` internal sequence (first call only, memoized in `engine`): `mod.createAgoraRtcEngine()` → `created.initialize({appId: getAgoraAppId()})` → `created.setChannelProfile(ChannelProfileLiveBroadcasting)` → caches as `engine`. If any of these three throws: sets `nativeUnavailable = true`, `rtc = null`, `engine = null`, returns `null` — this is a **permanent-latch failure mode**, meaning a single init failure disables Agora for the rest of the app session (test explicitly: after one failed `getEngine()`, subsequent `isAgoraAvailable()` returns `false` even though `IS_EXPO_GO` was never true).

4. **`joinAsHost(channelName, uid, token, handlers)`** — the primary broadcaster join path:
   - Branch A — `loadRtc()`/`getEngine()` unavailable: `setTimeout(() => handlers.onError?.(AGORA_UNAVAILABLE_MESSAGE), 0)`, function returns immediately (test with fake timers, assert `onError` called async, not sync).
   - Branch B — engine available but `getAgoraAppId()` falsy: `setTimeout(() => handlers.onError?.('Live video is not available right now. Please try again later.'), 0)`, returns — note this check happens AFTER `getEngine()` succeeds (so the engine may already be created even though the join is aborted).
   - Branch C — happy path, exact sequence: `attachHandler(eng, mod, handlers)` (registers the event handler — see below) → `startLocalPreview()` → `eng.setClientRole(ClientRoleBroadcaster)` → `eng.joinChannel(token, channelName, uid, {clientRoleType: Broadcaster, channelProfile: LiveBroadcasting, autoSubscribeAudio:true, autoSubscribeVideo:true, publishCameraTrack:true, publishMicrophoneTrack:true})`. Assert the exact options object.
   - Branch C1 — `joinChannel` returns non-zero (`joinResult !== 0`): `setTimeout(() => handlers.onError?.(\`Couldn't go live (code ${joinResult}). Please try again.\`), 0)` — test with e.g. `mockAgoraEngine.joinChannel.mockReturnValueOnce(-2)`, assert the exact interpolated message.
   - Branch C2 — `joinChannel` returns `0`: no error callback fires synchronously from this function (success is instead signaled later via the registered handler's `onJoinChannelSuccess` → `handlers.onJoinSuccess?.()`).
   - Branch D — any synchronous throw inside the try block: sets `nativeUnavailable = true`, `rtc = null`, `engine = null`, `currentHandler = null` (full teardown/reset), then `setTimeout(() => handlers.onError?.(AGORA_UNAVAILABLE_MESSAGE), 0)`.

5. **`joinPrivateCallChannel(channelName, uid, token, handlers)`** — symmetric 1:1 call path, nearly identical structure to `joinAsHost` but:
   - Same unavailable/no-appId branches with the SAME message strings (worth confirming they're actually shared literal strings, not typo'd copies — they are copy-pasted per-function, not shared constants, so a test should catch drift if one is edited and the other isn't).
   - Happy path: `attachHandler` → `startLocalPreview()` → `eng.joinChannel(token, channelName, uid, {channelProfile: Communication, autoSubscribeAudio:true, autoSubscribeVideo:true, publishCameraTrack:true, publishMicrophoneTrack:true})` — **deliberately does NOT call `setClientRole`** (comment explicitly warns against it: "do NOT set clientRole here or joinChannel can reject with error -2"). A regression test should assert `mockAgoraEngine.setClientRole` is **never called** in this path, as a guard against a future edit reintroducing it.
   - `joinResult !== 0` → `` `Couldn't start the call (code ${joinResult}). Please try again.` `` (different message text from `joinAsHost`'s "Couldn't go live").
   - Same catch-all teardown/reset branch as `joinAsHost`.

6. **`attachHandler(eng, mod, handlers)`** (internal, exercised only through `joinAsHost`/`joinPrivateCallChannel` — this is the event-emission surface the mock's `registerEventHandler` call captures):
   - If `currentHandler` already set (a previous join's handler) → calls `eng.unregisterEventHandler(currentHandler)` first (wrapped in try/catch, swallows failure) before registering the new one — test re-joining twice in a row unregisters the first handler.
   - Registers a **new** handler object via `eng.registerEventHandler(handler)`, and updates module-level `currentHandler`.
   - The handler object's callbacks (these are the "events the engine can emit that the wrapper listens for" — grab `mockAgoraEngine.registerEventHandler.mock.calls[0][0]` and invoke each to test):
     - `onJoinChannelSuccess: () => handlers.onJoinSuccess?.()` — no args used.
     - `onUserJoined: (_c, remoteUid) => handlers.onRemoteUserJoined?.(remoteUid)`.
     - `onUserOffline: (_c, remoteUid) => handlers.onRemoteUserLeft?.(remoteUid)`.
     - `onRemoteVideoStateChanged: (_c, remoteUid, state) => handlers.onRemoteVideoOn?.(remoteUid, on)` where `on = state !== RemoteVideoStateStopped && state !== RemoteVideoStateFailed` — test all 3+ states: `Stopped`→`false`, `Failed`→`false`, anything else (e.g. a "frozen"/"decoding" state value) → `true` (per the comment, frozen still counts as "on").
     - `onRemoteAudioStateChanged: (_c, remoteUid, state) => handlers.onRemoteAudioOn?.(remoteUid, on)` — same `Stopped`/`Failed` → `false`, else `true` logic, mirrored independently for audio.
     - `onConnectionStateChanged: (_c, state) => handlers.onConnectionStateChanged?.(label)` where `label` is looked up in `CONNECTION_LABEL` map (`Disconnected`/`Connecting`/`Connected`/`Reconnecting`/`Failed`); if the numeric `state` isn't in the map → `label` is `undefined` and the handler is **not called at all** (guarded by `if (label)`) — test an unmapped state value is silently dropped, not passed through as `undefined`.
     - `onError: (err, msg) => handlers.onError?.(msg || \`Agora error ${err}\`)` — test both a truthy `msg` (used verbatim) and an empty/falsy `msg` (falls back to the interpolated `err` code).

7. **`setLocalAudioEnabled(enabled)`**: no-op if `engine` is `null` (not yet joined/already destroyed). Else `eng.muteLocalAudioStream(!enabled)` — note the **inversion**: `enabled=true` → `muteLocalAudioStream(false)`. Wrapped try/catch, silently swallows any engine-call exception.

8. **`setLocalVideoEnabled(enabled)`**: no-op if `engine` null. Else calls BOTH `eng.muteLocalVideoStream(!enabled)` AND `eng.enableLocalVideo(enabled)` — test both calls happen together, in that order, with the correct (and differently-signed — one inverted, one not) argument each.

9. **`switchCamera()`**: no-op if `engine` null; else `eng.switchCamera()`, try/catch swallowed.

10. **`leaveChannel()`**: calls `resetPreviewState()` (sets `previewStarted = false`) **unconditionally, even if `engine` is null** — test this: call `leaveChannel()` before any join, assert no crash and `previewStarted` state is reset regardless. If `engine` non-null: `eng.stopPreview()` then `eng.leaveChannel()`, in that order; try/catch swallowed; `engine` is NOT nulled out here (contrast with `destroyAgoraEngine`, which does null it) — test that calling `leaveChannel()` then `setLocalAudioEnabled()` still works (engine reference retained for a later rejoin).

11. **`destroyAgoraEngine()`**: calls `resetPreviewState()` unconditionally first. If `engine` null → returns (no further calls). If `engine` non-null: if `currentHandler` set → `eng.unregisterEventHandler(currentHandler)` then `currentHandler = null`; then `eng.leaveChannel()`; then `eng.release()`; all in a try/catch/finally where the **`finally` block always sets `engine = null`** regardless of whether the try threw — test that even if `eng.release()` throws, `engine` still ends up `null` afterward (so a subsequent `getEngine()` call will recreate a fresh engine rather than reusing a possibly-corrupt one).

**Priority:** P0 across the entire file — this is the literal call-connection critical path for all three live-session types (broadcast, group call, private call), and the task explicitly calls it out for exhaustive enumeration.

**Bugs/suspicious logic:**
- **Permanent latch on `getEngine()` failure** (documented above under `startLocalPreview`/point 3): once `nativeUnavailable = true` is set (whether from `getEngine()`'s own catch, or from the catch blocks in `joinAsHost`/`joinPrivateCallChannel`), there is **no exported function that ever resets it back to `false`**. A transient native-module hiccup on first use permanently disables Agora for the rest of the app's lifetime (until process restart) — worth flagging to the team as a real reliability bug, and definitely worth a test that pins down this exact "never recovers" behavior so it's a conscious decision if it stays.
- **Duplicated literal error-message strings** across `joinAsHost` and `joinPrivateCallChannel` for the "no App ID" case (`'Live video is not available right now. Please try again later.'` appears twice, byte-identical) — not a bug today, but a drift risk; a test asserting the exact string in both call sites will catch future divergence.
- `onConnectionStateChanged`'s silent-drop-on-unmapped-state (`if (label) handlers.onConnectionStateChanged?.(label)`) means an SDK version bump that introduces a new `ConnectionStateType` enum value would silently stop notifying the UI of that state change, with no log/warn anywhere in this path — worth a test pinning current behavior and flagging the missing fallback/log as a minor gap.

---

## src/services/push/

### `src/services/push/pushNotifications.ts`
**Type:** Service wrapper (FCM push: permission, token registration, listeners)
**Purpose:** Requests notification permission (platform-specific), fetches/registers the FCM token, and wires foreground/background-tap/quit-tap/token-refresh listeners, bridging into `useNotificationStore` and `navigateToNotification`.
**Exports:** `pushNotifications` object with `register()`, `unregister()`, `setupListeners()`.
**Dependencies:** `@react-native-firebase/messaging` (`AuthorizationStatus`, `getInitialNotification`, `getMessaging`, `getToken`, `onMessage`, `onNotificationOpenedApp`, `onTokenRefresh`, `requestPermission`); `react-native` (`PermissionsAndroid`, `Platform`); `@services/api` (`notificationApi`); `@store/notificationStore` (`useNotificationStore`); `@app-types/api`; `@utils/logger`; `@utils/notifications` (`navigateToNotification`). Native modules: Firebase Messaging, PermissionsAndroid.

**Module-level state:** `currentToken: string | null`, `listenersAttached: boolean` — both closure vars, need `jest.resetModules()` between test cases that depend on their initial state.

**Testable behaviors:**

`platformName()` (internal, exercised via `register`/listeners): `Platform.OS === 'ios' ? 'ios' : 'android'` — note **any non-iOS platform (including `'web'`, `'windows'`) maps to `'android'`**, not just literal Android — worth a dedicated test since it's a silent fallback, not an exhaustive switch.

`messagingInstance()` (internal): `Platform.OS === 'web'` → returns `null` immediately, no `getMessaging()` call. Else: calls `getMessaging()`; on throw → `logger.warn('Firebase messaging unavailable', ...)`, returns `null`.

**`register()`:**
1. `messagingInstance()` returns `null` (web, or messaging unavailable) → returns immediately, no permission/token logic runs at all.
2. Android branch: `Platform.Version >= 33` (numeric check, so also test `typeof Platform.Version !== 'number'` — e.g. iOS-style string version accidentally hitting the Android branch — falls to the `else` "granted=true" path since the `typeof` guard fails) → `PermissionsAndroid.request(POST_NOTIFICATIONS)`, `granted = res === RESULTS.GRANTED` (test both granted and denied results). `Platform.Version < 33` → `granted = true` unconditionally, no native prompt call at all.
3. Non-Android branch: `requestPermission(messaging)` → `granted = status === AUTHORIZED || status === PROVISIONAL` (test both truthy statuses individually, plus `DENIED`/`NOT_DETERMINED` → `false`).
4. `!granted` → `logger.info('Push permission not granted')`, returns — **no token fetch attempted at all** when permission denied.
5. `granted` → `getToken(messaging)` → sets module-level `currentToken = token` → `notificationApi.registerDevice({fcmToken: token, platform: platformName()})`. On `result.success === false` → `logger.warn('Device registration failed', {error})` (does not throw/retry).
6. Any thrown error anywhere in the try block (permission request throws, `getToken` throws, etc.) → caught at the outer level, `logger.warn('Push registration failed', ...)` — the whole function never throws.

**`unregister()`:**
7. `currentToken` is `null` (never registered, or already unregistered) → returns immediately, `notificationApi.unregisterDevice` NOT called.
8. `currentToken` set: captures it locally, **nulls `currentToken` BEFORE the await** (so a concurrent `register()` call racing with `unregister()` won't clobber a fresh token — worth a concurrency test), then calls `notificationApi.unregisterDevice({fcmToken: token})`. `result.success === false` → `logger.warn`. Thrown error → caught, `logger.warn('Device unregistration failed', ...)`.

**`setupListeners()`:**
9. `messagingInstance()` null OR `listenersAttached` already `true` → returns a no-op `() => {}` function, none of the four listener-registration calls happen. **Idempotency test**: call `setupListeners()` twice, assert `onMessage`/`onNotificationOpenedApp`/`onTokenRefresh`/`getInitialNotification` are each only invoked once total.
10. Sets `listenersAttached = true` before registering.
11. **Foreground listener** (`onMessage`): registers a handler that calls `parseNotificationData(message)`; if non-null → `useNotificationStore.getState().ingest(item)`. Test: message with no parseable id → `parseNotificationData` returns `null` → `ingest` NOT called.
12. **Background-tap listener** (`onNotificationOpenedApp`): handler calls `parseNotificationData(message)`; if non-null → `navigateToNotification(item)` (synchronous, no `setTimeout`).
13. **Quit-tap flow** (`getInitialNotification(messaging)`, a promise, not an event subscription): resolves `null` (no message) → no-op, returns without calling `navigateToNotification`. Resolves a message → `parseNotificationData`; if non-null → `setTimeout(() => navigateToNotification(item), 300)` (deliberately delayed to let the router mount — test with fake timers, assert it does NOT navigate synchronously). If the promise **rejects** → caught, `logger.warn('getInitialNotification failed', ...)`.
14. **Token-refresh listener** (`onTokenRefresh`): handler sets `currentToken = token` then calls `notificationApi.registerDevice({fcmToken: token, platform: platformName()})`; `result.success===false` → `logger.warn('Device re-registration failed', ...)`.
15. Returned cleanup function: calls `unsubscribeMessage()`, `unsubscribeOpened()`, `unsubscribeTokenRefresh()` (in that order — note **NOT** `unsubscribeInitialNotification`, since `getInitialNotification` is a one-shot promise, not a subscription — nothing to unsubscribe there, correctly), and sets `listenersAttached = false` (allowing a future `setupListeners()` call to re-attach). Test that calling the cleanup then calling `setupListeners()` again re-registers everything.

`parseNotificationData(message)` (internal, exercised via all three listener paths above):
16. `id = data.id ?? message.messageId`; if both falsy → returns `null` (no notification surfaced at all — test this explicitly, e.g. a malformed push with no id anywhere).
17. Field fallbacks: `type` defaults `'system'`; `title`/`body` fall back to `message.notification?.title`/`.body` then to `''`; `referenceType`/`referenceId`/`actionUrl` default to `null`; `isRead` is **hardcoded `false`** always (never read from the payload); `createdAtUtc` falls back to `new Date().toISOString()` if not in `data` — test with a fully-populated `data` object (all fields from payload used) vs a minimal one (all fallbacks engaged) vs one relying on the OS-rendered `notification` block instead of `data.title`/`data.body`.

**Priority:** P1 overall (push notifications are important but not literally money/auth-critical), except `register()`/`unregister()`'s interaction with `notificationApi` which ties into device-registration correctness — keep those P1 as well, nothing here is P0. `parseNotificationData`'s id-derivation and the quit-tap `setTimeout(300)` delay are the two easiest things to get subtly wrong — prioritize those within P1.

**Bugs/suspicious logic:**
- **`unregister()`'s pre-await null of `currentToken`** (point 8) is a deliberate race-guard per its ordering, but there's no test-visible comment confirming intent — worth pinning down with an explicit concurrency test (fire `register()` then immediately `unregister()`, or vice versa) so behavior is locked in.
- **`platformName()`'s "everything non-iOS is android"** fallback (point covering `platformName`) would misreport `'web'` as `'android'` to the backend's `registerDevice` payload — low real-world impact since `messagingInstance()` already returns `null` and short-circuits `register()` on web, but `setupListeners`'s token-refresh handler (#14) also calls `platformName()` and is reachable any time `onTokenRefresh` fires, which per `messagingInstance`'s web guard should never fire on web either — so this is dead-but-not-technically-unreachable code, worth one test confirming the guard actually prevents it end-to-end rather than assuming it does.

---

## src/services/realtime/

All five hub files share a nearly identical shape: `HubConnectionBuilder().withUrl(url, {accessTokenFactory}).withAutomaticReconnect().configureLogging(Warning).build()`, register `.on(event, cb)` handlers, register `.onreconnected()` to re-invoke the "join group" RPC, `connect()`/`disconnect()` exported methods, module-level `connection`/`joined-id` state, everything wrapped so nothing throws out of `connect()`/`disconnect()`. Enumerated individually below per the task's requirement.

### `src/services/realtime/broadcastHub.ts`
**Type:** SignalR hub wrapper
**Purpose:** Host-side live broadcast realtime channel — activity feed, viewer count, fulfillment updates, broadcast-ended signal.
**Exports:** `broadcastHub` object (`connect(broadcastId, handlers)`, `disconnect()`). Type `BroadcastHubHandlers`.
**Dependencies:** `@microsoft/signalr`; `@constants/app` (`API_CONFIG`, `SECURE_KEYS`); `@services/storage` (`secureStorage`); `@app-types/broadcast`; `@utils/logger`.

**Events the hub can emit that the wrapper listens for (exactly 4, registered in `connect`):**
1. `'ActivityAdded'` → `handlers.onActivityAdded?.(item: BroadcastActivityItem)`.
2. `'ViewerCountChanged'` → `handlers.onViewerCountChanged?.(count: number)`.
3. `'FulfillmentUpdated'` → `handlers.onFulfillmentUpdated?.(payload: FulfillmentUpdatedPayload)`.
4. `'BroadcastEnded'` → `handlers.onBroadcastEnded?.(payload?.reason)` — payload itself may be `undefined`, guarded with `payload?.reason` (test both an `undefined` payload and a `{reason: '...'}` payload).

**`connect(broadcastId, handlers)` exact call sequence:**
1. `await this.disconnect()` (tears down any prior connection first — test reconnecting to a different broadcast id correctly leaves the old one first).
2. `new HubConnectionBuilder().withUrl(\`${API_CONFIG.baseUrl}/hubs/broadcast\`, {accessTokenFactory: getAccessToken}).withAutomaticReconnect().configureLogging(Warning).build()`.
3. Registers all 4 `.on(...)` handlers (above).
4. `connection.onreconnected(() => connection?.invoke('JoinBroadcast', broadcastId).catch(() => {}))` — test via `mockHubConnection.triggerReconnected()`, assert `invoke('JoinBroadcast', broadcastId)` fires, and that a rejected invoke doesn't throw/propagate.
5. `await connection.start()`.
6. `await connection.invoke('JoinBroadcast', broadcastId)`.
7. `joinedId = broadcastId` (only set after successful join).
8. If `start()` or the initial `invoke('JoinBroadcast', ...)` throws → caught, `logger.warn('Broadcast hub failed to connect', ...)`, `joinedId` stays `null` (never set) — `connect()` never throws even on total connection failure.

**`getAccessToken` (internal, called by SignalR as `accessTokenFactory`, not directly by app code):** `(await secureStorage.get(SECURE_KEYS.accessToken)) ?? ''` — test both a present token and `null` (falls back to empty string, not `null`/`undefined` — SignalR's factory type expects a string).

**`disconnect()` exact sequence:**
9. Captures `current = connection`, `id = joinedId`, immediately nulls both module vars (before any await — so a concurrent `connect()` racing in won't be torn down by a stale disconnect).
10. `current` was already `null` (never connected) → returns immediately, nothing else runs.
11. If `id` is set AND `current.state === HubConnectionState.Connected` → `await current.invoke('LeaveBroadcast', id).catch(() => {})` (swallowed) — test the **negative** case too: if `current.state` is e.g. `'Disconnected'` or `'Reconnecting'`, `LeaveBroadcast` is **skipped entirely**, only `stop()` runs.
12. `await current.stop()` always runs (outside the `if`). If it throws → caught, `logger.warn('Broadcast hub failed to stop cleanly', ...)` — `disconnect()` never throws.

**Priority:** P0 — live-broadcast realtime is on the call-connection critical path (viewer count / activity feed are core to the live host experience, and `FulfillmentUpdated` ties into the money-adjacent reward-fulfillment flow).

**Bugs/notes:** None found. The reconnect-and-rejoin, single-flight teardown-before-reconnect, and state-guarded leave-before-stop patterns are all consistent and defensive.

---

### `src/services/realtime/groupCallHub.ts`
**Type:** SignalR hub wrapper
**Purpose:** Host-side group call realtime channel — activity, join requests, participant list/status changes, fulfillment, call-ended signal.
**Exports:** `groupCallHub` (`connect(groupCallId, handlers)`, `disconnect()`). Type `GroupCallHubHandlers`.
**Dependencies:** same pattern as `broadcastHub.ts`, plus `@app-types/groupCall`.

**Events emitted/listened for (6 — one more than `broadcastHub`):**
1. `'ActivityAdded'` → `onActivityAdded?.(item: GroupCallActivityItem)`.
2. `'ParticipantRequested'` → `onParticipantRequested?.(p?.userId)` — payload destructured with optional chaining (`p: {userId:string}`); test a malformed/undefined payload doesn't throw, just passes `undefined` through.
3. `'ParticipantsChanged'` → `onParticipantsChanged?.()` — no payload at all, purely a "go refetch" signal.
4. `'ParticipantStatusChanged'` → `onParticipantStatusChanged?.(p?.userId, p?.status)` — two-arg passthrough, same optional-chaining safety.
5. `'FulfillmentUpdated'` → `onFulfillmentUpdated?.(payload)`.
6. `'GroupCallEnded'` → `onGroupCallEnded?.(p?.reason)`.

**`connect`/`disconnect` sequence:** structurally identical to `broadcastHub` — `disconnect()` first, build with `withUrl(${API_CONFIG.baseUrl}/hubs/group-call, {accessTokenFactory})`, `.withAutomaticReconnect()`, register all 6 handlers, `onreconnected` → `invoke('JoinGroupCall', groupCallId)`, `start()` → `invoke('JoinGroupCall', groupCallId)` → set `joinedId`, catch-and-warn on failure. `disconnect()`: same connected-state-guarded `invoke('LeaveGroupCall', id)` before `stop()`.

**Priority:** P0 — participant approval/rejection and status changes directly gate who's in a paid group call; `ParticipantRequested` in particular is effectively the join-request notification the host acts on.

**Bugs/notes:** None found. Structurally identical to `broadcastHub.ts`, same testing approach applies (share a test helper across the two if the test-writing phase wants to reduce duplication, given they're this close to identical in shape).

---

### `src/services/realtime/notificationHub.ts`
**Type:** SignalR hub wrapper — **structurally different from the other four** (no `joinedId`/group-join RPC; single persistent handler slot instead of a per-connect handlers object).
**Purpose:** Generic in-app notification push — connects once (not scoped to a session id), delivers `NotificationReceived` events to whatever handler is currently registered via `setHandler`.
**Exports:** `notificationHub` (`setHandler(next)`, `connect()`, `disconnect()`).
**Dependencies:** `@constants/app` (`API_CONFIG`, `NOTIFICATIONS`, `SECURE_KEYS`); `@services/storage`; `@app-types/api`; `@utils/logger`.

**Events emitted/listened for:**
1. `NOTIFICATIONS.hubEvent` (dynamic event name from constants, not hardcoded — a test should assert the actual configured value, e.g. via importing `NOTIFICATIONS.hubEvent`, not hardcode `'NotificationReceived'`) → calls `handler?.(payload: NotificationItem)` where `handler` is whatever was last set via `setHandler` (or `null` if never set / explicitly cleared → payload silently dropped).

**`setHandler(next)`:** pure assignment to module-level `handler` — test passing a function then `null` then confirming a subsequent hub-triggered event does nothing after clearing.

**`connect()` exact sequence — the one hub with an early-return guard the others lack:**
1. **Guard:** `if (connection && connection.state !== HubConnectionState.Disconnected) return;` — i.e., calling `connect()` while already `Connected`/`Connecting`/`Reconnecting` is a **no-op**, no new connection built. Test explicitly: call `connect()` twice in a row (first succeeds → `state` becomes `'Connected'` per the mock), assert `HubConnectionBuilder` (or the mock's `build`) is only invoked once total. This differs from the other 4 hubs, which always tear down and rebuild on every `connect()` call — worth flagging as an intentional but easy-to-miss behavioral difference.
2. Builds via `buildConnection()` helper (`withUrl(HUB_URL, {accessTokenFactory}).withAutomaticReconnect().configureLogging(Warning).build()`).
3. Registers the one `.on(NOTIFICATIONS.hubEvent, ...)` handler.
4. `connection.onreconnected(() => logger.info('Notification hub reconnected'))` — **no rejoin RPC invoked** (unlike the other 4 hubs) since there's no per-session group to rejoin here; just a log line. Test that reconnecting does NOT call `invoke` at all.
5. `connection.onclose((error) => { if (error) logger.warn('Notification hub closed', {error}); })` — **this hub is the only one of the 5 that registers an `onclose` handler at all**; test both a clean close (`error` undefined → no log) and an errored close (logs).
6. `await connection.start()` — failure caught, `logger.warn('Notification hub failed to connect', ...)`, never throws.

**`disconnect()`:** simpler than the other 4 — no `joinedId`/leave-RPC concept at all, just captures `current`, nulls `connection`, and if `current` existed, `await current.stop()` (caught, warn-logged on failure).

**Priority:** P1 (notifications aren't call-connection/money critical, though a broken hub here degrades UX to REST polling, per its own comment — "still gets notifications via REST list/unread-count on refresh").

**Bugs/notes:** None found — the structural differences (no group-join, early-return guard, `onclose` handler) are all sensible given this hub isn't scoped to a specific session/resource the way the other four are.

---

### `src/services/realtime/privateCallHub.ts`
**Type:** SignalR hub wrapper
**Purpose:** 1:1 private (billed) call realtime channel — call-started signal, per-minute cost updates, reward/fun-wheel purchase pushes, fulfillment, fan reconnect state, call-ending/ended signals.
**Exports:** `privateCallHub` (`connect(privateCallId, handlers)`, `disconnect()`). Type `PrivateCallHubHandlers`.
**Dependencies:** same base pattern, plus `@app-types/privateCall` (`CallCostUpdatePayload`, `PrivateCallFunWheelPush`, `PrivateCallRewardPush`), `@app-types/broadcast` (`FulfillmentUpdatedPayload`).

**Events emitted/listened for (9 — the most of any hub in this audit):**
1. `'PrivateCallStarted'` → `onCallStarted?.()` — no payload; comment: "Both sides are in the channel and billing has started" — **this is the literal moment metered billing begins client-side awareness**.
2. `'AdditionalMinuteCharged'` → `onCallCostUpdate?.(p: CallCostUpdatePayload)` — **P0, money**: the per-minute charge tick.
3. `'RewardPurchased'` → `onRewardPurchased?.(p: PrivateCallRewardPush)` — money-adjacent, mid-call purchase push, no refetch needed per comment.
4. `'FunWheelSpun'` → `onFunWheelSpun?.(p: PrivateCallFunWheelPush)`.
5. `'FulfillmentUpdated'` → `onFulfillmentUpdated?.(p: FulfillmentUpdatedPayload)`.
6. `'UserDisconnected'` → `onUserReconnecting?.()` — **note the naming mismatch**: the wire event is `UserDisconnected` but the local handler name is `onUserReconnecting` (i.e., "they disconnected" is surfaced to the UI as "reconnecting" state) — this is intentional (the fan going offline transiently is shown as a reconnecting indicator, not a hard error), but it's a naming trap for whoever writes tests without reading the source carefully — flag explicitly.
7. `'UserReconnected'` → `onUserReconnected?.()`.
8. `'PrivateCallEnding'` → `onCallEnding?.(p?.reason ?? '')` — note default is empty string, not `undefined` (unlike every other "reason" pattern in this codebase, which default to `undefined`) — test this specific default.
9. `'PrivateCallEnded'` → `onPrivateCallEnded?.(p?.reason)` — this one DOES default to `undefined` via optional chaining alone (no `?? ''`), contrasting with #8 in the very same file — worth a test pinning both defaults exactly as written, since it reads like it could be an inconsistency rather than a deliberate difference.

**`connect`/`disconnect` sequence:** same shape as `broadcastHub`/`groupCallHub` — `disconnect()` first, `withUrl(${API_CONFIG.baseUrl}/hubs/private-call, {accessTokenFactory})`, register all 9 handlers, `onreconnected` → `invoke('JoinCall', privateCallId)` (note RPC name is `JoinCall`/`LeaveCall`, NOT `JoinPrivateCall` — matches the comment citing the web's exact contract), `start()` → `invoke('JoinCall', privateCallId)` → `joinedId`, catch-and-warn. `disconnect()`: connected-state-guarded `invoke('LeaveCall', id)` before `stop()`.

**Priority:** P0 throughout — this hub is squarely money (`AdditionalMinuteCharged`) and call-connection (`PrivateCallStarted`/`PrivateCallEnding`/`PrivateCallEnded`) critical.

**Bugs/suspicious logic:**
- **`onCallEnding` defaults `p?.reason ?? ''`, `onPrivateCallEnded` defaults `p?.reason` (plain, so `undefined` when `p` is undefined)** — two nearly-adjacent handlers in the same file with different fallback conventions for a semantically identical field. Not necessarily wrong (callers may specifically want `''` vs `undefined` for different UI branches), but it's exactly the kind of thing worth a pinned test on both, flagged to the team as possibly unintentional drift.
- **`'UserDisconnected'` → `onUserReconnecting`** naming mismatch (point 6 above) — flag explicitly in the test file's comments so a future reader doesn't "fix" the mapping and break the intended UX.

---

### `src/services/realtime/privateMessageHub.ts`
**Type:** SignalR hub wrapper
**Purpose:** Conversation-scoped (not call-scoped) realtime channel for paid DMs — new-message push and delete-for-everyone push, keyed by `(artistId, userId)` pair rather than a single session id.
**Exports:** `privateMessageHub` (`connect(artistId, userId, onMessage, onDeleted?)`, `disconnect()`). Types `PrivateMessageDeletedPayload`, `PrivateMessageReceivedPayload`.
**Dependencies:** same base pattern, plus `@app-types/api` (`PrivateMessageItem`).

**Distinctive shape vs. the other 4 hubs:** `connect()` takes plain callback arguments (`onMessage`, `onDeleted`) instead of a single `handlers` object, and the "joined" state is a `{artistId, userId}` pair rather than a single id.

**Events emitted/listened for (2):**
1. `EVENT = 'PrivateMessageReceived'` → calls `onMessage(payload: PrivateMessageReceivedPayload)` directly (not optional-chained — `onMessage` is a required positional arg, so this always fires if a message event arrives, unlike the optional-handler pattern elsewhere).
2. `DELETED_EVENT = 'PrivateMessageDeleted'` → **only registered at all if `onDeleted` was passed** (`if (onDeleted) { connection.on(DELETED_EVENT, ...) }`) — test both with and without `onDeleted` supplied, confirming the `.on(DELETED_EVENT, ...)` call itself is skipped (not just the callback no-op'd) when omitted. When registered: guards `if (payload?.messageId) onDeleted(payload)` — a payload missing `messageId` is silently dropped, `onDeleted` NOT called.

**`connect(artistId, userId, onMessage, onDeleted?)` sequence:**
1. `await this.disconnect()` first (tears down any prior conversation — a screen navigating from one fan's thread to another's reuses this cleanly).
2. Build with `withUrl(${API_CONFIG.baseUrl}/hubs/private-message, {accessTokenFactory})`.
3. Register `EVENT` handler always; `DELETED_EVENT` handler conditionally (above).
4. `onreconnected(() => connection?.invoke('JoinConversation', artistId, userId).catch(() => {}))` — **two-argument** rejoin RPC (contrast with the single-id rejoin RPCs in the other 4 hubs).
5. `start()` → `invoke('JoinConversation', artistId, userId)` → `joined = {artistId, userId}` — catch-and-warn on failure (`logger.warn('Private message hub failed to connect', ...)`, `joined` stays `null`).

**`disconnect()`:** captures `current`/`pair`, nulls both. If `pair` set AND `current.state === Connected` → `invoke('LeaveConversation', pair.artistId, pair.userId).catch(() => {})` before `stop()`. Same never-throws pattern as the other 4.

**Priority:** P0 — paid-message delivery and delete-for-everyone propagation are core product functionality tied to the paid-DM money flow (the price-per-message feature this whole subsystem exists for).

**Bugs/notes:** None found. The conditional `onDeleted` registration and required (non-optional) `onMessage` are both sensible given the call signature, just worth flagging as the one hub with a materially different API shape from its four siblings (positional callbacks + pair-keyed session vs. handlers-object + single-id session) — a shared test helper across the 5 hubs will need a branch for this one.

---

## src/services/broadcast/, src/services/groupCall/, src/services/privateCall/

These three single-file directories are the "1-entry each" directories referenced in the task prompt — each holds one client-side session-recovery store (mmkv-backed), not an API/hub file. All three follow the same design: persist enough of the live/active session locally (since the backend has no "get my active X" endpoint for broadcast/group-call, and private-call's `getActive()` only returns an id) so the artist can walk out of a live room and back in without orphaning a running, billed session.

### `src/services/broadcast/activeBroadcast.ts`
**Type:** Storage-backed session-recovery store
**Purpose:** Persists the artist's currently-live broadcast (id, title, category, Agora channel/uid/token, start time) so a back-navigation can REJOIN rather than error with "already broadcasting live".
**Exports:** `activeBroadcastStore` (`save(title, category, r: StartBroadcastResponse)`, `get()`, `clear()`), type `ActiveBroadcastRecord`.
**Dependencies:** `@services/storage` (`mmkvStorage`); `@app-types/broadcast`.

**Testable behaviors:**
- `save(title, category, r)`: calls `mmkvStorage.setJSON(KEY, {broadcastId: r.broadcastId, title, category, startedAt: Date.now(), agoraChannelName: r.agoraChannelName, agoraUid: r.agoraUid, agoraToken: r.agoraToken})` — test `category` as both a defined string and `undefined` (optional field, per the interface `category?: string`), and mock `Date.now()` to assert `startedAt` is captured at save time.
- `get()`: delegates straight to `mmkvStorage.getJSON<ActiveBroadcastRecord>(KEY)` — test both a present record (round-trips exactly) and no record (`null`).
- `clear()`: delegates to `mmkvStorage.remove(KEY)`.
- `KEY` constant (`'mitro.artist.activeBroadcast'`) — worth one test asserting the literal key string, since a typo here would silently create an orphaned storage entry that `get()` never finds.

**Priority:** P0 — this is the client-side half of the call-connection recovery path; losing this record mid-session means the artist gets stuck unable to rejoin OR start a new broadcast (per its own header comment).

**Bugs/notes:** None found.

---

### `src/services/groupCall/activeGroupCall.ts`
**Type:** Storage-backed session-recovery store — **two-phase write**, more complex than `activeBroadcast`'s single `save`.
**Purpose:** Same idea as `activeBroadcastStore`, but split into a `saveDraft` (right after `create`, no Agora details yet) and `saveConnection` (after `start`/`rejoin`, merges Agora details onto the existing record) — matching the two-step nature of the group-call creation flow.
**Exports:** `activeGroupCallStore` (`saveDraft(draft)`, `saveConnection(r, fallback)`, `get()`, `clear()`), types `ActiveGroupCallRecord`, `GroupCallDraft`.
**Dependencies:** `@services/storage` (`mmkvStorage`); `@app-types/groupCall`.

**Testable behaviors:**
- `saveDraft(draft)`: `mmkvStorage.setJSON(KEY, {...draft})` — a straight spread of the 6 `GroupCallDraft` fields, no `startedAt`/Agora fields set (they're optional on `ActiveGroupCallRecord`).
- `saveConnection(r, fallback)`: **the interesting one** —
  1. Reads `existing = await mmkvStorage.getJSON<ActiveGroupCallRecord>(KEY)` first.
  2. Builds the merged record: `{...(existing ?? fallback), groupCallId: r.groupCallId, startedAt: existing?.startedAt ?? Date.now(), agoraChannelName/agoraUid/agoraToken: r.*}`.
  3. **Test all three real scenarios**: (a) no existing record at all (first-ever connect, e.g. resuming from a cold-start `getActive()` path that skipped `saveDraft`) → uses `fallback` as the base, `startedAt` freshly stamped with `Date.now()`; (b) existing draft record present (normal create→start flow) → spreads the draft's fields (title/maxParticipants/etc.) forward, `startedAt` freshly stamped (draft never had one); (c) existing record already has a `startedAt` (a **rejoin** scenario — `start` called again on an already-connected call) → the **original** `startedAt` is preserved, NOT overwritten — this is the "timer resumes correctly" guarantee called out in the header comment, and is the single most important behavior to pin with a test (mock `Date.now()` to return two different values across two `saveConnection` calls, assert the second call keeps the first's `startedAt`).
  4. Writes the merged record via `setJSON`.
- `get()` / `clear()`: same as `activeBroadcastStore`.

**Priority:** P0 — the `startedAt`-preservation logic in `saveConnection` is a genuine, non-trivial correctness requirement (a naive re-implementation would reset the billing/duration timer on every reconnect, which is a real user-facing and possibly billing-adjacent bug if the artist's earnings/duration displays depend on this timestamp).

**Bugs/notes:** None found — the merge logic correctly implements what its extensive header comment promises. This is exactly the kind of function that deserves 3+ explicit test cases rather than one "happy path" test, given how easy it would be to regress the `startedAt` preservation silently.

---

### `src/services/privateCall/activePrivateCall.ts`
**Type:** Storage-backed session-recovery store — **two-phase write, plus an update-guard not present in the other two stores.**
**Purpose:** Same recovery pattern again, for 1:1 calls — `save()` (full record, after accept/connect) and `savePointer()` (id-only, from `getActive()`, which per `privateCallApi.getActive()` returns just an id/session pointer, not full Agora details).
**Exports:** `activePrivateCallStore` (`save(r, meta)`, `savePointer(privateCallId, meta?)`, `get()`, `clear()`), types `ActivePrivateCallRecord`, `PrivateCallMeta`.
**Dependencies:** `@services/storage` (`mmkvStorage`); `@app-types/privateCall`.

**Testable behaviors:**
- `save(r, meta)`:
  1. Reads `existing` first.
  2. Builds record: `privateCallId: r.privateCallId`, `userId: meta.userId ?? existing?.userId` (falls back to a previously-known userId if the new call omits it), `fanName`/`ratePerMin` always taken fresh from `meta` (never falls back to `existing`, unlike `userId` — test this asymmetry explicitly: an existing record's `fanName`/`ratePerMin` is always overwritten by whatever `meta` says, even if `meta.fanName` were somehow empty-string, whereas `userId` is preserved when omitted).
  3. `startedAt`: **conditional on matching ids** — `existing && existing.privateCallId === r.privateCallId ? existing.startedAt : Date.now()`. Test 3 cases: (a) no existing record → fresh `Date.now()`; (b) existing record for a **different** `privateCallId` (a brand-new call starting while a stale record from a previous call still sits in storage — e.g. `clear()` wasn't called after the last call ended) → also fresh `Date.now()`, old `startedAt` discarded, this is the correct behavior but worth confirming explicitly since it's easy to accidentally always-preserve; (c) existing record for the **same** `privateCallId` (reconnect case) → preserves `existing.startedAt`. This mirrors `activeGroupCallStore`'s logic but with the added id-equality guard that `activeGroupCallStore.saveConnection` does NOT have (that one just checks `existing?.startedAt ?? Date.now()` with no id comparison — meaning a stale group-call record for a *different* call id would incorrectly preserve its `startedAt` onto a new call, which `activePrivateCall.save` explicitly guards against and `activeGroupCall.saveConnection` does not — see bug note below).
- `savePointer(privateCallId, meta?)`:
  1. Reads `existing`.
  2. **Early-return guard**: `if (existing?.privateCallId === privateCallId) return;` — i.e., if we already have a record for this exact call, `savePointer` is a total no-op (does NOT even update `fanName`/`ratePerMin` from a fresher `meta` if one were passed) — test this guard explicitly, it's the one place in all three stores where a "save" call can silently do nothing.
  3. Otherwise builds a minimal record: `{privateCallId, userId: meta.userId, fanName: meta.fanName ?? 'Fan', ratePerMin: meta.ratePerMin ?? 0, startedAt: Date.now()}` — test the two default fallbacks (`'Fan'` placeholder name, `0` placeholder rate) when `meta` is omitted or partial.
- `get()` / `clear()`: same pattern as the other two stores.

**Priority:** P0 — same reasoning as `activeGroupCallStore` (timer/duration integrity on reconnect), plus this store's `userId`-preservation and id-matched `startedAt` guard are more intricate and more failure-prone than its siblings.

**Bugs/suspicious logic:**
- **Cross-file inconsistency**: `activePrivateCallStore.save()` guards `startedAt` preservation with an explicit `existing.privateCallId === r.privateCallId` id check before reusing the old timestamp, but `activeGroupCallStore.saveConnection()` reuses `existing?.startedAt` with **no id check at all** — if a stale `activeGroupCall` record from a previous, already-ended call were somehow still in storage when a brand-new group call's `saveConnection` runs (e.g. `clear()` was missed on an abnormal exit), the new call would incorrectly inherit the old call's `startedAt`, understating its live duration. This is a real, concrete inconsistency between two structurally-parallel functions in sibling files — worth a specific regression test on `activeGroupCallStore.saveConnection` with a **mismatched** existing `groupCallId` in storage, to document whether this is accepted behavior or an actual bug to fix later. Flagging, not fixing, per audit scope.

---

## src/services/queryClient.ts *(found via the recursive listing; not explicitly named in the task's file list, included for completeness)*

**Type:** Hub (shared singleton)
**Purpose:** The app's single `QueryClient` instance, kept in its own module so non-React code (the auth store) can reach it and wipe all cached queries on logout.
**Exports:** `queryClient: QueryClient`.
**Dependencies:** `@tanstack/react-query`.

**Testable behaviors:**
- Module exports a single `QueryClient` configured with `defaultOptions.queries: {retry:1, staleTime:30_000, refetchOnWindowFocus:false}` — the only meaningful "test" is asserting these default options are what's configured (a config-snapshot test), plus confirming importing this module twice in the same process yields the **same instance** (singleton identity, `===`), which matters for the auth-store logout-wipe use case described in its comment.

**Priority:** P2 (pure configuration, no branching logic) — but worth a one-line identity/config test since a future accidental duplicate `new QueryClient()` elsewhere would silently break the "logout wipes everything" guarantee this module exists for.

**Bugs/notes:** None found.

---

## Summary of flagged bugs / dead code / suspicious logic (all files)

1. **`src/services/api/liveDeliveryApi.ts`** — confirmed dead file, byte-for-byte duplicate of `rewardOrdersApi.ts` with colliding exported symbol names (`rewardOrdersApi`, `funWheelSpinsApi`); not imported anywhere, not re-exported from `index.ts`. Skip test-writing effort here; flag for deletion.
2. **`src/services/api/index.ts`** — `broadcastApi`, `groupCallApi`, `privateCallApi`, `funWheelSpinsApi` are not re-exported from the barrel despite being actively used elsewhere via direct import; inconsistent with the other 10 resource modules.
3. **`src/services/api/mock.ts`** — `USE_MOCK`/`mocked`/`mockedError` appear unused by every audited API module; the mock-switch infrastructure described in the file's own comments doesn't seem to be wired into any of the 20 resource files read.
4. **`src/services/api/kycApi.ts` `getBankAccount`** — blanket catches ANY error (network/500/404 alike) and resolves `{success:true, data:null}`; can't distinguish "no bank account on file" from "the request actually failed."
5. **`src/services/agora/agoraEngine.ts`** — `nativeUnavailable` latch is permanent for the process lifetime once set (via `getEngine()` failure or a `joinAsHost`/`joinPrivateCallChannel` catch block); no exported function ever resets it, so one transient native-module hiccup permanently disables Agora until app restart.
6. **`src/services/agora/agoraEngine.ts`** — `onConnectionStateChanged`'s `CONNECTION_LABEL` map silently drops any unmapped `ConnectionStateType` value with no log, meaning an SDK enum addition silently stops notifying the UI.
7. **`src/services/realtime/privateCallHub.ts`** — `'UserDisconnected'` wire event maps to a handler literally named `onUserReconnecting` (intentional but a naming trap); `onCallEnding` defaults its reason to `''` while `onPrivateCallEnded` defaults to `undefined` for the same conceptual field in the same file.
8. **`src/services/privateCall/activePrivateCall.ts` vs `src/services/groupCall/activeGroupCall.ts`** — `activePrivateCallStore.save()` guards timestamp-preservation with an id-equality check against the existing record; `activeGroupCallStore.saveConnection()` does the structurally-parallel thing with NO id check, so a stale leftover record (missed `clear()`) could make a brand-new group call inherit an old `startedAt`, understating its duration.
9. **`src/services/storage/secureStorage.ts`** — `set()` rethrows on failure while `get()`/`remove()` swallow and log; this asymmetry is almost certainly intentional (callers need to know a token write failed) but is easy to "fix into consistency" by accident in a future refactor.

---

**35 files audited, 320+ testable behaviors identified across P0/P1/P2** (majority P0 given the directory selection — auth/interceptors, all Agora functions, all 5 SignalR hubs, the 3 active-session stores, and the money/call-connection-adjacent methods across `broadcastApi`/`groupCallApi`/`privateCallApi`/`privateMessageApi`/`kycApi`/`rewardOrdersApi`/`settingsApi` are P0; read-only/display endpoints and push-notification plumbing are P1; barrels, static endpoint data, and pure config are P2).

---

# Section 3: Hooks (src/hooks/)

All 16 files read completely. Now producing the audit.

---

# src/hooks/ Audit — Mitro Artist App

Directory contains **16 files** (not 17; `useCreatorSettings.ts` exists and matches the previously-seen name, `useStageNameAvailability.ts` and `useVerificationGate.ts` confirmed present, no `useKyc.ts` duplicate found beyond the one listed — list below is exhaustive per current `ls`).

Files: `useAppState.ts`, `useAuthMutations.ts`, `useAvatarPicker.ts`, `useCreatorSettings.ts`, `useDebounce.ts`, `useFollowers.ts`, `useGroupCallHistory.ts`, `useInsights.ts`, `useKeyboard.ts`, `useKyc.ts`, `usePrivateMessages.ts`, `useProfile.ts`, `useProfileMutations.ts`, `useRewardOrders.ts`, `useStageNameAvailability.ts`, `useVerificationGate.ts`.

Common pattern across nearly all react-query hooks: `queryFn`/`mutationFn` calls a `*Api` method returning a `Result<T>` union (`{success:true,data}` | `{success:false,error}`), and either inlines the unwrap or uses a local `unwrap()` helper that throws `AuthError(result.error)` on failure. All react-query hooks set `retry: false` uniformly (rationale per comments: real API failures are deterministic — expired token handled by an axios interceptor, or a server decision like "taken"/"wrong password" — so retrying just delays the same answer).

---

## useAppState.ts

**Pattern:** Plain custom hook — `useState` + `useEffect` + `useRef`, no react-query.

**Params:** none.

**Returns:** `{ state: AppStateStatus; justResumed: boolean }`
- `state`: current RN `AppState.currentState`, updated on every `'change'` event.
- `justResumed`: `true` only on the transition edge from `background`/`inactive` → `active`; recomputed (not merely toggled) on every change event, so it can go back to `false` on the very next change if the new transition isn't a resume.

**Testable behavior checklist:**
- Initial `state` equals `AppState.currentState` at mount, `justResumed` initially `false`.
- Subscribes to `AppState.addEventListener('change', ...)` on mount; unsubscribes (`subscription.remove()`) on unmount — verify no leaked listener.
- `background` → `active`: `justResumed` becomes `true`.
- `inactive` → `active`: `justResumed` becomes `true` (both prior states count).
- `active` → `background`: `justResumed` stays `false`.
- `background` → `background` (duplicate/no-op event): `justResumed` stays `false` (since `next !== 'active'`).
- Two consecutive resumes: `background`→`active` (`justResumed=true`), then `active`→`background` (`justResumed=false`) — confirms it's not "sticky".
- `previous.current` ref updates correctly across multiple rapid events (state machine correctness).

**Priority:** P1 (utility hook, no auth/money impact, but likely widely used for refetch-on-resume).

**Bugs/notes:** None obvious. Clean, small, deterministic hook — easy `renderHook` + `act(() => AppState.emit(...))` style test if the RN mock library supports emitting change events; otherwise mock `AppState.addEventListener` to capture and manually invoke the listener.

---

## useAuthMutations.ts

**Pattern:** Six `useMutation` hooks, no shared queryKey reads (these are auth-flow mutations, not cache-invalidating profile calls). Each uses a local `unwrap()` closure (module-level, not exported) that throws `AuthError(result.error)` when `result.success` is `false`.

Re-exports `AuthError` from `@utils/errorHandler` (for screens importing it via this module — worth a regression test that the re-export still points to the same class/reference used by `normalizeError`).

### 1. `useLoginMutation()`
- **mutationKey:** `['auth','login']`
- **mutationFn:** `(payload: LoginPayload) => unwrap(authApi.login(payload))`
- **onSuccess:** `await authenticate(session)` — calls `useAuthStore((s) => s.authenticate)`, i.e. writes to the auth Zustand/store (persists token, presumably flips nav guard).
- **retry:** false.
- Testable: success path calls `authenticate` with the exact resolved `AuthSession`; failure path (`success:false`) rejects with `AuthError` and does NOT call `authenticate`; `authenticate` is awaited (so `onSuccess` resolves only after store write completes — worth testing that a slow/erroring `authenticate` propagates properly, e.g. mutation stays "pending" until store write settles).

### 2. `useSendRegistrationOtpMutation()`
- **mutationKey:** `['auth','sendRegistrationOtp']`, calls `authApi.sendRegistrationOtp`, no onSuccess/onError, `retry:false`. Pure pass-through — test success/error unwrap only.

### 3. `useVerifyRegistrationOtpMutation()`
- Same shape, `authApi.verifyRegistrationOtp`, returns `MessageResponse`, no side effects.

### 4. `useRegisterMutation()`
- **mutationKey:** `['auth','register']`
- **onSuccess:** `await authenticate(session)` (same store write as login).
- Comment notes it's only valid "straight after step 2" (server-side window) — not enforced in the hook itself, so this is a doc-only constraint, nothing to unit test at the hook level beyond normal unwrap/onSuccess behavior.

### 5. `useSendPasswordResetOtpMutation()`
- **mutationKey:** `['auth','sendPasswordResetOtp']`, `authApi.sendPasswordResetOtp`, no side effects.

### 6. `useVerifyPasswordResetOtpMutation()`
- **mutationKey:** `['auth','verifyPasswordResetOtp']`, `authApi.verifyPasswordResetOtp`, no side effects.

### 7. `useResetPasswordMutation()`
- **mutationKey:** `['auth','resetPassword']`, `authApi.resetPassword`, no side effects. Comment: no session returned; artist must log in separately afterward.

**Exhaustive checklist (applies per mutation):**
- `unwrap` throws `AuthError` with `result.error` message when `success:false` — verify `instanceof AuthError` and message text passthrough.
- `unwrap` returns `result.data` unchanged when `success:true` (no transform).
- All 6 set `retry:false` — verify no automatic retry on failure (e.g., mock API to fail twice, assert it's called exactly once).
- Only `login` and `register` call `authenticate`; the other four must NOT touch the auth store — worth an explicit negative assertion per mutation (assert store mock not called).
- `authenticate` is invoked with the resolved session object reference/shape exactly as returned by unwrap.

**Priority:** P0 — auth/session flows, gates the entire app; `login`/`register` write auth state directly.

**Bugs/notes:**
- None functionally wrong observed. Minor: `useRegisterMutation`'s comment about the "short server window" is unenforced client-side — not a bug, just worth noting in case tests are tempted to assert timing behavior that doesn't exist in this file.
- All mutationFns swallow the original `result.error` string into `AuthError` — if `authApi.*` ever throws (network layer) rather than resolving `Result`, the mutation would surface the raw thrown error instead of `AuthError`; worth a test case where `authApi.login` rejects (not resolves `success:false`) to confirm `error` in `UseMutationResult` is whatever was thrown (not wrapped/normalized here — normalization happens elsewhere via `getErrorMessage`/`normalizeError`, not in this hook).

---

## useAvatarPicker.ts

**Pattern:** Plain custom hook composing `useUploadAvatarMutation()` (react-query mutation from `useProfileMutations.ts`) with local `useState`/`useCallback` for a three-step picker flow (permission → pick → preview → confirm/cancel).

**Params:** none.

**Returns (`AvatarPickerResult`):**
- `pick: () => void` — fire-and-forget wrapper around async `pick()`.
- `pendingUri: string | null` — local URI awaiting confirmation.
- `confirm: () => void` — fire-and-forget wrapper around async `confirm()`.
- `cancel: () => void` — synchronous, clears `pendingUri` and `error`.
- `isUploading: boolean` — proxies `useUploadAvatarMutation().isPending`.
- `avatarUrl: string | null` — public URL of last successful upload, cache-busted.
- `error: string | null`.

**Detailed flow verification:**

1. **`pick()`**
   - Clears `error` first (`setError(null)`).
   - Calls `ImagePicker.requestMediaLibraryPermissionsAsync()`.
     - If `!permission.granted` → sets `error = PERMISSION_DENIED` (`'Photo access is off. Turn it on in Settings to change your picture.'`) and returns early — **does not** call `launchImageLibraryAsync`.
   - If granted, calls `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })`.
     - `allowsEditing` is deliberately omitted/off (documented rationale: OS crop screen says "CROP" not "save"; app shows its own preview instead).
   - If `picked.canceled` or `!picked.assets[0]` → returns silently, no error set, `pendingUri` untouched (cancel is not treated as an error case).
   - Otherwise sets `pendingUri = picked.assets[0].uri`.

2. **`confirm()`**
   - No-op if `pendingUri` is falsy (returns immediately, no error clear even).
   - Clears `error`.
   - Calls `upload(pendingUri)` (i.e., `useUploadAvatarMutation().mutateAsync`).
     - On success: builds `freshUrl` by appending `?v=<Date.now()>` or `&v=<Date.now()>` depending on whether `url` already has a `?` — cache-busting for `expo-image`'s URI-keyed cache (documented rationale: server returns the same public URL on every re-upload, so a fresh query param forces a refetch instead of showing a stale cached image).
     - Sets `avatarUrl = freshUrl`, clears `pendingUri` (`null`), calls `logger.info('Avatar updated')`.
   - On failure (caught): calls `setError(getErrorMessage(uploadError))`. **Does not** clear `pendingUri` — deliberately keeps the preview open so the artist can retry without re-picking (documented).

3. **`cancel()`**: synchronous, sets `pendingUri = null` and `error = null`. Does not touch `avatarUrl`.

**Exhaustive testable behavior:**
- Permission denied → `error === PERMISSION_DENIED`, `pendingUri` stays `null`, `launchImageLibraryAsync` never called (mock assertion).
- Permission granted + user cancels picker (`canceled: true`) → no state changes, no error.
- Permission granted + `assets` array empty/`assets[0]` undefined (edge case even when not `canceled`) → treated same as cancel (no `pendingUri` set) — worth a dedicated test since it's a distinct branch (`!picked.assets[0]`).
- Successful pick → `pendingUri` set to `picked.assets[0].uri` exactly.
- `pick()` always clears prior `error` at the start — test that a previous error is cleared even before the new permission check resolves.
- `confirm()` called with `pendingUri === null` → `upload` mutation never invoked (assert mock not called), no error set, no throw.
- `confirm()` success → `pendingUri` reset to `null`, `avatarUrl` reflects cache-busted URL, `isUploading` reflects mutation pending state during the call (test transient `true` while awaiting, `false` after).
- Cache-bust query-param logic: URL without existing `?` gets `?v=...`; URL with existing `?` (e.g. presigned URL with querystring) gets `&v=...` — both branches must be tested explicitly since it's a ternary that's easy to get backwards.
- `confirm()` failure → `error` set to `getErrorMessage(uploadError)` (mock `getErrorMessage`/throw a known error shape), `pendingUri` remains **unchanged** (not cleared) — this is a meaningful behavior to lock in via test since it diverges from typical "reset on any settle" patterns.
- `cancel()` after a pending pick clears both `pendingUri` and `error`, leaves `avatarUrl` untouched.
- `isUploading` mirrors `useUploadAvatarMutation().isPending` (mock the mutation hook or use `renderHook` with a wrapped `QueryClientProvider` + mocked `profileApi.uploadAvatar`).

**Priority:** P0 — used on Settings/profile screens; not money/auth but is a common upload flow, and the cache-busting logic is subtle enough to regress silently.

**Bugs/notes:**
- Line 90/92: `pick: () => void pick()` and `confirm: () => void confirm()` swallow any rejection from the internal async functions via the `void` operator — but both internal functions already catch their own errors (permission/pick has no try/catch around `requestMediaLibraryPermissionsAsync`/`launchImageLibraryAsync` though — if either of those *themselves* reject rather than resolve, e.g. a native module throw, the rejection is unhandled since there's no try/catch in `pick()`, only in `confirm()`). This is a real gap: an exception from `ImagePicker.requestMediaLibraryPermissionsAsync()` or `launchImageLibraryAsync()` would produce an unhandled promise rejection rather than setting `error`. Worth flagging as a testable failure mode (mock `requestMediaLibraryPermissionsAsync` to reject and observe no `error` state set / unhandled rejection).
- No `finally`-style guard against double-tapping `confirm()` while `isUploading` is already `true` (mutation is not disabled from being invoked twice); react-query will just fire two `mutateAsync` calls if the caller doesn't guard against a double press. Not necessarily a bug (screens likely disable the button using `isUploading`), but worth a note since it's not enforced at the hook level.

---

## useCreatorSettings.ts

**Pattern:** Two `useQuery` + two `useMutation` hooks for reward-menu / fun-wheel settings.

### `useRewardMenu()`
- **queryKey:** `queryKeys.settings.rewardMenu()` → `['settings','rewardMenu']`
- **queryFn:** `settingsApi.getRewardMenu()`, throws `AuthError` on failure.
- `staleTime: 5*60_000` (5 min), `retry: false`.
- Returns `UseQueryResult<RewardMenuItem[], Error>`.

### `useFunWheel()`
- **queryKey:** `queryKeys.settings.funWheel()` → `['settings','funWheel']`
- **queryFn:** `settingsApi.getFunWheel()`; data can be `null` (documented — "artist has no wheel yet").
- `staleTime: 5*60_000`, `retry:false`.

### `useCreateRewardMutation()`
- **mutationKey:** `['settings','createReward']`
- **mutationFn:** `settingsApi.createReward(payload)` → throws `AuthError` on failure, else returns created `RewardMenuItem`.
- **onSuccess(created):**
  1. `queryClient.setQueryData<RewardMenuItem[]>(rewardMenu key, current => current ? [...current, created] : [created])` — optimistic-looking append to cache (actually post-success, not `onMutate`, so not truly optimistic, just an immediate patch).
  2. `void queryClient.invalidateQueries({ queryKey: rewardMenu key })` — triggers a background refetch to reconcile with server ordering/fields.
- `retry:false`.

### `useCreateActivityMutation()`
- **mutationKey:** `['settings','createActivity']`
- **mutationFn:** `settingsApi.createActivity(payload)` → returns `null` data (per type signature `UseMutationResult<null, ...>`), throws `AuthError` on failure.
- **onSuccess:** only invalidates `queryKeys.settings.funWheel()` — does NOT patch cache directly (documented: response shape not reliable enough, whole wheel refetched instead).
- `retry:false`.

**Exhaustive testable behavior:**
- `useRewardMenu`/`useFunWheel`: loading → success → data shape; loading → error → `AuthError` surfaced as `.error`; `staleTime` behavior (a second `renderHook` within 5 min doesn't refetch — can assert `queryFn` mock call count).
- `useFunWheel`: explicit test for `data === null` success case (not error).
- `useCreateRewardMutation`: after success, cache for `rewardMenu()` reflects the appended item **before** invalidation-triggered refetch resolves — test that `setQueryData` is called synchronously in `onSuccess` with a functional updater; test the `current === undefined` branch (first reward created when nothing was cached yet) → cache becomes `[created]`.
- `useCreateRewardMutation` failure path: cache untouched, `invalidateQueries` NOT called (should only run in `onSuccess`).
- `useCreateActivityMutation`: on success, `funWheel()` query is invalidated (spy on `invalidateQueries`); cache is NOT directly patched (assert `setQueryData` never called for this mutation, unlike the reward one — useful contrast test).
- Both mutations: `retry:false` — verify single call on induced failure.

**Priority:** P1 (settings feature, not auth/money-critical, but used in Settings screens with mutation cache side effects worth locking down).

**Bugs/notes:**
- `useCreateRewardMutation`'s double strategy (patch cache immediately + invalidate right after) is slightly redundant/wasteful (an extra network round trip immediately after a manual patch) but not a bug — it's explicitly documented as intentional. Flag only as a "why both?" note, not an actual defect.
- No `onError`/`onSettled` handlers on either mutation — errors simply propagate to the caller via `error`/`isError`; nothing to roll back since neither uses `onMutate` optimistic patching.

---

## useDebounce.ts

**Pattern:** Plain generic custom hook, `useState` + `useEffect` with `setTimeout`/`clearTimeout`.

**Params:**
- `value: T` (required)
- `delayMs: number = TIMING.searchDebounceMs` (default from `@constants`, currently **400ms** per `src/constants/app.ts:64`).

**Returns:** `T` — debounced copy of `value`.

**Exhaustive testable behavior (critical shared primitive — used by `useStageNameAvailability` and presumably search features):**
- Initial render: returned value equals the initial `value` immediately (no initial delay before first paint).
- Value changes, timer not yet elapsed → returned value stays the OLD value.
- Timer elapses (use fake timers, `jest.advanceTimersByTime(delayMs)`) → returned value updates to the latest `value`.
- Rapid successive changes within `delayMs` of each other → only the LAST value is ever committed (intermediate values are dropped) — verify via multiple `rerender()` calls with `advanceTimersByTime` less than `delayMs` between each, confirming `clearTimeout` on the previous timer actually cancels it (i.e., the debounced value never transiently shows an intermediate value).
- Custom `delayMs` param is honored (test with e.g. 1000ms and confirm behavior differs from default).
- Unmount before timer fires → effect cleanup calls `clearTimeout`; assert `setDebounced` is never called after unmount (no "update on unmounted component" warning) — can verify indirectly by advancing timers post-unmount and confirming no error/no crash; hard to directly assert `setState` not called without spying, but can assert no console error via RTL's act warnings if applicable.
- Changing `delayMs` alone (same `value`) restarts the effect (it's in the deps array) — resets the timer; test that changing just `delayMs` mid-flight doesn't prematurely resolve with the old delay.

**Priority:** P0 — tiny hook, but a shared low-level primitive with real timer logic that's easy to get wrong and is a dependency of a P0-adjacent hook (`useStageNameAvailability`, used during sign-up). Bugs here silently break every debounced consumer.

**Bugs/notes:** None found; implementation is textbook-correct (proper cleanup, correct dep array).

---

## useFollowers.ts

**Pattern:** Single `useQuery`.

**Params:** none.

**Returns:** `UseQueryResult<FollowersResponse, Error>`.

- **queryKey:** `queryKeys.followers.list()` → `['followers','list']`
- **queryFn:** `followersApi.getFollowers()` → throws `AuthError(result.error)` on failure, else `result.data` (no transform).
- `staleTime: 60_000`, `retry:false`.

**Exhaustive testable behavior:**
- Loading → success: `data` is exactly `result.data` (includes followers list + engagement summary per docstring — top supporters, session regulars, new-this-week — verify shape passthrough, no hook-side filtering/sorting).
- Loading → error: `error instanceof AuthError`, message equals `result.error`.
- `staleTime` respected (no refetch within 60s window on remount with same `QueryClient`).
- `retry:false` — single call on failure.

**Priority:** P1 (dashboard/engagement data, not auth/money-critical, but likely used on a primary screen — could arguably be P0 if Followers is a main tab; default to P1 absent further evidence).

**Bugs/notes:** None — simplest hook in the set, essentially a template for the pattern. No dead code.

---

## useGroupCallHistory.ts

**Pattern:** Four `useQuery`/`useInfiniteQuery` hooks around group-call history/analytics.

### `useGroupCallHistory(filter, take=30, skip=0)`
- **queryKey:** `queryKeys.groupCall.history(take, skip, filter)` → `['groupCall','history',take,skip,filter]`
- **queryFn:** `insightsApi.getGroupCallHistory({ take, skip, status: filter })`, throws `AuthError` on failure.
- `staleTime:60_000`, `retry:false`.
- Returns `UseQueryResult<GroupCallHistoryItem[], Error>`.

### `useGroupCallHistoryPaged(filter, pageSize=20)`
- **queryKey:** `[...queryKeys.groupCall.all, 'history', 'paged', pageSize, filter]` — **NOT** built via a `queryKeys.groupCall.*` factory function (inlined array) — inconsistent with the rest of the file/module's key-factory convention (worth flagging, see Bugs below).
- `initialPageParam: 0`
- **queryFn:** `({ pageParam }) => insightsApi.getGroupCallHistory({ take: pageSize, skip: pageParam, status: filter })`
- **getNextPageParam:** `(lastPage, allPages) => lastPage.length < pageSize ? undefined : allPages.length * pageSize` — classic "short page = end" pagination; next `skip` = `allPages.length * pageSize`.
- `staleTime:60_000`, `retry:false`.
- Filter is part of the query key → switching filter tabs starts a **new** page walk (fresh `InfiniteData`) rather than appending, per docstring — important behavior to test explicitly (rerender with new `filter` → `data.pages` resets, doesn't carry over stale pages from the old filter).

### `useGroupCallHistorySummary(filter)`
- **queryKey:** `queryKeys.groupCall.historySummary(filter)` → `['groupCall','historySummary',filter]`
- **queryFn:** `insightsApi.getGroupCallHistorySummary(filter)`, DB-aggregated lifetime totals.
- `staleTime:60_000`, `retry:false`.

### `useGroupCallAnalytics(groupCallId)`
- **queryKey:** `queryKeys.groupCall.analytics(groupCallId ?? '')` — note: even when `groupCallId` is `null`, the key is built with `''` rather than omitting the query, so the key is stable/predictable but the query itself is gated by `enabled`.
- **enabled:** `!!groupCallId` — query does not fire until a truthy id is provided (row expansion pattern per docstring).
- `staleTime:60_000`, `retry:false`.

**Exhaustive testable behavior:**
- `useGroupCallHistory`: default params (`take=30,skip=0`) produce the documented queryKey; custom `take`/`skip` change the key (cache isolation per page); success/error paths as above.
- `useGroupCallHistoryPaged`:
  - `getNextPageParam` returns `undefined` when `lastPage.length < pageSize` (exhausted) → `hasNextPage` becomes `false`.
  - `getNextPageParam` returns `allPages.length * pageSize` when a full page comes back → `fetchNextPage()` requests the correct next `skip`.
  - Multi-page fetch: fetch page 1 (full), `fetchNextPage()`, assert `queryFn` called with `pageParam=pageSize`; assert `insightsApi.getGroupCallHistory` called with `skip: pageSize`.
  - Switching `filter` prop between renders produces a distinct queryKey and starts fresh (`data` resets to a single fresh page, not appended) — key behavior called out in the docstring, should be explicitly tested.
  - Error mid-pagination (e.g., second page fails): `isError`/`error` on the infinite query, first page's data still present (default react-query behavior) — worth a test since infinite-query error semantics differ from plain queries.
- `useGroupCallHistorySummary`: straightforward success/error per filter value; key changes with filter.
- `useGroupCallAnalytics`:
  - `groupCallId === null` → query never fires (`fetchStatus`/`status` should reflect disabled, e.g. `status: 'pending'`/`fetchStatus:'idle'`, `insightsApi.getGroupCallAnalytics` never called).
  - `groupCallId` truthy → fires with that id, `enabled` flips to `true` on rerender when id transitions from `null` → a string (test the enabling transition, not just static states).

**Priority:** P0 — group calls very likely tie into scheduling/monetization (private/group call revenue), and the paginated + gated-enable logic is exactly the kind of subtle behavior regressions hide in.

**Bugs/notes:**
- **Inconsistent queryKey construction** in `useGroupCallHistoryPaged` (line ~49-55): builds the key by hand-spreading `queryKeys.groupCall.all` plus literal strings instead of using/adding a `queryKeys.groupCall.historyPaged(...)`-style factory like the rest of the codebase does (compare `queryKeys.ts`, which has no `historyPaged` entry at all). Same exact pattern is repeated in `useInsights.ts` for `useEarningsTransactionsPaged` and `useBroadcastHistoryPaged` — this looks like a deliberate but undocumented convention gap (paged variants weren't added to the `queryKeys` factory file). Not a functional bug, but worth flagging since a typo in one of these inline arrays would silently create a key collision or cache-miss that a factory function would have prevented. Good candidate for a "queryKey shape" snapshot test per paged hook.
- `useGroupCallAnalytics`'s `queryKeys.groupCall.analytics(groupCallId ?? '')`: when `groupCallId` is `null`, the resulting key is `['groupCall','analytics','']` — if some other code path ever calls `analytics('')` legitimately (empty string id, unlikely but not type-impossible since the param is `string | null`, not `string | null` excluding `''`), it would collide with the "disabled" key. Low risk, worth a one-line note only.

---

## useInsights.ts

**Pattern:** Six hooks — four `useQuery`, two `useInfiniteQuery` — earnings + broadcast analytics.

### `useEarningsSummary()`
- **queryKey:** `queryKeys.earnings.summary()` → `['earnings','summary']`
- **queryFn:** `insightsApi.getEarningsSummary()`, throws `AuthError` on failure.
- `staleTime:30_000` (shorter than most — "tokens move while artist is live"), `retry:false`.

### `useEarningsTransactions(take=100, skip=0)`
- **queryKey:** `queryKeys.earnings.transactions(take, skip)` → `['earnings','transactions',take,skip]`
- **queryFn:** `insightsApi.getEarningsTransactions({take,skip})`.
- `staleTime:30_000`, `retry:false`.

### `useEarningsTransactionsPaged(pageSize=25)`
- **queryKey:** `[...queryKeys.earnings.all, 'transactions', 'paged', pageSize]` (inlined, same pattern gap as group-call paged hook above).
- `initialPageParam:0`, `getNextPageParam` same short-page-ends logic, `skip: pageParam`, next param `allPages.length * pageSize`.
- `staleTime:30_000`, `retry:false`.
- Docstring: web caps at first 100 rows and stops; mobile paginates indefinitely via this hook — meaningful product-behavior divergence worth a comment in tests.

### `useBroadcastHistory(take=5, skip=0)`
- **queryKey:** `queryKeys.broadcast.history(take, skip)` → `['broadcast','history',take,skip]`.
- **queryFn:** `insightsApi.getBroadcastHistory({take,skip})`.
- `staleTime:60_000`, `retry:false`.
- Default `take=5` (small — likely a "recent broadcasts" widget) vs. the paged variant below.

### `useBroadcastHistoryPaged(pageSize=20)`
- **queryKey:** `[...queryKeys.broadcast.all, 'history', 'paged', pageSize]` (inlined again).
- Same short-page-ends pagination logic as the others.
- `staleTime:60_000`, `retry:false`.

### `useBroadcastHistorySummary()`
- **queryKey:** `queryKeys.broadcast.historySummary()` → `['broadcast','historySummary']`.
- **queryFn:** `insightsApi.getBroadcastHistorySummary()`.
- `staleTime:60_000`, `retry:false`.

### `useBroadcastAnalytics(broadcastId)`
- **queryKey:** `queryKeys.broadcast.analytics(broadcastId ?? '')`.
- **enabled:** `!!broadcastId` — same row-expansion gating pattern as `useGroupCallAnalytics`.
- `staleTime:60_000`, `retry:false`.

**Exhaustive testable behavior:** (mirrors `useGroupCallHistory.ts` structurally — apply the same matrix)
- Each plain query: loading/success/error, correct queryKey per params, `staleTime` honored, `retry:false` (single call on failure).
- Both infinite queries: full-page → `hasNextPage:true`; short/last page → `hasNextPage:false`; correct `skip` computed for `fetchNextPage()`; multi-page `data.pages` accumulation.
- `useBroadcastAnalytics`/gating: `broadcastId=null` → disabled, no fetch; transition to truthy id → fires.
- `useEarningsSummary`'s shorter 30s `staleTime` vs. others' 60s — worth an explicit assertion distinguishing it from a sibling hook's cache lifetime, since a copy-paste regression (accidentally changing 30_000→60_000 or vice versa) wouldn't fail any obvious functional test otherwise.
- Distinguish `useBroadcastHistory` (small default `take=5`) is a genuinely separate hook/cache entry from `useBroadcastHistoryPaged` (paged, independent key) — i.e., confirm the two do NOT share a query key/cache slot (they don't: `['broadcast','history',5,0]` vs `['broadcast','history','paged',20]`... actually wait, note below).

**Priority:** P0 — earnings/money data (`useEarningsSummary`, `useEarningsTransactions*`) is squarely "touches money"; broadcast analytics is secondary but same file/pattern.

**Bugs/notes:**
- Same inline-queryKey-construction pattern gap noted in `useGroupCallHistory.ts` applies here twice more (`useEarningsTransactionsPaged`, `useBroadcastHistoryPaged`).
- **Potential queryKey collision risk worth verifying in tests:** `useBroadcastHistory`'s key is `[...queryKeys.broadcast.all, 'history', take, skip]` (via the factory) and `useBroadcastHistoryPaged`'s inline key is `[...queryKeys.broadcast.all, 'history', 'paged', pageSize]`. These are structurally different (extra `'paged'` segment) so they don't actually collide — but because the paged variant bypasses the `queryKeys.broadcast.history()` factory function entirely rather than extending it, there's no compile-time guarantee the two stay non-colliding if either is edited independently. Recommend a snapshot/equality test asserting the two produce disjoint keys as a regression guard.
- No functional bugs found in the pagination math itself (`allPages.length * pageSize` is correct standard offset pagination given `getNextPageParam`'s short-page check).

---

## useKeyboard.ts

**Pattern:** Plain custom hook — `useState` + `useEffect`, RN `Keyboard` event listeners, platform-branched event names.

**Params:** none.

**Returns:** `{ visible: boolean; height: number }`.

**Behavior:**
- Chooses `keyboardWillShow`/`keyboardWillHide` on iOS, `keyboardDidShow`/`keyboardDidHide` on Android (via `Platform.OS`).
- `onShow(event)`: `setInfo({ visible: true, height: event.endCoordinates.height })`.
- `onHide()`: `setInfo({ visible: false, height: 0 })`.
- Subscribes both listeners on mount, removes both on unmount.

**Exhaustive testable behavior:**
- iOS: verify `Keyboard.addListener` called with `'keyboardWillShow'`/`'keyboardWillHide'` (mock `Platform.OS = 'ios'`).
- Android: verify `'keyboardDidShow'`/`'keyboardDidHide'` used instead (mock `Platform.OS = 'android'`).
- Simulate show event with a given `endCoordinates.height` → `visible:true`, `height` matches.
- Simulate hide event → resets to `{visible:false, height:0}` regardless of prior height.
- Unmount → both `showSub.remove()` and `hideSub.remove()` called (spy on returned subscription objects).
- Initial state before any event: `{visible:false, height:0}`.

**Priority:** P1 — pure UI/layout utility, no auth/money/verification surface, but potentially widely used across chat/forms screens.

**Bugs/notes:** None found. Clean and platform-correct.

---

## useKyc.ts

**Pattern:** Two `useQuery` hooks.

### `useKyc()`
- **queryKey:** `queryKeys.kyc.status()` → `['kyc','status']`
- **queryFn:** `kycApi.getStatus()`, throws `AuthError` on failure.
- `staleTime:60_000`, `retry:false`.
- Returns `UseQueryResult<KycStatus, Error>`.

### `useBankAccount()`
- **queryKey:** `queryKeys.kyc.bankAccount()` → `['kyc','bankAccount']`
- **queryFn:** `kycApi.getBankAccount()`. Docstring: "Never throws on a missing account — the service maps a 404 to `null`" — i.e., the null-mapping happens inside `kycApi.getBankAccount()` itself (not in this hook), so `result.success` is presumably still `true` with `data: null` on a 404. This hook itself still has the same `if (!result.success) throw AuthError` guard as every other hook — the "never throws" guarantee is entirely dependent on the service layer's mapping, not on hook logic. Worth a test that specifically exercises `data === null` as a **success** state (not error) to lock in this contract at the hook boundary, even though the null-mapping logic itself lives in `kycApi` (outside this file's scope, but the hook's behavior when `data` is `null` should still be verified as a passthrough).
- `staleTime:60_000`, `retry:false`.

**Exhaustive testable behavior:**
- `useKyc`: loading/success/error; `staleTime` respected; `retry:false`.
- `useBankAccount`: loading/success-with-object/success-with-null/error; confirm `null` is treated as valid data, not as an error state (`isError` stays `false`, `isSuccess` stays `true`).

**Priority:** P0 — KYC status directly gates verification/payout eligibility (feeds `useVerificationGate`), and bank account is payout-adjacent (money).

**Bugs/notes:** None found; both hooks are minimal and consistent with the module pattern.

---

## usePrivateMessages.ts

**Pattern:** Single `useQuery` with polling.

**Params:** none.

**Returns:** `UseQueryResult<ArtistConversationSummary[], Error>`.

- **queryKey:** `queryKeys.messages.list()` → `['messages','list']`
- **queryFn:** `privateMessageApi.listConversations(50)` (hardcoded limit of 50, not a hook param — cannot be overridden by callers), throws `AuthError` on failure.
- `staleTime: 10_000`, `refetchInterval: 15_000` (background polling — deviates from every other hook in the audit, which has no `refetchInterval`), `retry:false`.
- Docstring: polls so unread counts / last message stay fresh; the actual chat screen uses SignalR for live in-thread delivery — this hook is only for the inbox list.

**Exhaustive testable behavior:**
- Loading/success/error as standard.
- **`refetchInterval:15_000` is the key differentiator to test** — with fake timers, verify `queryFn` is called again after 15s without any manual `refetch()`/prop change (this is the only hook in the audited set with automatic interval polling, so a regression here — e.g., someone removing `refetchInterval` — wouldn't be caught by any other test in the suite).
- Verify polling continues while the query is "fresh" per react-query's default `refetchInterval` semantics (it fires regardless of `staleTime` — `refetchInterval` is independent of staleness) — worth confirming empirically against the actual installed react-query version's behavior rather than assuming.
- Verify polling stops on unmount (react-query handles this internally, but still worth a `renderHook` + unmount + advance-timers assertion that no further fetch happens post-unmount).
- Hardcoded `50` passed to `listConversations` — assert the mock is always called with exactly `50` regardless of anything else (there's no way to change it from outside, so this is a fixed-contract test).

**Priority:** P0 — inbox/messaging is a primary surface, and this is the only hook with live polling behavior; a broken interval either silently stops fresh data (bad UX) or fires excessively (battery/network cost) — both are the kind of regression worth locking down in a test suite.

**Bugs/notes:**
- `listConversations(50)` limit is hardcoded with no hook parameter to adjust it — not necessarily a bug (inbox screens rarely need pagination), but flag as a design note: if a future screen needs more than 50 conversations, this hook can't serve it without modification.
- No `enabled` gating (e.g., gating on being logged in) — presumably handled upstream (this hook probably isn't mounted at all when unauthenticated), but there's nothing in this file itself to prevent it from firing if mounted without a valid session; not a bug in isolation, just worth noting for test scope (tests shouldn't assume any auth-gating happens inside this hook).

---

## useProfile.ts

**Pattern:** Three `useQuery` hooks.

### `useProfile()`
- **queryKey:** `queryKeys.profile.me()` → `['profile','me']`
- **queryFn:** `profileApi.getProfile()`, throws `AuthError` on failure.
- `staleTime:60_000`, `retry:false`.
- Returns `UseQueryResult<ArtistProfile, Error>`. **This is the hook `useVerificationGate` depends on** — see below.

### `useCategories()`
- **queryKey:** `queryKeys.profile.categories()` → `['profile','categories']`
- **queryFn:** `profileApi.getCategories()`.
- `staleTime: Infinity` — "effectively static reference data," cached for the whole session, never auto-refetched.
- `retry:false`.

### `useSubcategories(categoryId)`
- **queryKey:** `queryKeys.profile.subcategories(categoryId ?? '')`
- **enabled:** `Boolean(categoryId)` — disabled until a primary category is picked.
- **queryFn:** `profileApi.getSubcategories(categoryId as string)` — note the `as string` cast relies entirely on `enabled` correctly preventing the call when `categoryId` is null/undefined (if `enabled` were ever misconfigured, this would runtime-fail calling the API with `null`/`undefined` cast as string).
- `staleTime: Infinity`, `retry:false`.

### `usePhotos()`
- **queryKey:** `queryKeys.profile.photos()` → `['profile','photos']`
- **queryFn:** `profileApi.getPhotos()`.
- `staleTime:60_000`, `retry:false`. (This is the same cache slot mutated by `useDeletePhotoMutation`/`useUploadPhotoMutation` in `useProfileMutations.ts` — see cross-file interaction notes there.)

**Exhaustive testable behavior:**
- `useProfile`: loading/success/error; success `data` fields (`kycStatus`, `approvalStatus` used downstream by `useVerificationGate` — worth testing this hook returns those fields unmodified/untransformed, since the gate hook lowercases and defaults them itself rather than this hook doing it).
- `useCategories`: `staleTime: Infinity` — verify a second mount/re-render never triggers a second `queryFn` call within the same `QueryClient` instance (a good candidate for asserting call-count === 1 across multiple renders/interactions).
- `useSubcategories`: `categoryId=null`/`undefined` → disabled, `profileApi.getSubcategories` never called; transition from `null`→`'cat-1'` → fires with `'cat-1'`; transition `'cat-1'`→`'cat-2'` → new queryKey, new fetch (cache isolated per category).
- `usePhotos`: standard loading/success/error; success returns the array unmodified (no sort/filter applied in-hook).

**Priority:** P0 — profile is the most foundational data source in the app (feeds `useVerificationGate`, avatar flow, settings); `useProfile` specifically should be treated as a shared dependency root that many other hook/component tests will need to mock consistently.

**Bugs/notes:**
- `useSubcategories`'s `categoryId as string` cast (line 64) is safe only because `enabled: Boolean(categoryId)` prevents `queryFn` from running with a falsy id — but this is an implicit contract enforced by react-query's `enabled` flag, not the type system. Not a bug in current code, but worth a defensive test: if `enabled` were ever computed incorrectly, `profileApi.getSubcategories(undefined)` would be called with a real `undefined` at runtime despite the `as string` claiming otherwise. A test that forces `enabled` semantics (by directly invoking `queryFn` in isolation, if testable) would catch a future regression here.

---

## useProfileMutations.ts

**Pattern:** Seven `useMutation` hooks + shared module-level `unwrap()` helper (same shape as `useAuthMutations.ts`'s, but separately defined — duplicated, not shared/imported from one place — see Bugs).

### `useUpdateProfileMutation()`
- **mutationKey:** `['profile','update']`
- **mutationFn:** `profileApi.updateProfile(payload)` via `unwrap`.
- **onSuccess:** `invalidateQueries({ queryKey: queryKeys.profile.me() })`.
- `retry:false`.

### `useUpdateCategoryMutation()`
- **mutationKey:** `['profile','updateCategory']`
- **mutationFn:** `profileApi.updateCategory(payload)` via `unwrap`.
- **onSuccess:** invalidates `profile.me()`.
- `retry:false`.

### `useChangePasswordMutation()`
- **mutationKey:** `['profile','changePassword']`
- **mutationFn:** `profileApi.changePassword(payload)` via `unwrap`.
- No `onSuccess`/cache invalidation (password isn't part of `/profile/me` data — correctly no-op).
- `retry:false`.

### `useChangeStageNameMutation()`
- **mutationKey:** `['profile','changeStageName']`
- **mutationFn:** `profileApi.changeStageName(payload)` via `unwrap`.
- **onSuccess:** invalidates `profile.me()` (stage name is part of profile).
- `retry:false`.

### `useSendChangePhoneOtpMutation()`
- **mutationKey:** `['profile','sendChangePhoneOtp']`
- **mutationFn:** `profileApi.sendChangePhoneOtp(payload)` via `unwrap`.
- No side effects (OTP send doesn't change profile data yet).
- `retry:false`.

### `useVerifyChangePhoneOtpMutation()`
- **mutationKey:** `['profile','verifyChangePhoneOtp']`
- **mutationFn:** `profileApi.verifyChangePhoneOtp(payload)` via `unwrap`.
- **onSuccess:** invalidates `profile.me()` (phone number now changed).
- `retry:false`.

### `useUploadAvatarMutation()`
- **mutationKey:** `['profile','uploadAvatar']`
- **mutationFn:** `(fileUri: string) => unwrap(profileApi.uploadAvatar(fileUri))` — resolves to the public URL string. (Consumed directly by `useAvatarPicker.ts`.)
- **onSuccess:** invalidates `profile.me()` (avatar URL lives on the profile object).
- `retry:false`.
- Note: does NOT invalidate `profile.photos()` — correctly scoped, avatar and gallery photos are separate concerns.

### `useUploadPhotoMutation()`
- **mutationKey:** `['profile','uploadPhoto']`
- **mutationFn:** `(fileUri: string) => unwrap(profileApi.uploadPhoto(fileUri))` — resolves to the photo's public URL.
- **onSuccess:** invalidates `profile.photos()` (NOT `profile.me()` — correctly scoped, gallery photo doesn't affect the main profile object).
- `retry:false`.

### `useDeletePhotoMutation()` — the most complex hook in the whole directory
- **mutationKey:** `['profile','deletePhoto']`
- **mutationFn:** `(photoId: string) => unwrap(profileApi.deletePhoto(photoId))` → resolves `null`.
- **Optimistic update via `onMutate(photoId)`:**
  1. `await queryClient.cancelQueries({ queryKey: profile.photos() })` — cancels any in-flight refetch so it can't clobber the optimistic write.
  2. `const previous = queryClient.getQueryData<ArtistPhoto[]>(profile.photos())` — snapshots current cache.
  3. `queryClient.setQueryData<ArtistPhoto[]>(profile.photos(), current => current?.filter(p => p.id !== photoId) ?? [])` — removes the tapped photo immediately.
  4. Returns `{ previous }` as mutation context.
- **`onError(_error, _photoId, context)`:** if `context?.previous` is truthy, restores the cache to the pre-mutation snapshot via `setQueryData`.
- **`onSettled()`:** unconditionally invalidates `profile.photos()` — reconciles with server regardless of success/failure (comment explicitly notes "Settled, not success").
- `retry:false`.

**Exhaustive testable behavior:**
- Each of the six "simple" mutations: success unwraps and returns `result.data`; failure throws `AuthError`; verify EXACTLY which ones call `invalidateQueries` and with which key (`updateProfile`→me, `updateCategory`→me, `changePassword`→none, `changeStageName`→me, `sendChangePhoneOtp`→none, `verifyChangePhoneOtp`→me, `uploadAvatar`→me, `uploadPhoto`→photos) — this table itself is worth encoding as parametrized test cases since a mis-invalidation (e.g., forgetting to invalidate, or invalidating the wrong key) is a classic regression that's invisible without explicit per-mutation assertions.
- `useDeletePhotoMutation` — this needs the most thorough test coverage in the whole hooks directory:
  - Seed `QueryClient` cache with a known `ArtistPhoto[]` at `profile.photos()` before mounting.
  - Call `mutate(photoId)`; assert `cancelQueries` was called for `profile.photos()` BEFORE the cache is patched (ordering matters — use call-order assertions if the test double supports it).
  - Assert cache immediately (synchronously after `onMutate`, before the mutation promise resolves) reflects the filtered list (photo with matching id removed, others preserved in original order).
  - Success path: after `mutationFn` resolves, `onSettled` fires and invalidates `profile.photos()` — assert `invalidateQueries` called once, with correct key, exactly once (not from any other path).
  - Failure path: `mutationFn` rejects/throws `AuthError` → `onError` restores `previous` snapshot exactly (deep-equal to the original array, including the photo that was optimistically removed) → then `onSettled` STILL fires and invalidates (both onError's rollback AND onSettled's invalidate happen — test that both run, not just one).
  - Edge case: cache is empty/undefined at `profile.photos()` when mutation starts (`current` is `undefined`) → optimistic update sets it to `[]` (per `?? []` fallback) rather than throwing; `previous` context is `undefined`; on error, `onError`'s `if (context?.previous)` guard means the cache is NOT restored to `undefined` (stays `[]`) — this is a subtle branch worth an explicit test since `context?.previous` being falsy (empty original cache = `undefined`) skips restoration entirely, which is arguably correct (nothing to restore) but should be locked in by a test rather than left implicit.
  - Two concurrent `mutate()` calls for different photo ids in quick succession — verify `cancelQueries` prevents a race where an in-flight fetch overwrites either optimistic patch (a real integration-level test, may be hard to unit-test cleanly with `renderHook` alone; at minimum test that `cancelQueries` is invoked before the `setQueryData` patch each time).

**Priority:** P0 — profile is core account data; `useDeletePhotoMutation`'s optimistic+rollback logic is the single most complex and highest-regression-risk piece of state logic in the entire `src/hooks/` directory and deserves dedicated, thorough test coverage.

**Bugs/notes:**
- **Duplicated `unwrap()` helper**: this file defines its own local `unwrap<T>(call: Promise<Result<T>>)` (lines 31-37), which is structurally identical to `useAuthMutations.ts`'s local `unwrap()` (differs only in the exact input type signature — `Result<T>` imported from `@app-types/api` here vs. an inline anonymous union type there). Not a functional bug, but it's copy-pasted logic across at least two files (and the `queryFn` bodies in `useProfile.ts`/`useFollowers.ts`/etc. inline the same `if (!result.success) throw AuthError` pattern a third way, without even using a shared `unwrap`). Worth flagging as a maintainability/testing note: tests should verify `unwrap`'s behavior identically in each file since there's no single shared implementation guaranteeing consistency — a fix to one copy wouldn't propagate to the other.
- `useUploadAvatarMutation` here is the same hook consumed by `useAvatarPicker.ts` — any test written for `useAvatarPicker` that mocks `profileApi.uploadAvatar` should also independently verify this mutation's own `onSuccess` invalidation behavior in isolation (both need coverage; the avatar picker test would only exercise it end-to-end, not confirm the invalidation key is correct in isolation).

---

## useRewardOrders.ts

**Pattern:** One `useQuery` + one `useMutation`.

### `usePendingRewardOrders()`
- **queryKey:** `queryKeys.rewardOrders.pending()` → `['rewardOrders','pending']`
- **queryFn:** `rewardOrdersApi.list({ status: 'pending', take: 50 })` — hardcoded `status`/`take`, not parameterized.
- `staleTime:30_000`, `retry:false`.
- Returns `UseQueryResult<RewardOrder[], Error>`.

### `useFulfillRewardOrderMutation()`
- **mutationKey:** `['rewardOrders','fulfill']`
- **mutationFn:** `(orderId: string) => rewardOrdersApi.fulfill(orderId)`, throws `AuthError` on failure, returns `MessageResponse`.
- **onSuccess:** `invalidateQueries({ queryKey: queryKeys.rewardOrders.all })` — note this invalidates the **`.all`** key (`['rewardOrders']`), broader than just `.pending()` — meaning ANY query under the `rewardOrders` namespace gets invalidated, not just the pending list (currently there's only `pending()` under that namespace per `queryKeys.ts`, so functionally equivalent today, but a future addition of e.g. `rewardOrders.completed()` would also get invalidated by this — worth noting as intentional-or-accidental breadth).
- `retry:false`.

**Exhaustive testable behavior:**
- `usePendingRewardOrders`: loading/success/error; assert `rewardOrdersApi.list` always called with `{status:'pending', take:50}` exactly (fixed contract, no params to vary).
- `useFulfillRewardOrderMutation`: success invalidates `queryKeys.rewardOrders.all` (test with `spyOn(queryClient,'invalidateQueries')` and assert the key array equals `['rewardOrders']`, distinguishing it from a hypothetical narrower `.pending()` invalidation — this distinction is exactly the kind of thing worth pinning with a test given the "broader than sibling patterns" note above).
- Failure path: mutation `error` is `AuthError`, cache untouched, no invalidation call.

**Priority:** P0 — reward orders represent fan-purchased/paid content fulfillment (money-adjacent — fans paid for shoutouts/song requests), so despite being a small file it touches revenue-adjacent state.

**Bugs/notes:**
- No real bugs. The `.all` vs `.pending()` invalidation-key breadth is worth flagging only as a design note (not a defect) — since `.all` is a superset, it's strictly safer/simpler than needing to remember multiple specific keys, at the mild cost of over-invalidating if more sub-queries are added later.

---

## useStageNameAvailability.ts

**Pattern:** Custom composite hook wrapping `useDebounce` + `useQuery`, with derived booleans layered on top.

**Params:** `name: string` (the raw, un-debounced input as the user types).

**Returns (`StageNameAvailability`):**
- `isChecking: boolean`
- `isAvailable: boolean | null`

**Detailed flow (verified against real code):**
1. `debounced = useDebounce(name)` — default 400ms delay (from `@constants`'s `TIMING.searchDebounceMs`, confirmed at `src/constants/app.ts:64`).
2. `isWellFormed = stageNameSchema.safeParse(debounced).success` — validated against the **debounced** value, not the live `name` — meaning validity itself lags by the debounce window too (worth noting: even the "is this well-formed" check doesn't react instantly to keystrokes, since it reads `debounced` not `name`).
3. `useQuery`:
   - **queryKey:** `queryKeys.auth.stageName(debounced)` → `['auth','stageName', debounced]` — the debounced value is baked into the key, so each distinct debounced name gets its own cache entry (good — no cross-contamination between different names' "available" results, and revisiting a previously-checked name is instant from cache within `staleTime`).
   - **queryFn:** `authApi.checkStageName(debounced)` → throws `AuthError` on failure (this means a check failure becomes `isError`/`error`, but per the hook's return contract, the caller-facing `isAvailable` just falls back to `null`/"unknown" rather than surfacing the error object — the docstring explicitly states "failed request reports unknown, not taken").
   - **enabled:** `isWellFormed` — the query does not fire at all until the debounced name passes local validation (schema-level short-circuit, avoiding a wasted network call for something the form would reject anyway).
   - **staleTime:30_000**, `retry:false`.
4. **Return shape derivation:**
   - `isChecking = isWellFormed && (isFetching || debounced !== name)` — checking is `true` if the name is valid AND (a fetch is actually in flight OR the debounce hasn't caught up to the latest keystroke yet). This is the key "don't flicker stale info" mechanism: even before the debounce timer fires, `debounced !== name` alone forces `isChecking = true`, covering the gap between the last keystroke and the debounce settling.
   - `isAvailable = isWellFormed && debounced === name ? (data?.isAvailable ?? null) : null` — only surfaces a real `true`/`false` once (a) the name is well-formed AND (b) the debounce has fully caught up to the current `name` (no stale in-flight name mismatch); otherwise reports `null` (unknown) rather than any stale boolean. `data?.isAvailable` also defaults to `null` if `data` itself is undefined (e.g., mid-fetch or never-fetched).

**Exhaustive testable behavior (this is one of the three hooks the task explicitly calls out for deep verification):**
- Empty/too-short name (fails `stageNameSchema`) → `isChecking:false`, `isAvailable:null`, `authApi.checkStageName` never called (query disabled) — test immediately and after advancing debounce timers, confirming it never fires regardless of timer state.
- Well-formed name typed, before debounce fires (`debounced !== name` still) → `isChecking:true` even though `isFetching` may still be `false` (query hasn't started) — this is the "gap" case explicitly designed for; test it in isolation by NOT advancing timers past the debounce window and asserting `isChecking===true`, `isAvailable===null`.
- Debounce fires, query in flight (`isFetching:true`, `debounced===name` now) → `isChecking:true` (via the `isFetching` branch this time), `isAvailable:null` (no data yet).
- Query resolves with `{isAvailable:true}` → `isChecking:false`, `isAvailable:true`.
- Query resolves with `{isAvailable:false}` → `isChecking:false`, `isAvailable:false`.
- Query fails (`authApi.checkStageName` returns `success:false`) → `isChecking:false` (fetching done), `isAvailable:null` (NOT `false` — must not be mistaken for "taken"); this is the specific "unknown vs. taken" contract from the docstring and deserves its own explicit test asserting `isAvailable !== false` on failure.
- Rapid retyping: user types name A (well-formed) → debounce hasn't fired → user changes to name B (well-formed, different) before A's timer elapses → only B's debounced value ever reaches the query (per `useDebounce`'s own coalescing behavior) → `queryKeys.auth.stageName(A)` query never actually fires; test that `checkStageName` is called with B's value only, never A's (integration between `useDebounce`'s coalescing and this hook's `enabled` gate).
- User retypes back to a PREVIOUSLY-checked and cached name within `staleTime` (30s) → `isChecking` should resolve `false` quickly (cache hit) rather than re-showing a spinner state, and `isAvailable` reflects the cached result — good test of `staleTime`'s practical effect here since revisiting an earlier value is a very plausible UX flow (user edits then reverts).
- Name transitions from well-formed → malformed (e.g., user deletes characters below min length) → query becomes disabled again (`enabled` flips false); `isAvailable` immediately becomes `null` again (not stuck on the last real result) since `isWellFormed` gates the ternary too.

**Priority:** P0 — explicitly called out for deep verification, gates sign-up stage-name uniqueness (auth-adjacent, blocks account creation flow), and combines two nontrivial behaviors (debounce + schema-gated query + derived flicker-avoidance state) that are exactly the kind of logic worth hardening with tests.

**Bugs/notes:**
- No functional bugs found — the flicker-avoidance logic (`debounced !== name` check) is a deliberate and correctly-implemented pattern.
- Subtle-but-intentional: `isWellFormed` is computed from `debounced`, not `name` — so a live keystroke that makes the name syntactically invalid (e.g., user is mid-typing a name that would fail `stageNameSchema` at this exact instant) doesn't immediately flip `isChecking`/`isAvailable` to reflect that invalidity; it waits for the debounce to catch up first. This is consistent with treating "well-formed" as another debounced-derived property, but it does mean a caller checking `isChecking`/`isAvailable` during the debounce window is looking at validity-as-of-the-PREVIOUS debounced value, not the live one. Not a bug per the docstring's intent, but worth a targeted test making this behavior explicit rather than assumed.

---

## useVerificationGate.ts

**Pattern:** Composite hook — wraps `useProfile()` (react-query) + `useRouter()` (expo-router) + local derived logic, no own state/effect.

**Params:** none.

**Returns (`VerificationGate`):**
- `blocked: boolean`
- `kycStatus: string` (lowercased, `''` default)
- `approvalStatus: string` (lowercased, `''` default)
- `banner: VerificationBannerCopy | null`
- `guard: (action: () => void) => void`
- `goToKyc: () => void`

**Detailed gating logic (verified against real code, this is one of the three hooks explicitly flagged for deep verification):**

1. **Status derivation:**
   - `kycStatus = (profile?.kycStatus ?? '').toLowerCase()`
   - `approvalStatus = (profile?.approvalStatus ?? '').toLowerCase()`
   - Both default to `''` when `profile` is undefined (not yet loaded) or the field itself is missing/null on the profile object.

2. **`blocked` computation:**
   - `blocked = profile ? (approvalStatus !== 'approved' || kycStatus !== 'approved') : false`
   - **Critical nuance:** while `profile` is still loading (undefined/not yet fetched), `blocked` is explicitly `false` — i.e., the gate defaults to UNBLOCKED during the loading state, not blocked. Docstring explains this is intentional, matching web behavior (`verification` state starts `{blocked:false}` until `getMe` resolves), specifically to avoid stopping a fully-verified artist from going live on a cold start while profile is still in flight. **This is the single most important behavior to test in this hook** — a regression that flips this default (e.g., defaulting to `blocked:true` while loading, or `blocked: !profile` inadvertently) would either lock out verified artists during load OR let unverified artists through during a fetch — both bad, opposite failure modes.
   - Once `profile` loads, `blocked` is `true` unless BOTH `approvalStatus === 'approved'` AND `kycStatus === 'approved'`.

3. **`goToKyc()`:** `router.push('/(app)/(tabs)/me/kyc-payouts')` — hardcoded route constant `KYC_ROUTE`.

4. **`guard(action)`:**
   - If `!blocked` → calls `action()` immediately, returns. **Does not** call `goToKyc` or any toast.
   - If `blocked`:
     - If `kycStatus === 'pending'` → `showPopupToast(UNDER_REVIEW_MESSAGE, 'info')` (info tone — "already submitted, nothing left to fix").
     - Else (any other blocked reason — `''`, `'rejected'`, or `approvalStatus`-only issues while `kycStatus` isn't `'pending'`) → `showPopupToast(BLOCKED_MESSAGE, 'error')` (error tone).
     - Either branch: always calls `goToKyc()` afterward (navigates regardless of which toast fired).
     - `action()` is **never called** when blocked (mutually exclusive with the toast+navigate path).
   - **Notable asymmetry:** the toast-branch condition checks ONLY `kycStatus === 'pending'`, not `approvalStatus === 'pending'`. So if `kycStatus` is `'approved'` but `approvalStatus` is `'pending'` (blocked because approval, not KYC), the artist still gets the harsher `BLOCKED_MESSAGE`/`'error'` toast rather than an "under review" info message — even though conceptually they're also just waiting on review, not something they did wrong. This mirrors the `banner` logic further down only partially (the `banner` block DOES have a distinct `approvalStatus === 'pending'` branch with its own info-tone copy — see below), so `guard()`'s toast selection is coarser than the `banner`'s. **Worth flagging as a real inconsistency** (see Bugs).

5. **`banner` computation** — five mutually exclusive states, evaluated in this exact priority order (`profile` must be loaded, i.e. `banner` stays `null` while loading):
   1. `kycStatus === 'rejected'` → danger banner, "Your KYC verification was rejected," `showButton:true`.
   2. else `approvalStatus === 'rejected'` → danger banner, "Your artist application was rejected," `showButton:true`.
   3. else `kycStatus === ''` (never submitted) → warn banner, "Complete KYC verification to unlock payouts," `showButton:true`.
   4. else `kycStatus === 'pending'` → info banner, "Your KYC is under review," `showButton:false`.
   5. else `approvalStatus === 'pending'` → info banner, "Your profile is pending approval," `showButton:false`.
   6. else (e.g., both approved — meaning `!blocked` — or some other combination not enumerated, like `approvalStatus===''` with `kycStatus==='approved'`) → `banner = null`.
   - Priority order matters a lot: e.g., if `kycStatus==='rejected'` AND `approvalStatus==='rejected'` simultaneously, only the KYC-rejected banner shows (branch 1 wins, branch 2 never evaluated) — "rejected outranks everything" per the code comment, but specifically KYC-rejected outranks approval-rejected too (not just "rejected outranks non-rejected").
   - Edge case: `kycStatus===''` AND `approvalStatus==='pending'` simultaneously → branch 3 wins (`kycStatus===''` checked before `approvalStatus==='pending'`), so "Complete KYC" warning shows, not "pending approval" info — worth an explicit test since it's a real, reachable combination (artist hasn't started KYC yet but their base profile/application is separately pending approval).
   - Edge case: `kycStatus==='approved'` AND `approvalStatus===''` (not `'pending'`, not `'rejected'`, not `'approved'` — some other/default value) → none of the five branches match → `banner=null` even though `blocked` would be `true` (since `approvalStatus !== 'approved'`) — i.e., **`blocked` can be `true` while `banner` is `null`**, meaning the UI would silently block an action via `guard()` with a toast, but show NO persistent dashboard banner explaining why. This is a real gap worth flagging (see Bugs).

**Exhaustive testable behavior:**
- `profile` loading/undefined: `blocked===false`, `kycStatus===''`, `approvalStatus===''`, `banner===null` — the critical "safe default" state, deserves its own dedicated test.
- `profile` loaded, both `approvalStatus` and `kycStatus` `'approved'` (any casing, e.g. `'Approved'` — test case-insensitivity via `.toLowerCase()`): `blocked===false`, `banner===null`.
- All 5 banner branches individually, each asserting the exact `tone`/`headline`/`showButton` per the table above — parametrized test recommended.
- Priority-order collision tests: KYC-rejected + approval-rejected together → only KYC-rejected banner. `kycStatus===''` + `approvalStatus==='pending'` together → "Complete KYC" warning, not "pending approval" info.
- The `blocked===true, banner===null` gap case (`kycStatus==='approved'`, `approvalStatus` is some unenumerated non-empty/non-pending/non-rejected/non-approved value) — test that `banner` is indeed `null` here despite `blocked` being `true`, to formally document this as current (possibly unintended) behavior rather than let it be assumed away.
- `guard(action)` when NOT blocked: `action()` called exactly once; `showPopupToast` NOT called; `goToKyc`/`router.push` NOT called.
- `guard(action)` when blocked, `kycStatus==='pending'`: `showPopupToast(UNDER_REVIEW_MESSAGE,'info')` called with exact message text; `goToKyc` called; `action` NOT called.
- `guard(action)` when blocked, `kycStatus!=='pending'` (e.g., `''`, `'rejected'`, or `'approved'` with `approvalStatus` blocking): `showPopupToast(BLOCKED_MESSAGE,'error')` called; `goToKyc` called; `action` NOT called.
- **The asymmetry case specifically**: `kycStatus==='approved'`, `approvalStatus==='pending'` → `blocked===true` (since approval isn't approved) → `guard()` should be tested to confirm it produces the harsher `BLOCKED_MESSAGE`/`'error'` toast (per current code, since only `kycStatus==='pending'` gets the softer message) even though the `banner` in this same state would show the softer "pending approval" info banner — this divergence between `guard()`'s toast and `banner`'s copy for the identical underlying state is exactly the kind of thing a test should pin down explicitly, flagged either as an accepted quirk or a bug to fix later.
- `goToKyc()` calls `router.push` with exactly `'/(app)/(tabs)/me/kyc-payouts'` — mock `expo-router`'s `useRouter` and assert the literal string.
- Referential stability: `guard`/`goToKyc` are wrapped in `useCallback` — verify they don't change identity across re-renders with the same deps (relevant if any consuming component memoizes on these functions, e.g. `React.memo` children receiving `guard` as a prop).

**Priority:** P0 — explicitly flagged for deep verification; this is the auth/KYC/money gate for the app's core monetization actions (go live, group calls, private calls), and it's ported 1:1 from a specific web implementation per the docstring, meaning subtle divergences from that port are exactly the "real bugs" this audit should surface.

**Bugs/notes (real, worth flagging explicitly):**
1. **`guard()`'s toast-tone check is narrower than `banner`'s branch logic** (see above): `guard()` only checks `kycStatus === 'pending'` to decide between the info vs. error toast, while `banner` separately handles `approvalStatus === 'pending'` with its own info-tone message. An artist blocked purely because `approvalStatus==='pending'` (with `kycStatus` already `'approved'`) sees an "under review" info banner on the dashboard but an error-toned "Complete your KYC verification..." toast (`BLOCKED_MESSAGE`) when tapping a gated action — message-mismatch bug between the two surfaces for the same underlying state. File: `useVerificationGate.ts`, `guard()` around line 77-81 vs. `banner` branch around line 121-127.
2. **`blocked === true` with `banner === null`** is reachable: any `kycStatus`/`approvalStatus` combination not covered by the five enumerated banner branches (e.g., `kycStatus==='approved'` + `approvalStatus` set to some value other than `''`/`'pending'`/`'rejected'`/`'approved'` — plausible if the backend ever introduces a new status string, or during a state like `approvalStatus===undefined`-mapped-to-`''` colliding oddly with... actually re-checking: `approvalStatus===''` with `kycStatus==='approved'` — does this hit banner branch 3? No, branch 3 checks `kycStatus===''`, not `approvalStatus===''`. So `kycStatus==='approved'`, `approvalStatus===''` → `blocked=true` (approvalStatus !== 'approved') but NONE of the 5 banner conditions match (not rejected, not '' kyc, not pending kyc, not pending approval) → `banner=null`. This is a genuine reachable gap: an artist who somehow has `kycStatus:'approved'` but an empty/blank `approvalStatus` would be blocked with zero dashboard explanation, only discoverable by tapping a gated action and getting the toast. File: `useVerificationGate.ts` lines 91-129 (banner block) vs. line 60-62 (`blocked` computation) — the two pieces of logic aren't kept in sync for every reachable status combination.
3. Minor: `KYC_ROUTE` and both message constants are module-level `const`s outside the hook — fine for testing (stable references), but means tests asserting exact toast copy should import these constants directly from the module rather than hardcoding the strings twice, to avoid tests silently drifting from the source of truth.

---

## Summary table

| File | Pattern | Priority |
|---|---|---|
| useAppState.ts | plain hook | P1 |
| useAuthMutations.ts | 6× useMutation | P0 |
| useAvatarPicker.ts | plain hook + mutation | P0 |
| useCreatorSettings.ts | 2× useQuery + 2× useMutation | P1 |
| useDebounce.ts | plain hook | P0 |
| useFollowers.ts | 1× useQuery | P1 |
| useGroupCallHistory.ts | 3× useQuery + 1× useInfiniteQuery | P0 |
| useInsights.ts | 4× useQuery + 2× useInfiniteQuery | P0 |
| useKeyboard.ts | plain hook | P1 |
| useKyc.ts | 2× useQuery | P0 |
| usePrivateMessages.ts | 1× useQuery (polling) | P0 |
| useProfile.ts | 3× useQuery | P0 |
| useProfileMutations.ts | 7× useMutation | P0 |
| useRewardOrders.ts | 1× useQuery + 1× useMutation | P0 |
| useStageNameAvailability.ts | debounce + gated useQuery | P0 |
| useVerificationGate.ts | derived from useProfile | P0 |

**16 files audited, approximately 210 distinct testable behaviors identified across P0/P1 (no P2s assigned — every hook here is either directly exercised by a screen (P0/P1) with no dead/unused code found; P0: 12 files, P1: 4 files).**

---

# Section 4: Auth screens + app root / navigation

Read in full: 17 files in `src/screens/auth/`, 6 route files in `app/(auth)/`, and the 4 existing Group-B files (`app/_layout.tsx`, `app/index.tsx`, `app/+not-found.tsx`, `app/(app)/_layout.tsx`). A 5th expected file, `app/(app)/(tabs)/_layout.tsx`, **does not exist** (see finding at the end). All P0 except `+not-found.tsx` (P1).

## src/screens/auth/login/schema.ts — P0
`loginSchema` (zod), `LoginFormValues`. Exact rules/messages:
- `identifier`: `.trim().min(3)` → `Enter your mobile number or stage name.`; `.max(255)` → `That value is too long.` (deliberately relaxed single field, mobile OR stage name, no format/regex).
- `password`: `.min(8)` → `Enter your password.`; `.max(64)` → `That password is too long.` (length-only at login; complexity not enforced here).
- 🐞/⚠️ min-length message `Enter your password.` never mentions the 8-char minimum (confusing UX; a 3-char password shows this same "required-looking" message).

## src/screens/auth/login/types.ts — P0
`UseLoginResult`: `control, isValid, isSubmitting, submitError, socialNotice, handleSubmit, onSocialLogin, goToRegister, goToForgotPassword`.

## src/screens/auth/login/useLogin.ts — P0
- `useForm` + `zodResolver(loginSchema)`, `mode: 'onChange'` (button disabled state updates live), defaults `{identifier:'',password:''}`.
- `isSubmitting = isSubmitting || isPending`.
- onSubmit: `setSubmitError(null)` → `hidePopupToast()` → `login({phoneOrStageName: values.identifier.trim(), password: values.password})` (identifier re-trimmed, password NOT trimmed). Success → `logger.info('Login success')` → `router.replace('/(app)/(tabs)/home')`. Failure → `message=getErrorMessage(error)`, `setSubmitError(message)`, `showPopupToast(message,'error')` (3.5s).
- `submitError` is set but login.tsx never renders it (toast only) — real internal state, not user-visible.
- `onSocialLogin(provider)`: not wired. Sets `socialNotice` to `Google sign-in isn't available yet.` (google) or `Apple sign-in isn't available yet.` (else). Uses typographic right single quote `'` — exact-match matters.
- `goToRegister → router.push('/(auth)/register')`; `goToForgotPassword → router.push('/(auth)/forgot-password')`.
- 🐞 `socialNotice` never auto-clears. `submitError` functionally dead for UI but in public contract.

## src/screens/auth/register/schema.ts — P0
`registerSchema` (composed from @utils/validators):
- `username` (`stageNameSchema`): `.trim().min(3,'Letters, numbers and underscores only').max(20,'Letters, numbers and underscores only').regex(/^[a-z0-9_]+$/,'Letters, numbers and underscores only')` — all three failure modes share the same message.
- `mobile` (`mobileSchema`): `.trim().regex(/^\d{10}$/,'Enter a valid 10-digit mobile number')`.
- `password` (`authPasswordSchema`): `.min(8,'Password must be at least 8 characters')` (length-only at zod level).
- ⚠️ uppercase stage name via setValue/paste fails regex with a message that never explains lowercase-only. Test case: `"ABC"` → `Letters, numbers and underscores only`.

## src/screens/auth/register/types.ts — P0
`UseRegisterResult`: `control, isValid, isSubmitting, submitError, handleSubmit, goToLogin`.

## src/screens/auth/register/useRegister.ts — P0
- `useForm`+`zodResolver(registerSchema)`, `mode:'onChange'`, defaults `{username:'',mobile:'',password:''}`. `isSubmitting = isSubmitting || isPending` (useSendRegistrationOtpMutation).
- onSubmit: `setSubmitError(null)` → `phone=values.mobile.trim()` → `sendOtp({phone})` → **POST /api/artist/auth/send-registration-otp**. Success → `setOtpHint(sent.otp)`, `setPendingRegistration({phone, stageName: values.username.trim(), password: values.password})` (only AFTER send succeeds; password not trimmed, stageName trimmed), `logger.info('Registration OTP sent')`, `router.push({pathname:'/(auth)/otp-verify', params:{mobile:phone, origin:'register'}})`. Failure → `setSubmitError(getErrorMessage(error))` (inline, no toast).
- `goToLogin → router.back()` (differs from login's push).

## src/screens/auth/register/pendingRegistration.ts — P0
In-memory (non-persisted) holder for register credentials between register and OTP screens (kept out of route params so password isn't in nav state). `setPendingRegistration(value)`, `getPendingRegistration(): RegisterPayload|null` (non-consuming read — wrong OTP retryable), `clearPendingRegistration()`. Module singleton — tests must reset between cases; read-without-consume invariant (two reads return same value).

## src/screens/auth/forgot-password/schema.ts — P0
`forgotPasswordSchema`: `mobile` (`mobileSchema`) `.trim().regex(/^\d{10}$/)` → `Enter a valid 10-digit mobile number`.

## src/screens/auth/forgot-password/types.ts — P0
`UseForgotPasswordResult`: `control, isValid, isSubmitting, submitError, handleSubmit, goBack`.

## src/screens/auth/forgot-password/useForgotPassword.ts — P0
- `useForm`+resolver, `mode:'onChange'`, default `{mobile:''}`. `isSubmitting = || isPending`.
- onSubmit: `phone=values.mobile.trim()` → `sendOtp({phone})` → **POST /api/artist/auth/forgot-password/send-otp**. Success → `setOtpHint(sent.otp)`, `logger.info('Password reset code requested')`, `router.push({pathname:'/(auth)/otp-verify', params:{mobile:phone, origin:'forgot-password'}})`. Failure → `setSubmitError`. `goBack → router.back()`.

## src/screens/auth/reset-password/schema.ts — P0
`resetPasswordSchema`:
- `newPassword` (`authPasswordSchema`): `.min(8)` → `Password must be at least 8 characters`.
- `confirmPassword`: `z.string()` (no independent rule).
- cross-field `.refine(newPassword===confirmPassword, {message:'Passwords do not match', path:['confirmPassword']})` — error renders under confirm field.
- ⚠️ empty confirmPassword only fails via mismatch (`Passwords do not match`), never a "required" message.

## src/screens/auth/reset-password/types.ts — P0
`UseResetPasswordResult`: `control, isValid, isSubmitting, submitError, mobile, handleSubmit, goToLogin`.

## src/screens/auth/reset-password/useResetPassword.ts — P0
- `mobile = useLocalSearchParams().mobile ?? ''`. `useForm`+resolver, `mode:'onChange'`, defaults `{newPassword:'',confirmPassword:''}`. `isSubmitting = || isPending`.
- onSubmit: `resetPassword({phone:mobile, newPassword, confirmPassword})` → **POST /api/artist/auth/forgot-password/reset**. Success → `clearOtpHint()`, `logger.info('Password reset complete')`, `router.replace('/(auth)/login')` (no token returned — must re-login). Failure → `setSubmitError`. `goToLogin → router.replace('/(auth)/login')`.
- 🐞 no guard against missing `mobile` param (unlike useOtp's completeRegistration). Deep-link/reload into reset-password with no `mobile` → silently submits `phone:''`; header falls back to "Choose a new password." masking missing context.

## src/screens/auth/otp/otpHint.ts — P0
Module holder for OTP hint (server-echoed code while SMS stubbed). `setOtpHint(value?)` (undefined → null), `getOtpHint():string|null`, `clearOtpHint()`. Dev/test convenience; reset between tests.

## src/screens/auth/otp/types.ts — P0
`UseOtpResult`: `code, setCode, isSubmitting, error, locked, attemptsLeft, codeRejected, cooldownSec, canResend, mobile, otpHint, resend, goBack`.

## src/screens/auth/otp/useOtp.ts — P0 (the OTP state machine — highest-value single hook here)
- Params: `mobile = params.mobile ?? ''`; `origin = params.origin==='forgot-password' ? 'forgot-password' : 'register'` (any unrecognized/missing → register); `isRegister = origin==='register'`.
- State: `code`, `otpHint` (lazy from getOtpHint() on mount), `isSubmitting`, `error`, `attempts` (0), `cooldownSec` (=`TIMING.otpResendCooldownSec`=**60**), `codeRejected` (false).
- Constants: `otpMaxAttempts`=**3**, `LIMITS.otp.length`=**6**. `locked = attempts>=3`; `attemptsLeft = Math.max(0, 3-attempts)`; `canResend = cooldownSec<=0 && !locked`.
- Cooldown effect: if `cooldownSec<=0` no-op; else `setInterval(-1 each 1000ms)`, cleared on unmount/re-run.
- Auto-submit effect: fires `verify(code)` once per unique 6-digit code, guarded by `submittedFor.current !== code` ref; triggers when `code.length===6`.
- `setCode(next)`: clears error, clears codeRejected, sets code.
- `verify(value)`: no-op if `locked||isSubmitting`; else `setSubmitting(true)`, `setError(null)`, branch `completeRegistration`/`completeResetVerification`, catch → `failStep(getErrorMessage(err))`, finally `setSubmitting(false)`.
- `completeRegistration(value)`: `pending=getPendingRegistration()`. If `!pending` → `setError(EXPIRED_SESSION)` (`EXPIRED_SESSION='That sign-up session expired. Please enter your details again.'`), `router.replace('/(auth)/register')`, return (no attempt burn). Else `verifyRegistrationOtp({phone:pending.phone, otp:value})` → **POST /api/artist/auth/verify-registration-otp**. Throw → `rejectCode(...)` (burns attempt, keeps pending). Success → `register(pending)` → **POST /api/artist/auth/register** (immediately), then `clearPendingRegistration()`, `logger.info('Registration complete')`, `router.replace('/(app)/(tabs)/home')`. If register throws → propagates to verify's catch → `failStep` (not rejectCode).
- `completeResetVerification(value)`: `verifyResetOtp({phone:mobile, otp:value})` → **POST /api/artist/auth/forgot-password/verify-otp**. Throw → `rejectCode`. Success → `logger.info(...)`, `router.replace({pathname:'/(auth)/reset-password', params:{mobile}})`.
- `rejectCode(message)`: `attempts+=1`, `codeRejected=true`, `error=message`, `code=''`, `submittedFor.current=null`.
- `failStep(message)`: `codeRejected=false`, `error=message`, `code=''`, `submittedFor.current=null` (does NOT increment attempts).
- `resend()`: no-op if `cooldownSec>0`; else `sendRegistrationOtp`/`sendResetOtp`; success → `setOtpHint`, `setHint`, `setCooldownSec(60)`, `setError(null)`; failure → setError.
- `goBack()`: `clearPendingRegistration()` (always) then `router.back()`.
- 🐞 `resend()` never resets `attempts` — a fresh resent code still only has the leftover attempt budget (e.g. 1 left), not a fresh 3.
- ⚠️ `locked` irreversible within screen lifetime (attempts only reset by remount) — intentional per UI copy, confirm as invariant.
- ⚠️ `origin` silently coerces anything ≠ 'forgot-password' to register flow.

## app/(auth)/_layout.tsx — P0
`AuthLayout`: `<Stack screenOptions={{headerShown:false, contentStyle:{backgroundColor:colors.background}, animation:'slide_from_right'}}>` with 5 screens in order: login, register, forgot-password, otp-verify, reset-password. No guard logic. Smoke/snapshot target.

## app/(auth)/login.tsx — P0
Presentation-only (delegates to useLogin). AuthLogo, "Welcome Back", "Sign in to keep creating and going live." AuthToggle local `useState<IdentifierMode>('mobile')` — cosmetic only (mobile: prefix +91, placeholder '00000 00000', number-pad, maxLength 10; stage: leftIcon at-sign, placeholder 'yourstagename', default kbd, maxLength 255); does NOT change validation. password FormInput isPassword maxLength 64 leftIcon lock onSubmitEditing=handleSubmit. "Forgot password?" Pressable (accessibilityLabel="Forgot password"). GradientButton "Login" loading=isSubmitting disabled=!isValid. Footer "Don't have an account? " + "Sign Up" (accessibilityLabel="Sign up"). AuthLegal. submitError destructured but never rendered (toast only).

## app/(auth)/register.tsx — P0
Heading "Create Account", "Join Mitro and start earning from your live shows." username field placeholder "Choose your stage name", maxLength 20, leftIcon at-sign, `transform=(v)=>v.replace(/\s+/g,'').toLowerCase()` (strips whitespace + lowercases as typed → lowercase-regex failure unreachable via normal typing). Availability hint (useStageNameAvailability via useWatch, advisory): isChecking → "Checking availability…"; isAvailable===true → "{stageName} is available" (success); ===false → "{stageName} is taken" (error); else nothing. Hint does NOT gate submit. mobile field prefix +91, number-pad, maxLength 10, `transform=(v)=>v.replace(/\D/g,'')`. password field isPassword maxLength 64 onSubmitEditing=handleSubmit; if password.length → PasswordStrengthMeter score=`authPasswordStrength(password)` (0–3: +1 length≥8, +1 digit, +1 special — distinct from general passwordStrength 0–4). Inline submitError if truthy (unlike login). GradientButton "Continue". Footer "Already have an account? " + "Login" (accessibilityLabel="Log in") → goToLogin (router.back()). AuthLegal.

## app/(auth)/forgot-password.tsx — P0
"Forgot Password", "Enter your registered mobile number and we'll send you a code." mobile field prefix +91 maxLength 10 transform strip-non-digits onSubmitEditing=handleSubmit. Inline submitError. GradientButton "Send OTP". Footer "Remembered your password? " + "Login" (accessibilityLabel="Back to login") → goBack. AuthLegal.

## app/(auth)/reset-password.tsx — P0
"Set New Password", subtitle `mobile ? 'For +91 {mobile}' : 'Choose a new password.'`. newPassword field isPassword maxLength 64 returnKeyType next (no submit-on-enter); PasswordStrengthMeter if password.length. confirmPassword field isPassword maxLength 64 onSubmitEditing=handleSubmit. Inline submitError. GradientButton "Reset Password". Footer "Back to login" (accessibilityLabel="Back to login") → goToLogin (router.replace, not back).

## app/(auth)/otp-verify.tsx — P0
Header "Verify code" onBack=goBack. Intro "Enter the 6-digit code we sent to " + `{mobile ? '+91 {mobile}' : 'your mobile'}`. otpHint callout (if otpHint): InfoCallout icon info tone info text `"Test mode — your code is {otpHint}"`. OtpInput bound code/setCode, disabled=locked||isSubmitting, hasError=Boolean(error). Status block: isSubmitting → "Verifying…"; error → error text + `" {attemptsLeft} attempt(s) left."` ONLY if `codeRejected && !locked` (failStep errors get no suffix), accessibilityRole="alert"; locked → "Too many attempts. Please go back and try again later." (independent block, can co-render with error). Button label=`canResend ? 'Resend code' : 'Resend code in {cooldownSec}s'` variant ghost disabled=!canResend onPress=resend. Edge: on the 3rd wrong code, error text shows NO "0 attempt(s) left." (since !locked false), locked line appears below.

## app/_layout.tsx — P0 (highest-stakes file — gates every screen)
`RootLayout` default; named `ErrorBoundary` (re-exported AppErrorBoundary).
Bootstrap effect (guarded by `initialized` ref, runs once): (1) `attachInterceptors()` sync; (2) `connectAuthInterceptors()` sync (wires onAuthFailure→logout(), onTokensRefreshed→updateTokens); (3) `await Promise.all([useAppStore.bootstrap(), useAuthStore.bootstrap(), primeAgoraAppId()])` — concurrent, awaited together. appStore.bootstrap: reads mmkvStorage.getBoolean(hasOnboarded), sets {hasOnboarded, hydrated:true}. authStore.bootstrap: reads secureStorage.get(accessToken), sets {token, status: token?'authenticated':'unauthenticated', hydrated:true}, and if token → synchronously `startNotifications()` (on EVERY cold start with a session). primeAgoraAppId: reads last-known Agora App ID from storage (no network). (4) `void loadAgoraAppId()` fire-and-forget (auth'd /api/artist/config; no-op on first cold start). catch → logger.error('App bootstrap failed'). finally → setReady(true).
Other effects: separate effect keyed `[token]` re-fires `void loadAgoraAppId()` on token transition; `useEffect(()=>pushNotifications.setupListeners(),[])` (cleanup never invoked — root never unmounts); `useEffect hideAsync on appReady`; `useAuthGuard()` unconditional.
appReady: `fontsReady = fontsLoaded || Boolean(fontError)`; `appReady = ready && fontsReady`. While !appReady renders `<AppSplash/>` only.
useAuthGuard branch table: `inAuthGroup = segments[0]==='(auth)'`; if `!authHydrated||!appHydrated` return; if `!token && !inAuthGroup` → replace('/(auth)/login'); else if `token && inAuthGroup` → replace('/(app)/(tabs)/home'); else no-op. Onboarding bypassed (hasOnboarded never read). `/` counts as not-in-auth-group → unauth on `/` gets redirected (in addition to index.tsx's own Redirect — duplicate logic).
Provider stack: GestureHandlerRootView → SafeAreaProvider → ThemeProvider(navigationTheme merges DarkTheme+colors) → QueryClientProvider → StatusBar light → Stack (screens (auth),(app),+not-found animation fade) → NotificationToastHost → IncomingCallOverlay (global).
🐞 duplicate redirect logic vs index.tsx. ⚠️ hasOnboarded dead for navigation. ⚠️ setupListeners cleanup unreachable. ⚠️ bootstrap catch swallows all 3 failures, still setReady(true).

## app/index.tsx — P0
`Index`: if `!authHydrated||!appHydrated` → `<Loader message="Starting Mitro Artist…"/>`; if token → `<Redirect href="/(app)/(tabs)/home"/>`; else `<Redirect href="/(auth)/login"/>` (onboarding skipped). Declarative Redirect (vs imperative guard) — same targets, duplicate logic.

## app/+not-found.tsx — P1
`NotFound`: `<Stack.Screen options={{title:'Not found'}}/>` + `<Screen><EmptyState variant="error" icon="compass" title="Page not found" description="The screen you're looking for doesn't exist." actionLabel="Go home" onAction={()=>router.replace('/')}/></Screen>`. Description uses typographic quotes: `"The screen you're looking for doesn't exist."` (exact-match).

## app/(app)/_layout.tsx — P0
`AppLayout`: if `!hydrated` (authStore.hydrated only — NOT appStore) → `<Loader message="Loading…"/>`; if `!token` → `<Redirect href="/(auth)/login"/>`; else `<Stack screenOptions={{headerShown:false, contentStyle:{backgroundColor:colors.background}, animation:'slide_from_right'}}>` with (tabs) and (modals animation slide_from_bottom). Fires on token clear (logout/401) while deep in (app). Guard condition narrower than root's (no appStore.hydrated check).

## app/(app)/(tabs)/_layout.tsx — DOES NOT EXIST
No `_layout.tsx` directly in `app/(app)/(tabs)/`. The 5 subfolders (business/calls/home/live/me) each have their own nested `_layout.tsx` (plain `<Stack screenOptions={tabStackOptions}>`). No file imports `Tabs` from expo-router; no `@react-navigation/bottom-tabs` used in app code. `src/navigation/useTabBarSpace.ts` is a layout-spacing hook, not a navigator config. Flagged as a structural fact for the test-writer.

---

# Section 5: Shared UI components (shared / ui / live / history / call / AppSplash)

I've read all 75 files completely. Here is the full audit.

---

# Mitro Artist App — Shared UI Component Audit (for Jest / @testing-library/react-native)

Scope: every file under `src/components/`. Paths are absolute. "RNTL query" notes name the query that targets an attribute (`getByRole`, `getByText`, `getByLabelText`, `getByA11yState`). Priorities: **P0** = reused broadly or on money/auth path; **P1** = real branching; **P2** = trivial/near-trivial presentational.

---

## `src/components/` (root)

### `/home/claude/mitro-artist-app/src/components/AppSplash.tsx` — **P2**
- **Purpose:** Branded launch splash (logo + spinner) shown while the app bootstraps.
- **Props:** none.
- **Renders:** `View` with `onLayout`, an `Image` (`splash-logo.png`, `resizeMode="contain"`), and a large `ActivityIndicator` (`colors.purple`).
- **Testable behavior:**
  - `onLayout` calls `SplashScreen.hideAsync()` and swallows rejection (`.catch(() => {})`). Test: mock `expo-splash-screen`, fire the `View`'s `onLayout`, assert `hideAsync` called; assert a thrown rejection does not surface.
  - Renders exactly one `ActivityIndicator` (RNTL: `UNSAFE_getByType` or `getByA11yRole` is not set here — the indicator has no role; query by type).
- **No conditional branches.** Near-trivial; one interaction + one render assertion.

---

## `src/components/call/`

### `/home/claude/mitro-artist-app/src/components/call/AgoraVideoView.tsx` — **P1**
- **Purpose:** Lazy wrapper over `react-native-agora`'s `RtcSurfaceView`; degrades to an empty `View` when the native module is missing (Expo Go).
- **Exports:** `AgoraVideoView`, `isAgoraVideoAvailable()`.
- **Props (`AgoraVideoView`):** `uid: number` (req), `style?: StyleProp<ViewStyle>`, `overlay?: boolean` (→ `zOrderMediaOverlay`).
- **Testable behavior:**
  - **Branch A (module missing / `RtcSurfaceView === null`):** returns `<View style={style} />` only. This is the default in a Jest env unless `react-native-agora` is mocked.
  - **Branch B (module present):** returns `RtcSurfaceView` with `canvas={{ uid }}`, `style`, `zOrderMediaOverlay={overlay}`. To exercise, `jest.mock('react-native-agora', () => ({ RtcSurfaceView: <stub/> }))`.
  - `isAgoraVideoAvailable()` returns `RtcSurfaceView !== null` — pure boolean, testable both ways via the mock.
- **Note:** the `require` + `try/catch` runs at module load, so the mock must be set **before** import (module registry reset per test).

---

## `src/components/history/`

> Recently refactored (split out of a single module). The barrel is `index.tsx`; helpers/glyph/styles live in sibling files.

### `/home/claude/mitro-artist-app/src/components/history/helpers.ts` — **P1** (pure function — highest-value unit test)
- **Purpose:** `clampPct(value: number): number = Math.max(0, Math.min(100, Math.round(value)))`.
- **Exact input → output examples:**
  - `clampPct(-5)` → **0**
  - `clampPct(150)` → **100**
  - `clampPct(42.6)` → **43** (rounds first)
  - `clampPct(42.4)` → **42**
  - `clampPct(99.5)` → **100** (round → 100, within range)
  - `clampPct(0)` → **0**; `clampPct(100)` → **100**
  - `clampPct(-0.4)` → **0** (`Math.round(-0.4)` = -0 → clamped to 0)
  - `clampPct(0.5)` → **1** (`Math.round(0.5)` = 1)
- **Suspicious edge (flag, do not fix):** `clampPct(NaN)` → **NaN** (`Math.round(NaN)=NaN`, `Math.min`/`Math.max` propagate). Any caller feeding `NaN` produces `width: "NaN%"`. Worth a documented test asserting the current behavior.

### `/home/claude/mitro-artist-app/src/components/history/TwoColGrid.tsx` — **P1**
- **Purpose:** Emulates CSS `grid-template-columns: repeat(2, minmax(0,1fr))` — measures its own width once and gives each child cell an exact `(width - gap)/2`.
- **Props:** `gap: number` (req), `children: ReactNode` (req), `style?`.
- **Local state:** `rowWidth` (init `0`), set via `onLayout` from `event.nativeEvent.layout.width`.
- **Testable behavior:**
  - `cellWidth = rowWidth > 0 ? (rowWidth - gap)/2 : undefined`. Before layout, cells render with `width: undefined`. Fire `onLayout` with a synthetic `{nativeEvent:{layout:{width: N}}}` and assert each child wrapper's computed width = `(N-gap)/2`.
  - **Null-child filtering:** `Children.map(children, child => child == null ? null : <View>…</View>)` — `null`/`undefined` children are dropped (not wrapped). Test with a mix of real and `null` children; assert only non-null get a wrapper `View`.
  - Container gets `[styles.grid, {gap}, style]`.

### `/home/claude/mitro-artist-app/src/components/history/HelpIcon.tsx` — **P1**
- **Purpose:** Tap-to-reveal tooltip for the faint HelpCircle beside history labels (web hover → phone tap).
- **Props:** `hint: string` (req), `size?: number` (default `12`). `memo`, `displayName = 'HelpIcon'`.
- **Local state:** `open` (bool).
- **Testable behavior:**
  - Trigger `Pressable`: `accessibilityRole="button"`, `accessibilityLabel="What does this mean?"`, `accessibilityHint={hint}`, `hitSlop={10}`. RNTL: `getByLabelText('What does this mean?')`.
  - `onPress` → `setOpen(true)`; renders `Modal visible={open}` (`transparent`, `animationType="fade"`).
  - Backdrop `Pressable` (`styles.tooltipBackdrop`) `onPress` → `setOpen(false)`; `Modal onRequestClose` → `setOpen(false)`.
  - Inside modal, `Text` renders the `hint` verbatim (RNTL: `getByText(hint)`). Icon is `circle-help` at `rf(size)`.
  - Test flow: query hint text absent initially → press trigger → hint text present → press backdrop → absent.

### `/home/claude/mitro-artist-app/src/components/history/styles.ts` — **no direct test** (StyleSheet token module; exercised via the components above).

### `/home/claude/mitro-artist-app/src/components/history/index.tsx` — **P1** (barrel + many small presentational primitives)
- **Re-export shape (precise):**
  - `export { clampPct } from './helpers'`
  - `export { HelpIcon } from './HelpIcon'`
  - `export { styles } from './styles'`
  - `export { TwoColGrid } from './TwoColGrid'`
  - Everything else below is **defined in this file**.
- **Components defined here & their testable behavior:**
  - `PageHead({title, subtitle})` — two `Text`s (`getByText`). memo. *Presentational.*
  - `FilterPills<T>({options, value, onChange})` — maps `options`; for each, `on = key === value`. **Branch:** active pill renders a `LinearGradient` overlay + `styles.pillTextOn`; idle renders `styles.pillText`. Each `Pressable`: `accessibilityRole="button"`, `accessibilityState={{selected: on}}`, `onPress={() => onChange(key)}`. Test: press a pill → `onChange` called with its key; assert selected a11y state on active. **Not memo.**
  - `WebCallout({tone='cyan', icon='info', children})` — `tone ∈ {cyan,gold,pink,green,red}` selects box style via `CALLOUT_BOX`, icon ink via `CALLOUT_INK`. Renders `LucideIcon name={icon}`. Test each tone maps to the right style key. memo.
  - `CalloutText`, `CalloutStrong` — text wrappers. *Presentational.*
  - `LearnLink({label, tone='cyan', onPress})` — `Text` with `accessibilityRole="link"`, `onPress`; **branch** gold vs cyan style. Test press → `onPress`; `getByText(label)`.
  - `SummaryStrip` — wraps `TwoColGrid gap={12}`. `SummaryCell({icon,tint,label,value,hint})` — `tint ∈ {cyan,gold,purple,green}` → `CELL_TINT` bg/ink; renders label, value, and a nested `HelpIcon hint`. memo. Test tint mapping + that value/label/hint render.
  - `ListHead({eyebrow, heading})` — eyebrow pill + heading text. memo.
  - `HistoryCard`, `CardDetail`, `MetricGrid` — layout wrappers. *Presentational.*
  - `MetricChip({label,value,hint,tone?})` — **branch:** `tone==='good'`→`inkGood`, `tone==='warn'`→`inkWarn`, else base. memo.
  - `MetricTile({icon,iconColor,label,value,barPct,caption,hint})` — bar fill width `${clampPct(barPct)}%` (ties to helpers). memo. Test that `barPct` out of range clamps.
  - `BreakdownRow({label,amount,pct,hint})` — fill width `${clampPct(pct)}%`. memo.
  - `WebEmptyState({icon,message})` — centered glyph + message (`getByText(message)`). memo.

---

## `src/components/live/`

> `DeliveryCard.tsx` and `index.ts` were recently refactored.

### `/home/claude/mitro-artist-app/src/components/live/index.ts` — **no direct test** (barrel)
Re-export shape (exact):
- `live` ← `./liveTokens`
- `GiftGlyph, PinGlyph, SparklesGlyph` (+ type `GlyphProps`) ← `./LiveGlyphs`
- `ActivityRow` ← `./ActivityRow`
- `DeliveryCard` (+ type `DeliveryCardProps`) ← `./DeliveryCard`
- `RoomPanel` (+ `RoomPanelProps`) ← `./RoomPanel`
- `RoomStartGate` (+ `RoomStartGateProps`) ← `./RoomStartGate`
- `RoundChip` (+ `RoundChipProps`, `ChipVariant`) ← `./RoundChip`
- `StageControls` (+ `StageControlsProps`) ← `./StageControls`

### `/home/claude/mitro-artist-app/src/components/live/liveTokens.ts` — **no direct test** (token object; spreads `callUi` and adds feed/gate inks and aliases). Could get one snapshot/identity test if desired.

### `/home/claude/mitro-artist-app/src/components/live/LiveGlyphs.tsx` — **P2, single smoke test only.** Three pure SVG glyphs (`GiftGlyph`, `SparklesGlyph`, `PinGlyph`), props `{size, color}` straight to `Svg`/`Path`. Zero branches.

### `/home/claude/mitro-artist-app/src/components/live/DeliveryCard.tsx` — **P1** (recently added; money-adjacent "manage stream/call" sheet card)
- **Props:** `icon: 'gift' | 'star'` (req), `title: string` (req), `count: number` (req), `rows: ReactNode` (req).
- **Testable behavior:**
  - Header renders `Feather name={icon}` (gold) + title `Text`.
  - **Pending suffix branch:** `count > 0` appends `` ` (${count} pending)` `` to the title; `count <= 0` appends `''`. Test `getByText('Foo (3 pending)')` vs `getByText('Foo')`.
  - **Body branch:** `count === 0` → renders `Text "Nothing owed right now."`; **else renders `rows`.** Test with `count=0` (empty message present, rows absent) and `count>0` (rows present).
  - **Edge (flag):** negative `count` (e.g. `-1`) → suffix branch false **and** body branch false → renders `rows` with **no** "(pending)" label. Minor; document current behavior.
- Not memoized.

### `/home/claude/mitro-artist-app/src/components/live/ActivityRow.tsx` — **P1** (high branch density; shared by broadcast + group call feeds)
- **Purpose:** one live-feed row: chat / reaction / highlighted / reward / fun_wheel.
- **Props:** `item: BroadcastActivityItem` (req). memo, `displayName`.
- **Testable behavior (many branches):**
  - `initials = (displayName || '?').slice(0,1).toUpperCase()` → falls back to `?`.
  - `st = item.status ? callStatusStyle[item.status] : undefined` — status pill renders only when `item.status` set (uses `st.bg`, `st.color`, `st.label`).
  - `highlighted = item.type === 'highlighted'`.
  - **`nameColor` branch:** highlighted → `tokenPillInk`; `reward|reaction|fun_wheel` → `actNameGift`; else `actName`.
  - **`reactionGlyph`:** `item.iconUrl && !item.iconUrl.startsWith('http') ? item.iconUrl : (item.extra ?? '❤️')` — non-http `iconUrl` used as emoji; otherwise `extra`, else default heart.
  - **`detail` render (5-way):**
    - `highlighted` → `PinGlyph` + italic quoted `item.text` (`&ldquo;…&rdquo;`).
    - `reaction` → `sent {reactionGlyph}`.
    - `fun_wheel` → `SparklesGlyph` + `won "extra"`.
    - `reward` → `GiftGlyph` + `bought "extra"`.
    - else (chat) → plain `item.text`.
  - **Badges (independent conditionals):** `item.isArtist` → HOST badge (`getByText('HOST')`); `item.priceCharged` → `+{priceCharged} coins` pill; `st` → status pill.
  - Root style adds `styles.actRowHighlighted` when highlighted.
  - `Avatar` gets `initials`, `uri={item.avatarUrl ?? undefined}`, `size="sm"`.
- Test each `item.type` and each badge flag independently.

### `/home/claude/mitro-artist-app/src/components/live/RoomPanel.tsx` — **P1**
- **Purpose:** Slide-in panel below a room's video stage (chat/viewers/activity).
- **Props:** `title: string`, `onClose: () => void`, `children: ReactNode`. memo.
- **Testable behavior:**
  - Header `Text` = `title` (`getByText`).
  - Close `Pressable`: `accessibilityRole="button"`, `accessibilityLabel={`Close ${title.toLowerCase()}`}` (dynamic — e.g. title `"LIVE CHAT"` → label `"Close live chat"`), `hitSlop={8}`, `onPress={onClose}`. Test press → `onClose`; assert lowercased label.
  - Renders `children`.

### `/home/claude/mitro-artist-app/src/components/live/StageControls.tsx` — **P1**
- **Purpose:** camera/mic/flip cluster pinned top-right of a stage.
- **Props:** `camOn`, `micOn` (bool, req), `onToggleCam`, `onToggleMic` (req), `onFlipCamera?`, `showCamera?=true`, `topOffset?`.
- **Testable behavior:**
  - **Camera button branch:** rendered only when `showCamera`. Icon `video` vs `video-off` by `camOn`; `!camOn` adds `styles.btnMuted`. Label `"Toggle camera"`. Press → `onToggleCam`.
  - Mic button always rendered: icon `mic`/`mic-off` by `micOn`; `!micOn` → muted. Label `"Toggle mic"`. Press → `onToggleMic`.
  - **Flip button branch:** rendered only when `onFlipCamera` provided; label `"Flip camera"`; press → `onFlipCamera`.
  - `topOffset != null` overrides row `top`. Test container style.
- All labels are stable for `getByLabelText`.

### `/home/claude/mitro-artist-app/src/components/live/RoundChip.tsx` — **P1**
- **Purpose:** one round chip of the room action bar.
- **Props:** `variant: 'danger'|'neutral'|'gift'|'stats'` (req), `icon: FeatherIconName` (req), `label: string` (req), `onPress` (req), `active?=false`, `badge?=0`. memo.
- **Testable behavior:**
  - `Pressable`: `accessibilityRole="button"`, `accessibilityLabel={label}`, `hitSlop={6}`, `onPress`. RNTL: `getByLabelText(label)`.
  - **Active branch:** `active` → renders `LinearGradient` fill, icon color `callUi.white`; idle → `styles.chipIdle` + `{backgroundColor: v.bg, borderColor: v.border}` from `callUi.chip[variant]`, icon color `v.icon`.
  - **Badge branch:** `badge > 0` → badge bubble with `Text` = badge number (`getByText(String(badge))`); `0` hidden.
  - Test each variant maps to `callUi.chip[variant]`, active vs idle, badge shown/hidden.

### `/home/claude/mitro-artist-app/src/components/live/RoomStartGate.tsx` — **P1** (OFFLINE "Start Call" gate)
- **Props:** `eyebrow`, `eyebrowIcon`, `title`, `note`, `startLabel` (req strings/icon); `starting?=false`; `onBack`, `onStart` (req); `children` (camera preview); `camOn`, `micOn`, `onToggleCam`, `onToggleMic` (req, forwarded to `StageControls`); `onFlipCamera?`; `showCamera?=true`.
- **Testable behavior:**
  - Back `Pressable`: label `"Back"`, press → `onBack`.
  - Eyebrow row: `Feather name={eyebrowIcon}` + `Text {eyebrow}`. Title `Text` (numberOfLines=1). Static OFFLINE pill + `00:00` timer + `clock` icon.
  - Progress bar: 4 segments, first `progSegFilled`; `Text {note}`.
  - Embeds `StageControls` with the forwarded cam/mic props + `showCamera`; renders `children` in the stage.
  - **Start CTA branch (`starting`):**
    - `disabled={starting}`; `accessibilityState={{disabled: starting, busy: starting}}`; `accessibilityLabel={startLabel}`.
    - `starting` → `ActivityIndicator` + text `"STARTING…"` and style `startBusy`; else → `play` icon + `{startLabel}`.
    - Press when not starting → `onStart`; when `starting` press is disabled (assert `onStart` not called).
- memo.

---

## `src/components/shared/`

### `/home/claude/mitro-artist-app/src/components/shared/index.ts` — **no direct test** (barrel; re-exports every shared component + types, incl. all `Skeleton*` variants and `NotificationToastHost`/`toastConfig`).

### `/home/claude/mitro-artist-app/src/components/shared/AddRewardDialog/index.tsx` — **P0** (money: creates a paid reward)
- **Props:** `visible`, `isSaving` (req bool), `error?`, `onSubmit(name, tokens)` (req), `onCancel` (req).
- **Local state:** `name`, `tokens` (strings); animated `anim`.
- **Testable behavior:**
  - **Reset effect:** when `visible` becomes true, `setName('')` + `setTokens('')` (cancelled entry doesn't reappear). Test re-open clears fields.
  - **Tokens sanitizing:** `onChangeText={(v) => setTokens(v.replace(/\D/g,''))}` — non-digits stripped. `keyboardType="number-pad"`, `maxLength={4}`. Name `maxLength={NAME_MAX=40}`.
  - **Validation (`canSave`):** `name.trim().length >= 2 && Number.isFinite(parsedTokens) && parsedTokens > 0 && parsedTokens <= TOKENS_MAX(9999)`. `parsedTokens = parseInt(tokens,10)`. Test boundaries: name len 1 (invalid) / 2 (valid); tokens 0 (invalid), 1 (valid), 9999 (valid), 10000 (invalid), '' (NaN→invalid).
  - Confirm `Pressable`: `disabled={!canSave || isSaving}`, label `"Save reward"`; on press → `onSubmit(name.trim(), parsedTokens)`. Test disabled prevents submit; enabled calls with trimmed name + parsed number.
  - Confirm label text: `isSaving ? 'Saving…' : 'Add reward'`.
  - **Error branch:** `error` → red `Text` (`getByText(error)`).
  - Backdrop `Pressable` (label `"Dismiss"`): `onPress={isSaving ? undefined : onCancel}` — no-op while saving. Cancel button `disabled={isSaving}` → `onCancel`.
  - a11y labels: inputs `"Reward name"`, `"Coin price"`.

### `/home/claude/mitro-artist-app/src/components/shared/AppErrorBoundary/index.tsx` — **P1**
- **Purpose:** Render-crash fallback (picked up by expo-router `ErrorBoundary`).
- **Props:** `error: Error`, `retry: () => void`.
- **Testable behavior:**
  - Renders title `"Something broke on this screen"`.
  - Message `Text` = `error.message || 'Unknown error'` (`selectable`). Test with empty-message error → shows `"Unknown error"`.
  - **Stack branch:** `error.stack` → second `Text` shows stack; absent → not rendered.
  - Retry `Pressable`: `accessibilityRole="button"`, label `"Try again"`, press → `retry`.
  - Uses `useSafeAreaInsets` (wrap in `SafeAreaProvider` for tests).

### `/home/claude/mitro-artist-app/src/components/shared/AuthBackground/index.tsx` — **P2, single smoke test only.** Two SVG radial glows over a flat base; maps `authGlow.orbs`. No props, no branches (just `.map`).

### `/home/claude/mitro-artist-app/src/components/shared/AuthLegal/index.tsx` — **P2, single smoke test only.** Renders an **empty** `View` (age-gate copy removed). **Flag:** effectively dead/placeholder — a smoke test that it renders without crashing is all that's warranted.

### `/home/claude/mitro-artist-app/src/components/shared/AuthLogo/index.tsx` — **P2, single smoke test only.** Gradient ring around the Mitro logo image; prop `size?` (default `wp(26)`). `accessibilityRole="image"`, label `"Mitro"` — one query. No branches.

### `/home/claude/mitro-artist-app/src/components/shared/AuthToggle/index.tsx` — **P0** (auth Sign in / Sign up selector; generic `<T extends string>`)
- **Props:** `options: readonly [opt, opt]` (each `{value, label, icon}`), `value: T`, `onChange(value)`.
- **Testable behavior:**
  - Renders two `Pressable` halves; `active = option.value === value`.
  - Each half: `accessibilityRole="button"`, `accessibilityState={{selected: active}}`, `accessibilityLabel={option.label}`, `onPress={() => onChange(option.value)}`.
  - **Active branch:** renders `LinearGradient` fill; icon/text color white vs `textMuted`.
  - Test: press inactive half → `onChange(thatValue)`; assert selected a11y state tracks `value`.
- `memo` cast preserving generic signature.

### `/home/claude/mitro-artist-app/src/components/shared/AvatarPreview/index.tsx` — **P1** (profile-photo upload confirm)
- **Props:** `visible`, `uri: string|null`, `isUploading` (req), `error?`, `onConfirm`, `onChooseAnother`, `onCancel` (req).
- **Testable behavior:**
  - **Image branch:** `uri` → `Image` (`accessibilityLabel="Selected photo"`); null → empty ring.
  - **Error branch:** `error` → red `Text`.
  - Confirm button label: `isUploading ? 'Uploading…' : 'Upload Photo'`; `disabled={isUploading}`; label `"Upload photo"`; press → `onConfirm`.
  - "Choose another" `Pressable` (label `"Choose another photo"`), `disabled={isUploading}` → `onChooseAnother`.
  - Close (label `"Close"`) and backdrop (label `"Dismiss"`): both `disabled`/no-op while `isUploading` (`onPress={isUploading ? undefined : onCancel}` on backdrop; close `disabled={isUploading}`).
  - Test the mid-upload lockout: with `isUploading`, all three cancel paths are inert.

### `/home/claude/mitro-artist-app/src/components/shared/BottomSheet/index.tsx` — **P1** (gesture-heavy; test what's deterministic)
- **Purpose:** Modal bottom sheet with snap points, dimmed backdrop, drag-to-dismiss (RN primitives only).
- **Props:** `visible`, `onClose` (req), `snapPoints?=[0.5]`, `initialSnap?=0`, `title?`, `showHandle?=true`, `children`, `contentStyle?`.
- **Testable behavior (deterministic subset):**
  - **Snap clamping/sorting:** `snaps = snapPoints.map(p => clamp(p, 0.2, 0.95)).sort(asc)`. Unit-worthy if extracted, but here observable via layout. Test: passing `[0.9, 0.4, 1.5]` → clamps to `[0.9,0.4,0.95]` then sorts.
  - `startIndex = clamp(initialSnap, 0, snaps.length-1)`.
  - **Title branch:** `title` → header row with title `Text` + close button (label `"Close"`); absent → no header.
  - **Handle branch:** `showHandle` → drag handle area with `panResponder` (also gates drag-to-dismiss); false → no handle, no drag.
  - Backdrop `Pressable` label `"Close sheet"` → `close()` (which calls `animateTo` + `onClose`). `onRequestClose` → `close`.
  - PanResponder release logic (dismiss threshold `wp(18)` / fling `vy>0.5`, nearest-snap settling) is animation-driven — assert `onClose` fires on the backdrop path; gesture math is better covered by extraction if you want unit coverage.
  - Uses `useSafeAreaInsets`.

### `/home/claude/mitro-artist-app/src/components/shared/CircleFilters/index.tsx` — **P1**
- **Props:** `options: CircleFilterOption[]` (`{value,label,icon,badge?}`), `value`, `onChange`, `style?`.
- **Testable behavior:**
  - Maps options; `active = opt.value === value`.
  - Each `Pressable`: `accessibilityRole="button"`, `accessibilityState={{selected: active}}`, `accessibilityLabel={opt.label}`, press → `onChange(opt.value)`.
  - **Active branch:** gradient circle + white icon vs idle bordered circle + muted icon.
  - **Badge branch:** `opt.badge` truthy → bubble with badge number; `0`/undefined hidden.
  - Label `Text` color primary vs muted by active.

### `/home/claude/mitro-artist-app/src/components/shared/ConfirmDialog/index.tsx` — **P0** (destructive confirm; replaces `Alert.alert`)
- **Props:** `visible`, `title`, `message`, `confirmLabel` (req); `cancelLabel?='Cancel'`; `tone?='danger'`; `confirmLoading?=false`; `icon?` (**deprecated/unused**); `onConfirm`, `onCancel` (req).
- **Testable behavior:**
  - Renders `title` + `message` (`getByText`).
  - Backdrop `Pressable` (label `"Dismiss"`) → `onCancel`. `onRequestClose` → `onCancel`.
  - Cancel button label = `cancelLabel`; `disabled={confirmLoading}` (+ `styles.disabled` opacity); press → `onCancel`.
  - Confirm button label = `confirmLabel`; `disabled={confirmLoading}`; press → `onConfirm`.
  - **Tone branch:** `danger` → confirm gradient `['#FF4757','#FF6B81']`; else → `gradients.cta`.
  - **Loading branch:** `confirmLoading` → `ActivityIndicator` inside confirm (label text hidden). Test: with loading, both buttons disabled and spinner shown.
  - **Flag (dead prop):** `icon` is accepted and documented "no longer rendered" — never used. A test can assert passing `icon` has no effect.

### `/home/claude/mitro-artist-app/src/components/shared/Divider/index.tsx` — **P2** (near-trivial, one branch)
- **Props:** `label?`.
- **Behavior:** **branch** — no `label` → single `View` line; with `label` → two flex lines + centered `Text` (`getByText(label)`). Two-render test.

### `/home/claude/mitro-artist-app/src/components/shared/EarningsBar/index.tsx` — **P0** (money + data hook + routing; top strip on tab roots)
- **Props:** `amount?=''`, `caption?='EARNED'`, `brand?=false`, `onPressAmount?`, `onPressBell?`, `unread?=false`.
- **Hooks:** `useRouter()`, `useConversations()` — **must be mocked**. `messagesUnread = sum(convos.unreadCount ?? 0)`.
- **Testable behavior:**
  - **Brand branch:** `brand` → `LogoBadge variant="wave"` + `"Mitro"` text; else → earnings pill (`zap` icon + `amount` + `caption`), `Pressable` `disabled={!onPressAmount}`, label = `` `${amount} ${caption.toLowerCase()}` ``, press → `onPressAmount`.
  - **Bell branch:** `onPressBell` → bell `Pressable` (label `"Notifications"`); `unread` → red dot. Press → `onPressBell`.
  - Messages `Pressable` (label `"Messages"`) always rendered → `router.push('/(app)/(tabs)/me/messages')`; **red dot when `messagesUnread > 0`** (driven by mocked hook). Test dot appears when hook returns unread convos.
- Mock `@hooks/usePrivateMessages` and `expo-router`.

### `/home/claude/mitro-artist-app/src/components/shared/EmptyState/index.tsx` — **P1**
- **Props:** `title` (req), `description?`, `icon?`, `actionLabel?`, `onAction?`, `variant?='empty'`.
- **Testable behavior:**
  - `resolvedIcon = icon ?? (variant==='error' ? 'alert-circle' : 'inbox')`.
  - Icon color: `variant==='error'` → `colors.error` else `textMuted`.
  - Container `accessibilityRole="summary"`.
  - **Description branch:** rendered only if `description`.
  - **Action branch:** rendered only if `actionLabel && onAction`; `Button variant = variant==='error' ? 'primary' : 'secondary'`; press → `onAction`.
- Test both variants and action presence.

### `/home/claude/mitro-artist-app/src/components/shared/FormInput/index.tsx` — **P0** (RHF ↔ themed Input bridge; every auth/settings form)
- **Props:** `control`, `name` (req); `transform?`; plus all `InputProps` except value/onChange/onBlur/error.
- **Testable behavior (wrap in a real `useForm` in tests):**
  - Binds `Controller`; passes `value` (coerced: `typeof value === 'string' ? value : ''`).
  - `onChangeText` → `onChange(transform ? transform(next) : next)`. Test `transform` (e.g. lowercase) is applied to form state.
  - **Error surfacing:** `shouldShowError = Boolean(error) && (isTouched || isSubmitted)` — error passed to `Input` only after blur (touched) or a submit attempt, never on first render. Test: invalid initial value renders no error; after `blur` or submit, error shows.
  - `onBlur` forwarded.

### `/home/claude/mitro-artist-app/src/components/shared/GlassCard/index.tsx` — **P2, single smoke test only.** Frosted-glass wrapper (`BlurView` + tint + top-highlight gradient + `children`). Props `children`, `style?`. Zero branches.

### `/home/claude/mitro-artist-app/src/components/shared/Header/index.tsx` — **P1** (centered-title screen header)
- **Props:** `title` (req), `subtitle?`, `onBack?`, `rightIcon?`, `onRightPress?`, `rightAccessibilityLabel?`.
- **Testable behavior:**
  - **Back branch:** `onBack` → left `Pressable` (label `"Go back"`) → `onBack`; else empty side slot.
  - Title `Text` centered, numberOfLines=1 (`getByText(title)`).
  - **Subtitle branch:** rendered only if `subtitle`.
  - **Right branch:** `rightIcon` → right `Pressable` label `rightAccessibilityLabel ?? 'Action'`, press → `onRightPress`. Test custom vs default label.

### `/home/claude/mitro-artist-app/src/components/shared/HeroCard/index.tsx` — **P2, single smoke test only.** Solid indigo panel wrapping `children`. Props `children`, `style?`. Zero branches.

### `/home/claude/mitro-artist-app/src/components/shared/IconChip/index.tsx` — **P2** (near-trivial; tone map)
- **Props:** `icon` (req), `tone?='pink'`, `color?`, `style?`.
- **Behavior:** `TONE[tone]` picks fill+icon color; **`color` override branch:** icon color = `color ?? t.icon`. Test a couple tones + that `color` overrides tone. Otherwise presentational.

### `/home/claude/mitro-artist-app/src/components/shared/IncomingCallOverlay/index.tsx` — **P0** (money/call path; timers, network, routing — the most behavior-dense file)
- **Purpose:** Global incoming private-call popup mounted in root layout.
- **Props:** none (reads store + router + pathname). No `memo`; also `export default`.
- **Hooks/stores to mock:** `useRouter`, `usePathname`, `useSafeAreaInsets`, `useIncomingCallStore` (`current`, `dismiss`), `privateCallApi.acceptRequest/rejectRequest`, `showToast`. Reanimated pulse.
- **Testable behavior:**
  - **Null branch:** `!request` → returns `null` (nothing rendered).
  - **Hidden-route branch:** `HIDDEN_ON.some(r => pathname?.includes(r))` → returns `null`. Routes: `private-call-room`, `group-call-room`, `live-broadcast-room`, `incoming-call-request`, `private-calls`. Test each hides the overlay.
  - **Countdown effect:** `secondsUntil(expiresAt)` seeds `remaining`; `setInterval` every 1s updates; when `left <= 0` → `clearInterval` + `dismiss(requestId)`. Use fake timers; assert auto-dismiss at expiry.
  - `busy` reset effect keyed on `requestId` (new request clears button state).
  - **Urgency branch:** `urgent = remaining <= URGENT_SEC(5)` → countdown text color danger vs muted.
  - **Name fallback:** `request.userDisplayName || 'Someone'`; avatar initials `(userDisplayName || 'S').slice(0,1).toUpperCase()`.
  - **Message branch:** `request.message` → quoted italic `Text`.
  - Price row: `{initialChargeSnapshot} coins / 5 min` + `({pricePerMinuteSnapshot}/min after)`.
  - **onAccept:** guards `busy || !request`; sets `busy='accept'`; `await privateCallApi.acceptRequest`; on `res.success` → `dismiss` + `router.push('/(app)/(modals)/private-call-room', {params:{connection: JSON.stringify(res.data), fanName, ratePerMin}})`; on failure → `showToast(res.error,'error')` + `setBusy(null)`. Test both API branches.
  - **onReject:** guards; `busy='reject'`; `await rejectRequest(id, 'Not available right now')`; then `dismiss`.
  - Buttons: Reject/Accept `Pressable`s (labels `"Reject call"`/`"Accept call"`), `disabled={busy !== null}`; each shows `ActivityIndicator` when its own `busy` value is active. Test disabled-while-busy prevents double taps.

### `/home/claude/mitro-artist-app/src/components/shared/InfoCallout/index.tsx` — **P1**
- **Props:** `icon?`, `tone?='neutral'`, `children`, `linkLabel?`, `onLinkPress?`.
- **Behavior:** `TONE[tone]` (success/warning/info/neutral) → bg/border/icon/link color. **Icon branch:** rendered only if `icon`. **Link branch:** `linkLabel` → `Pressable` `accessibilityRole="link"`, label `linkLabel`, press → `onLinkPress`. Test each tone + link press.

### `/home/claude/mitro-artist-app/src/components/shared/InsightLine/index.tsx` — **P1**
- **Props:** `lead` (req), `tail?`, `onHelp?`, `helpLabel?='Why this matters'`, `style?`.
- **Behavior:** bold `lead` + optional `tail` in same paragraph. **onHelp branch:** renders circular "?" `Pressable` (`accessibilityRole="button"`, label `helpLabel`) → `onHelp`. Test tail render + help press.

### `/home/claude/mitro-artist-app/src/components/shared/LabeledField/index.tsx` — **P0** (RHF settings field w/ counter + error)
- **Props:** `control`, `name`, `label` (req); `multiline?`; `transform?`; `counter?`; plus `TextInputProps` (minus value/onChange/onBlur/style).
- **Testable behavior:**
  - Label `Text` = `label`; input `accessibilityLabel={label}`.
  - **Counter branch:** `counter` truthy → `"{len} / {counter}"`; color `error` when `stringValue.length > counter`, else muted. Test overflow color.
  - `onChangeText` applies `transform` before `onChange`.
  - **Error surfacing** (same as FormInput): `showError = Boolean(error) && (isTouched || isSubmitted)` → red error `Text` + `inputError` border. Never on first render.
  - **Multiline branch:** `multiline` → `textarea` style (minHeight 96, top-aligned).

### `/home/claude/mitro-artist-app/src/components/shared/ListRow/index.tsx` — **P0** (generic row used across many screens; slot-heavy)
- **Props:** `title` (req), `subtitle?`, `icon?`, `iconTint?`, `left?`, `value?`, `valueColor?='textPrimary'`, `right?`, `chevron?`, `onPress?`, `divider?=false`, `disabled?=false`, `style?`.
- **Testable behavior:**
  - **Leading slot:** `left ?? (icon ? <chip/> : null)` — `left` wins over `icon`; neither → nothing.
  - **Subtitle branch:** rendered if `subtitle` (numberOfLines=2).
  - **Trailing slot:** `right || value` → wrapper; `right ?? <Text value>` (color `valueColor`). `right` wins over `value`.
  - **Chevron branch:** `showChevron = chevron ?? Boolean(onPress)` — defaults to shown when pressable; explicit `chevron={false}` suppresses.
  - **Pressable branch:** `!onPress || disabled` → returns plain `View` (not pressable). Else `Pressable` (`accessibilityRole="button"`, `accessibilityLabel={title}`, `accessibilityHint={subtitle}`, pressed opacity) → `onPress`. Test: `disabled` row does not fire `onPress`.

### `/home/claude/mitro-artist-app/src/components/shared/LoadFailed/index.tsx` — **P1**
- **Props:** `message?`, `onRetry?`, `isRetrying?`.
- **Behavior:** `accessibilityRole="summary"`. Message = `message ?? 'Check your connection and try again.'`. **Retry branch:** `onRetry` → `Pressable` (label `"Try again"`), `disabled={isRetrying}`; label text `isRetrying ? 'Retrying…' : 'Try again'`; press → `onRetry`. Test default message + retry states.

### `/home/claude/mitro-artist-app/src/components/shared/Loader/index.tsx` — **P2** (near-trivial)
- **Props:** `message?`, `fullscreen?=true`.
- **Behavior:** `accessibilityRole="progressbar"`, `accessibilityLabel={message ?? 'Loading'}`. **Message branch:** rendered if `message`. **Fullscreen branch:** adds `styles.fullscreen`. Small two-branch test.

### `/home/claude/mitro-artist-app/src/components/shared/OtpInput/index.tsx` — **P0** (auth OTP)
- **Props:** `value`, `onChange` (req); `disabled?=false`; `hasError?=false`; `autoFocus?=true`.
- **Testable behavior:**
  - `CELLS` length = `LIMITS.otp.length` (6). Renders that many cells; each shows `value[index] ?? ''`.
  - **Active cell:** `active = index === value.length` → `cellActive` border. **Error:** `hasError` → `cellError` on every cell.
  - `handleChange`: strips non-digits (`replace(/\D/g,'')`) and slices to `otp.length`, then `onChange(digits)`. Test typing `"12a34"` → `onChange('1234')`; typing 8 digits → truncated to 6.
  - Wrapping `Pressable` (`accessibilityRole="none"`, label `"One-time passcode"`) focuses the hidden input; hidden `TextInput` label `"Enter 6-digit code"`, `editable={!disabled}`, `keyboardType="number-pad"`, `autoComplete="sms-otp"`, `caretHidden`.

### `/home/claude/mitro-artist-app/src/components/shared/PageHeader/index.tsx` — **P1** (left-aligned pushed-screen header)
- **Props:** `title` (req), `onBack?`, `badge?`, `right?`.
- **Behavior:** **Back branch** (`onBack` → circular back `Pressable`, label `"Go back"` → `onBack`). Title `Text`. **Badge branch:** `badge` truthy → bubble with number (hidden at 0/undefined). `right` node rendered as-is.

### `/home/claude/mitro-artist-app/src/components/shared/PasswordStrengthMeter/index.tsx` — **P1** (auth)
- **Props:** `score: number` (0..3).
- **Behavior:** `clamped = clamp(score, 0, 3)`. Three bars; bar `index < clamped` filled with `TINT[clamped]` (`[red, red, gold, green]`), else `colors.border`. `accessibilityRole="progressbar"`. Test: score 0 → no fill; 1 → 1 red bar; 2 → 2 gold bars; 3 → 3 green bars; 5 → clamped to 3.

### `/home/claude/mitro-artist-app/src/components/shared/PhotoViewer/index.tsx` — **P1**
- **Props:** `visible`, `uri: string|null`, `onClose` (req), `onDelete?`.
- **Behavior:**
  - Full-bleed backdrop `Pressable` → `onClose`; `onRequestClose` → `onClose`.
  - **Image branch:** `uri` → `Image` (`contentFit="contain"`, `cachePolicy="none"`, label `"Photo"`); null → none.
  - **__DEV__ branch:** `__DEV__ && uri` → selectable URL `Text` (debug). Test can flip `__DEV__`.
  - Close button (label `"Close"`) → `onClose`.
  - **Delete branch:** `onDelete` → `Pressable` (label `"Remove photo"`) → `onDelete`.
  - Uses `useSafeAreaInsets`.

### `/home/claude/mitro-artist-app/src/components/shared/ProgressBar/index.tsx` — **P1** (has real clamp logic)
- **Props:** `value: number` (0..1), `height?=6`, `style?`.
- **Behavior:** `pct = clamp(value, 0, 1) * 100`; fill width `${pct}%`; gradient reversed (start x:1 → end x:0). Test: `value=-1`→0%, `0.5`→50%, `2`→100%. Otherwise presentational.

### `/home/claude/mitro-artist-app/src/components/shared/RingAvatar/index.tsx` — **P1**
- **Props:** `initials` (req), `imageUrl?`, `size?=96`, `ring?=3`, `badge?`, `style?`.
- **Behavior:** `inner = size - ring*2`. **Image branch:** `imageUrl` → `Image` (label `"Profile picture"`); else → `initials` `Text` sized `inner*0.34`. **Badge branch:** `badge` → pill with green dot + `badge` text. Test image-vs-initials fallback + badge.

### `/home/claude/mitro-artist-app/src/components/shared/Screen/index.tsx` — **P0** (every route wraps in this; has real scroll logic)
- **Props:** `children` (req); `scrollable?=false`; `padded?=true`; `edges?=['top','bottom']`; `contentContainerStyle?`; `style?`; `background?`; `header?`; `tabBarSpacing?=false`; `refreshControl?`; `onEndReached?`; `endReachedOffset?=320`.
- **Hooks:** `useTabBarSpace()` (mock).
- **Testable behavior:**
  - **Scrollable branch:** `scrollable` → `ScrollView` (with `refreshControl`, `onScroll`, `scrollEventThrottle=16`); else plain `View`.
  - **Background branch:** `background` → absolute-fill decorative layer (`pointerEvents="none"`).
  - **Header branch:** `header` → pinned header outside the scroll area.
  - **`tabBarSpacing` branch:** adds `paddingBottom: tabSpace`.
  - **`onEndReached` latch (real logic):** on scroll, `distanceToEnd = contentSize.height - contentOffset.y - layoutMeasurement.height`; when `<= endReachedOffset` and `armed` → fire once + disarm; re-arms only after scrolling back out. Test via synthetic `onScroll` events: fires once inside zone, doesn't re-fire until you scroll out and back in.

### `/home/claude/mitro-artist-app/src/components/shared/ScreenPlaceholder/index.tsx` — **P1**
- **Props:** `title` (req), `icon?='tool'`, `note?`, `params?`, `hideBack?=false`.
- **Hooks:** `useRouter` (mock).
- **Behavior:** `Header onBack = hideBack ? undefined : router.back`. Note = `note ?? 'This screen is wired up…'`. **Params branch:** `entries = Object.entries(params ?? {}).filter(([,v]) => v !== undefined)`; when non-empty → "ROUTE PARAMS" block listing `key: value`. Test that `undefined` params are filtered out and `hideBack` suppresses back.

### `/home/claude/mitro-artist-app/src/components/shared/SectionLabel/index.tsx` — **P1**
- **Props:** `children: string` (req), `divider?=false`, `onHelp?`, `helpLabel?='More information'`, `style?`.
- **Behavior:** `divider` → top rule + padding. **onHelp branch:** "?" `Pressable` (label `helpLabel`) → `onHelp`. Test both.

### `/home/claude/mitro-artist-app/src/components/shared/SegmentedControl/index.tsx` — **P1**
- **Props:** `options: readonly string[]`, `value`, `onChange`, `variant?='pills'`, `style?`.
- **Behavior:** `inset = variant==='inset'` → joined track vs separate pills. Per option `active = option === value`; `accessibilityRole="button"`, `accessibilityState={{selected: active}}`, press → `onChange(option)`; active adds `styles.active`; idle (pills) adds `pillIdle`. Text color `active ? 'ctaDark' : 'textSecondary'`. Test both variants + selection.

### `/home/claude/mitro-artist-app/src/components/shared/Skeleton/index.tsx` — **P1** (many exported presets; **contains a reanimated smell**)
- **Exports:** `Skeleton`, `SkeletonText`, `SkeletonCircle`, `SkeletonBox`, `SkeletonButton`, `SkeletonImage`, `SkeletonCard`, `SkeletonListRow`, `SkeletonStatTile`, `SkeletonRows`, `SkeletonNotificationRow`, `SkeletonNotificationRows`.
- **Testable behavior:**
  - `Skeleton` renders `Animated.View` with `accessibilityRole="progressbar"`, `accessibilityLabel="Loading"`; width/height/round applied.
  - Presets render the expected shapes: `SkeletonListRow({avatar=true, trailing=false})` → **avatar branch** (leading circle) + **trailing branch** (trailing block). `SkeletonRows({count=4})` and `SkeletonNotificationRows({count=5})` render `count` children (test count prop drives child count). `SkeletonCard` derives body height `height-78`.
  - **Flag (real smell, do not fix):** `usePulse()` assigns `opacity.value = withRepeat(...)` **in the render body** (lines ~27–35), not inside `useEffect`. This re-triggers the animation on every render and is the kind of thing RN reanimated warns about ("writing to a shared value during render"). Tests that re-render will re-run it; worth a note for the test author (mock `react-native-reanimated`).
- Because there are 12 exports, budget a small render/prop test per preset (most are one-liners over `Skeleton`).

### `/home/claude/mitro-artist-app/src/components/shared/SocialButton/index.tsx` — **P1**
- **Props:** `provider: 'google'|'apple'` (req), `onPress` (req), `disabled?=false`, `style?`.
- **Behavior:** `accessibilityRole="button"`, `accessibilityLabel={`Continue with ${LABEL[provider]}`}`, `accessibilityState={{disabled}}`. **Provider branch:** `google` → `GoogleGlyph`; `apple` → `Feather command`. Label text = `Google`/`Apple`. `disabled` → opacity + no press. Test both providers + disabled.

### `/home/claude/mitro-artist-app/src/components/shared/StatTile/index.tsx` — **P1**
- **Props:** `icon`, `label`, `value` (req); `unit?`; `unitColor?='textMuted'`; `tint?`; `sub?`; `badge?={label,tone?}`; `loading?`; `style?`.
- **Behavior:** Icon color `tint ?? textSecondary`. **Loading branch:** `loading` → `Skeleton` in the value slot; else `value` `Text` + **unit branch** (`unit` → unit `Text`). **Badge branch:** `badge` → `Badge` (tone `?? 'neutral'`). **Sub branch:** `sub` → caption. Test loading vs loaded, and optional slots.

### `/home/claude/mitro-artist-app/src/components/shared/TextPromptDialog/index.tsx` — **P0** (single-field create/rename form)
- **Props:** `visible`, `title`, `label`, `confirmLabel` (req); `placeholder?`; `maxLength?=60`; `minLength?=2`; `isSaving` (req); `error?`; `onSubmit(value)`, `onCancel` (req).
- **Testable behavior:**
  - **Reset effect:** opening (`visible` true) → `setValue('')`.
  - `canSave = value.trim().length >= minLength`. `maxLength` on input. Test boundary at `minLength`.
  - Submit paths: confirm `Pressable` (`disabled={!canSave || isSaving}`, label `confirmLabel`) → `onSubmit(value.trim())`; **also** `onSubmitEditing = canSave ? () => onSubmit(value.trim()) : undefined` (keyboard return). Test both.
  - Confirm label text `isSaving ? 'Saving…' : confirmLabel`.
  - **Error branch:** `error` → red `Text`.
  - Backdrop (label `"Dismiss"`) no-op while `isSaving`; Cancel `disabled={isSaving}` → `onCancel`.

### `/home/claude/mitro-artist-app/src/components/shared/TimelineRow/index.tsx` — **P1**
- **Props:** `title`, `meta` (req); `value?`; `valueColor?='green'`; `dotColor: string` (req); `last?=false`; `onPress?`.
- **Behavior:** **Rail branch:** `last` → no connecting rail (else rail rendered) + `rowLast` padding. Dot uses `dotColor`. **Value branch:** `value` → right-aligned amount `Text` color `valueColor`. **Pressable branch:** `!onPress` → plain `View`; else `Pressable` (`accessibilityRole="button"`, label `title`, hint `meta`) → `onPress`. Test last-row rail suppression + press.

### `/home/claude/mitro-artist-app/src/components/shared/ToggleRow/index.tsx` — **P1**
- **Props:** `label?`, `description?`, `value: boolean` (req), `onValueChange` (req), `icon?`, `iconTint?`, `disabled?=false`, `style?`.
- **Behavior:** **Icon branch:** `icon` → chip. **Body branch:** rendered only if `label || description` (empty label doesn't stretch the row). `Switch` `value`/`onValueChange`, `disabled`, `accessibilityLabel={label}`, `accessibilityHint={description}`, brand on-tint. Test toggle fires `onValueChange`, and bare (no label/description) omits body.

### `/home/claude/mitro-artist-app/src/components/shared/VerificationBanner/index.tsx` — **P1** (KYC/approval strip)
- **Props:** `banner: VerificationBannerCopy` (`{tone, headline, body, showButton}`), `onPressAction`.
- **Behavior:** `TONE[banner.tone]` (`warn`/`danger`/`info`) → bg/border/rule colors; alert-triangle icon uses `tone.rule`. Renders `headline` + `body` (`getByText`). **Button branch:** `banner.showButton` → `Pressable` (label `"Complete Verification"`, shield-check icon) → `onPressAction`. Test each tone + button gating.

### `/home/claude/mitro-artist-app/src/components/shared/Toast/AppToast.tsx` — **P1** (`PopupToast`, default export)
- **Purpose:** inline-feedback toast (success/error/warning/alert/info) for `react-native-toast-message` config.
- **Props (RNTL):** `ToastConfigParams` — `text1`, `props.type`.
- **Behavior:** `tone = TONE[props?.type ?? 'info']` → icon (per-tone Feather), tint, fill, border. Card `accessibilityRole="alert"`, `accessibilityLiveRegion="polite"`. Renders `text1` in tone color. Close `Pressable` (label `"Dismiss"`) → `RNToast.hide()`. Uses `useSafeAreaInsets`. Test each tone icon + dismiss (mock `RNToast`). Default `type` → `info`.

### `/home/claude/mitro-artist-app/src/components/shared/Toast/index.tsx` — **P1** (`toastConfig`, `NotificationToastHost`)
- **Behavior:**
  - `AppNotificationToast` uses `notificationVisual(props?.type ?? '')` → `{fill, icon, tint}`. Renders `text1` (numberOfLines=1) and `text2` (numberOfLines=2) — **each conditional**.
  - `AppNotificationToastPressable`: whole card is one `Pressable` (`accessibilityRole="button"`) wiring `params.onPress` (tap-anywhere). Test press → `onPress`.
  - `toastConfig` maps `appNotification` → pressable notification toast, `[POPUP_TOAST_TYPE]` → `PopupToast`. Assert both keys present.
  - `NotificationToastHost` mounts `<RNToast config={toastConfig} />`.
- Mock `@utils/notifications`.

---

## `src/components/ui/`

### `/home/claude/mitro-artist-app/src/components/ui/index.ts` — **no direct test** (barrel; re-exports Text, Button, GradientButton, LogoBadge, GoogleGlyph, Input, Card, Badge, Avatar, LucideIcon + types).

### `/home/claude/mitro-artist-app/src/components/ui/Text/index.tsx` — **P0** (every string in the app)
- **Props:** `variant?='body'`, `color?='textPrimary'`, `align?`, `weight?`, plus `RNTextProps`.
- **Behavior:** merges `typography[variant]` + dynamic `{color: colors[color], textAlign?: align, fontWeight?: weight}` + `style`. Renders children. Test: `getByText(children)`; color/variant applied; `align`/`weight` only added when provided.

### `/home/claude/mitro-artist-app/src/components/ui/Button/index.tsx` — **P0**
- **Props (`./types.ts`):** `label` (req); `variant?='primary'`; `size?='md'`; `loading?=false`; `disabled?=false`; `fullWidth?=true`; `leftIcon?`; `rightIcon?`; `style?`; `onPress`; `accessibilityLabel?`; `accessibilityHint?`; + `PressableProps`.
- **Behavior:**
  - `isInactive = disabled || loading`. `handlePress` no-ops when inactive → `onPress` NOT called (test both).
  - `accessibilityRole="button"`, `accessibilityState={{disabled: isInactive, busy: loading}}`, `accessibilityLabel = accessibilityLabel ?? label`.
  - **Loading branch:** `loading` → `ActivityIndicator` (label hidden); else content row.
  - **Variant map:** `VARIANT_BG`/`VARIANT_TEXT` for primary/secondary/ghost/danger; ghost adds border. **Size map:** `SIZE_HEIGHT` sm/md/lg.
  - **Icon branches:** `leftIcon`/`rightIcon` render `Feather`.
  - Test: each variant, disabled/loading suppress press, icons render, custom a11y label wins.

### `/home/claude/mitro-artist-app/src/components/ui/Button/types.ts` — **types only, no test.**

### `/home/claude/mitro-artist-app/src/components/ui/GradientButton/index.tsx` — **P0** (auth CTAs / "Go Live")
- **Props (`./types.ts`):** `label` (req); `gradient?='primary'` (CTA gradient tokens); `textColor?='onPrimary'`; `loading?`; `disabled?`; `leftIcon?`; `rightIcon?`; `style?`; `onPress`; a11y.
- **Behavior:** mirrors `Button` — `isInactive` gate on press; `accessibilityState` busy/disabled; `accessibilityLabel ?? label`; **loading branch** → `ActivityIndicator`; icon branches; gradient stops = `gradients[gradient]`, glow = `gradientGlow[gradient]`. Test press gating, loading, gradient token selection.

### `/home/claude/mitro-artist-app/src/components/ui/GradientButton/types.ts` — **types only, no test.**

### `/home/claude/mitro-artist-app/src/components/ui/Input/index.tsx` — **P0** (forwardRef; auth/settings text field)
- **Props (`./types.ts`):** `label?`, `labelRight?`, `error?`, `hint?`, `isPassword?=false`, `leftIcon?`, `prefix?`, `disabled?=false`, `showCounter?=false`, `maxLength?`, `value?`, `containerStyle?`, `accessibilityHint?`, + `TextInputProps`.
- **Behavior:**
  - **Label branch:** `label` → label row + `labelRight`.
  - Focus state: `handleFocus`/`handleBlur` toggle `focused` (border style) and forward the original handlers.
  - **Leading slot:** `prefix` → prefix text + rule; else `leftIcon` → icon; `prefix` wins.
  - **Password branch:** `isPassword` → initial `hidden=true`, `secureTextEntry={hidden}`, toggle `Pressable` label `hidden ? 'Show password' : 'Hide password'` flips `hidden`. Test toggle changes secureTextEntry + label.
  - **Message row:** `hasError = Boolean(error)` → error `Text` (`accessibilityRole="alert"`, `accessibilityLiveRegion="polite"`); else `hint` → hint `Text`; error wins.
  - **Counter branch:** `showCounter && maxLength` → `"{count}/{maxLength}"` where `count = value?.length ?? 0`.
  - `disabled` → `editable={false}` + faded field + `accessibilityState={{disabled}}`.
  - Test focus border, password toggle, error-over-hint precedence, counter.

### `/home/claude/mitro-artist-app/src/components/ui/Input/types.ts` — **types only, no test.**

### `/home/claude/mitro-artist-app/src/components/ui/Card/index.tsx` — **P1**
- **Props:** `children` (req), `onPress?`, `elevated?=false`, `style?`, `accessibilityLabel?`, `accessibilityHint?`.
- **Behavior:** **Pressable branch:** `!onPress` → plain `View`; else `Pressable` (`accessibilityRole="button"`, label/hint, pressed opacity) → `onPress`. **Elevated branch:** `elevated` → `surfaceStrong` bg. Test pressable vs static + elevated.

### `/home/claude/mitro-artist-app/src/components/ui/Badge/index.tsx` — **P1**
- **Props:** `label` (req), `tone?='neutral'`.
- **Behavior:** `TONE_BG[tone]` bg + `TONE_TEXT[tone]` text color (neutral/primary/success/error/warning), text `weight="600"`. `getByText(label)`. Test tone mapping (5 tones).

### `/home/claude/mitro-artist-app/src/components/ui/Avatar/index.tsx` — **P0**
- **Props:** `name?`, `initials?`, `uri?`, `size?='md'`, `color?=colors.primaryDark`, `badge?`, `style?`.
- **Behavior:**
  - `diameter = SIZE[size]` (sm/md/lg/xl); text variant per size.
  - `label = initials ?? (name ? toInitials(name) : '')`. `toInitials` derives up to 2 uppercase initials from name words. Test: `"Ada Lovelace"` → `"AL"`; single name → 1 letter; explicit `initials` overrides.
  - **Render branches (3-way):** `uri` → `Image` (label = `name`); else `color` set (default is, so this is the usual path) → solid circle + initials; else → brand gradient + initials. **Note:** because `color` defaults to `colors.primaryDark`, the gradient branch only renders when a caller explicitly passes `color={undefined}` — worth documenting in tests.
  - **Badge branch:** `badge` node pinned bottom-right.

### `/home/claude/mitro-artist-app/src/components/ui/GoogleGlyph/index.tsx` — **P2, single smoke test only.** 4-color Google "G" SVG; prop `size?=20`. Zero branches.

### `/home/claude/mitro-artist-app/src/components/ui/LogoBadge/index.tsx` — **P2** (near-trivial; one variant branch)
- **Props:** `variant?='wave'`, `icon?='volume-2'`, `size?=wp(16.7)`, `bare?=false`.
- **Behavior:** `accessibilityRole="image"`, label `"Mitro"`. **Variant branch:** `icon` → muted circle with `Feather`; `wave` → logo tile (+ **`bare` branch** drops background/shadow). Small 2-branch test.

### `/home/claude/mitro-artist-app/src/components/ui/LucideIcon/index.tsx` — **P1** (large `name` switch; smoke-per-name)
- **Props:** `name: LucideIconName` (req, ~50 names), `size?=24`, `color` (req), `strokeWidth?=2`.
- **Behavior:** big chain of `name === '…'` conditionals, each rendering the matching lucide paths inside one `Svg`. Purely presentational per name, but the union is large.
- **Test strategy:** one parametrized smoke test iterating every `LucideIconName` asserting it renders an `Svg` with children (guards against a name with no matching branch → empty `Svg`). **Flag (not a bug, but test-relevant):** an unknown/misspelled `name` renders an empty `Svg` silently — a table-driven test catches any name in the union that lacks a branch.

---

## Summary of real bugs / dead code / suspicious logic (flagged, not fixed)

- **`Skeleton/index.tsx` ~L27–35:** `usePulse` writes `opacity.value = withRepeat(...)` **in the render body** (not in `useEffect`), restarting the animation every render — a reanimated anti-pattern.
- **`history/helpers.ts` L2:** `clampPct(NaN)` → **NaN** (not clamped), yielding `width: "NaN%"` downstream.
- **`ConfirmDialog/index.tsx` L28–30:** `icon` prop accepted but **never rendered** (documented deprecated) — dead prop.
- **`AuthLegal/index.tsx`:** renders an **empty `View`** — intentional placeholder, effectively dead UI.
- **`live/DeliveryCard.tsx` L31–35:** negative `count` renders `rows` with no "(pending)" label (suffix and empty-message branches both false) — minor edge.
- **`ui/Avatar/index.tsx` L72/L100:** `color` defaults to `colors.primaryDark`, so the brand-gradient branch is unreachable unless a caller explicitly passes `color={undefined}` — surprising for anyone expecting the gradient by default.
- **`ui/LucideIcon/index.tsx`:** an unrecognized `name` produces an empty `<Svg>` with no error.

---

**75 files audited, ~295 discrete testable behaviors across P0 (16) / P1 (39) / P2 (12) [+8 non-component barrels/types/tokens/styles], 7 trivial-presentational (single smoke test only).**

---

# Section 6: Profile / KYC / Settings screen modules

# Section 6: Profile / KYC / Settings screen modules

Route wrappers note: none of the six `app/(app)/(tabs)/me/*` route files is a bare re-export — each is the screen **container** (JSX) delegating state/logic to a `use*` hook, EXCEPT `followers.tsx` which still holds its logic inline.

## src/screens/kyc/payouts/schema.ts — P0 (pure, highest-value)
Regexes (exact): `PAN_REGEX=/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/`, `AADHAAR_REGEX=/^\d{12}$/`, `ACCOUNT_NUMBER_REGEX=/^[0-9]{6,20}$/`, `IFSC_REGEX=/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/`.
Validators (all `unchanged`-short-circuit except IFSC): `isPanNumberValid(pan,unchanged)`→`unchanged||PAN_REGEX.test`; examples ("ABCDE1234F",false)→true, ("abcde1234f",false)→true, ("ABCD1234F",false)→false, ("*****1234F",true)→true. `isAadhaarNumberValid`: ("123456789012",false)→true, ("1234 5678 9012",false)→false. `isAccountNumberValid`: ("123456")→true, ("12345")→false, 21-digit→false. `doAccountNumbersMatch(a,b)`→`a===b`. `isIfscValid(ifsc)`: ("SBIN0001234")→true, ("SBIN1001234")→false (5th char must be 0), ("sbin0001234")→true. `isReadOnlyKyc(status,approvalStatus)`→`status==='approved'||approvalStatus==='approved'`.
`buildMissingReasons(flags)` — EXACT ordered strings: (1)!pan→`'Enter a valid PAN number (e.g., ABCDE1234F).'` (2)pan&&!panFront→`'Upload the PAN card front image.'` (3)!aadhaar→`'Enter a valid 12-digit Aadhaar number.'` (4)aadhaar&&!aadhaarFront→`'Upload the Aadhaar front image.'` (5)aadhaar&&!aadhaarBack→`'Upload the Aadhaar back image.'` (6)!account→`'Enter a valid bank account number (6-20 digits).'` (7)account&&!match→`"Account Number and Confirm Account Number don't match."` (8)!ifsc→`'Enter a valid IFSC code (e.g., SBIN0001234 — 4 letters, then 0, then 6 characters).'` (em-dash) (9)!holderName→`"Enter the bank account holder's name."` (10)!bankName→`'Enter the bank name.'`. All-valid→`[]`.
`computeKycState(status,remaining)`: approved→'approved'; else rejected→'rejected'; else remaining===0→'under_review'; else 'incomplete'. `computeReadinessHeadline(kycState,remaining)`: approved→`'KYC verified — payouts are enabled'`; rejected→`'Your KYC was rejected — please review and resubmit'`; under_review→`'All steps complete — under review by our team'`; else→`Finish ${remaining} more step${remaining===1?'':'s'} to unlock payouts`.
⚠️ isReadOnlyKyc gates on approvalStatus too but computeKycState only reads status — approvalStatus-only-approved shows non-approved copy on a locked form.

## src/screens/kyc/payouts/types.ts — P2
Types + `ACCOUNT_TYPE_OPTIONS=[{key:'savings',label:'Savings Account'},{key:'current',label:'Current Account'}]`.

## src/screens/kyc/payouts/useKycPayouts.ts — P0 (central hook)
`useKyc()`, `useBankAccount()`, `useQueryClient()` (context — mock via provider). State: panNumber, aadhaarNumber, bankDetails (7 fields, accountType default 'savings'), originalAccountNumber, 3 doc URIs, 3 *Removed bools, 3 *ViewUrl, saving.
Effects (5): (1) useFocusEffect dep [queryClient,refetch] → refetch()+invalidate kyc.bankAccount(). (2) [kyc?.panNumber] → if truthy setPanNumber — keyed on MASKED string so background refetch won't clobber typing; same for aadhaar. (3) [bank] seeds bankDetails (confirm=account, accountType lowercased default savings)+originalAccountNumber. (4/5/6) [kyc?.*Uploaded,*Uri] → 3 effects fetch signed view URLs via kycApi.getViewUrl(pan_front|aadhaar_front|aadhaar_back) only when uploaded server-side AND no local pick.
Derived: isReadOnly; hasPanFrontDoc=`!!panFrontUri||(!!kyc?.panFrontUploaded && !panFrontRemoved)`; panNumberUnchanged=`!!kyc?.panNumber && panNumber===kyc.panNumber`; panDone=valid&&front; aadhaarDone=valid&&front&&back; **bankDone=`bankDetails.accountHolderName.trim().length>0`** (holder name ONLY); allFieldsValid=AND of 10; steps=[profile done:true, pan, aadhaar, bank]; firstPending=findIndex(!done); remaining=count(!done).
Handlers: `pickImage(setUri,setRemoved)` — perms deny → toast `'Photo access is off. Turn it on in Settings to upload documents.'`; library mediaTypes ['images'] quality 0.8; non-cancel → uri+setRemoved(false). `setBankField(key,value)` merge. `handleSaveAll` — if !allFieldsValid → toast `'Please correctly fill out all PAN, Aadhaar, and Bank details before saving.'` return; else Promise.all of 3 SectionResults: PAN (upload pan_front if picked → savePan {panNumber:panNumber.toUpperCase(),panFrontKey}), Aadhaar (uploads + saveAadhaar {aadhaarNumber as-is}), Bank (saveBankAccount {...bankDetails, ifscCode:ifscCode.toUpperCase()}); invalidate kyc.status()+kyc.bankAccount(); failures.length===0 → toast `'KYC details saved.'` else one toast per failure `${label}: ${message}`; catch getErrorMessage; finally clear saving. Remove handlers null uri+viewUrl, set *Removed=true.
🐞 masked "unchanged" PAN/Aadhaar pass allFieldsValid via unchanged branch → POSTed back (mask sent to server). 🐞 bankDone=holder-name-only → stepper shows Complete, remaining can hit 0 (→under_review "All steps complete") while allFieldsValid still false and Save disabled.

## src/screens/kyc/payouts/styles.ts — P2 (StyleSheet only)
## kyc components: AccItem (P2, `done?'✓ Complete':'Not started'`), Field (P2), Stepper (P2, `current=!done && i===firstPending`), UploadRow (P1: subtitle `pickedName?pickedName:hasDoc?'Document uploaded':'JPEG or PNG, max 5MB'`, button `hasDoc?'Uploaded':'Upload'`), AccountTypeField (P2, `selected=find(key===value)??options[0]`), StateCallout (P1: kycState→{tone,body}, rejected uses `rejectionReason||'Our team found an issue with your submission.'`+optional adminMessage), PayoutReadinessEyebrow (P2, static SVG).
## app/(app)/(tabs)/me/kyc-payouts.tsx — P1 (container). Missing-reasons block title `'Before you can save, please fix:'`. Save `disabled={saving||!allFieldsValid}` label `saving?'Saving…':'Save'`. Input transforms here: PAN `v.toUpperCase()`, Aadhaar/account `v.replace(/\D/g,'')`, IFSC `v.toUpperCase()`.

## src/screens/settings/settings/schema.ts — P0 (pure)
`MIN_ACTIVITIES=6`, `MAX_ACTIVITIES=20`. `canAddSlice(n)`→`n<20`. `canRemoveSlice(n)`→`n>6`. `sanitizeDigits(v)`→`v.replace(/[^0-9]/g,'')`. `clampWeight(weight)`→`Math.min(1000,Math.max(1,Math.trunc(Number(weight)||1)))`: ("5")→5, ("0")→1 (falsy→||1), ("")→1, ("abc")→1, ("1500")→1000, ("3.9")→3, ("-5")→1. `computeTotalWeight(slices)`→`sum(Number(weight)||0)||1`: ([])→1, ([{weight:'2'},{weight:'3'}])→5. `sliceWinPercent(weight,total)`→`((Number(weight)||0)/total*100).toFixed(1)`: ("5",10)→"50.0", ("0",10)→"0.0". `isValidWheelName(name)`→`!!name.trim()`. `isValidWheelPrice(price)`→`Number.isFinite(price)&&price>=0`: (0)→true, (-1)→false, (NaN)→false. `isExistingRewardRow(row)`→`typeof row.id==='string'`.
⚠️ sliceWinPercent uses raw weight; saveWheel persists clampWeight — weight "0" displays 0.0% but saves 1.

## src/screens/settings/settings/types.ts — P2 (RewardRow id string|number, Slice id string)
## src/screens/settings/settings/useSettings.ts — P0
`useRewardMenu()`, `useFunWheel()`. ⚠️ imports `queryClient` singleton directly from @services/queryClient (NOT useQueryClient) — tests must mock the singleton module.
Reward menu: state rewardRows, savingRewards. seedRewardRows maps RewardMenuItem→{id,name:rewardName,price:String(rewardTokens),isActive}. Effect [rewards,seedRewardRows] seeds/re-seeds. addRewardRow appends {id:Date.now(),name:'',price:'',isActive:true}. removeRewardRow filters. updateRewardRow maps. saveRewards: iterate rows, `continue` (silent skip) when `!row.name.trim()||row.price===''`; tokens=Number(price); string id → updateReward(id,{rewardName:trim,rewardTokens,description:null})+setRewardActive(id,isActive); number id → createReward, then if !isActive&&created.data.id → setRewardActive(id,false); success → toast `'Rewards saved successfully!'`+invalidate settings.rewardMenu(); catch getErrorMessage. No min/max.
Fun wheel: state slices, wheelName, wheelPrice, wheelOn, savingWheel, deleteConflict. addSlice: !canAddSlice → toast `'Maximum 20 activities.'` 'info'; else append {id:`temp-${Date.now()}`,activityName:'',weight:'1',isNew:true}. removeSlice: !canRemoveSlice → toast `'Minimum 6 activities required.'` 'info'; else filter. updateSliceName; updateSliceWeight via sanitizeDigits. Effect [wheel] seeds name/price/isActive; activities=wheel.activities??[]; if present maps (weight:String(typeof weight==='number'?weight:1)) else seeds 6 empty temp-i rows. refreshWheel invalidates settings.funWheel(). saveWheel: guard !wheel||savingWheel; validate name (`'Give the wheel a name first.'`), price (`'Enter a valid price per spin.'`); updateFunWheel(id,{wheelName,pricePerSpin}); per slice with non-empty name weight=clampWeight; isNew→createActivity else updateActivity; success → toast `'Fun wheel saved.'`+refresh. toggleWheel(next): optimistic setWheelOn(next); setFunWheelActive; fail → revert+error toast. deleteWheel: deleteFunWheel(id); !success: if res.conflict → setDeleteConflict(res.error) (no toast) else error toast; success → toast `'Fun wheel deleted.'`. turnOffInstead: setWheelOn(false) optimistic; setFunWheelActive(false); fail revert; success → toast `'Fun Wheel turned off — hidden from viewers.'`+setDeleteConflict(null). totalWeight=computeTotalWeight(slices).
## settings components: RewardTableRow (P2, remove btn only when typeof id==='number'), ActivityRow (P2, pct cell `activityName?'${sliceWinPercent}%':'—'`), WheelVisual (P2 static SVG), DeleteWheelConflictModal (P2, title `"Can't Delete This Wheel"`, confirm `confirming?'Turning off…':'Turn Off Instead'`). styles.ts P2.
## app/(app)/(tabs)/me/settings.tsx — P1 (container). Badge `● ON`/`● OFF`. Cancel re-seeds. LearnLink placeholder toast `"Reward menu best-practice guide isn't part of this concept pass yet"`.

## src/screens/profile/edit-profile/schema.ts — P0 (pure, highest value)
`GALLERY_COLS=3`, `GALLERY_GAP=10`. `nationalDigits(v)`→`(v??'').replace(/\D/g,'').slice(-10)`: ("+919876543210")→"9876543210", (null)→"", ("98765")→"98765". `isValidNationalPhone(p)`→`p.length===10`. `isValidOtp(o)`→`o.length===6`. `getPasswordRules(newPassword)`→3 rules: {label:'At least 8 characters',ok:len>=8}, {label:'Contains a number',ok:/\d/.test}, {label:'Contains an uppercase letter',ok:/[A-Z]/.test}: ("Abcdefg1")→[t,t,t], ("abc")→[f,f,f], ("abcdefgh")→[t,f,f]. `basicInfoDone(stageName)`→`!!stageName.trim()`. `pricingDone(priv,grp)`→`Number(priv)>0&&Number(grp)>0`. `skillsDone(list)`→`list.length>0`. `galleryDone(count)`→`count>0`. `computeCompletenessPct(b,p,s,g)`→25 each. **`computeStrengthHeadline(pct,skillsDone,galleryDone)` 5 branches EXACT**: pct>=100→`'Your profile is complete and fan-ready'`; !skills&&!gallery→`'Add skills and a gallery photo to reach 100%'`; !skills→`'Add your skills to boost discovery'`; !gallery→`'Add a gallery photo to reach 100%'`; else→`'Fill in your basic info and pricing to reach 100%'`.
## src/screens/profile/edit-profile/types.ts — P2. colors.ts — P2 (palette C). styles.ts — P2 (~635 lines, ~165 known-dead).
## src/screens/profile/edit-profile/useEditProfile.ts — P0
useProfile/useCategories/usePhotos/useSubcategories(categoryId). 10 draft fields + galleryWidth. useAvatarPicker(); avatarUrl=avatar.avatarUrl??profile?.avatarUrl??null. Mutations update/category/stageName/upload/delete photo. Tile math: `tile=galleryWidth>0?floor((galleryWidth-GAP*(COLS-1))/COLS):0` (320→100); tileSize=tile>0?{width,height}:null. Effect [profile] seeds all; languages/skills joined ', '; prices .toString()??''. handleSelectCategory(id): if id!==categoryId clears subcategoryId, then set. isSaving=changeStageName||updateCategory||updateProfile isPending. handleSave: changeStageName only if stageName!==profile.stageName; updateCategory only if categoryId (subcategoryId||null); always updateProfile with languages/skills split(',')/trim/filter, prices parseInt||0; success toast `'Profile saved successfully.'`. handleAddPhoto: guard isPending; perms deny toast `'Photo access is off. Turn it on in Settings to add photos.'`; pick quality 0.8; upload → toast `'Photo added to gallery.'`. handleDeletePhoto(id): `Alert.alert('Delete photo?', "Are you sure you want to delete this photo? This can't be undone.", [Cancel, Delete→deletePhoto→toast 'Photo deleted.'])`. skillList=useMemo(skills.split(',').map(trim).filter(Boolean)).
## src/screens/profile/edit-profile/useMobileNumberSection.ts — P1
State phone(init nationalDigits(profile?.phone)), phoneOtpStep, phoneOtp. Effect [profile] re-syncs — eslint-disable exhaustive-deps. unchanged=`phone.length===10 && phone===nationalDigits(profile?.phone)`. handleSendPhoneOtp: !valid → toast `'Enter a valid 10-digit mobile number.'`; else sendOtp({newPhone:phone}) (national only, NO +91), toast `'OTP sent to new mobile number.'`. handleVerifyPhoneOtp: !isValidOtp → silent return; else verify, clear, toast `'Phone number updated successfully.'`. onChangePhone `v.replace(/\D/g,'').slice(0,10)`.
## src/screens/profile/edit-profile/useChangePasswordSection.ts — P1
State open, 3 pw fields, 3 show toggles. passRules=getPasswordRules(newPassword). handleUpdatePassword: early return if `!old||!new||new!==confirm` (does NOT re-check passRules — relies on button disabled); success → resetFields+toast `'Password updated successfully.'`. disabled=`isPending||!old||!new||new!==confirm||!passRules.every(ok)`.
## edit-profile components — P2 mostly: Field, Callout (tone→bg/border/icon), CategoryPicker/SubCategoryPicker (SubCat disabled=`!categoryId||(isLoading&&subcategories.length===0)`, placeholder `!categoryId?'Select Primary Category first':isLoading?'Loading…':'Select Sub Category'`), ProfilePictureSection (initials `stageName?substring(0,2).toUpperCase():'AR'`), ProfileStrengthRing (offset=CIRC*(1-pct/100)), MobileNumberSection/ChangePasswordSection (thin wrappers over hooks).
## app/(app)/(tabs)/me/edit-profile.tsx — P1 (container). stepChip renders ✓-prefixed done labels. Cancel toast `'Changes discarded'` (no real discard). Learn links toast `"Discovery ranking guide isn't part of this concept pass yet"`. Gallery grid onLayout→setGalleryWidth.

## src/screens/profile/me/meRows.ts — P1
ACCOUNT: Profile, Followers (sub 'Top supporters' overridden), Settings, KYC & Payouts (pill at render). ⚠️ Photos row commented out (backend reuses one key per artist → overwrites). ACTIVITY: Transaction History → /business/transactions. Assert exact route strings+titles.
## src/screens/profile/me/types.ts — P2 (Href still lists /me/photos, /me/messages).
## src/screens/profile/me/useMeScreen.ts — P1
profile/earnings/followers/broadcast-summary; logout/unreadCount from stores. isApproved=`profile?.approvalStatus==='approved'`. **kycPill IIFE switch**: approved→undefined, pending→'PENDING', rejected→'REJECTED', default→'REQUIRED'. stats: Followers compactCount(totalFollowers)||'—', Earned formatTokens(walletTokens), Total formatTokens(earnings.totalTokens), Shows String(bcSummary.totalShows). accountRows: Followers sub `${topSupporterCount??0} top supporters`, KYC pill kycPill. confirmLogout: clears flag, logout().then(router.replace('/(auth)/login')). navigateTo→router.push; goToNotifications→push.
## src/screens/profile/me/components/MeRow.tsx — P2. app/(app)/(tabs)/me/index.tsx — P1 (container). Badge `isApproved?'READY':undefined`; subtext `isApproved?'Verified creator':titleCase(approvalStatus??'Pending')`+`· categoryName`. No retry on profile error.

## src/screens/profile/followers/formatters.ts — P0 (pure)
RADIUS=14, RADIUS_LG=18, 4 verbatim tooltip strings. **BADGE_LABEL** (followers-side, diverges from search): new_follower:'New follower', top_supporter:'Top supporter', session_regular:'Session regular', returning_fan:'Returning fan', follower:'Follower'. BADGE_TINT per-badge {ink,fill}. followerInitials(name): ("Ann Marie Lee")→"AM", ("cher")→"C". **formatFollowedAgo(iso)** (uses Date.now — fake timers): diffDays<=0→'Followed today', ===1→'Followed yesterday', <30→`Followed ${d} days ago`, months<12→`Followed ${m} month${m===1?'':'s'} ago`, else `Followed ${y} year${...}s ago`. activityText(f): interactionCount>0→`${grouped(totalCoinsSpent)} coins · ${interactionCount} interaction${==1?'':'s'}` else formatFollowedAgo(followedAtUtc).
## src/screens/profile/followers/components/FollowerCard.tsx — P2. app/(app)/(tabs)/me/followers.tsx — P1 (container, LEAST refactored — logic still INLINE: useFollowers() directly, messageFollower nav, CardSkeleton, pulse copy `newFollowersThisWeek===1?'':'s'`, empty "No followers yet…"). No screen hook — test via integration.

## src/screens/profile/messages/formatters.ts — P0 (pure)
AVATAR_COLORS=[pink,cyan,gold]. colorFor(id): sum charCodeAt mod 3 → color (deterministic). initialsFor(name): 0 parts→'?', 1→parts[0].slice(0,2).upper, else (p0[0]+p1[0]).upper: ("")→'?', ("cher")→'CH', ("Ann Lee")→'AL'. **relativeTime(iso)** (Date.now — fake timers): min<1→'now', min<60→`${min}m`, hr<24→`${hr}h`, day<7→`${day}d`, else toLocaleDateString([],{day:'numeric',month:'short'}).
## src/screens/profile/messages/useMessageSettings.ts — P1
useConversations()+useProfile(); useQueryClient() (context). conversations=data??[]; unread=reduce(n+(unreadCount??0)). acceptsMessages=`!!profile?.acceptsPrivateMessages`. Prefill effect [profile?.privateMessagePrice] only sets when truthy. saveSettings(nextAccepts): guard saving; priceValue=`price?Number(price):undefined`; privateMessageApi.setSettings(nextAccepts,priceValue); !success → error toast, NO optimistic flip; success → toast `nextAccepts?'Private messages turned on.':'Private messages turned off.'`, close, invalidateQueries(profile.me()) not awaited. openThread(c) → push chat-thread with userId/name('Fan' fallback)/avatarUrl(''). closeSettings no-op while saving.
## messages components — P2: ConversationRow (preview `${lastMessageSenderType==='artist'?'You: ':''}${lastMessageText??''}`, name 'Fan' fallback), MessageSettingsModal (CTA `saving?'Saving...':acceptsMessages?'Turn off':'Turn on'`), StatusPill (`on?'ON':'OFF'`). app/(app)/(tabs)/me/messages.tsx — P1 (container). Save calls saveSettings(!acceptsMessages).

## Adjacent (dependencies pulled in during audit)
- src/screens/profile/change-password/schema.ts — P0 zod: oldPassword min1 `'Enter your current password'`; newPassword authPasswordSchema min8 `'Password must be at least 8 characters'`; refine new===confirm `'Passwords do not match'` path confirmPassword; refine old!==new `'Choose a password you haven't used here before'` (curly apostrophe) path newPassword.
- change-password/useChangePassword.ts — P1: zodResolver, mode onChange; onSubmit → changePassword, log, setDone(true), setTimeout(router.back,900); catch setSubmitError.
- change-phone/useChangePhone.ts — P1: canSendCode=mobileSchema.safeParse(phone).success; cooldown effect; requestCode → sendOtp+setOtpHint+setCooldownSec(TIMING.otpResendCooldownSec)+stage 'code'; confirm(value) → verifyOtp, setDone, setTimeout(back,900); auto-submit effect fires confirm once per 6-digit code (submittedFor ref).
- profile/settings/schema.ts — P0 zod (SEPARATE from settings/settings): SETTINGS_LIMITS {bio:160,aboutMe:500,rate:{1,9999}}; rateField trim/min1 'Enter a rate'/regex /^\d+$/ 'Numbers only'/refine 1..9999 'Between 1 and 9999'; settingsSchema stageName(stageNameSchema), bio max160 'Keep your bio under 160 characters', aboutMe max500 'Keep this under 500 characters', privateRate/groupRate rateField.
- profile/settings/useSettings.ts — P1 (react-hook-form): reset(toForm(profile)) on [profile]; onSubmit nextStageName=trim.lower, renaming check, always updateProfile, changeStageName if renaming, setSaved.
- profile/photos/usePhotoGallery.ts — P1: usePhotos; addPhoto perms deny → error PERMISSION_DENIED 'Photo access is off. Turn it on in Settings to add photos.'; confirmUpload guard !pendingUri; confirmDelete optimistic close then remove.

## Supporting @utils helpers (load-bearing for assertions)
compactCount(v): <1000→String; <10000→"x.xk" (lowercase, strips .0); <1000000→"x.xK"; else "x.xM": (940)→"940", (1240)→"1.2k", (48200)→"48.2K". formatTokens(v)→`${compactCount(v)} coins`. grouped(v)→Math.round with , thousands: (18552)→"18,552". titleCase(v)→first upper.

## Consolidated flags (Section 6): masked-value POST (kyc); isReadOnly/computeKycState divergence; bankDone holder-only; settings queryClient singleton import; sliceWinPercent raw vs clampWeight persist; clampWeight("0")===1; saveRewards silent skip; messages invalidate not awaited; edit-profile ~165 dead styles; me Photos row commented out; followers BADGE divergence; followers.tsx logic still inline.

---

# Section 7: Calls / Business / Chat-thread / Room screen modules

I have everything needed. Here is the complete audit.

---

# Mitro Artist App — Audit: calls / business / chat / room modules

**Scope & method.** Every file under `src/screens/{calls,business,chat-thread,live-broadcast-room,group-call-room,private-call-room}` was read in full (70 files). Route wrappers were confirmed. Priority: **P0** = the 3 room-session hooks + `privateCalls` + `scheduleSession` + `earnings`; **P1** = chat-thread, the two history screens, transactions; **P2** = trivial presentational sub-components.

**Route-wrapper reality check (important, differs from the brief).**
- The four **modal** wrappers ARE logic-free 1-liners: each is exactly `export { default } from '@screens/.../XxxScreen';` (`chat-thread`, `live-broadcast-room`, `group-call-room`, `private-call-room`). ✔
- The six **tabs** wrappers (`calls/private-calls.tsx` 666 L, `calls/schedule-session.tsx` 589 L, `calls/broadcast-history.tsx` 239 L, `calls/group-call-history.tsx` 200 L, `business/index.tsx` 553 L, `business/transactions.tsx` 321 L) are **NOT 1-line re-exports** — they are the full JSX screen bodies that consume the hooks. They are logic-free in the sense that matters (verified: zero `useState/useEffect/useMemo/useCallback/reduce`, zero API/toast/router/navigation calls inside them — grep returned nothing), but they hold all the presentational layout rather than delegating to a `XxxScreen.tsx`. So the split for the tabs screens is "hook + inline JSX in the route file", whereas the modal screens are "hook + `XxxScreen.tsx` + 1-line route". All business logic lives in the hooks either way. The test surface conclusion (hooks + `format.ts`) holds.

---

## SCREEN: calls / privateCalls  (P0)

### `src/screens/calls/privateCalls/format.ts`  — P0, pure
Pure helpers + tone maps. **Exhaustive:**

- **Constants:** `COUNTDOWN_TICK_MS = 1000`, `REQUEST_POLL_MS = 8000`, `HISTORY_PAGE_SIZE = 20`.
- **`secondsUntil(iso)`** → `Math.max(0, Math.round((new Date(iso) - Date.now())/1000))`. Never negative. Test with a mocked `Date.now()`: future +5000ms → `5`; past → `0`; rounds (2400ms→`2`, 2600ms→`3`).
- **`formatCallDuration(acceptedAtUtc, endedAtUtc): string | null`**:
  - either arg null → `null`.
  - `ms = endedAt - acceptedAt`; if `!Number.isFinite(ms) || ms <= 0` → `null` (equal timestamps → null; ended before accepted → null).
  - `totalSeconds = round(ms/1000)`; `hours=floor(ts/3600)`, `minutes=floor((ts%3600)/60)`, `seconds=ts%60`.
  - `hours>0` → `"{h}h {m}m"` (seconds dropped). e.g. 3900s → `"1h 5m"`.
  - else `minutes>0` → `"{m}m {s}s"`. e.g. 754s → `"12m 34s"`.
  - else → `"{s}s"`. e.g. 45s → `"45s"`. Exactly 0 excluded (ms<=0 guard) — so smallest is `"1s"`.
- **`historyStatusMeta(status, endReason): {label, tone}`** — evaluated top-down, **status wins before the endReason switch**:
  - `status==='failed'` → `{Failed, bad}`.
  - `status==='cancelled'` → `{Cancelled, neutral}`.
  - `status==='terminated'` → `endReason==='admin_terminated'` ? `{"Ended by admin", neutral}` : `{Terminated, bad}`. **NB:** terminated+`platform_ended` still returns `{Terminated, bad}` (returns before switch).
  - otherwise `switch(endReason)`:
    - `user_ended` | `artist_ended` → `{"Ended normally", ok}`
    - `insufficient_balance` → `{"Low balance", warn}`
    - `user_reconnect_timeout` | `artist_reconnect_timeout` | `both_disconnected` → `{"Connection dropped", warn}`
    - `join_timeout` → `{"Never connected", bad}`
    - `technical_failure` | `token_failure` → `{"Technical issue", bad}`
    - `admin_terminated` → `{"Ended by admin", neutral}`
    - `platform_ended` → `{"Ended by platform", neutral}`
    - `default` → `{ label: status[0].toUpperCase()+status.slice(1), tone: neutral }` (e.g. status `"completed"`, endReason `null`/unknown → `{"Completed", neutral}`; empty string status → `charAt(0)`='' so label `""`).
- **`TONE_FILL`/`TONE_INK`**: `Record<HistoryTone,string>` mapping ok/warn/bad/neutral to webColors — assert the 4 keys resolve (constant maps).

### `src/screens/calls/privateCalls/types.ts` — P0, types only
`UsePrivateCallsResult` interface (return shape of the hook). No runtime.

### `src/screens/calls/privateCalls/usePrivateCalls.ts` — P0, hook
Return shape = `UsePrivateCallsResult`. State groups: settings (`acceptsPrivateCalls`, `pricePerMinute`, `isSavingSettings`, `isLoadingSettings`), requests (`requests`, `busyRequestId`, `forceTick`), `activeCallId`, history (`history`, `isLoadingHistory`, `isLoadingMoreHistory`, `hasMoreHistory`), refs (`historyRef`, `loadingMoreRef`).

**Effects (4):**
1. **Countdown tick** — `setInterval(forceTick+1, 1000)`; cleanup `clearInterval`. Deps `[]`. Only forces re-render (drives `secondsUntil` labels).
2. **Profile load** — `profileApi.getProfile()`; on `success` sets `acceptsPrivateCalls = !!acceptsPrivateCalls`, and if `privateShowTokenPerMinute` is a number → `setPricePerMinute(String(...))`; always `setIsLoadingSettings(false)`. `cancelled` guard. Deps `[]`.
3. **Active-session probe** — `privateCallApi.getActive()`; on `success && hasActiveSession && privateCallId` → `setActiveCallId(id)` + `activePrivateCallStore.savePointer(id, {userId, ratePerMin: pricePerMinuteSnapshot})`; else `setActiveCallId(null)` + `activePrivateCallStore.clear()`. `cancelled` guard. Deps `[]`.
4. **Requests poll** — immediate `refreshRequests()` then `setInterval(refreshRequests, 8000)`; cleanup clears. Deps `[refreshRequests]`. `refreshRequests` = `getRequests()` → on success `setRequests(data)`.
5. **History initial** — `refreshHistory()` on mount (deps `[refreshHistory]`). `refreshHistory`: `setIsLoadingHistory(true)`, `getHistory(20, 0)`, on success set `historyRef.current`, `history`, `hasMoreHistory = data.length===20`; always `setIsLoadingHistory(false)`.

**Handlers:**
- **`loadMoreHistory`** — guards `isLoadingHistory || loadingMoreRef.current || !hasMoreHistory` → return. Sets `loadingMoreRef=true`, `isLoadingMoreHistory=true`, `getHistory(20, historyRef.length)`; on success appends to `historyRef` + `setHistory`, `hasMoreHistory = data.length===20`; clears flags. `handleHistoryEndReached` → `void loadMoreHistory()`.
- **`handleSaveSettings`** — `next = !acceptsPrivateCalls`; `trimmed = price.trim()`; `price = trimmed==='' ? undefined : Number(trimmed)`. **Validation:** if `price!==undefined && (!isFinite(price) || price<=0)` → `showToast('Enter a price per minute greater than 0.','error')` + return (no save). Else `setIsSavingSettings(true)`, `setSettings(next, price)`; on success `setAcceptsPrivateCalls(next)` + success toast; on failure error toast; always clear saving. ⚠ **See Bug #5 — this always flips availability.**
- **`acceptRequest(req)`** — `setBusyRequestId(req.requestId)`, `acceptRequest(requestId)`; on success removes req from list + `router.push('/(app)/(modals)/private-call-room', {connection: JSON.stringify(res.data), fanName: req.userDisplayName, ratePerMin: String(req.pricePerMinuteSnapshot)})`; on failure error toast; always clear busy.
- **`declineRequest(req)`** — `setBusyRequestId`, `rejectRequest(requestId, 'Not available right now')`, then **unconditionally** filters req out of list, clears busy. ⚠ **Bug #4 — no success check / no rollback.**

### `components/HistoryRow.tsx` / `PendingRequestRow.tsx` — P2
`HistoryRow({item, last})`: renders `historyStatusMeta` label/tone, `formatCallDuration`, `toLocaleString('en-US')` date (or `"never accepted"`), and net coins `(totalCoinsCharged - totalRefundedCoins).toLocaleString()`. `HistorySkeletonRow` = static skeleton. `PendingRequestRow({request, busy, onAccept, onDecline})`: shows `secondsUntil(expiresAtUtc)`, disables Accept when `busy || secsLeft===0`, spinner while busy. Presentational; test via the formatters above.

---

## SCREEN: calls / scheduleSession  (P0)

### `src/screens/calls/scheduleSession/format.ts` — P0, pure
- **`pad2(n)`** → `String(n).padStart(2,'0')`. `5`→`"05"`, `12`→`"12"`, `123`→`"123"`.
- **`maskTime(raw)`** — strip non-digits, take first 4. `len<=2` → digits as-is; else `"{first2}:{rest}"`. Examples: `""`→`""`; `"9"`→`"9"`; `"93"`→`"93"`; `"930"`→`"9:30"`; `"0930"`→`"09:30"`; `"09:30"`→`"09:30"`; `"12345"`→`"12:34"`; `"ab12cd34"`→`"12:34"`.
- **`normalizeTime(raw)`** — strip non-digits; `digits.length < 3` → `""` (so `"9"`,`"93"`→`""`). Else `padStart(4,'0')`; `hours=min(23, parseInt(slice0,2))`, `minutes=min(59, parseInt(slice2,4))`; return `"{pad2 h}:{pad2 m}"`. Examples: `"930"`→`"09:30"`; `"0930"`→`"09:30"`; `"2599"`→`"23:59"` (clamped); `"1234"`→`"12:34"`; `"0000"`→`"00:00"`; `"999"`→`"09:99"`→ clamp minutes to 59 → `"09:59"` (padStart→`"0999"`, h=`09`, m=min(59,99)=59).

### `src/screens/calls/scheduleSession/types.ts` — P0, types
`FeatherIconName`, `ChecklistItem{label,done}`, `UseScheduleSessionResult`.

### `src/screens/calls/scheduleSession/webTokens.ts` — P2
Pure color/geometry constants (`web`, `HOT_STOPS`, `CARD_SHEEN`, `SIDE_SHEEN`, diag/sheen vectors). No logic.

### `src/screens/calls/scheduleSession/useScheduleSession.ts` — P0, hook
State: `title, description, scheduledTime, duration('30'), seats('5'), coinPrice('8'), highlightedPrice(''), refundThreshold(''), mode('video'), requiresApproval(false), creating(false), checkingActive(true)`.

**Effect — active-call guard** (deps `[router]`): `activeGroupCallStore.get()`; if `active` → toast `'You already have a group call running — taking you back to it.'` + `router.replace('/(app)/(modals)/group-call-room')` + return (leaves `checkingActive=true`, form stays blocked). Else `setCheckingActive(false)`. `cancelled` guard.

**Derived (useMemo/plain):**
- `{todayIso, todayLabel}` (memo `[]`): `todayIso = "YYYY-MM-DD"`, `todayLabel = "MM/DD/YYYY"` from `new Date()` local parts via `pad2`.
- `seatsNum = parseInt(seats,10)||0`, `priceNum = parseInt(coinPrice,10)||0`.
- `potential` (memo `[seatsNum,priceNum]`) = `(seatsNum*priceNum).toLocaleString('en-US')`.
- `highlightedNum = parseInt(highlightedPrice,10)`, `refundNum = parseInt(refundThreshold,10)`.
- `hasTitle = title.trim().length>0`; `hasHighlighted = isFinite(highlightedNum) && >0`; `hasRefund = isFinite(refundNum) && >=0` (0 valid).
- `missing` = filtered list of `['session title','highlighted message price','refund threshold']` for the unmet ones, in that order.
- `canSchedule = missing.length===0 && seatsNum>0 && priceNum>=0`.
- `checklist` (7 items): `Title and topic`=hasTitle; `Date and time (optional)`=**always true**; `Seat limit`=seatsNum>0; `Coin price`=priceNum>=0; `Highlighted message price`=hasHighlighted; `Refund threshold`=hasRefund; `Approval preference set`=**always true**.

**`schedule()`** (async, sequential validation with toasts, each returns early):
1. `creating` → return.
2. `!title.trim()` → toast `'Session title is required.'`.
3. `time = normalizeTime(scheduledTime)`; if truthy → `startsAt = new Date(`${todayIso}T${time}:00`)`; if `startsAt < Date.now()` → toast `"Scheduled date and time can't be in the past."`; else `scheduledStartAtUtc = startsAt.toISOString()`. (empty time → `scheduledStartAtUtc=null`.)
4. `seatsNum<=0` → toast `'Available seats must be greater than 0.'`.
5. `priceNum<0` → toast `'Coin price cannot be negative.'`.
6. `!hasHighlighted` → toast `'Highlighted message price is required.'`.
7. `!hasRefund` → toast `'Refund threshold is required.'`.
8. `setCreating(true)`; `groupCallApi.create({title:trim, description: trim||undefined, maxParticipants:seatsNum, entryPrice:priceNum, requiresApproval, audioOrVideoMode:mode, scheduledStartAtUtc, expectedDurationMinutes: parseInt(duration,10)||undefined})`; `setCreating(false)`.
9. `!res.success` → error toast + return.
10. `groupCallId = res.data.groupCallId`; `Promise.all([setHighlightedMessagePrice(id, highlightedNum), setRefundThreshold(id, refundNum)])`; if either fails → info toast `'Session created, but the pin price / refund threshold could not be saved.'` (non-fatal).
11. `activeGroupCallStore.saveDraft({groupCallId, title:trim, maxParticipants:seatsNum, entryPrice:priceNum, requiresApproval, audioOrVideoMode:mode})`.
12. `router.replace('/(app)/(modals)/group-call-room', {groupCallId, sessionConfig: JSON.stringify({title:trim, maxParticipants:seatsNum, entryPrice:priceNum, requiresApproval, mode})})`. ⚠ **See Bug #6 (draft-then-rejoin interaction).**

### `components/{BoxInput,Field,GschedSwitch,ModeButton}.tsx` — P2
All `memo`'d presentational: `BoxInput` (labeled numeric box), `Field` (labeled input wrapper), `GschedSwitch` (on/off track), `ModeButton` (video/audio toggle button). No logic.

---

## SCREEN: calls / broadcastHistory  (P1)

### `src/screens/calls/broadcastHistory/format.ts` — P1, pure
- `PAGE_SIZE = 20`.
- **`analyticsTiles(a: BroadcastAnalytics): Tile[]`** — returns exactly 5 tiles in order `chat, highlighted, rewards, funwheel, viewers`. `maxTk = Math.max(highlightedMessageTokens, rewardOrderTokens, funWheelSpinTokens, 1)`; `tokenBar(t)=min(100, round(t/maxTk*100))`.
  - **chat**: value `grouped(chatMessageCount)`, `barPct = min(100, round(chatMessageCount/5*100))` ⚠ (hardcoded /5 scaling — 5 msgs = full bar), caption `'sent'`.
  - **highlighted**: value `grouped(highlightedMessageCount)`, `barPct=tokenBar(highlightedMessageTokens)`, caption `"{grouped tokens} coins"`.
  - **rewards**: value `grouped(rewardOrderCount)`, `barPct=tokenBar(rewardOrderTokens)`, caption `"{tokens} coins"`.
  - **funwheel**: value `grouped(funWheelSpinCount)`, `barPct=tokenBar(funWheelSpinTokens)`, caption `"{tokens} coins"`.
  - **viewers**: value `grouped(totalUniqueViewers)`, `barPct=min(100, round(totalUniqueViewers/max(peakViewerCount,1)*100))`, caption `"{peakViewerCount} at peak"`.
  - Each tile also carries fixed `icon/color/label/hint` strings (assert exact icon+label per key).
- **`broadcastMetaLine(item)`** = `"{startedAtUtc ? webDateTime : 'Unknown start'} · {webDuration(durationSeconds)} · Peak {peakViewerCount} viewers · {totalUniqueViewers} total · {status}{endReason ? ` (${endReason})` : ''}"`.
  - Dependencies (test with mocked locale): `webDuration(s)` = `s==null?'—':`${floor(s/60)}m ${s%60}s``; `webDateTime(iso)` = `"{M/D/YYYY}, {h:MM AP}"` (invalid date → `""`); `grouped(n)` = round + thousands commas.

### `src/screens/calls/broadcastHistory/useBroadcastHistory.ts` — P1, hook
Thin composition over React-Query hooks. Re-exports `useBroadcastHistoryPaged(pageSize)`, `useBroadcastHistorySummary()`, `useBroadcastAnalytics(broadcastId|null)`.
`useBroadcastHistory(pageSize)`: state `expandedId`, `fulfillingId`. Wires paged history (`history = useMemo(pages.flat() ?? [])`), summary, `usePendingRewardOrders()`, analytics gated on `expandedId`, `useFulfillRewardOrderMutation()`.
- **`toggleAnalytics(id)`** — `setExpandedId(cur => cur===id ? null : id)` (accordion).
- **`handleFulfill(order)`** — `setFulfillingId(order.id)`; `try mutateAsync(order.id)` → success toast `result.message ?? `Marked "${rewardName}" as delivered to ${buyerDisplayName}.``; `catch` → `showToast(getErrorMessage(e),'error')`; `finally setFulfillingId(null)`.
- `hasPending = !loadingOrders && !!pendingOrders && length>0`.

### `components/{BroadcastRow,PendingRewardsCard,AnalyticsSkeleton,ListSkeleton}.tsx` — P2
`BroadcastRow({item,isOpen,analytics,loadingAnalytics,onToggle})` renders `broadcastMetaLine` + `analyticsTiles` when open. `PendingRewardsCard({pendingOrders,fulfillingId,onFulfill})` lists pending orders with per-row spinner. Skeletons static. Presentational.

---

## SCREEN: calls / groupCallHistory  (P1)

### `src/screens/calls/groupCallHistory/format.ts` — P1, pure
- `PAGE_SIZE = 20`.
- `FILTERS = [{all,'All'},{ended,'Ended'},{cancelled,'Cancelled'}]` (order-significant).
- **`statusChip(status)`** → returns a StyleSheet style: `cancelled|failed` → cancelled chip; `terminated` → terminated chip; **anything else → ended chip** (default fallback). **`statusChipInk(status)`** mirrors the same 3-way. (Test by identity: `statusChip('failed')===statusChip('cancelled')`, `statusChip('ended')===statusChip('anything')`.)
- **`groupCallMetaLine(item)`** = `"{startedAtUtc ? webDateTime : 'never started'} · {webDuration(durationSeconds)}"`.
- **`earningsHint(item)`** = ``You earned {grouped(totalRevenueTokens)} coins for this call based on duration ({webDuration(durationSeconds)}) and peak participants ({grouped(peakParticipantCount)}).``
- **`revenueBreakdownRows(analytics): RevenueBreakdownRow[]`** — exactly 3 rows in order **Highlighted, Rewards, Fun wheel** from `highlightedMessageRevenueTokens`, `rewardRevenueTokens`, `funWheelRevenueTokens`. Each: `label`, fixed `hint`, `amount = "{grouped(value)} coins"`, `pct = totalRevenueTokens>0 ? value/total*100 : 0` (**zero-guard** → all pct 0 when total 0). Test: total 0 → every `pct===0`; total 100, value 25 → `pct===25`; `amount` uses grouped commas (`1000`→`"1,000 coins"`).

### `src/screens/calls/groupCallHistory/useGroupCallHistory.ts` — P1, hook
Re-exports `useGroupCallHistoryPaged(filter,pageSize)`, `useGroupCallHistorySummary(filter)`, `useGroupCallAnalytics(id|null)`. `useGroupCallHistory(pageSize)`: state `filter('all')`, `expandedId`. `history = useMemo(pages.flat() ?? [])`. Summary + analytics (gated on expandedId) keyed by filter. `toggleExpand(id)` accordion. `isLoading = loadingHistory||loadingSummary`; `isEmpty = !history || length===0`. Filter is part of the query key ⇒ switching tabs refetches a fresh page walk (documented). `setFilter` exposed.

### `components/{GroupCallRow,AnalyticsDetail,AnalyticsSkeleton,ListSkeleton}.tsx` — P2
`GroupCallRow({item,isOpen,analytics,loadingAnalytics,onToggle})` uses `statusChip`/`groupCallMetaLine`/`earningsHint`. `AnalyticsDetail({analytics,item})` renders `revenueBreakdownRows`. Skeletons static. Presentational.

---

## SCREEN: business / earnings  (P0)

### `src/screens/business/earnings/format.ts` — P0, pure  ⭐ highest-value pure module here
- **`SOURCE_PIE_COLORS`** = 8 hex colors (verbatim web).
- **`pieColor(i)`** = `SOURCE_PIE_COLORS[i % 8]` — **cycles past 8** (i=8→`#ff3fad`, i=9→`#33e6ff`, i=15→`#f5d442`). Negative i would return `undefined` (not guarded; callers use array index ≥0).
- **`pieSegments(sources, totalTokens, r=82): PieSegment[]`** — accumulator geometry:
  - `circumference = 2π·r` (r=82 → ~515.221).
  - `gap = sources.length > 1 ? 7 : 0` (single source → no gap).
  - `offsetAcc` starts 0. For each source i:
    - `pct = totalTokens>0 ? tokens/totalTokens : 0` (**zero/negative total → every pct 0**).
    - `rawLen = pct·circumference`.
    - `len = max(rawLen - gap, pct>0 ? 1 : 0)` — positive slices never shrink below 1; zero slices → 0.
    - `dashoffset = -offsetAcc` (negative running offset).
    - `offsetAcc += rawLen` (**accumulates rawLen, NOT len** — gaps don't accumulate).
    - segment = `{sourceType, color: pieColor(i), len, gapRemainder: circumference - len, dashoffset}`.
  - Test cases: `totalTokens=0` → all `pct→len` degenerate: `len = max(-gap, 0) = 0`, `gapRemainder = circumference`, `dashoffset` all `-0/0`. Single source, total 100, tokens 100 → gap 0, rawLen=circ, len=circ, dashoffset 0. Two sources 50/50 → gap 7, each len=circ/2−7, first dashoffset 0, second dashoffset=−circ/2. 9 sources → 9th reuses `pieColor(8)=colors[0]`.
- **`legendPct(tokens, totalTokens)`** = `totalTokens>0 ? round(tokens/total*100) : 0`. (25/100→25; 0-total→0.)

### `src/screens/business/earnings/useEarningsDashboard.ts` — P0, hook (thin)
Wraps `useEarningsSummary()` → `{data, isLoading, error, refetch}`. No local state/logic; test = passthrough + return-shape.

### `components/` — P2 mostly, one with inline logic
- **`SourcePieChart({sources,totalTokens})`** — renders `pieSegments` + `legendPct`. Logic already in format.ts.
- **`TrendChart({points})`** — ⚠ **inline logic not extracted**: `data = points.length>0 ? points : [{date:now, tokens:0}]`; `peak = Math.max(0, ...tokens)`; bar height `peak>0 ? `${max(4, tokens/peak*100)}%` : 4`. Worth a small height/empty test (P2). Uses `grouped`, `shortWeekday`.
- **`StatTile`** exports `STAT_ACCENT` record (accent→color map) — constant, assert keys. Props `{accent,icon,label,value,chip,help}`.
- `GlowOverlay`, `HelpTip({text,color})`, `LoadingBody`, `TwoColGrid({gap,children})` — trivial presentational.

---

## SCREEN: business / transactions  (P1)

### `src/screens/business/transactions/format.ts` — P1, pure
- **`txIconType(sourceType)`**: `reaction`→`'reaction'`; `fun_wheel_spin`→`'wheel'`; `group_call_entry`→`'entry'`; `highlighted_message`→`'highlighted'`; **default → `'reward'`**.
- **`TX_ICON`** (TxIconType→lucide): reaction=`heart`, wheel=`clock-3`, entry=`video`, highlighted=`star`, reward=`check`.
- **`TX_TINT`** (TxIconType→`{bg,ink}`) — 5 fixed pairs.
- **`txBadgeClass(status)`**: `pending`→`'pending'`; `refunded|reversed`→`'refunded'`; **else → `'settled'`** (so `available`, `paid_out`, anything else → settled).
- **`FILTERS`** = `all/pending/settled/refunded` (order). `PAGE_SIZE = 25`.

### `src/screens/business/transactions/types.ts` — P1, types (`TxFilter`,`TxIconType`,`TxBadge`).

### `src/screens/business/transactions/useTransactions.ts` — P1, hook
State `filter('all')`. Paged via `useEarningsTransactionsPaged(pageSize)`; `transactions = useMemo(pages.flat() ?? [])`. **Summary tiles come from `useEarningsSummary()` (whole-ledger), NOT from the loaded rows** (documented rationale): `pendingTokens = summary.pendingTokens ?? 0`; `settledTokens = (availableTokens??0)+(paidOutTokens??0)`; `weekTokens = useMemo((summary.last7Days ?? []).reduce(+tokens, 0))`.
- **`filtered`** (memo `[transactions,filter]`): `pending`→`status==='pending'`; `settled`→`status==='available' || 'paid_out'`; `refunded`→`status==='refunded' || 'reversed'`; else all. Test each branch + empty.

### `components/{TxRow,TxDescription,TxRowSkeleton}.tsx` — P2
`TxRow({txn,first})` uses `txIconType`/`TX_ICON`/`TX_TINT`/`txBadgeClass`. `TxDescription({txn})` presentational text. Skeleton static.

---

## SCREEN: chat-thread  (P1)

### `src/screens/chat-thread/messageMerge.ts` — P1, pure  ⭐ core reconciliation
- `PENDING_PREFIX = 'temp-'`; `isPendingId(id)=id.startsWith('temp-')`; `PENDING_MATCH_WINDOW_MS = 5*60000 = 300000`.
- **`pendingTwinOf(byId, m): string | null`** — the placeholder key in `byId` that incoming `m` confirms:
  - Returns `null` immediately if `isPendingId(m.id)` OR `byId.has(m.id)` (already-known id can't twin).
  - `at = new Date(m.createdAtUtc).getTime()`. Iterate `byId` entries; skip non-pending keys. A candidate placeholder matches iff **all**: `existing.senderType === m.senderType`; `existing.messageText === m.messageText`; reply-target compat — only enforced when **both** `m.replyToMessageId != null && existing.replyToMessageId != null`, then must be equal (if incoming has no reply field, as the realtime payload doesn't, this check is skipped); `abs(at − existing.createdAt) <= 300000ms`. Returns the first matching key, else `null`.
- **`mergeMessages(prev, incoming)`** — `byId = Map(prev by id)`. For each incoming `m`: `twin = pendingTwinOf(byId, m)`; `base = twin ? byId.get(twin) : byId.get(m.id)`; if `twin` → `byId.delete(twin)` (**retire placeholder**); `byId.set(m.id, {...(base ?? {}), ...m})` (**placeholder is the base so `replyTo*` survive**, incoming overwrites shared fields). Return `Array.from(values()).sort(by createdAtUtc asc)`.
  - Test scenarios: (a) placeholder `temp-1` + server row with real id, same sender/text, within 5min, no reply field → result has 1 row (real id), reply header from placeholder preserved. (b) same but >5min apart → 2 rows. (c) different text → 2 rows. (d) both have differing `replyToMessageId` → not a twin. (e) incoming with existing id → merged in place (`{...base,...m}`). (f) ordering by timestamp asc.

### `src/screens/chat-thread/threadFormatting.ts` — P1, pure
- **`bubbleTime(iso)`** = `toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})`.
- **`dayKey(iso)`** = `"{FullYear}-{getMonth()}-{getDate()}"` (month 0-indexed, local).
- **`dayLabel(iso)`** — diff in whole days between local midnights: 0→`'Today'`, 1→`'Yesterday'`, else `toLocaleDateString([], {day:'numeric',month:'short', year: sameYear?undefined:'numeric'})`.
- **`buildEntries(messages): Entry[]`** — walks messages; when `dayKey` changes, pushes `{kind:'date', id:`d-${k}`, label: dayLabel}` then `{kind:'msg', id:m.id, msg}`. Inserts a date separator before the first message and at each day boundary. Test: empty→`[]`; 2 msgs same day→`[date,msg,msg]`; spanning 2 days→`[date,msg,date,msg]`.
- **`initialsFor(name)`** — trim/split on whitespace; 0 parts→`'?'`; 1 part→`part.slice(0,2).toUpperCase()`; ≥2→`(p0[0]+p1[0]).toUpperCase()`. `""`→`'?'`; `"madonna"`→`'MA'`; `"john doe"`→`'JD'`.

### `src/screens/chat-thread/useChatThread.types.ts` — P1, types (`UseChatThreadResult`).

### `src/screens/chat-thread/useChatThread.ts` — P1, hook
Params via `useLocalSearchParams` (`userId,name,avatarUrl`). `fan = name ?? 'Fan'`, `firstName = fan.split(' ')[0]`. `artistId = useProfile().data?.id`. State: `messages, loading(true), draft, sending, error, replyingTo, editing, actionTarget, forwardOpen, forwardMsg, forwardingId, optionsOpen`. Refs: `scrollRef, inputRef, mounted(true), sendingRef(false), initialScrollDone(false)`. `POLL_MS=10000`. `toast(text)` uses `Toast.show({type:'appNotification', props:{type:'system'}})`.

**`otherConvos`** = `useConversations().data ?? []` filtered `c.userId !== userId`.

**`nudgeScroll(animated)`** — `requestAnimationFrame(scrollToEnd)` + `setTimeout(scrollToEnd, 200)` (double nudge, documented layout-settle fix).

**Effects:**
1. **mount flag** — sets `mounted.current=true`, cleanup `false`.
2. **`load` poll** — `load(true)` on mount + `setInterval(()=>load(true), 10000)`; cleanup clears. `load(markRead, dropId?)`: bails if no `userId`; `getConversation(userId,1,50)`; `mounted` guard; on success `setMessages(prev => mergeMessages(dropId?prev.filter(≠dropId):prev, items))` + `if markRead → markRead(userId)`; `setLoading(false)`; first time only → `initialScrollDone=true` + `nudgeScroll(false)`. ⚠ marks read on **every 10s poll**.
3. **realtime hub** (deps `[artistId,userId,nudgeScroll]`) — needs both ids. `onMessage(p)`: `mergeMessages(prev, [{id,senderType,messageText,privateCallId,priceCharged,readAtUtc:null,createdAtUtc}])` (**no replyTo fields** — mergeMessages keeps placeholder base), `nudgeScroll(true)`, and if `p.senderType==='user'` → `markRead(userId)`. `onDeleted(p)`: maps matching id → `{isDeleted:true, messageText:''}`. `privateMessageHub.connect(artistId,userId,onMessage,onDeleted)`; cleanup `cancelled=true` + `disconnect()`.

**Handlers:**
- `startReply(m)` — clears editing, sets replyingTo, clears actionTarget, focuses input.
- `startEdit(m)` — clears replyingTo, sets editing, `setDraft(m.messageText)`, focus.
- `cancelMode()` — clears replyingTo; if editing → clear draft; clear editing.
- `handleCopy(m)` — clears actionTarget, `Clipboard.setStringAsync`, toast `'Copied to clipboard'`.
- `confirmDeleteForEveryone(m)` — `Alert.alert` destructive; onPress: optimistic map→`{isDeleted,messageText:''}`, `deleteMessage(m.id)`; success→`load(false)`; failure→restore `backup` + `flashError`.
- `confirmDeleteForMe(m)` — optimistic filter out; `deleteMessageForMe(m.id)`; success→`load(false)`; failure→restore+flashError.
- `confirmDeleteChat()` — `deleteConversation(userId)`; success→`router.back()`; failure→flashError.
- `openForward(m)` — set forwardMsg + forwardOpen.
- `forwardTo(c)` — needs forwardMsg; `setForwardingId(c.userId)`; `reply(c.userId, forwardMsg.messageText)`; mounted guard; success→close forward + toast ``Forwarded to ${userDisplayName ?? 'fan'}``; failure→flashError.
- **`handleSend()`** — `text=draft.trim()`; guard `!text || sendingRef.current || !userId` → return (**sendingRef is the double-tap guard, set synchronously before re-render — documented fix for duplicate sends**). `isEditing=editing`, `replyTarget=replyingTo`; `sendingRef=true`, `setSending(true)`.
  - **Edit path**: `editMessage(id,text)`; success→clear draft/editing, `load(false)`, nudge; failure→flashError; **`catch`→flashError `'Could not save the edit...'`** (documented: prevents forever-spinning button); `finally`→`sendingRef=false`, `setSending(false)`; return.
  - **New path**: builds optimistic `{id:`temp-${Date.now()}-${rand}`, senderType:'artist', priceCharged:0, replyTo*: from replyTarget}`; `mergeMessages(prev,[optimistic])`, clear draft/replyingTo, nudge. Then `reply(userId, text, replyTarget?.id ?? null)`; success→`mergeMessages(prev,[{...optimistic, id:real.messageId, createdAtUtc:real.createdAtUtc}])` (placeholder retired by merge), `void load(false)`, nudge; failure→filter out tempId, restore draft+replyingTo, flashError; `catch`→same rollback + connection flashError; `finally`→clear sendingRef/sending.
- `flashError(msg)` — mounted guard; `setError(msg)` + `setTimeout(clear, 4000)`.
- `entries = buildEntries(messages)`; `goBack = router.back`.

### `ChatThreadScreen.tsx` + `components/*` — P2
`ChatThreadScreen` = presentational consumer of `useChatThread` (verified no state/effects/API). `MessageRow({msg,fan,onLongPress})`, `ActionRow`, `ActionSheetModal({visible,onClose,children})`, `ForwardPickerModal({visible,onClose,otherConvos,forwardingId,onForward})`, `ThreadSkeleton`. Presentational.

---

## SCREEN: live-broadcast-room  (P0)  ⭐

### `src/screens/live-broadcast-room/useLiveBroadcastSession.types.ts` — P0, types.

### `src/screens/live-broadcast-room/useLiveBroadcastSession.ts` — P0, hook
Poll constants: `ACTIVITY_POLL_MS=15000`, `VIEWERS_POLL_MS=5000`, `DELIVERIES_POLL_MS=12000`, `HEARTBEAT_MS=15000`.
`config` = safe-parsed `sessionConfig` (`{title,category,description,highlightedMessagePrice}`), `try/catch→{}`. `displayTitle = (config.title||'Untitled stream').trim()`. `liveTitle/liveCategory` overridable on rejoin.
State: `status('starting')`, `awaitingConfirm(false)`, `elapsed(0)`, `viewerCount(0)`, `peakViewer(0)`, `activity[]`, `viewers[]`, `pendingRewards[]`, `pendingSpins[]`, `fulfillingId`, `chatText`, `sendingChat`, `micOn(true)`, `camOn(true)`, `videoKey(0)`, `panel(null)`, `isFullscreen`, `statsOpen`, `manageOpen`, `removingId`, `confirmingEnd`, `isEnding`, `errorBanner`.
Refs: `idRef`, `startedRef(false)`, `liveStartedRef(false)`, `endedRef(false)`, `chatRef`, **`confirmResolveRef`** (the confirm-gate resolver). `videoAvailable = isAgoraAvailable()`.
Derived: `sessionEarnings = Σ activity.priceCharged`; `sessionGifts = activity.filter(type==='reward').length`; `pendingCount = pendingRewards.length + pendingSpins.length`.
`mergeActivity(incoming)` — Map by id, set incoming, sort by createdAtUtc asc.
`refreshActivity` (`getActivity(id,100)`→mergeActivity), `refreshViewers` (`getViewers(id)`→ set viewers, viewerCount, `peakViewer=max(prev,count)`), `refreshDeliveries` (`rewardOrdersApi.list('pending',100,id)`→pendingRewards; `funWheelSpinsApi.list('pending',100,id)`→pendingSpins).

**Mount effect (`[]`, `startedRef` one-shot):**
- `if startedRef.current return; startedRef.current=true`.
- `if videoAvailable → startLocalPreview()` (camera up immediately, fixes black preview).
- Declares 6 timer vars (5 intervals + `rebindTimer` timeout).
- async IIFE: `await requestCallPermissions()`.
  - **Rejoin-first**: `active = activeBroadcastStore.get()`; if active → `broadcastApi.rejoin(id)`; success → `conn=data`, `idRef=id`, restore `liveTitle/liveCategory`, resume `elapsed` from `active.startedAt`; failure → `activeBroadcastStore.clear()`.
  - **Fresh** (`!conn`): `setStatus('ready')`, `setAwaitingConfirm(true)`, **`await new Promise(resolve => confirmResolveRef.current = resolve)`** — blocks until `onStartShow()` (or unmount) resolves it; then `confirmResolveRef=null`; **`if endedRef.current return`** (cancelled/left). `setAwaitingConfirm(false)`, `setStatus('starting')`. `broadcastApi.start({title:displayTitle, description, category})`; failure → error toast + `router.back()`; success → `conn=data`, `idRef=id`, `activeBroadcastStore.save(...)`, and if `highlightedMessagePrice` is number>0 → `setHighlightedMessagePrice(id, price)`.
  - **`goLive()`** (guarded `liveStartedRef||endedRef`): sets `liveStartedRef=true`, `status='live'`, `videoKey+1`, **`rebindTimer = setTimeout(videoKey+1, 1200)`** (captured & cleared), `confirmConnected(id)`, then starts **5 intervals**: elapsed 1000ms, heartbeat 15000ms, activity 15000ms, viewers 5000ms, deliveries 12000ms; immediate `refreshActivity/Viewers/Deliveries`. **`broadcastHub.connect(id, {onActivityAdded→mergeActivity([item]), onViewerCountChanged→set count + peak, onFulfillmentUpdated→map activity status + refreshDeliveries, onBroadcastEnded→exitToSummary})`** — **4 hub handlers**.
  - **Agora sequence**: if `videoAvailable` → `joinAsHost(channel,uid,token,{onJoinSuccess:goLive, onError:setErrorBanner})` + **failsafe `setTimeout(()=>{ if(!endedRef.current && idRef.current) goLive() }, 4000)`**; else `goLive()` directly (no video).
- **Cleanup**: `endedRef.current=true`; `confirmResolveRef.current?.()` (unblocks the gate promise if still awaiting); clears the 5 intervals; `if rebindTimer clearTimeout`; `broadcastHub.disconnect()`; `destroyAgoraEngine()`.

**Other handlers:**
- `exitToSummary()` → `router.replace('/(app)/(tabs)/home')` (no summary screen — matches web).
- `endBroadcast()` — `isEnding` guard; `setIsEnding(true)`; `if id → broadcastApi.end(id)`; `activeBroadcastStore.clear()`; `exitToSummary()`.
- `handleSendChat()` — trim guards (`!text||!id||sendingChat`); `setSendingChat(true)`, clear input; `sendChatMessage`; success→`refreshActivity()` (immediate pull); failure→restore text; clear sending.
- `fulfillReward(order)` / `fulfillSpin(spin)` — `setFulfillingId`; `fulfill(id)`; success→remove from pending list + map activity status→`'fulfilled'`; clear id.
- `removeViewer(v)` — needs id; `setRemovingId`; `removeViewer(id, v.userId)`; success→filter out; clear.
- `toggleMic()` — `setMicOn(v => (setLocalAudioEnabled(!v), !v))`. `toggleCam()` — `setLocalVideoEnabled(!v)`; if turning **on** (`v===false`) → `videoKey+1` (rebind); return `!v`.
- `goBack = router.back`; **`onStartShow = () => confirmResolveRef.current?.()`** (resolves the gate).

### `LiveBroadcastRoomScreen.tsx` + `components/{ChatPanel,ViewersPanel,SessionStatsSheet}.tsx` — P2
Presentational (verified). Screen renders confirm gate on `awaitingConfirm` with `onStartShow`, end-confirm on `confirmingEnd`.

---

## SCREEN: group-call-room  (P0)  ⭐

### `useGroupCallSession.types.ts` — P0, types.

### `src/screens/group-call-room/useParticipants.ts` — P0, hook (isolated for testability)
`PENDING = new Set(['requested'])` (API sends `requested`, never `pending_approval`). `CONNECTED = new Set(['authorized','joining','connected','reconnecting'])`.
`useParticipants(getCallId, onApproved?)`: state `participants[]`, `busyUserId`. Derived `pending = filter(PENDING.has(status) && !isRemoved)`, `connected = filter(CONNECTED.has(status) && !isRemoved)`.
**Optimistic moderation:**
- **`approve(userId)`** — needs `getCallId()`; `setBusyUserId`; **optimistic**: map user → `status:'authorized'`; `approveParticipant(id,userId)`; clear busy; **`onApproved?.()`** (re-pull — only approve does this; reject/remove don't — **asymmetry preserved by design**).
- **`reject(userId)`** — optimistic **filter out**; `rejectParticipant(id,userId,'Not this time')`; clear busy. No re-pull.
- **`remove(userId)`** — optimistic filter out; `removeParticipant(id,userId,'Removed by artist')`; clear busy.
- **`toggleMute(p)`** — optimistic map user → `isMuted:!p.isMuted`; if `p.isMuted` → `unmuteParticipant(id,userId)` else `muteParticipant(id,userId,'Muted by artist')`. **No busy flag, no rollback** on any of the four (fire-and-forget after optimistic update).

### `src/screens/group-call-room/useGroupCallSession.ts` — P0, hook
Polls: `ACTIVITY_POLL_MS=15000`, `PARTICIPANT_POLL_MS=6000`, `DELIVERIES_POLL_MS=12000`, `HEARTBEAT_MS=15000`.
`config` safe-parsed (`{title,maxParticipants,entryPrice,requiresApproval,mode}`). State seeded from params: `displayTitle`, `maxParticipants(config??8)`, `isAudioOnly(mode==='audio')`, plus `status('starting')`, `elapsed`, `activity[]`, `pendingRewards/Spins[]`, `fulfillingId`, `peak(0)`, `chatText`, `sendingChat`, `micOn(true)`, `camOn(!isAudioOnly)`, `videoKey`, `panel`, `isFullscreen`, `statsOpen`, `manageOpen`, `confirmingEnd`, `isEnding`, `errorBanner`, `awaitingConfirm(false)`, `startingRoom(false)`. Refs `idRef,startedRef,liveStartedRef,endedRef,chatRef,confirmResolveRef`. `videoAvailable`.
`refreshParticipants` — `getParticipants(id)` → `setParticipants` + `peak = max(prev, count of CONNECTED && !isRemoved)`.
Composes **`useParticipants(() => idRef.current, refreshParticipants)`** → exposes `participants,setParticipants,pending,connected,busyUserId,approve,reject,remove,toggleMute`.
Derived `sessionEarnings/sessionGifts/pendingCount`, `mergeActivity` (same pattern), `refreshActivity`, `refreshDeliveries` (both reward + spin lists).

**Mount effect (`[]`, one-shot):**
- 5 timer vars. `bail(msg)` = toast + `router.back()`.
- `requestCallPermissions()`.
- **Rejoin-first**: `active=activeGroupCallStore.get()`; if active → `groupCallApi.rejoin(id)`; success→`conn`, `idRef`, build `draft`, restore title/max/audio/`camOn(false if audio)`/elapsed, toast `'Rejoined your group call.'`; failure→`clear()`.
- **Create/start (`!conn`)**: `groupCallId = existingId ?? null`; `spec = {title, maxParticipants:8default, entryPrice:0, requiresApproval:true default, audioOrVideoMode:'video'default}`; if no id → `groupCallApi.create(spec)`; failure→`bail`; else id from data. `idRef=id`; `draft={id,...spec}`; `saveDraft(draft)`. Then camera preview if video+!audio; **`setAwaitingConfirm(true)` + await gate Promise (confirmResolveRef)**; after resolve → `if endedRef return`; `setAwaitingConfirm(false)`; `groupCallApi.start(id)`; failure→`setStartingRoom(false)` + `clear()` + `bail`; success→`conn`.
- `audioOnly = draft.audioOrVideoMode==='audio'`; **`saveConnection(conn, draft)`** (persist channel for second walk-out); preview if video+!audio.
- **`goLive()`** (guarded): `liveStartedRef=true`, `status='live'`, `videoKey+1`, **`setTimeout(videoKey+1, 1200)`** ⚠ (NOT captured/cleared — see Bug #2), `confirmConnected(id)`, 5 intervals (elapsed 1000/heartbeat 15000/activity 15000/participants 6000/deliveries 12000), immediate refreshes. **`groupCallHub.connect(id, {...})` — 6 hub handlers**: `onActivityAdded→mergeActivity`; `onParticipantRequested→refreshParticipants + toast 'Someone wants to join — open Participants to approve.'`; `onParticipantsChanged→refreshParticipants`; `onParticipantStatusChanged→refreshParticipants`; `onFulfillmentUpdated→map status + refreshDeliveries`; `onGroupCallEnded→activeGroupCallStore.clear() + exitBack()`.
- **Agora**: if video+!audio → `joinAsHost(...,{onJoinSuccess:goLive,onError:setErrorBanner})` + **failsafe `setTimeout(goLive, 4000)`** ⚠ (not captured); else `goLive()` (audio-only / no video path bypasses Agora).
- **Cleanup**: `endedRef=true`; `confirmResolveRef?.()`; clear 5 intervals; `groupCallHub.disconnect()`; `destroyAgoraEngine()`. ⚠ the two in-`goLive` setTimeouts are not cleared.

**Handlers:**
- `exitBack()` — `router.canGoBack() ? back() : replace('/(app)/(tabs)/calls')`.
- **`abandonBeforeStart()`** — `startingRoom` guard; `endedRef=true`; `confirmResolveRef?.()`; `if id → groupCallApi.cancel(id,'Artist left before starting')`; `clear()`; `exitBack()` (cancels a created-but-unopened room).
- `endCall()` — `isEnding` guard; `end(id)`; `clear()`; `exitBack()` (only real End clears store).
- `handleSendChat()` — same as broadcast (trim guards, optimistic clear, restore on fail).
- `fulfillReward/fulfillSpin` — same pattern (remove pending + status→fulfilled).
- `toggleMic/toggleCam` — same as broadcast.
- `stageCopy` — `isAudioOnly ? {'Audio-only session',...} : camOn ? {'Camera is starting…',...} : {'Camera is off',...}`.
- **`onStartCall()`** — `setStartingRoom(true)` + `confirmResolveRef?.()` (resolves gate). ⚠ startingRoom never reset on success path.

### `GroupCallRoomScreen.tsx` + `components/{ChatPanel,ParticipantRow,SessionStatsSheet}.tsx` — P2
Presentational. `ParticipantRow({participant,mode,busyUserId,onApprove,onReject,onToggleMute,onRemove})`. Gate rendered on `awaitingConfirm` via `onStartCall`.

---

## SCREEN: private-call-room  (P0)  ⭐

### `usePrivateCallSession.types.ts` — P0, types.

### `src/screens/private-call-room/usePrivateCallSession.ts` — P0, hook (intentionally NOT sharing the room-session hook — remote-peer/PIP model differs)
Constants: `HEARTBEAT_MS=15000`, `DELIVERIES_POLL_MS=12000`, **`ACTIVE_POLL_MS=3000`** (backstop for missed PrivateCallEnded/Started).
`connection` = safe-parsed `params.connection` (`PrivateCallConnectionResponse` | null). `fanName(params.fanName||'Fan')`, `ratePerMin(Number(params.ratePerMin)||0)`. State: `status('connecting')`, `elapsed`, `remoteUid(null)`, `remoteVideoOn(false)`, `remoteAudioOn(true)`, `cost({minute:0,total:0})`, `activity[]`, `pendingRewards/Spins[]`, `fulfillingId`, `micOn(true)`, `camOn(true)`, `videoKey`, `panel`, `isFullscreen`, `manageOpen`, `peerReconnecting(false)`, `selfReconnecting(false)`, `confirmingEnd`, `ending`, `endingNotice(null)`, `errorBanner`.
Refs: `idRef(connection?.privateCallId ?? null)`, `startedRef`, `endedRef`, **`connectedRef`**, **`presenceStartedRef`**, **`lostReportedRef`**, `feedRef`. `videoAvailable`.
`exitBack` (useCallback) — `if endedRef return; endedRef=true; canGoBack()?back():replace('/(app)/(tabs)/calls/private-calls')`.
`mergeActivity` — same id-map + createdAtUtc sort.
`refreshDeliveries` — reward list → `setPendingRewards` **and** `mergeActivity(map to {type:'reward', isArtist:false, displayName:buyerDisplayName||'Fan', extra:rewardName, ...})`; spin list → `setPendingSpins` **and** `mergeActivity(map to {type:'fun_wheel', extra:activityName, ...})`.

**Mount effect (`[]`, one-shot):** 5 timer vars.
- `requestCallPermissions()`; `if videoAvailable → startLocalPreview()`.
- **Connection acquisition**: `conn = connection`. If present (fresh accept) → **`privateCallApi.connect(conn.privateCallId)`** (idempotent, flips call to "active" for the fan — **without it the fan sees "call isn't active" and can't send rewards/spins**); success→`conn=data`. Else (walked back in) → `active = activePrivateCallStore.get()`; if active → `privateCallApi.connect(active.privateCallId)`; success→`conn=data`, restore fanName/ratePerMin/elapsed (from `active.startedAt`), toast `'Rejoined your call.'`; failure→`clear()`.
- **`if !conn || endedRef.current`** → if not ended: toast `'That call is no longer active.'` + `exitBack()`; return.
- `idRef=conn.privateCallId`; **`activePrivateCallStore.save(conn, {fanName: params.fanName||fanName, ratePerMin: Number(params.ratePerMin)||ratePerMin})`**.
- **`onConnected()`** (video-connected UI only, guarded `connectedRef||endedRef`): `connectedRef=true`, `status='connected'`, `videoKey+1`, **`rebindTimer=setTimeout(videoKey+1, 1200)`** (captured & cleared), `elapsedTimer=setInterval(elapsed+1, 1000)`.
- **`startRealtime()`** (guarded `presenceStartedRef||endedRef`): `presenceStartedRef=true`; `heartbeatTimer=setInterval(heartbeat(conn.privateCallId), 15000)`; `delivTimer=setInterval(refreshDeliveries, 12000)`; immediate `refreshDeliveries()`. **`privateCallHub.connect(conn.privateCallId, {...})` — 10 hub handlers**: `onCallStarted→status='connected'`; `onCallCostUpdate→setCost({minute:p.minuteNumber, total:p.totalCoinsCharged})`; `onRewardPurchased→dedupe-prepend pendingRewards + mergeActivity(reward) + toast`; `onFunWheelSpun→dedupe-prepend pendingSpins + mergeActivity(fun_wheel) + toast`; `onFulfillmentUpdated→map status + refreshDeliveries`; `onUserReconnecting→peerReconnecting=true`; `onUserReconnected→peerReconnecting=false`; `onCallEnding(reason)→ if 'insufficient_balance' setEndingNotice('Call ending — insufficient balance.')`; `onPrivateCallEnded→clear() + exitBack()`. Then **`activeTimer=setInterval(3000)`**: `getActive()`; if `!success||endedRef` return; if `!hasActiveSession` → `clear()` + `exitBack()`; else if `status==='active'` → `setStatus('connected')`.
- **⭐ ORDERING**: **`startRealtime()` is called BEFORE the video join** (`joinPrivateCallChannel`) — documented as the fix for "app artist receiving no gifts / fun-wheel spins" (realtime must not be gated on the Agora channel).
- **Agora**: if `videoAvailable` → `joinPrivateCallChannel(channel,uid,token,{onJoinSuccess:onConnected, onRemoteUserJoined(uid)→setRemoteUid+peerReconnecting=false, onRemoteUserLeft→remoteUid=null, onRemoteVideoOn→setRemoteVideoOn, onRemoteAudioOn→setRemoteAudioOn, onConnectionStateChanged(state)→...})` + **failsafe `setTimeout(()=>{ if(!endedRef) onConnected() }, 4000)`** ⚠ (not captured); else `onConnected()`.
  - **`onConnectionStateChanged`** (self-link guards): if `endedRef` return; if `'Reconnecting'|'Failed'` → `setSelfReconnecting(true)`, and if `idRef && !lostReportedRef.current` → **`lostReportedRef=true` + `reportConnectionLost(id)`** (tells backend to pause billing — reported **once** per drop); if `'Connected'` → `setSelfReconnecting(false)` + `lostReportedRef=false` (rearm).
- **Cleanup**: `endedRef=true`; clear 4 intervals (`elapsed,heartbeat,deliv,active`); `if rebindTimer clearTimeout`; `privateCallHub.disconnect()`; `destroyAgoraEngine()`.

**Handlers:**
- `endCall()` — `setConfirmingEnd(false)`, `setEnding(true)`; `if id → privateCallApi.end(id,'artist_ended')` (so history reads "Ended normally"); `activePrivateCallStore.clear()`; `setEnding(false)`; `exitBack()`.
- `fulfillReward(o)/fulfillSpin(s)` — `setFulfillingId`; `fulfill(id)`; success→remove pending + status→'fulfilled' + success toast (`Marked "..." as delivered to ...`); failure→error toast; clear id.
- `toggleMic/toggleCam` — same pattern (cam-on rebind).
- Derived: `pendingCount`, `connected = status==='connected'`, **`fanVideoLive = videoAvailable && remoteUid!==null && remoteVideoOn`**.

### `PrivateCallRoomScreen.tsx` + `components/{FanStage,LocalPip,ConnectionBanners,ActivityPanel}.tsx` — P2
Presentational. `FanStage({fanVideoLive,remoteUid,connected,fanName,remoteAudioOn})`, `LocalPip({videoAvailable,camOn,videoKey})`, `ConnectionBanners({peerReconnecting,selfReconnecting,endingNotice,errorBanner,...})`, `ActivityPanel({activity,fanName,onClose,feedRef})`. End-confirm on `confirmingEnd`.

---

## BUGS / DEAD CODE / SUSPICIOUS LOGIC (flagged, not fixed)

1. **Uncleared in-`goLive` rebind timer** — `useGroupCallSession.ts:246` `setTimeout(() => setVideoKey(k=>k+1), 1200)` is **not captured or cleared** and has **no `endedRef` guard** (unlike `useLiveBroadcastSession.ts` which stores it in `rebindTimer` and clears it). If the component unmounts within 1.2s of going live, this fires `setState` after unmount (React warning / wasted render). **P0.**
2. **Uncleared 4s Agora failsafe timers** — `useLiveBroadcastSession.ts:228`, `useGroupCallSession.ts:282`, `usePrivateCallSession.ts:421`. Each schedules `goLive()`/`onConnected()` at 4000ms but is not stored/cleared in cleanup. All are guarded by `!endedRef.current`, so functionally benign, but they leak a pending timer per mount. **P0** (verify no double-`goLive` if join succeeds ~4s: guarded by `liveStartedRef`/`connectedRef`, so safe).
3. **`usePrivateCalls.declineRequest` (usePrivateCalls.ts:185-193)** — removes the request from the list **without checking `res.success`** and with **no rollback**; `acceptRequest` does check success. Asymmetric; a failed reject still visually drops the request. **P0.**
4. **`usePrivateCalls.handleSaveSettings` always toggles availability** (usePrivateCalls.ts:143 `next = !acceptsPrivateCalls`). The single Save button both persists the price and flips `acceptsPrivateCalls` (confirmed by wrapper: one Pressable, accessibilityLabel "Turn on/off private calls"). Consequence: **you cannot save a new price without also flipping availability**. Matches the web toggle-button contract, but is a foot-gun and must be asserted explicitly in tests (calling it while ON turns calls OFF). **P0 — behavior, likely by design.**
5. **Schedule → Room draft/rejoin interaction** — `useScheduleSession.schedule()` calls `activeGroupCallStore.saveDraft(...)` **before** navigating to the room (useScheduleSession.ts:167). The room's mount effect (`useGroupCallSession.ts:166`) calls `activeGroupCallStore.get()` **first** and, finding that just-saved draft, attempts **`groupCallApi.rejoin()` on a call that was created but never started**. If the backend lets rejoin succeed on a not-started call, the room **skips the OFFLINE/START-CALL confirm gate** and goes live immediately (artist never confirms); if rejoin fails, the store is cleared and the normal `existingId` gate path runs. Needs backend-semantics verification. **P0 — suspicious cross-module coupling.**
6. **Dead/always-true checklist conditions** — `useScheduleSession` `checklist` items `'Date and time (optional)'` and `'Approval preference set'` are hardcoded `done:true`; `'Coin price'` = `priceNum>=0` and `canSchedule`'s `priceNum>=0` are always true (since `parseInt(...)||0`). Harmless but dead. **P2.**
7. **`analyticsTiles` chat bar scaling** (broadcastHistory/format.ts:33) — `barPct = min(100, round(chatMessageCount/5*100))` uses a **hardcoded /5**, so ≥5 chat messages always render a full bar. Intentional per web, but surprising; call out in the tile test. **P2.**
8. **`TrendChart` inline logic not extracted** (earnings/components/TrendChart.tsx:18-34) — empty-points fallback, `peak`, and `max(4, tokens/peak*100)%` height live in the component rather than `format.ts`, so they're only reachable via render tests. **P2.**
9. **`useChatThread` marks read on every 10s poll** (useChatThread.ts:112 `load(true)`) — not a bug, but generates a `markRead` network call every poll tick; note for test expectations. **P1.**

---

**70 files audited, ~205 behaviors across P0/P1/P2.**

---

# Section 8: Live setup, Home, remaining Tabs & Modals

Structural note: `app/(app)/(tabs)/_layout.tsx` and `app/(app)/(tabs)/calls/_layout.tsx` do NOT exist.

## src/screens/live/goLive/types.ts — P2 (UseGoLiveSetupResult type)
## src/screens/live/goLive/CATEGORIES.ts — P2: `['Music','Talk','Dance','Gaming','Art','Fitness']` (order-significant, default 'Music').
## src/screens/live/goLive/useGoLiveSetup.ts — P0 (dense)
Deps: settingsApi.getRewardMenu(); Agora isAgoraAvailable/requestCallPermissions/setLocalAudioEnabled/setLocalVideoEnabled/startLocalPreview/destroyAgoraEngine; activeBroadcastStore.get(); router. State (11 useState+1 ref): title='', category='Music', description='', highlightedPrice='', cameraOn=true, micOn=true, ready=false, videoKey=0, activeRewards=null, camReady=false, micReady=false; goingToRoomRef=false; videoAvailable=isAgoraAvailable() (per render).
Effect1 (useFocusEffect []): getRewardMenu().then → if success activeRewards=data.filter(isActive).length. No cancellation guard (⚠️ minor setState-after-unmount).
Effect2 (useFocusEffect [videoAvailable], eslint-disable): on focus goingToRoomRef=false, cancelled=false; IIFE: active=await activeBroadcastStore.get(); if cancelled return; if active → goingToRoomRef=true, router.replace('/(app)/(modals)/live-broadcast-room'), return; await requestCallPermissions(); if cancelled||!videoAvailable return; startLocalPreview(); setLocalVideoEnabled(cameraOn) [stale closure]; setLocalAudioEnabled(micOn) [stale]; setReady(true); setVideoKey(k=>k+1); setTimeout(!cancelled&&setVideoKey(k=>k+1), **700ms**). Cleanup: cancelled=true; if !goingToRoomRef.current → destroyAgoraEngine()+setReady(false). 🐞 stale cameraOn/micOn: toggling a device off then blur/refocus re-applies stale initial true (silently re-enables). eslint-disable masks it.
toggleCamera(): setCameraOn(v=>{next=!v; setLocalVideoEnabled(next); if(next) setVideoKey(k=>k+1); return next}) — bumps videoKey only when turning ON. toggleMic(): setMicOn(v=>{next=!v; setLocalAudioEnabled(next); return next}) — no bump.
Derived: priceValid=`highlightedPrice.trim().length>0 && Number(highlightedPrice)>0`; canGoLive=`title.trim().length>0 && priceValid`; caption: if cameraOn||micOn → `Camera and mic are ${cameraOn&&micOn?'on':cameraOn?'on (mic off)':'on (camera off)'}. You're not visible to anyone yet.` else `'Camera and mic are off. Turn them on below when you're ready to preview.'`.
goLive(): if !canGoLive return; goingToRoomRef=true; router.push({pathname:'/(app)/(modals)/live-broadcast-room', params:{sessionConfig:JSON.stringify({title:title.trim(),category,description:description.trim(),highlightedMessagePrice:highlightedPrice?Number(highlightedPrice):undefined})}}).
Effect3 (useEffect [cameraOn,videoAvailable]): if !videoAvailable||!cameraOn → setCamReady(false); else setCamReady(false)+setTimeout(setCamReady(true), **1400ms**). Effect4: same for mic/micReady 1400ms. devicesReady=`(!cameraOn||camReady)&&(!micOn||micReady)`.
Test targets: priceValid/canGoLive/caption truth tables, goLive sessionConfig JSON + trim, toggle side effects + videoKey asymmetry, 1400ms readiness timers, focus-effect branches, teardown gated on goingToRoomRef.

## src/screens/home/search/matching.ts — P1 (pure)
SECTION_LIMIT=5. BADGE_LABEL (search-side, UPPERCASE): top_supporter→'TOP SUPPORTER', new_follower→'NEW FOLLOWER', session_regular→'SESSION REGULAR', returning_fan→'RETURNING FAN', follower→'FOLLOWER'. BADGE_TONE: top_supporter→'success', new_follower/session_regular→'primary', returning_fan/follower→'neutral'. matches(haystack,needle)=`haystack.toLowerCase().includes(needle)` — ⚠️ only haystack lowered; needle NOT (caller must pre-lower). matches('Friday Night','night')→true, ('...','NIGHT')→false, ('...','')→true. filterSessions(all,needle): !needle→all.slice(0,5); else filter matches(title|category|status), slice(0,5). filterFollowers: fields displayName + BADGE_LABEL[badge]. filterTransactions: fields description, fromDisplayName, sourceLabel(sourceType), status, groupCallTitle??''.
## src/screens/home/search/useRecentSearches.ts — P1
RECENT_KEY='mitro.search.recent', RECENT_LIMIT=5. mmkvStorage.getJSON/setJSON. State recent=[]. Load effect []: getJSON.then(if alive&&Array.isArray setRecent) catch logger.warn('Recent searches unreadable'); cleanup alive=false. persistRecent(next): setRecent+setJSON catch logger.warn('Recent searches unwritable'). rememberSearch(raw): term=raw.trim(); if !term return; persistRecent([term,...recent.filter(r=>r.toLowerCase()!==term.toLowerCase())].slice(0,5)) — case-insensitive dedupe, prepend, cap 5. forgetSearch(term): persistRecent(recent.filter(r=>r!==term)) — ⚠️ case-SENSITIVE (asymmetry).

## app/(app)/(tabs)/home/index.tsx — P1 (UNSPLIT, monolithic)
RECENT_COUNT=5, NOTES_COUNT=5, CLEAN_END='Ended by artist'. Hooks: useNotificationStore(items,unreadCount), useEarningsSummary, useBroadcastHistory(5), useFollowers, useVerificationGate(banner,guard,goToKyc), useRouter. Derived: recentShows=broadcasts?.length??0; summary=4 cells [Total Coins grouped(totalTokens)||'—', Pending grouped(pendingTokens)||'—', Available grouped(availableTokens)||'—', Recent Shows String(recentShows)]; topNotes=(notes??[]).slice(0,5); showSkeleton=`loadingEarnings && !earnings`. renderSkeleton() full-page. CTAs wrapped in guard(): Start Live→push live, Schedule→push calls/schedule-session, Private Calls→push calls/private-calls. Broadcast row icon tinted by `endReason===CLEAN_END`; earnings `+formatTokens` when totalRevenueTokens>0 else '0 coins'; row→broadcast-history. Notifications panel topNotes or caught-up; row→home/notifications. Test via mocked hooks.

## app/(app)/(tabs)/home/search.tsx — P1
FILTERS=['All','Sessions','Followers','Transactions'], TAKE=100. query/filter state, useRecentSearches, debounced=useDebounce(query), needle=debounced.trim().toLowerCase(). Data useBroadcastHistory(100,0)/useFollowers/useEarningsTransactions(100,0). useMemo sessionHits/followerHits/transactionHits via filterX. show(section)=filter==='All'||filter===section. anyLoading OR isPending; firstError first isError??null; retryAll refetch isError. Branches: anyLoading→4 skeletons; firstError→LoadFailed; else sections. Sessions→broadcast-history; Followers→chat-thread modal; Transactions status badge pending→'warning' else 'success'. visibleHits===0→EmptyState. Recent section when recent.length>0; tap setQuery, X forgetSearch. onSubmitEditing→rememberSearch(query).

## app/(app)/(tabs)/home/notifications.tsx — P1
isToday(iso): Date compare local Y/M/D. groupOf(item)=isToday?'TODAY':'EARLIER'. ⚠️ ...Utc field compared in LOCAL time (near-midnight wrong group). GROUPS=['TODAY','EARLIER']. Store selectors (11): items,unreadCount,hydrated,refreshing,refresh,markRead,markAllRead,hasMore,loadingMore,loadMore. handlePress(item): if isRead return; else markRead(id) (no nav). onEndReached: if hasMore&&!loadingMore loadMore(). RefreshControl refresh. Mark-all button only when unreadCount>0. InsightLine `${unreadCount} need your attention` vs "You're all caught up". !hydrated→6 skeletons; empty→"Nothing here yet."; else GROUPS.map filter groupOf, unread dot, disabled when isRead.
## app/(app)/(tabs)/home/_layout.tsx — P2 (Stack: index, notifications, search).

## app/(app)/(tabs)/live/index.tsx — P1 (UI shell over P0 hook)
useRouter, hasUnread=useNotificationStore(unreadCount>0), useGoLiveSetup() (priceValid NOT destructured). AgoraVideoView key=`golive-${videoKey}` only when videoAvailable&&cameraOn&&ready. Flip btn only when videoAvailable, disabled !cameraOn. Checklist lead "You're all set —" vs "Checking your setup —" on devicesReady. Price input strip non-digits maxLength 6; title maxLength 80; description maxLength 300. Category pills map CATEGORIES. Reward text tri-branch on activeRewards: null→"Checking your reward menu…", 0→"No rewards are turned on for this session.", else `${n} reward${n===1?'':'s'} ${n===1?'is':'are'} integrated in this session.`. CTA disabled !canGoLive→goLive; caption tri-branch (title empty→"Add a stream title to go live." else "Set a highlighted message price to go live." else visible line). ⚠️ dead styles backBtn, ctaNoteGreen.
## app/(app)/(tabs)/live/_layout.tsx — P2. business/_layout.tsx — P2 (index,transactions,withdraw). me/_layout.tsx — P2 (index,edit-profile,followers,messages,photos,settings,kyc-payouts).

## app/(app)/(tabs)/business/withdraw.tsx — P1
PLATFORM_FEE=20, PROCESSING_FEE=5, MIN_WITHDRAWAL=500, CHIPS=['25%','50%','100%','Custom']. availableTk param, useEarningsSummary, amount='', activeChip='100%'. available=`earnings?.availableTokens??(Number(availableTk)||0)`; parsed=`Number(amount)||0`; receives=`Math.max(0,parsed-25)` (parsed=500→475, 10→0); belowMinimum=`parsed>0&&parsed<500`. onChip(chip): setActiveChip; Custom→setAmount(''); else pct=parseInt/100, setAmount(String(floor(available*pct))). Amount onChangeText→setAmount+setActiveChip('Custom'). Submit disabled `parsed<=0||belowMinimum` → 🐞 router.back() ONLY, NO API (whole screen mock; linked-account hardcoded "No account linked").
## app/(app)/(tabs)/me/photos.tsx — P1 (UI shell over usePhotoGallery). COLUMNS=3,GAP=10. Image cachePolicy="none" (deliberate). Branches isLoading→6 skeletons, loadError→LoadFailed, empty→EmptyState, else grid+Add tile. AvatarPreview/PhotoViewer/ConfirmDialog overlays.
## app/(app)/(tabs)/calls/index.tsx — P1
ENTRIES: Group Sessions→group-call-history, Private Calls→private-calls, Broadcasts→broadcast-history. useGroupCallHistorySummary('all'), useBroadcastHistorySummary(), useProfile, useVerificationGate. subFor(title): Group `gcSummary?'${grouped(totalCalls)} hosted · ${grouped(totalRevenueTokens)} coins':'—'`; Private `!profile?{lead:'—'}:{lead:'Currently ',strong:on?'ON':'OFF',strongColor:on?'cyan':'pink'}` (on=acceptsPrivateCalls); Broadcasts `bcSummary?{lead:'${grouped(totalShows)} shows · ',strong:grouped(totalUniqueViewers),strongColor:'cyan',tail:' viewers'}:{lead:'—'}`. Schedule CTA guard→push schedule-session. Only Private Calls row gated (guard); history rows open directly.

## app/(app)/(modals)/_layout.tsx — P2. Fullscreen: live-broadcast-room, broadcast-summary, group-call-room, private-call-room, incoming-call-request. Modal: chat-thread, verify-number, change-password.
## app/(app)/(modals)/broadcast-summary.tsx — P1
statsOf(a): 4 rows Peak viewers grouped(peakViewerCount), Messages grouped(chatMessageCount), Reactions grouped(reactionCount), Rewards grouped(rewardOrderCount). broadcastId param, useBroadcastAnalytics, usePendingRewardOrders. owed=pendingOrders.filter(o=>o.broadcastId===broadcastId). toDashboard→router.replace('/(app)/(tabs)/home'). Earnings `totalRevenueTokens>0?'+'+grouped:'0'`. "REWARDS TO DELIVER" owed empty → `isLoading?'Checking for reward orders…':'Nothing left to deliver from this show.'`. Footer "View broadcast history"→replace broadcast-history. ⚠️ empty-state keys off analytics isLoading not orders query.
## app/(app)/(modals)/change-password.tsx — P2 (thin over useChangePassword). isDone success; 3 FormInputs maxLength 64; strength meter when newPassword.length; submit disabled !isValid||isDone.
## app/(app)/(modals)/incoming-call-request.tsx — P1
URGENT_SEC=5. Params requestId/fan/message/pricePerMinute/initialCharge/expiresAt. fanName=fan||'Someone'. secsUntilExpiry(): no expiresAt→24; else Math.max(0,floor((new Date(expiresAt)-Date.now())/1000)). State remaining, busy, settled ref. dismiss: if settled return; settled=true; canGoBack?back():replace('/(app)/(tabs)/calls/private-calls'). accept: guard settled||!requestId; setBusy('accept'); acceptRequest(requestId); success→settled=true, router.replace private-call-room {connection:JSON.stringify(res.data),fanName,ratePerMin:String(pricePerMinute)}; fail→showToast(error,'error'),setBusy(null). reject: rejectRequest(requestId,'Not available right now') (hardcoded), dismiss(). Countdown effect: setInterval 1000ms decrement; prev<=1→clearInterval,setTimeout(dismiss,800),return 0. urgent=remaining<=5. 🐞 hardcoded "first 5 minutes" copy; magic default 24; accept fail retryable, reject always dismisses.
## app/(app)/(modals)/verify-number.tsx — P2 (thin over useChangePhone). stage number/code; OtpInput self-submits on 6th digit; resend `canResend?resend:'Resend code in ${cooldownSec}s'`.

## Section 8 flags: goLive stale cameraOn/micOn; goLive reward-effect no cancellation; matching needle-not-lowered trap; useRecentSearches forget case-sensitive; notifications isToday local-vs-UTC; withdraw no-op submit (mock); incoming-call hardcoded 5min + magic 24; broadcast-summary empty-state wrong loading flag; live/index dead styles.
