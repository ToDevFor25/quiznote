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
  `qn-music.js`, `qn-theme.css`, `qn-ui.js`, `qn-roundend.js`, `qn-xp.js`,
  `qn-home.js`, `qn-badges.js`. Flat repo at root — do NOT
  introduce folders, a bundler, or a build step. The flat static structure
  is correct and deliberate.
  - **Gamification shared files (Studio build, June 2026, on main — see BUILD_LOG):**
    `qn-xp.js` (XP/level engine, derived from `qn_events`, no schema), `qn-home.js`
    (the My Studio status masthead — self-injects its own CSS), `qn-badges.js`
    (achievements as pure predicates over the event log), `qn-roundend.js` (the
    three-beat round-end + the level-up interstitial, v1.7.0).
  - **⚠️ Planned exception (approved by Jonathan; UN-GATED August 2026): a
    migration to 11ty (Eleventy)** to de-duplicate the per-module scaffold.
    Reconciled against the real repo it's a **three-layer de-dup** — inline JS
    boilerplate (`nextQuestion` ×35, `showScreen` ×31) is the biggest layer, then
    inline CSS, then the HTML scaffold; goal is one-file changes instead of
    35-file changes, ~90K→~15–20K lines. Plan = Phase 1 shared-engine extraction
    (`qn-engine.js`) → Phase 2 finish CSS extraction → Phase 3 11ty templating.
    The **May 2026 post-launch gate was lifted (Aug 2026)** — the work may start
    now; it no longer waits on launch. **Until the migration actually ships,
    every rule above remains in force** — keep building flat-static / no-build;
    the migration replaces that incrementally, on a branch off Dev, with
    per-module verification. Executable plan: `specs/eleventy-migration-spec.md`.
