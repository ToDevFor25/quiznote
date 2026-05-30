# Progress Explainers + Level/Medal Separation + Medal Model — Spec

**Status:** approved May 2026 (Jonathan). Rolls out as part of **P1** of the
gamification overhaul (XP/Levels live everywhere + persistent status bar), NOT
a standalone pass — it is coupled to that phase (see §0).

Companion to `specs/gamification-overhaul-spec.md`. That spec owns the XP/Level
engine and the round-end rewrite; this spec owns how the two reward systems are
**explained, separated, and awarded**.

---

## 0. Why this rides with the XP phase (sequencing)

These three designs cannot ship cleanly ahead of the XP phase because they
depend on its surfaces:

- **Level/medal separation** moves the global Level into a **persistent status
  bar on every module**. That bar is itself the P1 deliverable — it only exists
  once XP/Levels are derived and rendered everywhere.
- **Tap-to-learn explainers** attach to the **level chip** (status bar) and the
  **mastery medal** (round-end Beat 2). The level chip lives on the status bar
  (P1); the medal banner currently lives only on note-names (P0 proof).
- **Sticky bar + fade + scroll cue** can only land on modules that have the
  **new gamified round-end markup** (`.summary-scroll` / `.summary-bar`). Only
  note-names has it today; giving the other 35 that round-end IS the P1 rollout.

**Conclusion:** the all-36 rollout of everything below = the P1/XP phase. What
shipped in the P0 session is the **note-names reference proof** + this spec.

Reference mockup (interactive, tracked): `_mockups/progress-explainers.html`
(Before/After toggle + design annotations + working tap-to-learn sheets).

---

## 1. The two-axis model (the thing being explained)

Two parallel reward systems, deliberately kept distinct:

| Axis | What it measures | Scope | Visual vocabulary | Home surface |
|------|------------------|-------|-------------------|--------------|
| **Mastery medal** (Bronze/Silver/Gold) | how *well* you know a topic (depth) | **per module** | gold trophy/medal, discrete | on the topic — round-end Beat 2, dashboard grid, module tile |
| **Learner Level** (XP ladder + name band) | how *much* you've practiced (breadth/momentum) | **per profile, account-wide** | purple ring + climbing number | the **persistent status bar** (one identity surface, same spot everywhere) |

Plain-language one-liners (approved):
- **Levels = how much you've practiced overall.**
- **Medals = how well you know each topic.**

---

## 2. Tap-to-learn explainers (industry standard: explain on tap, not upfront)

No upfront tutorial. Both reward elements are tappable into a **bottom sheet**
(slide-up, scrim, dismiss on scrim/Got-it). Progressive disclosure.

**Level chip → sheet "Your Level"**
> How much you've practiced overall. You earn XP every round — more for harder
> rounds, clean rounds, and hot streaks. Enough XP bumps your level.
> _Footer:_ Levels are just for momentum — they never lock anything. Everything's
> always open to play.

**Medal banner → sheet "Mastery medal"**
> How well you know this one topic. Score 85%+ in a round to move this topic up:
> Bronze → Silver → Gold. Every topic has its own medal.
> _Footer:_ Medals = depth on each topic. Your Level = how much you've practiced
> across everything.

Affordance: a small `ⓘ` chip on each element signals tappability. Tier 2 copy.

---

## 3. Spatial / visual separation

- **Global Level** lives in the **persistent status bar** (top of every screen):
  profile dot · 🔥 streak · Level ring (number + name band) · weekly-goal ring.
  Tappable (→ §2).
- **Mastery medal** stays **in the body, on the topic**, tagged **"this topic"**
  so its per-module scope is explicit. Tappable (→ §2).
- Never stack the global Level inside the same card as the per-topic medal
  (today's note-names round-end stacks the level ladder in Beat 1 directly above
  the medal banner — the "Before" state in the mockup). P1 lifts the level out.
- Distinct visual language enforced: Level = ring + number (purple/momentum);
  Medal = trophy (gold/achievement). Never the same shape doing double duty.

---

## 4. Medal award model — **highest-wins (skipping allowed)**

Decided May 2026 (Jonathan). Rationale: tiers are difficulty levels of the same
skill — a learner who clears Tricky can trivially clear Easy/Medium, so gating
Gold behind back-filling lower tiers is busywork. Matches the recommender's
existing source of truth (`qn-profile.js nextTierFor` already treats
tricky-cleared as "module done").

**Clear rule (canonical, unchanged, identical in all 3 sites):** a tier is
cleared at **≥2 rounds at that tier each scoring ≥85%**. Drills earn nothing.

**Medal = highest cleared tier.** Easy→🥉 / Medium→🥈 / Tricky→🥇. Checked
tricky-first, so clearing Tricky alone = Gold immediately, regardless of
Easy/Medium.

**Bug fixed (P0, note-names):** the round-end progress note used *bottom-up*
(`nextTier` = lowest uncleared), contradicting the highest-wins label (e.g.
"🥇 Gold" + "2 more rounds → 🥉 Bronze"). Now forward-looking — the tier just
**above** the highest cleared; at Gold it reads "Gold — top tier mastered! 🎉"
(true whether laddered or skipped). **P1 must apply this same fix to every
module's Beat 2 as the round-end rewrite rolls out.**

**Completionist per-tier detail** (the "show all 3 pips" option) is **out of
scope for the round-end card** (empty lower pips next to an earned Gold reads as
broken/hollow). If wanted, it belongs on the **dashboard mastery grid** only,
which already computes `cleared:{easy,medium,tricky}` per module.

---

## 5. Sticky bar + fade scrim + scroll cue (mobile-reach, proven on note-names)

Inline-proven on note-names this session. Promote to `qn-theme.css` **during
P1** (shared-file change = Tier 3; do it as part of the round-end rollout, not an
orphan commit):
- `.summary-scroll` (scrolling content) + pinned `.summary-bar` (high-frequency
  actions never hide behind content).
- Honest scroll-fade scrim (`#summary-screen.scroll-end` hides it at bottom / no
  overflow).
- Animated "More ▾" scroll cue (auto-hides via the same `.scroll-end`,
  tap-to-scroll, `prefers-reduced-motion` safe).

---

## 6. Still Tier-3 / open sign-offs (do NOT ship without Jonathan)

- **Level name bands** — tentatively Beginner / Apprentice / Player / Musician /
  Virtuoso (qn-xp.js `nameBands`). Confirm final list before P1 ships (per
  overhaul spec §8.4).
- **Any XP / Level / streak / medal claims that reach the landing page** are
  user-facing promises (overhaul spec §8.3) — lawyer/brand gate.

---

## 7. Standard features inherited

Bottom sheets honor global mute + `prefers-reduced-motion`; all copy is
beginner/parent-readable per the §2 audience cap; no schema changes (medals and
XP both derive from existing `qn_events`; additive-only).
