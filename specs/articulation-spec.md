# Module Spec — Articulation

**Slug:** `articulation` · **Namespace:** `AR` · **File:** `articulation.html` · **Title:** "Articulation" · **Tagline:** "Short, smooth, accented — how each note speaks."
**Tier (roster):** Foundations · Level 2 · §5 #30
**Built from:** `accidentals.html` sibling + `qn-staff.js` (single notehead + adjacent-notehead pair for tie-vs-slur) + `qn-profile.js` v1.6.0 + `qn-nav.js`. **No audio in v1.**
**ROI rank (May 2026 queue):** #3 — third in score-literacy cluster. Includes the tie-vs-slur discrimination skill (a recurring beginner confusion currently with no home in the roster).

## Why this module
Articulation markings sit directly on noteheads and change how each note is played. The tie-vs-slur confusion (same curve, different rule based on pitch identity) is a classic beginner stumble that nothing in the current roster addresses.

## What it teaches
Recognize articulation markings on noteheads; identify each one's effect; discriminate ties from slurs.

- **Note-treatment marks:** staccato (•), staccatissimo (▾), tenuto (–), accent (>), marcato (^), fermata (𝄐), breath mark (').
- **Connection marks:** slur (curved line over different pitches) vs. tie (curved line over same pitch).
- **Optional:** caesura (//) — Tricky only.

## Tiers
- **Easy:** staccato, tenuto, accent, slur. Weights: `{ name .5, effect .5 }`.
- **Medium:** + staccatissimo, marcato, fermata. Weights: `{ name .35, effect .4, discriminate .25 }`.
- **Tricky:** + breath mark, caesura + emphasized tie-vs-slur. Weights: `{ name .3, effect .3, discriminate .4 }`.

## Question types
1. **`name`** — show notehead with articulation marking; "What is this called?" → four name-tile choices.
2. **`effect`** — show marking; "What does this tell the performer?" → four tiles (*Play short and detached / Hold for full value / Play with emphasis / Connect smoothly to the next note*).
3. **`discriminate`** — show two noteheads connected by a curved line; "Is this a tie or a slur?" → two tiles. Pitches *same* (tie) or *different* (slur). **Headline skill of the module.**

## Distractor strategy
- **`name`:** similar-looking markings as distractors (staccato vs. tenuto: both small marks on notehead; accent vs. marcato: both angular). Tests visual discrimination.
- **`effect`:** opposite treatments + adjacent treatments (staccato correct → "Hold for full value" opposite, "Hold and emphasize / tenuto" adjacent).
- **`discriminate`:** pitch identity is the *only* discriminator. Ties use same pitch; slurs use different pitches a step or third apart. Don't use thirds-or-larger for slurs at Easy — too obvious.

## Bravura glyph references
- Staccato U+E4A2 · Staccatissimo U+E4A6 · Tenuto U+E4A4 · Accent U+E4A0 · Marcato U+E4AC · Fermata above U+E4C0 · Breath mark U+E4CE · Caesura U+E4D1.
- Slurs and ties: draw as inline SVG `<path>` curves. (Bravura has these glyphs but they don't scale cleanly across pitch distances.)

## Theory accuracy
- **Tie:** two noteheads, **same pitch**, curved line. Held as one combined duration.
- **Slur:** two+ noteheads, **different pitches**, curved line. Play smoothly, don't re-attack.
- Identical visual; only pitch identity distinguishes. Teach this rule directly.
- Fermata = hold longer than written, performer's discretion. Not a fixed multiplier.
- Marcato (^) is *stronger* than accent (>). Both mean emphasis; marcato is more.

## Renderer
- Single notehead on a short staff with attached articulation glyph: existing `NH.staff.buildStaff` + accidental-style glyph placement.
- For `discriminate`: two adjacent noteheads on the staff with CSS/SVG curve overlay. Adjacent-notehead pairs already work in interval modules; the curve is an absolutely-positioned SVG `<path>` overlay on the existing staff render.
- **No `qn-staff.js` changes required.**

## Sub-skill tagging
`name` / `effect` / `discriminate`. Labels:
- `name → "Marking names"`
- `effect → "What each marking does"`
- `discriminate → "Tie vs. slur"`

## Standard features (inherited)
Same as Tempo Markings.

## Concept explainer cards
1. "**Articulation** marks tell you *how* to play each note. *Staccato* (•) means short and detached. *Tenuto* (–) means hold full length. *Accent* (>) means emphasize."
2. "A **slur** is a curved line over notes of **different pitches** — play smoothly, don't re-attack each one."
3. "A **tie** looks the same as a slur, but connects two notes of the **same pitch** — hold them as one longer note. Same curve, different rule. The pitch tells you which one it is."