- **35 live modules — Phases 1–4 + Phase 5 Tier A score-literacy cluster +
  Phase 5 Tier B #6–#8 (Circle of Fifths, Chord Function, Transposition)
  shipped (May 2026).** 14 Foundations + 10 Reading + 11 Theory. The 27 → 32
  expansion was a deliberate Tier 3 scope decision approved in the May 2026
  curriculum gap analysis (BUILD_LOG.md) and executed in the Phase 5 Tier A
  cluster: Tempo Markings, Dynamics, Articulation, Score Navigation,
  Ornaments. Then Tier B shipped: Circle of Fifths (Reading, #6) 32 → 33,
  Chord Function (Theory, #7) 33 → 34, Transposition (Reading, #8) 34 → 35.
  Circle of Fifths carries its own in-module wheel renderer; Chord Function
  reuses qn-staff.js buildStaffWithChord; Transposition carries an in-module
  single/sequence note renderer (no shared-file change in any). See
  QUIZNOTE_PROJECT_DOC.md §5 for the per-module map and §12 for the build
  history. Further growth beyond 35 is still a deliberate scope decision per §5.
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
- **"Buttons dead but nav links work" = an init-time JS throw.** If a screen's
  `<a href>` links (home / All Modules) navigate but every `<button>` does
  nothing, JS threw during init and aborted handler wiring — it is NOT an
  audio/CSS problem. Run the **DOM-mock init trace** (see BUILD_LOG May 2026,
  `/tmp/trace-any.js`: shims document/window/QN/NH, runs inline scripts +
  fires DOMContentLoaded, reports the exact throw + line) before guessing.
  These throws come from **bulk-edit brace corruption** (a prior batch edit
  shifted a `}` by a line in ~30 modules) — invisible to parsers and to
  grep-by-name; only executing init or diffing rendered behavior catches them.
  Note the trace verifies *no init throw* only — it won't catch logic bugs
  (it missed a `syncMuteUI` pill-orphan that broke only visual feedback).

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
qn-theme.css, qn-profile.js, qn-audio.js, qn-ui.js, qn-music.js, qn-nav.js),
stop and flag as **Tier 3** before proceeding. Shared file changes are their
own session — they must be proposed, approved, and committed separately from
the new module build.

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
3. `studio.html` — MODULES object, PATH array, SHORT_PREFIX map (these moved from
   `path.html` in the June 2026 Studio build; `path.html` is now just a redirect
   to `studio.html`)
4. `qn-profile.js` — recommender PATH array

Pre-existing drift (modules in play.html but not the path/Studio surface, or vice
versa) was repaired in May 2026. The fix is treating the four-surface update as a
single atomic step. Drift is a bug.

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

- **⚠️ Studio gamification overhaul: SHIPPED TO MAIN (production) — June 2026.**
  Big architectural change — read the BUILD_LOG "Studio build" + "Studio shipped to
  production" entries before touching path/progress/nav/gamification. Summary of
  what changed vs. older text elsewhere in this file:
    - **Path page + dashboard merged into one home: `studio.html` ("My Studio").**
      `path.html` is now a redirect to `studio.html`. **`dashboard.html` was
      DELETED** — its content (Focus areas, Accuracy trend, Share/PDF) migrated
      into Studio; the module-mastery grid was dropped as duplicative of Studio's
      journey bars. So "My Progress" / dashboard.html **no longer exists** — much
      of this doc still references them; treat `studio.html` as the home.
    - **Nav is now 2 destinations** (My Studio · All Modules), not 3 — the
      progress/dashboard DEST was removed from `qn-nav.js`.
    - **New shared files:** `qn-xp.js`, `qn-home.js`, `qn-badges.js` (+ `qn-roundend.js`
      v1.7.0). New page `rewards.html` ("How progress works") — the success-path
      reference, pulls level/badge defs LIVE from the engines; linked from footers,
      not the nav.
    - **Return users auto-land on My Studio** (`index.html` has a BLOCKING head
      redirect reading `qn_activeProfile` — no marketing-page flash; index stays
      reachable via `?stay` + the brand logo). Once-a-day app splash on arrival.
    - **Share button currently HIDDEN** on Studio (`.share-sec[hidden]`) pending a
      share/PDF refinement phase — all code intact; resurface = remove the attribute.
    - Shipped Dev→main June 2026 (clean fast-forwards). `feature/studio` retired.
      Doc reconciliation done: this file + QUIZNOTE_PROJECT_DOC.md §4/§6 updated to
      describe the Studio world. (Some incidental older "dashboard"/"path.html"
      word-mentions may remain in prose but are covered by these summaries.)
- **CSS extraction: COMPLETE.** All 6 clusters extracted. qn-theme.css covers
  all shared selectors for the original 9 modules.
- **QN.ui.confirm rollout: COMPLETE.** All 9 modules use shared confirm dialog;
  showConfirm retired.
- **schemaVersion hook: installed.** qn-profile.js v1.8.0 has the migration
  hook. This gates backend work.
- **Curriculum build phases 1–4: ALL COMPLETE (May 2026).** 27-module
  roster shipped. **Phase 5 Tier A (score-literacy cluster) shipped May
  2026** — Tempo Markings, Dynamics, Articulation, Score Navigation,
  Ornaments. Roster 27 → 32. Phase 5 Tier B+ (Circle of Fifths, Chord
  Function, Transposition, plus non-module multipliers) still queued —
  see "Ranked build queue" below and the remaining specs in `/specs/`.
    - **Phase 1** — Foundations gaps: Ledger Lines, Dotted Notes & Ties,
      Ear: Rhythm, Piano & Keyboard.
    - **Phase 2** — Chromatic Scale + the six expansions (Scales pentatonic
      + selector, Key Signatures + minor + selector, Primary Chords +
      minor + selector, Scale Degrees + minor + selector, Roman Numerals +
      minor + selector, Ear: Scales pentatonic + selector). Intervals
      clef selector verified.
    - **Phase 3** — Chord renderer engineering session: `qn-staff.js`
      v1.3.0 added `buildChord()` + `buildStaffWithChord()`; `qn-audio.js`
      v1.1.0 added `playChord()`.
    - **Phase 4** — Theory chord cluster: Triads, Triad Inversions,
      Seventh Chords, Chord Progressions, Cadences, Ear: Chord Quality,
      Ear: Cadences, Ear: Chord Progressions. All 8 wired into the four
      surfaces (play.html / path.html MODULES+PATH / qn-profile.js PATH /
      index.html spine).
- **Data-claim audit + beta-access gate: shipped (May 2026).** Client-side
  beta-unlock script (`qn-gate.js`) added to every module; data-storage
  copy softened across surfaces ahead of the cloud-sync layer.
- **`qn-cloud.js` scaffolding: shipped (May 2026).** Cloud/sync/account/
  payment + adult-owner/child-profile schema, structural two-condition
  consent gate. All flags off; UI not yet built.
- **Privacy policy + terms of service: drafted (May 2026, in repo as
  privacy.html / terms.html — for lawyer review).**
- **play.html redesigned (May 2026):** three collapsible level sections
  (Foundations / Reading / Theory) with progress chips. FOUC-prevention via
  `body.tier-no-anim` + 2×rAF (documented in BUILD_LOG.md). **Mobile-first
  pass (May 2026, supersedes the earlier all-expanded default):** Foundations
  open, Reading + Theory **collapsed** by default (~60% less initial scroll);
  `100dvh`; paled category art tints; tightened mobile cards; and a **sticky
  tier tab bar** (mobile-only <720px, Foundations · Reading · Theory) that
  accordions to the tapped tier + scroll-spies the active one. **Responsive
  split (Jonathan's call, May 2026):** on **mobile (<720px)** all three tiers
  default **collapsed** (all toggles `aria-expanded="false"`) + the tab picker
  is shown — tap a tier to open it. On **desktop (≥720px)** the accordion is
  **off**: every tier is always expanded (the original scannable layout), the
  caret is hidden, header clicks are no-ops, and the tab bar is hidden. Done
  with a media-query that re-opens `.tier-body` at ≥720px (same selector/
  specificity as the collapse rule, placed later in source so it wins without
  `!important`) + a `matchMedia('(min-width:720px)')` guard in the toggle JS
  (skips the saved-collapse restore and the click handler on desktop, keeps
  `aria-expanded` honest). **Mobile open-state is NOT persisted** — the accordion
  is transient navigation via the tab picker, so the page always starts all-
  collapsed every visit (the old `localStorage` key `qn_play_sections_open_v2`
  was removed; a stale saved-open state had been reopening Foundations on load).
  Scroll-restoration is forced
  to `manual` so every (re)load lands at the top heading (the accordion changes
  page height between visits, which otherwise stranded a reload mid-section).
  **First-run picker hint (May 2026):** on mobile load, each tab does a
  fill-with-tier-color + soft feathered glow, cascaded L→R, played 2× (CSS
  `ttHintF/R/T` keyframes, JS staggers 620ms). Shown until the user taps a
  tab/header (`qn_play_hint_done`) OR after 3 loads (`qn_play_hint_seen`),
  whichever first, then suppressed forever; any tap cancels it live. Mobile-only
  + `prefers-reduced-motion` safe. Mockup: `_mockups/play-tab-hint.html`.
  **Section-header pop-in (May 2026):** the three tier headers (`.tier-toggle`)
  spring in on load, cascaded Foundations→Reading→Theory (`@keyframes secPop`,
  inline in play.html — it doesn't link qn-theme.css; CSS-only, reduced-motion
  safe). Both widths. The
  "have-to-tap-twice" scroll bug is solved by waiting for the 360ms
  `grid-template-rows` `transitionend` (400ms fallback) before measuring, with
  a `lockUntil` freeze on the scroll-spy.
- **index.html "What's Inside" replaced (May 2026):** vertical-spine concept
  view, not module tiles. Decoupled from per-module tiering. Class names
  prefixed `wi-` to avoid collisions. Landing copy scrub May 2026 removed
  all "no ads" / "free during beta" claims ahead of Stripe; ear-training
  chips split Reading "Pitch by ear" / Theory "Harmony by ear".
- **path.html mobile reorder (May 2026):** on mobile, the "Your next
  step" card sits on top, with the "Next up on your path" tiles, guide
  banner, and the path rail stacking below. Desktop layout unchanged.
  Path rail no longer renders 🔒 glyphs — upcoming modules show as
  muted dots (the rail is a map, not a menu).
- **Tier reconciliation: DONE (May 2026).** Intervals moved Theory→Reading;
  Ear: Intervals and Ear: Scales moved Theory→Reading per the
  "ear modules sit with their visual partner" pedagogy. Theory now
  contains only harmony modules + the chord ear training.
- **Teaching hints layer: SHIPPED (May 2026).** In-game teaching system
  across all 32 modules. On wrong answer, a contextual hint card (pop-up
  modal on all screen sizes) explains WHY, then the student retries.
  2-try retry mechanic now universal (was 24 of 32). Hint content authored
  for all 32 modules, keyed by question type. Toggle cascade: profile
  default (set in onboarding) → per-module start-screen toggle → in-game
  "Don't show hints" dismiss. Spec at `specs/teaching-hints-spec.md`.
  **Hint engine is context-aware:** `getHint()` calls an optional
  per-module `hintKeyFor()` returning the current question's category,
  gathers across all keys, and cycles when exhausted. 10 modules wired
  context-aware (dotted-notes, dynamics, tempo-markings, articulation,
  ornaments, score-navigation, scale-degrees, time-signatures, scales,
  note-names); the rest stay general. `attempts` resets per question in
  `nextQuestion`, `shownHints` resets per round — both were the bugs that
  made hints "rarely appear" (fixed May 2026).
- **Guided key-find (Piano Quiz flagship): SHIPPED (May 2026).** When the
  user must locate and press a specific key (2nd wrong → reveal, or after
  a Hint), `piano-quiz.html` (and `pianoquiz-demo.html`) guide them:
  banner "Find and play the highlighted key", persistent key glow, and a
  directional teal edge halo (`.key-halo` left/right) pointing toward the
  off-screen target key (recomputed on scroll, fades when in view). Middle
  C indicator suppressed while guiding. `piano-keyboard.html` NOT included
  — it uses letter-button answers, no press-to-reveal flow. Controller:
  `keyGuide` + `showKeyGuide`/`hideKeyGuide`/`updateKeyHalo`.
- **Settings card redesign: SHIPPED (May 2026).** Start screen timer
  toggle + muted checkbox replaced with a grouped settings card (3 rows:
  Timer, Teaching hints, Sound) using pill-state indicators. All 32
  modules. Shared CSS in `qn-theme.css` (`.settings-card`, `.setting-row`,
  `.pill-state`). Mockup at `_mockups/start-screen-settings.html`.
- **Start-screen sticky CTA bar: SHIPPED (May 2026).** The `Start Game` button
  pins to the bottom in a `.start-bar` (honest fade-scrim + animated "More ▾"
  cue, twin of the summary bar); the config scrolls in an inner `.start-scroll`
  container. **All 35 real modules** (pianoquiz-demo excluded — no shared deps).
  Shared CSS in `qn-theme.css` (`.start-scroll`, `.start-bar`, `.scroll-cue`,
  `#start-screen.scroll-end`, reuses `cueBob`); the `#start-screen` base rule
  stays inline per-module (flex column / padding:0 / **NO forced height** — it
  fills via `.screen { flex:1 }` below the in-flow `.site-header`). **Scroll
  model = WINDOW scroll + sticky bar (twin of the summary screen), NOT inner
  scroll** — this is the version that actually works on iOS Safari after several
  wrong turns: (a) forcing `#start-screen{height:100dvh/svh}` ignored the ~64px
  header and pushed the bar below the fold; (b) an inner `.start-scroll`
  overflow container fought Safari's `min-height` flex chain (bar occluded, then
  un-pinned). Final: `.start-scroll` is a plain content wrapper; `.start-bar` is
  `position:sticky; bottom:0` + `margin-top:auto` (pins to bottom when the config
  is short, sticks to the viewport bottom when it overflows and the window
  scrolls); `body{min-height:100svh}` (was `100vh`; `vh` is the toolbar-RETRACTED
  height on iOS). qn-roundend.js scrim/cue uses **window scroll** (mirrors the
  summary `updateScrim`). **JS is fully
  shared — `qn-roundend.js` v1.6.0** adds `initStartScroll()`/`updateStartScrim()`
  (window-scroll, same model as the summary scrim) with a **DOMContentLoaded
  self-init + MutationObserver** auto-reset on `#start-screen` re-activation →
  **zero per-module JS** (no `showScreen` hook needed). Also drives: the
  **pop-in entrance** (`playPopIn()` toggles `.pop-in` on `.start-wrap` on
  load + each reactivation; cascaded `startPopIn` keyframe); the page
  **rubber-band bounce** (`html,body{overscroll-behavior:contain}`); and the
  **tap bounce** (delegated `pointerdown` on `#start-screen` adds `.tap-bounce`
  / `tapBounce` keyframe to `.tile` + `#start-btn` — fired on PRESS so it shows
  before the Start tap navigates; full overshoot visible on tiles). All in
  qn-theme.css, all reduced-motion safe.
  Rolled out via a guarded byte-for-byte replacement script (anchors must be
  exactly-once or the file is skipped, never corrupted). Spec +
  reference build supplied by Jonathan (`startscreenstickybar.md`).
- **Onboarding interactive toggles: SHIPPED (May 2026).** Level selection
  shows difficulty + hints pills when selected. "Just starting" = Easy +
  hints on, "I know some" = Medium + hints on, "I've been playing a
  while" = Tricky + hints off. Overridable before continuing. Stored as
  `defaultDifficulty` and `hintsEnabled` on profile (additive, no
  migration).
- **Profile-wide defaults: SHIPPED (May 2026).** All 32 modules read
  `defaultDifficulty` and `hintsEnabled` from the active profile at
  startup. Per-module override wins over profile default.
- **Progress dashboard redesign: SHIPPED (May 2026).** Full rewrite of
  dashboard.html. Hero stats (streak, time, mastered), interactive
  streak visualization (3 switchable styles: calendar / rings /
  flames), weak spots from recommender, accuracy trend (weekly), full
  mastery grid with progressive Bronze/Silver/Gold rings, collapsible
  tier sections, "Your next step" + "Up next on your path" cards.
  All animations + 3-note load chime. Zero schema changes — pure UI
  on existing `qn_events` data.
- **Practice goal (user-configurable): SHIPPED (May 2026).** Weekly
  practice target (3/5/7 days), set during onboarding and adjustable
  from dashboard inline. All streak visualizations are goal-aware
  (4/5 = full ring, not 4/7 = partial). Stored as `practiceGoal` on
  profile (additive). Default 5.
- **Streak visualization styles: SHIPPED (May 2026).** Three views,
  student-switchable: Calendar (binary heat + stat cards + week
  dots), Rings (Apple Watch concentric SVG), Flames (stacked tier
  bars). Style stored as `streakStyle` on profile.
- **Share to social + PDF: SHIPPED (May 2026).** Share button on
  dashboard with dropdown: "Save as PDF" (one-page print stylesheet,
  Option B layout) and "Share to social" (swipeable picker with 3
  canvas-rendered cards, exports via navigator.share). The
  shareable export is branded "Practice Notes by QuizNote."
- **Next priorities (no longer curriculum builds — see BUILD_LOG.md for
  detail):**
    - **Visual QA on real devices** for the teaching hints + settings card
      + onboarding changes (structural verification passed; pixel QA owed).
    - **PWA install on the landing page** (own session). Manifest.json,
      Apple touch icons + meta tags across every module HTML,
      `beforeinstallprompt` button on landing for Android, Share →
      "Add to Home Screen" instructions for iOS. Architecture is already
      PWA-friendly (user verified via bookmark install).
    - **Adult/child profile UI** — schema scaffolding exists in
      `qn-cloud.js`; the visible flow doesn't. Lawyer-gated before any
      cloud sync of child data.
    - **Monetization track** — Apple/Google sign-in → Stripe + paywall →
      server-authoritative entitlement → parent-consent gate.
    - **Landing pillars section** — Pillar 1 title still duplicates section
      title ("Built for learners"); rewrite proposed but not yet applied.
- **Clef-picker tile centralization: shipped (May 2026).** New shared
  file `qn-ui.js` exports `QN.ui.clefTile({clef})` (canonical SVG) +
  `QN.ui.mountClefTiles(scope?)` (auto-mount on DOMContentLoaded). All 14
  clef-picker modules now carry no inline `tile-clef` SVG — they keep the
  `[data-clef]` button wrapper and `qn-ui.js` injects the canonical tile.
  To change clef appearance globally: edit the `SINGLE` / `BOTH` config
  blocks in `qn-ui.js`. Calibration done via `_clef-calibrator.html`
  (untracked internal tool, prefix-`_` convention). **Pattern for future
  visual-consistency work:** clone `_clef-calibrator.html`'s shape —
  §1 shows the current variants in the wild, §2 has a live editor with
  sliders + preset buttons that match each shipping variant, §3 outputs
  a copy-paste JS snippet with the chosen values.
- **Still-open visual calibration items:** time-signatures accStartX:72 pin
  (QA first), time-signatures prompt-layout conversion + scales tile
  reconciliation (needs visual harness per §8). The clef-tile calibrator
  pattern (see above) is the proven template for these.
- See BUILD_LOG.md for complete "Still open / next" list.

---

## Ranked build queue (May 2026 — Phase 5 and beyond)

This is the **prioritized work queue** for chipping away in future sessions.
Highest-ROI first. Each item links to its spec in `/specs/`. The next session
should pull from the top of this list unless Jonathan directs otherwise.

ROI methodology: perceived-value gain ÷ build cost. Score-literacy cluster
(#1–#5) is highest because it closes a real pedagogical gap teachers will
notice immediately AND is the cheapest possible build (clone-and-swap from
Accidentals, no shared-file changes). Reading expansions (#6–#8) carry real
practical value at moderate cost. Non-module multipliers (#9–#10) deliver
large perceived-value gains without new content. Remaining items are lower
ROI or audience-boundary cases — build only if conditions warrant.

### Tier A — score-literacy cluster (Foundations · Level 2). **SHIPPED May 2026.**

All five modules cloned and wired through the four-surface rule in a single
atomic commit. Module count 27 → 32. See BUILD_LOG.md "Phase 5 score-literacy
cluster shipped" for the full session log.

1. ~~Tempo Markings~~ — shipped. `meaning` / `ordering` / `metronome` /
   `change` question types. `playMetronome()` audio helper added inline.
2. ~~Dynamics~~ — shipped. Bravura PUA glyphs compose ppp through fff,
   sfz, fp. Hairpins as inline SVG.
3. ~~Articulation~~ — shipped. Tie-vs-slur discrimination via same/different
   pitch on two adjacent noteheads.
4. ~~Score Navigation~~ — shipped, v1 only. `routing` question type still
   deferred to v1.1.
5. ~~Ornaments~~ — shipped. Visual ID only; period-specific realization
   out of scope for v1 per spec.

### Tier B — Reading expansion. Build after the Tier A cluster ships.

6. ~~Circle of Fifths~~ — **shipped May 2026** (`circle-of-fifths.html`).
   Cloned from tempo-markings; in-module wheel renderer + 5-type engine
   (position/count/neighbor/relative/enharmonic). Four surfaces wired,
   flagship play-tile (real 12-key wheel + glowing `?` seat). Re-opened
   the May 2026 §5 cut. Did not touch `qn-staff.js`.
7. ~~Chord Function (Tonic/Predominant/Dominant)~~ — **shipped May 2026**
   (`chord-function.html`). Cloned from Roman Numerals; categorize (3 tiles:
   T/PD/D) / identify / motion / exception (why V is major in minor) engine.
   Renders the actual triad on the staff via `buildStaffWithChord` (reuse, no
   shared-file change). Four surfaces wired.
8. ~~Transposition~~ — **shipped May 2026** (`transposition.html`). Cloned
   from Intervals; interval / instrument (B♭/F/E♭ → concert) / direction /
   melodic engine with pitch-spelling math. v1 answers are **note-name tiles**
   (Jonathan's call — staff-rendered answer tiles deferred to v1.1); question
   shows the note(s) on a staff via an in-module single/sequence renderer.
   No audio in v1. Four surfaces wired.

### Tier C — non-module multipliers. Independent of all above.

9. **Mock Exam Mode** — `/specs/mock-exam-mode-spec.md`. Feature, not a
   module. Feels like 5+ new modules to a user; isn't. Phase A (architecture
   audit of all 27 modules' QNM contract) is the gate.
10. **Curriculum Mapping Overlay** — `/specs/curriculum-mapping-spec.md`.
    Feature, not a module. **⚠️ TIER 3 / LAWYER-GATED for the named-method
    version.** Generic-language v1 can ship immediately; named-method
    overlay (ABRSM/RCM/AP/Bastien/Faber) requires legal review per the
    May 2026 trademark conversation logged in BUILD_LOG.md.

### Tier D — defensible but lower ROI. Build only if conditions warrant.

11. **C Clefs (Alto & Tenor)** — `/specs/c-clefs-spec.md`. Niche audience
    (viola, cello/bassoon/trombone upper register). Lowest-cost intermediate
    add. **Requires a `qn-staff.js` renderer extension session before the
    module build can start** — flag as Tier 3.
12. **Construction-mode engineering session** — `/specs/construction-mode-engineering-spec.md`.
    Architectural prereq for any Build-a-X cluster. Roughly Phase 3 sized.
    Schedule when depth-of-pedagogy becomes the priority over breadth.
13. **Build-a-Scale / Build-a-Triad / Build-a-Key-Sig cluster** — depends
    on #12. Becomes a cheap clone-and-swap cluster once construction mode
    exists. No individual specs yet — write them after #12 ships.
14. **Non-Chord Tones** — `/specs/non-chord-tones-spec.md`. **Borderline.**
    Sits at the upper edge of the §2 audience cap. Build only with
    demonstrated user demand or curriculum-mapping partner pull.

### Notes for the next session

- **Tier A cluster (#1–#5) shipped May 2026** — see entry above. Patterns
  proven: clone-and-swap is repeatable for the score-literacy genre; each
  module's renderer + question engine is ~150 lines of unique code on a
  ~1900-line shared scaffold.
- **#7 Chord Function reuses an existing renderer** (`buildStaffWithChord`).
  Autonomous build.
- **#6 Circle of Fifths and #8 Transposition are autonomous** but each
  involves one piece of new visual machinery (circular renderer; instrument
  labels). Both kept in the module file, no shared-file changes.
- **#11 C Clefs and #12 Construction-mode are TIER 3 SESSIONS** — they
  modify shared files. Pause and confirm before starting.
- **#10 Curriculum Mapping named-method version is TIER 3** — lawyer review
  required before any ABRSM/AP/Bastien/Faber names ship.
- The four-surface rule applies to every new module (#1–#8, #11, #13, #14).
  Each gets `index.html` + `play.html` + `path.html` + `qn-profile.js`
  updated atomically in the same commit. Module count goes 27 → 28 → 29 → ...
- The roster scope expansion 27 → 37 was a Tier 3 decision approved by
  Jonathan in the May 2026 curriculum-gap session. Justification: real
  score-literacy gap, not audience expansion. Documented in BUILD_LOG.md
  under "Curriculum gap analysis + Phase 5 spec drafting session."

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
