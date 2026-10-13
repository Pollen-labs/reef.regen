# Reef.Regen — 2026 Q4 Codebase Review & Update Plan

**Date:** October 13, 2026
**Reviewer:** Kilo (code review agent)
**Branch reviewed:** `mainnet` (last commit: Dec 17, 2025)
**Scope:** Full docs review (23 files, v0.1–v1.6), comprehensive code audit, dependency update check, and targeted analysis of two user-reported issues (map load speed, sign-in popup).

---

## 1. Executive Summary

The project is a Next.js app for creating verifiable, on-chain coral restoration attestations via EAS (Ethereum Attestation Service) on **Optimism mainnet**. Users sign in with social login (Web3Auth embedded wallet), submit multi-step attestation wizards (gasless via a Cloudflare Worker relayer), and view sites on an interactive MapLibre map.

All 16 feature docs (v0.1 through v1.6) have been implemented and shipped. The codebase is functional and on mainnet, but has accumulated:

- **22 of 25 npm packages behind** — including a Next.js canary in production and maplibre-gl 3 major versions behind.
- **2 bugs** (Rules-of-Hooks violation, `require("react")` anti-pattern). ✅ **Fixed** — see Section 6.
- **Map loading inefficiency** — no caching, CDN-loaded CSS, outdated maplibre, no skeleton.
- **Sign-in chain-switch popup** — `EnsureEmbeddedChain` triggered a visible `wallet_switchEthereumChain` popup on connect. **Fixed:** replaced raw RPC with SDK's `useSwitchChain()` hook (silent for embedded wallets), removed `@web3auth/base@9` version skew, fixed `handleSignIn` race condition, added `enableLogging` for debugging. v11 upgrade with `defaultChainId` deferred (requires wagmi v3 major migration).
- **1 unused dependency**, **1 dead/duplicate component**, and pervasive `as any` casts. Unused dependency (`chartjs-plugin-datalabels`) ✅ **Removed**.

This document covers all findings and proposes a two-phase remediation plan.

---

## 2. Documentation Review (23 files)

All docs in `docs/` were reviewed. Summary of progression:

| Doc | Topic | Status |
|-----|-------|--------|
| 0.1 | PRD: EAS delegated attestation POC (MetaMask) | Superseded by 0.4 |
| 0.2 | MVP PRD: OP Sepolia, relayer, Supabase schema | ✅ Shipped |
| 0.3 | File upload (IPFS/Filebase) + `show_on_map` toggle | ✅ Shipped |
| 0.4 | Embedded wallet (Web3Auth) replacing MetaMask | ✅ Shipped |
| 0.5 | Capture Web3Auth email → Supabase | ✅ Shipped |
| 0.6 | UI tokens (Tailwind + Outfit, Vulcan/Flamingo palette) | ✅ Shipped |
| 0.7 | Map sprint: TopNav, Footer, MapView, LocationPane, modal | ✅ Shipped |
| 0.8 | Landing page skeleton | ✅ Shipped |
| 0.9 | Backend v0.4: Sites, taxa, regen_type, PostGIS, views/RPC | ✅ Shipped |
| 1.0 | EAS schema v0.4 (16 fields, lon-lat order) | ✅ Shipped |
| 1.1 | Web3Auth → Privy migration guide | ⏸ On hold (not started) |
| 1.2 | Onboarding flow (org_name required) | ✅ Shipped |
| 1.3.1–1.3.6 | Attestation wizard steps 1–5 + review | ✅ Shipped |
| 1.4 | Account/dashboard page (stats, charts, embed) | ✅ Shipped |
| 1.5 | Profile settings (basic info, sites, security/export key) | ✅ Shipped |
| 1.6 | Social sharing + dynamic OG image (Edge runtime) | ✅ Shipped |

**Note:** Doc 1.1 (Privy migration) is the only unstarted doc. Web3Auth remains the active auth provider. The migration guide is well-written and ready if the decision is made to switch.

---

## 3. Dependency Update Status

Checked via `pnpm outdated`. **22 of 25 packages are behind.**

### Critical (fix soon)

