# Module Spec — Tempo Markings

**Slug:** `tempo-markings` · **Namespace:** `TM` · **File:** `tempo-markings.html` · **Title:** "Tempo Markings" · **Tagline:** "How fast — and how it changes."
**Tier (roster):** Foundations · Level 2 · §5 #28
**Built from:** `accidentals.html` sibling (single-symbol focus + four-button MC) + `qn-staff.js` + `qn-profile.js` v1.6.0 + `qn-nav.js` + `qn-audio.js` (`playClick` for metronome questions).
**ROI rank (May 2026 queue):** #1 — first in the score-literacy cluster. Build first so the cluster-wide new patterns (ordering on a continuum, audio metronome) surface here before they multiply across four siblings.

## Why this module
Every method book uses Italian tempo terms from page 1. ABRSM Grade 1 tests them. RCM Level 1 introduces them. The current 27-module roster has zero coverage. A beginner who has worked through Note Values and Time Signatures still doesn't know what "Allegro" means.

## What it teaches
Recognize Italian tempo terms; order them on a slow→fast continuum; interpret metronome markings; recognize the three change-of-tempo markings (accelerando, ritardando, a tempo).

- **Steady-tempo terms** (slow → fast): Grave, Largo, Lento, Adagio, Larghetto, Andante, Moderato, Allegretto, Allegro, Vivace, Presto.
- **Change-of-tempo:** accelerando (accel.), ritardando (rit. / ritard.), a tempo, rubato.
- **Metronome marking:** ♩=BPM — connects vocabulary to numeric tempo.

## Tiers
- **Easy:** the 7 most common steady tempi (Largo, Adagio, Andante, Moderato, Allegro, Vivace, Presto). Weights: `{ meaning .6, ordering .4 }`.
- **Medium:** + Grave, Lento, Larghetto, Allegretto. Weights: `{ meaning .4, ordering .4, metronome .2 }`.
- **Tricky:** all 11 + accel. / rit. / a tempo / rubato + metronome. Weights: `{ meaning .3, ordering .25, metronome .25, change .2 }`.

Finite catalog (~15). To make it harder beyond Tricky, add question-type depth, not new terms.

## Question types
1. **`meaning`** — show term as styled text; "What does this mean?" → four word-tile choices (plain-English: *Walking pace / Very fast / Slow / Moderately*).
2. **`ordering`** — show two terms side-by-side; "Which is faster?" → two large tiles (template degrades 4→2 cleanly, mirroring Time Signatures' `whichBeats`).
3. **`metronome`** — show "♩ = 120"; "Which term best matches this tempo?" → four term-tile choices. Uses Bravura quarter (U+E1D5) + "= BPM". Optional "▶ Hear it" button plays 4 clicks at BPM via `playClick`.
4. **`change`** (Tricky only) — show "accel." or written term; "What happens?" → four tiles (*Gets faster / Gets slower / Returns to original tempo / Free, flexible timing*).

## Distractor strategy
- **`meaning`:** include one opposite-direction descriptor + one adjacent-band descriptor. Tests direction *and* discrimination.
- **`ordering`:** Easy/Medium use non-adjacent bands; Tricky may use adjacent.
- **`metronome`:** correct = the term whose band contains the BPM; distractors = bands above and below. BPM bands: Grave 40–60 · Largo 50–60 · Lento 52–68 · Adagio 60–72 · Larghetto 60–66 · Andante 76–108 · Moderato 108–120 · Allegretto 112–120 · Allegro 120–168 · Vivace 132–168 · Presto 168–200. (Flag for music-theory accuracy review before locking — sources vary.)
- **`change`:** distractors are the other three change-types.

## Theory accuracy
- Italian terms are conventional, not absolute. Bands overlap; document source in code.
- "Andante" literally means "walking" — use that, not a speed claim, in `meaning` answers.
- "Rubato" is *flexible*, not slow. Common misconception worth catching in distractors.
- Accel./rit./a tempo are *changes* to current tempo, not tempi themselves.

## Renderer
No staff. Question canvas is a styled card: large italic serif text on a cream card (matches musical convention for Italian terms). For `metronome`: Bravura quarter glyph + " = BPM" in matching size. **No `qn-staff.js` changes required.**

## Answer highlighting
Chosen tile → teal (correct) / coral (wrong); correct tile revealed. Same pattern as Accidentals `effect`.

## Sub-skill tagging
`meaning` / `ordering` / `metronome` / `change`. `SKILL_LABELS`:
- `meaning → "Term meanings"`
- `ordering → "Tempo ordering"`
- `metronome → "Metronome markings"`
- `change → "Tempo changes"`

## Standard module features (inherited)
5/10/20 lengths · optional 30/45/60s timer · mute toggle (affects metronome audio) · personal-best per tier · profile chip via QNNav · save-scores prompt + hold-and-backfill · concept explainer (3 skippable cards) · path-handoff settings read.

## Concept explainer cards (3, skippable forever after first view)
1. "**Tempo** is how fast or slow the music moves. Italian words like *Adagio* (slow) and *Allegro* (fast) tell the performer the pace."
2. "Composers can also show tempo as a **metronome marking**: ♩ = 120 means 120 quarter notes per minute."
3. "Tempo can **change** during a piece: *accelerando* (speeding up), *ritardando* (slowing down), *a tempo* (back to the original speed)."
