# Studio P1 — the merge (Path + Progress → one home)

**Branch:** `feature/studio`. **Depends on:** P0 (status masthead + qn-home.js).

## Goal
Collapse the forward-looking Path page and a glance of the backward-looking
Progress page into ONE scroll-home, `studio.html`, structured as a top-down
motivational funnel: Identity → Next Beat → Momentum → Map → Collection.

## Architecture decision (deliberate, documented)
**Studio absorbs the Path page fully** (recommender "Next Beat") and **surfaces a
glance of progress** (one streak + the tier mastery map). **`dashboard.html`
SURVIVES as the "full progress" deep-dive** — it keeps the 12-week trend chart,
Share/PDF, the 3 streak styles, and the expandable per-tier accuracy grid. Studio
links to it ("See full progress & sharing →"). This is **progressive disclosure**,
not a half-merge: the glanceable home up front, the rich detail one tap deeper.
Rationale: a top-down funnel shouldn't silently delete working features (Share/PDF,
trend) that don't belong in a glance. Fully gutting/retiring dashboard is out of
scope for P1 (could be revisited post-P4).

- `path.html` → **redirect** to `studio.html` (fully absorbed; preserves deep links).
- `dashboard.html` → **kept** as "My Progress" detail.
- `index.html` → redirect target changes path.html → `studio.html`.
- `qn-nav.js` DESTS: `today/Today/path.html` → `studio/Studio/studio.html`. Keep
  `modules` and `progress`. Nav stays 3 destinations: **Studio · All Modules · My
  Progress**.

## studio.html — composition (self-contained, no qn-theme.css link)
Same pattern as path/dashboard: inline CSS with tokens defined locally (those
pages don't link qn-theme.css and have colliding class names). Loads, in order:
`qn-profile.js → qn-xp.js → qn-audio.js → qn-home.js → qn-nav.js`, then an inline
controller.

**Markup (mobile-first, centered content column):**
- `<nav>` brand + `#qn-nav-slot` (mount `current:'studio'`).
- `#qn-status-slot` — masthead auto-mounts via qn-home.js (P0).
- `#state-anon` (hidden) — "Make a profile" CTA → profile.html (+ browse link).
- `#state-studio` (hidden):
  - **NEXT BEAT** — eyebrow "Your next beat, {nickname}"; a today-card built from
    `QN.recommend.next(id)`: reason tag (kind→color: cold-start=sun, remediation=
    coral, review=grape, progress=ink), title "{Module} · {Tier}", reason text,
    meta (tier · ~Nq · ~min), `Start →` (writes `{module}_settings` handoff +
    navigates) + `Something else` (→ play.html). Null rec → graceful "browse"
    fallback.
  - **MOMENTUM** — ONE streak (calendar-style week strip + big streak number +
    "{wk}/{goal} this week"), reusing computeStreak/computeWeekDays logic
    (mirrors dashboard; qn-home already carries `streakFor`/`weekDaysFor`).
  - **MAP** — the journey spine: 3 curriculum tiers (ROSTER). Per tier: a progress
    bar (mastered count / total) in the tier color (Foundations=sun, Reading=teal,
    Theory=grape) + a row of per-module mastery dots (gold/silver/bronze/started/
    untouched), tap a dot → that module. "See full progress & sharing →" → dashboard.
  - **COLLECTION** — P4 skeleton: ghost badge wall + "Badges arriving soon" (sets
    the curiosity gap now; engine is P4).
- `<footer>` (copyright via qn-nav setCopyrightYear).

## Logic reused (verified sources)
- `QN.recommend.next(profileId)` → `{module, tier, length, kind, reason}` (from
  round-end Beat-3, read directly).
- `ROSTER` (3 tiers × 35 slugs) + `computeMastery(events)` → per-slug
  `{level, cleared, acc, played}` (read directly from dashboard.html).
- `computeStreak` / `computeWeekDays` (read directly; also in qn-home.js).
- `QN.profile.getActive()`, `QN.events.query(id)`, `QN.xp` (P0-verified).

## Verification gates
1. studio.html inline script parses (`node -c` on extracted script).
2. Brace/tag balance; DOM-mock init trace clean (anon + profile paths, no throw).
3. Masthead renders (P0 component) on studio.html.
4. Next Beat: correct module/tier/reason from recommender; Start handoff writes the
   settings key + navigates; null-rec fallback works.
5. Map: mastered counts match computeMastery on a known log; dots navigate.
6. Nav: Studio/All Modules/My Progress; current page omitted; path.html + index
   redirect to studio.html; no orphaned links.
7. dashboard.html still fully works (untouched except nav label).

## Out of scope (later phases)
Variety recommender (P2), daily quests (P3), the badge engine (P4 — Collection is a
static skeleton here), dashboard gutting / one-streak-everywhere, illustrated map art (P5).
