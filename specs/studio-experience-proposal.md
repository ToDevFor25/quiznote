# Studio Experience — master proposal & build plan

**Status:** APPROVED to build on isolated branch `feature/studio` (cut from `main`,
May 2026). Owner override: this branch is exempt from the usual "only push to Dev"
rule for the duration of the Studio build. Do NOT merge to `Dev` or `main` until
Jonathan explicitly says so. Build phase-by-phase: spec → go → build → verify →
test → next.

> ⚠️ **Reality check (verified by file recon, May 2026) — read before building.**
> The round-end is **NOT** dormant. `qn-roundend.js` already calls
> `QN.xp.roundXP / totalFor / levelFor` and Beat 1 already renders an XP count-up
> (`#xp-plus`), a level badge (`#xp-level-badge`), a progress bar (`#xp-bar-fill`),
> and "X to next level" (`#xp-to-next`) on every module. What is actually missing:
> (a) **no persistent status surface** — `QN.xp.summaryFor()` is called nowhere;
> (b) **no level-up moment** — `QN.xp.levelDelta()` is never called, so rank changes
> pass silently; (c) `qn-xp.js` is **not loaded** on path.html or dashboard.html.
> So the engine runs in-round and vanishes between rounds. Phase 0's true job is to
> make progression **persistent and celebrated between rounds**, not to "turn on"
> an engine that's already on in the round-end.

---

## The thesis

QuizNote has a motivational engine with no instrument panel *between rounds*. The
Path page is the future tense ("what next"), the Progress page is the past tense
("how I did"), and the round-end payoff (present tense) vanishes when the summary
closes. These are three views of one loop — anticipate → act → see it count →
anticipate again — split across surfaces that don't reference each other. The fix
is to **close the loop into one living home ("Studio"), make the XP/level engine
persistent across surfaces, and stage the emotional payoffs into a place a learner
returns to on purpose.**

## Hard constraints (named so we don't design into a wall)

1. **Audience = beginners→intermediate, all ages, incl. children + parents.**
   Dominant emotion is *encouragement, not domination*. Competitive/social
   mechanics are opt-in, age-walled, and **deferred** (need cloud + parental
   consent, both lawyer-gated/post-launch). Design "asocial-but-feels-alive" first.
2. **Local-only data today** (`qn_events`, `qn_profiles` in localStorage). No
   backend. Everything in P0–P4 must compute client-side from the event log.
3. **Flat static, no build.** Ship as shared files (`qn-xp.js` exists; add
   `qn-home.js`; extend `qn-theme.css`). No framework. 11ty migration is post-launch.
4. **Spec-first + four-surface rule still apply.** Each phase gets a `/specs/`
   build spec before code.

---

## Architecture decision: merge Path + Progress → "Studio"

Path (future) and Progress (past) are two renderings of one model (`qn_events`,
the tier-cleared rule, the recommender). Two renderings of one model is
duplication, not separation. **Collapse them into a single scroll-home, a
top-down motivational funnel:**

```
IDENTITY      ← Level ring, rank, streak, weekly goal (status masthead, made hero)
THE NEXT BEAT ← the Path hero recommendation + WHY (one-tap start)
TODAY'S QUESTS← 3 client-derived daily quests (the return hook)            [P3]
THE MAP       ← journey spine: tiers, mastery medals, where you are
COLLECTION    ← badges earned + next-to-unlock ghost wall (the payoff)     [P4]
[ Share / certificate ]
```

Lead with the next dose (forward pull), back it with accumulated evidence
(backward pride). `index.html` already redirects to path.html; that redirect will
point at Studio. Global nav becomes **Studio · Practice · Profile** (Practice =
the non-locking browse-everything escape hatch, unchanged).

---

## Chosen direction: "The Journey, told in the Conservatory's voice"

Structure of **B (Adventure/Journey)** — the map/journey spine as the progression
backbone — dressed in **A (Premium Professional)** craft and restraint (gold used
*scarcely* for rank/mastery; calm, settling motion; dignified rank titles that
echo real graded music education), with two surgical, child-safe borrowings from
**C (Mastery)**: self-vs-self **personal records** and the **perfect-game
detonation**. No competitive-social anything. This synthesis fits all ages, reuses
everything already built, and matches the encouraging brand voice. Full ranking,
tradeoffs, and the three pure directions are in the agency review (chat, May 2026).

### Brand vocabulary to maintain (locked)
- **XP** (never "points"/"experience" alone). **Learner Level** (never "player level").
- Level names: **Beginner (1–4) / Apprentice (5–9) / Player (10–19) / Musician
  (20–34) / Virtuoso (35+)** — in `qn-xp.js` nameBands.
- Medals: **Bronze (Easy) / Silver (Medium) / Gold (Tricky)**, highest-wins.
- Three-beat round-end: **EARN / PROGRESS / NEXT STEP**.
- Streak = daily 🔥 (emoji reserved for streak). Perfect game = "🌟 Perfect game".
- Color: tier identity Foundations=sun, Reading=teal, Theory=grape (reinforce so
  color *teaches*). `--rank-gold` reserved for rank+mastery only. Teal = XP/progress.
