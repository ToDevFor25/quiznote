# Module Spec — Ledger Lines

**Slug:** `ledger-lines` · **Namespace:** `LL` · **Title:** "Ledger Lines" · **Tagline:** "Notes that live above and below the staff."
**Tier (roster):** Foundations · Level 1 · §5 (curriculum-redesign roster, Phase 1 build queue)
**Built from:** `note-names.html` sibling (staff + four-button MC) + `qn-staff.js` + `qn-profile.js` + `qn-nav.js` + `qn-theme.css` + `qn-music.js`.

## Why this module
Foundations gap named in the curriculum redesign: Note Names teaches in-staff and brushes ledger-line range in its Medium/Tricky tiers, but a learner who is shaky on Middle C and the notes just past the staff edges never gets focused practice on *only* ledger-line pitches. The standard method-book sequence treats ledger-line reading as its own discrete skill that follows after the five-line staff is internalized — this module mirrors that.

## What it teaches
Identify pitches that sit on or between ledger lines — above and below the staff — in treble and bass clef.

- **One ledger line** (Middle C territory): the foundational ledger-line notes a beginner meets first.
- **Two–three ledger lines:** the working range for piano and most school-band reading.
- **Deep ledger range:** notes 4+ ledger lines from the staff, for fluency at the top/bottom of the reading register.

## Tiers (Easy / Medium / Tricky — app convention)
Pool contains **only pitches with visible ledger lines drawn for them** — both notes ON a ledger and notes in the space between two ledgers (where ledger lines flank the notehead). Excludes the "bare floating space note" immediately outside the staff (D4 / G5 treble, F2 / B3 bass) — those get zero ledgers drawn and Note Names already covers them in its Medium tier. Difficulty axis = **how far from the staff edge** (which ledger).

- **Easy:** 1st-2nd ledger range above + below (on-ledger notes + the space between).
  - Treble: `C4` (Middle C, on 1st below), `B3` (between 1st-2nd below), `A3` (on 2nd below); `A5` (on 1st above), `B5` (between 1st-2nd above), `C6` (on 2nd above).
  - Bass: `E2` (on 1st below), `D2` (between 1st-2nd below), `C2` (on 2nd below); `C4` (Middle C, on 1st above), `D4` (between 1st-2nd above), `E4` (on 2nd above).
- **Medium:** + 3rd-ledger range.
  - Treble: + `G3` (between 2nd-3rd), `F3` (on 3rd) below; + `D6` (between), `E6` (on 3rd) above.
  - Bass: + `B1` (between), `A1` (on 3rd) below; + `F4` (between), `G4` (on 3rd) above.
- **Tricky:** + 4th-ledger range.
  - Treble: + `E3` (between 3rd-4th), `D3` (on 4th) below; + `F6` (between), `G6` (on 4th) above.
  - Bass: + `G1` (between), `F1` (on 4th) below; + `A4` (between), `B4` (on 4th) above.

Tricky stays at 4th ledger by design — covers practical school-band / orchestral / choral reading. Extends-into-flute-high-register (5th-6th ledger) is deliberately out of scope per the beginner-through-intermediate audience constraint. Pool counts per clef: Easy 6 · Medium 10 · Tricky 14. Both-clef mode doubles the pool for added variety. In-staff notes are deliberately excluded at every tier — this is the differentiator from Note Names. The pool is a finite curated list (not a generator).

## Question type (single)
**Identify the pitch.** A staff is drawn with the chosen clef, the queried note placed at the correct ledger-line position with all required ledger lines rendered. Four pitch-name tiles. Correct = the note's letter name.

(One question type, like Note Names. Accidentals are not part of this module — letter names only. Sharps/flats on ledger-line pitches belong in Key Signatures and Accidentals respectively.)

## Distractor strategy
Reuses Note Names' scoring (`buildChoices`) with no change. Already favors:
- Same letter, different octave (classic ledger-line confusion: is that high C or C6 or C7?).
- Adjacent diatonic steps (B/D, E/F, C/E confusables).
- Nearby pool members.

