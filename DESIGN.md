# Mitro Artist — Design System

**Refero style used:** **Dovetail** (dovetail.com) — Refero style id `bfe919de-a9a1-4551-bcf7-4d49facc26bd`

Mitro Artist shares one design system with **Mitro Admin** and **Mitro User**. Typography, spacing, radius and shadows follow the Refero style "Dovetail". **Colors come from the project, not from Refero.** Anything marked **[adapted]** is not in Dovetail; it fills a gap for a dense app UI.

> **This repository (Mitro-Artist-App) is the React Native / Expo app.** The CSS file names, `var(--token)` syntax and `index.html` snippet below describe the web design system the app mirrors. In this codebase the same tokens live in `src/theme/` as TypeScript, see **section 10, React Native mapping**.

Source of truth in code:

| File | What it holds | Scope |
|---|---|---|
| `src/typography.css` | Font families, weights, the full type scale (`--text-*`, `--leading-*`, `--tracking-*`), `--text-xs` | Global (`:root`) |
| `src/design-tokens.css` | Colors, spacing, radius, shadows, sizes, layout widths, motion | Scoped (see section 8) |
| `src/login.css`, `src/auth-split.css` | Login, Sign up, Forgot password, OTP, Reset password | `.artist-login-screen`, `.register-page`, `.auth-public-page` |

This file explains how to use them. It is identical in spirit to the Admin and User `DESIGN.md`.

---

## 0. Mandatory rules (humans and AI assistants)

Before any UI work on Mitro Artist, **always follow this file and the design tokens.**

1. **Never** hardcode `font-size`, `color`, `spacing` (margin / padding / gap), `border-radius`, `box-shadow`, `font-family`, `font-weight`, `line-height` or `letter-spacing`. Use `var(--token)` only.
2. If the value you need has no token, **stop and add a token** to `design-tokens.css` (and to the table below) first. Do not inline a one-off value.
3. Do not use colors from Refero or any external reference. Colors are project tokens only (`--color-*`).
4. Use only the allowed fonts: **Inter** (`--font-sans`) and **JetBrains Mono** (`--font-mono`). No other fonts.
5. Do not introduce new radii. Cards, buttons, inputs and images use `--radius-base`; pills use `--radius-circle`; true circles (avatars, dots) use `--radius-round`.
6. Depth comes from surface steps and 1px borders. Use shadows only for floating layers (dropdowns, modals, toasts).
7. No `font-weight` above 600 (Inter loads 400 / 500 / 600; JetBrains Mono loads 400).
8. No gradients other than `--color-primary-gradient`.
9. New screens are built from tokens first. Legacy rules in `styles.css` that still use literals are migrated screen by screen; a screen is only "done" when it contains no literals.

---

## 1. Typography (the main subject of this file)

### 1.1 Fonts

| Token | Value | Use |
|---|---|---|
| `--font-sans` | Inter, ui-sans-serif, system-ui, sans-serif | All UI text |
| `--font-mono` | JetBrains Mono, ui-monospace, monospace | Labels, IDs, timestamps, counts, badges |

