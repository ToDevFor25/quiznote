# Ear: Rhythm — spec

**Slug:** `ear-rhythm`
**Namespace:** `ER`
**File:** `ear-rhythm.html`
**Title:** Ear: Rhythm
**Tagline:** Hear the duration. Pick the notation.
**Tier in roster:** Foundations · Level 1 (ear-training pair to Note Values)
**Source clone:** `note-values.html`

## What it teaches
Aural duration recognition. The student hears a metronome lead-in followed by a sustained tone whose length corresponds to a single note value; they pick the matching notation. Pairs directly with the visual Note Values module — same notations, the ear is now the input channel instead of the eye.

## Selector options
None at v1.

## Tier breakdown

Convention: quarter note = 1 beat. Tempo locked at **60 BPM** (1 second per beat) — chosen because it makes durations cognitively easy to count and gives the shorter values (sixteenth = 0.25s) enough perceptual length to distinguish.

- **Easy:** whole (4s), half (2s), quarter (1s). 3 items.
- **Medium:** + eighth (0.5s). 4 items.
- **Tricky:** + sixteenth (0.25s). 5 items.

Rests are deliberately **excluded from v1**. Hearing silence-of-N-beats is meaningfully different (the student counts continuing metronome ticks during the rest) and adds UX complication for limited pedagogical lift at the v1 stage. Can be added in v2 if demand surfaces.

## Question type
"What note value did you hear?" Four-choice MC. Choices are notation glyphs with text labels (same SYMBOLS catalog as Note Values).

## Audio behavior
On question reveal: play 2 metronome ticks at 60 BPM (1s gap), then sustain a single pitched tone (A4) for `beats × 1000ms`. Total cue length = ~2s lead-in + duration.

A "▶ Hear it again" button below the placeholder re-plays the whole sequence. Same affordance as ear-intervals.html.

## Distractor strategy
- Always include the **adjacent shorter** value (e.g., for half, include quarter).
- Always include the **adjacent longer** value (e.g., for half, include whole).
- 3rd distractor from remaining pool values.

## Rendering
Question area shows a 🎧 placeholder (pulsing emoji) with a "▶ Hear it again" button. Same pattern as ear-intervals.html. The visual symbol renderer from Note Values is NOT used; choice buttons still show note-value labels as text (same MC pattern).

## Concept explainer cards (not in v1)
Note Values' explainer would carry through; no separate cards.

## Sub-skill tagging
`skills: { '<note-value-key>': { c, t } }` — keyed by question's note value key (`whole-note`, `quarter-note`, etc.). High cardinality, raw-key fallback in dashboard.

## localStorage namespace
`er_` prefix. `er_muted`, `er_pb_<tier>`, `ear-rhythm_settings`.

## Tile color
`bg-coral` (audio-cluster signal — pairs with the other ear-training modules).

## Source-file changes
None. Pure additive clone.
