# Studio adaptive splash — build spec (June 2026)

**Branch:** Dev. **Gate:** behind `QN.flags.gamification.ADAPTIVE_SPLASH` is overkill
for a same-surface enhancement — instead the splash *always* runs but picks a flavor
by user state. The QA panel flags force a flavor for testing.

## Decisions (Claude's call, latitude given)
- New-user deck: **4 cards** — 3 content + a **4th "How it works"** card (Jonathan's ask).
- Returning splash: **keep confetti** (Variant A, already approved).
- Guest: value pitch + "Try a round" → profile.html.

## The three flavors (chosen at arrival by state)
`maybeShowSplash` reads state and renders ONE of:

1. **RETURNING** — has logged ≥ NEW_USER_ROUND_THRESHOLD real rounds.
   Today's splash unchanged: "Welcome back, {name}!" + sub + confetti, auto-fade 2s,
   tap/Skip to clear. (What exists now.)

2. **NEW** — profile exists but < threshold rounds (blank cards).
   The splash becomes a **4-card swipeable deck** (no auto-fade; user advances):
   - Card 1: "Welcome, {name}! 🎵" — what QuizNote is.
   - Card 2: "Earn as you learn 🏅" — XP/levels/streaks/badges fill your Studio.
   - Card 3: "We pick what's next 🎯" — tap Play, we serve the best round.
   - Card 4: "How it all works ❓" — primary **"Start my first round →"** (closes
     splash) + a quiet secondary **"See how it works"** → rewards.html.
   Dots show progress. "Skip" closes it. Once they've logged ≥ threshold rounds they
   graduate to RETURNING.

3. **GUEST** — no active profile.
   A value pitch over the splash: brand + "Music theory, made a game" + 3 feature
   lines + primary **"Try a round →"** (→ play.html) + quiet "Create a profile" (→
   profile.html). (The anon state below still exists as the page fallback.)

## State detection
```
events = QN.events.query(active.id)   // [] if no/guest
state =
  !active                          -> 'guest'
  events.length < THRESHOLD        -> 'new'
  else                             -> 'returning'
```
`NEW_USER_ROUND_THRESHOLD = 3` (tunable; matches the "real session" feel used by recap).

## Once-per-day gate (keep, but per-flavor-aware)
- RETURNING + GUEST: once/day via `qn_studio_splash_day` (as today).
- NEW: also once/day BUT the deck is the priority — if forced via QA it ignores the gate.

## QA flag wiring (makes the panel real)
`maybeShowSplash` consults `QN.debug.flag(...)` overrides (the panel writes `qn_qa_*`):
- `hide_splash` → never show (early return).
- `force_splash` → ignore the once-a-day gate (always show this load).
- `splash_new` → force the NEW deck regardless of round count.
- `splash_guest` → force the GUEST flavor regardless of profile.
Precedence: hide > forced-flavor > natural state. Forcing also implies force_splash
(ignore the day gate) so it's re-viewable.

## Build pieces
1. CSS: deck card layout, dots, two-button card-4, guest layout (reuse splash shell).
2. Markup: extend `#splash` with `#splash-deck` (cards) + `#splash-guest` blocks,
   hidden by default; the existing returning block stays.
3. JS: rewrite `maybeShowSplash` → `chooseSplashState()` + `renderReturning()` /
   `renderDeck()` / `renderGuest()`; wire QA flags; boot already calls it (guest path
   currently early-returns before splash — move the splash call BEFORE the anon return
   so guests get the guest splash).

## Verify
node -c; brace balance; DOM-mock init trace for all 3 states + each QA force flag;
confirm guest path reaches the guest splash (boot reorder); reduced-motion safe.
