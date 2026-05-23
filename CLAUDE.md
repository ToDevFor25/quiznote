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
- **11 live modules:** note-names, piano-quiz, note-values, time-signatures,
  key-signatures, scale-degrees, scales, scale-modes, intervals, ear-intervals,
  accidentals. Roster target is 24 (see project doc §5).
- **Deploy:** push to GitHub **`Dev` branch** → Vercel auto-builds the Dev
  preview. Merge Dev → main for production. Always work on Dev. Never commit
  straight to main.
- **`scales` is the perennial structural outlier.** Predates several shared
  patterns, diverges in nearly every cross-file change. Audit it separately;
  never assume it matches the others.

---

## How I want you to work

### Decision authority (project doc §8)
- **Tier 1** — mechanical/technical/aesthetic-within-pattern: decide and build,
  tell me what you did. No checkpoint needed.
- **Tier 2** — judgment calls, not stakes: state your pick with one line of
  reasoning and proceed. Format: "Going with X because Y — flag if wrong."
- **Tier 3** — legal, monetization, brand, scope changes, user-promises: STOP
  and ask. Never decide these unilaterally.
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
  mechanical multi-file refactors (CSS extraction, toast rollout, stripping
  identical rules). Always pause and show me the commit message before
  committing or pushing — those I want to review.

### Verification rules
- **Verify by RENDERED result, not source.** (Project doc §8.) A grep that finds
  the same class name in every module can read as "consistent" while the modules
  diverge via a second override rule or media-query variant. The source can lie.
  Diff full rule bodies + overrides, or look at actual pixels.
- **Structural verify before declaring done:** CSS brace balance, parse on script
  blocks, all CSS variables resolve, JS class references intact. The FX vars
  `--bx/--by/--br/--dx/--dy/--dr` are JS-set per-particle, never in `:root`.
- **`@media` overrides stay inline.** When stripping shared selectors, always
  split top-level vs `@media` segments and preserve `@media` verbatim.

---

## CSS extraction method (the proven pattern)

The active refactor — moving shared selectors from inline-in-9-modules to
`qn-theme.css`. Follow this exactly:

1. Audit per-module identity programmatically — byte-identical / partial /
   divergent. Never trust grep name-matching alone.
2. Capture exact rule text by COPYING BYTES from note-names (reference module).
   Never retype CSS by hand — it introduces errors.
3. Append to `qn-theme.css` with a labeled section comment.
4. Byte-verify each appended rule vs source. Watch the `@media` false-positive:
   the parser may match a media override instead of the base rule.
5. Strip from all 9, preserving `@media` overrides verbatim inline.
6. Verify: braces balanced, parses, tokens resolve, JS intact.
7. Commit + push (pause for go on the git step).

**Divergent rules stay inline.** When scales (or any module) genuinely differs,
leave it — don't flatten a real design difference for tidiness. When divergence
is a *subset* (scales missing an animation/rule), lift the superset and flag the
visible change.

**Load-order rule:** an inline rule at equal specificity + later source order
overrides the shared file. An in-progress rollout can keep some modules inline
(they override) while others inherit the shared rule.

---

## Current in-progress state (read this carefully)

- **Infrastructure phase: complete.** Shared CSS, shared JS layer, dashboard,
  recommender, account/household, schemaVersion migration hook — all shipped.
  The work now is **building out the 24-module roster** in path order.
- **Last shipped (May 2026 roster-expansion session):** Scale Modes (§5 #12,
  Reading) and Ear: Intervals (§5 #19, Theory). Both via clone-and-swap —
  Scale Modes off scales.html (pure data swap to a mode-rotation generator),
  Ear: Intervals off intervals.html (one CSS rule hides the staff and shows
  a 🎧 placeholder; audio + question logic byte-identical to sight Intervals).
  9 → 11 live.
- **Clone-and-swap discipline (locked rule, project doc §8).** Clone-and-swap
  is a pure-data swap. If the source module's renderer or audio engine can't
  represent the new module's shape, that's a *renderer-extension session*,
  NOT a clone-and-swap. Audit the source's renderer before starting; if it
  can't draw what the new module needs, stop and either extend the renderer
  as its own session or pick a different source. The May 2026 Triads attempt
  off intervals.html — 2-note renderer asked to draw a 3-note triad — is the
  founding example.
- **Next session (queued): chord cluster.** Triads / Seventh Chords / Primary
  Chords (§5 #14–16). Starts with a **3-note staff renderer extension** (and
  a `playChord` audio helper modelled on `playInterval`), then the three
  modules become clean clone-and-swaps off whichever lands as the chord base.
- **Index ↔ play tile parity.** When adding a new module, both `index.html`
  and `play.html` get the tile in the same operation. Pre-existing drift
  (index missing Time Signatures + Scale Degrees) was repaired this session;
  going forward this should be a single-step add.
- See BUILD_LOG for the full "Still open / next" list.

---

## Music-theory accuracy

Correctness is non-negotiable — see project doc §9. Enharmonic spelling, key
signatures, interval naming, scale-degree names must be theoretically correct.
When unsure, flag it; don't guess.

---

## Session hygiene (do these every session)

### Context management
- **Watch the token counter.** When a session gets long (context filling up),
  run `/compact` to compress the conversation history before continuing. This
  keeps the context window from overflowing mid-task and losing important state.
  Better to compact proactively than to hit the limit mid-refactor.
- **Suggest `/compact` proactively** when: a task is complete and a new one is
  starting, the session has been running long, or you notice the context getting
  heavy. Don't wait to be asked.

### Closing a session
At the end of every working session — before I close — do all of the following:

1. **Offer a build log entry.** Write a draft covering: what we did, any
   decisions made and why, bugs fixed with root causes, and the updated
   "Still open / next" list. Let me review and approve before updating the file.

2. **Flag any `CLAUDE.md` updates needed.** If something in this file turned out
   to be wrong, incomplete, or missing based on what we learned, propose the
   specific addition or change.

3. **Flag any project doc updates needed.** If the product state changed (new
   feature, new convention, new architectural decision), flag what needs updating
   in `QUIZNOTE_PROJECT_DOC.md`.

4. **Confirm git is clean.** Verify all changes are committed and pushed to Dev.
   If anything is staged but not committed, or committed but not pushed, surface
   it explicitly so nothing is stranded locally.

The docs are the only continuity between sessions. Anything not written down
didn't happen. A 5-minute doc update at session end saves 20 minutes of
re-derivation at the next session start.

---

## What the three files are NOT

- `CLAUDE.md` is not a changelog — git tracks what changed line by line.
- `BUILD_LOG.md` is not a git log — it tracks *why* decisions were made and
  *what's next*, not every commit.
- `QUIZNOTE_PROJECT_DOC.md` is not a spec document — it's a living description
  of what actually exists, not what's planned.

Update them when the gap between what they say and what's true would cause a
problem in a fresh session. That's the test.
