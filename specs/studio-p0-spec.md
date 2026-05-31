# Studio P0 — Persistent progression + the level-up moment

**Branch:** `feature/studio`. **Depends on:** nothing. **Touches shared files:**
`qn-theme.css` (additive CSS), and creates `qn-home.js` (new shared file — its own
file, not an edit to an existing shared file, so it doesn't trip the "shared-file
change = Tier 3" rule the way editing qn-staff/qn-audio would). `qn-roundend.js`
gets a small additive change (level-up call). No edits to qn-profile.js / qn-xp.js
logic. No four-surface module changes.

## Goal
Make progression **persistent between rounds** and make **leveling up feel like
something**. Today XP/level only appear inside a round's Beat 1 and vanish on close;
rank is invisible on path/dashboard; crossing a rank passes silently.

## Scope — three pieces

### Piece 1 — Status masthead (new shared component: `qn-home.js`)
A persistent identity bar rendered at the top of `path.html` and `dashboard.html`
(and ready for Studio in P1). Pure read of `QN.xp.summaryFor(profileId)` +
streak/goal from existing dashboard logic.

**Markup the JS injects** (into a `<div id="qn-status-slot"></div>` placed by each
host page, just below the existing `<nav>`):
```
.qn-status (card, reuses chunky border + cool shadow tokens)
├── .qn-status-ring        ← SVG level ring (teal --xp fill), big level number centered
├── .qn-status-id
│    ├── .qn-status-rank    ← "PLAYER" (Fredoka 700, rank name)
│    ├── .qn-status-xpbar   ← thin XP rule + "240 XP to Musician"
│    └── .qn-status-meta    ← "🔥 7-day streak · ◷ 5/5 this week"
```

**API:**
```js
QN.home = {
  version: '0.1.0',
  mountStatus(opts?)   // opts.slot (default '#qn-status-slot'); reads active profile,
                       // renders the masthead; no-op if no slot or no profile.
  refreshStatus()      // re-read + re-render (call after navigation/visibility)
}
```
- Self-inits on DOMContentLoaded if `#qn-status-slot` exists (zero per-page JS,
  same pattern as qn-roundend.js self-init).
- Empty/first-run: Level 1 · Beginner, ring at 0%, copy "Your first round starts
  the climb." No streak row if streak is 0.
- Ring animates `ring-fill` (800ms) from 0→pct on mount; reduced-motion = static.
- Reads streak via the SAME computeStreak logic dashboard uses — to avoid
  duplicating it, extract that into `qn-home.js` as `QN.home.streakFor(profileId)`
  and have dashboard's existing code keep working (do NOT break dashboard; if its
  streak calc is inline, leave it and just mirror the algorithm — verify both
  produce the same number on the same data before declaring done).

### Piece 2 — Load qn-xp.js on the two hub pages
`path.html` and `dashboard.html` currently do NOT load `qn-xp.js`. Add it, in the
canonical order (`qn-profile.js` → `qn-xp.js` → `qn-home.js` → `qn-nav.js`). Add
`qn-home.js` to the same two pages. Modules already load qn-xp.js (no change).

### Piece 3 — The level-up moment (additive change to `qn-roundend.js`)
Round-end already computes `xpBefore`-equivalent data. Add a `QN.xp.levelDelta(
totalBefore, totalAfter)` call. If `delta.leveled`, after Beat 1 finishes its
count-up, play a **level-up interstitial**:
- Center-stage overlay (reuse modal scrim), `level-up-flourish` + `particle-burst`.
- Rank ring completes + flips; rank wordmark morphs old→new (e.g. Beginner→Apprentice).
- 2–3 note rising chime via existing `playChime` (honor global mute).
- One line: "You reached Level {to} — {name}!" + single "Nice →" dismiss.
- Then continues to Beat 2/3 as normal.
- `totalBefore` = `totalAfter - roundXP` (both already in scope at render time).
- Reduced-motion: no particles/flip; show the overlay statically, still dismissible.
- Drill rounds (isDrill, roundXP 0) can't level up — guard with `if (!isDrill && delta.leveled)`.

## CSS (additive, into qn-theme.css)
- Tokens: `--xp: var(--teal); --rank-gold: #E6B422; --celebrate` (teal→grape gradient).
- `.qn-status*` classes (reuse 2.5px border, 18px radius, cool shadow).
- `@keyframes ring-fill, level-up-flourish, particle-burst` if not already present
  (recon: the named vocabulary is referenced in specs but verify what's actually in
  qn-theme.css before adding — do not duplicate existing keyframes).
- All new motion gated on `@media (prefers-reduced-motion: reduce)`.

## Verification gates (before declaring P0 done)
1. Masthead renders correct level/rank/XP-to-next for a known event log (hand-check
   one profile's number against `QN.xp.summaryFor` output).
2. Masthead streak number == dashboard's streak number on the same data.
3. Level-up interstitial fires exactly when `levelDelta().leveled` is true, once,
   and not on drills.
4. Structural: braces balanced, scripts parse (`node -c` on qn-home.js +
   qn-roundend.js), DOM-mock init trace clean on path.html + dashboard.html.
5. Reduced-motion path verified (no throw, static render).
6. No regression to the existing in-round Beat-1 XP display.

## Out of scope for P0 (do not build yet)
Quests, badges, the page merge, recommender changes, the map redesign, streak-style
removal. P0 is purely: persistent masthead + load wiring + level-up moment.
