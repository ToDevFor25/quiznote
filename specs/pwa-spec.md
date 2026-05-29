# Engineering Spec — Progressive Web App (PWA)

**Type:** Infrastructure / engineering session (not a module). Touches new
shared files + every HTML `<head>`. **Tier 3** — architectural, shared-file,
brand-surface; requires Jonathan's go before any code.
**Status:** DRAFT for review. Nothing built yet.

## Why
QuizNote is already PWA-shaped: no build step, flat static files, all play data
in `localStorage`, no server needed to run. A PWA adds three things on top —
**installable to the home screen, offline play, and an app-like standalone
window** — with no app-store review, no 30% cut, and instant updates (push to
main → users have it). It also pairs with the landscape "best in portrait" hint
already shipped (`orientation: portrait` in the manifest is the Android-side
lock).

## What a PWA needs vs. what QuizNote has

| Requirement | Status today |
|---|---|
| HTTPS | ✅ Vercel |
| `manifest.json` (name, icons, start_url, display, theme) | ❌ none |
| Icons (192 / 512 / maskable / apple-touch) | ❌ only a base64 data-URI favicon |
| Service worker (offline + reliable install) | ❌ none |
| `<head>` meta (theme-color, apple-mobile-web-app, manifest link, apple-touch-icon) | ❌ modules have only `<title>` + viewport |
| Standalone-friendly layout | ✅ (the viewport pass just shipped) |

## The hard parts (read before building)

1. **Service-worker cache versioning is the #1 footgun.** We deploy often; a
   naive precache will pin users to a stale version. Mitigation baked into this
   spec: **network-first for HTML navigations** + a **versioned** runtime cache
   for static assets, so a new deploy always reaches users while assets stay
   fast. No hand-maintained precache list (there's no build step to generate
   one across 35 modules).
