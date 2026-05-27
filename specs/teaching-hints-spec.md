# Feature Spec — Teaching Hints (In-Game Learning Layer)

**Type:** Feature (not a module). Cross-cutting enhancement to the game loop
across all 32 modules.
**ROI rank:** Highest pre-monetization priority. Closes the #1 competitive gap
("no teaching — only testing"). Converts QuizNote from a practice tool into a
learning system — the difference between $3.99 and $39.

---

## Why this feature

Every competitor that charges money teaches before testing. Tenuto pairs with
musictheory.net lessons. Perfect Ear has integrated lessons. MyMusicTheory has
full lesson content. QuizNote's 3-card concept explainers are a start but thin.

The teaching hints layer solves this at the moment it matters most: when the
student gets something wrong and doesn't know why. A contextual hint bridges
the gap between "wrong" and "try again" — turning a failed attempt into a
learning moment instead of a guessing game.

---

## What it does

When a student answers incorrectly, a **teaching hint card** appears explaining
the concept behind the correct answer. The student reads the hint, dismisses it,
then gets a second attempt with that knowledge fresh. The hint is 1-2 sentences,
specific to the question type or mistake pattern, authored per-module.

### The flow (step by step)

1. Student taps a wrong answer
2. Button turns red, boop sound plays (as now)
3. **Teaching hint card appears** (layout differs by screen size — see below)
4. Timer pauses automatically (wrong answers must not be double-punished)
5. Student reads the hint, taps **"Got it"**
6. Hint dismisses, student gets their **second try** with all 4 buttons live
   (the wrong button is no longer red — clean slate for retry)
7. **If correct on retry →** "Got it! ✓" toast, partial credit (no streak),
   next question. Timer resumes.
8. **If wrong on retry →** lock, reveal correct answer ("It's ___"), next
   question. Timer resumes.
9. If the same hint was already shown this round, **skip step 3** — go
   straight to "Try once more!" retry (no repeated lectures).

### What changes from today

- **24 modules already have retry.** The hint card slots in *before* the
  existing retry. Where today shows "Try once more!" immediately, it now
  shows the hint card first, then proceeds to retry.
- **8 modules gain retry.** Note Values, Dotted Notes, Time Signatures,
  Key Signatures, Chromatic Scale, Scale Modes, Ear: Rhythm, Ear: Scales
  currently go straight from wrong → reveal. They gain the full
  hint → retry → reveal flow.
