# Gamification Overhaul — Spec

_Status: DRAFT for Jonathan's review. Authored May 2026. This is a cross-cutting
**Tier 3** initiative (new system + new user-facing promises), not a module build._

---

## 0. Why this exists

QuizNote has 35 correct, well-engraved modules and a polished chunky-button
design language. It does **not** have a felt *journey*. Every surface is
individually good but parked next to the others — beautiful rooms, no hallways.

The canonical symptom (Jonathan, May 2026): _"I finish a round and get 2/10 —
nothing. No pop-ups, nothing. Just a page that shows the score and buttons to
'choose your own adventure.'"_

The fix is **connective tissue**, not a rewrite. The flat-file / no-build
architecture is not the bottleneck. The missing layer is: a single persistent
progression number that every action visibly moves forward, narrated at every
handoff.

**North star:** _Every round ends with the learner knowing three things without
thinking — how they did, what it earned them, and what's next — and feeling
pulled into the next one._

---

## 1. Scope & guardrails

- **Additive, not a rewrite.** Build on the existing scaffold, shared files, and
  `qn_events` schema. No bundler, no framework, no folders (per CLAUDE.md).
- **Mobile-first**, great on tablet/desktop. Every new surface designed at
  360px width first.
- **Honor existing systems:** the recommender (`QN.recommend.next`), mastery
  medals (Bronze/Silver/Gold), streak visualizations, weekly practice goal,
  teaching hints, settings card, profile defaults. We *surface and connect*
  these, we don't replace them.
- **Respect `prefers-reduced-motion` and the global mute** in every new
  animation/sound (existing convention).
- **The four-surface rule** still applies to anything module-facing.
- **Roll out proof-on-one-then-all.** Any change to the per-module summary or
  in-round chrome ships on ONE module first (note-names), is QA'd on device,
  then rolled across all 35 as its own pass — never a single 35-file bulk edit
  (brace-corruption risk per BUILD_LOG).

---

## 2. The progression spine — XP + Levels

The one number the whole game hangs on. Lives on the status bar; fed by every
round; shown at boot, at round-end, at level-up.

### 2.1 Currency

- **XP** — earned every round. **Learner Level** — a ladder derived from total
  XP. Account-wide (sums across all profiles? No — **per active profile**, like
  all learning data).
- Mastery medals (Bronze/Silver/Gold per module) remain the **depth** axis; XP/
  Level is the **breadth + momentum** axis. Two axes = always something to chase.
- Trophy-case / badges = a **later additive phase (P3)**, not part of the spine.
  Schema is designed so they layer on without migration.

### 2.2 XP formula (Tier 2 — tunable; these are the v1 defaults)

Per round:
```
baseXP      = correct * 10
accuracyBonus = (correct/total >= 0.85) ? 25 : 0     // "clean round" bonus
difficultyMult = { easy: 1.0, medium: 1.25, tricky: 1.5 }[tier]
streakBonus  = bestInRoundStreak >= 5 ? 15 : 0
roundXP      = round( (baseXP + accuracyBonus + streakBonus) * difficultyMult )
```
Design intent:
- **A 2/10 still earns ~20 XP.** The emotional floor is never zero. Effort and
  showing up are always rewarded; mastery is rewarded *more*.
- Harder tiers and clean rounds pay better → pulls learners upward, mirroring
  the recommender's forward-progress philosophy (no grind-the-easy-tier exploit).

### 2.3 Level curve (Tier 2)

Gently escalating, fast early levels for the first-session dopamine, slower
later. v1 table (XP to reach each level), e.g.:
```
Lvl 1: 0   Lvl 2: 50   Lvl 3: 120  Lvl 4: 220  Lvl 5: 360 ...
levelFor(totalXP) = largest n where threshold[n] <= totalXP
```
Each level gets a friendly name tier (e.g. 1–4 "Beginner", 5–9 "Apprentice",
10–19 "Player", 20+ "Musician") — names Tier 2, final list TBD.

### 2.4 Schema & storage (ADDITIVE — no migration)

XP is **derivable from existing `qn_events`** (each event has
`correct/total/tier/module`). So:
- **Source of truth = `qn_events`.** `QN.xp.totalFor(profileId)` recomputes by
  replaying events through the formula. No new stored field required → zero
  migration, zero corruption risk, retroactively rewards all past play.
- **Optional cache** (`xpCache` on the profile, additive optional field) only if
  replay proves slow under the 5000-event cap — measure first, add only if
  needed. If added, it follows the existing additive-field convention.
- New shared module: **`qn-xp.js`** exposing `QN.xp`:
  - `roundXP(event)` — pure function, the formula above.
  - `totalFor(profileId)` — sum over `QN.events.query(profileId)`.
  - `levelFor(totalXP)` → `{ level, name, intoLevel, levelSpan, pct }`.
  - `summaryFor(profileId)` → `{ totalXP, level, name, pct, streak, weekGoal }`
    — the one call the status bar + summary consume.
  - Pure logic, no DOM. Same load-order/Proxy conventions as the other shared
    files. **This is the Tier-3 new-system piece.**

---

## 3. P0 — The round-end rewrite (the centerpiece)

A single shared shape for the summary at **every** score, replacing the current
report-card. Three beats, top to bottom:

### Beat 1 — THE EARN (always something)
- XP ticks up with a count-up animation + a rising chime. "+22 XP".
- The level ring advances (even a sliver). If it crosses a level → defer to the
  **level-up interstitial** (P2) before showing the summary.
- Streak status: "🔥 Streak kept!" (or "🔥 Streak started!").
- **At 2/10 this is the whole point:** the learner still *earned* and *kept*
  something. Never a blank.