| Package | Current | Latest | Concern |
|---------|---------|--------|---------|
| **next** | `16.0.2-canary.2` | `16.4.0` | Running a canary/pre-release in production. Should pin to stable. |
| **maplibre-gl** | ~~`3.6.2`~~ → `5.24.0` | `6.14.0` | ✅ Upgraded to v5 (WebGL2, perf). v6 deferred (ESM-only, no default import). |
| ~~**@web3auth/base**~~ | ~~`^9.7.0`~~ | — | ✅ **Removed** — orphaned v8-era package, never loaded by `@web3auth/modal@10`. Imports moved to `@web3auth/modal`. |

### Major version available (evaluate before upgrading)

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| react / react-dom | `18.3.1` | `19.3.0` | Next 16 stable supports React 19. Major migration. |
| wagmi | `2.18.1` | `3.7.7` | Major breaking changes in v3. |
| zod | `3.25.76` | `4.6.7` | v4 has breaking API changes. |
| zustand | `4.5.7` | `5.0.15` | Major but relatively smooth migration. |
| tailwindcss | `3.4.18` | `4.3.3` | v4 is CSS-first config, breaking. Defer. |
| typescript | `5.9.3` | `7.0.2` | Major. Defer unless needed. |
| @web3auth/modal | `10.8.0` | `11.4.3` | Major. v11 requires wagmi v3 (major migration). Deferred — staying on v10 with `useSwitchChain()` fix. |
| viem | ~~`2.17.0`~~ → `2.45.0` | `2.57.5` | ✅ Updated to meet Web3Auth v10+ peer requirement. |

### Minor / safe updates

| Package | Current | Latest |
|---------|---------|--------|
| viem | `2.38.2` | `2.57.5` |
| ethers | `6.15.0` | `6.17.0` |
| @supabase/supabase-js | `2.75.0` | `2.117.3` |
| @tanstack/react-query | `5.90.3` | `5.104.2` |
| @aws-sdk/client-s3 | `3.913.0` | `3.1150.0` |
| @ethereum-attestation-service/eas-sdk | `2.9.0` | `2.10.0` |
| postcss (dev) | `8.5.6` | `8.5.30` |
| autoprefixer (dev) | `10.4.21` | `10.6.1` |
| @types/node (dev) | `20.19.21` | `26.6.5` |
| @types/react (dev) | `18.3.26` | `19.3.0` |
| @types/react-dom (dev) | `18.3.7` | `19.3.0` |

### Unused dependency

| Package | Status |
|---------|--------|
| **chartjs-plugin-datalabels** (`^2.2.0`) | Never imported anywhere in source. Safe to remove. |

### Recommended upgrade order

1. **Immediate:** ~~Pin Next.js to stable (`16.4.0`), remove `chartjs-plugin-datalabels`, align `@web3auth/base` to match `@web3auth/modal` major.~~ ✅ All done — `chartjs-plugin-datalabels` removed, `@web3auth/base` aligned (removed), Next.js pinned to `16.4.0` stable (commit `cc95cc04`).
2. **Near-term:** Upgrade maplibre-gl to v5+ (biggest map perf win). Update viem, ethers, supabase-js, react-query (all minor).
3. **Dedicated sprint:** React 19, wagmi v3, zod v4, zustand v5, tailwind v4, TypeScript 7. Each is a major migration — do them one at a time with testing.

---

## 4. Map Loading Speed — Analysis & Fixes

### Current behavior

When a user navigates to `/map`, they see a plain "Loading map..." text for a couple seconds before the map canvas appears. This delay is caused by a chain of sequential loads:

1. Page component mounts → `fetch("/api/attestations/public")` fires (no cache)
2. API route queries Supabase `site_points_v` view (no `Cache-Control` header)
3. Response returns GeoJSON → `setPoints()` → MapView receives points
4. MapView's `useEffect` dynamically imports `maplibre-gl` (~700KB)
5. A `<link>` to `https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css` is injected into `<head>` (extra CDN round-trip)
6. MapLibre constructs the map, fetches the local style JSON (`/map/styles/dark_matter.json`)
7. MapLibre fetches vector tiles, sprites, and glyphs from MapTiler (remote, key-injected at runtime)
8. Only then does the map render with pins

Steps 1–3 (data) and 4–7 (map library + tiles) happen largely sequentially. The "couple seconds" is the sum of: API latency + maplibre-gl download + CSS download + tile fetch.

