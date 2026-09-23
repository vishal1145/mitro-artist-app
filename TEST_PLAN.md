# Mitro Artist App — Test Plan

Status: **Part B (setup) verified. Part C (testability refactor) applied and verified. Part D (full file-by-file audit) complete — ⏸ awaiting your review before Part E (writing tests) begins.**

This file is the only task list for this effort (see the working agreement). Every source file will end up in a module section below or in "Excluded" with a reason. Nothing here is invented — every item traces to a real file and a real function/branch that was actually read.

---

## Part B — Stack & Setup (confirmed)

### B0 — Stack

- **Framework**: React Native via **Expo (SDK 54, managed workflow with continuous native generation)** — `app.json` present, `android/` is a generated prebuild output (has `.gradle`, `build/`), not hand-maintained native code. `expo-router` (typed routes, file-based) is the navigation library.
- **RN version**: 0.81.5. **React**: 19.1.0. **New Architecture**: enabled (`newArchEnabled: true`).
- **Language**: TypeScript, `strict: true`, `noUnusedLocals`/`noUnusedParameters`/`noFallthroughCasesInSwitch` all on. ESLint bans `any`, `console.*` (logger only), inline styles, and color literals.
- **State management**: Zustand (`src/store/*`) for client state (auth, app/onboarding, incoming-call watcher, notifications). **@tanstack/react-query** for server state (all the `use*` data hooks).
- **Forms**: no `react-hook-form`/`zod` usage found in the screens audited so far despite both being dependencies — the large form screens (edit-profile, kyc-payouts, settings) all use raw `useState` + inline validation. `react-hook-form`/`zod` usage, if any, will be confirmed file-by-file in Part D.
- **Styling**: NativeWind v4 (Tailwind for RN) + a hand-rolled `src/theme` token system (colors/spacing/typography) used directly in `StyleSheet.create`.
- **Real-time**: `@microsoft/signalr` — five hubs (`broadcastHub`, `groupCallHub`, `notificationHub`, `privateCallHub`, `privateMessageHub`), each a thin `connect(id, handlers)`/`disconnect()` wrapper with its own module-level `HubConnection`.
- **Video/audio**: `react-native-agora` v4 — the artist is always the **publisher** (broadcaster in live/group calls, symmetric peer in private calls). Wrapped by `src/services/agora/agoraEngine.ts`, which lazily `require()`s the native module (see C1 below) and exposes `joinAsHost`, `joinPrivateCallChannel`, `leaveChannel`, `destroyAgoraEngine`, mute/camera-flip helpers, and an event-handler bridge.
- **Push**: `@react-native-firebase/messaging` (+ `/app`) — permission, token registration, and foreground/background-tap/quit-tap listeners, all in `src/services/push/pushNotifications.ts`. `expo-notifications` is a declared dependency and an `app.json` plugin (notification icon/color) but **no import of it was found** in any file read so far — flagged ⚠️ for Part D to confirm whether it's genuinely unused or just not yet reached.
- **Storage**: `mmkvStorage` (non-sensitive) is **actually AsyncStorage under an MMKV-shaped async API** — `react-native-mmkv` is *not* a dependency; the code comment explains this is deliberate (Expo Go compatibility today, swappable later). `secureStorage` wraps `expo-secure-store` for tokens only (access/refresh).
- **HTTP**: `axios`, one instance with interceptors (Bearer attach, HTTPS enforcement, single-flight 401 refresh-and-retry) and one bare instance reserved for the refresh call itself.
- **Confirmed absent**: no `@react-native-community/netinfo` (no NetInfo-based offline detection anywhere), no `react-native-callkeep`/`notifee`/`incall-manager`, no `expo-keep-awake` (see the mobile-requirements gap noted under C1/Part D risk list below), no charting library (earnings charts in `business/index.tsx` are hand-rolled SVG).

### B1–B2 — Install & jest.config.js

