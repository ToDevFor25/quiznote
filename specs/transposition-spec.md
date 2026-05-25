# Module Spec — Transposition

**Slug:** `transposition` · **Namespace:** `TR` · **File:** `transposition.html` · **Title:** "Transposition" · **Tagline:** "Same tune, different key."
**Tier (roster):** Reading · Level 4 · §5 #35
**Built from:** `intervals.html` sibling (interval math infrastructure) + `note-names.html` (staff render) + `qn-staff.js` v1.3.0 + `qn-profile.js` v1.6.0 + `qn-nav.js`. No audio in v1.
**ROI rank (May 2026 queue):** #8 — high real-world value (every band/orchestra student needs it for transposing instruments) but spec needs careful design because the "obvious" generative format ("rewrite this melody") is hard to validate in a 4-button MC; v1 takes a more constrained approach.

## Why this module
Every transposing instrument requires this skill: Bb trumpet, Bb clarinet, F horn, Eb alto sax, Eb baritone sax, A clarinet, English horn (F), piccolo (octave up). A middle-school band student reads a part that *sounds* a major second / perfect fifth / minor third / etc. away from what's written. Vocalists transpose to fit their range. Pianists transpose to back up other instruments. ABRSM Grade 5 tests it. Currently zero coverage.

The generative format ("write this melody up a major third") is the textbook task but is hard to validate in a 4-button MC. v1 takes a **constrained format**: show a written note (or short melodic snippet), ask what it sounds like (or what it should be written as) at a given transposition. Four staff-rendered choices.

## What it teaches
Transpose individual notes and short melodic fragments by a stated interval; identify concert pitch for the common transposing instruments; recognize the relationship between *written* and *sounding* pitch.

- **By interval** (foundational): transpose a single note up/down a major 2nd, minor 3rd, perfect 5th, octave.
- **By instrument** (applied): "A Bb trumpet plays this written note — what concert pitch sounds?" Common transpositions:
  - **Bb instruments** (trumpet, clarinet, tenor sax) — sound a major 2nd *lower* than written.
  - **Eb instruments** (alto sax, baritone sax) — sound a major 6th *lower* (or minor 3rd up + octave down) than written.
  - **F instruments** (horn, English horn) — sound a perfect 5th *lower* than written.
  - **Octave transposers** (piccolo, double bass, guitar) — sound an octave above/below written.

## Tiers
- **Easy:** transpose a single note by major 2nd or perfect 5th, up or down. Treble clef. Weights: `{ interval .7, direction .3 }`.
- **Medium:** + minor 3rd, octave + the Bb / F instrument question types. Both clefs. Weights: `{ interval .4, instrument .4, direction .2 }`.
- **Tricky:** + Eb instruments + 3-note melodic fragments (transpose a short pattern, not a single note). Both clefs. Weights: `{ interval .3, instrument .35, melodic .25, direction .1 }`.

## Question types
1. **`interval`** — show a single note on the staff; "Transpose this up a major 2nd." → four staff-rendered note choices.
2. **`instrument`** (Medium+) — show a note labeled "Written for Bb trumpet"; "What concert pitch sounds?" → four staff-rendered note choices. Or the reverse: "Concert pitch is C. What should be written for a Bb trumpet?" → four choices.
3. **`direction`** — show two notes (original + transposed); "What interval did this transpose by?" → four interval-name tiles.
4. **`melodic`** (Tricky only) — show a 3-note melodic fragment; "Transpose this up a perfect 4th." → four staff-rendered 3-note fragments.

## Distractor strategy
- **`interval`:** distractors are correct interval in the wrong direction (up vs down) + adjacent intervals (major 2nd correct → minor 2nd, major 3rd as distractors). Tests precise interval recall.
- **`instrument`:** distractors are *other* common transpositions applied to the same written note (Bb correct → Eb's transposition, F's transposition as distractors). Tests instrument-specific knowledge, not just "go down a step."
- **`direction`:** include same-interval-wrong-direction + same-direction-wrong-quality (major 2nd correct → minor 2nd same direction, major 2nd wrong direction as distractors).
- **`melodic`:** distractors preserve some notes correctly but transpose one note by the wrong interval — tests that ALL notes are transposed consistently. (Common student error.)

## Theory accuracy
- **Bb instruments sound a major 2nd lower than written.** A Bb trumpet reading a written C produces a concert Bb. To make a Bb trumpet sound a concert C, write a D.
- **Eb instruments sound a major 6th lower than written.** An Eb alto sax reading a written C produces a concert Eb. (Alternative framing: sounds a minor 3rd up *then* an octave down — same pitch class either way.)
- **F instruments sound a perfect 5th lower than written.** An F horn reading a written C produces a concert F.
- **Octave transposers:** piccolo sounds an octave HIGHER than written (small to write, big to sound). Double bass and guitar sound an octave LOWER than written.
- Transposition preserves interval relationships within the melody — every note shifts by the same interval. (This is the `melodic` question type's key insight.)
- Key signatures shift accordingly: a piece in concert C major, written for a Bb trumpet, appears in the trumpet part as D major (two sharps). v1 does NOT test key-signature shifts directly — that's a v2 expansion. v1 holds individual notes / fragments without explicit key context.

## Renderer
Reuses Note Names' single-notehead staff render + Intervals' multi-note staff render. The interval math reuses `qn-music.js` and Intervals' pitch arithmetic. **No `qn-staff.js` changes required.**

The new visual elements are minor:
- Instrument labels above the staff ("Written for Bb trumpet") — CSS overlay text on the staff card. Already established pattern from Tempo Markings.
- For `direction` questions, two staves side-by-side (original + transposed) with an arrow between — reuses Cadences' two-chord layout pattern.

## Sub-skill tagging
`interval` / `instrument` / `direction` / `melodic`. Labels:
- `interval → "Transposing by an interval"`
- `instrument → "Transposing instruments"`
- `direction → "Naming the transposition"`
- `melodic → "Transposing a phrase"`

## Standard features (inherited)
Same as Tempo Markings.

## Concept explainer cards
1. "**Transposition** means rewriting music to start on a different note while keeping the same intervals between notes — same tune, different key."
2. "Some instruments are **transposing instruments** — what's written and what sounds are different pitches. A **Bb trumpet** sounds a major 2nd lower than written. An **F horn** sounds a perfect 5th lower."
3. "When you transpose a melody, every note shifts by the **same interval** — the relationships stay identical, just shifted up or down."