- Motion library (in qn-theme.css, all `prefers-reduced-motion` safe): `count-up`,
  `ring-fill`, `pop-in`, `particle-burst`, `level-up-flourish`; ADD `award-dock`
  (fly-to-home) + `breathe` (idle current-node pulse). Durations: 120/360/800ms only.

---

## Build order (ROI-per-risk; each phase ships a felt win on its own)

**P0 — Persistent progression + the level-up moment.** Load `qn-xp.js` on path +
dashboard; add a **status masthead** (level ring, rank, XP rule, streak, weekly
goal) via `QN.xp.summaryFor()`; add the **level-up interstitial** by calling
`QN.xp.levelDelta()` in the round-end. Highest perceived-gain-per-hour; everything
downstream renders against the masthead. *Does not rebuild the round-end's existing
in-round XP — only adds the cross-round persistence + the level-up celebration.*

**P1 — Studio: the merge.** Collapse Path+Progress into the single funnel-home
(`qn-home.js` + `qn-theme.css` cards): Identity → Next Beat → Map → Collection
skeleton. Pick the **one** streak style (retire the 3-way picker — opinion over
configuration). Structural spine everything hangs on.

**P2 — Next Beat + variety/depth recommender.** Enrich the recommender in
`qn-profile.js` with the **variety/depth vocabulary** (try bass · both clefs · 20
questions · timed). Done HERE so `qn-profile.js` (shared, Tier 3) is touched
**once**, in context. This is the only shared-recommender change in the sequence.
*Decided alongside Studio, not before it: the variety recs are a mastery-depth
feature (same axis as medals), so they feed the Next Beat card, quests, and badges.*

**P3 — Daily quests (the hook).** A Daily Quests card: 3 quests/day derived from
`qn_events` (pure client logic, no backend). Variety verbs from P2 become quest
content for free. First true return-hook.

**P4 — Collection wall + the moments.** Achievements engine (badges = predicates
over `qn_events`), ghost-badge empty state, interstitials w/ `award-dock`,
tier-graduation fireworks, self-vs-self PRs. The dopamine layer; lands last because
it docks into the surfaces P1–P3 build.

**P5 — Art + polish.** Illustrated map upgrade, motion unification, "Practice
Story" recap. Social/family seam stays parked behind cloud + consent (out of scope).

### Sequencing rationale
- P0 first: cheapest, biggest felt change, unblocks every later render.
- P1 before P2: stand the Studio frame before touching the shared recommender, so
  the enrichment is done in context and `qn-profile.js` is touched once.
- P3/P4 after the frame: quests/badges need a home to dock into; building them
  first = building them twice.

---

## Missing-systems audit (what we're adding, by phase)
Achievements/badges (P4, highest ROI) · milestones (P0 level-up + P4 graduation) ·
daily quests (P3) · streak freeze/repair (P4) · challenges (P5+) · collections
(P4 reframe of the 35 modules) · cosmetic unlockables (P5, no pay-to-win, content
never locks) · status ladder (P0, surface the existing rank) · surprise&delight
(P0/P4 interstitials, variable bonus) · social (deferred, gated). Progression
macro-loop = Studio itself (P1).

---

## Per-phase build specs
Added to `/specs/` as we reach each phase: `studio-p0-spec.md` (next),
`studio-p1-spec.md`, etc. This file is the master; the P-specs are the buildable detail.

---

## Known bugs to fix in their natural phase (don't patch early)

- **[P2] Next-step CTA tier mismatch — ROOT CAUSE CONFIRMED (init-order override).**
  Found in P0 testing (note-names, May 2026). Label "Medium" and the handoff
  payload AGREE — both are `rec.tier` from the recommender: qn-roundend.js ~L254
  (label) and ~L258–260 (writes `localStorage[module+'_settings'] =
  {difficulty: rec.tier, total: rec.length}`, then navigates). The mismatch is on
  the TARGET page, where three steps set difficulty IN SEQUENCE and the last wins:
  (1) `setupStart()` defaults `medium`; (2) `applyPathHandoff()` reads
  `note-names_settings` and correctly applies `medium` ✓; (3) **`applyProfileDefaults()`
  runs LAST** (note-names.html ~L1147–1161) and does "if selected tile is `medium`,
  switch to `prof.defaultDifficulty`" → clobbers the handoff to `tricky`. The
  profile's `defaultDifficulty` is `tricky` because onboarding's "I've been playing
  a while" sets it (it is NOT the last-played tier — it's the onboarding default).
  **Fix (P2):** a fresh path/recommender handoff must win over the profile default —
  e.g. `applyPathHandoff()` sets a "handoff applied" flag that makes
  `applyProfileDefaults()` no-op, or profile-default only fills in when no handoff
  key was present. Belongs in P2 because P2 rebuilds this exact handoff (Next Beat →
  module, passing difficulty/clef/length/timed). Touch points: each module's
  `applyProfileDefaults` vs `applyPathHandoff` ordering/precedence (note-names is the
  reference; the same pattern is cloned across modules — verify per module).
