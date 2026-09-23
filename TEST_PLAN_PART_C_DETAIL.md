# Part C — Full Monolith Breakdown (detail)

Companion to `TEST_PLAN.md`'s Part C summary table. Each file below was read in full (not sampled) before its split was proposed. All proposals are extraction-only — no logic, UI, style, or copy changes.

---

# Group 1 — Live / call room screens

Repo pattern context: `src/components/live/` (`StageControls.tsx`, `RoomStartGate.tsx`, `RoomPanel`, `RoundChip`, `ActivityRow`, `liveTokens`) is already consumed by `group-call-room.tsx` and `private-call-room.tsx` — partial decomposition already happened for those two. `live-broadcast-room.tsx` is the outlier: its own comment claims it uses the shared chrome, but it still hand-rolls its own inline chat/viewers panel, quick-controls cluster, and OFFLINE confirm gate instead of using `RoomPanel`/`StageControls`/`RoomStartGate` the way the other two rooms do. That duplication is a finding in its own right, independent of the split below.

## `app/(app)/(modals)/live-broadcast-room.tsx` — 849 lines

**Imports**: `Feather`, `expo-router`, RN core, `LinearGradient`; `AgoraVideoView` (@components/call), `ActivityRow, RoundChip` (@components/live), `BottomSheet, ConfirmDialog` (@components/shared), `Avatar, Text` (@components/ui); `broadcastApi`, `funWheelSpinsApi, rewardOrdersApi`, `activeBroadcastStore`, `broadcastHub`, Agora engine functions; types `BroadcastActivityItem, BroadcastViewer, StartBroadcastResponse`; theme/utils.

**Concerns found**:
- Config parsing: an IIFE `JSON.parse`s the `sessionConfig` route param into `{title, category, description, highlightedMessagePrice}`, swallowing parse errors, re-run every render.
- 19 `useState`s: identity/display, lifecycle (`status`, `awaitingConfirm`), session clock (`elapsed`), viewer metrics, activity feed, viewer roster, delivery queues (`pendingRewards, pendingSpins, fulfillingId`), chat composer, local media (`micOn, camOn, videoKey`), UI/panel state, moderation (`removingId`), end-flow, `errorBanner`.
- Refs: `idRef, startedRef, liveStartedRef, endedRef, chatRef, confirmResolveRef` (the last holds the Promise `resolve` that the "START SHOW" button unblocks — a hand-rolled async gate).
- Derived-inline (not memoized): `videoAvailable`, `sessionEarnings`, `sessionGifts`, `pendingCount`.
- `mergeActivity` — de-dupe-by-id + sort-by-`createdAtUtc`; the same pattern is independently reimplemented in group-call-room.tsx, private-call-room.tsx, and (a superset variant) chat-thread.tsx's `mergeMessages`.
- `refreshActivity` / `refreshViewers` / `refreshDeliveries` — three independent polling-fetch functions.
- The mount effect (~120 lines, the single largest concern): starts local preview immediately; declares 6 local timers; async IIFE that requests permissions, tries `activeBroadcastStore.get()` + `broadcastApi.rejoin()`, else awaits the hand-rolled confirm-gate Promise then `broadcastApi.start()` + persists via `activeBroadcastStore.save()`; a local `goLive` closure flips status, rebinds video, starts 5 intervals, connects `broadcastHub` with 4 handlers; `joinAsHost(...)` with a 4s failsafe timeout that also calls `goLive`. Cleanup resolves any pending confirm gate, clears all timers/intervals, disconnects the hub, destroys the Agora engine.
- `exitToSummary`, `endBroadcast`, `handleSendChat`, `fulfillReward`/`fulfillSpin`, `removeViewer`, `toggleMic`/`toggleCam` (the latter two call the imperative Agora setter as a side effect inside the `setState` updater).
- `deliveryRows` — a local function (not a component) rendering one delivery-card section, called twice.
- Render: header, error banner, video area + quick controls, inline chat panel, inline viewers panel, round action bar, Manage sheet, Session-stats sheet, `ConfirmDialog`, and a large inline "START SHOW" confirm overlay that duplicates `RoomStartGate`.
- `formatElapsed(t)` — module-scope pure helper, byte-identical copy in group-call-room.tsx and private-call-room.tsx.
- Constants: `ACTIVITY_POLL_MS=15000`, `VIEWERS_POLL_MS=5000`, `DELIVERIES_POLL_MS=12000`, `HEARTBEAT_MS=15000`.

**Side effects at module scope**: none beyond the pure helper/constants.
**Mutable module-level state**: none in this file (its dependency `agoraEngine.ts` holds `let rtc/engine/currentHandler/previewStarted` — external, needs mocking regardless of split).

**Split proposal**:
```
app/(app)/(modals)/live-broadcast-room.tsx        → thin screen: param parsing + mount
src/screens/live-broadcast-room/
  useLiveBroadcastSession.ts     — all refs, the mount effect, exitToSummary, endBroadcast,
                                    handleSendChat, fulfillReward, fulfillSpin, removeViewer,
                                    toggleMic, toggleCam, mergeActivity, the refresh* trio.
  useLiveBroadcastSession.types.ts
  formatElapsed.ts                — promote to shared (used 3×) rather than re-duplicate.
  LiveBroadcastRoomScreen.tsx     — pure render, consumes the hook.
  components/
    ChatPanel.tsx, ViewersPanel.tsx, DeliveryCard.tsx, SessionStatsSheet.tsx
```
Also (behavior-neutral): swap the inline chat/viewers panels and the inline "START SHOW" overlay for the already-existing `RoomPanel`/`RoomStartGate` — `group-call-room.tsx` proves the prop shape is compatible.

