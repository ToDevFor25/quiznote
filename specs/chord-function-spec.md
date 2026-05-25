# Module Spec — Chord Function (Tonic / Predominant / Dominant)

**Slug:** `chord-function` · **Namespace:** `CFN` · **File:** `chord-function.html` · **Title:** "Chord Function" · **Tagline:** "What the chord is *doing*."
**Tier (roster):** Theory · Level 5 · §5 #34
**Built from:** `roman-numerals.html` sibling (same key + chord data, different answer dimension) + `qn-staff.js` v1.3.0 (existing `buildStaffWithChord`) + `qn-profile.js` v1.6.0 + `qn-nav.js` + `qn-audio.js` v1.1.0 (`playChord`).
**ROI rank (May 2026 queue):** #7 — cheapest meaningful Theory expansion. Cloning Roman Numerals with a different categorization axis. Adds a genuinely new pedagogical skill at the upper edge of Theory's audience cap.

## Why this module
Roman Numerals teaches you to *name* a chord (I, ii, V). Chord Function teaches you to *categorize* it by its harmonic role: **tonic** (rest/home), **predominant** (motion toward dominant), **dominant** (tension wanting to resolve to tonic). This is the bridge from "what's the chord called?" to "what's the chord *doing*?" — and it's the skill that lets a learner hear and predict harmonic motion rather than just label it. AP Music Theory makes it a distinct skill.

Sits at the upper edge of the §2 audience cap (intermediate). Defensible at "serious adult amateur" and "AP-track high schooler." Anything past this in the function direction (secondary dominants, tonicization, modulation) is past the cap.

## What it teaches
Categorize diatonic chords by their function in a key; identify which chord serves which function; recognize the standard T–PD–D–T harmonic motion.

- **Tonic function:** I (i), iii (III+ in minor), vi (VI in minor). Rest/home chords.
- **Predominant function:** ii (ii°), IV (iv). Chords that typically lead to V.
- **Dominant function:** V, vii°. Chords with tension wanting to resolve to I (i).

Conventions: in minor keys, the V chord is MAJOR (harmonic minor raised leading tone) per project doc §9.

## Tiers
- **Easy:** the three primary chords by function — I (tonic), IV (predominant), V (dominant). 3 keys: C, G, F. Weights: `{ categorize .7, identify .3 }`.
- **Medium:** + ii, vi, vii° (full diatonic function set, major keys only). 5 keys. Weights: `{ categorize .45, identify .35, motion .2 }`.
- **Tricky:** + minor key conventions (i, iv, V, ii°, VI, vii° — harmonic minor) + + iii. 9 keys both modes. Weights: `{ categorize .35, identify .3, motion .2, exception .15 }`.

## Question types
1. **`categorize`** — show a chord on the staff with its Roman numeral label and key context; "What is this chord's function?" → three large tiles (*Tonic / Predominant / Dominant*).
2. **`identify`** — show a key and a function; "Which chord serves this function?" → four chord-name tiles (e.g. "Predominant in C major" → *ii (Dm) / IV (F) / V (G) / vi (Am)* — multiple may be technically valid; correct = the most-typical example).
3. **`motion`** (Medium+) — show a two-chord progression on the staff; "What is the harmonic motion?" → four direction tiles (*Tonic → Predominant / Predominant → Dominant / Dominant → Tonic / Tonic → Dominant*).
4. **`exception`** (Tricky only) — minor-key-specific question: show V in minor with raised 3rd; "Why is this chord MAJOR in a minor key?" → four tiles (*Raised leading tone from harmonic minor / Mistake in the score / Borrowed from parallel major / Modal mixture*). Tests the §9 accuracy point directly.

## Distractor strategy
- **`categorize`:** the three-function categorization is inherently the question; distractors are the other two functions. When a chord could plausibly serve two functions (vi as tonic-extension or as predominant in some contexts), correct is the most-common interpretation; document the convention.
- **`identify`:** include chords with adjacent functions (predominant correct → IV correct → V as distractor; tonic correct → I correct → vi as distractor — vi as tonic-extension is acceptable but I is most-typical).
- **`motion`:** include reversed direction (T→PD correct → PD→T as distractor — *retrogression* is the wrong direction in common practice).
- **`exception`:** distractors are the three other plausible-sounding theory explanations (modal mixture, borrowed chord) — tests the *precise* reason, not the family of reasons.

## Theory accuracy
- **Function categorization is convention-dependent.** In strict Roman-numeral/Schenkerian analysis, ii and IV are both predominant. In some pedagogies, vi is "tonic-extension" or "weak tonic." v1 uses the standard AP Music Theory categorization:
  - Tonic: I, vi (in major); i, VI (in minor). iii sometimes tonic-extension.
  - Predominant: ii, IV (in major); ii°, iv (in minor).
  - Dominant: V, vii°.
- **V in minor is MAJOR** — harmonic minor raised leading tone (project doc §9). Use this consistently across all minor-key questions.
- **vii° as dominant function**: vii° contains the leading tone and the chordal seventh of V — it's dominant-functioning even though it's not literally V. Important distinction.
- Avoid teaching secondary dominants, applied chords, modal mixture, or tonicization in v1 — those are past the audience cap.

## Renderer
Reuses Roman Numerals' staff + chord + key signature rendering exactly. `buildStaffWithChord` from `qn-staff.js` v1.3.0 already handles all needed visual cases. The only new visual element is the **3-tile categorization buttons** (vs. the existing 4-tile chord-name buttons) — minor template adjustment, no shared file change.

## Sub-skill tagging
`categorize` / `identify` / `motion` / `exception`. Labels:
- `categorize → "Naming the function"`
- `identify → "Picking the right chord for a function"`
- `motion → "Recognizing harmonic motion"`
- `exception → "Minor-key conventions"`

## Standard features (inherited)
Same as Roman Numerals — including the major/minor/both selector pattern (reuse the existing Phase 2 selector implementation; this module mirrors Roman Numerals' selector structure exactly).

## Concept explainer cards
1. "Every chord in a key has a **function** — a job. The three jobs are **tonic** (home/rest), **predominant** (motion toward tension), and **dominant** (tension wanting to resolve home)."
2. "The classic motion in Western music is **T → PD → D → T**: start at home (I), build toward dominant (ii or IV), arrive at tension (V), resolve home (I)."
3. "In a minor key, the V chord is **major** (not minor) — composers raise the 7th scale degree to create a strong pull back to the tonic. This is the **harmonic minor** convention."