- `@testing-library/react-native` (^13.2.0 — matchers are built into the main entry in v13, no `/extend-expect` needed), `jest` (^29.7.0), `jest-expo` (~54.0.0, resolved 54.0.17), `react-test-renderer` (19.1.0) were already devDependencies. Added `@types/jest` (^29.5.14) so `tsc --noEmit` type-checks test files.
- `jest.config.js` created: `preset: 'jest-expo'`; `transformIgnorePatterns` extended beyond jest-expo's default to also transform `@microsoft/signalr`, `@react-native-firebase/*`, `react-native-agora`, `react-native-toast-message`, and the nativewind/RN-ecosystem packages (all ship untranspiled ESM); `moduleNameMapper` mirrors every alias in `babel.config.js`'s `module-resolver` / `tsconfig.json`'s `paths` (`@components`, `@navigation`, `@screens`, `@hooks`, `@services`, `@store`, `@utils`, `@constants`, `@static`, `@theme`, `@app-types`, `@assets`) plus image/`.css` stubs; `collectCoverageFrom` set to `src/**` + `app/**` + `plugins/**`, excluding tests/mocks/types/pure barrel files (mirrors "Excluded" below — kept in sync by hand).

### B3 — Environment variables

Confirmed by reading `src/constants/app.ts`: `API_CONFIG.baseUrl`/`timeoutMs` read `process.env.EXPO_PUBLIC_API_BASE_URL`/`EXPO_PUBLIC_API_TIMEOUT_MS` first, then fall back to `Constants.expoConfig.extra.apiBaseUrl`/`apiTimeoutMs` (from `app.json`'s `extra` block), then a hardcoded default. `ALLOW_INSECURE_HTTP` is `true` only when the env var is the exact string `'true'`. `AGORA_APP_ID` reads `EXPO_PUBLIC_AGORA_APP_ID` directly (empty string fallback). `src/services/api/mock.ts`'s `USE_MOCK` has a three-way precedence: `'false'` forces off, `'true'` forces on, otherwise falls back to `extra.useMock`.

**Proved with a real test against the real source** (`src/__tests__/sanity.test.tsx`, "B7 sanity — environment variables…" describe block — see B7 below): the app.json-mirrored fallback, the env-var override, and the exact `'true'`-string gate on `ALLOW_INSECURE_HTTP` all pass.

### B4 — `jest.setup.ts` (native module mocks)

Every native module the app imports (confirmed either by direct `grep` across the ~85%-staged source tree, or defensively from `package.json` where a file importing it hasn't been read yet — flagged below) is mocked:

- **Storage**: `@react-native-async-storage/async-storage` (official mock, backs `mmkvStorage`), `expo-secure-store` (in-memory `Map`, exported as `mockSecureStoreState` so a test can assert exactly what was persisted).
- **Navigation**: `expo-router` — `useRouter` (exported `mockRouter` with `push/replace/back/canGoBack/setParams/navigate/dismiss/dismissAll` spies), `useLocalSearchParams`/`useGlobalSearchParams`/`useSegments` (overridable per test), `useFocusEffect` (runs the effect once synchronously — a test exercising focus/blur timing specifically overrides this), `Stack`/`Tabs`/`Link`/`Redirect` as pass-through stubs. `react-native-gesture-handler/jestSetup`, `react-native-reanimated/mock`, `react-native-worklets` (runOnJS/runOnUI as passthrough), `react-native-safe-area-context` (fixed inset/frame), `react-native-screens` (`enableScreens` stubbed).
- **Network**: no NetInfo mock — package isn't a dependency (see B0). If Part D finds an offline/online UI path that isn't SignalR/Agora-connection-state-driven, that's an ⚠️/🐞 candidate, not a missing mock.
- **Permissions/media**: `expo-image-picker` (permission + picker result, default granted+cancelled, per-test override), `expo-image`/`expo-linear-gradient`/`expo-blur` (rendered as plain `View`/`Image`), `expo-clipboard`, `expo-file-system`, `expo-haptics`, `expo-device`, `expo-local-authentication`, `expo-linking` — the last five mocked defensively (package.json dependencies) even though no staged file imports them yet.
- **Push**: `@react-native-firebase/app` + `/messaging` — `getToken`/`requestPermission`/`getInitialNotification` mocked, and `onMessage`/`onNotificationOpenedApp`/`onTokenRefresh` capture their handler into an exported `mockMessagingHandlers` object so a test can fire "foreground message", "tapped from background", and "token refreshed" by calling the captured handler directly. `expo-notifications` is **not** mocked — see the B0 ⚠️ on whether it's actually reachable; if Part D finds a real import, a mock will be added then rather than mocked speculatively now.
- **Calls**: `react-native-agora` — `createAgoraRtcEngine()` returns an exported `mockAgoraEngine` object with every method `agoraEngine.ts` calls (`initialize/setChannelProfile/registerEventHandler/unregisterEventHandler/startPreview/stopPreview/enableVideo/enableLocalVideo/enableLocalAudio/setClientRole/joinChannel/leaveChannel/release/muteLocalAudioStream/muteLocalVideoStream/switchCamera`), plus the `ChannelProfileType`/`ClientRoleType`/`ConnectionStateType`/`RemoteVideoState`/`RemoteAudioState` enums `agoraEngine.ts` and the room screens read. A test simulates `onJoinChannelSuccess`/`onUserJoined`/etc. by grabbing the handler object passed to `registerEventHandler.mock.calls` and invoking it directly. No `react-native-callkeep`/`incall-manager` — not dependencies; incoming-call UI is handled by `useIncomingCallStore`'s polling + the in-app `IncomingCallOverlay`, not native CallKit/ConnectionService integration.
- **Real-time**: `@microsoft/signalr` — `HubConnectionBuilder` mock builds one shared `mockHubConnection` per `.build()` call (reset every `afterEach`), exposing `.trigger(event, ...)`/`.triggerReconnected()`/`.triggerReconnecting()`/`.triggerClose()` test helpers alongside the real `start/stop/invoke/on/off/onreconnected/onreconnecting/onclose` surface.
- **Others**: `react-native-toast-message` (`Toast.show`/`Toast.hide` spies), `@expo-google-fonts/*` (numeric stand-in font ids for the ~10 weights `app/_layout.tsx` loads), `expo-font`/`expo-splash-screen`/`expo-status-bar`/`expo-system-ui`.
- **Core RN**: `AppState.addEventListener` spied + an exported `fireAppStateChange('background'|'active'|'inactive')` helper; `Alert.alert` spied + an exported `pressAlertButton(title, buttonText)` helper (finds the matching `Alert.alert` call by title, presses the named button's `onPress`). `BackHandler`/`Keyboard`/`Platform.OS` are not yet given dedicated helpers — none of the files read so far branch on them explicitly; Part D will add helpers the moment a file needs one (the Android-back-during-live-call requirement in particular will need this — currently unconfirmed whether any of the 3 room screens actually intercept the hardware back button, see the Part D risk list).
- Console noise: only two exact warning patterns are silenced (`Animated: useNativeDriver`, `new NativeEventEmitter`); everything else still fails the test loudly.
- `afterEach`: `jest.clearAllMocks()`, clears `mockSecureStoreState`, rebuilds `mockHubConnection`, clears the captured messaging handlers — so no test can leak state into the next.

### B5 — `test-utils/renderScreen.tsx`

Wraps exactly the non-router providers the real `app/_layout.tsx` mounts: `GestureHandlerRootView` → `SafeAreaProvider` (fixed test insets/frame) → `ThemeProvider` (react-navigation, `DarkTheme` — matches the real app's `navigationTheme`) → `QueryClientProvider` (a **fresh** `QueryClient` per render, `retry: false`, so tests don't wait out react-query's default retry/backoff). Deliberately does **not** include font loading, the auth-redirect guard, or the push/Agora bootstrap sequence, or render `NotificationToastHost`/`IncomingCallOverlay` — those belong to `app/_layout.tsx`'s own test, not every screen's. `mockRouter`/the `expo-router` mock live in `jest.setup.ts` (global, not part of this wrapper) since router state needs to be assertable per-test (`expect(mockRouter.push).toHaveBeenCalledWith(...)`).

### B6 — package.json scripts

Added `"test": "jest"`, `"test:watch": "jest --watch"`, `"test:coverage": "jest --coverage"`. `npm run typecheck` (`tsc --noEmit`) **passes cleanly** against the full `src/`+`app/` tree plus the new test files (confirmed — see below; two pre-existing gaps fixed along the way: `src/types/images.d.ts` needed staging for the `@static/images/*.jpeg` ambient module declaration to resolve, and one `jest.setup.ts` unused-value lint caught by `noUnusedLocals`, fixed by switching a type-only reference to `import('react').ReactNode`).

### B7 — Sanity check (real command output)

`src/__tests__/sanity.test.tsx`, run via `npm test` — **10/10 passing**:

```
PASS src/__tests__/sanity.test.tsx
  B7 sanity — environment variables read through real source code
    ✓ falls back to the app.json extra.apiBaseUrl when EXPO_PUBLIC_API_BASE_URL is unset
    ✓ EXPO_PUBLIC_API_BASE_URL overrides the app.json fallback, exactly as the real precedence comment describes
    ✓ ALLOW_INSECURE_HTTP is false unless EXPO_PUBLIC_ALLOW_INSECURE is exactly "true"
  B7 sanity — native module mocks load and behave like the real thing
    ✓ mmkvStorage (AsyncStorage-backed) round-trips a value
    ✓ secureStorage (expo-secure-store mock) round-trips a value via the exported in-memory map
    ✓ the Agora engine mock is reachable and isAgoraAvailable() reflects it
    ✓ the SignalR HubConnectionBuilder mock builds a connection whose handlers can be triggered
    ✓ pushNotifications loads without throwing and no-ops setupListeners() outside login
  B7 sanity — test-utils renders a real app component through the real provider stack
    ✓ renders LucideIcon (a real, unmodified src/ component) without throwing
    ✓ plain RNTL render (no custom providers) still works, proving the mock chain does not require renderScreen to function

Test Suites: 1 passed, 1 total
Tests: 10 passed, 10 total
```

Note on scope: only a subset of `src/`/`app/` had been staged into the sandbox at the moment this was written, so the render check targets a real, already-available leaf component (`LucideIcon`) rather than a full routed screen. By the time this section was finalized essentially the whole tree had been pulled in resolving transitive imports (see Part D's file count), so the first real screen test (Part E) will use `renderScreen` against an actual route.

**Files delivered to your project folder**: `jest.config.js`, `jest.setup.ts`, `test-utils/fileMock.js`, `test-utils/styleMock.js`, `test-utils/renderScreen.tsx`, `src/__tests__/sanity.test.tsx`, and an updated `package.json`/`package-lock.json` (scripts + `@types/jest`). No application source file was touched.

---

## Part C — Testability check (✅ applied and verified)

### C1 — Side effects on import

Checked every service/store/root-layout file read so far. The codebase is **already well-behaved** here — `agoraEngine.ts` lazily `require()`s `react-native-agora` inside a function (`loadRtc()`), never at module scope; SignalR hubs only build a `HubConnection` inside their `connect()` method; Zustand `create(...)` calls run at import time but only allocate state, they don't do I/O. Two minor, harmless items:

- `src/services/api/client.ts` calls `logger.warn`/`logger.error` at module scope if the configured base URL isn't HTTPS (explicitly by design — the comment explains an earlier version *threw* here and crashed the app on launch instead).
- `app/_layout.tsx` calls `SplashScreen.preventAutoHideAsync()` at module scope (standard Expo pattern, mocked in `jest.setup.ts`).

Neither blocks testing and neither needs a refactor.

### C2/C3 — Monolith files (>400 lines) and the split proposal

**20 files exceed the 400-line threshold**, several by a wide margin. Real line counts (`wc -l` against the actual files):

| File | Lines | Priority (provisional) |
|---|---:|---|
| `app/(app)/(tabs)/me/edit-profile.tsx` | 1851 | P0 |
| `app/(app)/(tabs)/me/kyc-payouts.tsx` | 1478 | P0 |
| `app/(app)/(tabs)/me/settings.tsx` | 1303 | P1 |
| `app/(app)/(modals)/private-call-room.tsx` | 1195 | P0 |
| `app/(app)/(tabs)/calls/private-calls.tsx` | 1145 | P0 |
| `app/(app)/(tabs)/business/index.tsx` | 998 | P0 |
| `app/(app)/(tabs)/calls/schedule-session.tsx` | 996 | P0 |
| `app/(app)/(modals)/chat-thread.tsx` | 961 | P1 |
| `src/components/history/index.tsx` (shared, not a screen) | 895 | P1 |
| `app/(app)/(modals)/live-broadcast-room.tsx` | 849 | P0 |
| `app/(app)/(modals)/group-call-room.tsx` | 809 | P0 |
| `app/(app)/(tabs)/calls/broadcast-history.tsx` | 684 | P1 |
| `app/(app)/(tabs)/business/transactions.tsx` | 626 | P1 |
| `app/(app)/(tabs)/calls/group-call-history.tsx` | 611 | P1 |
| `app/(app)/(tabs)/live/index.tsx` | 606 | P0 |
| `app/(app)/(tabs)/me/messages.tsx` | 587 | P1 |
| `src/components/ui/LucideIcon/index.tsx` | 558 | P2 (icon library — see note) |
| `app/(app)/(tabs)/me/followers.tsx` | 537 | P1 |
| `app/(app)/(tabs)/home/search.tsx` | 533 | P1 |
| `app/(app)/(tabs)/me/index.tsx` | 445 | P1 |
| `app/(app)/(tabs)/home/index.tsx` | 442 | P1 (marginal — see note) |

None of the 20 have module-scope side effects or mutable module-level singletons of their own (the mutability that exists — the Agora engine's `let engine`/`rtc`, the two `active*Call` store singletons — lives in already-separate service files, mocked in B4).

**Full per-file breakdown — imports, every distinct state group/effect/handler found by actually reading the file, and an exact proposed split (new file paths, what moves where, why it becomes testable)** — is long (it covers all 20 files in real detail) and is kept in a companion doc rather than pasted into this table-of-contents file: **`TEST_PLAN_PART_C_DETAIL.md`**, in the same folder. Headline pattern across all 20: pull non-JSX logic (state, effects, handlers, validation, formatting) into a colocated `use<Name>.ts` hook — mirroring the pattern already used by `src/screens/auth/login/{schema,types,useLogin}.ts` and `src/screens/profile/change-password/{schema,types,useChangePassword}.ts` elsewhere in this codebase — plus a `schema.ts`/`format.ts` for pure validation/formatting rules, plus extracting genuinely reusable sub-blocks (a list row, a modal body, a status-mapping function) into their own component files. Two things worth your attention specifically:

- **Duplication across the three "room" screens** (`live-broadcast-room.tsx`, `group-call-room.tsx`, `private-call-room.tsx`): `formatElapsed()` is byte-identical in all three; the activity-feed dedupe/merge logic is reimplemented independently in each (a 4th variant, `mergeMessages`, lives in `chat-thread.tsx`); a `deliveryRows` reward/fun-wheel card renderer is copy-pasted verbatim in all three. `live-broadcast-room.tsx` also doesn't use the already-extracted `RoomPanel`/`StageControls`/`RoomStartGate` shared components that `group-call-room.tsx` does, despite a comment claiming it does — it inlines ~150 lines of near-duplicate chrome instead. The split proposal promotes the duplicated logic to one shared module each rather than tripling the extraction.
- **`LucideIcon` (558 lines) and `home/index.tsx` (442 lines)** are flagged in the table for completeness but the detail doc recommends **not** force-splitting them: `LucideIcon` is a single-purpose SVG icon library (one large conditional render, no hidden logic) and `home/index.tsx` has no local state or effects at all — it's a pure `4 hooks → derive a small view-model → render` screen. Splitting either would be organizational, not testability-driven.

### C4 — Refactor applied (approved)

You approved the full split. It has been applied, verified, and committed to your project folder.

**What changed**: 19 of the 20 flagged files were split into `src/screens/...` modules (hooks + pure `schema.ts`/`format.ts` modules + sub-components), following the existing `src/screens/auth/login/{schema,types,useLogin}.ts` colocation convention. `home/index.tsx` (442 lines) was left unsplit — it has no local state or effects of its own, so the split was optional per the C2/C3 note above and judged not worth the risk relative to the other 19. Two additional shared modules were introduced to remove the cross-file duplication flagged in C2/C3: `src/utils/formatElapsed.ts` (previously byte-identical in all three room screens) and a shared `DeliveryCard` in `src/components/live/`. `src/components/history/index.tsx` was split into `helpers.ts` (`clampPct`), `TwoColGrid.tsx`, `HelpIcon.tsx`, and `styles.ts`, with `index.tsx` kept as a barrel re-exporting everything — every existing `@components/history` import site was grepped and confirmed to still resolve.

**Scale**: 146 files changed — 126 new files, 20 modified (the 19 split screens plus the shared `history`/`live` barrel updates). Full list and diff are in the local git history of the working copy this was built in; the file list itself is reproducible by diffing the pre-refactor and post-refactor commits.

**How it was done**: read every real file in full (not from the summary in `TEST_PLAN_PART_C_DETAIL.md`, which was treated as a guide, not ground truth) before moving anything. Pure code motion only — no conditional logic, arithmetic, copy/text, prop values, or styling was changed. A few small, explicitly-flagged deviations from the literal plan, each noted because it changed the plan's *file layout* (never its logic): a shared `DeliveryCard` where the three rooms' card shells turned out to be byte-identical (plan had proposed one per screen); a small `colors.ts`/`styles.ts` per screen folder in a couple of cases so extracted sub-components could share the original `StyleSheet.create`/palette without duplicating it. The `BADGE_LABEL`/`BADGE_TONE` divergence between `search.tsx` and `followers.tsx` flagged in C2/C3 was confirmed real (uppercase+tone-string in one, sentence-case+tint-pair in the other) and deliberately **not** reconciled — each screen kept its own copy, exactly as instructed. Dead/unreferenced styles found in `edit-profile.tsx` (~165 lines, likely leftover from an unbuilt feature) were left in place, unreferenced, in the new `styles.ts`.

**Verification performed** (real commands, not estimates):
- `npx tsc --noEmit` against the full combined refactor (all 19 files, from all 4 parallel workstreams merged together) — **0 errors**.
- `npx jest` — the B7 sanity suite still **10/10 passing**, unchanged.
- A local git repo was used purely as a diffing aid during the refactor (baseline commit before, one commit after) to enumerate exactly what changed; `git diff --stat` confirms 146 files changed, matching the file-by-file report from each split.

**What this means for Part D**: the file-by-file audit below is written against the *new* file layout. Each split screen's checklist will reference its `use*.ts` hook(s) and `schema.ts`/`format.ts` module(s) as the primary unit-testable surface, with the thin screen component itself getting a lighter render-level test. `home/index.tsx` is audited in its original, unsplit form.

### Risks/gaps noticed in passing (not yet confirmed — Part D will verify each)

- ⚠️ No `expo-keep-awake` dependency anywhere — the "screen stays awake during a live broadcast/private call" mobile requirement may have no implementation. Needs confirming once the three room screens are read in full for Part D (their `useFocusEffect`/mount-effect logic is already summarized in the detail doc and doesn't mention it).
- ⚠️ No file read so far intercepts the Android hardware back button (`BackHandler`) during a live/call screen — "Android back button during live/call → confirmation, not a silent end" (a D6 integration-flow requirement) needs explicit confirmation or a 🐞.
- ⚠️ `expo-notifications` is a dependency + `app.json` plugin but has no confirmed import yet.
- Two stray files in `.agent2-backup/` (`kyc-payouts.beforeRebuild.tsx`, `transactions.beforeRebuild.tsx`, and smaller-size backups of `followers.tsx`/`settings.tsx`) look like leftovers from an earlier, unrelated refactor attempt — not imported anywhere, proposed for **Excluded**.

---

## Excluded (provisional — finalized in Part D)

- `.agent2-backup/**` — stale backup directory, not part of the app bundle, not imported anywhere.
- `src/types/**` — type-only declarations, nothing to execute.
- Barrel/re-export files with no logic of their own: `src/constants/index.ts`, `src/store/index.ts`, `src/services/storage/index.ts`, `src/services/api/index.ts`, `src/theme/index.ts`, `src/utils/index.ts`, `src/components/live/index.ts`, `src/components/shared/index.ts`, `src/components/ui/index.ts`.
- `expo-env.d.ts`, `nativewind-env.d.ts` — ambient type declarations.

---

## Part D — Full file-by-file audit (✅ complete — ⏸ STOP for your review)

Every testable source file was read **in full** (no sampling) and given a per-file entry — path, exports, exhaustive behavior checklist with exact rules/messages/routes/timers, priority tag, and any bugs/dead-code noticed. The complete per-file detail (long) is in the companion doc **`TEST_PLAN_PART_D_DETAIL.md`**, 8 sections. This section is the index + summary + the decision you need to make.

### D1 — Real file count

`find src app -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v __tests__ | grep -v .agent2-backup | wc -l` → **343** testable source files. (Plus the 6 test-infra files from Part B and the `.agent2-backup/` stray files, which are Excluded — see below. Grand total on disk therefore exceeds 343; the 343 is the audit universe.)

### D2 — Summary table (module × files × priority × status)

Priority is the audit's own tagging (P0 = auth/money/call-connection critical path or broadly-reused pure logic; P1 = other real branching logic; P2 = trivial presentational / type-only / barrel / thin wrapper). File counts are from the real `find` above and **sum to 343**.

| Module | Files | P0 | P1 | P2 | Status | Detail § |
|---|---:|---:|---:|---:|---|---|
| `src/constants` | 3 | 1 | 1 | 1 | audited ✅ | 1 |
| `src/utils` | 11 | 7 | 2 | 2 | audited ✅ | 1 |
| `src/theme` | 4 | 0 | 2 | 2 | audited ✅ | 1 |
| `src/store` | 5 | 3 | 1 | 1 | audited ✅ | 1 |
| `src/types` | 7 | 0 | 0 | 7 | **Excluded** (type-only) | 1 |
| `src/navigation` | 2 | 0 | 1 | 1 | audited ✅ | 1 |
| `src/services/api` | 20 | 9 | 9 | 2 | audited ✅ | 2 |
| `src/services/agora` | 2 | 2 | 0 | 0 | audited ✅ | 2 |
| `src/services/push` | 1 | 1 | 0 | 0 | audited ✅ | 2 |
| `src/services/realtime` | 5 | 4 | 1 | 0 | audited ✅ | 2 |
| `src/services/storage` | 3 | 2 | 0 | 1 | audited ✅ | 2 |
| `src/services/*` (broadcast/groupCall/privateCall/queryClient) | 4 | 1 | 2 | 1 | audited ✅ | 2 |
| `src/hooks` | 16 | 12 | 4 | 0 | audited ✅ | 3 |
| `src/screens/auth` | 16 | 15 | 0 | 1 | audited ✅ | 4 |
| `src/components/shared` | 45 | 6 | 14 | 25 | audited ✅ | 5 |
| `src/components/ui` | 14 | 2 | 5 | 7 | audited ✅ | 5 |
| `src/components/live` | 9 | 3 | 3 | 3 | audited ✅ | 5 |
| `src/components/history` | 5 | 1 | 2 | 2 | audited ✅ | 5 |
| `src/components/call` + root (`AppSplash`) | 2 | 0 | 1 | 1 | audited ✅ | 5 |
| `src/screens/kyc` | 11 | 2 | 2 | 7 | audited ✅ | 6 |
| `src/screens/settings` | 8 | 2 | 1 | 5 | audited ✅ | 6 |
| `src/screens/profile` | 33 | 8 | 12 | 13 | audited ✅ | 6 |
| `src/screens/calls` | 25 | 6 | 8 | 11 | audited ✅ | 7 |
| `src/screens/business` | 15 | 3 | 5 | 7 | audited ✅ | 7 |
| `src/screens/chat-thread` | 10 | 2 | 3 | 5 | audited ✅ | 7 |
| `src/screens/live-broadcast-room` | 6 | 2 | 1 | 3 | audited ✅ | 7 |
| `src/screens/group-call-room` | 7 | 3 | 1 | 3 | audited ✅ | 7 |
| `src/screens/private-call-room` | 7 | 2 | 2 | 3 | audited ✅ | 7 |
| `src/screens/live` | 3 | 1 | 0 | 2 | audited ✅ | 8 |
| `src/screens/home` | 2 | 0 | 2 | 0 | audited ✅ | 8 |
| `app/**` (routes: layouts, tab/modal screens, auth route files) | 42 | 8 | 14 | 20 | audited ✅ | 4, 8 |
| **Total** | **343** | **~110** | **~99** | **~134** | | |

(P0/P1/P2 columns are the audit's judgment and are approximate at the margins — the per-file detail doc is authoritative per file. The point of the tally: roughly **a third of the tree is genuinely-branching logic worth P0/P1 tests**, a third is trivial-presentational/type/barrel needing at most a smoke test or exclusion.)

### D3 — Excluded (finalized)

- `.agent2-backup/**` — stale backup dir, not imported, not bundled.
- `src/types/**` (7 files) + `expo-env.d.ts`, `nativewind-env.d.ts` — type-only/ambient declarations, zero runtime.
- Pure barrel/re-export files with no logic: `src/constants/index.ts`, `src/store/index.ts`, `src/services/*/index.ts`, `src/theme/index.ts`, `src/utils/index.ts`, `src/components/*/index.ts` (the `src/components/history/index.tsx` barrel is a special case — it re-exports `clampPct`/`TwoColGrid`/`HelpIcon` which ARE tested via their own new files; the barrel itself just needs an "exports resolve" smoke check).
- Thin route wrappers under `app/` that are 1-line `export { default } from '@screens/…'` (the four modal room screens) — covered by their `@screens/**` targets; the wrapper itself needs no separate test.
- Trivial presentational sub-components (marked P2 in the detail doc): tested, if at all, with a single "renders with expected props" smoke test — not an exhaustive checklist.
- These exclusions are mirrored in `jest.config.js`'s `collectCoverageFrom`.

### D4 — Top 5 riskiest areas (where tests matter most)

1. **The three room-session hooks** (`useLiveBroadcastSession`, `useGroupCallSession` + `useParticipants`, `usePrivateCallSession`) — the densest branching in the app: confirm-gate promises, 5-interval `goLive` lifecycles, 4–9 SignalR handlers each, Agora join + failsafe timeouts, teardown, and (private-call) the deliberately-decoupled `startRealtime`-before-video ordering with once-only reconnect guards. Highest concentration of "silent money/connection loss" failure modes.
2. **Auth + app bootstrap** (`useOtp` state machine, `useLogin`/`useRegister`/`useResetPassword`, `app/_layout.tsx`'s bootstrap sequence + `useAuthGuard` redirect table) — every user starts here; the OTP lockout/resend/attempts logic and the token-gated redirect branches are exact-behavior-critical. Note the confirmed 🐞: `useOtp.resend()` never resets the attempt counter.
3. **KYC/payout validation** (`kyc/payouts/schema.ts` + `useKycPayouts`) — real Indian PAN/Aadhaar/IFSC/account regexes and the exact `buildMissingReasons` message set gate whether an artist can get paid. Confirmed 🐞: masked "unchanged" values get POSTed back to the server; `bankDone` = holder-name-only diverges from `allFieldsValid`.
4. **Money formatting + earnings math** (`utils/format` `compactCount`/`grouped`/`formatTokens`, `business/earnings/format.ts` `pieSegments`, `chat-thread/messageMerge.ts`) — pure but pervasive; a rounding/segment/dedupe bug shows up as wrong coins on every screen. `messageMerge` is the single highest-leverage pure extraction (has its own prior-bug comments).
5. **The axios interceptor stack** (`services/api/interceptors.ts` — Bearer attach, HTTPS enforcement, single-flight 401 refresh-and-retry) — one bug here logs the whole app out or leaks an insecure request. P0, and the single-flight refresh is genuinely tricky concurrent logic.

Cross-cutting mobile-requirement gaps confirmed during the audit (⚠️, not yet 🐞 — surfaced for you): **no `expo-keep-awake`** (screen may sleep mid-broadcast), **no `BackHandler` interception** during live/call screens (Android back may silently end a session), **`expo-notifications` declared but unimported**, and several **mock/stub screens** (`business/withdraw.tsx` "Request Payout" does nothing, `incoming-call-request` hardcodes "first 5 minutes"). These are product decisions to confirm, not test targets.

### D5 — Sanity harness still green

`npx tsc --noEmit` clean and `npm test` **10/10** (the B7 suite) after the Part C refactor — the harness Part E will build on is verified working (see Part B / C4).

---

## Next step — your review (STOP)

Part D is done: all 343 files audited, summary table above, full per-file detail in `TEST_PLAN_PART_D_DETAIL.md`. Per the working agreement I'm **stopping here for your review before writing any tests (Part E)**.

Two things would help most before I start Part E:
1. A quick skim of the **Top 5 riskiest areas** and the **⚠️ bug/gap findings** — some are real product decisions (keep-awake, Android back button, the mock withdraw screen, the `useOtp.resend` attempt-reset bug) that you may want to weigh in on, since under the working agreement I'll mark them 🐞 and write `it.failing(...)` tests rather than "fixing" them.
2. Confirmation you're happy with the **P0→P1→P2 priority ordering** for Part E (I'll process P0 first: utils/storage → api/interceptors → services/hubs → hooks → the room-session hooks + auth, then P1, then P2), or tell me to reprioritize.

Say the word and I'll begin Part E (writing real tests, one file at a time, green-before-moving-on, mutation-checking each P0 file, printing the one-line progress format after each).
