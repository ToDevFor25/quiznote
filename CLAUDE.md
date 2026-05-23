# QuizNote — Claude Code working guide

This is QuizNote, a browser-based music-theory practice app (quiznote.online).
Read this file first, then the two living docs below, before doing any work.
They are the source of truth and the only continuity between sessions.

---

## The three files — what each one is

**`CLAUDE.md` (this file)** — the constitution. Read automatically at session
start. Working rules, architectural constraints, decision authority, things that
never change without Jonathan's say-so. Changes rarely — only when a new working
rule is learned. "How I work."

**`QUIZNOTE_PROJECT_DOC.md`** — the product brain. Everything true about
QuizNote as a product and codebase: architecture, module roster, design system,
monetization plan, music-theory accuracy rules. "What QuizNote is."

**`BUILD_LOG.md`** — the session memory. What happened, why decisions were made,
bug root-causes, what's been tried, and the sequenced "Still open / next" list.
The primary way a fresh session knows where to pick up. "What we've done and
what's next."

All three together = a session that starts already knowing everything. If
anything conflicts across files, flag it — don't silently pick one.

---

## Read these first, every session

1. **`QUIZNOTE_PROJECT_DOC.md`** — product vision, architecture, module roster,
   cross-cutting systems, music-theory accuracy rules, and working style (§8).
2. **`BUILD_LOG.md`** — session history, decisions, the "Still open / next" list.

After reading, confirm the current state back in 3-4 bullets before touching
anything. This is the handshake — it catches stale docs before they cause damage.

---

## What this project is (constraints that never change)

- **No build step. No framework. No package.json.** Every module is a single
  self-contained HTML file with inline CSS + JS. Shared code lives in sibling
  files: `qn-profile.js`, `qn-audio.js`, `qn-staff.js`, `qn-nav.js`,
  `qn-music.js`, `qn-theme.css`. Flat repo at root — do NOT introduce folders,
  a bundler, or a build step. The flat static structure is correct and deliberate.
- **18 live modules (Phase 1 complete, May 2026):** note-names, piano-quiz,
  note-values, time-signatures, accidentals, key-signatures, scales, scale-degrees,
  scale-modes, intervals, ear-intervals, ear-scales, primary-chords, roman-numerals,
  **ledger-lines, dotted-notes, ear-rhythm, piano-keyboard** (the last four are
  Phase 1 builds). Roster target is **27 modules** across 3 levels — see
  QUIZNOTE_PROJECT_DOC.md §5 for the complete map with build status, selectors,
  and tier details. Note: §5 is stale and still describes the older 24-module
  framing — reconcile in the queued tier-reconciliation session.
- **Deploy:** push to GitHub **`Dev` branch** → Vercel auto-builds the Dev
  preview. Merge Dev → main for production. **Always commit and push to Dev.
  Never create a new branch. Never push to anything other than Dev.** If
  you're ever about to push to a non-Dev branch, stop and ask first.
- **`scales` is the perennial structural outlier.** Predates several shared
  patterns, diverges in nearly every cross-file change. Audit it separately;
  never assume it matches the others.

---

## Audience

QuizNote is a music theory fluency app for **beginner through intermediate
students of all ages**. All modules must be appropriate for someone with no
prior theory knowledge beyond what earlier modules in the path have taught.
Do not build modules targeting advanced theory (post-tonal, set theory,
advanced counterpoint, jazz harmony beyond basic chord functions). When a
proposed module feels like college-level theory rather than a school-level
music class, flag it as Tier 3.

---

## How I want you to work

### Decision authority (project doc §8)
- **Tier 1** — mechanical/technical/aesthetic-within-pattern: decide and build,
  tell me what you did. No checkpoint needed.
- **Tier 2** — judgment calls, not stakes: state your pick with one line of
  reasoning and proceed. Format: "Going with X because Y — flag if wrong."
- **Tier 3** — legal, monetization, brand, scope changes, user-promises,
  creating a new module type, building a separate file for something a selector
  would handle: STOP and ask. Never decide these unilaterally.
- If I say a call was miscategorized, move it up a tier permanently.