### Root causes (ranked by impact)

| # | Cause | Location | Impact |
|---|-------|----------|--------|
| 1 | **No data caching** — API has no `revalidate`/`Cache-Control`; client uses raw `fetch()` in `useEffect` with no React Query caching | `app/api/attestations/public/route.ts`, `app/map/page.tsx:80-111` | Every `/map` visit re-queries Supabase. No dedup, no background refetch. |
| 2 | **MapLibre CSS from unpkg CDN** — dynamically injected `<link>` to a third-party CDN | `components/map/MapView.tsx:88-95` | Extra round-trip, version-drift risk, render-blocking. |
| 3 | **MapLibre v3 is slow** — predates WebGL2 optimizations in v5 | `package.json` | Slower initial render and tile painting. |
| 4 | **No map skeleton** — plain "Loading map..." text while everything loads | `app/map/page.tsx:164-177` | Perceived load time feels longer than it is. |
| 5 | **Placeholder MapTiler key in style JSON** — `get_your_own_OpIi9ZULNHzrESv6T2vL` baked into served file | `public/map/styles/dark_matter.json` | If env key is missing, tiles silently 403 and map appears blank. |
| 6 | **`MapCrosshairPicker` static-imports maplibre-gl** — ~700KB eagerly bundled into `/submit` route | `components/wizard/MapCrosshairPicker.tsx:4` | Bloats submit route (not the map route, but still wasteful). |

### Proposed fixes

#### Phase 1 — Quick wins (low effort, immediate impact)

**1.1. Bundle MapLibre CSS from npm**

Replace the CDN `<link>` injection with a bundler-handled import:

```ts
// At top of MapView.tsx (and StaticSiteMap.tsx)
import "maplibre-gl/dist/maplibre-gl.css";
```

Remove the `<link>` injection block (lines 88–95 in MapView.tsx, equivalent in StaticSiteMap.tsx). The bundler will include the CSS in the route's stylesheet, eliminating the CDN round-trip.

**1.2. Add caching to the public attestations API**

```ts
// app/api/attestations/public/route.ts
export const revalidate = 60; // cache for 60 seconds
```

This enables Next.js route caching. The first request hits Supabase; subsequent requests within 60s are served from cache. For a public map that changes infrequently, this is a big win.

**1.3. Add a map loading skeleton**

Replace the "Loading map..." text with a dark placeholder that matches the map's background:

```tsx
{loading && (
  <div className="absolute inset-0 bg-[#15171e] flex items-center justify-center">
    <div className="animate-pulse text-vulcan-400">Loading map…</div>
  </div>
)}
```

This makes the transition to the loaded map feel instant rather than jarring.

**1.4. Dynamic-import MapCrosshairPicker's maplibre-gl**

Change `MapCrosshairPicker.tsx:4` from:
```ts
import maplibregl from "maplibre-gl";
```
to a dynamic import inside the effect (matching the pattern in MapView/StaticSiteMap). This removes ~700KB from the `/submit` route bundle.

#### Phase 2 — Bigger improvement (separate sprint)

**2.1. Upgrade maplibre-gl to v5+**

v5 introduces WebGL2 support, improved tile rendering, and reduced initial load time. This is the single biggest map performance improvement available. The migration requires:
- Update `package.json` to `maplibre-gl@^5`
- Test the style JSON compatibility (dark_matter style should work, but verify)
- Update the CDN CSS version if not already bundled (moot if 1.1 is done)
- Test all 3 map instances (MapView, StaticSiteMap, MapCrosshairPicker)

**2.2. Adopt React Query for data fetching**

React Query (`@tanstack/react-query`) is already installed and wrapped in providers, but no `useQuery` hooks are used anywhere. Migrating the map page's manual `fetch()` calls to `useQuery` would provide:
- Automatic caching (return visits to `/map` are instant)
- Background refetch (stale data refreshed silently)
- Dedup (multiple components requesting the same data share one fetch)

---

## 5. Sign-In Popup — Analysis & Fix

