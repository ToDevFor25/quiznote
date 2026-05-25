# Module Spec — Non-Chord Tones

**Slug:** `non-chord-tones` · **Namespace:** `NCT` · **File:** `non-chord-tones.html` · **Title:** "Non-Chord Tones" · **Tagline:** "The notes that color the harmony."
**Tier (roster):** Theory · Level 6 · §5 #37
**Built from:** `roman-numerals.html` sibling (same key + chord context) + `qn-staff.js` v1.3.0 (existing chord + melodic notehead rendering) + `qn-profile.js` v1.6.0 + `qn-nav.js`. No audio in v1.
**ROI rank (May 2026 queue):** #14 (last, borderline) — **build only with demonstrated user demand.** Sits at the upper edge of the §2 audience cap. Defensible for "serious adult amateur" and "AP-track high schooler"; drifts toward college freshman theory. ABRSM Grade 5 touches it; AP Music Theory covers it centrally.

## Why this module (with caveat)
A complete diatonic vocabulary includes the notes that *aren't* chord tones but appear in melodies above the harmony. Passing tones, neighbor tones, suspensions, appoggiaturas are the building blocks of melodic motion over chord progressions. Without this skill, a learner can identify chords but can't explain what's happening melodically against them.

**Caveat:** this is the closest module to the §2 audience boundary in the whole 37-module roster. Build it only if (a) the Foundations + Reading expansions land well and signal a real intermediate-adult audience, (b) user feedback specifically asks for it, or (c) a curriculum-mapping partner (ABRSM Grade 5, AP) makes it valuable for completeness. If those three conditions are absent, leaving the gap is the correct scope decision.

## What it teaches
Identify the four most common non-chord tones (NCTs) by their function and approach/resolution pattern.

- **Passing tone (PT):** a non-chord tone that passes by stepwise motion between two chord tones (e.g. C → **D** → E over a C major chord, where D is the PT).
- **Neighbor tone (NT):** a non-chord tone that steps away from and returns to the same chord tone (e.g. C → **D** → C, where D is the upper neighbor).
- **Suspension (SUS):** a chord tone held over into the next chord where it becomes dissonant, then resolves by step (typically down). Three-phase: preparation → suspension → resolution.
- **Appoggiatura (APP):** a non-chord tone approached by leap and resolved by step in the opposite direction.

(Out of scope for v1: anticipation, escape tone, pedal point, échappée, cambiata. Add only if the v1 set lands well.)

## Tiers
- **Easy:** passing tone, neighbor tone (the two foundational types). Major keys only. Weights: `{ identify .6, type .4 }`.
- **Medium:** + suspension. Major and minor. Weights: `{ identify .4, type .4, function .2 }`.
- **Tricky:** + appoggiatura + multi-NCT lines. Weights: `{ identify .3, type .35, function .25, multi .1 }`.

## Question types
1. **`identify`** — show a short 3-note or 4-note melodic line with a chord underneath; "Which note is the non-chord tone?" → four note-position tiles (highlight by ordinal: "1st note / 2nd note / 3rd note / 4th note") or four pitch-tile choices.
2. **`type`** — show a NCT highlighted in context; "What type of non-chord tone is this?" → four type-tiles (*Passing tone / Neighbor tone / Suspension / Appoggiatura*).
3. **`function`** (Medium+) — show a NCT highlighted; "How is this non-chord tone approached and resolved?" → four motion-tiles (*Step in, step out (same direction) / Step in, step out (opposite direction) / Held over, step down / Leap in, step in opposite direction*).
4. **`multi`** (Tricky only) — show a melodic line with multiple NCTs; "How many non-chord tones appear in this measure?" → four numeric-tiles (0/1/2/3+).

## Distractor strategy
- **`identify`:** the chord-tone-that-looks-like-an-NCT (e.g. the chord 3rd that someone might mistake for a passing tone). Tests "is this note actually IN the chord?" reasoning.
- **`type`:** the always-confused-pair format — passing vs. neighbor (both step-in/step-out, different *direction* of "step-out") is the classic mistake.
- **`function`:** include reversed approach/resolution and same-direction-vs-opposite-direction variants.
- **`multi`:** distractors are off-by-one counts (typically the learner misses one or counts a chord tone as NCT).

## Theory accuracy
- **Passing tone:** approached by step, resolved by step in the **same direction**. Connects two chord tones a third apart.
- **Neighbor tone:** approached by step, resolved by step in the **opposite direction** (returns to the starting chord tone). Upper neighbor = above the chord tone; lower neighbor = below.
- **Suspension:** must have three phases — (1) **preparation** as a chord tone in chord A, (2) **suspension** held over into chord B where it's now a non-chord tone (dissonant), (3) **resolution** by step down (usually) to a chord tone in chord B. Suspensions are labeled by interval pairs: 4–3, 7–6, 9–8, 2–3.
- **Appoggiatura:** approached by leap (a third or larger), resolved by step in the **opposite direction** of the leap. Stronger metric emphasis than other NCTs (typically on the beat).
- Accented NCT = falls on a beat; unaccented = falls between beats. v1 doesn't test this distinction directly; flag in explainer.
- Avoid teaching: cambiata, escape tone (échappée), anticipation, double neighbor, pedal point — all valid NCT types but beyond v1 scope.

## Renderer
Reuses existing `buildStaffWithChord` (block chord below) + standard notehead rendering (melodic line above). The new visual element is **highlighting a single notehead in a sequence** (the identified NCT) — a teal halo behind the highlighted notehead, drawn as SVG `<circle>` in the staff overlay. Minor extension to the rendering pattern, no `qn-staff.js` change.

For `identify` questions, the question canvas shows: chord (block) + 3-4 melodic noteheads in sequence + ordinal labels under each notehead (1, 2, 3, 4). Tile choices reference the ordinals.

## Sub-skill tagging
`identify` / `type` / `function` / `multi`. Labels:
- `identify → "Finding the non-chord tone"`
- `type → "Naming the type"`
- `function → "Approach and resolution"`
- `multi → "Multiple non-chord tones"`

## Standard features (inherited)
Same as Roman Numerals — including the major/minor/both selector.

## Concept explainer cards
1. "A **non-chord tone** (NCT) is a melodic note that doesn't belong to the chord sounding underneath it. Composers use them to add motion and color to a melody over static harmony."
2. "A **passing tone** moves stepwise between two chord tones in the same direction (C → D → E). A **neighbor tone** steps away from a chord tone and steps back to it (C → D → C)."
3. "A **suspension** holds a chord tone over into the next chord, where it becomes dissonant, then resolves by step down. An **appoggiatura** leaps into a dissonance, then resolves by step in the opposite direction."
