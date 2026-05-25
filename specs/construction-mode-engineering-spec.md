# Engineering Session Spec — Construction Mode

**Type:** Architectural / engineering session (not a module). Renderer + interaction-pattern extension. Unlocks a future cluster of "construction" modules.
**ROI rank (May 2026 queue):** #12 — high *strategic* value (unlocks Build-a-Scale, Build-a-Triad, Build-a-Key-Sig as a future cluster), moderate cost (one engineering session). Modeled on the Phase 3 chord-renderer session pattern: build the infrastructure first, then clone-and-swap multiple modules onto it cheaply.

## Why this session
Every QuizNote module to date is an **identification** task: "what is this?" → pick from 4 choices. Bloom's taxonomy distinguishes recognition from production; production transfers better. Adding **construction** tasks — "build a major scale starting on D," "spell a minor triad starting on F♯," "place 3 sharps in the correct order" — meaningfully upgrades the pedagogy, not just adds more modules.

But construction tasks require a new interaction pattern (multi-select on a keyboard / multi-click on a staff to place notes or accidentals) that doesn't exist yet. Building it across multiple modules ad-hoc would duplicate work; building it once as shared infrastructure is the right pattern. This is the same lesson as Phase 3 — establish the renderer extension as its own session, *then* clone-and-swap modules onto it.

## What this session builds

### Three new interaction primitives, added to `qn-staff.js` (or a new `qn-construction.js` sibling)

1. **Multi-select keyboard:** an extension of the existing `NH.render` keyboard SVG (from Piano & Keyboard) that allows multiple keys to be highlighted/selected/deselected by tap or click. State managed externally (the host module decides what counts as "submitted"). Returns the selected key set as an array of MIDI numbers.

2. **Click-to-place staff:** an extension of the existing staff SVG (from Note Names + chord modules) that accepts taps/clicks anywhere on the staff and snaps them to the nearest line/space pitch. Renders a translucent "ghost" notehead at the snapped position; tapping again removes it. State = an ordered list of placed pitches.

3. **Sequence-of-glyphs builder:** for placing accidentals in the correct order on a key signature (e.g. "place 3 sharps on the staff"). Restricted to the canonical sharp-order positions (F♯, C♯, G♯, etc.) or flat-order positions; the learner selects how many and they fill in deterministically. Returns the number placed + a validation against the canonical position rules.

Each primitive is a JS module exposing an init / get-state / reset interface. Modules built on top of them write thin wrappers — same architectural pattern as the existing `NH.staff` shared component.

### A standard "submit + validate" UX

Construction modules can't validate on click the way MC modules can (every click changes state). They need a **submit button**, validation logic that runs at submit, and a feedback display that highlights *which parts* of the submission were right/wrong (not just "right/wrong").

This pattern needs to be designed and locked in this session — once established, every construction module reuses it. Key UX questions to resolve:
- Disable submit until N selections made? Or allow submit-with-wrong-count and treat as a mistake?
- Show correct answer overlaid on the submitted answer, or replace it entirely?
- Single attempt per question, or allow corrections before scoring?

## Architecture / file impact

- **New file:** `qn-construction.js` (alongside `qn-staff.js`) — hosts the three new primitives. Loaded by construction-mode modules; not loaded by existing identification modules (no impact on them).
- **No modifications to `qn-staff.js`** — additive only. Existing staff/chord rendering unchanged.
- **No modifications to existing 27+ modules** — they continue working as-is. The construction primitives are opt-in.
- **Template adjustments:** the standard module template assumes click-on-tile = submit-answer. Construction modules need a multi-step flow (build → submit). The template's game loop needs a configuration switch or a parallel "construction-game-loop" path. Decide which during the session.

## Future modules this session unlocks (the cluster that follows)

Once the engineering session is complete, the following modules become cheap clone-and-swaps onto the new primitives:

1. **Build a Scale** — multi-select keyboard. "Build D major" → user taps the 7 keys. Validate as the correct WWHWWWH pattern starting at D.
2. **Build a Triad** — multi-select keyboard. "Build an F♯ minor triad" → user taps 3 keys (F♯ + A + C♯). Validate as root + minor 3rd + perfect 5th.
3. **Build a Key Signature** — sequence-of-glyphs. "Place the key signature for E major" → user places 4 sharps; validate count + order + position.
4. **Build a Seventh Chord** — multi-select keyboard. "Build G dominant 7" → user taps 4 keys (G + B + D + F). Validate.
5. **Build an Interval** — click-to-place staff. "Place a note a perfect 5th above this one" → user clicks the staff at the correct position.

A 5-module cluster shipping cheaply after a single engineering session — exact same payoff shape as Phase 3 → Phase 4 (chord renderer → 8 chord modules).

## Session-level scope decisions to make at start

- **Which primitive to build first?** Recommendation: multi-select keyboard. It's the simplest validation (an unordered set match) and Piano & Keyboard already has the keyboard renderer to extend.
- **Validate at submit, or live-validate?** Recommendation: submit-only for v1 (mirrors test-taking). Live-validate is a v1.1 polish.
- **How to handle partial credit?** Recommendation: binary right/wrong in v1 (matches existing module scoring). Per-element partial credit is a v2 product question (affects events schema).

## Estimated effort

Roughly Phase 3 sized — a focused session of net-new shared-file engineering with cross-module testing. Not a quick clone. Plan it as its own session, no other work mixed in. Specifically:

- 60-70% of the session: building and testing the three primitives in isolation (no module shell — just the primitive on a test page).
- 20-30%: deciding the submit + validate UX and template path.
- 10%: integration test using a single proof-of-concept module (probably Build-a-Scale, since it's the simplest validation).

## Dependencies

- Independent of all current queue items. Can be sequenced whenever depth-of-pedagogy becomes the priority over breadth-of-roster.
- Should NOT be scheduled before the Foundations score-literacy cluster (#1–#5 in the queue) — those are higher-ROI and lower-risk. This session is a multi-week multiplier; the cluster is immediate gap-fill.
