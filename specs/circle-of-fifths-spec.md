# Module Spec — Circle of Fifths

**Slug:** `circle-of-fifths` · **Namespace:** `CF` · **File:** `circle-of-fifths.html` · **Title:** "Circle of Fifths" · **Tagline:** "The map of every key."
**Tier (roster):** Reading · Level 3 · §5 #33
**Built from:** `key-signatures.html` sibling (same key/sig data, different presentation) + new circular SVG renderer (built fresh, single-purpose) + `qn-profile.js` v1.6.0 + `qn-nav.js`. **No audio in v1** (optional v1.1: hear the I chord at the clicked key).
**ROI rank (May 2026 queue):** #6 — highest single-module ROI outside the Foundations cluster. Iconic visual artifact; closes a perception-of-completeness gap created when the May 2026 redesign cut it from §5.

## Why this module (re-opening the May 2026 cut)
The Circle of Fifths is the single most recognizable visual artifact in Western music theory. Every theory textbook prints it on the inside cover. The May 2026 §5 redesign cut it as "the same content surfaces through Key Signatures + relative keys" — pedagogically defensible, but a user evaluating QuizNote's coverage will pattern-match the absence as a hole regardless of how it's covered elsewhere. This module re-opens that cut: the content overlaps with Key Signatures, but the **representation** (the wheel) is the value.

## What it teaches
Internalize the circular relationship between keys (a fifth apart clockwise, a fourth apart counterclockwise); identify the key at any clock position; navigate by interval ("3 sharps clockwise from G is…"); pair major keys with their relative minors around the wheel.

- **Major keys around the wheel** (clockwise from C, by ascending fifths): C, G, D, A, E, B, F♯, C♯, then continuing clockwise into the flat keys via enharmonic equivalence: C♯/D♭, A♭, E♭, B♭, F, back to C.
- **Relative minor pairings** (inside the wheel, offset): a, e, b, f♯, c♯, g♯, d♯, a♯, then b♭, f, c, g, d, back to a.
- **Key signature counts:** clockwise position = number of sharps (0–7); counterclockwise from C = number of flats (0–7).
- **Enharmonic intersections:** F♯ = G♭ (6 sharps / 6 flats), C♯ = D♭ (7 sharps / 5 flats), C♭ = B (7 flats / 5 sharps).

## Tiers
- **Easy:** the 7 major keys with ≤2 accidentals (C, G, D, A — sharp side; F, B♭, E♭ — flat side). Weights: `{ position .4, count .4, neighbor .2 }`.
- **Medium:** + 9-key range (adds E, A♭) + relative minor pairing. Weights: `{ position .3, count .25, neighbor .2, relative .25 }`.
- **Tricky:** full 15-key wheel including enharmonic intersections. Weights: `{ position .2, count .2, neighbor .2, relative .2, enharmonic .2 }`.

Reuses Key Signatures' 5/9/15 key tiers exactly. The wheel itself is the new content.

## Question types
1. **`position`** — show wheel with one position highlighted; "What key sits here?" → four key-name tiles.
2. **`count`** — show key name; "How many sharps or flats does this key have?" → four numeric-tile choices (with "♯" or "♭" suffix).
3. **`neighbor`** — show a key on the wheel; "What key is one position clockwise?" (or counterclockwise); → four key-name tiles. Tests interval reasoning around the wheel.
4. **`relative`** (Medium+) — show a major key; "What is its relative minor?" → four key-name tiles.
5. **`enharmonic`** (Tricky only) — show one spelling at the 6 o'clock area; "Which key is enharmonically the same?" → four tiles.

## Distractor strategy
- **`position`:** distractors are adjacent wheel positions (one clockwise, one counterclockwise) + one opposite-side mirror. Tests precise positional recall.
- **`count`:** include the opposite-type same-count (G=1♯ correct → "1 flat" as distractor) — mirrors Key Signatures' core distractor rule.
- **`neighbor`:** include the wrong-direction neighbor (one clockwise correct → one counterclockwise as distractor). Tests direction fluency.
- **`relative`:** include parallel minor (same letter name) and the major key's wheel-neighbor minor — tests the "down a minor third" rule.
- **`enharmonic`:** include the *adjacent* enharmonic possibility (F♯ correct → C♯ as distractor, also enharmonically valid but at a different position).

## Theory accuracy
- Clockwise = up a perfect fifth = +1 sharp (or −1 flat).
- Counterclockwise = up a perfect fourth = +1 flat (or −1 sharp).
- Relative minor sits a minor third below the major (or three positions clockwise *inside* the wheel — same key signature, different tonic).
- Enharmonic equivalents at the bottom: F♯/G♭, C♯/D♭, C♭/B. School-textbook convention: 6 sharps written as F♯ (not G♭), 5 flats as D♭ (not C♯), 6 flats as G♭ (not F♯), 7 sharps as C♯ (not D♭), 7 flats as C♭ (not B). Use these spellings per project doc §9.
- The wheel can also be read as a chord-progression map (V relationships clockwise). v1 teaches the key relationship; chord-progression overlay deferred to v2.

## Renderer (the one piece of net-new visual work)
A single SVG component, ~400×400px, reusable across all question types. Built fresh in this module's HTML file (not added to `qn-staff.js` — single-purpose, scoped).

- 12 outer positions (major keys) + 12 inner positions (relative minors), offset.
- Each position rendered as a circle + key name.
- Highlightable: a position can be styled "active" (teal fill) for `position` / `neighbor` questions.
- Optionally hoverable in a future v2; v1 is static (highlighted via question state, not user interaction).
- Renders in 3 styles per tier: Easy shows only the 7 keys in scope (others greyed); Medium shows 9; Tricky shows full 15 including enharmonic intersections.

**Renderer scope:** this is a single new SVG component, ~80 lines. It does NOT touch `qn-staff.js`. Lives in the module file itself.

## Sub-skill tagging
`position` / `count` / `neighbor` / `relative` / `enharmonic`. Labels:
- `position → "Reading the wheel"`
- `count → "Sharps & flats per key"`
- `neighbor → "Navigating clockwise/counterclockwise"`
- `relative → "Relative minor pairings"`
- `enharmonic → "Enharmonic intersections"`

## Standard features (inherited)
Same as Tempo Markings (mute toggle no-op until v1.1 audio).

## Concept explainer cards
1. "The **Circle of Fifths** is a map of every key. Move **clockwise** and you add a sharp each step (C → G → D → A…). Move **counterclockwise** and you add a flat each step (C → F → B♭ → E♭…)."
2. "Each major key shares its key signature with a **relative minor** — same sharps/flats, different starting note. The relative minor sits a minor third below the major (or just inside the wheel at the same position)."
3. "At the bottom of the wheel, the sharp and flat sides meet — F♯ and G♭ are the same sounding key, just spelled differently. These are **enharmonic equivalents**."