> **Status: Implemented (v10 fixes).** v11 upgrade with `defaultChainId` was attempted but reverted — v11 requires wagmi v3 (major breaking change across the entire codebase). Fixed on v10 instead: replaced raw `wallet_switchEthereumChain` RPC with SDK's `useSwitchChain()` hook, removed `@web3auth/base@9` version skew, fixed `handleSignIn` race condition (local sign-in was broken), fixed 3-sec setup page flash, added `enableLogging` for debugging. Also discovered and fixed a Client ID / network mismatch that prevented local testing (devnet Client ID was being used with `sapphire_mainnet`).

### Current behavior

When a user signs in via Web3Auth (Google/Apple/LinkedIn/email), a popup appears prompting them to switch chains. This is visible and feels clunky.

### History — why the chain switcher was added

**Git commit `84deb954` (Nov 3, 2025):** *"Implement Network Auto-Switch Feature in Providers"*

The chain switcher was added to fix a real problem: the Web3Auth embedded wallet was defaulting to **Ethereum mainnet** (chainId 1) on connect, not to the target chain (originally OP Sepolia, now OP mainnet). When the wallet was on the wrong chain, EAS attestation signing would silently fail — the EIP-712 typed data domain includes `chainId`, and if the wallet's active chain doesn't match, the signature is invalid. The relayer would then reject it or the on-chain submission would fail.

**Before the fix:** The chain switch happened at submit time (in the attestation wizard). Users had to click "Confirm & Submit" twice — once to switch networks (popup), then again to sign. This was confusing.

**The fix:** Moved the chain switch to connect time via `EnsureEmbeddedChain`, so the popup happens once right after sign-in rather than mid-submission.

**Doc note from `docs/1.3.6-attest-review.md:203-209`:**
> *"We added an early network alignment step that requests `wallet_switchEthereumChain` as soon as the embedded wallet provider is connected. This reduces confusion where users had to click 'Confirm & Submit' twice (first to switch networks, then to sign). **Important: wallets still require user consent for switching networks. This change only moves the prompt earlier; it does not make switching silent.**"*

### Root cause of the popup

The `EnsureEmbeddedChain` component in `app/providers.tsx:60-102` calls the raw RPC `wallet_switchEthereumChain` on the embedded wallet provider. This RPC **requires user consent** even for embedded wallets — Web3Auth surfaces a confirmation popup.

**Why the switch is needed at all:** The Web3Auth dashboard (cloud.web3auth.io) has **both Ethereum mainnet and Optimism mainnet** configured. Per Web3Auth's chain merging logic (confirmed in their docs), chains from the dashboard are merged with chains from the SDK config. The embedded wallet defaults to **Ethereum mainnet** (the dashboard's default chain), not to the single chain listed in the code's `chains` array.

The code only lists OP mainnet:
```tsx
// providers.tsx:23-34
chains: [
  {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xa", // 10 Optimism mainnet
    rpcTarget: process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.optimism.io",
    // ...
  },
],
```

But the dashboard adds Ethereum mainnet to the merged chain list, and the wallet defaults to it. `EnsureEmbeddedChain` then switches from ETH mainnet (1) → OP mainnet (10), which triggers the popup.

### Fix options

#### Option A: Remove Ethereum mainnet from the Web3Auth dashboard (recommended — no code change)

If the Web3Auth dashboard only has Optimism mainnet (remove Ethereum mainnet), the embedded wallet should default to OP mainnet on connect. No chain switch needed → no popup.