2. **iOS limitations** (be honest about these):
   - No `beforeinstallprompt` → iOS users must use **Share → Add to Home
     Screen** manually (we show instructions; we can't trigger it).
   - Manifest `orientation` is **ignored on iOS** → the landscape hint already
     covers that case.
   - **Storage eviction:** iOS can purge a site's `localStorage` after ~7 days
     of non-use. Installed PWAs are more durable, but this is a real data-loss
     risk for our local-only model and **reinforces the cloud-sync roadmap.**
   - PWA push only on iOS 16.4+ and only when installed (out of scope here).
3. **Cross-origin assets:** fonts load from Google Fonts + Bravura from
   jsDelivr. Full offline needs them cached (runtime cache-first for those
   origins); otherwise offline falls back to system fonts / missing music
   glyphs. Decision needed (see Open Questions).

## File-by-file changes

**New files**
- `manifest.json` (root) — see contents below.
- `sw.js` (root, so its scope is `/`) — the service worker.
- `qn-pwa.js` (new shared file) — registers the SW, owns the install UX
  (`beforeinstallprompt` capture + button, iOS instructions). Loaded on every
  page like the other `qn-*.js` files.
- Icon set (root or `/icons/`): `icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png` (safe-zone padded), `apple-touch-icon-180.png`.
  **Dependency:** needs the QuizNote logo as a high-res source (SVG or ≥512px
  PNG) to export from — see Open Questions.

**Touched files — every HTML `<head>` (~43 files: 35 modules + index/play/
path/dashboard/profile/privacy/terms + demos)**
Add, statically (not JS-injected, so install works on first paint):
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1FB8A8" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="QuizNote" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png" />
<script src="qn-pwa.js" defer></script>
```
This is the bulk of the labor — a uniform, scripted head insertion across all
files (like the viewport pass). The existing base64 favicon can stay or be
replaced by a real `icon.png`.

## `manifest.json` (proposed)
```json
{
  "name": "QuizNote — Music Theory Practice",
  "short_name": "QuizNote",
  "description": "Short rounds of music-theory practice, built to match how it's taught.",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFFAF0",
  "theme_color": "#1FB8A8",
  "categories": ["education", "music"],
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
- `start_url` decision pending (landing vs `play.html` vs `path.html`).
- `?source=pwa` lets us tell installed launches apart in analytics later.

## Service worker strategy (`sw.js`)
- **Versioned cache:** `const CACHE = 'quiznote-v1'` — a manual constant bumped
  when we want to guarantee asset refresh. (No build step → manual bump,
  documented as deploy discipline. Acceptable because HTML is network-first.)
- **Navigations (HTML): network-first, fall back to cache, then an offline
  page.** Guarantees deploys reach users; offline still works from last visit.
- **Static assets (CSS/JS/fonts/icons): stale-while-revalidate** — instant from
  cache, refreshed in the background.
- **Cross-origin fonts (Google/jsDelivr): cache-first runtime cache** (opaque
  responses OK) — pending the offline-fonts decision.
- **No hand-maintained precache list.** Precache only a tiny shell (offline
  page + the shared `qn-*.js`/`qn-theme.css` + landing); everything else is
  runtime-cached as visited. This suits "35 modules, no build."
- **Update flow:** `skipWaiting()` + `clients.claim()` so a new SW takes over
  promptly; combined with network-first HTML, users get new versions without a
  stuck-cache. (Alternative: a "new version — tap to refresh" toast. Decision
  pending.)
- **Offline fallback:** a small `offline.html` (branded "you're offline — your
  saved progress is safe on this device").

## Install UX (`qn-pwa.js`)
- **Android/Chrome:** capture `beforeinstallprompt`, suppress the mini-infobar,
  show a branded **"Install QuizNote"** button on the landing page (and
  optionally a gentle prompt after a completed round). Dismissible; remember
  dismissal in `localStorage`.
- **iOS Safari:** detect iOS + not already standalone
  (`navigator.standalone`), show a one-time **"Add to Home Screen"** instruction
  card (Share → Add to Home Screen) on landing. Dismissible.
- **Already installed:** hide all install affordances when
  `display-mode: standalone` matches.

## Phasing (can ship incrementally)
- **Phase A — Installable (low risk, no SW):** manifest + icons + head meta.
  Yields "Add to Home Screen" with a real icon + standalone window + portrait
  lock on Android. No offline yet. *This alone is a real win and is the safe
  first ship.*
- **Phase B — Offline (the risky part):** `sw.js` + registration + offline
  page. Network-first HTML so deploys aren't stranded. Heaviest testing here.
- **Phase C — Install UX:** `beforeinstallprompt` button + iOS instructions.

Recommend shipping **A first**, soak-test, then B, then C.

## Verification plan
- **Lighthouse PWA audit** (installability + best practices) on the Dev preview.
- **Install test:** Android (Chrome → install) and iOS (Share → Add to Home
  Screen); confirm icon, splash, standalone window, portrait lock (Android).
- **Offline test:** load, go airplane mode, confirm play still works and the
  offline page appears for an uncached route.
- **Update test (critical):** deploy `v1`, install; deploy `v2` (bump cache +
  a visible change); confirm the client updates without a manual cache clear.
- **Regression:** the base64-favicon swap and head insertions don't break any
  page (parse + brace checks across all files, as in the viewport pass).

## Privacy / legal
- An installed PWA doesn't change data flow — still local-only, no new
  collection. The drafts already mark cloud/accounts PLANNED. The SW caches
  assets on-device only. **No privacy/terms change needed for Phases A–C.**
  (If we later cache user data for offline sync, that's the cloud session.)

## Open questions for Jonathan (decide before build)
1. **Icon source:** is there a high-res QuizNote logo (SVG or ≥512px PNG) I can
   export the icon set from? (Hard dependency for Phase A.)
2. **start_url:** open to the landing page, or straight into `play.html` /
   `path.html` for installed users?
3. **Offline scope:** full offline play (runtime-cache modules as visited — my
   recommendation) vs. shell-only?
4. **Cache cross-origin fonts** for true offline (music glyphs render offline),
   or accept system-font fallback offline to keep the SW simpler?
5. **Update UX:** silent auto-update (my recommendation, with network-first
   HTML) vs. a "new version, tap to refresh" toast?
6. **Ship Phase A alone first?** (Recommended.)

## Notes
- Pairs with the shipped landscape hint (`orientation:portrait` is its
  Android-lock counterpart).
- Architecture confirmed PWA-friendly (Jonathan verified via bookmark install,
  per CLAUDE.md).
- Per the no-build constraint: no bundler, no precache-manifest generator —
  everything here is hand-authored static files + runtime caching.
