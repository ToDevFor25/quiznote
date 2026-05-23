# Piano & Keyboard — spec

**Slug:** `piano-keyboard`
**Namespace:** Reuses NH.render (additive)
**File:** `piano-keyboard.html`
**Title:** Piano & Keyboard
**Tagline:** See the key. Name the note.
**Tier in roster:** Foundations (Phase 1 #4)
**Source clone:** `note-names.html`

## What it teaches
Piano-keyboard geography: which letter goes with which key. The reverse of PianoQuiz — there the student sees a staff note and finds it on the keys; here they see a highlighted key and name the letter. Distinct learning channel from Note Names (staff-based) and direct keyboard fluency for piano students.

## Selector options
None at v1. Clef selector hidden (irrelevant on a keyboard); default forced to treble for pool selection. Accidentals selector reuses note-names' Tricky-tier UI ("All keys / Sharps / Flats / White only").

## Tier breakdown
Same pitch pools as note-names (reuses RANGES.treble verbatim):
- **Easy:** E4..F5 white keys (9 pitches).
- **Medium:** C4..A5 white keys (13).
- **Tricky:** A3..C6 (17 white + sharps + flats per the accidentals selector).

## Question type
"Which note is highlighted?" Four-choice letter MC. Choices use existing letter-button rendering from note-names (`displayName` returns "C", "C♯", etc.).

## Distractor strategy
Inherited from note-names' buildChoices: prefer adjacent diatonic steps, same accidental type, classic confusables (B↔D, E↔F, etc.).

## Rendering
**Keyboard renderer (new, added to `NH.render`):**
- SVG piano spanning C3..C6 inclusive (22 white keys + 15 black keys, 3 octaves + 1)
- White keys: 30×130, black keys: 18×78
- Target key highlighted with grape (`#5B3FE4`); other whites stay white, blacks stay dark
- "?" cue rendered inside the highlighted key
- Each C white key labeled (C3 / C4 / C5 / C6) for octave orientation
- Recolors via `.pk-target` selector — green on correct, coral on wrong (uses existing `recolorNote` which now handles both ellipse and rect)

## Music theory accuracy
Sharp/flat enharmonic spelling matches note-names' Tricky pool (D♭4 = C♯4 share a physical key; the LABEL is determined by the question — student picks the exact spelling shown). C/F have no flat (Cb/Fb), B/E have no sharp (B#/E#) — already enforced in buildPool.

## Concept explainer cards (not in v1)
Inherits structure from note-names; can be added later.

## Sub-skill tagging
`skills: { '<pitch-name>': { c, t } }` — keyed by the pitch (C4, F♯5, etc.). Raw-key fallback in dashboard.

## localStorage namespace
`piano-keyboard_*` prefix via M.slug, plus the PK rename (was NN).

## Tile color
`bg-teal` (Piano family — matches PianoQuiz).

## Source-file changes
None to note-names.html or piano-quiz.html. Pure additive clone with a new local renderKeyboard function.
