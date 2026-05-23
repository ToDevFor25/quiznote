---

### Phase 1 build + landing redesign — May 2026

**Session type:** Build (4 modules) + 2 landing-page restructures
(play.html collapsible sections, index.html vertical-spine "What's Inside").

**Net result:** 14 → 18 live modules. Phase 1 of the May 2026 curriculum
redesign is **complete**. Landing page no longer leaks the module roster
(decoupled from per-module tiering, so it survives the queued tier
reconciliation untouched).

**Commits in order:**
- `df8dbe2` Dev-only branch rule added to CLAUDE.md (start of session)
- `645921b` Ear module tiles visually distinct (preliminary cleanup)
- `8ef34cc` Index marketing copy (supplementary positioning)
- `22fdfbf` CLAUDE.md + BUILD_LOG.md refreshed for 27-module agenda
- `b6756ae` **Ledger Lines** (Phase 1 #1)
- `72a9a5d` Ledger Lines pool fix (see "Catches" below)
- `ecb3d53` play.html collapsible level-sections redesign
- `48bd2b8` **Dotted Notes & Ties** (Phase 1 #2)
- `55b3071` **Ear: Rhythm** (Phase 1 #3)
- `a17e52f` **Piano & Keyboard** (Phase 1 #4 — Phase 1 complete)
- `b6798de` Index "What's Inside" → vertical-spine concept view
- `44385cd` / `4ce0ecc` Hero stats stacked, then made 3-stat row with "Lots of fun"
- `2ea59eb` Pillars locked to 2×2 desktop / 1-col mobile
- `ea87643` Hero stats reordered (0 Ads / 3 Skill tiers / Lots of fun)

**Per-module decisions worth keeping:**

*Ledger Lines (b6756ae + 72a9a5d):*
- Strict on-ledger-or-flanked pool: only pitches with visible ledger lines
  drawn for them. Excluded the "bare floating space note" right outside the
  staff (D4/G5 treble, F2/B3 bass) — those return `[]` from the cloned
  renderer's `ledgers(d)` function and would render as bare notes with no
  ledger visible, defeating the module's premise. Note Names already
  covers those notes.
- Tier axis = how far from the staff edge (1st/2nd/3rd/4th ledger).
- Tricky ceiling capped at 4th ledger by design — covers school-band /
  orchestral / choral reading. Going to 5th-6th ledger (flute/piccolo
  high register) is deliberately out-of-scope per the
  beginner-through-intermediate audience rule.
- Pool counts per clef: Easy 6, Medium 10, Tricky 14.

*Dotted Notes & Ties (48bd2b8):*
- Dots rendered via Bravura augmentation-dot glyph (U+E1E7) appended to
  the note char with thin-space gap. Tied pairs use two adjacent glyphs
  + a CSS-drawn semicircle (border + border-radius) for the arc.
- Choice labels = beat values with Unicode vulgar fractions
  ("1½ beats", "¾ beat") — cleaner than "1.5 beats".
- **buildChoices must guarantee unique beat values across the 4
  buttons.** Without this guard, two pool items that equal the same
  number of beats (e.g., dotted-half = tied-half-quarter = 3 beats)
  could both end up as choices, giving two buttons with identical labels.
  Distractor priority: ±0.5 beat neighbors → undotted equivalent →
  remaining unique tier values.
- Convention locked: quarter note = 1 beat, simple meter only.

*Ear: Rhythm (55b3071):*
- Tempo locked at 60 BPM (1 second per beat). Chosen because it makes
  durations cognitively easy to count and gives shorter values enough
  perceptual length to distinguish.
- Audio cue = 2 metronome ticks (lead-in tempo anchor) + sustained
  A4 piano tone for `beats × 1000ms`. Replays via "▶ Hear it again".
- Notes-only in v1 — rests deferred. Hearing silence-of-N-beats is
  meaningfully different (count continuing ticks during the rest) and
  adds UX complication for limited pedagogical lift.
- Tiers thin by design: Easy 3 / Medium 4 / Tricky 5 items.
  Distractor strategy = nearest duration first.
- **Known v1 limitation:** Web Audio scheduled oscillators can't be
  cancelled mid-play. A whole-note cue (4s) may briefly bleed into the
  next question if the learner answers very quickly. Acceptable
  trade-off; revisit if QA flags it.

*Piano & Keyboard (a17e52f):*
- Cloned from **note-names.html, NOT piano-quiz.html** — cleaner reuse
  of note-names' 4-button letter MC and pitch pools verbatim, without
  having to gut piano-quiz's keyboard-as-answer game logic. The
  keyboard SVG is a new, isolated renderer added to NH.render.
- Renderer spans C3..C6 inclusive (22 white + 15 black, viewBox-scaled).
  Target key filled grape, "?" cue inside, each C labeled for octave
  orientation.
- Clef selector **hidden** via `display:none` (irrelevant on a
  keyboard). `state.settings.clef` stays default 'treble' so the
  inherited buildPool math works untouched — no game-loop edit.
- Accidentals selector still surfaces on Tricky (inherited from
  note-names). Functional; may want piano-context wording later.
- `recolorNote` made shape-agnostic: tries `#note-anim ellipse` (staff
  modules), falls through to `#note-anim .pk-target` (keyboard).
  Pure additive — note-names and other ellipse-based modules unaffected.

**Landing page restructures:**

*play.html — collapsible level sections (ecb3d53):*
- Three sections (Foundations / Reading / Theory) with progress chips
  ("X/N completed") and a caret toggle. State persisted to
  `qn_play_sections_open`. Default = all expanded (industry standard
  for "browse the catalog" UIs: Coursera, edX, Khan Academy, Notion,
  VSCode all default-expanded for what's-available lists).
- **FOUC-prevention pattern (worth keeping):** `body.tier-no-anim` class
  added during init suppresses the height transition. Saved state is
  applied to `aria-expanded` while transitions are off, then a 2×
  `requestAnimationFrame` removes the class. Without this, restoring
  saved state on page load triggers the collapse animation —
  user sees "everything opens, then snaps closed."
- Mobile (<560px) header reflows via flex `order` reshuffle: Row 1 =
  caret + name (left) + chip (right), Row 2 = meta, Row 3 = desc.

*index.html — vertical-spine "What's Inside" (b6798de):*
- Tile grid of every live module replaced with a 3-row vertical-spine
  timeline using **concept pills, not module names**. Decoupled from
  per-module tiering, so the section is immune to the queued module-
  tier reconciliation (Intervals / Ear:Intervals / Ear:Scales fork).
- All spine classes prefixed `wi-` to avoid collisions with existing
  `.row` (inside `.hero-title`), `.s1/.s2/.s3` (used by `.step.s1`),
  `.tier-name` / `.tier-desc` (from the old tier-section CSS, now
  orphaned but harmless), `.tag` (defensive).
- Module-count hero stat removed entirely — the number drifted across
  sources (file said 17, CLAUDE.md said 14, actual was 18) because
  nothing wired it to stay accurate.
- Hero stats now 3 stats inline: `0 Ads / 3 Skill tiers / Lots of fun`,
  wrapping on mobile. Colors via existing `.stat:nth-child` (grape /
  teal / sun).
- Pillars locked to 2×2 desktop / 1-col mobile (was 3-on-top + 1
  orphan with the old `auto-fit minmax(260px, 1fr)`).

**Catches worth remembering:**

- **Ledger Lines first pool was wrong (72a9a5d).** Original pool
  included D4 / G5 (treble) and F2 / B3 (bass) — the "space just
  outside the staff" notes. Inherited renderer's `ledgers(d)` returns
  `[]` for those (no ledger drawn), so they rendered as bare floating
  notes. User caught it: "It has a lot of notes that are not on
  ledger lines." Fix: strict on-ledger-or-flanked pool. **Lesson:**
  when cloning a module that uses a complex renderer function, audit
  what the renderer actually does for each pool entry — don't assume
  semantic-sounding tier descriptions match the rendered output.
- **play.html collapsible: opens then snaps closed.** Initial cause
  diagnosed correctly as localStorage saved-state firing a CSS
  transition during page load. Fix is the `body.tier-no-anim` +
  2×rAF pattern documented above.
- **Module builds are autonomous (rule added mid-session).** Tier 1
  and Tier 2 decisions on clone-and-swap module builds proceed
  without asking. Only Tier 3 blockers (renderer can't handle the
  content / shared file change required / music-theory ambiguity
  with no clear answer) stop the build. This is now in CLAUDE.md.
- **Downloads folder is permission-blocked.** Reading attached files
  from `~/Downloads` returns `EPERM` on this Claude Code process.
  Workaround: user copies into the repo or pastes contents.
  Lesson: in agentic instructions that reference attached files, give
  the user the `cp` command upfront so they're not surprised.

---

**Still open / next (updated):**

COMPLETED this session:
- ✅ Phase 1 builds (all four: Ledger Lines, Dotted Notes & Ties,
  Ear: Rhythm, Piano & Keyboard)
- ✅ play.html collapsible level-section redesign
- ✅ index.html marketing copy + "What's Inside" vertical-spine
- ✅ Hero pillars 2×2 layout
- ✅ Hero stats reordered + "Lots of fun" added
- ✅ Autonomous-build rule added to CLAUDE.md

STILL OPEN (ordered by priority):

**Queued Tier-3 session (do BEFORE Phase 2):**
- Module tier reconciliation across surfaces. Audited drift as of
  2026-05-23:
  - **Intervals** — play.html: Theory. path.html: Reading.
    Decision: Reading. Fix needed in play.html. qn-profile.js
    recommender PATH: **unaudited — read first.**
  - **Ear: Intervals + Ear: Scales** — both in Theory across
    surfaces. Two competing philosophies:
    (a) cluster by modality — all ear training together in Theory
        (lesson/exam structure); vs
    (b) distribute by topic — each ear module sits with its visual
        partner (spec pairing rule): Ear:Intervals→Reading,
        Ear:Scales→Reading. **Unresolved fork — decide deliberately,
        not by recency.** Current state matches (a).
  - Scale Degrees / Scale Modes: Reading on all surfaces. No drift.
- Session deliverables: resolve the ear-module fork; apply moves
  atomically across all four surfaces (index, play, path
  MODULES/PATH/SHORT_PREFIX, qn-profile.js PATH); recompute soft
  unlock thresholds; update curriculum spec.

**Phase 2 — Level 2 gaps (after reconciliation):**
1. Expand Scales: pentatonic + scale type selector
2. Expand Key Signatures: minor keys + selector
3. Build Chromatic Scale
4. Expand Ear: Scales: pentatonic + selector
5. Expand Primary Chords: minor keys + selector
6. Expand Scale Degrees: minor keys + selector
7. Expand Roman Numerals: minor keys + selector
8. Verify + expand if needed: Intervals (clef selector)

**Phase 3:** chord renderer engineering session (qn-staff.js 3-note
extension + playChord in qn-audio.js).

**Phase 4:** 8 Level 3 chord modules.

**Doc updates flagged but not done:**
- **QUIZNOTE_PROJECT_DOC.md §5 is stale.** Listed roster is 24 modules
  with old taxonomy; the May 2026 curriculum redesign moved to a
  27-module roster that lives only in BUILD_LOG.md + CLAUDE.md.
  Add the four new live modules (Ledger Lines, Dotted Notes & Ties,
  Ear: Rhythm, Piano & Keyboard) to §5 with their tier assignments,
  and reconcile against the 27-roster framing. **Tier 2 — its own
  pass.** Not done here because the right time is alongside the tier
  reconciliation session above.
- Theory tier landing tagline now reads "Chords and ear training…"
  (was "Intervals and ear training…") on index.html, because
  Intervals belongs to Reading. Curriculum spec needs the same
  edit when it's reconciled.
- Orphan CSS in index.html: `.tier-section`, `.tier-header`,
  `.tier-meta`, `.tier-desc`, the old `.ltile-*` and `.bg-*` rules
  for the deleted tile grid. Harmless but unused — sweep in a
  cleanup pass.

**Deferred (still need visual harness per §8):**
- time-signatures `accStartX:72` pin (QA first)
- time-signatures prompt-layout conversion + scales tile reconciliation

---

### Curriculum architecture redesign — May 2026

**Session type:** Planning + audit (no new module builds this session)

**What we did:**
Conducted a full curriculum review comparing the 14 existing modules against
standard beginner-to-intermediate music theory pedagogy (Alfred's / Hal Leonard /
Music Theory in Practice sequence). Audited all 14 module files directly to
establish verified current state. Designed the complete 27-module curriculum map
with selectors, tiers, and build phases.

**Key findings from file audit:**

*Already more complete than expected:*
- scales.html: natural minor, harmonic minor, melodic minor all present ✓
  (docs said major only — docs were wrong)
- note-values.html: rests already included in pools ✓
- time-signatures.html: compound meter (6/8, 9/8, 12/8) already in Tricky ✓
- piano-quiz.html and note-names.html: both have treble/bass/both clef selector ✓
- intervals.html: quality (major/minor/perfect) IS tested — QUALITY_TABLE present ✓
- scale-modes.html: all 7 modes (Ionian through Locrian) present ✓
- ear-scales.html: all four diatonic scale types present ✓

*Confirmed gaps:*
- key-signatures.html: major keys only — no minor keys ✓ (gap confirmed)
- scale-degrees.html: major keys only — no minor keys ✓ (gap confirmed)
- roman-numerals.html: major keys only — no minor keys ✓ (gap confirmed)
- primary-chords.html: major keys only — no minor keys ✓ (gap confirmed)
- scales.html: no pentatonic, no scale type selector
- ear-scales.html: no pentatonic, no scale type selector
- intervals.html: no clef selector (likely treble only — verify)
- No Piano & Keyboard module (keyboard→name direction, opposite of PianoQuiz)
- No Ledger Lines dedicated module
- No Dotted Notes & Ties module
- No Ear: Rhythm module
- No Chromatic Scale module

**Key decisions made:**

*Selector pattern (locked):*
Modules with multiple related subtypes use a start-screen selector rather than
spawning separate modules. This applies to: Note Names (existing), Piano Quiz
(existing), Key Signatures (target), Scales (target), Intervals (target),
Scale Degrees (target), Primary Chords (target), Roman Numerals (target),
Ear: Scales (target). Building a separate module file for a subtype is Tier 3.

*27-module roster (locked):*
9 Foundations, 8 Reading, 10 Theory. See QUIZNOTE_PROJECT_DOC.md §5 for the
complete map with files, slugs, selectors, tiers, and music theory accuracy notes.

*No hard locks (locked):*
All 27 modules always accessible to all users. Unlock thresholds (5/9 and 5/8)
affect Path view visual state and recommendation highlighting only. Tapping a
visually-locked module always works with a soft banner.

*Scale Modes sequencing (flagged):*
Currently appears early in Reading. Should be resequenced to later in Reading,
after minor scales modules exist, because Aeolian = natural minor (student needs
that context). Resequence when minor scales are built.

*Ear: Scales sequencing (flagged):*
Currently in Theory tier. Should be in Reading, paired with Scales module.
Move when Reading is reorganized.

*Chord renderer gate (locked):*
8 Level 3 modules require 3-note staff renderer extension to qn-staff.js
(currently v1.2.0, renders single notes and intervals only). One dedicated
engineering session unlocks all 8. Do not attempt chord modules before this.

*Play page redesign (queued):*
play.html to be redesigned as collapsible level sections (Foundations / Reading /
Theory) with progress indicators. Keep existing tier labels and colors. Each
section shows X of N complete, collapsed/expanded by current level. All modules
always accessible.

*index.html marketing update (queued):*
Surgical updates to position QuizNote as industry-standard supplementary
practice for all learners up to intermediate. Specific copy changes documented
below in index.html instructions.

**Build phases:**

Phase 1 — Level 1 gaps (next up, spec first):
- Ledger Lines (clone from note-names)
- Dotted Notes & Ties (clone from note-values)
- Ear: Rhythm (audio-only clone from note-values)
- Piano & Keyboard (clone from piano-quiz)

Phase 2 — Level 2 gaps (after Phase 1):
- Expand Scales: pentatonic + scale type selector
- Expand Key Signatures: minor keys + selector
- Chromatic Scale (clone from scales)
- Expand Ear: Scales: pentatonic + selector
- Expand Primary Chords: minor keys + selector
- Expand Scale Degrees: minor keys + selector
- Expand Roman Numerals: minor keys + selector
- Expand Intervals: clef selector (verify first)

Phase 3 — Chord renderer engineering session

Phase 4 — 8 Level 3 chord modules

---

**Still open / next (updated):**

COMPLETED this architecture session:
- ✅ Full curriculum audit (all 14 module files read directly)
- ✅ 27-module roster designed and documented in §5
- ✅ Selector pattern established as standing rule
- ✅ Spec-first rule established as standing rule
- ✅ Audience constraint added to CLAUDE.md
- ✅ File-verification rule added to CLAUDE.md
- ✅ No-hard-locks decision locked

STILL OPEN (ordered by priority):

Phase 1 — Level 1 gaps (start here):
1. Spec + build: Ledger Lines
2. Spec + build: Dotted Notes & Ties
3. Spec + build: Ear: Rhythm
4. Spec + build: Piano & Keyboard

Phase 2 — Level 2 gaps:
5. Spec + expand: Scales (pentatonic + selector)
6. Spec + expand: Key Signatures (minor + selector)
7. Spec + build: Chromatic Scale
8. Spec + expand: Ear: Scales (pentatonic + selector)
9. Spec + expand: Primary Chords (minor + selector)
10. Spec + expand: Scale Degrees (minor + selector)
11. Spec + expand: Roman Numerals (minor + selector)
12. Verify + expand if needed: Intervals (clef selector)

Phase 3:
13. Engineering session: chord renderer (qn-staff.js 3-note extension + playChord)

Phase 4:
14–21. Build 8 Level 3 chord modules (spec first for each)

Deferred (needs visual harness):
- time-signatures accStartX:72 pin (QA first)
- time-signatures prompt-layout conversion + scales tile reconciliation

Infrastructure (future):
- play.html collapsible redesign
- index.html marketing copy update
- path.html resequencing (after minor scales built)
- Ear: Scales moved to Reading tier (after reorganization)


# QuizNote build log

> **How this file is organized (read me first).**
> The top of this file is **current state + recent sessions** — what's true now and what shipped lately.
> Older resolved sagas (the nav truncation epic, the Vercel deploy saga, the digit-drift saga, etc.)
> have been **collapsed to their durable lesson + a pointer**; their full blow-by-blow lives in
> `BUILD_LOG_ARCHIVE.md`. Nothing was deleted — it was moved so this file stays scannable.
> Cross-cutting *rules* derived from these sagas live in the project doc §8; this log holds the
> *module-specific decisions* and *historical record*. (Cleaned May 2026.)

---

## Current state snapshot (May 2026)

**Infrastructure phase: complete.** Template + spec system, the four shared script files
(`qn-profile.js`, `qn-audio.js`, `qn-staff.js`, `qn-nav.js`) plus `qn-music.js` (forward-looking),
unified nav across all surfaces, account/household layer, dashboard, weak-spot tagging (phase 1)
and recommender (phase 2) are all shipped. The work now is **building out the 24-module roster**
in path order, plus the parallel Tier-3 monetization/legal track. (See project doc §12.)

**Live modules (11):** Note Names, Piano Quiz, Note Values, Time Signatures, Key Signatures,
Scale Degrees, Scales, **Scale Modes** (NEW May 2026), Intervals, **Ear: Intervals** (NEW May
2026), Accidentals.

**Shared files:**
- `qn-profile.js` **v1.8.0** — identity, events, recommender, account/household + 7-day trial
  schema (`startTrial` built-but-not-armed; `trialStatus()` advisory-only; `CURRENT_COHORT='beta'`
  is the go-live lever), plus `QN.ui` shared widgets (`chip`, and `confirm` — the shared quit/confirm
  modal component), plus the `schemaVersion` migration hook (single global stamp at `qn_schemaVersion`,
  `migrations[]` table, `runMigrations()` at init; today's data IS v1 so 0→1 is a no-op stamp — the
  HOOK is the value, future breaking-shape changes plug in via new `migrations[N]`). API ladder:
  1.0 base → 1.1 hold-and-backfill → 1.2 skills tallies → 1.3 recommender → 1.4 resetDevice →
  1.4.1 guest-prompt fix → 1.5.0 corruption-aware reads + `QN.diagnostics` → 1.6.0 account/household
  → 1.7.0 QN.ui.confirm → 1.8.0 schemaVersion migration hook.
- `qn-audio.js` — shared audio engine (`NH.audio`); three module patterns (pure / additions / overrides).
- `qn-staff.js` **v1.2.0** — staff engraving (`NH.staff`): clef (`buildClef`), staff lines, key sigs,
  time-sig **vector-path** digits (not font glyphs), play-staff accidental glyphs (`buildNoteAccidental`).
  Bravura SMuFL for noteheads/accidentals in the migrated staff modules.
- `qn-nav.js` — unified nav component (`QNNav`); pill-shrink/readable-floor/avatar-fallback truncation.
  **Canonical filename is hyphenated** (`qn-nav.js`), matching every other shared file.
- `qn-music.js` **v1.0.0** — superset pitch helpers (`NH.music`: parsePitch/toMidi/diatonicStep/
  displayName/midiEquals, handles `##`/`bb`). **Option A rollout:** NEW modules use it; the 8 existing
  modules keep inline copies until edited for another reason.
- `qn-theme.css` **v1.0.0 (~620 lines)** — the shared CSS file. Design tokens + question prompt +
  answer tiles, plus **all six extracted clusters**: summary, start screen, play-screen chassis,
  modal, **chunky buttons (incl. `.btn:disabled` lifted from scales as superset)**, and **page chrome
  (cards / screens / brand block / site-header / site-footer)**. Holds the shared feedback-toast
  (Option-2 placement) — **rolled out to 8 of 9 modules** (scales excluded by design: different
  feedback model, 40px correct, `.toast.wrong`, no retry/reveal). All 9 modules link the file.
  **Module-specific holdouts left inline (NOT lifted):** piano-quiz's `.brand .brand-logo`; scales'
  `body.playing .site-footer { display: none }`; time-signatures' `.staff-label` (absolute-positioned,
  needs a separate layout conversion); scales' `.choice-btn` desktop 24px (pending tile reconciliation
  for long "harmonic minor" labels); every module's `@media .btn` responsive shrink. Inline CSS per
  module down hard from the pre-extraction baseline.

**Known deferred infra (documented so it isn't forgotten):**
- `schemaVersion` migration hook **installed** (qn-profile.js v1.8.0; 0→1 is a no-op stamp). The
  next breaking shape change bumps `SCHEMA_VERSION` and adds a `migrations[N]` entry. Additive
  changes (new optional fields) still don't need a version bump.
- **Notehead rendering** not yet in `qn-staff.js` — blocks retiring Note Names/Piano Quiz per-module
  note positioning. Sampled-piano audio (Tier 2) not built.
- **Monetization/legal track** (sequenced): promise-copy pass → Apple/Google sign-in (`linkAuth`) →
  Stripe + paywall (`startTrial`) → server-authoritative entitlement → parent-consent gate
  (COPPA/GDPR-K/UK-AADC — lawyer territory) → backend migration via `syncedAt`/`accountId`.

---

## Foundational record

### Completed builds (original four)
- **PianoQuiz** (April) — staff + keyboard, treble/bass/both, original module.
- **Note Names** — staff + four-button MC, derived from PianoQuiz.
- **Note Values** — Bravura symbol + four-button MC, includes explosion FX engine.
- **Key Signatures** — pure key-sig staff + four-button MC, derived from Note Values + PianoQuiz staff renderer.

### Locked design decisions (per-module — the authoritative list)
- **All modules:** 5/10/20 question lengths, optional 30/45/60s timer, mute toggle, personal-best tracking.
- **Note Values:** Easy (whole/half/quarter), Medium (+eighth), Tricky (+sixteenth). Dotted notes/ties/rests fold in as tiers/sub-skills.
- **Key Signatures:** Easy (5 keys: C G D F Bb), Medium (9: +A E Ab Eb), Tricky (15: +B F# Db Gb C# Cb). Distractor: one same-count opposite-type mirror (D=2# paired with Bb=2b).
- **Time Signatures:** Easy `[2/4,3/4,4/4]`; Medium `[+6/8,3/8,2/2]`; Tricky `[+9/8,12/8,5/4,7/8]`. Finite fixed catalog (10 total) — to make harder, add to the catalog, don't change generation. Five question types (`label`/`top`/`bottom`/`whichBeats`/`whichUnit`); concept types use word tiles; position-scoped answer highlighting; question shown in context on a real staff. Sub-skill axis = question type.
- **Scale Degrees:** major keys only in v1 (minor → harder tier later). Three question types (number/name/whichDegree); tiers reuse Key Signatures' 5/9/15 key sets; key-sig row + queried note on one staff (first of its kind).
- **Accidentals:** sharps/flats/naturals/double-accidentals/enharmonics; staff + four-button MC, sibling to Note Names. Sub-skill axis per its question types.
- **Scales:** identify/spell major + minor. Sub-skill axis = mode (`major`/`minor-natural`/`minor-harmonic`/`minor-melodic`). Longest answer labels in the app (drove a `.choice-btn` font tweak — see theming note).
- **Intervals (sight):** identify by sight; inversion/compound fold in as harder tiers. Sub-skill axis = interval shorthand (`M3`,`P5`,…).
- **Note Names / Piano Quiz:** sub-skill axis = clef (`treble`/`bass`).

### Known design philosophy
- Outputs presented as observations, not directives (legal framing).
- No ads, no signup required during beta. Trust-first: keep scope tight.

---

## Cross-cutting systems — how they were built (the "why")

### v2 pivot (May 2026)
Roster unlocked (was the original seven-module lock); audience reframed kids → learners (age-agnostic,
fluency-based; guardian-owned child profiles); scope set to comprehensive Western tonal theory;
learning path + weak-spot tracking added as core systems; audio plan committed (synth → sampled →
multi-timbre); concept explainers added; three-tier decision authority adopted (see project doc §8).

### Profile prompt + score tracking (qn-profile.js v1.1.0)
**Problem:** anonymous rounds were silently dropped — there was no first-run prompt and `log` did
`if(!active) return false`. **Fix:** `logOrHold` holds anonymous rounds (capped 50) in
`qn_pendingEvents`; `backfill(profileId)` writes them into the new profile; `create()` auto-calls
backfill (single chokepoint). Prompt shows **after the first round** on the summary screen, not as a
blocking popup. Old `log` left intact (additive). [Tier 2] Hold *all* recent anonymous rounds, not
just the latest, so a multi-round warm-up isn't lost.

### Progress dashboard (dashboard.html) + sub-skill tagging
**Dashboard** is standalone (not a panel in profile.html) so it *is* what a future Supabase-backed
dashboard becomes — same data source, server-rendered later, no rebuild. Reads only via
`QN.events.query()` + `<slug>_pb_<tier>` keys. Module list derived from event data, not a hardcoded
roster (self-maintaining). States: anonymous / profile-no-rounds / has-data.

**Sub-skill tagging (phase 1) — schema [Tier 2]:** each event optionally carries
`skills: { skillKey: { c, t } }` (lean per-sub-skill tallies, not a per-question array). Chosen
because it's exactly what the recommender consumes, stays bounded under the 5000-event cap, maps to a
Supabase JSON column, and keeps item-level granularity open via more-specific keys (`bottom-8` vs
`bottom`) with no schema change. `sanitizeSkills()` clamps/drops bad values. All 9 modules emit tags;
six derive from `state.history` at summary (can't drift from score), Scales accumulates
`state.skillTally` (no history array — the recurring outlier). **Retry rule:** in Note Names/Piano
Quiz/Intervals a retry counts as *not correct* for the sub-skill (matches how those modules score).

### Weak-spot recommender (qn-profile.js v1.3.0) — phase 2, logic only
`QN.recommend.next(profileId)` returns `{module, tier, length, kind, reason, weakSkills}`,
`kind ∈ cold-start|progress|remediation|review`. Pure read over `qn_events`. **Locked philosophy
(evidence-based):** *balanced* — forward progress with weak spots woven in, NOT remediation-first.
Learning research favors interleaving over blocked drilling; review-everything-first stalls progress.
The no-nag cap (don't serve the same weak spot back-to-back) is the spacing effect, not politeness.
**Interleaving guardrail:** bias a round toward a weak module, but rounds stay interleaved — never
build single-sub-skill blocked drills. Competitive context: Tenuto is manual; doing this automatically
is the moat. **Phase 3 (the "Today" surface) is the next piece** — see path.html below.

### Roster expansion to 24 + path-first IA [Tier 3, user-approved]
Roster grew 20 → 24 (added Rhythm Reading, Circle of Fifths, Primary Chords; tracked Chord
Inversions/Progressions as folded-in tiers). Three-ring IA designed: Ring 1 Today (single rec card),
Ring 2 path spine (Duolingo-style, soft-lock), Ring 3 Practice (the buffet). **Soft-lock never
hard-lock** — honors the skip-the-path promise for intermediates. Placement is performance-driven
(no test gate) in v1. Tier vocabulary reconciled to live-site names (Foundations/Reading/Theory).

### path.html built — phase 3 first surface
Today card (renders `QN.recommend.next`) + spine (cleared/current/locked) + Practice peek. Built as a
**new page** (not overwriting play.html) so nothing breaks and the feel can be evaluated first. Spine
cleared-tier logic is in-page/additive (≥2 rounds at a tier AND ≥85% = cleared, reusing the
recommender's advance rule) — no qn-profile.js change. **Now live** (confirmed this session's repo).

### Account/household layer + 7-day trial (qn-profile.js v1.6.0) [Tier 3]
Account = up to 5 learner profiles (`MAX_PROFILES_PER_ACCOUNT`). `Account.authId` null until
Apple/Google claims it via `linkAuth` (identity only — does NOT start trial or take a card, decoupled
on purpose). `pricingCohort` stamps birth cohort; today `'beta'` (founder tag); go live by flipping
`CURRENT_COHORT` to `'standard'` — existing beta accounts keep their tag forever. `startTrial()` built
but not armed (future paywall fires it at the Stripe moment). `trialStatus()` advisory/UX-only — **real
entitlement MUST be server-authoritative once a backend exists; never gate a paid feature on the local
value.** All additive/backward-compatible.

### localStorage durability playbook (qn-profile.js v1.5.0)
Reads never crash; **corrupt ≠ empty** — a parse failure copies the raw blob to
`<key>__corrupt_<timestamp>` and logs it (`QN.diagnostics.corruption()`), returning a safe fallback
instead of a silent vanish. Evolve the stored shape **additively** wherever possible (no migration
needed). Hard boundaries by design: ~5MB/origin (hence the 5000-event cap), per-device + per-origin.
Supabase is the structural answer; the local schema is deliberately backend-shaped (opaque IDs,
`syncedAt`, `accountId`, final event shape) so migration is lift-and-shift.

### Device-wide reset (qn-profile.js v1.4.0)
`QN.profile.resetDevice()` wipes everything QuizNote-owned (all `qn_*` + all `*_pb_*` keys), leaving
unrelated same-domain keys intact. Surfaced as "Reset all data on this device" on profile.html behind
a two-step confirm (scope statement + count preview + explicit second tap). **Destructive/rare actions
stay OUT of everyday menus** — never adjacent to profile-switch.

---

## Recent module builds (kept at full fidelity)

### Accidentals (module #5 — first post-infrastructure roster build)
Built by **clone + brain-swap, NOT regenerate** — clone a sibling (Note Names), swap the renderer +
generator + namespace, keep the proven scaffold. Staff renderer extended (carries forward). Bugfixes
in-session: enharmonic question could present two correct answers (fixed); bass-clef position fix that
surfaced a staff-renderer divergence finding. **Staff renderer unified** — accidentals + note-names
migrated to Bravura SMuFL (the "done-forever" path); treble clef position/size recalibrated and rolled
out to all six staff modules; **clef rendering consolidated** into `qn-staff.js.buildClef()` (ended the
six-edit clef tweak); play-staff accidental glyphs consolidated into `buildNoteAccidental()`. This is
also where `qn-music.js` was created (forward-looking, option A).

### Scale Degrees (module #8 — path-order build via clone-and-swap)
Major keys only in v1. Three question types (number/name/whichDegree); tiers reuse Key Signatures'
5/9/15 key sets. **First module to combine a key-sig row + a queried note on one staff** (new rendering
assembly). Loads `qn-music.js` and uses `NH.music` (first consumer). A load-order finding was flagged
(renderer must set its globals before the deferred game-loop runs — same rule as `NH.audio`). Bugfix:
quit ("✕") button did nothing in Note Values + Time Signatures (fixed).

---

## Collapsed sagas (full narratives in BUILD_LOG_ARCHIVE.md)

These were multi-session debugging epics. Their durable lessons (also in project doc §8) are kept here;
the blow-by-blow is archived.

- **The staff/digit drift saga.** Time-sig digits rendered at inconsistent positions/sizes; only 6/8
  looked right. ~6 wrong fixes built on layout/math theories. **Root cause:** font/`dominant-baseline`
  rendering under SVG scaling (6 and 8 are vertically symmetric, so baseline-centering happened to land
  them right). **Fix:** hand-authored vector `<path>` glyphs (0–9) in qn-staff.js — no font, no
  baseline, pixel-identical everywhere. Weight dialed via a dev-only slider harness
  (`glyphH = lineGap*1.80`, `feMorphology` erode `2.0`). **Lessons:** inspect the computed DOM/box model
  before theorizing; use the working case as the diagnostic key ("why is 6/8 always right?"); build the
  calibrator first.

- **The unified-nav saga (3 parts).** (1) Returning users saw the guest "Test drive" CTA — **root cause
  was a filename mismatch**: repo had `qn_nav.js` (underscore), pages requested `qn-nav.js` (hyphen) →
  404 → `QNNav` undefined. Fix: rename to hyphen (canonical). Lesson: before blaming stale
  deploy/cache, check the Network tab for a 404 and match committed vs requested filename. (2) Dropdown
  rendered but clicks did nothing — **stacking-context trap** (nav's `backdrop-filter` created a
  context; panel's z-index only ranked within it). Fix: panel `position:fixed; z-index:99999` appended
  to body. Lesson: `elementFromPoint` is the tool for "visible but unclickable." Also fixed:
  `overflow-x:hidden` on body silently breaks `position:sticky` (any non-`visible` overflow ancestor
  becomes the sticky container) → use `overflow-x:clip` on html. (3) Pill truncation done right after
  two retired iterations — **truncate the flexible label, never wrap the layout or clip fixed controls**
  (`flex:none` on brand/button, `flex-shrink:1; min-width:0` on the pill); readable floor (~8 chars),
  avatar-only fallback below ~480px. These are the industry-standard nav rules now in the doc.

- **The Vercel deploy saga.** A long deploy-debugging arc during the loadSettings retrofit. Durable
  lesson: stale-deploy symptoms have multiple causes (cache, filename mismatch, wrong file deployed) —
  verify the live file is the intended one (Network tab, version string in console) before theorizing.
  `QN.version` in the console is the ground-truth stale-deploy check.

- **The save-scores prompt bug (root cause was CSS, not JS).** The prompt showed for active profiles
  despite provably-correct JS. **Root cause:** an element toggled via the `hidden` attribute that also
  has an author `display` rule needs a matching `.selector[hidden]{display:none}` guard — the browser
  default loses to any class selector setting `display`. App-wide fix. This is the second instance of
  "inspect the box model, not the logic"; the rule is in project doc §8.

- **Misc resolved UI sessions** (full detail archived): welcome-back bar mobile two-row + sticky;
  hub-page profile chip dropdown menu; module nav unification (all modules onto `QNNav` + footer/tagline
  cleanup); profile.html into unified nav + footer standardization; "No tracking" copy removed for
  legal-accuracy; onboarding fluency level tags; Samsung question-clip fix; key-sig tile sharps
  re-anchored; PianoQuiz "Test Drive" demo funnel (pianoquiz-demo.html).

---

## May 2026 — Shared-CSS architecture (qn-theme.css) + shared modal component + quit-bug fix

Big session. Three connected pieces of the "edit one file, not 9-to-24" goal, plus a real bug fix.

### The theming audit — corrected by screenshots (a working-rule moment)
First pass: a class-name grep across all 9 modules reported `.staff-label` "byte-identical, consistent."
**Wrong.** User screenshots showed three different live prompt treatments (small-caps-left, big-bold-
centered, medium-left). The grep matched the class *name*; it missed that time-signatures has a second
override rule, that a stale deploy showed a big-centered version, and that modules filled the slot
differently. **Lesson (now project doc §8):** audit consistency by the RENDERED result, not selector
names — the source can lie about the rendered truth. Diff full rule bodies + overrides, or look at pixels.

### qn-theme.css — the first shared CSS file
The CSS sibling to the shared JS. Holds: the 16 design tokens (`--ink`/`--teal`/… — were byte-identical
in all 9 modules, lifted verbatim, no reconcile needed), the canonical question prompt (`.staff-label`),
and the full answer-tile system (`.choice-btn` + states + responsive). Each module links it in `<head>`
after the font link; the duplicated inline rules are stripped (an inline copy at equal specificity but
later source order silently overrides the shared file — the load-order trap, handled by deletion).
- **Canonical prompt = "quiet A" + fixed-height zone** (user decision, after rejecting big-bold-centered
  "B"). Sentence-case, centered, 22px/600, `min-height: 2.5em` so the staff never shifts between one- and
  two-line prompts. This is the notation-drill genre standard (content-forward: staff is the hero, prompt
  is stable furniture). Folds in time-signatures' old Samsung wrap fix. Size dialed 15→20→22px live —
  each change was ONE line in qn-theme.css, all modules inheriting: the architecture proving itself.
- **Wording normalized** to question form: note-values "What note value is this?", scales "What scale is
  this?", intervals "What interval is this?", time-signatures fallback "What time signature is this?".
- **All 9 migrated**, verified per file (link present, duplicates gone, braces balanced, every token
  resolves, FX `--bx/--by` JS-set vars untouched). Proof on note-names first, then the batch.
- **Two deliberate holdouts** (kept inline, flagged): time-signatures `.staff-label` (absolute-positioned
  layout — needs a separate conversion to the shared normal-flow prompt) and scales `.choice-btn` (24px
  desktop for long "harmonic minor" labels — pending wrap-as-designed tile reconciliation).
- **Measured backlog:** 41 byte-identical selectors are shared across all 9 modules (start screen,
  summary, modal, stat cards, timer pills, tile grid) and still inline. Extracting them in grouped passes
  is the bulk thinning (~800→~250 inline lines/module). Only 2 of 55 shared selectors diverged
  (`.staff-card`, `.staff-actions`) — a remarkably clean codebase. This is the next CSS work.

### QN.ui.confirm — shared modal component (qn-profile.js v1.7.0)
Promoted the quit/confirm dialog from per-module markup + hand-written handlers to one shared component.
Basis: note-names' existing generic `showConfirm`. **Canonical arrangement locked (user pick, Option 1):**
Quit = ghost/LEFT, Keep playing = solid green/RIGHT; backdrop/Escape = safe dismiss. Lives in one place;
changing it updates every module. Reuses an existing `#modal-overlay` if present, or builds its own.
Takes `onOpen`/`onClose` hooks so each module pauses/resumes its own timer (the shared comp can't call a
module's `pauseTimer`). General (quit, start-timer, future dialogs) — not quit-specific. Proven on
note-values; rollout to the other 8 + retiring note-names' `showConfirm` is the remaining mechanical step.
Holdout: note-values keeps its inline modal markup for now (component reuses it); shedding the markup
pairs with the CSS extraction pass when `.modal-overlay` moves to qn-theme.css.

### The quit bug (what the user reported) — root cause + fix
note-values + time-signatures: clicking ✕ showed the "Quit" dialog, but clicking "Quit round" did
nothing. **Root cause: crossed labels.** The button *labeled* "Quit round" had `id="modal-cancel"` wired
to the resume/keep handler; "Keep playing" had `id="modal-confirm"` wired to the actual quit. So "Quit
round" closed the modal and resumed = looked like nothing happened. Handlers were fine; labels were on
the wrong buttons. Fixed properly by migrating both to `QN.ui.confirm` (which assigns labels↔handlers
correctly by role), superseding an interim label-swap. Other modules use note-names' generic
`showConfirm` and were never affected — the bug lived only in the older hardcoded-modal group.

### Build-log cleanup (this same session)
Original 1089-line log → this cleaned ~234-line active file + `BUILD_LOG_ARCHIVE.md` (708 lines, full
saga narratives preserved verbatim). Resolved sagas (nav 3-parter, Vercel deploy, digit-drift) collapsed
to their durable lesson + pointer; recent builds kept full; foundational sections consolidated. Every
critical term verified present across active+archive. (Both files now under version control as of
the May 2026 finishing session — see below.)

### Deploy set
`qn-theme.css` (new) · `qn-profile.js` (v1.7.0) · all 9 modules (note-names, piano-quiz, note-values,
time-signatures, key-signatures, scale-degrees, scales, intervals, accidentals). Deploy qn-theme.css WITH
the modules (they depend on it for tokens). Hard-refresh; confirm `QN.version` === `1.7.0`. QA: each
module's prompt is 22px sentence-case centered + staff stable; answer tiles unchanged; ✕ → quit dialog
with Quit(ghost,left)/Keep(green,right); Quit returns to start, Keep resumes (timer continues).
**User-confirmed working:** note-names prompt render, note-values quit fix via shared component.

### Doc updates folded in (project doc)
§4 shared-files (qn-theme.css + QN.ui home), version ladder (→1.6.0, 1.7.0), §6 confirm-modal convention,
§8 rendered-vs-source audit rule, §12 consolidation pass + the ~41-selector backlog + the schemaVersion
pull-forward recommendation, header "Last revised" bumped.

### CSS-selector extraction — clusters done (later same session, all deployed + user-QA'd live)
Worked the ~41-selector backlog biggest-payoff-first, by duplicated-lines-removed-across-9. Method per
cluster (proven, repeatable): (1) audit per-module identity programmatically — separate byte-identical /
partial (identical where present) / divergent; (2) capture exact rule text PROGRAMMATICALLY from
note-names (hand-typing introduced a `.summary-speed` padding/box-shadow error — caught by byte-verify,
so: never retype, always copy bytes); (3) append to qn-theme.css; (4) byte-verify each appended rule vs
source (watch the @media false-positive: parser matches the media override, not the base — confirm by
checking the rule has the base props); (5) strip from all 9, splitting top-level vs @media segments and
preserving @media verbatim; (6) verify braces + parse + tokens-resolve + JS-intact. Backups to
/tmp/qn_backup_*. **Recurring theme: scales is the lone outlier in nearly every cluster** — and its
divergence is almost always a *subset* (missing an animation, a rule, a larger font). Standing resolution:
lift the superset so scales comes into line; flag any visible change. Rules genuinely module-specific
(time-signatures fixed-layout staff, retry-mechanic toasts) stay inline.

- **Summary cluster (~171 lines, did FIRST as the safe proof):** 19 rules (`.summary-*` incl. tier
  variants, grid descendants, speed + companions, `#summary-screen`) → shared. scales GAINED the
  tier-perfect/great title `summaryPop` animation it was missing (was the subset — user OK'd as
  uniformity). `@keyframes summaryPop` stays inline in every module (scales uses it elsewhere too); shared
  tier rules reference each module's local keyframe — resolves fine. `.summary-speed` inert in scales (no
  element). The `@media .summary-title{font-size:40px}` override stays inline.
- **Start-screen cluster (~711 lines, biggest payoff):** 34 rules (`.start-*`, `.tile*`, `.tpill`,
  `.timer-*`, `.q-block/.q-label`) → shared. CLEANEST cluster — zero divergent, all 34 byte-identical;
  scales shed 31 (lacked the 3 clef-tile rules, which went to shared and are inert in scales). All
  `@media` tile/timer/badge overrides preserved inline.
- **Play-chassis cluster (~513 lines, #2 payoff, mid-game UI — extra care):** 29 of 37 candidates → shared
  (stat cards, progress bar+fill, streak badge, topbar, icon/mute btns, last-dots, correct-toast
  cycle/show). LEFT INLINE deliberately: `.staff-card` (time-signatures `height:320px`), `.staff-actions`,
  base `.toast.correct` (scales 40px vs 44px — possibly intentional), retry-mechanic toast/dot rules
  (`.toast.retry/.reveal/.wrong`, `.last-dot.retry` — only some modules have retry), all @media overrides.
  A `.stats-col .stat-card` descendant straggler initially missed by the strip (left as a harmless
  duplicate) was cleaned in a follow-up pass. JS still toggles all these classes at runtime — only
  styling moved.
- **Modal cluster (~198 lines, #3 payoff):** 15 rules → shared (`.modal-overlay` base + `[hidden]`,
  `.modal-card` + h2 + p, `.modal-actions`, `.miss-list` base + h3/ul/li::before/miss-empty,
  `.pb-label/.pb-new/.pb-sep/.pb-row[hidden]`). Trickiest dependencies of any cluster, all handled:
  `.modal-overlay.show` (only the 2 component-migrated modules, overrides `[hidden]`) stayed inline — the
  exact-selector strip correctly did NOT clobber `.modal-overlay.show` when removing `.modal-overlay`;
  `@keyframes modalFade` (referenced by `.modal-overlay`) stayed inline in all 9 (resolves against the
  shared rule). The base `.modal-overlay`/`.miss-list` bodies tripped the flat-body parser (multi-prop) —
  found and verified by line-range, not regex. All 9 verified live.

**Payoff so far:** note-names inline CSS 765 → 450 lines (~41% cut); holds across all 9. Current inline
counts: note-names 450, scale-degrees 435, intervals 463, accidentals 478, scales 480, note-values 538,
key-signatures 535, time-signatures 576, piano-quiz 607. qn-theme.css now ~497 lines. **All four clusters
deployed and user-confirmed rendering correctly on Dev** (summary incl. scales animation; start screen
tiles/timer; in-play stat cards/progress/streak; modal backdrop/card/missed-list/PB rows).

### Modal arrangement fix — key-signatures + scales (this session, deployed)
Separate from the component rollout: key-signatures and scales were the only 2 modules showing a GREEN
Quit button (wrong per Option 1). Both still on hardcoded modals. Fixed by markup edit — swapped which
button carries `ghost` + DOM order so Quit=ghost/left, Keep=green/right — handlers preserved via ids
(verified labels↔handlers, no crossed-bug reintroduced). The other 7 already matched Option 1 (5 always
did; note-values + time-signatures via the component). All 9 quit dialogs now visually consistent.
NOTE: this did NOT migrate them to `QN.ui.confirm` — modal component is still 2-of-9 (note-values,
time-signatures); the other 7 keep their own modal code. "All 9 consistent" is true *visually*, not yet
*architecturally*.

### Key-sig clef-overlap bug (scale-degrees) + proportional clef clearance in qn-staff.js
User spotted: in scale-degrees, key-signature flats rendered ON TOP of the treble clef (B♭ major / E♭
major both showed it, treble and bass). **Root cause (verified byte-identical in pre-CSS backup, so NOT
from the extraction work — pre-existing):** scale-degrees placed key-sig accidentals at a fixed
`xOffset + 44`, too close to the clef. The clef glyph's width scales with `lineGap` (font-size =
`lineGap * 4.2`), but the `44` was a fixed pixel value — so at scale-degrees' `lineGap 14` the clef's
right edge reached past 44 and collided with the first accidental. The dedicated key-signatures module
uses the equivalent of `4.5 * lineGap` (72 at lineGap 16) and renders clean — which is why key-sigs
looked fine and scale-degrees didn't. **Fix:** scale-degrees `ksStartX = xOffset + lineGap * 4.5`
(proportional, matching key-signatures' clearance); a second copy of the same `44` in the note-x math was
routed through the same `ksStartX` so the note stays a consistent distance after the key sig. **Also
hardened the shared renderer:** `qn-staff.js` `buildAccidentals` default startX and `buildStaff`
`accStartX` changed from fixed `72/70` to `lineGap * 4.5 / 4.4` — reproduces 72/70 exactly at lineGap 16
(key-signatures unchanged), robust at any size. Added an optional `accStartX` override to `buildStaff`.
**Blast radius checked:** only 3 modules render key sigs — key-signatures (lineGap 16, → 72, no change),
time-signatures (lineGap 20, → 90, **shifts key sig right ~18px** — the one visible side-effect, can be
pinned to 72 via the new override if it crowds the numerals), scales (own renderer, already proportional
at 3.5×, untouched). scale-degrees fix user-confirmed live (treble + bass).

### Feedback-toast centralization to qn-theme.css — Option 2 placement, scale-degrees first
The in-play feedback toast ("Got it!" / "Try once more!" / praise) overlapped the prompt on scale-degrees
(its long two-line prompt "...(Key of E♭ major)" sits where the toast's `top: 38px` lands). Toast position
lives in the base `.toast` rule, which was still inline (left out of the play-chassis cluster because the
variants diverge). **Divergence map:** the 8 non-scales modules share a byte-identical base `.toast` +
`.toast.correct`(44px)/`.toast.retry`(30)/`.toast.reveal`(26); **scales is a different feedback model**
(`.toast.correct` 40px, has `.toast.wrong`(28), no retry/reveal) — genuinely different, NOT flattened.
**Chose Option 2 placement** (user pick, via mockups): big `correct` praise pops high over the staff
(`top: 46%`), smaller `retry`/`reveal` sit lower (`top: 64%`) so corrective text reads clean — praise is
celebration, correction is calm guidance. **Scoped "prove on scale-degrees first" (user pick):** the
shared toast block (base + 3 kinds, Option-2 tops) is now IN qn-theme.css, but ONLY scale-degrees is wired
to it (its inline toast stripped → inherits shared). The other 8 KEEP their inline `.toast` (top:38px),
which overrides the shared rule via source order — so they're unchanged until rolled out. The 46%/64%
values were guessed blind (no fixed card height to compute against) and user-confirmed correct on first
try. **Pending rollout:** strip inline toast from the other 8 so they inherit the proven shared version,
QA per module (card heights differ); scales keeps its own model.

### Still open / next (sequenced)
Items 1, 2, 3, 6, 7 closed in the May 2026 finishing session (see entry below). Remaining:
1. ✅ ~~Roll out the shared toast~~ — done (`c2d65ac`).
2. ✅ ~~Extract remaining CSS clusters (buttons + page chrome)~~ — done (`5173432`, `e92a028`);
   all 6 of 6 clusters now in `qn-theme.css`.
3. ✅ ~~Roll `QN.ui.confirm` to the other 7 modules + retire `showConfirm`~~ — done (`c951bde`);
   9-of-9 architecturally.
4. ⏸ Consider making time-signatures pin `accStartX: 72` if the +18px key-sig shift crowds its
   numerals (one-line use of the new `buildStaff` override) — **QA-driven, not done.**
5. ⏸ time-signatures prompt-layout conversion + scales tile reconciliation (the 2 qn-theme.css
   holdouts) — **needs visual calibration via a slider harness per project doc §8.**
6. ✅ ~~`schemaVersion` migration hook~~ — installed (`517b0be`, qn-profile.js v1.8.0).
7. ✅ ~~Deploy cleaned BUILD_LOG.md + BUILD_LOG_ARCHIVE.md~~ — both under version control
   (`ba2609f`, `dc9f7fc`); also `CLAUDE.md` + `QUIZNOTE_PROJECT_DOC.md` (`3c9b6f6`).

---

## May 2026 — Finishing session (toast rollout · final CSS clusters · QN.ui.confirm rollout · timer-badge fix · start-timer to all · scales audio · schemaVersion · docs deploy)

Closed 5 of the 7 "Still open / next" items in one session. Total impact: **−827 net code lines**
across 11 commits, plus 1716 doc lines now under version control. Two items (4 and 5) explicitly
left for visual QA / slider-harness work per project doc §8.

### Shared toast rolled out to the other 7 (`c2d65ac`)
Stripped the inline `.toast` / `.toast.correct` / `.toast.retry` / `.toast.reveal` from note-names,
piano-quiz, note-values, time-signatures, key-signatures, intervals, accidentals — they now
inherit the qn-theme.css Option-2 rules. scale-degrees was already on shared. **scales kept its
inline rules** (different feedback model: 40px correct, `.toast.wrong`, no retry/reveal).
Pre-flight Python check confirmed byte-identity of the inline blocks across all 7; no `@media`
overrides, no `.toast.wrong` outside scales, no toast keyframes affected. Braces balanced post-strip.
**Calibration moment:** mid-rollout, "Got it!" was reported appearing in the retry zone in
note-names; investigation showed it's wired with `kind: 'reveal'` (after a retry-success) so it
takes the `.toast.reveal` placement, which is intentional — the small/low style is the calmer
"you got there on the second try" signal vs the big/high "Bravo!" for clean first try. Left alone.

### Buttons cluster extracted (`5173432`)
10 byte-identical `.btn` / `.ghost` rules across all 9 modules + the `.btn:disabled` rule that was
only in scales (lifted as the **superset** so the cluster is complete — risk near-zero since no
module currently puts a `disabled` attribute on a `.btn`). Every module's `@media (max-width:760px)
.btn { font-size: 14px; padding: 8px 12px; }` responsive shrink stays inline per convention.
piano-quiz also keeps `.btn.hint-btn` inline (module-specific). −206 net lines.

### Page-chrome cluster extracted (`e92a028`) — final CSS cluster
Four non-contiguous sub-blocks lifted in one logical unit: cards (`.card` + variants), screen
system, brand block (`.brand` + descendants), `.site-header` + `.site-footer`. 16 byte-identical
rules across all 9, modulo cosmetic-only whitespace in piano-quiz's `.brand` body (multi-line
vs single-line; functionally identical) and a missing comment header on scales' footer block.
**Module-specific holdouts left inline:** piano-quiz's `.brand .brand-logo` (only piano-quiz has
the start-screen brand-logo element); scales' `body.playing .site-footer { display: none }` (only
scales hides the footer in play view). −466 net lines. With this, **all 6 documented clusters are
in qn-theme.css** — the shared-CSS architecture milestone is done.

### QN.ui.confirm rolled out to the other 7 (`c951bde`)
All 9 modules now use the shared `QN.ui.confirm` component for the quit dialog (and start-timer
dialog where applicable) — architecturally consistent, not just visually.
- **5 showConfirm-engine modules** (note-names, piano-quiz, scale-degrees, intervals, accidentals):
  migrated both call sites (quit + start-timer) to `QN.ui.confirm` with `onOpen: pauseTimer` /
  `onConfirm: resumeTimer` / `onCancel: { stopTimer; showScreen('start') }`. Per-module
  `function showConfirm` definitions removed. The byte-identical showConfirm function across 4 of 5
  (and the cosmetically-different piano-quiz variant) made the batch tractable. Quit call sites
  were byte-identical across all 4 non-note-names; start-timer body text byte-identical for 3 of
  4 (piano-quiz uses a 3-branch ternary with "read" instead of "name" — handled separately).
- **2 hardcoded-modal modules** (key-signatures, scales): swapped the modal button ids in markup
  so ghost-left = `modal-cancel` and solid-right = `modal-confirm` — **restoring the
  QN.ui.confirm convention.** The prior "modal arrangement fix" in the cleanup session had swapped
  the ghost class + DOM order but kept the OLD ids, leaving ghost-left as `modal-confirm` —
  invisible until now because the inline handlers were id-keyed. Migrating to QN.ui.confirm (which
  writes labels by id) made the id-swap necessary. Replaced 3 direct event listeners (exit-btn,
  modal-cancel, modal-confirm) with one QN.ui.confirm call. key-signatures' timer pause/resume
  inlined in onOpen + onConfirm (no pauseTimer/resumeTimer helpers there); scales' onCancel
  preserves clearInterval + A.cancelSequence + show('start-screen').

### Timer-badge stays hidden after pause/resume — latent bug fix (`dc77a2c`)
QA caught: in key-signatures (and reproducibly in note-values and time-signatures), the timer
badge disappears from the top-right after the quit modal is dismissed with "Keep playing", but
the timer continues counting invisibly and ends the round at zero. **Root cause:** `stopTimer()`
in those 3 modules does TWO things — `clearInterval` AND `els['timer-badge'].hidden = true`.
The quit-dialog flow calls `stopTimer()` in `onOpen` (to pause), then re-creates the interval in
`onConfirm` — but never unhides the badge. **Fix:** one line in each of the 3 modules,
`els['timer-badge'].hidden = false` before re-creating the interval in onConfirm. **Pre-existing
bug** — was already present in note-values and time-signatures from when they migrated to
QN.ui.confirm in the prior session; replicated faithfully in key-signatures' migration this
session. The 5 showConfirm-migrated modules don't hit this because they use
`pauseTimer`/`resumeTimer` helpers that don't touch badge visibility.

### Start-timer "Ready, set…" modal rolled out to the missing 4 (`edd2fe7`) + scales audio
Was previously in 5 of 9 modules. Added to note-values, time-signatures, key-signatures, scales.
Each gets a `function showStartTimerModal()` invoked from the start-btn handler when
`state.settings.timer.enabled`; otherwise the existing `startGame()` (or `startRound()` in scales)
fires directly. Body text uses module-accurate "identify N note values / time signatures /
key signatures / scales" rather than the generic "name N notes" the 5 original modules share —
those originals are pre-existing copy-paste and arguably want a tightening pass.
**Scales audio fix (same commit):** added `A.cancelSequence()` to scales' quit-modal `onOpen` so
the currently-playing scale stops the moment ✕ is pressed (was pre-existing behavior: audio
continued through the modal). Audio also stops on Quit (was already wired in onCancel).

### schemaVersion migration hook installed (`517b0be`, qn-profile.js v1.8.0)
The deferred infra called out as "highest-leverage." Today's stored data IS v1, so the 0→1
migration is a no-op stamp — **the hook is what's being installed**, not a data transformation.
Single global stamp at `qn_schemaVersion` (absent ⇒ 0). `migrations[N]` is keyed by FROM version
and must be idempotent. `runMigrations()` is called once at module init before any consumer
reads; it writes the new version ONLY after each step completes, so a thrown migration halts the
chain with the previous version intact. `window.QN.schemaVersion` exposed for diagnostics.
Future breaking shape changes (rename / retype / restructure of stored records) bump
`SCHEMA_VERSION` and add a `migrations[N]` entry; additive changes (new optional fields, as the
skills tally was) still don't need a version bump. Bumped `QN.version` 1.7.0 → 1.8.0.

### Documentation under version control (`ba2609f` · `dc9f7fc` · `3c9b6f6`)
The 4 working docs that had lived only on the local machine are now committed:
`BUILD_LOG.md` (cleaned 234-line active file), `BUILD_LOG_ARCHIVE.md` (708 lines of preserved
saga narratives — the user added the file mid-session after the original cleanup had moved its
contents but not the file itself), `CLAUDE.md` (per-project working guide), and
`QUIZNOTE_PROJECT_DOC.md` (source-of-truth doc). With docs single-device-only being the project's
biggest continuity risk per its own framing, this closes that gap.

### Working-rule moments worth keeping
- **Calibrated authority for mechanical multi-file refactors.** Mid-toast-rollout, the user
  explicitly directed: "auto-accept file edits and batch them — only pause for git commits
  and pushes." This was saved as a memory and is now the operating mode for this class of
  work: pre-flight byte-identity check across all targets (still mandatory, per §8); STOP
  and flag if any module diverges (still mandatory, per §8); but DON'T pause between
  modules for QA when the pattern is already validated. Pre-existing rule of
  "one-change-verify-then-next" is now scoped to **risky or judgment-heavy** changes;
  mechanical strips are calibrated up to "batch and structurally verify." Saved at
  `~/.claude/projects/-Users-jonathandezwaan-Quiznote/memory/feedback_mechanical_refactor_pace.md`.
- **A naive `@media` stripper that matches the word "@media" inside a CSS comment is wrong.**
  Bit the structural-verify script for the buttons cluster — the breadcrumb comment that
  replaced the lifted block contained the literal text "responsive @media .btn override stays
  inline below", which caused the verifier's `@media[^{]*\{` regex to false-match and consume
  the next real `{`. Fix: strip CSS comments (`/\*.*?\*/`) before running @media-aware regexes.
  Same lesson as project doc §8's "audit by the rendered result, not just the source" — the
  source can lie about the rendered (or parsed) truth.

### Doc updates folded in
This entry; the "Current state snapshot" qn-profile.js + qn-theme.css blocks; "Known deferred
infra" (schemaVersion now installed, not deferred); the "Still open / next" status; the obsolete
"deploy this file back to the repo" note removed. `QUIZNOTE_PROJECT_DOC.md` updates in parallel.

---

## May 2026 — Roster expansion: Scale Modes + Ear: Intervals (9 → 11 live)

Goal: get from 9 to 12 modules in one session, focusing on Reading / Theory tiers. Landed at **11 live** (9 → 11), with the third candidate (Triads) deliberately deferred to its own focused session after a hard course-correction.

### Picks (Tier-2 reasoning at session start)
First pick was **Triads / Seventh Chords / Primary Chords** off `intervals.html`, reasoning the chord arc would lift Theory tier from 0 → 3 live. **Wrong call.** Intervals' renderer is hardcoded for 2 notes (lower/upper) and its audio engine for 2 midi numbers; 3-note chord rendering is fundamentally outside its scope. A clone-and-swap that adds a parallel `buildStaffWithTriad` / `playTriad` alongside the originals is *net-new code in a cloned shell* — not clone-and-swap. Caught and reversed mid-session; the chord cluster is now queued as its own session starting with a 3-note staff renderer extension. (New §8 rule captures the lesson — see project doc.)

Re-picked: **Scale Modes (§5 #12)** + **Ear: Intervals (§5 #19)**. Both are genuine pure clone-and-swap candidates:
- Modes ride scales.html's existing scale-run renderer untouched.
- Ear: Intervals reuses intervals.html's renderer + audio + question/choice logic untouched, with one CSS rule hiding the visual.

Third clean candidate didn't exist in Reading/Theory without modifying a renderer or promoting a folded-in topic (Tier 3). 11 (not 12) was the honest landing.

### Scale Modes — what got built
- Cloned `scales.html` → `scale-modes.html` (file renamed mid-build per user direction; original "Modes" name → "Scale Modes" for clarity on the play page).
- Replaced the static scale-data block (MAJOR_SCALES / NATURAL_MINOR_SCALES / HARMONIC_MINOR_SCALES / MELODIC_MINOR_SCALES + raised-7th/raised-6th maps + POOLS) with a `makeMode(parent, modeKey)` generator that rotates a parent major's notes to start on the chosen scale degree.
- 7 mode rotations: Ionian (deg 1), Dorian (2), Phrygian (3), Lydian (4), Mixolydian (5), Aeolian (6), Locrian (7).
- 7 parent majors curated: C (0 acc), G (1#), F (1b), D (2#), A (3#), Bb (2b), Eb (3b).
- Tier pools: Easy = 7 white-key modes (C parent), Medium = +G/F parents (21 modes), Tricky = + D/A/Bb/Eb parents (49 modes).
- **Octave normalization (load-bearing detail):** the naive rotation pushes higher-degree modes into octave 5–6 (e.g. F# Locrian rotated off G major comes out as F#5–F#6), which would render way above the staff. `makeMode` shifts the whole scale down an octave whenever the tonic's MIDI lands above B4. After normalization every generated mode renders in the same staff range as its parent.
- Distractor logic adapted (per the makeChoices rewrite): tempting distractors are **sibling modes** (same parent major / same key sig, different tonic — the "D Dorian vs A Aeolian" confusion) and **parallel modes** (same tonic, different rotation — "D Dorian vs D Mixolydian"). Replaces scales.html's relative-major-vs-relative-minor logic which doesn't apply to modes.
- `needsExplicitAccidental` simplified to `return false` always — every diatonic mode lives inside its parent major's key sig with no raised notes (unlike harmonic/melodic minor, which is what the original branching handled).
- Sub-skill tag = mode name (`ionian`/`dorian`/...); 7 entries added to `dashboard.html` `SKILL_LABELS`.
- localStorage namespace `sm_`, module event key `'scale-modes'`.
- Sanity check rewritten for mode interval patterns. Console-verifies all 49 generated modes match their expected interval sequence, span exactly 12 semitones, and have matching first/last note letters.

### Ear: Intervals — what got built
- Cloned `intervals.html` → `ear-intervals.html`. Renderer / audio engine (`playInterval`) / question generator (`buildIntervalQuestion`) / choice generator (`buildIntervalChoices`) / game loop all byte-identical to sight Intervals.
- One behavior change: a CSS rule on `.staff-svg-wrap` hides the rendered SVG (`svg { display: none; }`) and shows a pulsing 🎧 pseudo-element in its place via `::before`. The renderer still runs and writes the SVG to the DOM; it's just invisible. Audio plays normally, the existing "▶ Hear it again" button reuses the same `playInterval` call. The audio IS the question.
- Identity-only edits otherwise: title, h1, tagline, staff-label ("What interval did you hear?"), summary-sub, miss-list h3, `iv_muted` → `ei_muted`, `iv_pb` → `ei_pb`, `intervals_settings` → `ear_intervals_settings`, module event key `'intervals'` → `'ear-intervals'`. (`iv_pb` was caught in a residual sweep — without that rename Ear: Intervals would have shared personal-best data with sight Intervals.)
- Tier-3 multi-timbre audio (the originally-feared blocker) wasn't needed at all — Tier-1 synth audio suffices for monophonic interval ear training. The Tier-3 plan remains live but is now only on the path for **Ear: Chord Quality** (§5 #20).

### Hub wiring (one batched pass)
- `play.html`: Scale Modes tile added in Reading (positioned after Scale Degrees); Ear Training `soon` placeholder converted to live Ear: Intervals tile.
- `index.html`: same two additions, plus reconciled with `play.html`'s roster by adding the previously-missing **Time Signatures** + **Scale Degrees** tiles (pre-existing landing-page drift surfaced by the user during this session — index had been showing 8 cards while play.html showed 10). Landing stat bumped 8 → 11. Final layout matches `play.html`: 5 Foundations / 4 Reading / 2 Theory.
- `dashboard.html`: `'scale-modes'` and `'ear-intervals'` added to `MODULE_META`; 7 mode-rotation entries added to `SKILL_LABELS`. ear-intervals' M3/P5/etc keys read via the raw-key fallback (matches sight Intervals' policy).
- `path.html`: both modules added to `MODULES`, `PATH`, and `SHORT_PREFIX` (`sm_`, `ei_`).
- `qn-profile.js`: recommender `PATH` extended with `scale-modes` (after scales) and `ear-intervals` (after intervals). The recommender now walks 9 live modules in the linear path order (the 2 newly added join the existing 7 — note-names, note-values, key-signatures, time-signatures, piano-quiz, scales, intervals — plus accidentals + scale-degrees which were already live but not yet in the recommender PATH; that pre-existing gap is unchanged this session).

### Working-rule moments worth keeping
- **Clone-and-swap discipline.** When the source module's renderer or audio engine can't represent the new module's shape, that is a renderer-extension session, NOT a clone-and-swap. Caught mid-Triads-attempt and reversed. New §8 rule written. Rule of thumb: before starting a clone, audit whether the source's existing renderer can already draw what the new module needs. If it can't, stop and either extend the renderer as its own session or pick a different source.
- **Tile-count drift between `index.html` and `play.html`.** Surfaced when the user counted 9 tiles on index while the new stat said 11. Root cause: index.html had been a strict subset of play.html for some time (Time Signatures + Scale Degrees missing). Now reconciled. Going forward, when a new module is added, BOTH pages get the tile — they should be kept in sync as one operation, not two.

### Deploy set
2 new files (`scale-modes.html`, `ear-intervals.html`) + 5 modifications (`play.html`, `index.html`, `dashboard.html`, `path.html`, `qn-profile.js`). Single commit `dd78214` to Dev. Vercel preview built on push.

### Still open / next (sequenced)
1. **Chord cluster session — Triads, Seventh Chords, Primary Chords (§5 #14–16).** Owned as a dedicated session. Starts with **a 3-note staff renderer extension** (likely a new `buildStaffWithChord` in `qn-staff.js` or as a forward-looking helper, with stacked-note + shared-stem geometry that handles root-position triads as the simplest case, then 7ths as a 4-note extension). Audio: `playChord(rootMidi, thirdMidi, fifthMidi[, seventhMidi])` — a block chord with light arpeggiation, modelled on `playInterval`. Once renderer + audio exist, Triads + 7ths + Primary Chords become clean pure clone-and-swaps from a future "chord base" module.
2. **Circle of Fifths (§5 #11).** Net-new interactive SVG wheel — its own focused session. Doesn't reuse any existing renderer (no live module renders a wheel), but doesn't modify one either. Polish-as-moat showcase per §5.
3. Visual QA on the Vercel Dev preview for the 2 new modules + the index reconciliation. Round-play smoke test of Scale Modes (Easy / Medium / Tricky), Ear: Intervals (Easy / Medium / Tricky, all three clef modes). Confirm the dashboard surfaces the new sub-skill labels correctly after a round.
4. (Carried from finishing session, unchanged) Time-signatures `accStartX: 72` pin and the 2 `qn-theme.css` holdouts (time-sigs prompt-layout + scales tile) — both still need a slider harness per §8.
5. (Carried) Sampled-piano audio (Tier 2); notehead rendering in `qn-staff.js` (still blocks retiring Note Names / Piano Quiz per-module note positioning). Multi-timbre audio (Tier 3) is now ONLY needed for **Ear: Chord Quality** (§5 #20) — Ear: Intervals shipped on synth audio.

### Doc updates folded in
This entry. Project doc: `Last revised` header bumped; §5 #12 Modes renamed "Scale Modes" + status → Live; §5 #19 Ear: Intervals status → Live; §12 build order updated (Ear: Intervals marked done; Scale Modes promoted out of Stretch); new §8 rule for clone-and-swap discipline. `BUILD_LOG.md` Current State snapshot: 9 → 11 modules.
