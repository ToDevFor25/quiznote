# Feature Spec — Curriculum Mapping Overlay

**Type:** Feature (not a module). Multiplier on existing content. **File:** new tab/view on `play.html` (or new `curriculum.html`).
**ROI rank (May 2026 queue):** #10 — pending lawyer review (see Tier 3 gate below). Re-organizes the existing roster under recognized external syllabi (ABRSM Theory grades, RCM Levels, AP Music Theory units, named method books). Zero new pedagogical content. Massive search-discoverability and buyer-credibility gain.

## Why this feature
A parent or teacher searching "ABRSM Grade 3 practice" or "Bastien Level 1 exercises" doesn't find QuizNote today — even though the content covers those needs. This feature creates **named-method doorways into the same content**, dramatically multiplying perceived value of the existing 27+ modules without building new ones.

## ⚠️ Tier 3 gate — lawyer review required before launch

This feature names third-party trademarks (ABRSM, RCM, College Board / AP, Bastien, Faber, etc.). Per the May 2026 trademark conversation logged in BUILD_LOG.md, the launch path is:

1. **Start with generic descriptive language** (e.g. "Early-elementary piano method coverage," "Grade-1-equivalent theory") — no named marks. This is safe to build and ship immediately.
2. **Add a named-method overlay only after lawyer review** of the disclaimer language, the page structure, and the specific marks used. Key principles confirmed in the trademark discussion:
   - Use nominative fair use: refer to their actual product factually.
   - Don't use their logos, cover art, or visual branding.
   - Don't copy their exercise sequences or expressed lesson order.
   - Don't imply sponsorship or endorsement.
   - Use phrasings like "compatible with," "aligns with the concepts in," "for students working through" — never "official," "endorsed by," "in partnership with."
   - Include a disclaimer: "QuizNote is not affiliated with, endorsed by, or sponsored by [marks]. All trademarks are property of their respective owners."
3. **Risk varies by mark holder.** Bastien (Kjos Music Company) and Faber = lower risk. ABRSM, Trinity, RCM = active mark policing; consider applying for official partner status rather than just naming. College Board / AP = highest risk; check their trademark policy page before using.

**Do NOT build the named-method overlay without lawyer sign-off.** The generic-language v1 can ship immediately.

## What it does (v1, generic-language safe)

A new "By curriculum" tab on `play.html` (or new `curriculum.html` page) that re-organizes the existing 27+ modules under generic, non-trademarked curriculum labels.

- **By stage** (already implicit in current Foundations / Reading / Theory): "Beginner — first year of theory" / "Late beginner — second year" / "Intermediate — grades 3–5 equivalent" / "Late intermediate — grades 6+ equivalent."
- **By skill bundle:** "Note reading basics" / "Rhythm essentials" / "Key signatures pack" / "Chord identification pack" / etc. Each bundle = a hand-picked set of 3–6 modules at specified tiers.
- **By exam-prep flavor (generic):** "Theory exam — early grades" / "Theory exam — intermediate grades." Pairs naturally with mock exam mode (#9).

## What it does (v1.1, post-lawyer-review)

Adds named-method tags as a *second layer* on top of the v1 generic structure:

- "**ABRSM Theory Grade 1**" tile → links to the same set of modules already grouped as "Beginner — first year" (the v1 bundle), with an additional disclaimer line.
- Same pattern for RCM Levels, AP Music Theory Units, and named method books (Bastien Piano Basics Level 1, Faber Piano Adventures Primer, etc.).
- The named-method tags are *additive* — they don't change content, only labeling and search-discoverability.

## Mapping content (the actual research work)

The bulk of the build effort isn't code — it's **researching and validating which QuizNote modules + tiers correspond to which curriculum levels**. Rough first pass:

- **ABRSM Theory Grade 1:** Note Names (Easy), Note Values (Easy), Time Signatures (Easy), Accidentals (Easy), Ledger Lines (Easy), Tempo Markings (Easy), Dynamics (Easy), Articulation (Easy).
- **ABRSM Theory Grade 2:** + Intervals (Easy), Key Signatures (Easy, 1–2 sharps/flats only), Scales (Easy, major only), Score Navigation (Easy).
- **ABRSM Theory Grade 3:** + Intervals (Medium), Scales (Medium incl. minor), Key Signatures (Medium), Primary Chords (Easy), Triads (Easy), Ornaments (Easy).
- **ABRSM Theory Grade 4:** + Scale Modes, Chord Function (Easy), Cadences, Roman Numerals (Easy).
- **ABRSM Theory Grade 5:** + Transposition, Non-Chord Tones (if built), Seventh Chords, C Clefs (alto), Chord Progressions.
- **AP Music Theory:** maps loosely to Grade 5+ content; need a separate research pass.
- **RCM Levels:** parallel research pass — Canadian conservatory levels overlap with ABRSM grades but not 1:1.

This research is the time sink. Build it as a side task across multiple sessions, not in one shot.

## Architecture
- The mapping data is pure JSON (or JS object): `{ "abrsm-grade-1": [{module: "note-names", tier: "easy"}, ...], ... }`.
- The view is a new tab on `play.html` that renders tiles from the mapping data, linking to the same module URLs already used elsewhere — just under different groupings.
- No module modifications required.
- The v1 (generic) and v1.1 (named-method) ship from the same data structure with different labels.

## Implementation phases
1. **Phase A — Generic v1.** Build the "By stage" / "By skill bundle" tab using only QuizNote-internal labels. No third-party names. Ships immediately, no lawyer needed.
2. **Phase B — Mapping research.** Validate the QuizNote-module-to-grade mapping against authoritative syllabus documents (ABRSM and RCM publish theirs). Build the JSON.
3. **Phase C — Lawyer review.** Submit the planned named-method labels, disclaimer language, and page structure for legal review.
4. **Phase D — Named-method v1.1.** Add the named-method labels as an overlay on the existing bundles. Disclaimer footer on every page that uses third-party marks.
5. **Phase E — Partner applications (optional).** Apply to RCM, ABRSM official-partner programs for any marks where formal recognition is available.

## Dependencies
- Independent of all other queue items; can ship at any point.
- Pairs naturally with mock exam mode (#9) — "ABRSM Grade 3 mock exam" is the strongest combined offering.

## Risk / failure modes
- Inaccurate mapping (claiming a module covers grade content it doesn't) damages credibility worse than not mapping at all. Spend the time on Phase B.
- Trademark missteps create real legal exposure. Treat the lawyer gate as hard.
- Some method-book / exam-board content has *no* QuizNote equivalent (e.g. ABRSM Grade 5 includes sight-singing — explicitly out of scope per §2). Map *what we cover*, mark gaps explicitly ("ABRSM Grade 5 — Theory portions only; aural and sight-singing require a separate resource").
