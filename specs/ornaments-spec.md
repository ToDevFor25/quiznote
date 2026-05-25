# Module Spec — Ornaments

**Slug:** `ornaments` · **Namespace:** `OR` · **File:** `ornaments.html` · **Title:** "Ornaments" · **Tagline:** "Little symbols, big personality."
**Tier (roster):** Foundations · Level 2 · §5 #32
**Built from:** `accidentals.html` sibling (single-symbol focus + four-button MC) + `qn-staff.js` (single notehead + glyph) + `qn-profile.js` v1.6.0 + `qn-nav.js`. **No audio in v1** (ornament *realization* is performer-dependent; v1 is visual ID only).
**ROI rank (May 2026 queue):** #5 — fifth and final in the score-literacy cluster. Lowest-cost addition in the cluster (direct Accidentals clone, no new question type machinery).

## Why this module
ABRSM Grades 3–5 introduce ornaments. RCM Levels 3–6 cover them. Standard piano repertoire from late-elementary forward (early Bach, Mozart sonatinas) is full of them. Currently the roster has no coverage. Pure visual-ID is a tight, cheap clone of Accidentals — finite symbol catalog, no new renderer machinery.

## What it teaches
Recognize ornament symbols on noteheads; identify what each one means in general terms. Visual identification only — *realization* (how to play them note-for-note) is out of scope for v1.

- **Trill** (tr or tr~~~ wavy line)
- **Mordent** — upper mordent (short zigzag), lower mordent (zigzag with vertical line through it)
- **Turn** (∽ or ∾)
- **Grace note** — acciaccatura (small note with stroke through stem), appoggiatura (small note without stroke)
- **Tremolo** (slashes through stem)

## Tiers
- **Easy:** trill, turn, grace note (generic). Weights: `{ name .5, effect .5 }`.
- **Medium:** + upper mordent, lower mordent. Weights: `{ name .4, effect .4, discriminate .2 }`.
- **Tricky:** + tremolo + acciaccatura vs. appoggiatura distinction. Weights: `{ name .3, effect .3, discriminate .4 }`.

## Question types
1. **`name`** — show notehead with ornament; "What is this called?" → four name-tile choices.
2. **`effect`** — show ornament; "What does this tell the performer to do?" → four tiles (full sentences: *Rapidly alternate this note with the one above / Quickly play this note then the one above, then back / Play a quick decoration note before the main note / Repeat this note rapidly*).
3. **`discriminate`** (Medium+) — show two related ornaments side by side (upper mordent vs. lower mordent, or acciaccatura vs. appoggiatura); "Which one [property]?" → two large tiles.

## Distractor strategy
- **`name`:** similar-looking ornaments as distractors (mordent vs. turn — both zigzag-family; acciaccatura vs. appoggiatura — both small notes).
- **`effect`:** include adjacent ornament's effect as a distractor (turn correct → mordent's effect as distractor) — tests precise discrimination, not just "I recognize this."
- **`discriminate`:** the always-the-confused-pair format. Upper mordent (zigzag) vs. lower mordent (zigzag with vertical line); acciaccatura (slashed stem, played as fast as possible before the beat) vs. appoggiatura (unslashed, takes half the value of the main note).

## Bravura glyph references
- Trill: U+E566 (tr) + U+EAA4 (wavy line continuation if needed)
- Upper mordent: U+E56C
- Lower mordent: U+E56D
- Turn: U+E567
- Inverted turn: U+E568
- Tremolo (1/2/3 slashes): U+E220 / U+E221 / U+E222 (attached to stem)
- Grace note (acciaccatura): smaller notehead glyph + slash through stem
- Grace note (appoggiatura): smaller notehead glyph without slash

## Theory accuracy
- **Trill (tr):** rapid alternation between the written note and the note a step above (in the prevailing key).
- **Upper mordent:** main note → note above → back to main note (very fast).
- **Lower mordent:** main note → note below → back to main note (very fast).
- **Turn:** note above → main note → note below → main note (four notes, typically equal).
- **Acciaccatura** ("crushed"): grace note played as fast as possible, almost simultaneously with main note. Has a slash through its stem.
- **Appoggiatura** ("leaning"): grace note that takes half the value of the main note (or two-thirds for dotted notes). No slash.
- **Tremolo:** rapid repetition of a single note (or rapid alternation between two notes if the slashes connect them).
- Different period conventions (Baroque vs. Classical vs. Romantic) realize these differently. v1 teaches the general rule, not period-specific practice. Flag this in the explainer.

## Renderer
- Single notehead on a short staff with attached ornament glyph (above the notehead for trill/mordent/turn; before the notehead for grace notes; through the stem for tremolo).
- Reuses Accidentals' notehead + glyph placement logic.
- **No `qn-staff.js` changes required.**

## Sub-skill tagging
`name` / `effect` / `discriminate`. Labels:
- `name → "Ornament names"`
- `effect → "What each ornament does"`
- `discriminate → "Easy-to-confuse pairs"`

## Standard features (inherited)
Same as Tempo Markings.

## Concept explainer cards
1. "**Ornaments** are little symbols that decorate a note — they tell the performer to add extra notes around the main one. A *trill* rapidly alternates with the note above; a *turn* goes above, main, below, main."
2. "A **mordent** is a fast 3-note flick: main → upper → main (upper mordent), or main → lower → main (lower mordent). The vertical line through the symbol marks the lower version."
3. "A **grace note** is a small decorative note played quickly before a main note. *Acciaccatura* (slashed) is as fast as possible; *appoggiatura* (no slash) leans into the main note and takes some of its value."