### Beat 2 — THE PROGRESS (this round as a step, not a verdict)
- A per-module mastery meter: `Silver ▓▓▓░░ — 1 more 85% round to go`.
  Uses the canonical clear rule (≥2 rounds ≥85% per tier; medal = top tier
  cleared) already shared across recommender/dashboard/path.
- The existing tiered title (`tier-perfect/great/good/practice`) stays but is
  **reframed**: low scores read as encouragement ("Good start!"), never neutral
  dead air.

### Beat 3 — THE NEXT STEP (one primary action, not a menu)
- **One dominant button** driven by the recommender: `Next: Intervals · Easy →`
  (`btn huge`, accent color). Pre-seeds the module settings exactly like
  `path.html`'s `startRecommended` already does.
- **On a low score**, the primary becomes `Try again — you've got this`
  (re-run same module/tier, hints on). Failure → retry, never a dead end.
- "Choose something else" demoted to a quiet secondary text link.
- The **miss-list becomes a coaching card**: "Let's nail these next time:" with
  the 1–3 missed items framed as a target, not a wall of red. (Reuses the
  existing miss-list data; restyled + recopied.)

### P0 build method
1. Build the full Beat 1–3 sequence + a minimal `qn-xp.js` core + the status
   bar on **`note-names` only**, as a working vertical slice.
2. Device-QA with Jonathan on Dev.
3. Roll out across all 35 as a dedicated pass (the summary markup + summary JS
   are cloned per-module; roll out section-by-section with structural verify +
   DOM-mock init trace per module, never one bulk edit).

---

## 4. The status bar (persistent identity + progress)

A slim bar surfaced on `path.html` (and ideally every hub page) — the always-on
home of the meta-number:
- 🔥 streak · Level + XP-into-level ring · weekly-goal ring · profile color
  accent.
- All three values already computed (streak viz, recommender, practiceGoal) —
  this just *surfaces them where they're always seen* instead of buried in
  `dashboard.html`.
- Component lives in `qn-xp.js` render helper or `QN.ui` (Tier 2: pick at build).

---

## 5. Per-surface changes (end-to-end journey)

| Surface | Change | Tier |
|---|---|---|
| `index.html` | **Returning users (active profile) route straight to `path.html`** — brochure is for strangers only | T2 |
| App boot | ~700ms branded splash + 3-note rising chime, once per session | T2 |
| Onboarding | End with a 10s can't-fail "taster" round → first level-up in <60s; "Not sure? Start at the beginning" one-tap | T2 |
| `path.html` | Status bar; "Since you were here" return strip (streak-loss aversion); animated Today art; Today/Practice/Progress bottom-tab IA | T2 |
| Module start | One-line stakes preview ("Clear 85% → 🥈 Silver"); show your best for this tier | T2 |
| In-round | Combo/streak escalation (badge heats up, chime pitches up, 5-in-a-row flourish); live XP ticker; particle burst on correct | T2 |
| Round-end | The P0 three-beat sequence (§3) | T2/T3 |
| Between rounds | Level-up + medal-earned full-screen interstitials w/ audio; goal-hit celebration | T2/T3 |
| On leave | "Come back tomorrow to keep your 🔥 4-day streak" | T2 |

---

## 6. Visual / motion / audio vocabulary

The existing chunky neo-brutalist system is an asset — **amplify, don't
overhaul.**
- **Button hierarchy:** primary CTA on summary/home must dominate (`btn huge`,
  accent) vs a quiet secondary text link — stop pairing near-equal-weight
  buttons.
- **Shared motion vocabulary** in `qn-theme.css` so it's consistent + free
  everywhere: `count-up`, `ring-fill`, `pop-in`, `particle-burst`,
  `level-up-flourish`. All gated on `prefers-reduced-motion`.
- **Audio feedback pass:** distinct pleasant sounds for correct / streak-step /
  level-up / medal / goal-hit, via the existing engine. Honor global mute.
- **Splash with audio** = cheapest "premium app" signal.

---

## 7. Phased roadmap (ROI-ordered)

- **P0 — Round-end rewrite + minimal XP core + status bar**, proof on
  note-names. _Fixes the exact "2/10 = nothing" complaint. ~1 session._
- **P1 — XP/Levels real + status bar everywhere + index redirect.** _The
  meta-number goes live. New shared file = Tier 3._
- **P2 — The moments:** level-up/medal interstitials + audio, goal/streak
  celebrations, in-round combo escalation, boot splash.
- **P3 — Home as game dashboard:** "since you were here", bottom-tab IA,
  animated Today art, **badge trophy case** (the deferred achievement layer).
- **P4 — Polish sweep:** motion vocabulary, app-wide audio-feedback pass, button
  hierarchy cleanup, start-screen stakes preview.

P0 ships first as proof, then we decide on the meta-layer with something real to
feel.

---

## 8. Open Tier-3 decisions (Jonathan's calls)

1. **Currency:** XP + Levels as the spine, trophy case deferred — _proposed_.
   (Alt: build the full trophy case up front.)
2. **XP per-profile vs account-wide:** _proposed per-profile_ (matches all other
   learning data being per-profile).
3. **Any XP/Level/streak claims on the landing page** are user-facing promises —
   marketing-copy Tier 3, written only once the feature is live (per the
   "copy describes current state, not roadmap" rule).
4. **Level names** and final XP/curve tuning — Tier 2, confirm before P1 ships.

---

## 9. What this is NOT

- Not leaderboards / social / competition (explicitly out per project doc §3a).
- Not a new content area or module — purely connective + presentational.
- Not a migration — XP derives from existing events; additive-only.
- Not an architecture change — same flat-file, no-build, shared-file model.
