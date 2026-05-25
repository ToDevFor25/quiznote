# Module Spec — Score Navigation Symbols

**Slug:** `score-navigation` · **Namespace:** `SN` · **File:** `score-navigation.html` · **Title:** "Score Navigation" · **Tagline:** "Repeats, jumps, and where to go next."
**Tier (roster):** Foundations · Level 2 · §5 #31
**Built from:** `accidentals.html` sibling (isolated-symbol focus) + `qn-staff.js` (existing barline rendering) + `qn-profile.js` v1.6.0 + `qn-nav.js`. **No audio.**
**ROI rank (May 2026 queue):** #4 — fourth in score-literacy cluster. The `routing` question type (where do you go next?) is unique to this module and deferred to v1.1.

## Why this module
Repeat barlines appear in beginner repertoire by lesson 5. D.C. al Fine is in every method book. The current 27-module roster has no coverage of score navigation.

## What it teaches
Recognize symbols that direct the performer through the score non-linearly; understand each one's instruction; (v1.1 Tricky) trace the order of play through a short passage with multiple markings.

- **Repeat structures:** start-repeat `||:`, end-repeat `:||`, first ending (volta 1), second ending (volta 2).
- **Jump markings:** D.C. al Fine, D.S. al Coda, segno (𝄋), coda (𝄌), fine.

## Tiers
- **Easy:** start-repeat, end-repeat, fine, D.C. al Fine. Weights: `{ name .5, meaning .5 }`.
- **Medium:** + first/second endings, D.S. al Coda. Weights: `{ name .35, meaning .4, discriminate .25 }`.
- **Tricky:** + segno, coda + D.C. vs D.S. emphasis. Weights v1: `{ name .3, meaning .4, discriminate .3 }`. Weights v1.1 (with routing): `{ name .25, meaning .3, discriminate .25, routing .2 }`.

## Question types
1. **`name`** — show symbol in isolation; "What is this called?" → four name-tile choices.
2. **`meaning`** — show symbol; "What does this tell the performer?" → four tiles (full sentences).
3. **`discriminate`** — show two related markings ("D.C. al Fine" / "D.S. al Coda"); "Which one means *go back to the very beginning?*" → two tiles. Tests the most-confused pair.
4. **`routing`** (v1.1, deferred) — show schematic of a passage with markings (e.g. boxes labeled A · B · :|| · C · D.C. al Fine · Fine); "What is the order of sections played?" → four ordered-list tiles.

**v1 ships `name` / `meaning` / `discriminate` only.** `routing` is scaffolded but added in v1.1 once the first three are validated.

## Distractor strategy
- **`name`:** distractors are other symbols in the same conceptual family (D.C. correct → D.S., al Fine, al Coda).
- **`meaning`:** distractors swap key words — "from the top" vs. "from the sign"; "end at Fine" vs. "jump to coda". Forces full reading, not keyword-matching.
- **`discriminate`:** always the confused pair (D.C. vs D.S., first ending vs second ending).
- **`routing`** (v1.1): off-by-one orderings — extra repeat, missed jump, wrong landmark.

## Bravura glyph references
- Start repeat barline U+E040 · End repeat U+E041 · End-start repeat U+E042.
- Segno U+E047 · Coda U+E048.
- Volta brackets: SMuFL has U+E030 range; cleaner to draw as SVG (bracket + number).
- "D.C. al Fine" / "D.S. al Coda" / "Fine" rendered as italic styled text — these are textual instructions.

## Theory accuracy
- **D.C.** = *Da Capo* = "from the head" = from the very beginning.
- **D.S.** = *Dal Segno* = "from the sign" = from the 𝄋.
- "**al Fine**" = stop playing at the word *Fine* (regardless of where it appears).
- "**al Coda**" = play until *To Coda* mark, then jump to the section labeled with 𝄌.
- **First ending** played first time; **second ending** on the repeat (after `:||`, skip ending 1, play ending 2).
- Common confusion: thinking D.C./D.S. always go to the very end. They go to **Fine** or to the **coda** — those are exit instructions.

## Renderer
- For `name` / `meaning` / `discriminate`: render symbol in isolation, large, centered on the card. Same pattern as Accidentals' isolated-symbol presentation. No staff context needed for v1.
- For repeat barlines: render a short 2-staff-line segment showing the barline in context — `qn-staff.js` already draws barlines for time signatures; reuse.
- For `routing` (v1.1): horizontal sequence of labeled boxes with markings between them, drawn as CSS/SVG. *Schematic* render, not a staff render. New visual pattern; spec separately when v1.1 is planned.
- **No `qn-staff.js` changes required for v1.**

## Sub-skill tagging
`name` / `meaning` / `discriminate` (+ `routing` in v1.1). Labels:
- `name → "Symbol names"`
- `meaning → "What each marking does"`
- `discriminate → "Easy-to-confuse pairs"`
- `routing → "Reading the path through a piece"` (v1.1)

## Standard features (inherited)
Same as Tempo Markings.

## Concept explainer cards
1. "Music doesn't always play straight through. **Navigation markings** tell you when to repeat, jump, or stop. A **repeat barline** (`:||`) means play that section twice."
2. "**D.C. al Fine** = go back to the beginning, play until you reach *Fine* (the end). **D.S. al Coda** = go back to the 𝄋 sign, play until you reach *To Coda*, then jump to the 𝄌 coda section."
3. "**First and second endings** work with repeats: play through ending 1 the first time, then on the repeat, skip ending 1 and play ending 2 instead."
