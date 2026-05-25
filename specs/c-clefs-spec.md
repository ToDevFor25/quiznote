# Module Spec — C Clefs (Alto & Tenor)

**Slug:** `c-clefs` · **Namespace:** `CC` · **File:** `c-clefs.html` · **Title:** "C Clefs" · **Tagline:** "Alto and tenor — middle C in the middle."
**Tier (roster):** Reading · Level 4 · §5 #36
**Built from:** `note-names.html` direct clone — same template, different clef glyph, different staff-line-to-pitch mapping. `qn-staff.js` extension required for alto + tenor clef rendering (small extension; flag as Tier 3 below).
**ROI rank (May 2026 queue):** #11 — niche audience but lowest-cost intermediate add. Skip if keeping the roster tight; build if you want the "no I really do cover what your teacher teaches" credibility for orchestral string and brass students.

## Why this module
Alto clef is required for viola (the only orchestral string instrument that reads it primarily) and used for some trombone passages. Tenor clef is used for cello, bassoon, and trombone upper registers. ABRSM Grade 5 introduces alto clef as a Theory requirement. Currently no coverage. Build cost is low (clone of Note Names with a different clef + different pitch mapping), and the structural symmetry with Note Names is clean: Note Names + Ledger Lines + Piano Quiz + Piano & Keyboard cover treble/bass; C Clefs covers the third clef family.

**Audience note:** this is the most niche of the Reading additions. Approve only if the orchestral/intermediate-instrumentalist segment is a target user. The other Reading adds (Circle of Fifths, Transposition) serve broader audiences.

## What it teaches
Identify notes on the alto clef and tenor clef staves; recognize where middle C sits in each.

- **Alto clef** — middle C on the **third (middle) line** of the staff. Used primarily by viola.
- **Tenor clef** — middle C on the **fourth line** (second from top). Used by cello, bassoon, trombone in upper register.
- The C clef is movable; alto and tenor are its two most common positions.

## Tiers
- **Easy:** alto clef only, white-key notes within the staff (no ledger lines). Weights: `{ identify .8, clef-id .2 }`.
- **Medium:** + tenor clef + alto/tenor selector. White-key notes only. Weights: `{ identify .7, clef-id .3 }`.
- **Tricky:** + first ledger line above and below (alto: middle C area is already on a staff line, so ledger lines extend up to high G and down to low E — natural extensions). Weights: `{ identify .65, clef-id .25, ledger .1 }`.

## Question types
1. **`identify`** — show a note on an alto or tenor staff; "Name this note." → four letter-name tiles (C, D, E, F, G, A, B — same 7-letter pool as Note Names).
2. **`clef-id`** — show an empty staff with just the clef; "What clef is this?" → four clef-name tiles (*Treble / Bass / Alto / Tenor*). Tests clef-symbol recognition before pitch identification.
3. **`ledger`** (Tricky only) — show a note one ledger line above/below the alto or tenor staff; "Name this note." → four letter-name tiles.

## Distractor strategy
- **`identify`:** distractors include the note one staff-step away (off by one line/space — the most common reading error) + a note that *would* be correct under treble clef interpretation (tests "are you reading the clef, or defaulting to treble?").
- **`clef-id`:** the four-clef set is the fixed answer pool; correct rotates.
- **`ledger`:** distractors are the adjacent on-staff notes + one ledger line too far.

## Theory accuracy
- **Alto clef line/space mapping** (bottom to top): line 1 = F3, space 1 = G3, line 2 = A3, space 2 = B3, line 3 = **C4 (middle C)**, space 3 = D4, line 4 = E4, space 4 = F4, line 5 = G4.
- **Tenor clef line/space mapping** (bottom to top): line 1 = D3, space 1 = E3, line 2 = F3, space 2 = G3, line 3 = A3, space 3 = B3, line 4 = **C4 (middle C)**, space 4 = D4, line 5 = E4.
- The C clef glyph (𝄡) is centered on whichever line corresponds to middle C — that's the only rule. Alto centers on line 3; tenor centers on line 4.
- Other C clef positions (soprano on line 1, mezzo-soprano on line 2, baritone on line 5) exist historically but are out of scope for v1 — modern repertoire uses alto and tenor almost exclusively.

## Renderer
**Requires extension to `qn-staff.js` — flag as Tier 3 before starting build.**

Current `qn-staff.js` renders treble and bass clefs only. Adding alto + tenor requires:
1. New clef glyphs in `NH.render` (SMuFL: alto clef U+E05C, tenor clef same U+E05C with different vertical anchor — actually U+E05C is the C clef; positioning determines alto vs tenor).
2. New `STEP_TO_Y` lookup per clef (treble uses E4 = bottom line = step 0; alto uses C4 = middle line; tenor uses C4 = 4th line).
3. Test alongside existing treble/bass — must not break Note Names, Ledger Lines, Piano Quiz, Intervals, etc.

This is a **renderer-extension session** per CLAUDE.md's "Module builds are autonomous" exception #2 (shared file change required). Build it as its own session before starting the c-clefs module clone. Estimated effort: similar to the Phase 3 chord renderer session (small but surgical, with cross-module testing).

## Sub-skill tagging
`identify` / `clef-id` / `ledger`. Labels:
- `identify → "Reading C clefs"`
- `clef-id → "Clef recognition"`
- `ledger → "Ledger lines in C clefs"`

## Standard features (inherited)
Same as Note Names — including a clef selector (alto / tenor / both) modeled on Note Names' treble/bass/both selector.

## Concept explainer cards
1. "The **C clef** marks where middle C sits on the staff. Unlike treble and bass clefs (which are fixed), the C clef *moves* — its position on the staff tells you which line is middle C."
2. "**Alto clef** centers on the middle line — that's middle C. Used mainly by **viola**, and sometimes by trombone."
3. "**Tenor clef** centers on the 4th line (second from the top) — that's middle C. Used by **cello, bassoon, and trombone** in their upper registers, where bass clef would need many ledger lines."
