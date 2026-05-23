# Dotted Notes & Ties — spec

**Slug:** `dotted-notes`
**Namespace:** `DN`
**File:** `dotted-notes.html`
**Title:** Dotted Notes & Ties
**Tagline:** A dot adds half. A tie adds another note.
**Tier in roster:** Foundations · Level 1 (Phase 1, post-Note Values)
**Source clone:** `note-values.html` (additive — source file unchanged)

## What it teaches
A dot to the right of a note adds half the note's value. A tie connects two notes of the same pitch — their durations sum. These two notations both let you express durations that don't fit a single notehead. This module drills the duration arithmetic: see a dotted note or tied pair, identify how many beats it represents (in simple meter, quarter = 1 beat).

## Selector options
None at v1. Single mode.

## Tier breakdown

Convention: quarter note = 1 beat (simple meter — always). Stated explicitly in the explainer card to avoid the 6/8 confusion.

**Easy — dotted notes (introduction):**
Mix of regular and dotted notes so the student practices discriminating "is this a half or a dotted half?" — the core teaching point.
- `whole-note` (4 beats), `dotted-whole` (6)
- `half-note` (2), `dotted-half` (3)
- `quarter-note` (1), `dotted-quarter` (1½)
6 items. Choices = unique beat values drawn from the pool.

**Medium — + dotted eighth + simple ties:**
- + `eighth-note` (½), `dotted-eighth` (¾)
- + `tied-half-quarter` (3, equivalent to dotted-half — pedagogical: students see two ways to write the same duration)
- + `tied-quarter-eighth` (1½, equivalent to dotted-quarter)
10 items.

**Tricky — + dotted sixteenth + complex ties:**
- + `sixteenth-note` (¼), `dotted-sixteenth` (⅜)
- + `tied-whole-half` (6, equivalent to dotted-whole)
- + `tied-dotted-quarter-eighth` (2, equivalent to half)
- + `tied-half-eighth` (2½)
- + `tied-quarter-sixteenth` (1¼)
15 items.

## Question type
Single: "How many beats?" Four-choice MC. Choices are beat values (`"1 beat"`, `"1½ beats"`, `"3 beats"`, etc.). Pool of choices = unique beat values appearing in the tier; 3 distractors picked at random from non-correct values.

## Distractor strategy
- Always include the **±0.5 neighbor** (e.g., for dotted-half (3), include "2½ beats" and "3½ beats" as likely distractors).
- Always include the **undotted equivalent** when applicable (e.g., for dotted-half (3), include "2 beats" — the plain half).
- Fill the 4th slot from remaining unique tier values.

This tests the most common confusions: "is the dot doing anything?" and "did I count right?"

## Music theory accuracy notes
- A dot adds **exactly half** the note's value. Dotted half = half (2) + quarter (1) = 3.
- A second dot would add a quarter (half of half) — **not in this module**. Out of beginner-intermediate scope.
- A tie joins two notes of the **same pitch**; their durations sum. (Slurs are different — tie ≠ slur. Out of scope here.)
- All durations expressed in simple meter (quarter = 1). Compound meter (6/8, etc.) treated where the eighth = 1 is the beat unit — explicitly out of v1 scope. Module will say "assume quarter = 1 beat" in the explainer.

## Rendering
- **Dotted notes:** Bravura SMuFL note glyph (U+E1D2 etc.) followed by augmentation dot (U+E1E7) with small space. Rendered as a single `.nv-symbol` div with combined character string. Reuses Note Values' explosion FX engine unchanged.
- **Tied pairs:** Two glyphs side-by-side with a CSS-drawn tie arc above (semicircle via border + border-radius). Wrapped in `.dn-tied` div. Tie arc rendered in same color as the notes; recolors on right/wrong same as the symbol does.

## Choice format
String labels — "1 beat", "1½ beats", "3 beats", etc. Unicode vulgar fractions for clean rendering (`½`, `¼`, `¾`, `⅜`, `⅝`).

## Concept explainer cards (3)
1. **The dot.** "A dot to the right of a note adds half its value. Half note = 2 beats. Dotted half = 2 + 1 = 3 beats."
2. **The tie.** "A tie connects two notes of the same pitch — their values sum. Quarter tied to eighth = 1 + ½ = 1½ beats."
3. **Two ways, same length.** "Some durations have multiple notations. Dotted quarter (1½) and quarter tied to eighth (1½) are the same length — just written differently."

## Sub-skill tagging
`skills: { '<pool-key>': { c, t } }` — keyed by question's pool key (`dotted-half`, `tied-quarter-eighth`, etc.). High cardinality; raw-key fallback used in `dashboard.html` (no entries needed in SKILL_LABELS unless a friendlier label is wanted later).

## localStorage namespace
`dn_` prefix. `dn_muted`, `dn_pb_<tier>`, `dotted-notes_settings`.

## Standard features inherited (from clone)
Generic game loop, QNM contract, FX engine, profile chip, start/play/summary screens, modal, audio nudge, shared CSS, shared modal component, shared toast, weak-spot logging, retry mechanic.

## Source-file changes
None to `note-values.html`. Pure additive clone.

## Tile color
`bg-coral` (matches Note Values family).