**Steps:**
1. Go to [cloud.web3auth.io](https://dashboard.web3auth.io) → your project → Chains/Networks
2. Remove Ethereum mainnet (chainId 1), keep only Optimism mainnet (chainId 10 / `0xa`)
3. Set `NEXT_PUBLIC_AUTO_SWITCH_ON_CONNECT=false` in `.env` as a safety net
4. Test: sign in → confirm no popup → submit an attestation → confirm it succeeds on-chain

**Risk:** If the embedded wallet still defaults to Ethereum mainnet even with only OP mainnet in the dashboard (some Web3Auth versions may hardcode ETH mainnet as the default), you'll need Option B or C.

#### Option B: Upgrade to Web3Auth v11 + use `defaultChainId` (best long-term)

Web3Auth v11 SDK introduces a `defaultChainId` option that explicitly sets the embedded wallet's starting chain:

```typescript
// v11 SDK constructor
export interface IWeb3AuthCoreOptions {
  clientId: string;
  chains?: CustomChainConfig[];
  defaultChainId?: string;  // <-- this is the fix
}
```

Setting `defaultChainId: "0xa"` would make the embedded wallet start on Optimism mainnet regardless of dashboard config. No chain switch needed → no popup.

**Steps:**
1. Upgrade `@web3auth/modal` to v11 and `@web3auth/base` to v11 (also fixes the version skew issue)
2. Add `defaultChainId: "0xa"` to the web3AuthOptions config
3. Remove `EnsureEmbeddedChain` entirely
4. Test the full sign-in → submit flow

This also resolves the `@web3auth/base@v9` vs `@web3auth/modal@v10` version skew noted in section 3.

#### Option C: Move the chain switch to submit time (reduces visibility)

Instead of switching on connect (popup appears immediately after sign-in), move the switch to right before the EAS signing call in the wizard. The popup still appears, but only when the user is actively submitting — which is more expected context than right after login.

**Trade-off:** This is the original behavior before commit `84deb954`. Users would see the popup at submit time rather than connect time. It's less jarring at submit time (they're already expecting a blockchain action) but reintroduces the "click twice" UX.

#### Option D: Replace raw RPC with SDK's `switchChain()` method (may be silent)

The current code uses the raw EIP-1193 RPC:
```ts
await provider.request?.({ method: "wallet_switchEthereumChain", params: [...] });
```

Web3Auth's SDK has a dedicated `switchChain()` method that "switches the ws-embed provider chain" for embedded wallets. This may handle the switch internally without surfacing a wallet UI confirmation, since it's the SDK's own method rather than a standard wallet RPC.

**Steps:**
1. Replace the raw RPC call with the SDK's `switchChain()` method
2. Test whether the popup still appears
3. If silent, keep it at connect time. If not, fall back to Option A or B

### Recommendation

1. **Try Option A first** — remove Ethereum mainnet from the Web3Auth dashboard. It's the quickest fix (no code change) and should eliminate the popup entirely if the wallet respects the single-chain dashboard config.
2. **If Option A doesn't work** (wallet still defaults to ETH mainnet) — proceed to **Option B** (upgrade to v11 with `defaultChainId`). This is the proper long-term fix and also resolves the version skew.
3. **Avoid Option C** unless A and B both fail — it reintroduces the "click twice" UX that was originally fixed.
4. **Option D** is worth a quick test on the current v10 SDK — if `switchChain()` is silent for embedded wallets, it's a one-line code change with no upgrade needed.

### Edge case: stale sessions from Sepolia era

If a user hasn't logged in since the mainnet migration (Nov 24, 2025), their browser may have a cached Web3Auth session from when the chain was Optimism Sepolia (chainId 11155420). In that case:
- The wallet might still be on Sepolia
- EAS signing would fail because the EIP-712 domain chainId (10) won't match the wallet's chain
- This is a rare edge case that only affects users who haven't signed in since the migration

**Mitigation:** If signing fails with a chain mismatch error, show a user-friendly message: "Your wallet needs to be refreshed. Please log out and sign in again." The logout flow (`disconnectWeb3Auth()` → `localStorage.clear()`) will clear the stale session, and the next sign-in will create a fresh mainnet wallet.

---

## 6. Code Quality Issues

### Bugs (fix immediately)

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 1 | ~~**Rules-of-Hooks violation**~~ | ~~`components/shared/AttestationDetailModal.tsx:16-26`~~ | ✅ **Fixed** — `useEffect` hoisted above the early return, ESM `import { useEffect } from "react"` added, `require('react')` + try/catch removed. |
| 2 | ~~**`require("react")` anti-pattern**~~ | ~~`components/map/LocationPane.tsx:318-339`, `components/shared/AttestationDetailModal.tsx`, `components/wizard/SiteModal.tsx:144`~~ | ✅ **Fixed** — replaced with ESM imports. *Note: original review missed a third site — `SiteModal.tsx:144` used `require('react').createElement(require('@/components/profile/StaticSiteMap').default, …)`; replaced with `next/dynamic` import + JSX.* |