### Planning and checkpoints
- **Plan before multi-file changes.** For any change touching more than 1-2
  files, outline the plan and wait for "go" before executing. Show scope,
  method, what you'll flag if you find divergence.
- **Don't change working code without flagging it.** If a fix touches something
  currently working, say so explicitly before editing. "If it ain't broke" is
  a real position here.
- **One change → verify → commit → next.** Don't stack large unverified changes.
  Bank wins as you go.
- **Pause for my go on git commits and pushes.** Auto-accept file edits on
  mechanical multi-file refactors. Always pause and show me the commit message
  before committing or pushing — those I want to review.

### Verification rules
- **Verify by RENDERED result, not source.** A grep that finds the same class
  name in every module can read as "consistent" while the modules diverge via
  a second override rule or media-query variant. The source can lie. Diff full
  rule bodies + overrides, or look at actual pixels.
- **Structural verify before declaring done:** CSS brace balance, parse on
  script blocks, all CSS variables resolve, JS class references intact.
- **`@media` overrides stay inline.** When stripping shared selectors, always
  split top-level vs `@media` segments and preserve `@media` verbatim.

---

## The selector pattern (MANDATORY)

Modules with multiple related subtypes use a **selector on the start screen**
rather than spawning separate modules. Examples:
- Note Names: treble/bass/both selector ✓ (already implemented)
- Piano Quiz: treble/bass/both selector ✓ (already implemented)
- Scales: major/natural minor/harmonic/melodic/pentatonic selector (target)
- Key Signatures: major/minor/both selector (target)
- Time Signatures: simple/compound selector (target — though compound already
  in tiers, a selector would enable focused practice)

When building a new module or expanding an existing one, check §5 of
QUIZNOTE_PROJECT_DOC.md for the target selector options. Implement selectors
using the same tile/pill pattern as the existing difficulty selector.

**NEVER build a separate module file for a subtype when a selector would serve.**
This is a Tier 3 decision requiring explicit approval from Jonathan.

---

## The spec-first rule

