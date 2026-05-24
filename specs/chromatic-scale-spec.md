# Module Spec — Chromatic Scale

**Slug:** `chromatic-scale` · **Namespace:** `CH` · **Title:** "Chromatic Scale" · **Tagline:** "Half steps all the way."
**Tier (roster):** Reading · Level 4 · §5 #17
**Built from:** clone of `scales.html` (pure data swap — staff renderer, audio voice, game loop, confetti, FX engine all inherited verbatim).

## Why this module
Project doc §5 #17. The chromatic scale is the gateway to chromatic harmony and the spelling convention (sharps ascending, flats descending) is a tested staff-reading skill. Scales already teaches *named* scale identification with a clean 4-button MC; chromatic slots in as a new family of scale entries with its own data set.

## What it teaches
- Recognize a chromatic scale (all half steps) vs a diatonic scale (whole+half pattern) on the staff.
- The standard spelling convention: **ascending = sharps, descending = flats** (tonic stays natural).
- Direction discrimination (ascending vs descending chromatic).

## Spelling convention (locked, music-theory accuracy)
Pedagogical "simple chromatic" — used in all school-level theory textbooks for the chromatic scale taught as an isolated concept:
- **Ascending:** every chromatic note spelled with **sharps** (C, C♯, D, D♯, E, F, F♯, G, G♯, A, A♯, B, C). Tonic and naturally-occurring naturals stay natural.
- **Descending:** every chromatic note spelled with **flats** (C, B, B♭, A, A♭, G, G♭, F, E, E♭, D, D♭, C). Tonic stays natural.
- The diatonic-preserving variant (chromatic notes in F major using B♭ because B♭ is the key's natural 4th) is post-tonal voice-leading material, **deliberately out of scope** for beginner-to-intermediate. Note this in the explainer.
- All chromatic scales render with **key signature = 0** (no sharps/flats); every chromatic note carries its own accidental explicitly on the staff. (`needsExplicitAccidental` falls through correctly because mode is neither `major` nor `minor-natural`.)

## Tiers (Easy / Medium / Tricky — app convention)
- **Easy:** 5 ascending chromatics (tonics C, G, D, F, B♭). Distractors = the 5 corresponding major scales (matching tonics). Teaches "chromatic = every half step, major = step pattern."
- **Medium:** + 5 descending chromatics (same tonics). Distractors = all major scales + natural minors. Adds direction discrimination.
- **Tricky:** + all 12 tonics × asc/desc (24 chromatic entries). Distractors = all majors, all natural minors, all harmonic + melodic minors. The opposite-direction same-tonic chromatic is always a candidate distractor (tests the spelling convention — "is this asc or desc?").

## Pool entries
Each entry: `{ name, tonic, ks: 0, mode: 'chromatic-asc' | 'chromatic-desc', notes }`
- `notes` = 13 octave-tagged pitches (tonic to tonic, ascending or descending).
- 12 tonics × 2 directions = 24 chromatic scales total.

### Ascending tonic list (octave choice picks a register that fits the staff comfortably)
C4, C#4/Db4, D4, D#4/Eb4, E4, F4, F#4/Gb4, G4, G#4/Ab4, A4, A#4/Bb4, B4 → up to next octave.
For ascending chromatic, the **tonic is named with sharps when ambiguous** (so C# Asc not Db Asc — keeps the spelling convention rule unbroken). For descending, the tonic is named with flats (Db Desc, not C# Desc).

## Question type (sub-skill tagged for the dashboard)
Single type: **`identify`** — "What scale is this?" → 4-button MC with scale names. Sub-skill tagged by `mode`:
- `chromatic-asc` — ascending chromatic
- `chromatic-desc` — descending chromatic

(Major / minor mode tags from scales.html carry through naturally if a major/minor distractor were ever counted as a sub-skill — but only the *correct* answer's mode is tagged, so these will always be one of the two chromatic keys above.)

## Distractor strategy
Adapted from scales.html `makeChoices`:
1. **Same-mode siblings first** — for an ascending chromatic, prefer other ascending chromatics with different tonic. (Tests "is the start note right?")
2. **Opposite-direction same-tonic** — at Medium+ tiers, the same-tonic opposite-direction chromatic is a high-value tempting distractor (tests spelling-direction discrimination).
3. **Tempting cross-family** — the *major scale starting on the same tonic* is a tempting distractor (the chromatic and the major both start on C, but the chromatic has 13 notes and every accidental — a fast learner ignores the second note).
4. Fill remaining slots from the active pool.

Distractor uniqueness: scales.html guards against duplicate `.name`; chromatic names like "C Chromatic Asc" vs "C Major" are distinct.

## Theory accuracy notes (locked, from doc §9)
- Sharp ascending order: F♯ C♯ G♯ D♯ A♯ E♯ B♯ (irrelevant for chromatic spelling — every half step gets its own sharp).
- Flat descending order: B♭ E♭ A♭ D♭ G♭ C♭ F♭ (same — every half step gets its own flat).
- Tonic always natural — even if the tonic letter would normally be a sharp/flat in some key context. The chromatic scale is its own thing; its tonic is the unaltered letter pitch.
- Ascending tonics that are themselves accidental notes (e.g., F♯ Ascending) start on F♯, then proceed in sharps (F♯, G, G♯, A, A♯, B, C, C♯, D, D♯, E, F, F♯). No double sharps required — the convention writes B♯ as natural C and E♯ as natural F when convenient. We **do not** use B♯ or E♯ in v1 (cleaner reads; matches school textbooks).

## Render notes (clone source = scales.html)
- 13-note sequence vs scales' 8 — packs tighter on the same width. `appendNote` spaces by `index * span / (totalCount - 1)`; chromatic will render at ~62% of the per-note spacing of a major scale. Readable; tested at 480x staff width in clone.
- Each note has an accidental glyph drawn to its left at `lineGap * 1.0`. Adjacent accidentals don't collide because alternating notes are naturals (no accidental) or because the half-step spacing pushes the accidental into the prior note's gap. If visible crowding appears in QA, widen the SVG `viewBox.width` from 520 → 580 for chromatic only.
- Audio: scales' `playSequence(midiNotes, intervalMs=480)` plays 8 notes in 3.84s. 13 notes at 480ms = 6.24s. Acceptable. If too long in QA, drop intervalMs to 360ms for chromatic (still musical).

## Standard module features (inherited verbatim from scales.html)
5/10/20 lengths · optional 30/45/60s timer · mute toggle · personal-best per tier · profile chip via QNNav · save-scores prompt + hold-and-backfill · ▶ Hear it again · streak-tiered confetti · summary celebration tiers (perfect/great/good/practice) · QN.ui.confirm quit dialog · start-timer "Ready, set…" modal · concept explainer (link a `chromatic-scale-explainer.html` later — Phase 2 polish, not blocking).

## Concept explainer cards (3, skippable forever after first view)
1. "A **chromatic scale** moves in **half steps** — every key on the piano, white and black, from a starting note to its octave."
2. "Going **up**, we spell with **sharps** (C, C♯, D, D♯…). Going **down**, we spell with **flats** (C, B, B♭, A, A♭…). The starting note stays natural either way."
3. "Don't confuse it with a major scale! Major has a fixed step pattern (W-W-H-W-W-W-H). Chromatic is **all half steps** — every adjacent black and white key in order."

## Surfaces touched (the four-surface rule — all in one commit)
1. `index.html` — module-count stat (no change — count is on a vertical-spine roster that doesn't enumerate modules), but if the count is referenced anywhere update from 18 → 19.
2. `play.html` — Practice library tile (Reading section).
3. `path.html` — MODULES object, PATH array, SHORT_PREFIX map.
4. `qn-profile.js` — recommender PATH array.

## What this is NOT
- Not "spell-the-chromatic" (typing pitch names). The 4-button MC pattern stays.
- Not "what's the next note" (different question type — could be a Phase-2 expansion).
- Not multi-octave chromatic. One octave per question, period.
- Not voice-leading chromatic (the diatonic-preserving variant) — see locked spelling convention above.
