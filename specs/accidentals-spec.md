# Module Spec — Accidentals

**Slug:** `accidentals` · **Namespace:** `AC` · **Title:** "Accidentals" · **Tagline:** "Sharp, flat, natural — know the signs."
**Tier (roster):** Foundations · Level 2 · §5 #5
**Built from:** `note-names.html` sibling (staff + four-button MC) + `qn-staff.js` + `qn-profile.js` v1.6.0 + `qn-nav.js`.

## Why this module
Foundations gap named in the project doc: Key Signatures assumes accidentals it never teaches. Accidentals teaches the symbols and what they *do* before the learner meets them en masse in a key signature.

## What it teaches
Recognize an accidental on a note and identify its effect; name the altered pitch; recognize enharmonic equivalence.

- **sharp (♯)** — raises a half step
- **flat (♭)** — lowers a half step
- **natural (♮)** — cancels a prior accidental (returns to the natural pitch)
- **double-sharp (𝄪)** — raises a whole step
- **double-flat (𝄫)** — lowers a whole step
- **enharmonic equivalence** — two spellings, same sounding pitch (C♯ = D♭)

## Tiers (Easy / Medium / Tricky — app convention)
- **Easy:** sharp, flat, natural. Question type weights: `{ effect .7, name .3 }`.
- **Medium:** + double-sharp, double-flat. Weights: `{ effect .45, name .4, enharmonic .15 }`.
- **Tricky:** all five symbols + enharmonic emphasis. Weights: `{ effect .3, name .35, enharmonic .35 }`.

The accidental set is a finite fixed catalog (5 symbols). To make it harder later, add question types or enharmonic depth — not new symbols.

## Question types (these are the sub-skills tagged for the dashboard)
1. **`effect`** — "What does this symbol do?" → four word tiles (Raises a half step / Lowers a half step / Raises a whole step / Lowers a whole step / Cancels the accidental). Correct = the symbol's effect.
2. **`name`** — a natural notehead is shown with an accidental; "Name this note." → four pitch-name tiles (e.g. C♯, C♭, C, D♯). Correct = the altered pitch spelled with the accidental.
3. **`enharmonic`** — "Which note sounds the same?" → four pitch-name tiles. Correct = the enharmonic partner using the doc's locked spellings.

## Distractor strategy
- **`effect`:** always include the *opposite-direction* effect (♯ paired with a "lowers" option), so the choice tests direction, not luck. Mirrors the Key-Sig opposite-type-mirror rule. When the symbol is natural, distractors are the four directional effects.
- **`name`:** include the same letter with the opposite accidental (C♯ correct → C♭ as a distractor) and the unaltered natural (C), forcing attention to the symbol.
- **`enharmonic`:** distractors are near-miss spellings (a half step off, or the same letter with wrong accidental).

## Theory accuracy (locked, from doc §9)
Enharmonic spellings follow the doc exactly:
- C♯↔D♭, D♯↔E♭, F♯↔G♭, G♯↔A♭, A♯↔B♭ (the five black keys).
- Tricky enharmonic emphasis uses the canonical key spellings: F♯ (not G♭) for 6 sharps context, D♭ (not C♯) for 5 flats, etc. — but at the *note* level both directions are taught (C♯=D♭ asked both ways).
- Natural cancels to the white-key pitch. Double-sharp/double-flat resolve by whole step (C𝄪 = D natural in sound; B𝄫 = A).

## Progressive context (matches Time Signatures' progressive-context idea)
- Easy: treble clef only, single notehead + accidental.
- Medium: + random clef (treble/bass).
- Tricky: + occasional ledger-line placement (reuses Note Names' range expansion).

## Answer highlighting
On answer, the chosen tile lights teal (correct) / coral (wrong) and the correct tile is revealed — same pattern as Note Names. For `effect`/`enharmonic` (word/name tiles) no staff element re-colors; for `name` the notehead pulses its result color.

## Sub-skill tagging (dashboard)
Per-round tally keyed by question type (`effect` / `name` / `enharmonic`), derived from `state.history` at summary time via the same pattern Time Signatures uses. Dashboard renders "Within this skill" weakest-first. Self-readable keys; add `SKILL_LABELS` entries: `effect → "Symbol effect"`, `name → "Naming altered notes"`, `enharmonic → "Enharmonic equivalents"`.

## Standard module features (inherited)
5/10/20 lengths · optional 30/45/60s timer · mute toggle · personal-best per tier · profile chip via QNNav · save-scores prompt + hold-and-backfill · concept explainer (3–5 skippable cards) · path-handoff settings read.

## Concept explainer cards (3, skippable forever after first view)
1. "An **accidental** changes a note's pitch. ♯ raises it a half step, ♭ lowers it a half step."
2. "A **natural** (♮) cancels a sharp or flat — back to the white-key note. **Double** signs (𝄪 𝄫) move a whole step."
3. "Two names, one sound: C♯ and D♭ are the same key on a piano. That's **enharmonic** equivalence."