Both are free on Google Fonts and load in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
```

`body` uses `var(--font-sans)`. Buttons and inputs must inherit it: `font-family: inherit`.

### 1.2 Weights

| Token | Value | Use |
|---|---|---|
| `--font-weight-regular` | 400 | Body text, table cells, mono text |
| `--font-weight-medium` | 500 | Buttons, nav items, values |
| `--font-weight-semibold` | 600 | Titles, numbers |

### 1.3 Type scale (Dovetail)

| Role | Size token | Line height | Letter spacing |
|---|---|---|---|
| Display | `--text-display` 56px | `--leading-display` 1.14 | `--tracking-display` -0.036em |
| Heading large | `--text-heading-lg` 40px | `--leading-heading-lg` 1.29 | `--tracking-heading-lg` -0.031em |
| Heading | `--text-heading` 24px | `--leading-heading` 1.33 | `--tracking-heading` -0.025em |
| Subheading | `--text-subheading` 20px | `--leading-subheading` 1.40 | `--tracking-subheading` -0.021em |
| Body | `--text-body` 16px | `--leading-body` 1.50 | `--tracking-body` -0.012em |
| Small **[adapted]** | `--text-small` 14px | `--leading-small` 1.40 | `--tracking-small` -0.012em |
| Mono (labels) | `--text-mono` 12px | `--leading-mono` 1.40 | `--tracking-mono` +0.071em |
| Mono large | `--text-mono-lg` 14px | `--leading-mono-lg` 1.40 | `--tracking-mono-lg` +0.083em |
| Extra small (alias) | `--text-xs` = `--text-mono` 12px | | smallest UI text: captions, badges, meta |

Always set size, line height and letter spacing as a trio from the same role.

### 1.4 What to use where

| Element | Font | Size token | Weight | Notes |
|---|---|---|---|---|
| Page title ("Dashboard", "Earnings") | sans | `--text-heading` | semibold | `--leading-heading`, `--tracking-heading` |
| Page subtitle | sans | `--text-small` | regular | `--color-text-muted` |
| Card / section title | sans | `--text-body` | semibold | `--leading-body`, `--tracking-body` |
| Stat number (earnings, followers) | sans | `--text-heading` | semibold | tabular numbers, `--color-text` |
| Stat label ("TOTAL EARNED") | mono | `--text-mono` | regular | Uppercase, `--tracking-mono`, `--color-text-muted` |
| Table header | mono | `--text-mono` | regular | Uppercase, `--tracking-mono`, `--color-text-dim` |
| Table cell (primary) | sans | `--text-small` | regular | `--color-text` |
| Table cell (secondary) | sans | `--text-small` | regular | `--color-text-muted` |
| Sidebar nav item | sans | `--text-small` | medium | Active uses `--color-primary-gradient` |
| Button label | sans | `--text-small` | medium | See buttons |
| Badge / status chip | mono | `--text-mono` | regular | Uppercase |
| Timestamps, IDs, usernames, counts | mono | `--text-mono` | regular | `--color-text-dim` |
| Input text / placeholder | sans | `--text-small` | regular | Placeholder `--color-text-dim` |
| Form label | mono | `--text-mono` | regular | Uppercase, `--tracking-mono`, `--color-text-muted` |
| Helper / error text | sans | `--text-xs` | regular | `--color-text-dim` / `--color-danger` |
| Empty-state title | sans | `--text-body` | semibold | |
| Empty-state description | sans | `--text-small` | regular | `--color-text-muted` |
| Modal title | sans | `--text-subheading` | semibold | |
| Login / Sign up hero heading | sans | `--text-heading-lg` | semibold | Auth screens only |
| Auth card heading | sans | `--text-heading` | semibold | "Welcome Back", "Create Your Account" |
| Story kicker (auth) | mono | `--text-mono` | regular | Uppercase, `--color-brand-pink` |

`--text-display` is reserved for marketing-style screens. Do not use it inside the dashboard.

---

## 2. Color tokens (project)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#060513` | Page background |
| `--color-bg-deep` | `#08071a` | Deepest areas, sidebar backdrop |
| `--color-stage` | `#0d0c1f` | Stage / content backdrop |
| `--color-surface` | `rgba(20,18,38,.72)` | Default card / panel |
| `--color-surface-strong` | `rgba(27,23,48,.94)` | Modals, popovers, raised panels |
| `--color-surface-soft` | `rgba(255,255,255,.045)` | Inputs, inset blocks, chips |
| `--color-surface-hover` | `rgba(255,255,255,.06)` | Hover state of rows / items |
| `--color-border` | `rgba(255,255,255,.10)` | Default border |
| `--color-border-soft` | `rgba(255,255,255,.06)` | Dividers inside cards |
| `--color-border-strong` | `rgba(255,255,255,.16)` | Emphasised / hovered borders |
| `--color-border-brand` | `rgba(255,72,181,.38)` | Active / selected border |
| `--color-text` | `#f7f4ff` | Primary text |
| `--color-text-muted` | `#a99dc4` | Secondary text |
| `--color-text-dim` | `#6c6288` | Tertiary text, placeholders |
| `--color-text-faint` | `#4b4368` | Disabled text |
| `--color-brand-pink` / `-purple` / `-violet` | `#ff3fad` / `#8c4dff` / `#6b2df4` | Brand accents |
| `--color-primary-gradient` | pink to violet, 135deg | Primary buttons, active nav |
| `--color-on-primary` | `#1a0a14` | Text on solid pink |
| `--color-success` (+ `-bg`, `-border`) | `#35eea3` | Live, approved, positive |
| `--color-warning` (+ `-bg`, `-border`) | `#ffc86b` | Pending |
| `--color-danger` (+ `-bg`, `-border`) | `#ff5c7a` | Errors, destructive |
| `--color-info` (+ `-bg`, `-border`) | `#33e6ff` | Informational, focus ring |
| `--color-accent` (+ `-bg`, `-border`) | `#8c4dff` | Neutral accent badges |

