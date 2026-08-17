# Mitro Artist

Production Expo (SDK 54, New Architecture) scaffold — Expo Router v6, React 19 +
React Native 0.81, strict TypeScript, Zustand + React Query, Axios with token
refresh, expo-secure-store for tokens, AsyncStorage for non-sensitive data
(Expo Go friendly), and a tokenized UI kit.

## Prerequisites

- Node 20+ and npm
- Expo Go (SDK 54 build) on your phone, or an Android/iOS simulator

## Install & run

```bash
cd Mitro-Artist-App
rm -rf node_modules package-lock.json   # first time on SDK 54, to clear the old SDK 51 install
npm install
npx expo start -c                       # -c clears the Metro cache after the upgrade
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS).

> First run generates `.expo/types` for typed routes; give it a moment.

## Scripts

```bash
npm run start       # expo start
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # eslint (no-any, no-console, no-inline-styles enforced)
npm run format      # prettier
```

## Architecture

- `app/` — Expo Router routes (file = route). Root layout wires providers +
  auth guard. `(auth)` = unauthenticated, `(app)/(tabs)` = authenticated.
- `src/screens/**` — per-screen **logic** (`schema.ts`, `types.ts`,
  `useX.ts`). Screens under `app/` are **UI only** and hold no logic.
- `src/components/ui` — atoms (Text, Button, Input, Card, Badge).
- `src/components/shared` — molecules (Screen, Header, Loader, EmptyState,
  FormInput, PasswordStrengthMeter, OtpInput).
- `src/services/api` — Axios client, interceptors (bearer, HTTPS enforcement,
  401 refresh + retry), endpoints, typed `authApi` (Result<T> pattern).
- `src/store` — Zustand slices (`authStore`, `appStore`).
- `src/theme` — colors, typography, spacing tokens.
- `src/utils` — `responsive` (wp/hp/rf), `logger`, `errorHandler`,
  `validators`.

Absolute imports use path aliases (`@components`, `@screens`, `@services`,
`@store`, `@utils`, `@constants`, `@theme`, `@types`, `@assets`).

## Configuration

API base URL is read from `EXPO_PUBLIC_API_BASE_URL` (see `.env.example`),
falling back to `app.json` → `expo.extra.apiBaseUrl`
(`https://api.mitro.app`, a stub). HTTPS is enforced in the Axios layer.

## Notes / known constraints

- **Storage (Expo Go):** non-sensitive persistence uses **AsyncStorage**, which
  works in Expo Go with no native build. The interface in
  `src/services/storage/mmkvStorage.ts` is **async** (every method returns a
  Promise). When you move to an EAS dev build you can swap the implementation
  for `react-native-mmkv` behind the same async signatures — no caller changes.
  Tokens always live in `expo-secure-store`.
- **Assets:** icon/splash PNGs are omitted; see `assets/README.md`. Expo Go
  runs fine with defaults; add them before an EAS build.
- **Reanimated 4:** SDK 54 ships Reanimated v4, which requires the separate
  `react-native-worklets` package and its Babel plugin
  (`react-native-worklets/plugin`, already wired in `babel.config.js` as the
  last plugin). If you add animations, import worklets from there.
- **NativeWind** is configured (layout utilities) but the UI is styled with
  `StyleSheet`. If a bundling error ever mentions `nativewind` /
  `react-native-css-interop`, the quickest fix is to remove NativeWind (unused)
  or pin Reanimated — but 4.1.x + Reanimated 4 is the supported SDK 54 combo.