### Configuration issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 3 | ~~**Network config mismatch**~~ | ~~`app/providers.tsx:26` vs `.env.example`~~ | ✅ **Fixed** — `.env.example` and README updated to Optimism Mainnet (chainId 10, `sapphire_mainnet`, `optimism.easscan.org`, EAS version 0.26, MapLibre 5.24.0, Node 20.9+). `.env.example` force-added to git (was gitignored). |
| 4 | **Placeholder MapTiler key in style JSON** | `public/map/styles/dark_matter.json` | Ships with `get_your_own_OpIi9ZULNHzrESv6T2vL` baked in. Swapped at runtime by `transformRequest`, but the raw file is publicly inspectable. If runtime key injection is bypassed, tiles 403. |

### Performance issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 5 | ~~**Profile page eager-loads all chart components**~~ | ~~`app/profile/[handle]/page.tsx:3-10`~~ | ✅ **Fixed** — `DonutChartJS`, `LineChartJS`, `StackedBarChartJS`, and `StaticSiteMap` converted to `next/dynamic` with `ssr: false`. Chart.js + MapLibre removed from profile route initial bundle. |
| 6 | ~~**`MapCrosshairPicker` static-imports maplibre-gl**~~ | ~~`components/wizard/MapCrosshairPicker.tsx:4`~~ | ✅ **Fixed** — changed to dynamic `import("maplibre-gl")` + type-only import. ~700KB removed from `/submit` bundle. |
| 7 | **No RSC data fetching** | `app/map/page.tsx` | The most-visited page is 100% client-rendered with `fetch` in `useEffect`. No server-side data fetching, no React Query caching. |
| 8 | ~~**No `Cache-Control` on public API**~~ | ~~`app/api/attestations/public/route.ts`~~ | ✅ **Fixed** — added `export const revalidate = 60`. Repeat `/map` visits within 60s skip the Supabase query. |

### UX issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 9 | ~~**`localStorage.clear()` on logout wipes wizard draft**~~ | ~~`components/TopNav.tsx:315,418`, `app/profile/setting/page.tsx:203`~~ | ✅ **Fixed** — `localStorage.clear()` replaced with `clearAuthStorage()` (`lib/auth/clearAuthStorage.ts`) in all 3 logout sites. Preserves `reefregen.attestation.wizard.v1` (wizard draft) while clearing all auth/session keys. |
| 10 | **No `loading.tsx` / `error.tsx` route boundaries** | throughout | Each page handles loading/error inline. Shared route-level boundaries would improve resilience. |

### Hygiene

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 11 | ~~**Unused dependency**~~ | ~~`package.json`~~ | ✅ **Fixed** — `chartjs-plugin-datalabels@^2.2.0` removed via `pnpm remove`. Verified the 3 chart components (`DonutChartJS`, `StackedBarChartJS`, `LineChartJS`) use `chart.js` + `react-chartjs-2` with custom `externalTooltip`/HTML legends — the datalabels plugin was never imported or registered. |
| 12 | **Dead/duplicate component** | `components/WalletConnect.tsx` | Re-implements sign-in + email upsert already handled by `TopNav` + `ProfileEmailSync`. Verify if still rendered anywhere; if not, remove. |
| 13 | **No ESLint config, no tests** | project root | README acknowledges manual testing only. No lint devDeps, no ESLint config. `as any` casts are pervasive. Business logic in `lib/eas.ts`, `lib/validation.ts` warrants unit tests. |
| 14 | **`as any` casts pervasive** | throughout | `router.replace(... as any)`, `useWeb3Auth() as any`, `(source as any).setData(...)`, feature props as `any`. Strict mode is on but routinely bypassed. `typedRoutes: true` is enabled yet route strings are still cast to `any`. |
| 15 | ~~**Web3Auth version skew**~~ | ~~`package.json`~~ | ✅ **Fixed** — `@web3auth/base@9` removed. All imports now from `@web3auth/modal@10`. |

---

## 7. Remediation Plan

### Phase 1 — Quick wins (1 session)

| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| Bundle MapLibre CSS from npm (remove unpkg CDN) | Small | Eliminates CDN round-trip, fixes version drift | ✅ Done (commit `51eea156`) |
| Add `revalidate = 60` to `/api/attestations/public` | Trivial | Caches map data, reduces API latency | ✅ Done (commit `51eea156`) |
| Add map loading skeleton (dark placeholder + spinner) | Small | Improves perceived load time | ✅ Done (commit `51eea156`) |
| Dynamic-import maplibre-gl in `MapCrosshairPicker` | Small | Removes ~700KB from `/submit` bundle | ✅ Done (commit `51eea156`) |
| Add `maplibregl.prewarm()` to all 3 map components | Small | Pre-warms Web Worker pool, faster map init | ✅ Done (commit `51eea156`) |
| Remove `@web3auth/base@9` version skew (import from `@web3auth/modal`) | Small | Fixes type drift, removes orphaned package | ✅ Done |
| Replace raw `wallet_switchEthereumChain` RPC with SDK's `useSwitchChain()` | Small | Silent chain switch for embedded wallets, no popup | ✅ Done |
| Fix `handleSignIn` race condition (check `connect()` return, useEffect navigation) | Small | Fixes broken local sign-in — was navigating before connection confirmed | ✅ Done |
| Fix setup page 3-sec flash (loading spinner while checking profile) | Small | Eliminates form flash for returning users | ✅ Done |
| Add `enableLogging: true` in dev mode for Web3Auth debugging | Trivial | Console logs show exactly where auth flow stalls | ✅ Done |
| Update `viem` to `^2.45.0` (Web3Auth peer requirement) | Trivial | Meets `@web3auth/modal@10` peer dep | ✅ Done |
| Fix Rules-of-Hooks violation in `AttestationDetailModal` | Small | Prevents potential runtime breakage | ✅ Done — `useEffect` hoisted above early return, ESM import |
| Replace `require("react")` with ESM imports | Small | Correctness, tree-shaking | ✅ Done — fixed in `AttestationDetailModal`, `LocationPane`, and `SiteModal` (third site missed by initial review; replaced `require().createElement` with `next/dynamic`) |
| Remove unused `chartjs-plugin-datalabels` | Trivial | Cleaner dependency tree | ✅ Done — verified `chart.js`+`react-chartjs-2` are still used by the 3 chart components; only the datalabels plugin was unused |
| Update `.env.example` and README for mainnet | Trivial | Prevents developer misconfiguration | ✅ Done — all Sepolia refs updated to OP Mainnet; `.env.example` force-added to git (was gitignored) (commit `b2c684d8`) |

### Phase 2 — Bigger improvements (separate sprints)

| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| Upgrade maplibre-gl v3 → v5 | Medium | Biggest map perf win (WebGL2) | ✅ Done — v3.6.2 → v5.24.0 (commit `2dd98afd`) |
| Pin Next.js canary → stable (`16.4.0`) | Medium | Production stability | ✅ Done — `16.0.2-canary.2` → `16.4.0` (commit `cc95cc04`). Also moved `experimental.turbo` → top-level `turbopack`, fixed async `searchParams` in `generateMetadata`. |
| Adopt React Query for data fetching | Medium | Caching, dedup, background refetch | ⬜ Not yet done — low priority; `revalidate = 60` on public API already provides server-side caching |
| Upgrade `@web3auth/modal` to v11 + `defaultChainId` | Medium | Eliminates chain switch entirely | ⬜ Deferred — v11 requires wagmi v3 (major migration). v10 fix with `useSwitchChain()` applied instead. |
| Lazy-load chart components on profile page | Small | Reduces profile route bundle | ✅ Done — `DonutChartJS`, `LineChartJS`, `StackedBarChartJS`, `StaticSiteMap` converted to `next/dynamic` (commit `b2c684d8`) |
| Selective localStorage clearing on logout | Small | Prevents wizard draft data loss | ✅ Done — `clearAuthStorage()` replaces `localStorage.clear()` in 3 logout sites; preserves `reefregen.attestation.wizard.v1` (commit `b2c684d8`) |
| ~~Remove dead `WalletConnect.tsx` component~~ | ~~Small~~ | ~~Code cleanliness~~ | ❌ **Invalid** — verified `WalletConnect.tsx` IS actively used in `app/attest/page.tsx` and `app/profile/setup/page.tsx`. Doc was wrong. |
| Update `.env.example` and README for mainnet | Trivial | Prevents developer misconfiguration | ✅ Done — all Sepolia refs updated to mainnet, `.env.example` force-added to git (was gitignored) (commit `b2c684d8`) |
| Add ESLint config + fix `as any` casts | Medium | Type safety, code quality | ⬜ Not yet done — 100+ `as any` casts; many at SDK boundaries (ethers/Web3Auth/maplibre) where proper types don't exist. ESLint setup worthwhile; fixing all casts is not. |
| Add unit tests for `lib/eas.ts` and `lib/validation.ts` | Medium | Business logic correctness | ⬜ Not yet done — `lib/eas.ts` (EIP-712 typed data builder) is highest priority; `lib/validation.ts` (Zod schemas) is lower since Zod provides runtime validation. |

