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

**Live modules (9):** Note Names, Piano Quiz, Note Values, Time Signatures, Key Signatures,
Scale Degrees, Scales, Intervals, Accidentals.

**Shared files:**
- `qn-profile.js` **v1.7.0** — identity, events, recommender, account/household + 7-day trial
  schema (`startTrial` built-but-not-armed; `trialStatus()` advisory-only; `CURRENT_COHORT='beta'`
  is the go-live lever), plus `QN.ui` shared widgets (`chip`, and `confirm` — the shared quit/confirm
  modal component). API ladder: 1.0 base → 1.1 hold-and-backfill → 1.2 skills tallies →
  1.3 recommender → 1.4 resetDevice → 1.4.1 guest-prompt fix → 1.5.0 corruption-aware reads +
  `QN.diagnostics` → 1.6.0 account/household → 1.7.0 QN.ui.confirm.
- `qn-audio.js` — shared audio engine (`NH.audio`); three module patterns (pure / additions / overrides).
- `qn-staff.js` **v1.2.0** — staff engraving (`NH.staff`): clef (`buildClef`), staff lines, key sigs,
  time-sig **vector-path** digits (not font glyphs), play-staff accidental glyphs (`buildNoteAccidental`).
  Bravura SMuFL for noteheads/accidentals in the migrated staff modules.
- `qn-nav.js` — unified nav component (`QNNav`); pill-shrink/readable-floor/avatar-fallback truncation.
  **Canonical filename is hyphenated** (`qn-nav.js`), matching every other shared file.
- `qn-music.js` **v1.0.0** — superset pitch helpers (`NH.music`: parsePitch/toMidi/diatonicStep/
  displayName/midiEquals, handles `##`/`bb`). **Option A rollout:** NEW modules use it; the 8 existing
  modules keep inline copies until edited for another reason.
- `qn-theme.css` **v1.0.0 (~497 lines)** — the shared CSS file. Design tokens + question prompt +
  answer tiles, plus four extracted clusters: summary, start screen, play-screen chassis, and modal. Also
  now holds the shared feedback-toast (Option-2 placement) — but only scale-degrees is wired to it so far
  (other 8 keep inline toast, pending rollout). All 9 modules link it. Inline CSS per module down ~41%
  (note-names 765→450). **2 clusters of the ~6 remain** inline: buttons/`.btn` (~81 lines), cards (~72).

**Known deferred infra (documented so it isn't forgotten):**
- **No `schemaVersion` stamp** on stored data yet. `QN.version` versions the *code*, not the *data*.
  Additive changes are safe; the first **non-additive** change needs a `schemaVersion` field +
  migrate-on-read step added FIRST. Retrofitting versioning after unversioned data is in the wild is
  the painful path — pull this forward before any breaking data change (esp. before backend sync).
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
critical term verified present across active+archive. **Note:** the project's `BUILD_LOG.md` is still the
ORIGINAL until the cleaned version is deployed back — replace it with this file.

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
1. **Roll out the shared toast** to the other 8 modules (strip their inline `.toast`+variants so they
   inherit the qn-theme.css Option-2 version; QA each — card heights differ). scales keeps its own
   `.toast.correct`(40)/`.toast.wrong` model. The shared rules are proven on scale-degrees.
2. Extract remaining CSS clusters (same method): buttons (~81, `.btn/.ghost` — still inline in all 9),
   cards (~72, `.card/.screen/.brand/.site-*`). ~150 lines total. (Summary + start-screen + play-chassis
   + modal DONE — 4 of ~6 clusters.)
3. Roll `QN.ui.confirm` to the other 7 modules + retire note-names' `showConfirm` (two architectures:
   hardcoded-only like key-sigs/scales, and showConfirm-engine modules; scales is the outlier). Pairs
   with the (now-done) modal CSS cluster.
4. Consider making time-signatures pin `accStartX: 72` if the +18px key-sig shift crowds its numerals
   (one-line use of the new `buildStaff` override) — QA first to see if it even needs it.
5. time-signatures prompt-layout conversion + scales tile reconciliation (the 2 qn-theme.css holdouts).
6. `schemaVersion` migration hook — pull forward before backend work (highest-leverage deferred infra).
7. Deploy the cleaned BUILD_LOG.md + BUILD_LOG_ARCHIVE.md back to the repo.
