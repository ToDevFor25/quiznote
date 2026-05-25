# Module Spec — Dynamics

**Slug:** `dynamics` · **Namespace:** `DY` · **File:** `dynamics.html` · **Title:** "Dynamics" · **Tagline:** "From a whisper to a shout."
**Tier (roster):** Foundations · Level 2 · §5 #29
**Built from:** `accidentals.html` sibling + `qn-staff.js` + `qn-profile.js` v1.6.0 + `qn-nav.js`. **No audio in v1.**
**ROI rank (May 2026 queue):** #2 — second in score-literacy cluster. Reuses patterns from Tempo Markings (#1).

## Why this module
Every method book uses *p* and *f* by lesson 3. ABRSM Grade 1 tests them. Current roster has no coverage. Symbols are visually distinctive, the catalog is finite, the build is a near-direct clone of Accidentals.

## What it teaches
Recognize dynamic markings; order them on a quiet→loud continuum; recognize change-of-dynamic markings (crescendo / diminuendo, worded and as hairpins); recognize accent-family dynamics (sforzando, fortepiano).

- **Steady dynamics** (quiet → loud): ppp, pp, p, mp, mf, f, ff, fff.
- **Change:** crescendo (cresc. + opening hairpin `<`), decrescendo / diminuendo (decresc. / dim. + closing hairpin `>`).
- **Accent-family:** sforzando (sfz), fortepiano (fp).

## Tiers
- **Easy:** p, mp, mf, f. Weights: `{ meaning .6, ordering .4 }`.
- **Medium:** + pp, ff, crescendo, diminuendo. Weights: `{ meaning .35, ordering .35, direction .3 }`.
- **Tricky:** + fff, ppp, sfz, fp + hairpin notation. Weights: `{ meaning .3, ordering .3, direction .25, accent .15 }`.

## Question types
1. **`meaning`** — show dynamic glyph; "What does this mean?" → four word-tiles (*Very soft / Medium loud / Loud / Very loud*).
2. **`ordering`** — show two symbols; "Which is louder?" → two large tiles.
3. **`direction`** (cresc./dim./hairpins) — "What does this tell the performer?" → four tiles (*Get louder gradually / Get softer gradually / Stay the same / Get suddenly louder*).
4. **`accent`** (Tricky) — show "sfz" or "fp"; → four tiles (*Sudden strong accent / Loud then immediately soft / Soft then immediately loud / Gradually getting louder*).

## Distractor strategy
- **`meaning`:** include opposite-direction dynamic + one adjacent (mf correct → "Very soft" + "Medium soft / mp").
- **`ordering`:** Easy/Medium non-adjacent; Tricky may use adjacent.
- **`direction`:** always include both "louder gradually" and "softer gradually" — tests direction, not concept.
- **`accent`:** distractors are other accent-family meanings + cresc./dim.

## Bravura glyph references
- Dynamic letters: U+E520 (p), U+E522 (f), U+E521 (m), U+E524 (s), U+E525 (z), U+E523 (r). Compose mf = "m"+"f", sfz = "s"+"f"+"z". Bravura designed for this composition.
- Hairpins: CSS-drawn SVG `<polyline>` (cleaner than SMuFL hairpin glyph at small sizes).
- "cresc." / "dim." / "sfz" / "fp" rendered as italic styled text where words are used.

## Theory accuracy
- *Sforzando (sfz)* = sudden strong accent on one note, then return to context dynamic. NOT "very loud." Use that misconception as a distractor.
- *Fortepiano (fp)* = loud attack, immediately soft. Order matters in the name.
- *Diminuendo* and *decrescendo* mean the same; both abbreviations correct. Easy uses "diminuendo"; Medium introduces both.
- Hairpins open toward the louder end: `<` (opens right) = cresc; `>` (opens left) = dim. "Open mouth = louder" works for explainer.

## Renderer
Symbol-on-card, same as Tempo Markings. No staff. Hairpins as inline SVG `<polyline>` in the card. **No `qn-staff.js` changes required.**

## Sub-skill tagging
`meaning` / `ordering` / `direction` / `accent`. Labels:
- `meaning → "Dynamic meanings"`
- `ordering → "Loud vs. soft"`
- `direction → "Crescendo & diminuendo"`
- `accent → "Sforzando & fortepiano"`

## Standard features (inherited)
Same as Tempo Markings (mute toggle is a no-op in v1 since there's no audio).

## Concept explainer cards
1. "**Dynamics** are how loud or soft to play. *p* (piano) is soft, *f* (forte) is loud. Adding letters makes them more extreme: *pp* very soft, *ff* very loud."
2. "A **crescendo** (cresc. or `<`) means get gradually louder. A **diminuendo** (dim. or `>`) means get gradually softer. The hairpin opens toward the louder side."
3. "*sfz* (**sforzando**) is a sudden strong accent on one note. *fp* (**fortepiano**) means loud, then immediately soft."