The existing scorer is well-suited here — ledger-line confusion is dominated by "same letter, wrong octave" and "off by one line," both of which the scorer already prioritizes.

## Theory accuracy
- Treble bottom line = E4 (step 0); bass bottom line = G2 (step 0). Both unchanged from `qn-staff.js`.
- Middle C = C4. Sits on one ledger line below the treble staff AND one ledger line above the bass staff. Both spellings asked.
- Ledger lines are drawn by the existing `ledgers(d)` function in `qn-staff.js` / inline renderer — no rendering change required.

## Selector (start screen)
**Clef:** `treble` / `bass` / `both` — same three-tile selector Note Names uses. Locked rule: subtype selector, not separate modules.

No accidentals selector (the module teaches letter names only).

## Sub-skill tagging (dashboard)
Per-round tally keyed by **clef** (`treble` / `bass`) — matches Note Names exactly. Derived from `state.history` at summary time.

Tier-2 call: keeping clef as the sub-skill axis (not ledger-distance) so the dashboard surface matches Note Names cleanly and a learner shaky on "bass clef ledger lines" can see it cross-module. Going with clef-axis because consistency with the sibling — flag if you'd rather see a distance-axis (`above-1` / `above-2` / `above-3+` / `below-*`) so the dashboard surfaces which *direction* is weak. Distance-axis is more pedagogically specific but breaks the Note-Names parallel.

Dashboard `SKILL_LABELS` entries: re-use the existing `treble` and `bass` keys (already wired for Note Names + Piano Quiz).

## Standard module features (inherited)
5/10/20 lengths · optional 30/45/60s timer · mute toggle · personal-best per tier · profile chip via QNNav · save-scores prompt + hold-and-backfill · concept explainer (3 skippable cards) · path-handoff settings read · QN.ui.confirm quit modal · shared toast feedback (Option-2 placement) · shared `qn-theme.css` styling.

localStorage namespace `ll_`; module event key `'ledger-lines'`.

## Concept explainer cards (3, skippable forever after first view)
1. "When notes go **above or below** the five-line staff, we add little extra lines just for that note — **ledger lines**."
2. "**Middle C** sits one ledger line below the treble staff, and one ledger line above the bass staff. It's the bridge between the two."
3. "Reading ledger lines gets faster with practice. Count by lines and spaces from the closest staff edge: '*just above the top line, then space, then line…*'"

## Four-surface wiring (one commit, per CLAUDE.md)
- `index.html` — Foundations tile + module-count stat bumped (14 → 15).
- `play.html` — Foundations section, Practice tile.
- `path.html` — `MODULES`, `PATH` (positioned in Foundations after Note Names), `SHORT_PREFIX: ll_`.
- `qn-profile.js` — recommender `PATH` extended with `ledger-lines` (placed after `note-names`).

## What's NOT in this spec (deliberate)
- No accidentals on ledger notes (separate module).
- No interval/chord recognition across ledger ranges (separate).
- No bass-clef alto/tenor variants (out of scope per project doc §5).
- No selector for "above only" vs "below only" — both directions are inseparable for fluency.

## Build approach
Pure clone-and-swap from `note-names.html`:
1. Copy file → `ledger-lines.html`.
2. Identity strings: title / h1 / tagline / staff-label / summary copy / explainer.
3. Replace `RANGES` constant with the curated ledger-only catalog above.
4. Remove the `accidentals` selector + `tricky`-tier accidental expansion in `buildPool` (this module is letter-names only).
5. localStorage namespace: `nn_` → `ll_`, `note-names` → `ledger-lines` for the event key and settings key.
6. Tile copy on start screen: difficulty tiles re-worded to describe ledger-distance ("1 ledger out" / "1–2 ledgers" / "deep range") instead of "middle notes / wider / full range."
7. No renderer changes, no audio engine changes, no shared-file changes.

Verifies: renderer already draws ledgers (existing `ledgers(d)` function); already handles bass clef; already accepts pure letter-name pitches (no accidentals).