Every new module build and every significant expansion of an existing module
requires a **spec file in /specs/** before any code is written.

**Format:** use /specs/accidentals-spec.md as the canonical format. It includes:
slug, namespace, file name, title, tagline, tier in roster, what it teaches,
selector options, tier breakdown (Easy/Medium/Tricky), question types, distractor
strategy, music theory accuracy notes, concept explainer card content (3 cards),
standard features inherited.

**Steps:**
1. Draft the spec
2. Present to Jonathan for review (skip if operating in autonomous mode —
   see "Module builds are autonomous" below)
3. Wait for explicit approval ("go") — same caveat
4. Then build

This rule exists because of the May 2026 Triads incident — building started
before the renderer constraint was identified, wasting time and nearly
overwriting working files. A spec review catches these problems before code
is written.

---

## Module builds are autonomous

When building new modules via clone-and-swap, do **NOT** ask questions or pause
for approval on any Tier 1 or Tier 2 decisions. Make the call, note what you
decided in the commit message, and keep building.

**The only exceptions are genuine Tier 3 blockers:**
1. Renderer can't handle the content (e.g., 3-note triad on a 2-note interval
   renderer — flag as a renderer-extension session).
2. Shared file change required (qn-staff.js, qn-audio.js, qn-profile.js, etc.).
3. Music theory accuracy question with no clear answer.

If it's not one of those three, decide and build. Pool sizes, distractor
strategies, tier descriptions, choice label formatting, tile colors, namespace
prefixes, file names, audio tempo defaults — all Tier 1/2. Commit and push to
Dev without pausing.

This rule was added mid-session May 2026 after Jonathan explicitly directed
"build all 3 modules without me" for Phase 1. It supersedes the spec-first
"present and wait" step when operating autonomously.

---

## Module builds are ALWAYS additive

Clone-and-swap means **copy to a new file**. The source file is read-only once
cloned. Never edit an existing working module as part of building a new one.

If a new module requires changes to existing shared files (qn-staff.js,
qn-theme.css, qn-profile.js, qn-audio.js), stop and flag as **Tier 3** before
proceeding. Shared file changes are their own session — they must be proposed,
approved, and committed separately from the new module build.

The **founding example:** May 2026 Triads attempt off intervals.html — the
2-note renderer was asked to draw a 3-note triad. The right response is to stop,
flag it as a renderer-extension session, and not start the module build until
the renderer is ready. This is now the canonical example of the "stop and flag"
behavior.

---

## The four-surface rule

When adding a new module, ALL FOUR surfaces must be updated in the **same
atomic commit**:
1. `index.html` — landing-page tile + module-count stat
2. `play.html` — Practice library tile
3. `path.html` — MODULES object, PATH array, SHORT_PREFIX map
4. `qn-profile.js` — recommender PATH array

Pre-existing drift (modules in play.html but not path.html, or vice versa) was
repaired in May 2026. The fix is treating the four-surface update as a single
atomic step. Drift is a bug.

---

## The file-verification rule

QUIZNOTE_PROJECT_DOC.md and this file describe **target state**, not necessarily
current state at any given moment. Before acting on any spec or curriculum
description:
1. Read the actual module file
2. Compare against the spec
3. Report discrepancies before building
4. The file is the ground truth; the spec is the target

Never assume a module matches its spec without reading the file first. This is
especially important after the May 2026 curriculum review, which was written
with direct file access but files may drift over subsequent sessions.

---

## The chord renderer gate

qn-staff.js v1.2.0 renders: staff lines, clef, key signature, single notes,
intervals (two notes). It does NOT render chords (3+ stacked notes).

8 Level 3 modules require a 3-note staff renderer. These modules cannot be
built until qn-staff.js is extended with chord rendering AND qn-audio.js gets
a playChord helper (model on playInterval). This is its own dedicated
engineering session. Do not attempt to build chord modules before this session.

---

## CSS extraction method (the proven pattern)

The active refactor — moving shared selectors from inline-in-modules to
`qn-theme.css`. Status as of May 2026: **COMPLETE** for the original 9 modules.
All 6 planned clusters extracted. New modules should link qn-theme.css and
inherit shared styles automatically.

For any future CSS work:
1. Audit per-module identity programmatically — byte-identical / partial /
   divergent. Never trust grep name-matching alone.
2. Capture exact rule text by COPYING BYTES from the reference module.
   Never retype CSS by hand — it introduces errors.
3. Byte-verify each appended rule vs source.
4. Strip from modules, preserving `@media` overrides verbatim inline.
5. Verify: braces balanced, parses, tokens resolve, JS intact.
6. Commit + push (pause for go on the git step).

**Divergent rules stay inline.** scales.html has its own toast model
(different feedback structure) — never flatten real differences for tidiness.

---

## Current in-progress state (read carefully)

- **CSS extraction: COMPLETE.** All 6 clusters extracted. qn-theme.css covers
  all shared selectors for the original 9 modules.
- **QN.ui.confirm rollout: COMPLETE.** All 9 modules use shared confirm dialog;
  showConfirm retired.
- **schemaVersion hook: installed.** qn-profile.js v1.8.0 has the migration
  hook. This gates backend work.
- **Phase 1 of the curriculum redesign: COMPLETE (May 2026).** Ledger Lines,
  Dotted Notes & Ties, Ear: Rhythm, Piano & Keyboard all shipped. **18 live
  modules** total. 27-module roster target.
- **play.html redesigned (May 2026):** three collapsible level sections
  (Foundations / Reading / Theory) with progress chips. FOUC-prevention via
  `body.tier-no-anim` + 2×rAF (documented in BUILD_LOG.md). All-expanded by
  default per the catalog-UI genre standard.
- **index.html "What's Inside" replaced (May 2026):** vertical-spine concept
  view, not module tiles. Decoupled from per-module tiering. Class names
  prefixed `wi-` to avoid collisions.
- **Tier reconciliation: DONE (May 2026).** Intervals moved Theory→Reading
  on play.html (matching path.html which already had it correct). Ear:
  Intervals and Ear: Scales both moved Theory→Reading per the "ear modules
  sit with their visual partner" pedagogy (Option B). Theory now contains
  only harmony modules (Primary Chords, Roman Numerals) and the future chord
  cluster. All four surfaces (play.html, path.html MODULES + PATH,
  qn-profile.js PATH, index.html spine taglines) consistent.
- **Next priority: Phase 2 (Level 2 gaps).** Scales pentatonic + selector, Key
  Signatures minor + selector, Chromatic Scale, the four minor-keys
  expansions (Primary Chords, Scale Degrees, Roman Numerals, Ear:Scales),
  Intervals clef selector verify.
- **Chord renderer session:** queued as Phase 3. Do not attempt chord modules
  before qn-staff.js extension.
- **Still-open visual calibration items:** time-signatures accStartX:72 pin
  (QA first), time-signatures prompt-layout conversion + scales tile
  reconciliation (needs visual harness per §8).
- **Stale doc flagged:** QUIZNOTE_PROJECT_DOC.md §5 still describes the older
  24-module roster — needs reconciliation alongside the tier session.
- See BUILD_LOG.md for complete "Still open / next" list.

---

## Music-theory accuracy

Correctness is non-negotiable — see project doc §9. Enharmonic spelling, key
signatures, interval naming, scale-degree names must be theoretically correct.
When unsure, flag it; don't guess.

Key accuracy notes from the curriculum review:
- Perfect intervals (4th, 5th, octave) do NOT have major/minor quality.
  Never present "major 5th" as a valid answer.
- In minor keys, the V chord is MAJOR (not minor) — raised leading tone
  from harmonic minor. Present V (major) in minor context always.
- Harmonic minor raises the 7th, creating an augmented 2nd between ♭6 and ♮7.
- Melodic minor raises 6th and 7th ascending; reverts to natural minor descending.
- Natural minor 7th = subtonic; harmonic minor 7th = leading tone. Different terms.
- Modes: Ionian = major scale, Aeolian = natural minor scale. Use these
  connections explicitly in module explainer cards.

---

## Session hygiene (do these every session)

### Auto-start (every session)
Before saying anything else, read CLAUDE.md, QUIZNOTE_PROJECT_DOC.md, and
BUILD_LOG.md, then summarize current state in 3-4 bullets so Jonathan can
confirm the right picture before any work begins.

### Context management
- **Watch the token counter.** When a session gets long (context filling up),
  run `/compact` proactively before continuing. Better to compact between tasks
  than to hit the limit mid-refactor.
- **Suggest `/compact` proactively** when: a task is complete and a new one is
  starting, the session has been running long, or the context feels heavy.

### Closing a session
At the end of every working session — before closing — do all of the following:

1. **Write a build log entry to BUILD_LOG.md.** Cover: what we did, decisions
   made and why, bugs fixed with root causes, and the updated "Still open / next"
   list. Write the draft, present for approval, then write to the file.

2. **Flag any `CLAUDE.md` updates needed.** If something in this file turned
   out to be wrong, incomplete, or missing, propose the specific change.

3. **Flag any project doc updates needed.** If the product state changed (new
   module, new convention, new architectural decision), flag what needs updating
   in QUIZNOTE_PROJECT_DOC.md.

4. **Confirm git is clean.** Verify all changes are committed and pushed to Dev.
   If anything is staged but not committed, or committed but not pushed,
   surface it explicitly so nothing is stranded locally.

The docs are the only continuity between sessions. Anything not written down
didn't happen. A 5-minute doc update at session end saves 20 minutes of
re-derivation at the next session start.

---

## What the three files are NOT

- `CLAUDE.md` is not a changelog — git tracks what changed line by line.
- `BUILD_LOG.md` is not a git log — it tracks *why* decisions were made and
  *what's next*, not every commit.
- `QUIZNOTE_PROJECT_DOC.md` is not a spec document — it's a living description
  of what actually exists, not what's planned. §5 is the module roster with
  build status; treat it as the authoritative curriculum map.

Update them when the gap between what they say and what's true would cause a
problem in a fresh session. That's the test.