### Phase 3 — Major upgrades (dedicated sprints, one at a time)

| Task | Risk | Notes |
|------|------|-------|
| React 18 → 19 | High | Major migration, requires testing all components |
| wagmi v2 → v3 | High | Breaking API changes |
| zod v3 → v4 | Medium | Breaking API changes |
| zustand v4 → v5 | Low-Medium | Relatively smooth |
| tailwindcss v3 → v4 | High | CSS-first config, breaking |
| TypeScript 5 → 7 | Medium | Major |
| Web3Auth → Privy migration (doc 1.1) | High | Full auth provider swap, guide already written |

---

## 8. Project Structure Reference

```
reef.regen/
├── app/
│   ├── layout.tsx              # Root layout (Outfit font, Plausible, Providers)
│   ├── providers.tsx           # Web3Auth + Wagmi + QueryClient + wizard providers
│   ├── page.tsx                # Landing page (server component)
│   ├── map/                    # Map page + layout (OG metadata)
│   ├── profile/                # [handle] (public), setting, setup (+details)
│   ├── submit/                 # Wizard: steps/[n], review, success
│   ├── embed/                  # iframe embed view
│   ├── attest/                 # Attestation route
│   ├── opengraph/              # OG image generator (Edge runtime)
│   └── api/                    # 10+ route groups
│       ├── attestations/       # [id], check-internal, create, finalize, public, set-file, set-uid
│       ├── profile/            # Profile CRUD
│       ├── profiles/           # upsert, by-wallet, att-internal
│       ├── regen-types/        # Action type catalog
│       ├── relay/              # Relayer proxy
│       ├── site-types/         # Site type catalog
│       ├── sites/              # [id], by-wallet
│       ├── storage/            # File storage
│       ├── taxa/               # Species catalog
│       └── upload/             # IPFS upload
├── components/
│   ├── AppShell, TopNav, Footer, WalletConnect, OnboardingPrompt
│   ├── AttestationForm, AttestSection
│   ├── map/                    # MapView (590 lines), LocationPane (340 lines)
│   ├── landing/                # Hero, Motivation, RegenAction, ExploreSection, FAQ
│   ├── ui/                     # Button, DatePicker, Dropdown, Input, etc. (9 components)
│   ├── shared/                 # AttestationDetailModal, ShareButtons, charts/ (3)
│   ├── wizard/                 # 12 files: MapCrosshairPicker, Step1-5, guards, etc.
│   ├── profile/                # StaticSiteMap
│   └── security/               # RevealPrivateKeyModal
├── lib/
│   ├── eas.ts                  # EIP-712 typed data builder
│   ├── env.ts, env-server.ts   # Environment config
│   ├── supabase-admin.ts       # Supabase service role client
│   ├── filebase.ts             # S3/IPFS upload
│   ├── validation.ts           # Zod schemas
│   ├── format/, profile/, stubs/
│   ├── style/                  # mapColors, regenColors, siteTypeColors
│   └── wizard/                 # attestationWizardStore (Zustand)
├── hooks/                      # useLeaveGuard, useUnsavedWarning
├── types/                      # map.ts, global.d.ts
├── supabase/                   # README, species.csv, sql/ migrations
└── public/
    └── map/styles/dark_matter.json  # Local map style (992 lines)
```

---

*Document end. For questions or to start Phase 1 implementation, coordinate with the project owner.*