- **No modules lose anything.** When hints are toggled off, the flow
  reverts to exactly what exists today (retry where it exists, direct
  reveal where it doesn't — or, optionally, retry everywhere even with
  hints off; builder's call, Tier 2).

---

## Visual design

### Mobile (< 760px): Pop-up card

A modal card centered on screen, same overlay pattern as the quit dialog
(`QN.ui.confirm` proves this works). The question/staff stays visible
underneath but dimmed.

```
┌──────────────────────────┐
│  ░░░ dimmed game ░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░  │
│  ╔════════════════════╗  │
│  ║  💡                ║  │
│  ║                    ║  │
│  ║  Perfect intervals ║  │
│  ║  (4th, 5th,        ║  │
│  ║  octave) use       ║  │
│  ║  augmented /       ║  │
│  ║  diminished — not  ║  │
│  ║  major / minor.    ║  │
│  ║                    ║  │
│  ║   ┌────────────┐   ║  │
│  ║   │   Got it   │   ║  │
│  ║   └────────────┘   ║  │
│  ╚════════════════════╝  │
│  ░░░░░░░░░░░░░░░░░░░░░░  │
└──────────────────────────┘
```

**Why pop-up on mobile:** Screen real estate is too tight to add an inline
panel without pushing answer buttons off-screen. The quit dialog already
proves the modal-card pattern is thumb-friendly and polished. The hint card
uses the same `#modal-overlay` mechanism, same border-radius, same backdrop.
It *is* a modal, styled as a teaching moment.

- Card background: white (or `--cream` if defined), not the overlay itself
- 💡 icon top-left (or a small "Hint" label — builder's Tier 1 call)
- Text: 16-18px, `var(--ink)`, 1-2 sentences max
- "Got it" button: solid teal, centered, chunky (same `.btn` system)
- Backdrop tap = same as "Got it" (safe dismiss = proceed to retry)
- Card slides up with a short ease-out (200ms), same animation family as
  the quit dialog

### Desktop / tablet (≥ 760px): Inline banner

An inline card that slides in **between the question area and the answer
buttons**. The student sees question + hint + buttons simultaneously — the
hint is reference material for their second try, not an interruption.

```
┌──────────────────────────────────────────┐
│  Stats bar                               │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │        Staff / Question          │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ 💡 ─────────────────────────────┐    │
│  │ Perfect intervals (4th, 5th,     │    │
│  │ octave) use augmented /          │    │
│  │ diminished — not major / minor.  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [  Choice A  ]    [  Choice B  ]        │
│  [  Choice C  ]    [  Choice D  ]        │
│                                          │
└──────────────────────────────────────────┘
```

**Why inline on desktop:** There's room. The student benefits from seeing
question + hint + buttons all at once — they can look at the staff, read the
hint, and apply it in one glance. No modal dismissal step needed.

- Banner appears with a short slide-down (200ms)
- Light background (cream/pale yellow — distinct from the white card and
  the question area, reads as "teaching" not "game UI")
- Left-aligned 💡 icon + hint text
- No "Got it" button on desktop — the banner stays visible until the
  student makes their second choice (then it slides out)
- If the student *wants* to dismiss it early, tapping the 💡 or the banner
  collapses it (nice-to-have, not required for v1)

### Breakpoint

Use the existing 760px breakpoint (already used for `.btn` responsive shrink
and other mobile/desktop splits across qn-theme.css). Below 760px = pop-up.
At or above 760px = inline banner.

---

## Toggle system

Three surfaces, cascading. A student who never touches a setting gets
the right default. A student who wants control has it.

### 1. Onboarding default (profile-wide)

The existing onboarding step 2 captures self-reported level:
- **"Just starting"** → hints ON by default
- **"I know some"** → hints ON by default
- **"I've been at this a while"** → hints OFF by default

Stored as `hintsEnabled: true|false` on the profile object in
`qn_profiles`. Additive field — absent = `true` (safe default for
existing profiles that predate the feature).

### 2. Start screen toggle (per-module)

A toggle on the start screen, in the same area as the timer toggle.
Visual treatment: same `q-block` container, same toggle pattern.

```
┌──────────────────────────────┐
│  💡 Teaching hints           │
│  ┌───┐                      │
│  │ ● │  on                  │
│  └───┘                      │
└──────────────────────────────┘
```

Initial state loaded from the profile-wide default. Once toggled
per-module, the override is stored in `<slug>_settings` (same pattern
as timer/tier/clef). The per-module override wins over the profile
default.

### 3. In-game dismiss

On the hint card itself, a small "Don't show hints" link (muted text,
below the "Got it" button on mobile; right-aligned in the banner on
desktop). One tap:
- Hints off for the rest of this round
- Persisted to `<slug>_settings` as `hints: false`
- Next time they open this module, the start-screen toggle reflects
  the saved preference

This is the "I've outgrown these" escape hatch. The student doesn't
have to quit to change it.

### Toggle hierarchy (summary)

```
Profile default (onboarding)
  ↓ overridden by
Per-module setting (start screen toggle)
  ↓ overridden by
In-game dismiss (sticky, writes back to per-module)
```

---

## Hint data model

### Per-module hint catalog

Each module defines a `HINTS` object in its renderer/data section, keyed
by question type (matching the module's existing question-type axis).

```js
const HINTS = {
  quality: [
    'Count the half steps between the two notes to determine the interval quality.',
    'Perfect intervals are the 4th, 5th, and octave — they don\'t have major or minor quality.',
  ],
  name: [
    'The interval number counts the letter names inclusively — C to E is a 3rd (C, D, E = 3 letters).',
  ],
};
```

**Key = question type.** Most modules already have a natural question-type
axis (Time Signatures: `label`/`top`/`bottom`/`whichBeats`/`whichUnit`;
Intervals: `quality`/`name`; Dynamics: `meaning`/`ordering`/`direction`/
`accent`). The hint key matches this axis.

**Value = array of strings.** When multiple hints exist for a question type,
one is chosen at random (but never the same one twice in a round — tracked
by the per-round `shownHints` set).

**Fallback.** If no hint exists for the current question type, skip the
hint card and go straight to the existing retry flow. This lets hint
authoring be incremental — a module with partial coverage still works.

### How hints are selected

```
1. Student answers wrong
2. Look up HINTS[currentQuestionType]
3. If no hints for this type → skip to retry (no card)
4. If hints exist → pick one not yet shown this round
5. If all hints for this type already shown this round → skip to retry
6. Show the hint card
7. Add the hint key to shownHints set
```

### Hint authoring guidelines

These are the rules for writing hint text — baked into the spec so the
builder can author hints autonomously without asking per-module questions.

1. **1-2 sentences max.** A hint is a nudge, not a lesson. If it takes
   more than 2 sentences, it's too complex — split the concept or
   simplify the language.

2. **Tell them WHY, not WHAT.** Don't restate the correct answer ("The
   answer is a perfect 5th"). Explain the underlying rule ("Perfect
   intervals are 4th, 5th, and octave — they don't use major/minor").
   The student applies the rule on their retry.

3. **Use the vocabulary the module teaches.** If the module uses
   "leading tone," the hint uses "leading tone." Don't introduce
   terminology the student hasn't encountered in this module's tier.

4. **Accuracy is non-negotiable.** Follow all music theory accuracy
   rules from CLAUDE.md and project doc §9. When unsure about a theory
   point, flag it rather than guessing. Better to ship a module with
   no hint for one question type than to ship a wrong hint.

5. **Address the likely confusion, not the abstract concept.** For
   Key Signatures: "Sharps follow the order F-C-G-D-A-E-B. If you
   see 3 sharps, they're always F♯, C♯, G♯ — that's A major."
   Not: "Key signatures indicate the tonal center of the piece."

6. **No more than 5 hints per question type.** Diminishing returns
   past that. 2-3 is the sweet spot.

7. **No emoji in hint text.** The 💡 icon on the card is enough
   visual signaling. The text itself should read as clean, calm
   guidance. (The icon itself is a Tier 1 design call — could be 💡,
   a lightbulb SVG, or a simple "Hint" label.)

---

## Implementation phases

### Phase 1: Retry everywhere (prerequisite)

Extend the 2-try retry mechanic to the 8 modules that lack it:
Note Values, Dotted Notes, Time Signatures, Key Signatures,
Chromatic Scale, Scale Modes, Ear: Rhythm, Ear: Scales.

The pattern is proven in 24 modules. Each of the 8 needs:
- `state.attempts` counter (add to state init)
- `onWrong` branch: if `attempts < 2` → "Try once more!" toast +
  clear wrong button after 900ms; if `attempts >= 2` → lock + reveal
- `onCorrect` branch: track `cleanFirstTry = attempts === 1`
- Reset `attempts = 0` in `nextQuestion`
- `pushHistory` with `'retry'` kind for second-try correct

**Autonomy:** This is fully Tier 1. The pattern is byte-identical
across 24 modules. Clone the `onWrong`/`onCorrect` structure from
note-names.html (the cleanest reference). No questions needed.

### Phase 2: Hint engine + toggle infrastructure

The game loop plumbing. Touches the template and all 32 modules, but
the change per module is mechanical (add hint card DOM + wire the
toggle).

**2a. Profile schema** — add `hintsEnabled` to profile object.
Additive, no migration needed (absent = `true`). Tier 1.

**2b. Onboarding** — map self-reported level to `hintsEnabled` default
in profile creation. Tier 1 (the mapping is defined in this spec).

**2c. Start screen toggle** — add a "Teaching hints" toggle block to
each module's start screen. Same `q-block` + toggle pattern as the
timer. Read from `<slug>_settings.hints` (per-module override) or fall
back to profile `hintsEnabled`. Tier 1 (mechanical, proven pattern).

**2d. Hint card DOM + CSS** — add the hint card markup and styles.
Mobile: modal (reuse `#modal-overlay` or build alongside it). Desktop:
inline banner between staff-wrap and choices-grid. New CSS in
qn-theme.css for shared hint-card styles. Tier 2 for the exact visual
treatment (colors, spacing, animation); follow the design spec above
but dial in values by eye.

**2e. Game loop integration** — modify `onWrong` to check for available
hints, show the hint card, pause timer, and wait for dismiss before
proceeding to retry. Add `shownHints` set to round state. Tier 1
(the flow is defined in this spec).

**2f. In-game dismiss** — "Don't show hints" link on the card. Writes
`hints: false` to `<slug>_settings`. Tier 1.

**Ship Phase 2 with empty `HINTS = {}` in every module.** The engine
works — toggles work, the card appears when hints exist, and gracefully
falls through to plain retry when they don't. This separates plumbing
from content and lets us verify the UX before authoring 32 modules'
worth of hint text.

### Phase 3: Hint content authoring

Author `HINTS` objects for all 32 modules. Start with the 14
Foundations modules (where beginners land first), then Reading, then
Theory.

**Autonomy:** Fully Tier 1/2. The builder follows the authoring
guidelines in this spec, the music theory accuracy rules in CLAUDE.md
§9 and project doc §9, and the module's existing question types.
No questions needed per-module. The builder should note any
music-theory accuracy uncertainties in the commit message and flag
them — but should not stop and ask unless it's a genuine Tier 3
theory ambiguity with no clear answer.

**Batch size:** Author hints for 4-6 modules per commit. Don't do all
32 in one giant commit — bank wins as you go.

---

## Autonomy guide (for the builder)

This feature is pre-approved as a Tier 3 scope decision (it modifies
the game loop template, touches shared files, and adds to the profile
schema). The following sub-decisions are pre-classified:

### Tier 1 — decide and build, no questions

- Hint wording (following authoring guidelines + accuracy rules)
- Visual styling within the design system (colors, spacing, radii)
- Hint key naming conventions
- Frequency cap / `shownHints` implementation
- Animation choices (slide direction, duration, easing)
- The 💡 icon vs lightbulb SVG vs "Hint" label
- "Got it" button label (could be "Got it", "OK", "→", etc.)
- Retry extension to the 8 non-retry modules (proven pattern)
- DOM structure of the hint card
- Whether the wrong button stays red or clears before retry
- `HINTS` object location within each module file
- Order of module hint authoring within a tier (Foundations first,
  then Reading, then Theory — but which module first within a tier
  is up to the builder)

### Tier 2 — decide, note reasoning, proceed

- Whether retry is everywhere even when hints are OFF (vs. only in the
  24 modules that already have it). Recommendation: yes, extend retry
  to all 32 regardless of hint toggle — it's a better UX universally.
- Exact breakpoint for modal vs inline (spec says 760px; adjust if
  real-device testing shows a different sweet spot)
- How many hints per question type per module (spec says 2-3 sweet
  spot, max 5 — but some simple question types may only need 1)
- Whether the inline desktop banner has a manual dismiss or only
  clears on next answer
- Whether hint card shows the question type label ("About interval
  quality:") above the hint text

### Tier 3 — stop and ask

- Any change to the scoring model (hints should not affect how points
  are awarded — the existing retry scoring stays the same)
- Any change to the existing explainer cards (the 3-card pre-game
  concept explainers are a separate system; don't merge them)
- Adding hints that require new visual rendering (e.g., a diagram
  inside a hint card — text-only for v1)
- Changes to qn-profile.js beyond the additive `hintsEnabled` field
- Changes to qn-nav.js or qn-audio.js

---

## Files touched

### Shared files (modified)
- `qn-theme.css` — new `.hint-card`, `.hint-overlay`, `.hint-banner`
  styles, plus responsive breakpoint rules
- `qn-profile.js` — additive `hintsEnabled` field on profile object
  (no version bump needed, no migration — absent = `true`)
- `profile.html` or onboarding flow — map level to `hintsEnabled`

### All 32 module files (modified)
- Start screen: add hints toggle `q-block`
- Game loop: add hint-card DOM, wire `onWrong` to hint engine,
  add `shownHints` to state, wire dismiss
- Data section: add `HINTS = {}` (Phase 2) then populate (Phase 3)

### Not touched
- `qn-staff.js` — no rendering changes
- `qn-audio.js` — no audio changes
- `qn-nav.js` — no nav changes
- `qn-ui.js` — hint card is game-loop-specific, not a shared widget
  (unless the builder judges it cleaner to put the show/dismiss
  logic there — Tier 2 call)
- `index.html`, `play.html`, `path.html` — no surface changes

---

## What this is NOT

- **Not a lesson system.** Hints are 1-2 sentences at the moment of
  confusion. They don't replace the concept explainer cards, a
  textbook, or a teacher. They're the coach's whisper between
  attempts.
- **Not adaptive difficulty.** Hints don't change which questions
  appear or how hard they are. The weak-spot recommender handles
  that at the module level.
- **Not a new module type.** No new files, no new surfaces. This
  lives inside the existing game loop of every module.
- **Not visual/diagram hints.** v1 is text-only. If a future version
  wants to show a mini staff diagram inside a hint, that's a
  separate spec (Tier 3).

---

## Success criteria

The feature works when:
1. A beginner who doesn't know what a key signature is can learn from
   wrong answers, not just be told the right one
2. An intermediate can turn hints off and never see them
3. The existing game pace feels preserved — hints add a beat, not a
   lecture
4. No module's scoring, timer, or streak mechanics are affected
5. Teaching hints work on mobile (iPhone SE-sized) through desktop
   without layout breakage