**Why testable**: `useLiveBroadcastSession` becomes testable with fake timers + mocked `broadcastApi`/`broadcastHub`/`agoraEngine`/`activeBroadcastStore`, independent of RN rendering — the rejoin-vs-fresh-start branch, the `goLive` double-fire guard (Agora callback vs. 4s timeout), the 5 interval lifecycles + cleanup, and the confirm-gate Promise are all directly assertable. `ChatPanel`/`ViewersPanel`/`DeliveryCard` become RNTL-renderable in isolation with fixture props.

## `app/(app)/(modals)/group-call-room.tsx` — 809 lines

**Imports**: same core set as file 1, plus `RoomPanel, RoomStartGate, StageControls` (already used here — further along the decomposition path than file 1), `groupCallApi`, `activeGroupCallStore, GroupCallDraft`, `groupCallHub`, types `GroupCallActivityItem, GroupCallConnectionResponse, GroupCallParticipant`, `callUi` theme tokens.

**Concerns found**:
- Module constants: `PENDING = new Set(['requested'])`, `CONNECTED = new Set([...])` (mirrors the web's exact status strings), `formatElapsed` (2nd copy), 4 poll/heartbeat constants.
- Config parsing: same IIFE pattern plus a second param `groupCallId` (entering a room someone else already created).
- 23 `useState`s — same shape as file 1 plus `participants`, `peak`, `busyUserId`, `startingRoom`.
- Refs: same 5 as file 1.
- Derived-inline: `pending`/`connected` participant filters via the module Sets, `sessionEarnings/sessionGifts/pendingCount`, `stageCopy` (3-way ternary recomputed every render).
- `mergeActivity` (3rd copy), `refreshActivity`/`refreshParticipants` (tracks `peak` via `Math.max`)/`refreshDeliveries`.
- The mount effect — same shape as file 1 plus a 3rd entry path (enter via already-created-but-not-started room via `existingId`). Sequence: permissions → rejoin-or-create-or-reuse-existing → persist a `GroupCallDraft` → preview camera (skipped for audio-only) → confirm-gate → `groupCallApi.start()` → connected: save connection, `goLive` (5 intervals, `groupCallHub.connect` with **6** handlers incl. `onParticipantRequested` toasting a nudge) → `joinAsHost` + 4s failsafe.
- `exitBack` (different fallback route than file 1), `abandonBeforeStart` (group-call-specific: cancels the not-yet-started room), `endCall`, `handleSendChat`, `approve/reject/remove/toggleMute` (4 participant-moderation handlers, each optimistic-then-API), `fulfillReward/fulfillSpin`, `toggleMic/toggleCam`, `deliveryRows` (3rd copy).
- Render: header, video area (3-way `stageCopy` placeholder), `StageControls` (shared), chat via `RoomPanel` (shared), participants panel via `RoomPanel` with two inline sub-sections (join requests, in-room list — not extracted), round bar, Manage sheet, Session-stats sheet (4 cells, one more than file 1), `ConfirmDialog`, OFFLINE gate via `RoomStartGate` (shared — what file 1 should also use).

**Side effects/mutable state**: none real, same caveats as file 1.

**Split proposal**:
```
app/(app)/(modals)/group-call-room.tsx     → thin screen shell
src/screens/group-call-room/
  useGroupCallSession.ts        — mount effect (rejoin/existingId/create/start/goLive/polling/
                                   hub wiring), exitBack, abandonBeforeStart, endCall,
                                   handleSendChat, fulfillReward, fulfillSpin, toggleMic,
                                   toggleCam, mergeActivity, refresh* trio.
  useParticipants.ts             — approve/reject/remove/toggleMute + PENDING/CONNECTED filters,
                                    decoupled so moderation logic tests without booting
                                    Agora/SignalR at all.
  useGroupCallSession.types.ts
  GroupCallRoomScreen.tsx
  components/
    ChatPanel.tsx (shareable with file 1's), ParticipantRow.tsx (parameterized by
    pending/connected mode), DeliveryCard.tsx (shared), SessionStatsSheet.tsx (4-cell variant)
```

**Why testable**: `useParticipants` isolates the approve/reject/remove/mute optimistic-update logic entirely from the mount effect. `useGroupCallSession` isolates the 3 distinct entry paths (create/rejoin/existingId) for fake-timer-driven testing. `ParticipantRow` becomes independently testable for both its pending and connected visual states.

## `app/(app)/(modals)/private-call-room.tsx` — 1195 lines

**Imports**: `RoomPanel, StageControls, live` tokens (no `RoomStartGate` — private calls connect immediately, no OFFLINE gate), `privateCallApi`, `activePrivateCallStore`, `privateCallHub`, Agora's `joinPrivateCallChannel` (symmetric Communication-profile join, distinct from `joinAsHost`), types `BroadcastActivityItem` (reused) and `PrivateCallConnectionResponse`.

**Concerns found** — the largest and most state-dense of the three rooms:
- Constants: `formatElapsed` (4th copy), `HEARTBEAT_MS`, `DELIVERIES_POLL_MS`, `ACTIVE_POLL_MS=3000` (private-call-specific backstop poll, mirrors the web's 3s active-session check).
- Params parsing: `connection` JSON param + plain `fanName`/`ratePerMin`.
- 21 `useState`s incl. **unique to this file**: `remoteUid, remoteVideoOn, remoteAudioOn` (renders the fan's remote stream, unlike files 1–2 which only show the artist's own camera), `cost: {minute, total}` (billing), `peerReconnecting`/`selfReconnecting` (two independent reconnect states).
- 7 refs incl. **unique**: `presenceStartedRef` (guards realtime/heartbeat/poll startup independent of the video-connected guard — because this file deliberately starts realtime *before* video connects), `lostReportedRef` (guards `reportConnectionLost` firing more than once per drop).
- `refreshDeliveries` here is more complex than files 1–2's: it also **synthesizes activity-feed rows from the reward/fun-wheel API responses** since there's no combined-activity endpoint for private calls.
- The mount effect: **no confirm-gate** (call is already accepted before this screen mounts); explicitly **decouples realtime from the video join** — `startRealtime()` runs unconditionally *before* `joinPrivateCallChannel`, with an inline comment citing a real prior bug ("Gating this on the video channel is exactly why the artist was receiving no gifts / fun-wheel spins"). `startRealtime` wires **9** hub handlers (incl. `onRewardPurchased`/`onFunWheelSpun` each building a pending-order object + activity entry inline + a toast) plus a 3rd interval (`activeTimer`, a backstop poll for a missed `PrivateCallEnded` event). `joinPrivateCallChannel`'s handlers include `onConnectionStateChanged` (unique — tracks the artist's *own* link dropping, calls `reportConnectionLost()` exactly once per drop).
- `endCall` (reason `'artist_ended'`), `fulfillReward/fulfillSpin` (uniquely also toast on failure), `toggleMic/toggleCam`, `deliveryRows` (yet another copy).
- Render (largest of the three): header w/ cost pill, **3** distinct conditional notice banners (error/endingNotice/peerReconnecting/selfReconnecting — vs. files 1–2's single error banner), fan's remote video with a 2-way placeholder branch, a **PIP** block for the artist's own camera (unique — files 1–2 only show one video surface), a corner "fan's mic is off" badge (unique), Activity panel via `RoomPanel`, 3-chip round bar (no stats chip, unlike files 1–2), `ConfirmDialog`. No Session-stats sheet.

**Split proposal** — deliberately **not** sharing a "room session" hook across all three rooms; the remote-peer/PIP model here is genuinely distinct:
```
app/(app)/(modals)/private-call-room.tsx      → thin screen shell
src/screens/private-call-room/
  usePrivateCallSession.ts       — full mount effect (connect-or-rejoin, onConnected,
                                    startRealtime incl. all 9 hub handlers + activeTimer
                                    backstop, joinPrivateCallChannel incl. self-reconnect
                                    reporting), exitBack, endCall, toggleMic, toggleCam,
                                    mergeActivity, refreshDeliveries (incl. its
                                    activity-synthesis logic).
  usePrivateCallSession.types.ts
  PrivateCallRoomScreen.tsx
  components/
    ConnectionBanners.tsx (all 4 notice conditions), FanStage.tsx (remote video +
    2-way placeholder + mic-off badge — the highest-branching piece, worth isolating),
    LocalPip.tsx, ActivityPanel.tsx, DeliveryCard.tsx (shared)
```

**Why testable**: `usePrivateCallSession` has the most branches per line of any file in the set (accept-vs-rejoin, presence-decoupled-from-video, self-vs-peer reconnect, the `activeTimer` backstop) and none of it is currently exercisable without full RN rendering. `FanStage` isolates the "camera off" vs. "waiting to connect" branch for direct RNTL assertion without any video engine involved.

## `app/(app)/(modals)/chat-thread.tsx` — 961 lines

Structurally different from the three rooms: a 1:1 message thread (poll + SignalR push), **already the best-decomposed file of the four** — most of its bulk is well-named, mostly-pure module-scope helper functions plus two already-extracted sub-components (`ActionRow`, `MessageRow`).

**Imports**: `expo-clipboard`, `expo-linear-gradient`, `react-native-toast-message` (**different toast mechanism** than the rooms' `showToast` util), `Skeleton` (@components/shared), `Avatar, Text` (@components/ui), `useProfile`, `useConversations` (@hooks/usePrivateMessages), `privateMessageApi`, `privateMessageHub` + payload types.

**Concerns found**:
- Constants: `POLL_MS=10000`, `PENDING_PREFIX='temp-'`, `PENDING_MATCH_WINDOW_MS=5min`.
- **Module-scope pure helpers (already extracted, not inline)**: `isPendingId`, `pendingTwinOf` (matches an optimistic placeholder to its confirmed server echo — sender type, exact text, reply target, 5-min window; long doc-comment on the 3 arrival sources this resolves), `mergeMessages` (**the most algorithmically dense function in any of these 4 files, currently zero test coverage** — merges by id, retiring the matched placeholder in place so `replyTo*` fields survive), `bubbleTime`, `dayKey`/`dayLabel`, `buildEntries`, `initialsFor`, `toast()`, `SKELETON_BUBBLES`.
- 13 `useState`s: thread data, composer, error, reply/edit mode, action-sheet target, forward flow, header menu.
- Refs: `scrollRef, inputRef, mounted, sendingRef` (plain ref, explicitly there to close a same-tick double-tap race `sending` state alone couldn't close), `initialScrollDone`.
- `nudgeScroll`, mount/unmount effect, `flashError` (auto-clears after 4s), `load` (fetch page 1/50, merge, mark read, one-time scroll nudge), poll effect (`load(true)` every `POLL_MS`), realtime effect (`onMessage` merges + nudges scroll for any sender incl. the artist's own other-session echo; `onDeleted` soft-deletes in place).
- `startReply/startEdit/cancelMode`, `handleCopy`, `confirmDeleteForEveryone/confirmDeleteForMe` (near-duplicate optimistic/rollback structure), `confirmDeleteChat`, `openForward/forwardTo`, `handleSend` (~90 lines, the most complex handler: edit path wraps in try/catch/finally with an explicit comment about a prior "spinning forever" bug; new-message path builds a `temp-` optimistic message, merges immediately, reconciles with the server id on success via `mergeMessages`, or rolls back on failure).
- Render: header, thread ScrollView (skeleton/empty/date-pilled entries via `MessageRow`), error bar, reply/edit strip, composer, 3 `Modal`s (action sheet, forward picker, header options).

**Split proposal** — smallest-risk of the four since the pure helpers are already module-scope, not closures:
```
app/(app)/(modals)/chat-thread.tsx        → thin screen shell
src/screens/chat-thread/
  useChatThread.ts                — all state/refs, nudgeScroll, flashError, load, both
                                     effects, mode handlers, handleCopy, both delete confirms,
                                     confirmDeleteChat, openForward, forwardTo, handleSend.
  useChatThread.types.ts
  messageMerge.ts                  — isPendingId, pendingTwinOf, mergeMessages,
                                      PENDING_PREFIX, PENDING_MATCH_WINDOW_MS — the single
                                      most test-worthy unit in the whole 4-file set, already
                                      pure, just not isolated as a module.
  threadFormatting.ts               — bubbleTime, dayKey, dayLabel, buildEntries, initialsFor.
  ChatThreadScreen.tsx
  components/
    MessageRow.tsx, ActionRow.tsx (lift out verbatim), ThreadSkeleton.tsx,
    ActionSheetModal.tsx, ForwardPickerModal.tsx
```

**Why testable**: `messageMerge.ts` can be unit-tested with plain Jest **today**, no RN/mocking needed — feed fixture message arrays and assert `pendingTwinOf` matches/doesn't-match on sender/text/reply-target/time-window, and `mergeMessages` retires exactly the right placeholder while preserving `replyTo*`. Highest-leverage single extraction in the whole audit given its own doc comments about prior flicker/double-post bugs.

**Cross-file note (all 4 files)**: `formatElapsed` is byte-identical across the 3 rooms; the dedupe/sort pattern is reimplemented 4 times independently; `deliveryRows` is duplicated verbatim in all 3 rooms. The split promotes each to one shared module rather than tripling the extraction.

---

# Group 2 — Profile / KYC / Settings screens

No `react-hook-form`/`zod` in any of these 3 — all form state is raw `useState`, all validation is ad-hoc regex/boolean composition.

## `app/(app)/(tabs)/me/edit-profile.tsx` — 1851 lines

**Imports**: `expo-image-picker`, `expo-image`, `expo-linear-gradient`, `react-native-svg`; hooks `useAvatarPicker`, `useCategories/usePhotos/useProfile/useSubcategories`, `useChangePasswordMutation/useChangeStageNameMutation/useDeletePhotoMutation/useSendChangePhoneOtpMutation/useUpdateCategoryMutation/useUpdateProfileMutation/useUploadPhotoMutation/useVerifyChangePhoneOtpMutation`; `AvatarPreview, LoadFailed, Screen, Skeleton`, `LucideIcon`.

**Concerns found**:
- Constants: `C` (hardcoded web-palette, explicitly *not* theme tokens), `GALLERY_COLS/GAP`, `RING_R/RING_CIRC`, `CALLOUT_TONE`.
- Already-local sub-components: `ProfileStrengthRing` (pure SVG), `Callout`, `FieldLabel/FieldRow`, `CategoryPicker`/`SubCategoryPicker` (self-contained modal pickers), `ProfilePictureSection`.
- `MobileNumberSection` — fully self-contained sub-flow: local `phone/phoneOtpStep/phoneOtp` state, `nationalDigits` helper (strips to last-10-digits, comment explains a past truncation bug), resync effect, `handleSendPhoneOtp`/`handleVerifyPhoneOtp` (10-digit / 6-digit OTP validation), `unchanged` comparison.
- `PwField`, `ChangePasswordSection` — self-contained: `open/oldPassword/newPassword/confirmPassword/showOld/New/Confirm`, `passRules` (3 rules: length≥8, has digit, has uppercase), `resetFields`, `handleUpdatePassword`, `disabled` derivation.
- Main component: 3 queries; 10-field form state (`stageName, categoryId, subcategoryId, workTime, bio, aboutMe, languages, skills, privateShowTokenPerMinute, groupShowTokenPerMinute`); `galleryWidth`-measured square-tile grid math; `avatar = useAvatarPicker()`; 5 mutations; prefill effect; `handleSelectCategory`; `isSaving`; `handleSave` (orchestrates 3 conditional/unconditional mutations, splits CSV fields, parses ints); `handleAddPhoto`/`handleDeletePhoto` (with `Alert.alert` confirm); `skillList` (`useMemo` CSV→array); completeness rule (`basicInfoDone/pricingDone/skillsDone/galleryDone`, each 25%); `strengthHeadline` (5-branch copy generator — high-value pure-function extraction target); `stepChip` render helper.
- **Dead code found**: ~165 lines of unreferenced styles (`previewHint, previewMedia*, previewBadge*, ...`) — likely leftover from an unbuilt "public preview" feature. Not a testability blocker, flagged for awareness.

**Side effects at module scope**: none real.

**Split proposal** (`src/screens/profile/edit-profile/`):
```
types.ts       — EditProfileFormState, tile-size type, CalloutTone.
schema.ts      — nationalDigits, the 3 passRules predicates, isValidNationalPhone/isValidOtp,
                 computeCompletenessPct, the 4 *Done predicates, computeStrengthHeadline
                 (the 5-branch copy generator) — e.g.
                 computeStrengthHeadline({skillsDone:false, galleryDone:false,...}) ===
                 'Add skills and a gallery photo to reach 100%', testable with zero rendering.
useEditProfile.ts             — queries, form state, prefill effect, handleSelectCategory,
                                 handleSave, handleAddPhoto, handleDeletePhoto, skillList,
                                 gallery tile-size math, completeness/headline wiring.
useMobileNumberSection.ts     — phone/OTP state, resync effect, both handlers, unchanged.
useChangePasswordSection.ts   — password-section state, resetFields, handleUpdatePassword.
components/
  ProfileStrengthRing.tsx, Callout.tsx (+ CALLOUT_TONE), CategoryPicker.tsx,
  SubCategoryPicker.tsx, ProfilePictureSection.tsx, MobileNumberSection.tsx (thin,
  using the hook), ChangePasswordSection.tsx (+ PwField, using the hook), Field.tsx
```

## `app/(app)/(tabs)/me/kyc-payouts.tsx` — 1478 lines

**Imports**: `expo-image-picker`, `expo-image`, `react-native-svg`; `useFocusEffect, useRouter`; `useQueryClient`; `useBankAccount, useKyc`; `kycApi`; `queryKeys`; `CalloutStrong, CalloutText, WebCallout` (@components/history).

**Concerns found**:
- Already-local: `PayoutReadinessEyebrow` (gradient SVG text — RN lacks `background-clip:text`), `Step`/`Stepper` (4-dot progress), `AccItem` (accordion shell), `Field`, `AccountTypeField` (modal dropdown, inline `options` constant worth naming), `UploadRow` (reused 3× — PAN front, Aadhaar front/back).
- Types: `BankDetails` (7 fields), `SectionResult` discriminated union.
- Main component: `useKyc`/`useBankAccount` queries; `useFocusEffect` (refetch + invalidate on every focus — comment explains admin-side approval means nothing else invalidates this); PAN/Aadhaar/bank form state; 6 document-URI + "removed"-flag states; 3 signed-view-URL states; 6 `useEffect`s (2 prefill panNumber/aadhaarNumber keyed on the *masked* value so a background refetch doesn't clobber live typing; 1 prefill bank details; 3 fetch signed view URLs, each guarded by `uploaded && !localUri`).
- **Validation primitives — the file's richest, most directly testable logic**: `isReadOnly`, has-doc flags, `*Unchanged` flags, `isPanNumberValid` (`/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/` or unchanged), `isAadhaarNumberValid` (`/^\d{12}$/`), `isAccountNumberValid` (`/^[0-9]{6,20}$/`), `doAccountNumbersMatch`, `isIfscValid` (`/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/`), name/bank-name trim checks, `panDone/aadhaarDone/bankDone`, `allFieldsValid` (10-condition AND), `missingReasons` — an array of **exact** user-facing messages (quoted verbatim in the detail so a test can assert them exactly, e.g. "Enter a valid IFSC code (e.g., SBIN0001234 — 4 letters, then 0, then 6 characters).").
- `steps/firstPending/remaining`, `kycState` (pure 4-branch state machine: approved/rejected/under_review/incomplete), `readinessHeadline` (pluralized copy), `stateCallout` (4-branch tone+body mapping incl. server rejection/admin-message fallback text).
- `pickImage(setUri, setRemoved)` (generic), `setBankField` (generic), `handleSaveAll` (guards on `allFieldsValid`; `Promise.all` of 3 independent section saves, each returning a `SectionResult`; invalidates 2 query keys; aggregates per-section failure toasts or one success toast).

**Split proposal** (`src/screens/kyc/payouts/`):
```
types.ts   — BankDetails, SectionResult, Step, ACCOUNT_TYPE_OPTIONS (lifted from AccountTypeField).
schema.ts  — PAN_REGEX/AADHAAR_REGEX/ACCOUNT_NUMBER_REGEX/IFSC_REGEX as named exports,
             isPanNumberValid/isAadhaarNumberValid/isAccountNumberValid/isIfscValid,
             buildMissingReasons({...}) returning the exact message array verbatim,
             computeKycState, computeReadinessHeadline. Exactly the
             "unit test the IFSC/account-number validation without rendering the screen" case.
useKycPayouts.ts   — all queries/effects, pickImage, setBankField, handleSaveAll, and every
                     derived value above (delegating pure rules to schema.ts).
components/
  PayoutReadinessEyebrow.tsx, Stepper.tsx, AccItem.tsx, Field.tsx,
  AccountTypeField.tsx (imports ACCOUNT_TYPE_OPTIONS), UploadRow.tsx,
  StateCallout.tsx (the kycState→{tone,body} mapping, as props)
```

## `app/(app)/(tabs)/me/settings.tsx` — 1303 lines

**Imports**: `react-native-svg`, `Modal/Switch`; `useFunWheel, useRewardMenu`; `queryKeys`; `settingsApi`; **`queryClient` imported directly as a singleton from `@services/queryClient`** (not `useQueryClient()` — unlike kyc-payouts.tsx; flagged since it means this screen's extracted hook can't inject a fresh `QueryClient` per test the way kyc-payouts.tsx's pattern allows, it has to mock the imported singleton module instead).

**Concerns found — two independent subsystems in one file**:
- `WheelVisual` — pure SVG 6-wedge conic-gradient replica (angle math from `webColors.wheelSlices`).
- **Reward Menu**: `RewardRow` type (`id: string|number` — string=server id, number=local temp id via `Date.now()` — a real, testable discriminator, named `isExistingRewardRow` in the proposal); `seedRewardRows`/reseed effect; `addRewardRow/removeRewardRow/updateRewardRow`; `saveRewards` (branches on the id-type discriminator, invalidates, toasts).
- **Fun Wheel**: `Slice` type; `slices` state; `addSlice` (caps at 20, toasts at the cap)/`removeSlice` (floors at 6, toasts at the floor); `updateSliceName/updateSliceWeight` (digit-sanitized); seed effect (falls back to 6 blank temp slices if the server has none); `refreshWheel`; `saveWheel` (validates name/price, persists every slice create-or-update, clamps weight via `Math.min(1000, Math.max(1, Math.trunc(...)))`); `toggleWheel` (optimistic, reverts on failure); `deleteConflict` state + `deleteWheel` (checks `res.conflict` → sets `deleteConflict` instead of a toast, vs. generic toast otherwise) + `turnOffInstead` (the conflict modal's alternate action); `totalWeight`/`sliceWinPercent` (`(weight/totalWeight*100).toFixed(1)`, divide-by-zero guarded via `|| 1`).
- Render: single-tab pill, Reward Menu section (inline `.map()` rows), divider, Fun Wheel section (`WheelVisual` + inline `.map()` activity rows), a bottom `Modal` for the delete-conflict popup.

**Split proposal** (`src/screens/settings/settings/`):
```
types.ts    — RewardRow, Slice.
schema.ts   — MIN_ACTIVITIES=6, MAX_ACTIVITIES=20, canAddSlice/canRemoveSlice,
              sanitizeDigits, clampWeight (the exact clamp rule), computeTotalWeight,
              sliceWinPercent, isValidWheelName, isValidWheelPrice, isExistingRewardRow.
useSettings.ts   — both queries, all reward-row state/handlers, all fun-wheel
                   state/handlers, dedelegating pure rules to schema.ts. Mocks the
                   imported `queryClient` singleton directly (see the note above).
components/
  WheelVisual.tsx, RewardTableRow.tsx (extracted from the inline .map()),
  ActivityRow.tsx (fun-wheel row, extracted from its inline .map()),
  DeleteWheelConflictModal.tsx ({visible, message, onClose, onConfirm, confirming})
```

---

# Group 3 — Calls list / business / schedule screens

None of these 6 have module-scope side effects or mutable module-level state of their own.

## `app/(app)/(tabs)/calls/private-calls.tsx` — 1145 lines

No react-query — this screen fetches manually via `useEffect` + service calls, unlike the other 5 in this group.

**Concerns**: pure helpers `secondsUntil`, `formatCallDuration`, `historyStatusMeta(status, endReason) → {label, tone}`, `TONE_FILL/TONE_INK` maps, `HistorySkeletonRow`; settings/requests/active-call/history state groups; 7 effects (1s countdown interval, mount-only profile load, mount-only active-call check writing into `activePrivateCallStore`, requests refresh+8s poll, history refresh, load-more pagination w/ ref-guarded dedupe, `onEndReached` wiring); `handleSaveSettings`, `acceptRequest`/`declineRequest`.

**Split proposal** (`src/screens/calls/privateCalls/`): `types.ts`; `format.ts` (secondsUntil, formatCallDuration, historyStatusMeta, TONE_FILL/TONE_INK, the 3 timing constants — e.g. `historyStatusMeta('terminated','admin_terminated') → {label:'Ended by admin', tone:'neutral'}`); `usePrivateCalls.ts` (settings/requests/history state+effects+handlers); `components/PendingRequestRow.tsx`, `HistoryRow.tsx` (+`HistorySkeletonRow`).

## `app/(app)/(tabs)/business/index.tsx` — 998 lines (Earnings Dashboard)

**Concerns**: `SOURCE_PIE_COLORS`/`pieColor()`; `TwoColGrid` (measured-width 2-col layout, a good pure-logic extraction target), `StatTile`(+`STAT_ACCENT`), `TrendChart` (per-bar % height w/ a 4%-floor), `SourcePieChart` (SVG donut — per-segment `len`/`dashoffset` math via an accumulator closure), `GlowOverlay`, `HelpTip` (reused ~10×); `useEarningsSummary()`; `LoadingBody`/error/success render branches.

**Split proposal** (`src/screens/business/earnings/`): `format.ts` (pieColor, SOURCE_PIE_COLORS, and a new pure `pieSegments(sources, totalTokens)` extracted from `SourcePieChart`'s segment math — testable for segment lengths/gaps/color-cycling-past-8/zero-total edge case without any SVG rendering; hoist the legend's inline `pct` calc here too); `useEarningsDashboard.ts`; `components/StatTile.tsx, TrendChart.tsx, SourcePieChart.tsx, HelpTip.tsx, GlowOverlay.tsx, TwoColGrid.tsx, LoadingBody.tsx`.

## `app/(app)/(tabs)/calls/schedule-session.tsx` — 996 lines

**Concerns**: a large inline `web` style-token constant (pure data); pure helpers `pad2`, `maskTime` (digit-masking to HH:MM), `normalizeTime` (clamped/zero-padded) — prime unit-test targets, e.g. `normalizeTime('930') === '09:30'`; memoized `Field/BoxInput/ModeButton/GschedSwitch`; 10-field form state; a mount-only redirect effect (if a call is already active); derived `todayIso/todayLabel/potential/missing[]/canSchedule/checklist[]`; `schedule()` (sequential per-field validation **partially duplicating** the `missing`/`canSchedule` gate — flagged, not fixed — then `groupCallApi.create` + `Promise.all` of 2 soft-fail setters + `activeGroupCallStore.saveDraft` + redirect).

**Split proposal** (`src/screens/calls/scheduleSession/`): `types.ts`; `format.ts` (pad2, maskTime, normalizeTime); `useScheduleSession.ts` (all state/effect/derived/`schedule()`); `components/Field.tsx, BoxInput.tsx, ModeButton.tsx, GschedSwitch.tsx`; `webTokens.ts`.

## `app/(app)/(tabs)/calls/broadcast-history.tsx` — 684 lines

**Concerns**: `PAGE_SIZE=20`; pure helper `analyticsTiles(a): Tile[]` (builds the 5-tile breakdown incl. computed `barPct` — substantial, directly testable); `ListSkeleton/AnalyticsSkeleton`; 5 react-query hooks (`useBroadcastHistoryPaged` infinite, `useBroadcastHistorySummary`, `usePendingRewardOrders`, conditional `useBroadcastAnalytics(expandedId)`, `useFulfillRewardOrderMutation`); `toggleAnalytics`, `handleFulfill`; a **stale-analytics guard** (`analytics.broadcastId !== item.broadcastId`) on the expanded detail; the row's meta-line is an inline string concatenation (extraction target).

**Split proposal** (`src/screens/calls/broadcastHistory/`): `format.ts` (analyticsTiles + a new `broadcastMetaLine(item)`); `useBroadcastHistory.ts`; `components/BroadcastRow.tsx` (incl. the stale-analytics guard), `PendingRewardsCard.tsx`, `ListSkeleton.tsx`, `AnalyticsSkeleton.tsx`.

## `app/(app)/(tabs)/business/transactions.tsx` — 626 lines

**Concerns**: pure helpers `txIconType`, `TX_ICON/TX_TINT`, `txBadgeClass`, `FILTERS`, `PAGE_SIZE=25`; `TxDescription` (branches by `sourceType`), `TxRow`, `TxRowSkeleton`; **two independently-sourced derivations that must NOT be conflated** (documented in the real comments, must be preserved verbatim in any refactor): the 4 summary tiles come from the server-aggregated `useEarningsSummary()`, *not* from loaded pages, while `filtered` is a client-side filter over only the already-loaded pages from `useEarningsTransactionsPaged`.

**Split proposal** (`src/screens/business/transactions/`): `types.ts`; `format.ts` (txIconType, TX_ICON/TX_TINT, txBadgeClass, FILTERS, PAGE_SIZE — e.g. `txIconType('fun_wheel_spin') === 'wheel'`); `useTransactions.ts` (composes both queries + the filter state + both derivations, carrying forward the "summary ≠ loaded-pages" comment); `components/TxRow.tsx, TxDescription.tsx, TxRowSkeleton.tsx`.

## `app/(app)/(tabs)/calls/group-call-history.tsx` — 611 lines

**Concerns**: `PAGE_SIZE=20`, `FILTERS`; pure `statusChip`/`statusChipInk` (status→style mapping); `useGroupCallHistoryPaged(filter, PAGE_SIZE)` (refetches on filter change), **filter-scoped** `useGroupCallHistorySummary(filter)` (unlike transactions.tsx's fixed summary), `useGroupCallAnalytics(expandedId)`; `toggleExpand`; same **stale-analytics guard** pattern as broadcast-history.tsx; a templated `earningsHint` string; a **"Revenue breakdown" 3-row array literal rebuilt on every expand-render** (clear hoist target) with a zero-guarded `pct` calc.

**Split proposal** (`src/screens/calls/groupCallHistory/`): `format.ts` (statusChip/statusChipInk, FILTERS, PAGE_SIZE, plus new `groupCallMetaLine(item)`, `earningsHint(item)`, `revenueBreakdownRows(analytics)` — all fixture-testable); `useGroupCallHistory.ts`; `components/GroupCallRow.tsx, AnalyticsDetail.tsx (6 MetricChips incl. warn-tone thresholds + revenueBreakdownRows), ListSkeleton.tsx, AnalyticsSkeleton.tsx`.

**Cross-file note (Group 3)**: the "stale analytics" guard appears twice (broadcast-history, group-call-history) and could share one helper. The inline row "meta line" concatenation pattern appears in 3 files, differently shaped each time.

---

# Group 4 — Home / me / live-tab / messages / search / followers / shared history primitives

## `app/(app)/(tabs)/home/index.tsx` — 442 lines — **verdict: reasonably cohesive, split optional**

No local `useState`, no `useEffect` at all — purely 4 hooks (`useEarningsSummary, useBroadcastHistory(5), useFollowers, useVerificationGate`) + 2 zustand selectors, derived into a small view-model and rendered. The only two extractable pure pieces: `buildSummaryCells(earnings, recentShows)` (currently an inline array literal) and the `renderSkeleton()` block (zero logic dependency on the rest of the screen, ~50 lines). Everything else is single-purpose JSX not worth splitting further.

## `app/(app)/(tabs)/me/index.tsx` — 445 lines

The one file in this group with real business logic buried in the component body: an IIFE `kycPill` switch (profile.kycStatus → pill text, 4 branches), `stats` (4 derived cells from 3 different query results), `accountRows` (injects live subtitles onto 2 static rows), `handleLogout`, `renderRow` (reused for 2 sections), static `ACCOUNT`/`ACTIVITY` constant data (with a comment explaining an intentionally-hidden row).

**Split proposal** (`src/screens/profile/me/`): `useMeScreen.ts` (confirmingLogout, handleLogout, kycPill/stats/accountRows derivations — isolates the kycStatus switch for direct unit tests); `meRows.ts` (ACCOUNT/ACTIVITY constants + types); `MeRow.tsx` (extracted `renderRow`).

## `app/(app)/(tabs)/live/index.tsx` — 606 lines — most logic-dense file in this group

**Concerns**: `CATEGORIES` (6 static strings); form/device-toggle/preview-lifecycle state incl. `activeRewards`, `camReady/micReady` (simulated device-readiness), `goingToRoomRef` (short-circuits cleanup when navigating into the live room so the warm Agora engine isn't torn down). **`useFocusEffect` #1**: refetches the reward menu on every focus (not just mount). **`useFocusEffect` #2** (the big one): redirect-if-already-broadcasting check, else request permissions + start preview + rebind video twice (once immediately, once after a 700ms timeout "to bind the surface"); cleanup destroys the engine **unless** `goingToRoomRef.current` — has an intentional `eslint-disable` on its dep array (excludes `cameraOn`/`micOn` deliberately so toggles don't restart the whole preview). Two more `useEffect`s simulate camera/mic "readiness" via 1400ms timers. `toggleCamera/toggleMic` (call the Agora setters as a side effect), `goLive` (guards, sets `goingToRoomRef`, pushes with a JSON-stringified `sessionConfig`). Derived `priceValid/canGoLive/caption` (multi-branch)/`devicesReady`.

**Split proposal** (`src/screens/live/goLive/`): `useGoLiveSetup.ts` (all state, both focus effects, both readiness effects, both togglers, `goLive`, derived values) — isolates the redirect-if-live / warm-engine-handoff / two-readiness-timer logic, currently untestable without mounting the whole screen and mocking `activeBroadcastStore`/`settingsApi`/Agora; `types.ts`; `CATEGORIES.ts`.

## `app/(app)/(tabs)/me/messages.tsx` — 587 lines

**Concerns**: pure helpers `colorFor` (char-sum hash→color), `initialsFor`, `relativeTime` (now/Xm/Xh/Xd/date-fallback); `StatusPill` (already extracted); message-settings modal state (`settingsOpen/price/saving`); a prefill effect (only when `profile?.privateMessagePrice` is truthy); `saveSettings` (no optimistic flip on failure, by explicit design — error toast leaves state untouched); `openThread`; derived `conversations/unread/acceptsMessages`; conversation-row JSX (avatar/name/"You: " prefix logic/relative time/unread badge); the full Settings `Modal`.

**Split proposal** (`src/screens/profile/messages/`): `formatters.ts` (colorFor, initialsFor, relativeTime, AVATAR_COLORS); `useMessageSettings.ts` (settingsOpen/price/saving, prefill effect, saveSettings); `ConversationRow.tsx`; `MessageSettingsModal.tsx`.

## `app/(app)/(tabs)/home/search.tsx` — 533 lines

**Concerns — the densest actual business logic in this group**: `matches(haystack, needle)` (pure substring check); `BADGE_LABEL`/`BADGE_TONE` maps (**independently duplicated with slightly different values** in followers.tsx — flagged, not silently fixed); a recent-searches subsystem (`mmkvStorage`-backed load effect, `persistRecent`, `rememberSearch` dedupe+prepend+slice, `forgetSearch`); **three `useMemo` matching pipelines** (`sessionHits/followerHits/transactionHits`) — each filters a full dataset by `needle` across multiple fields, or slices to `SECTION_LIMIT` when no query — currently untestable without rendering the screen and mocking 3 hooks; `show(section)/anyLoading/visibleHits/firstError/retryAll`.

**Split proposal** (`src/screens/home/search/`): `matching.ts` (matches, BADGE_LABEL, BADGE_TONE, SECTION_LIMIT, and the three filter predicates extracted as plain functions `filterSessions/filterFollowers/filterTransactions(all, needle)` — **the single highest-value extraction in this whole audit**: turns "does search work" into fixture-testable pure functions with zero React/query mocking); `useRecentSearches.ts` (recent state, load effect, persistRecent/rememberSearch/forgetSearch, mockable against `mmkvStorage` alone).

## `app/(app)/(tabs)/me/followers.tsx` — 537 lines

**Concerns**: `RADIUS/RADIUS_LG`, 4 tooltip hint strings (verbatim from web `data-tooltip` attrs), `BADGE_LABEL`/`BADGE_TINT` (the sentence-case counterpart to search.tsx's uppercase version — same divergence noted from the other side); pure helpers `followerInitials`, `formatFollowedAgo` (today/yesterday/N days/N months/N years branching — a strong date-bucket unit-test target with a fixed `Date.now()`), `activityText` (branches on `interactionCount > 0`); single `useFollowers()` call, no local state/effects (pull-to-refresh via RN's `RefreshControl` alone); `messageFollower`; the follower-card JSX (avatar-image-vs-gradient-initials branch).

**Split proposal** (`src/screens/profile/followers/`): `formatters.ts` (followerInitials, formatFollowedAgo, activityText, BADGE_LABEL/BADGE_TINT, hint strings); `FollowerCard.tsx`. No `useFollowersScreen.ts` hook warranted — only one query, no local state.

## `src/components/history/index.tsx` — 895 lines — shared presentation-primitives library, NOT a screen

A flat library of ~15 independent exported components (not one monolithic component). The one real algorithmic piece is `TwoColGrid` (measures `rowWidth` via `onLayout`, computes `cellWidth = (rowWidth - gap) / 2`, maps children into fixed-width wrappers — documented rationale: CSS Grid's 2-col collapse can't be replicated with `flexGrow` because a lone trailing item would stretch full-width). `clampPct` (`Math.max(0, Math.min(100, Math.round(value)))`) is a pure helper reused by `MetricTile`/`BreakdownRow`, currently only reachable by importing the whole 895-line module. `HelpIcon` is the only other stateful export (tap-open/backdrop-close tooltip). The other ~12 exports (`PageHead, FilterPills, WebCallout/CalloutText/CalloutStrong/LearnLink, SummaryStrip/SummaryCell, ListHead, HistoryCard/CardDetail, MetricGrid/MetricChip/MetricTile, BreakdownRow, WebEmptyState`) are pure prop→JSX, no logic to isolate. The exported `styles` (~430 lines) is part of this module's public surface — other files may import it directly.

**Split proposal**: `helpers.ts` (clampPct, re-exported from `index.ts` for backward compat — testable as `clampPct(-5)===0, clampPct(150)===100, clampPct(42.6)===43`); `TwoColGrid.tsx` (isolates the one real layout-logic piece); `HelpIcon.tsx` (isolates the one stateful, interactive piece). Keep `index.tsx` as a barrel re-exporting everything so `followers.tsx` and other history screens are unaffected. Grouping the remaining 12 stateless exports into 2–3 files is a size/organization improvement only, not a testability one — optional.