## 3. Spacing (8px base)

`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 20 · `--space-6` 24 · `--space-8` 32 · `--space-10` 40 · `--space-12` 48. Semantic: `--card-padding` 16, `--gap-element` 8, `--gap-card` 16, `--gap-section` 32, `--btn-pad-y/x` 10/16, `--btn-pad-y-sm/x-sm` 6/12.

## 4. Radius

`--radius-xs` 4 (tags) · `--radius-base` 8 (cards, buttons, inputs, images) · `--radius-circle` 66 (pills, capsules) · `--radius-round` 50% (avatars, dots).

## 5. Shadows

No shadows by default (`--shadow-none`). Floating layers only: `--shadow-md` (dropdowns, popovers, toasts), `--shadow-lg` (modals). `--shadow-glow-brand` marks a selected brand element. Focus ring on inputs: `--shadow-focus-brand`.

## 6. Motion and layout

`--ease`, `--duration-fast/base/slow`, `--transition-fast/base/slow`. Layout widths: `--layout-content-max`, `--layout-modal-sm/md/lg`, `--layout-input-max`, `--layout-login-card`.

---

## 7. Component rules

**Cards:** background `--color-surface`, border `1px solid var(--color-border)`, radius `--radius-base`, padding `--card-padding`, gap `--gap-card`. Hover (clickable only): border `--color-border-strong`, background `--color-surface-hover`. Selected: border `--color-border-brand`.

**Buttons:** padding `--btn-pad-y` `--btn-pad-x`, font `--text-small` medium, radius `--radius-base`. Primary uses `--color-primary-gradient`. Secondary uses `--color-surface-soft` + `--color-border`. Ghost is transparent, hover `--color-surface-hover`. Compact buttons use `--btn-pad-y-sm` `--btn-pad-x-sm`. Danger: text `--color-danger`, border `--color-danger-border`.

**Inputs:** height `--size-control`, radius `--radius-base`, background `--color-surface-soft`, border `--color-border`, focus `--shadow-focus-brand`. Errors use `--color-danger` and `--color-danger-border`.

**Status chips:** mono, uppercase, `--text-mono`, colors from the matching `--color-*` set.

---

## 8. Where tokens apply

`typography.css` is global. `design-tokens.css` defines color, spacing, radius and shadow tokens on a **scope list** so legacy screens are not changed by accident. A screen gets the tokens when it carries one of these classes (or you add its root class to the list):

`.artist-login-screen`, `.register-page`, `.auth-public-page`, `.dpx-scope`

To build a new Artist screen with tokens, wrap it in `<div className="dpx-scope">` (or add its own root class to the scope list in `design-tokens.css`).

---

## 9. Migration status

| Area | Status |
|---|---|
| Typography tokens + fonts | Done (global) |
| Typography applied to the whole app | Done: every `font-size`, `font-weight`, `font-family`, `line-height` and `letter-spacing` in `styles.css`, `components/landing.css` and the inline styles in `main.tsx` and `KycSettingsTab.tsx` now uses a typography token |
| Design tokens | Added, scoped |
| Login | Done (same design as Mitro User) |
| Sign up (account, OTP, review, success) | Done (same design as Mitro User) |
| Forgot password, OTP, Reset password | Uses the shared auth styles |
| Dashboard, Go Live, Earnings, Followers, Notifications, Messages, Profile, Schedule | Not yet migrated (legacy `styles.css`) |

### Auth screens (Login + Sign up)

- Two columns on desktop: story panel (kicker, large heading, lede, divider, four or six feature points, 18+ note) and a card (logo, heading, subtitle, fields, primary button, switch link). Stacked on phones.
- Login card: Mobile Number / Stage Name toggle, field label in mono uppercase, password with show/hide, "Forgot password?", Login button, "Don't have an account? Sign Up".
- Sign up card: no stepper. One pane at a time: Create Your Account, Verify Your Number (OTP), Review Your Details, Account Created.
- Everything uses tokens only. Page background and panel gradients come from `auth-split.css`.

### How existing values were mapped to tokens

- **Font size** snaps to the nearest token: 12 (`--text-xs`), 14 (`--text-small`), 16 (`--text-body`), 20 (`--text-subheading`), 24 (`--text-heading`), 40 (`--text-heading-lg`), 56 (`--text-display`). Inside the app nothing is larger than `--text-heading-lg`; `--text-display` is used on the landing page only. Fluid `clamp()` sizes use their minimum value in the app.
- **Font weight:** 100 to 400 becomes regular, 500 medium, 600 and above semibold (the project loads 400, 500 and 600 only).
- **Font family:** every family becomes `var(--font-sans)` (Inter) or `var(--font-mono)`. Playfair Display and Outfit are gone.
- **Line height** (unitless) becomes the `--leading-*` token for the same role. **Letter spacing:** wide tracking on uppercase labels becomes `--tracking-mono`; other values use the tracking of the same role.
- **Left as is on purpose:** `font: inherit`, `font-family: inherit`, `letter-spacing: 0` or `normal`, one `line-height: 16px` (fixed height), SVG `fontSize` and `fontWeight` attributes in the Fun Wheel, and the canvas `ctx.font` in the earnings chart (neither can read CSS tokens).

---

## 10. React Native mapping (this repository)

Mitro-Artist-App is an Expo / React Native app, so the web tokens above are expressed in TypeScript instead of CSS. Everything is exported from `@theme` (`src/theme/index.ts`).

| Web token (this doc) | React Native |
|---|---|
| `--font-sans` / `--font-mono` | `fontFamily.regular`, `.medium`, `.semibold` (Inter 400 / 500 / 600) and `fontFamily.mono` (JetBrains Mono 400). `bold` and `extrabold` are kept as aliases of `semibold` because nothing may be heavier than 600. |
| `--font-weight-*` | Not set directly. The weight is part of the font family name; never set `fontWeight` next to a custom family (Android fake-bolds it). `<Text weight="600">` maps to the family for you. |
| `--text-*` | `fontSize.display`, `.headingLg`, `.heading`, `.subheading`, `.body`, `.small`, `.mono`, `.monoLg`, `.xs` |
| `--leading-*` | `lineHeight.display` … `.mono`, in px (doc ratio × size) |
| `--tracking-*` | `letterSpacing.display` … `.monoLg`, in px (doc em × size) |
| Roles in section 1.4 | `<Text variant="…">`, see below |

Fonts load once in `app/_layout.tsx` with `useFonts` (Inter 400 / 500 / 600 and JetBrains Mono 400). Do not load any other font family.

Variants (`src/theme/typography.ts`):

| Variant | Role |
|---|---|
| `h1`, `numHero`, `numLg`, `display` | Page title / stat number: heading 24, semibold |
| `h2` | Card / section title: body 16, semibold |
| `h3` | Small title: small 14, semibold |
| `body`, `input`, `subtitle` | small 14, regular |
| `bodyLg`, `bodyLarge`, `buttonSm`, `link`, `button` | Button / label text: small 14, medium |
| `bodySm`, `caption`, `legal` | Helper / meta: xs 12, regular |
| `metric` | Stat in a summary strip: subheading 20, semibold |
| `label`, `eyebrow`, `badge` | Mono 12, uppercase, tracked |

Rules for React Native code:

1. No numeric `fontSize`, `lineHeight` or `letterSpacing`, and no `fontWeight`, in any style. Use `fontSize.*`, `lineHeight.*`, `letterSpacing.*` and `fontFamily.*` from `@theme`, or a `<Text variant>`.
2. Pair size, line height and tracking from the same role (for example `fontSize.small` + `lineHeight.small` + `letterSpacing.small`). The `typeRoles` export has ready-made trios.
3. Uppercase labels, IDs, counts and badges use `fontFamily.mono`.
4. The smallest text in the app is `fontSize.xs` (12).
5. Dynamic sizes that cannot be tokens (for example avatar initials scaled to the avatar) are the only allowed exception.

Migration status in this repo:

| Area | Status |
|---|---|
| Fonts and type scale (`src/theme/typography.ts`, `app/_layout.tsx`) | Done: Inter + JetBrains Mono, Plus Jakarta Sans removed |
| Every `fontSize`, `fontWeight`, `lineHeight` and `letterSpacing` literal in `app/` and `src/` | Done: replaced by tokens |
| Colors, spacing, radius, shadows | Unchanged; still `src/theme/colors.ts` and `spacing.ts` |
