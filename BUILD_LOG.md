---

### Start-screen sticky CTA bar — rollout across 35 modules — May 2026

Brought the start/settings screen in line with the summary screen: the
`Start Game` button now pins to the bottom in a `.start-bar`, with the honest
fade-scrim + animated "More ▾" cue, while the config (clef/tier/length/settings)
scrolls in an inner `.start-scroll` container. Source: Jonathan-supplied spec
(`startscreenstickybar.md`) + reference build. **Shipped to all 35 real modules
in one pass + 2 shared files.**

**Spec-vs-reality reconciliation (did this BEFORE touching anything).** The spec
was written against a wrong mental model; corrected on three counts:
1. Spec said "replace `#start-screen` in qn-theme.css" — but `#start-screen` is
   **inline in all 36 modules** (byte-identical), not shared. So that rule was
   edited per-module; only the NEW `.start-*` classes went to the shared file.
2. Spec said mirror `updateSummaryScrim()` per module — **no such function
   exists**; the summary scrim lives in shared **`qn-roundend.js`**
   (`initScroll`/`updateScrim`, auto-wired by `render()`).
3. Therefore the start scrim was built **shared too**, not per-module.

**Architecture (the key call — chosen over the spec's per-module JS).** Extended
`qn-roundend.js` → **v1.3.0** with `initStartScroll()` + `updateStartScrim()`
(inner-container scroll model, vs the summary's window-scroll model) and a
**DOMContentLoaded self-init** + a **MutationObserver** that re-resets/re-measures
whenever `#start-screen` re-activates. Net result: **ZERO per-module JS** — no
`showScreen` surgery, which also sidesteps the 4 modules that lack `showScreen`
(scales, scale-modes, ear-scales, chromatic-scale). No-ops cleanly where
`.start-scroll` is absent.

**Per-module change = two uniform string replacements** (HTML wrapper + inline
`#start-screen` rule). All 35 were **byte-identical** on every anchor (section
line, `.start-cta`→`</section>` tail, the `#start-screen` rule), so this was
scripted, not hand-edited 35×. The script (`/tmp/convert_start.py`) **extracts
the canonical OLD blocks byte-for-byte from a reference module** (no retyping),
and **refuses to write any file whose anchors aren't exactly-once** + a
div/section balance delta guard — so a non-uniform file is skipped, never
corrupted. (This is the explicit antidote to the prior bulk-edit brace-corruption
incident.)

**Verification:** pilot on note-names first (reverted after, to keep the
reference canonical — caught a self-reference bug where the converted pilot
poisoned the OLD-block extraction; the skip-guard flagged it as `cssx0` instead
of mis-replacing). Then all 35: every file passed structure-present-exactly-once
+ div/section/script balance + no-canonical-remnant + no risky structural
selectors (`#start-screen >`, direct scrollTop reads) + start-btn still
id-resolvable + both shared files loaded. Shared CSS brace-balanced (259/259);
qn-roundend.js `node -c` clean + mock-DOM smoke (scroll-end math verified).

**Shared CSS** went into `qn-theme.css` near the start cluster: `.start-scroll`,
`.start-bar` (+ `::before` scrim), `.start-bar .scroll-cue` (reuses the shared
`cueBob` keyframe), `#start-screen.scroll-end` toggles, reduced-motion guard, and
an `@media (max-width:560px)` density block (tightens the shared `.tile`/
`.q-block`/`.settings-card` so each step fits ~one screen).

**Excluded: `pianoquiz-demo.html`** — loads neither shared file (standalone demo)
and has a non-uniform start-cta (extra "Start muted" toggle). Left as-is.

**Post-ship bugfix → qn-roundend.js v1.3.1 (snap-to-top on scroll).** Device QA
hit a snap-to-top: scrolling toward the bottom settings yanked back up, so you
couldn't reach Sound/Teaching. Root cause = a feedback loop in the
MutationObserver: `updateStartScrim()` toggles the `scroll-end` **class** on
`#start-screen`, and the observer (watching `class`) fired on that, calling
`resetStartScroll()` → `scrollTop=0` mid-scroll. Fix: track prior `active` state
and only reset on a real **inactive→active transition**, ignoring `scroll-end`
toggles. Verified by mock-DOM: 0 resets on scrim-class mutations, exactly 1 on a
genuine reactivation. One shared-file change; all 35 benefit.

**Owed:** device/pixel QA (Jonathan running it) — the inner-scroll feel on iOS,
the scrim/cue honesty at the scroll bottom, and the bar's safe-area padding on
notched phones.

---

### play.html mobile-first pass — collapsed tiers + sticky tier tab bar — May 2026

Dropped in a drop-in `play.html` (Jonathan-supplied FINAL + CHANGELOG, folded
externally). **Single-file change**; no four-surface concern (catalog page, not
a module). Live file now 1700 lines, Dev at the commit below.

**Pre-flight (file-verification rule, before the swap):** diffed the upload vs
live `play.html`. Confirmed it = current + ONLY the 7 documented changes —
module-link set byte-identical (md5 match, 38 links: 35 modules + index/privacy/
terms), `qn-gate/qn-profile/qn-nav` script tags preserved, footer legal links
preserved. Structural: scripts 5/5, braces 223/223, parens 263/263, the three
`sec-*` IDs present once each. Only after that passed did I copy it in.

**The 7 changes:**
1. `100vh → 100dvh` on body — kills the phantom scroll past the footer when
   mobile browser chrome shows.
2. Added missing `--grape-lt: #e7e2fb` to `:root` — Theory's "0/x completed"
   chip had no background without it.
3. Paled the category art tints (ear/read/rhythm/pitch/harmony) so saturated
   art (e.g. Circle of Fifths wheel) stops melting into its panel.
4. Mobile card tightening (`@media max-width:560px`): art panel 116→92px, body
   padding + blurb (0.78rem/1.35) — big vertical-scroll cut on phones.
5. **Reading + Theory collapsed by default** (`aria-expanded="false"`);
   Foundations stays open. ~60% less initial scroll. **This reverses the
   earlier "all-expanded by default per catalog-UI genre standard" decision**
   — deliberate, Jonathan-directed; CLAUDE.md updated to match.
6. **Sticky tier tab bar** (mobile-only, hidden ≥720px): Foundations · Reading
   · Theory, per-tier colored, active tab fills with the light-tier scheme.
   Tap → accordion (open that tier, collapse the other two) + smooth-scroll +
   scroll-spy.
7. Section anchors `id="sec-foundations|sec-reading|sec-theory"` as scroll
   targets.

**Follow-ups (same day, after Jonathan tested on device):**

- **Scroll-restore strand fixed.** Ending a session scrolled down at Theory then
  refreshing left you mid-Foundations: the accordion changes page height between
  visits (and the mobile tab bar reopens tiers without persisting), so the
  browser's restored scroll Y was stale against the reverted layout. Fix:
  `history.scrollRestoration = 'manual'` → every (re)load pins to the top
  heading. Catalog pages landing at their top is standard/expected anyway.

- **Open-state default → responsive split (Jonathan's product call).** Question
  raised: is force-opening Foundations right? Beginner-friendly, but returning/
  intermediate users scroll past it every visit. No single industry standard —
  open-first is the onboarding pattern, collapse-all-with-picker is the
  repeat-user pattern. Resolved by width: **mobile (<720px)** = all collapsed +
  tab picker (nothing privileged, compact); **desktop (≥720px)** = all expanded
  (original scannable layout, plenty of room, picker hidden). Implementation:
  (1) all three toggles now default `aria-expanded="false"` (mobile all-closed);
  (2) `@media (min-width:720px)` re-opens every `.tier-body` — same selector +
  specificity as the collapse rule but later in source, so it wins on desktop
  with no `!important` — plus hides the caret + `cursor:default`; (3) a
  `matchMedia('(min-width:720px)')` guard in the toggle JS skips the
  saved-collapse restore + makes header clicks no-ops on desktop, and sets
  `aria-expanded="true"` there so SRs match the always-open visual. Mobile
  per-tier persistence (`qn_play_sections_open_v2`) unchanged. **Known minor
  edge (documented, accepted):** resizing across 720px mid-session without
  reload leaves `aria-expanded` stale (CSS keeps the visual correct; click guard
  is live via matchMedia) — non-breaking, no resize listener added. Also
  corrected a stale CLAUDE.md note that claimed desktop stayed all-open under
  the first version of this change — it didn't until this split landed.

- **Scroll-spy now highlights only OPEN tiers.** On mobile load (all collapsed)
  the tab bar lit Foundations even though nothing was open — a highlight with no
  open tier read as confusing (Jonathan flagged). Fixed: `onScroll()` filters to
  expanded sections and `setActive(null)` clears all when none are open. So load
  = no tab highlighted; tapping a tab/header opens a tier and lights its tab.
  Also wired header-toggle clicks to refresh the highlight after the 360ms body
  transition (opening via the caret, not just the tab bar, updates the tab).

- **First-run "tap me" hint on the picker (shipped).** To signal the tier tabs
  are tappable, on mobile load each tab fills with its tier color AND breathes a
  soft feathered glow (large blur + low alpha, no hard ring — Jonathan's
  feedback: the first hard `spread` ring was too stark), cascaded L→R. Combined
  Fill + glow ("the mix") chosen from a 3-option mockup (`_mockups/play-tab-hint.html`:
  wave glow / press bounce / fill flash, then the combined). Behavior (Jonathan
  took the recommendation): plays **2×** per load; shown until the user taps a
  tab/header (`localStorage qn_play_hint_done`) **or** after **3 loads**
  (`qn_play_hint_seen`), whichever first, then suppressed permanently; any tap
  cancels it live. Mobile-only (matchMedia ≥720 guard, so desktop visits don't
  burn a view) + `prefers-reduced-motion` → no animation. Impl: CSS keyframes
  `ttHintF/R/T` (2.1s ease-in-out, iteration-count 2) targeted by
  `[data-target=…].tt-hint`; JS in the tab-bar IIFE staggers the class add by
  620ms and removes on `animationend`. **Rationale for the count/cap:** one pass
  is missable on load, 2 reliably registers; capping (vs looping until tap)
  avoids a naggy/distracting forever-pulse; suppressing after engage-or-3-loads
  keeps it from annoying daily returning users. The localStorage flag is
  purpose-specific and unrelated to the section-state persistence we removed.

- **Dropped mobile open-state persistence (always start collapsed).** After the
  responsive split, Foundations kept reopening on mobile load — the
  `qn_play_sections_open_v2` localStorage layer was restoring a previously-opened
  state, fighting the new collapse-all-+-picker intent. Removed persistence
  entirely: desktop is force-open anyway (ignored it), and on mobile the
  accordion is transient navigation, not a saved preference, so the HTML default
  (all `aria-expanded="false"`) now stands every visit. Net simplification —
  the STORAGE_KEY read/write and the saved-restore branch are gone.

- **Mobile vertical rhythm tightened.** `.page-header` margin-bottom 36→20px and
  `.tier-section` margin-bottom 48→**10px** inside the `≤560px` block (+ trimmed
  `main` padding 28/48 → 24/40). The collapsed tiers were floating in whitespace;
  10px between tiers reads as a tight clean list. Desktop untouched. (Watch the
  expanded-tier case: 10px now sits between an open tier's last tile and the next
  header — fine so far; if it reads cramped when expanded, move the gap below the
  open body via an `aria-expanded="true"` rule rather than raising the base.)

- **Breakpoint / tablets:** the split is a single 720px CSS-px cutoff. Tablets
  are ≥720 in both orientations (iPad portrait 768, iPad Pro 834, any landscape
  1024+), so **tablets get the desktop all-expanded view**, no tab picker. Only
  sub-720 widths (phones; the smallest 7" tablets in portrait, ~600) get the
  collapse + picker. No tablet-specific branch — intentional.

**Earlier same-day bugfix:** returning users landed with Reading's pane
open despite the new collapsed default, while the tab bar correctly showed
Foundations active — a mismatch. Root cause: a pre-existing localStorage layer
(`qn_play_sections_open`) persists which tiers you've opened and **overrides the
HTML `aria-expanded` default on reload**; the CHANGELOG author flipped the markup
default but didn't account for it, so stale all-expanded state (`reading:true`)
reopened Reading. Fix = bump the key to `qn_play_sections_open_v2` (standard
"bump the cache key when the default changes" pattern): old state discarded once,
everyone restarts from the new collapsed default, subsequent toggles persist
forward. (Note left in code: the mobile tab-bar accordion sets `aria-expanded`
directly and intentionally does NOT write to the persistence key — tab nav is
transient, not a saved preference.)

**The notable engineering detail (banked):** the "have-to-tap-twice" scroll
bug. Tier bodies expand/collapse over a 360ms `grid-template-rows` transition;
if you measure the target's position immediately you get a mid-animation layout
and land at a stale (often bottom-of-page) spot. Fix: listen for the real
`transitionend` on the opening `.tier-body` (400ms `setTimeout` fallback for
already-open / reduced-motion), THEN measure + smooth-scroll, clamped
`Math.max(0, y)`. A `lockUntil` timestamp freezes the scroll-spy during the
programmatic scroll so the highlight can't land on the wrong tier. Desktop
unchanged (tab bar `display:none` ≥720px).

**Open follow-up (optional, from the CHANGELOG note):** the Circle-of-Fifths
wheel still has teal-green sharp wedges on the (now paler) green pitch panel —
the paling fixes most of it; deepen the sharp-side wedge outlines in that SVG
if we want it perfectly crisp. Low priority. Otherwise: device/pixel QA of this
on real phones (tab-bar accordion timing, collapsed-default feel, dvh footer).

---

### Round-end visual polish — desktop bar, section spacing, mobile footer — May 2026

Post-redesign polish pass, all via shared files (the payoff of the centralized
CSS layer — each was ONE edit hitting all 35, no per-module loop). Pushed to the
feature branch and Dev each step; Dev currently at `441f3f7`.

1. **Desktop action-bar width (`qn-theme.css` `.summary-bar`).** The sticky bar's
   buttons stretched the full viewport on desktop (looked goofy at 2000px) while
   correct on mobile. Capped the bar to `max-width: calc(640px + 32px)` +
   `margin-inline:auto` so the buttons line up with the 640px content/cards
   above. No-op on phones (<672px → width:100% wins). Bar bg = page cream, so no
   floating-panel edge.

2. **Unified summary section rhythm + PB-flag breathing room (`qn-theme.css`).**
   Root cause of the "every gap looks different" feel: the stack mixed
   `margin-top` AND `margin-bottom` at 6/16/0/18/22/14, which margin-collapse
   made unpredictable (`.summary-wrap` is block flow, not flex). Normalized every
   top-level section (hero, xp-earn, mastery, miss-list, demote) to
   `margin-top:18` with NO bottom margin; xp-earn/mastery keep `auto` L/R to stay
   centered. Title→sub stays 6 (intentional heading pairing). Also bumped
   `.pb-flag` margin-top 12→16 so "New best score & streak!" isn't cramped.
   (`.save-scores-prompt` margin is inline per-module + guest-only/hidden for
   signed-in users — left as-is; not worth the 35× edit for an edge case.)

3. **Hide game-screen footer on mobile (`qn-theme.css`, app-store-aware).**
   The Privacy/Terms/copyright footer ate space below the action buttons on
   mobile games. Hidden via `@media (max-width:760px) { .site-footer { display:
   none } }`. **Key scoping fact:** `.site-footer` is used ONLY by the 36 game
   pages; the catalog pages (index/play/path/dashboard) use a plain `<footer>`
   and are untouched. Legal links remain on desktop games, all catalog pages, and
   the landing page → satisfies Apple/Google policy (privacy must be REACHABLE,
   not on every screen). **Decision (Jonathan):** don't clutter the 3-item nav
   menu with 2 legal links now; when a "More/Settings" menu destination exists
   later, Privacy/Terms move there and the game footer can retire entirely.
   Documented in the CSS comment + that commit.

**Industry-standard notes banked (for the future legal-surface work):**
- Marketing/entry pages (landing) → full footer w/ Privacy/Terms (SEO + app
  reviewers look there). In-app screens → legal one tap away in a menu/Settings,
  not a footer per screen (Duolingo/Elevate/Yousician pattern).
- App stores require a *reachable* privacy link, not an omnipresent one.

**Model/effort note:** Jonathan asked which model for this work. Answer logged:
Opus 4.8 (#1, NOT the 1M-context variant — working set is small), and **Medium
effort is plenty for polish** (one-file CSS edits); reserve High/Max for the hard
sessions (the markup-centralization below, the mastery-axis recommender).

**Still open / next:** unchanged — device/pixel QA of the redesign+polish on real
screens (desktop bar cap, even spacing, mobile footer gone), then Dev → main to
ship (Dev is 60+ commits ahead of main at `4904478`; all gamification work is
staged on Dev, not yet in production). Tier-3 mastery-axis recommender still
queued. Branch deletion: hold until Dev→main ships + QA passes.

---

### FUTURE CLEANUP OPTION — centralize summary markup into qn-roundend.js (Tier 3) — May 2026

**Why this is here:** the round-end redesign (entries below) was painful far out
of proportion to a "visual tweak" because of how the three layers are split:

| Layer | Location | Change cost today |
|---|---|---|
| Visual styling (CSS) | `qn-theme.css` (shared, 0 inline copies) | ✅ edit once → all 35 |
| Behavior/logic | `qn-roundend.js` `render()` (shared) | ✅ edit once → all 35 |
| **Markup** (the `#summary-screen` HTML skeleton) | **inline in all 35 modules** | ❌ **35 edits, ~5 drifted variants** |

So styling + behavior changes ARE fast now (one file each). The pain was a
**structural markup** change (add hero div, remove grid, reorder blocks) — the
one layer still duplicated 35×, and the copies had drifted (indentation,
`&middot;` vs `·`, `state.total` vs `state.settings.total`, scales'
querySelectorAll, piano-quiz's guarded pb). That made a "simple" change into 35
individually-verified edits. **It was a one-time tax** (won't recur unless the
next change again alters the HTML skeleton) — but it WILL recur for any future
structural redesign.

**The cleanup option (NOT scheduled — Jonathan's call, flagged Tier 3):**
Render the summary markup from JS instead of hardcoding it per file —
`qn-roundend.js` injects the whole `#summary-screen` innards into an empty
`<div id="summary-mount">` in each module. Then the skeleton lives in ONE place
too, and the next structural redesign is one edit, not 35.

**Trade-offs to weigh before doing it (why it's Tier 3, not automatic):**
- Conflicts with the founding "self-contained static HTML, no build step"
  principle (CLAUDE.md) — markup shifts from static to JS-generated.
- First-paint/FOUC: the summary is hidden until round-end anyway, so risk is
  low, but the mount must exist before `render()` runs.
- Migration risk: a one-time pass to strip the inline block from 35 files and
  prove the injected version renders identically (incl. the outliers — scales,
  piano-quiz, the score-literacy modules with module-specific sub-text/labels
  like miss-list headings "Notes/Scales/Cadences to practice next time", which
  would need to become parameters).
- Net: a real engineering session up front to make every future round-end visual
  change an afternoon instead of two days.

**Decision: deferred.** Logged as an option so the next person feels the same
pain and knows the escape hatch exists. Revisit if/when another structural
round-end change is on the table.

---

### Round-end redesign GENUINELY complete — 35/35 verified-from-files — May 2026

**This entry supersedes the one below it, which falsely claimed "35/35 COMPLETE"
while a garbled terminal was reporting stale "ALL_PASS" output.** What was
actually true at that point: only 31/35 had hero+no-grid, **28 of those had the
hero MISPOSITIONED** (rendering below xp/mastery instead of on top), 4 modules
weren't transformed at all, and that broken state had been **pushed to Dev**
(`a8c840d`). Logging the failure honestly so the pattern isn't repeated.

**Root cause of the false completion:** mid-session the terminal stdout (and
some tool Reads) began **duplicating and truncating lines** — so commit
confirmations and verification prints were read as success when the underlying
scripts had matched 0 anchors and written nothing. I committed + pushed on that.

**The fix this session (full autonomy granted by Jonathan to finish + use
judgement + check in the morning):**
- **Re-established ground truth from FILES, not stdout.** Every step = a
  fail-loud Python script that self-verifies (hero-before-xp, single sum-stars,
  div balance, `node --check` parse, label/threshold/cache assertions) and
  **writes only if all pass**, dumping a report to `/tmp/*.txt` read via the Read
  tool. File I/O stayed reliable throughout; only terminal rendering was broken.
- **Hero-position fix (28 modules):** the gen-1/gen-2 batches replaced the grid
  *in place*, but the grid sits BELOW xp/mastery — so stars landed beneath them.
  The real correct position needed BOTH the `summary-speed` line and the hero
  moved to right after `summary-sub`. Target order (note-names):
  `sub → speed → HERO → xp(Beat1) → mastery(Beat2) → miss-list`. Fixed all 28;
  verified hero-line < xp-line on each.
- **Final 4 transforms:** chromatic-scale/ear-scales/scale-modes turned out to
  be exact scales-clones (same querySelectorAll('.stat-value .of') hazard,
  starCount, newScoreBest pb, `.85/.65` verdict tier — but render uses
  `state.total`, which they define, unlike scales). piano-quiz = guarded-pb
  variant, guided key-find (`key-halo`) preserved.
- **Residual cleanup:** removed a dead `pb-streak` preload line in the 5
  `.8/.6`-gen modules (dotted-notes, ear-rhythm, key-signatures, note-values,
  time-signatures) that the verifier caught.

**FINAL VERIFICATION (from files): 35/35 FULLY CLEAN** — every module: hero
before xp, no summary-grid, single `#sum-stars`, `.pb-flag` present, no
stat-card in summary section, divs balanced, all inline JS parses, canonical
`1/.8/.5` verdict thresholds, no `Practising`/`Game Settings`/`Choose something
else`, no dead `sum-streak`/`pb-streak` cache refs. Commit `198d5bd`.

**Lesson reinforced (CLAUDE.md candidate):** when the terminal is unreliable,
NEVER trust an inline "PASS" print — route every check through a written file
and Read it; and ALWAYS verify element ORDER, not just presence/balance (the
hero-position bug passed every structural check while being visually wrong).

**Process note on the false push:** the broken `a8c840d` reached Dev. After this
commit, Dev should be re-synced (fast-forward) so it reflects the genuinely-clean
35/35. Doing that next.

**Still open / next:**
1. **Re-sync Dev** to the corrected HEAD (`198d5bd` + this log) — fast-forward.
2. **Device/visual QA** (Jonathan, in the morning) — all 35 redesigned round-ends
   on real screens, esp. the threshold-normalized + scales-family (heaviest
   edits) and piano-quiz (guided key-find intact). Structural verification is
   complete; pixel QA is owed.
3. **Tier-3 mastery-axis recommender** (length/clef/mode progression) — still
   queued, unchanged.

---

### Round-end redesign ROLLOUT COMPLETE — 35/35 + hero-position fix — May 2026

**⚠️ SUPERSEDED — this entry was written off garbled-terminal output and was
INACCURATE (the rollout was NOT complete; see the corrected entry above).**
Original (incorrect) text retained below for the record.
hero/track round-end. Verified clean across the whole roster (state probe below):
DONE 35/35, hero correctly positioned (before xp-earn) everywhere, no
stat-card-in-summary, all divs balanced, all inline JS parses, no Practising /
no .85.65 or .8.6 verdict thresholds / no "Game Settings" left.

**Two things finished here:**
1. **Hero-position fix (28 modules).** The earlier batches replaced the grid
   *in place*, but the grid sits BELOW the xp/mastery cards — so stars rendered
   under them instead of as the headline. Wrote a move-hero pass: relocate the
   hero block to right after the `summary-speed` line (before Beat 1) in all 28.
   Caught by a position audit (`hero-line < xp-earn-line`); the earlier
   structural checks passed while visual ORDER was wrong. **Lesson: verify
   element order, not just presence/balance.** Commit covers all 28.
2. **The final 5 (the hard outliers), each hand/script-verified:**
   - **scales** (structural outlier): hero after `summary-sub` (no speed-line);
     removed the hazardous `document.querySelectorAll('#summary-screen
     .stat-value .of')` line (it targeted the deleted grid's `.of` spans;
     hero's `#sum-score-of` is set by render()); dead `starCount`/`starStr`
     removed; verdict tier `.85/.65`→`1/.8/.5` (left encouragingLine's `.85/.65`
     FLAVOR buckets intact); pb→flag via `newScoreBest`/`newStreakBest`,
     `best.score`, `state.settings.total`; **render() quirk preserved**
     (`total: state.settings.total` — scales has no `state.total`).
   - **chromatic-scale, ear-scales, scale-modes**: turned out to be scales-clones
     (same `starCount`/querySelectorAll/`newScoreBest` shape); same treatment.
   - **piano-quiz**: guarded-pb variant (`const pbRow = els['pb-row']; if(pbRow)`
     with `sLabel`/`kLabel` + `newScorePB`/`newStreakPB`) → flag inside the same
     guard; std threshold (no normalize); **guided key-find (key-halo) untouched.**

**Process notes:** the terminal/Read DISPLAY started duplicating+truncating lines
mid-session (environment degrading). Mitigated by working through exact-string,
fail-loud transform scripts + writing all verification to /tmp files and reading
those (file I/O stayed correct; only stdout rendering was garbled). This is the
reliable pattern when the terminal is flaky: never edit from a possibly-garbled
read — match exact bytes, dry-run (writes nothing), verify to file, then commit.

**Commits (all pushed):** 28-module hero-position fix; scales (31/35);
scales-family siblings (34/35); piano-quiz (35/35). Plus the gen-1/gen-2 batches
from the entries below. Helper scripts were temporary, removed before close.

**Still open / next:**
1. **Push Dev** — the rollout is now a uniform 35/35, the stopping point Jonathan
   gated the Dev sync on. origin/Dev was far behind (at `4904478`); this branch
   fast-forwards it. (Doing this next.)
2. **Visual/device QA** the redesigned round-end on real screens — esp. the
   threshold-normalized modules (their title tier changed) and scales-family
   (heaviest edits). Structural verification is complete; pixel QA is owed.
3. **Tier-3 mastery-axis recommender** (length/clef/mode progression) — still
   queued, unchanged.

State probe (run to reconfirm 35/35 from files, not memory):
```
python3 - <<'PY'
import re, glob
for f in sorted(glob.glob('*.html')):
    if f=='pianoquiz-demo.html' or 'has-roundbar' not in open(f).read(): continue
    seg=re.search(r'<section class="screen has-roundbar" id="summary-screen">.*?</section>',open(f).read(),re.S).group(0)
    hero='class="summary-hero"' in seg; grid='class="summary-grid"' in seg
    hi=open(f).read().find('<div class="summary-hero">'); xi=open(f).read().find('id="xp-earn"')
    print(('DONE' if hero and not grid and hi<xi else 'CHECK'), f[:-5])
PY
```

---

### Round-end redesign — final-5 attempt aborted cleanly; hero-position recipe nailed down — May 2026

**Still at 30/35** (HEAD `810935f`). Attempted the final 5 (scales-family +
piano-quiz) but **reverted the in-progress work** to protect the clean 30/35
after hitting (a) a hero-POSITION inconsistency and (b) terminal/Read output
truncation that made verification unreliable. Nothing committed; tree clean.

**THE KEY LEARNING for next session — hero placement.** The canonical position
(note-names + all 31 done correctly) is: `summary-title → summary-sub →
summary-speed → HERO → xp-earn(Beat1) → mastery(Beat2) → miss-list`. i.e. the
HERO block is inserted **right after the summary-sub/speed line, BEFORE Beat 1**.
The gen-1 and gen-2 scripts did this correctly (they inserted the hero after the
speed line as a *separate* step from removing the grid). **My scales-family /
sibling transform got this WRONG**: it replaced the grid *in place*, and in those
modules the grid sits *after* the mastery meter — so the stars landed BELOW the
XP/mastery cards instead of on top. Functional but visually inconsistent, which
defeats the uniformity goal. **Fix for next session: insert the hero block after
`summary-sub` (scales has no speed line; insert right after the sub `<div>`),
and SEPARATELY delete the grid+pb-row block — do NOT replace grid-in-place.**

**The final-5 recipe (all anchors confirmed this session, JS transforms verified
ALL_PASS before revert — only the markup POSITION needs the fix above):**
- **3 siblings — chromatic-scale, ear-scales, scale-modes** (byte-uniform):
  no speed-line; `const stars = scoreToStars(state.score, state.total)`; pb vars
  `newScore`/`newStreak`; pb block is no-guard innerHTML; threshold `.85/.65`
  (normalize → `1/.8/.5`); British title (→ Practicing); plain-unicode markup
  (`⚙️ Game Settings`, `★`, `·`); els-cache has `'sum-score','sum-streak',
  'sum-stars'` + `'pb-row','pb-score','pb-streak'`. pb-flag should use
  `newScore || newStreak`.
- **scales** (the structural outlier — extra hazards, hand-do):
  • markup grid has `style="color: var(--teal-dk);"` on the score stat-value;
  no speed-line (insert hero after `summary-sub` id="summary-sub").
  • dead-JS uses `starCount`/`starStr` AND a hazardous line
  `document.querySelectorAll('#summary-screen .stat-value .of').forEach(...)` —
  that selector targets the GRID's `.of` spans which no longer exist after
  removal; the hero's `.of` (`id="sum-score-of"`) is set by render(), so DELETE
  that querySelectorAll line (don't keep it).
  • threshold `.85/.65` in renderSummary tier (normalize). NOTE scales also has
  a separate `encouragingLine()` with its own `.85/.65` *message* buckets — that
  one is flavor text, leave it (not the verdict tier).
  • pb vars `newScoreBest`/`newStreakBest`, `best.score`/`best.streak`,
  `state.settings.total` (NOT state.total). pb-flag uses `newScoreBest ||
  newStreakBest`.
  • scales has TWO els-cache lines: one with `'sum-score','sum-streak',
  'sum-stars'` (drop sum-streak) and one with `'pb-row','pb-score','pb-streak'`
  (drop pb-streak; add 'sum-score-of','sum-pct').
  • PRESERVE the render() call exactly: `total: state.settings.total`,
  `tier: state.settings.difficulty` (scales has no `state.total`).
- **piano-quiz** (guarded-pb variant): speed-line present; `const stars =
  scoreToStars`; pb vars `newScorePB`/`newStreakPB`; **guarded** pb block
  (`const pbRow = els['pb-row']; if (pbRow) { if (pb.score>0||...) {...} else
  {...} }`) using `sLabel`/`kLabel` + `els['pb-streak']`; std threshold (no
  normalize); British title (→ Practicing); plain markup. **Leave guided-key-find
  untouched** (separate play-screen system). pb-flag uses `newScorePB ||
  newStreakPB`.

**Recommended next-session flow:** healthy terminal; do each of the 5 by hand or
a per-variant script, **insert hero after summary-sub (NOT grid-in-place)**,
verify each (no stat-card in summary, divs balanced, parses, pb-vars present,
scales render args preserved), confirm hero-BEFORE-xp position
(`hero line < xp-earn line`), commit. Then 35/35 → push Dev as the uniform
stopping point (Jonathan deferred Dev until whole).

**Process win this time:** caught the position bug + the degrading environment and
**stopped/reverted instead of committing unverifiable, inconsistent work** — the
opposite of the earlier commit-on-faith mistakes.

---

### Round-end redesign rollout — continued to 30/35 (gen-2 standard-11 done) — May 2026

**Continuation of the same session as the entry below.** After logging the 19/35
state, kept going on the gen-2 modules with corrected discipline (dry-run → write
→ verify in a SEPARATE step → READ results → commit; no more batching commit with
verification). Got to **30/35**.

- `8d2f3e1` gen-2 **entity-form** batch (8): cadences, chord-progressions,
  ear-cadences, ear-chords, ear-progressions, seventh-chords, triad-inversions,
  triads. Anchors: `&#x2699; Game Settings`, `&#x2605;` stars, `&middot;`,
  `var stars = scoreToStars(...)`, no-guard pb. All verified ALL_PASS.
- `3a9f4c2` gen-2 **hybrid** batch (3): intervals, ear-intervals, transposition.
  Hybrid = plain-unicode markup (`⚙️`, `★`, `·`) but gen-2 JS
  (`const stars = scoreToStars`). Verified ALL_PASS.

The pb-flag for gen-2 reuses each module's existing `newScorePB`/`newStreakPB`
(the verifier checks they exist so the flag can't throw).

**Remaining 5 (next session) — the genuinely hard ones, do NOT batch blindly:**
- **4 scales-family**: chromatic-scale, ear-scales, scale-modes, scales. They
  lack the `summary-speed` line anchor, still carry `.85/.65` thresholds (need
  normalize), British title, and a different stars block. **scales** is also the
  structural outlier (uses `state.settings.total`, no `state.total`; render call
  is hand-shaped) — hand-transform it, verify the render args survive.
- **1 piano-quiz**: guarded-pb shape (`const pbRow = els['pb-row']; if(pbRow)`).
  Its guided-key-find is a separate play-screen system — leave untouched.

Recommended next-session approach: audit each of the 5 individually (they may each
be their own micro-variant), dry-run → show → commit on go. Then the rollout is
35/35 and Dev can be synced as the uniform stopping point (Jonathan deferred the
Dev push until whole). Use the state probe in the entry below to confirm DONE/TODO
from the files, not memory.

---

### Round-end redesign rollout — 19/35 done; the gen-1 vs gen-2 markup split — May 2026

**Session type:** Rolling the round-end redesign (piloted on note-names last
entry) out to the rest of the roster. Got **19 of 35 modules** done, verified,
committed, pushed. Stopped deliberately at a clean point — the remaining 16 are a
**different markup generation** that needs its own transform recipe, best done
fresh. Branch `claude/gamified-learning-roadmap-QxZmK`, in sync at the batch-3a
commit.

**State of the rollout (READ THIS FIRST next session):**
- **19/35 DONE** (hero block + flag, single starsFor, perfect chip, demote
  relabel, threshold-normalized where needed; verified per file): note-names,
  accidentals, articulation, cadences-NO (see below), chord-function,
  circle-of-fifths, dynamics, ledger-lines, ornaments, piano-keyboard,
  primary-chords, roman-numerals, scale-degrees, score-navigation,
  tempo-markings, chord-progressions-NO, dotted-notes, ear-rhythm,
  key-signatures, note-values, time-signatures.
  *Authoritative check:* a module is DONE iff its `#summary-screen` section
  contains `class="summary-hero"` and NOT `class="summary-grid"`. Run the state
  probe below — don't trust this prose list, trust the files.
- **16 NOT done** (still original P1 round-end, fully functional): cadences,
  chord-progressions, chromatic-scale, ear-cadences, ear-chords, ear-intervals,
  ear-progressions, ear-scales, intervals, piano-quiz, scale-modes, scales,
  seventh-chords, transposition, triad-inversions, triads.
- **0 modules half-transformed.** Everything parses and works.

State probe (paste to regenerate the exact split):
```
python3 - <<'PY'
import re, glob
for f in sorted(glob.glob('*.html')):
    if f=='pianoquiz-demo.html' or 'has-roundbar' not in open(f).read(): continue
    seg=re.search(r'<section class="screen has-roundbar" id="summary-screen">.*?</section>',open(f).read(),re.S)
    seg=seg.group(0) if seg else ''
    hero='class="summary-hero"' in seg; grid='class="summary-grid"' in seg
    print(f"{'DONE' if hero and not grid else 'TODO' if grid and not hero else 'BROKEN'} {f[:-5]}")
PY
```

**The key finding — there are TWO summary-markup generations.** The redesign
transform (the 6-edit recipe proven on note-names + accidentals) only matches
**gen-1** modules. note-names + the 19 done are gen-1. The remaining 16 came from
the **original P1 rollout transformer** and are structurally different:
- Emoji as **HTML entities** (`&#x2699;&#xFE0F; Game Settings`, `&#x1F525;`,
  `&#x2605;`, `&middot;`) — but NOTE: a few (intervals, ear-intervals,
  transposition) use plain unicode `⚙️`/`★`, so even within gen-2 the markup
  varies; do NOT assume entity form.
- Different dead-JS shape: gen-2 uses `var stars = scoreToStars(...)` +
  `'★ '.repeat(stars)...` (a function call), not gen-1's inline tier ternary.
- Different PB block: gen-2 `els['pb-row'].hidden = false; els['pb-score']
  .innerHTML = ...` with NO `pbRow` local var / no `if(pbRow)` guard; uses
  `els['pb-streak']`. PB key is often per-difficulty (`cd_pb_<diff>`) and NOT
  `!isDrill`-gated.
- gen-2 title often already says "Keep Practicing" (American) and sets
  `titleEl.className = 'summary-title tier-'+tier` in one assignment.
- scales-family (chromatic-scale, ear-scales, scale-modes, scales) additionally
  lack the `summary-speed` line anchor and still carry `.85/.65` thresholds.

**Sub-variant breakdown of the 16 (for the gen-2 recipe):**
- **~11 "standard gen-2"**: cadences, chord-progressions, ear-cadences,
  ear-chords, ear-intervals, ear-progressions, intervals, seventh-chords,
  transposition, triad-inversions, triads. (But intervals/ear-intervals/
  transposition use plain-unicode demote+stars — closer to gen-1; re-audit each.)
- **4 scales-family**: chromatic-scale, ear-scales, scale-modes, scales
  (no speed-line, `.85/.65`, British title). scales also the structural outlier.
- **1 piano-quiz**: its own guarded PB shape; guided-key-find is separate, leave
  it alone.

**Commits this session (all pushed):**
- `8d916db` accidentals (batch proof, 2/35)
- `8cd4470` batch 1/3 (12 modules) — gen-1
- `5d8c1f8` batch 2/3 (12 modules) — gen-1
- `26c1d78` "batch 3a/3 (8 threshold modules, 34/35)" — **message OVERSTATES.**
  Only 5 of the 8 actually transformed (dotted-notes, ear-rhythm, key-signatures,
  note-values, time-signatures); the 3 scales-family (chromatic-scale,
  ear-scales, scale-modes) silently no-op'd because they're gen-2. The commit
  itself is clean (those 3 files unchanged) — only the message count is wrong.
  Decision: leave the pushed message, correct the count here. True total = 19/35.

**Process mistakes this session (REPEATED — must internalize):**
1. **Committed in the same message as the verification** that would have caught
   the failures — the exact "do not repeat" from the prior entry. Did it three
   times. The ONLY reason no damage: the transform script was **fail-loud**
   (wrote nothing on anchor-mismatch) and `git add` of an unchanged file is a
   no-op, so the batch commits only ever captured genuinely-transformed files.
   **Rule, now twice-burned: transform → verify → READ results → THEN commit in a
   SEPARATE turn. Never batch a commit with its own verification.**
2. Over-promised "autonomous all 33" without first auditing markup uniformity;
   the gen-1/gen-2 split made that estimate wrong. **Audit structural uniformity
   BEFORE committing to a batch approach.**

**Decisions banked:**
- Autonomous batching is fine ONLY for a verified-uniform group; the moment a
  variant appears, drop to dry-run → show → commit-on-go.
- DONE/TODO is defined by the file (hero present, grid absent in the summary
  section), never by a remembered list.

**Still open / next (sequenced):**
1. **gen-2 batch — the remaining 16.** Build a gen-2 transform (or hand-do the
   sub-variants): re-audit each of the 11 "standard" first (3 are actually
   plain-unicode/closer to gen-1), then the 4 scales-family (+threshold
   normalize, scales by hand), then piano-quiz. **Dry-run → show → commit on go.**
   Do NOT reuse the gen-1 script's anchors blind.
2. **Visual QA** the gen-1 done-modules on a real device (esp. the threshold
   ones — dotted-notes/note-values/etc. — where the title tier changed).
3. Then the round-end redesign is roster-complete and Dev can be synced as a
   uniform stopping point (Jonathan deferred the Dev push until the rollout is
   whole — see the "commit to Dev only at a proper stopping point" decision).
4. Pre-existing queue unchanged (Tier-3 mastery-axis recommender; CLAUDE.md
   "Ranked build queue").

**Files touched:** 19 module HTML files (summary markup + endRound JS). No
shared-file changes this session (qn-roundend.js / qn-xp.js / qn-theme.css were
all done in the prior entry). Transform/verify helper scripts were temporary
(`_batch_redesign.py`, `_verify_batch.py`) and removed before close.

---

### Round-end redesign + gamification economy overhaul (note-names pilot) — May 2026

**Session type:** Redesigned the round-end summary, unified star logic, fixed a
widespread iOS audio bug, and overhauled the XP/level economy. Branch
`claude/gamified-learning-roadmap-QxZmK`. **note-names is the PILOT** — the other
34 modules are NOT yet migrated to the new summary markup (see Still open). All
shared-file changes (qn-roundend.js, qn-xp.js, qn-theme.css) ARE live everywhere;
they're gated so legacy modules are unaffected until migrated.

**1. Round-end redesign (mockup → note-names pilot).** Consolidated six
overlapping reward signals into a timescale ladder: **stars = the round verdict
(hero)** with score as a detail beneath; **XP** and **medal/mastery** as the two
distinct progress tracks; **Personal best demoted to a celebratory flag shown
only when beaten** (not a permanent line); the redundant standalone "Best streak"
card removed; 🔥 reserved for the daily streak. Mockup at
`_mockups/round-end-redesign.html`. Demote links relabeled to the app's "module"
vocabulary — **"⚙️ Change module settings"** (→ this module's start screen) /
**"Choose another module"** (→ play.html); both confirmed module-scoped first.
British→American ("Practising"→"Practicing"). `render()` now OWNS the hero verdict
so every module renders identically once migrated.

**2. Single-source star formula (qn-roundend v1.2.0).** Stars were computed
per-module with **three threshold sets** (27 modules `1/.8/.5`; the scales family
`1/.85/.65`; a 5-module group `1/.8/.6`). Unified to ONE: `QN.roundEnd.starsFor`
= `≥1→4, ≥.8→3, ≥.5→2, else 1`, exported so the dashboard can match.
**Regression caught + fixed:** v1.1.0 wrote `#sum-stars` unconditionally, but the
34 not-yet-migrated modules still carry a legacy `#sum-stars` inside their
gold-colored 3-card grid → every round showed 4 solid gold stars. Fix: the hero
block is **gated on `#sum-pct`** (a hero-only anchor), so legacy modules are
skipped and keep their own inline stars until migrated.

**3. iOS silent-audio fix (all 14 inline-audio modules).** Root cause: inline
`ensureCtx()` resumed only from `'suspended'`; on iOS the AudioContext drops to
`'interrupted'` (iOS-only state) when audio goes idle between rounds → rounds 2+
silent. The shared `qn-audio.js` was already hardened; the 14 inline-audio
modules (the inline-outlier set) were not. Fix part 1 (all 14): resume from
`'suspended' || 'interrupted'` — byte-identical block across 13, hash-verified,
safe scripted replace, no timbre change. Fix part 2 (note-names only): resume the
ctx **synchronously inside the tap gesture** at `startRound()` — note-names
auto-plays its first note via a delayed `setTimeout` (outside the gesture
window); the other note modules already call `ensureCtx()` in their tap handlers,
so part 1 sufficed. 24 modules use shared `qn-audio.js` (already fine). Confirmed
on-device.

**4. Perfect-game XP bonus (replaces the dead streak bonus).** Discovery: the
in-round **streak bonus never fired** — `streak` was never passed into `roundXP`
NOR persisted in the event log (qn-profile.js `log()` whitelist has no streak
field). The chip was announcing "+15 bonus XP" the engine never granted.
**Decision (Jonathan): reward perfect games, not streaks** — a perfect game =
`correct === total`, and both fields are already persisted, so live round XP and
replayed `totalFor()` stay consistent **with no schema change** (streak would've
needed a Tier 3 whitelist change). `perfectBonusPerQ: 2` → 5/10/20-question
rounds pay **10/20/40**, stacking on the clean-round bonus, scaled by difficulty.
Chip now reads **"🌟 Perfect game — +N bonus XP!"**, N computed from CONFIG so
chip == engine. Perfection cliff (9/10 vs 10/10) = **+30** (chose ×2 over ×3 to
soften it for beginners).

**5. Level-curve rebalance (the real pacing bug).** The old curve (`tailStep
700`) made a dedicated learner "Virtuoso" (top name) **~halfway through
Foundations** (~Lvl 50 after 14 modules). Industry standard (Duolingo,
gamification lit): the top tier is **aspirational, sitting beyond completion**.
New curve (wider early thresholds + `tailStep 3576`): finish Foundations ≈
**Player (L16)**, master all 35 ≈ **Musician (L26)**, **Virtuoso (L35) = deep
practice BEYOND completion**. Also fixed the **module-1 jump**: first cut had one
module = +8 levels (confetti, not progress); wider early block → ~+5 levels (L6),
steady climb after. XP is **derived** (replayed from events) → retune is
retroactive, **no migration**.

**Bugs fixed (root causes):** 4-solid-gold-stars on non-pilot modules (render()
wrote the legacy gold grid → gated on `#sum-pct`); iOS rounds 2+ silent (inline
ctx ignored `'interrupted'`); "+15 streak bonus" announced but never granted
(streak never reached roundXP → replaced with perfect-game); PB "10/5" (showed
stored score over current total → store/use the PB's own total, recover legacy
from pct); summary "stiff" (`overscroll-behavior:none` on html,body killed the
iOS rubber-band → scoped a relax to the active summary via
`:has(#summary-screen.active)` on BOTH html and body).

**Process notes (mistakes — do not repeat):**
- Once batched a `git commit` in the SAME message as its own verification, so a
  half-applied state (6 silently-failed edits) was committed before checks
  surfaced it. **Rule: verify → read results → THEN commit as a separate step.**
- Almost overwrote this 232KB BUILD_LOG with `Write` (misread its size as empty);
  the "file not read" guard blocked it. **Always prepend via Edit; never Write
  this file.**

**Key decisions banked:**
- Stars = round hero, ONE formula app-wide (reduces per-module nuance — Jonathan's
  explicit goal: faster iteration. Once migrated, stars are identical by
  construction).
- Perfect-game over streak — sidesteps the Tier 3 event-log schema change.
- Virtuoso = aspirational (beyond completion), not "= finished."
- Buttons stay short verb-first; encouragement in supporting copy ("↻ Try again"
  + "You've got this 💪" above it).

**Still open / next (sequenced):**
1. **Batch the round-end redesign to the other 34 modules** (the big one). Per
   module: add the hero block markup (`#sum-stars`/`#sum-score`/`#sum-score-of`/
   `#sum-pct` + PB flag), remove the legacy 3-card grid + dead stars JS, relabel
   demote links, "Practising"→"Practicing". **Also normalize each module's
   title/sub tier thresholds to `1/.8/.5`** (the `.85/.65` and `.8/.6` outliers
   drive the title tier and must match the unified star tier). Exact-string
   method; verify BEFORE each commit. Mind the inline-audio vs shared split.
2. **Per-module mastery-axis recommender (TIER 3 design pass).** Jonathan's idea:
   progression shouldn't be just "next: tricky" — push length (10→20) and, where
   present, clef (treble→bass→both) or major→minor. Reconciliation: each module
   declares the axes it HAS (universal: difficulty, length; variant: clef on 15
   modules, accidentals on 8, major/minor on 5); recommender walks a universal
   priority order but SKIPS axes a module lacks — single rule, no per-module
   special-casing. Changes the mastery definition + progression promise → Tier 3.
   Also future-proofs the curve (extra practice fuels the Musician→Virtuoso
   headroom).
3. **Visual QA** of the note-names pilot on real devices (low/tough/perfect
   rounds, bounce, PB flag) before propagating.
4. Pre-existing queue still stands (CLAUDE.md "Ranked build queue"): Mock Exam
   Mode, Curriculum Mapping (named-method = lawyer-gated), C Clefs +
   Construction-mode (Tier 3 renderer sessions), PWA, adult/child profile UI,
   monetization track.

**Files touched:** `qn-roundend.js` (hero, stars, perfect chip, bad-round
buttons), `qn-xp.js` (perfect bonus + curve), `qn-theme.css` (hero/flag styles,
card density, summary bounce), `note-names.html` (pilot markup + JS + audio fix),
13 inline-audio modules (audio fix), `_mockups/round-end-redesign.html` (new).

---

### Gamified round-end P1 rollout — all 35 modules + drill-awareness — May 2026

**Session type:** the P1 rollout itself. Took the note-names gamification proof
and shipped the 3-beat round-end (EARN → PROGRESS → NEXT STEP) + sticky action
bar + scroll scrim/cue to **all 35 live modules**, via a shared file rather than
35 inline copies. Branch `claude/gamified-learning-roadmap-QxZmK`. Approach was
Jonathan's explicit call: **shared-file-first, round-end layer only** (status
bar + tap-to-learn explainers deferred to a later P1 slice).

**Step 1 — shared foundation (proven on note-names before anything else).**
- `qn-roundend.js` (new shared file): `QN.roundEnd.render({module, score, total,
  tier, bestStreak, isDrill, onRetry})` — a faithful, parameterized copy of
  note-names' `renderXPBeats` using `getElementById` on the standard summary IDs;
  plus `initScroll()` / `updateScrim()` for the fade scrim + "More ▾" cue.
  Degrades to a no-op if the XP core is absent; every beat self-skips if its
  anchor is missing. Later improvement: `render()` calls `initScroll()` itself
  (idempotent), so modules need **no init hook** — this killed the divergent
  init-anchor problem (18 modules bound `change-btn` differently).
- Gamification CSS moved byte-for-byte from note-names' inline `<style>` into
  `qn-theme.css` (Beats 1–3, sticky bar, scrim, cue, `cueBob`).
- **Regression caught + fixed:** the moved `#summary-screen { padding:0;
  height:100dvh; flex-column }` is an **ID rule** — once in `qn-theme.css` it hit
  all 36 modules, but only note-names has the `.summary-scroll` markup it
  assumes. Two same-specificity `#summary-screen` rules → the moved one won by
  source order and stripped the baseline center+20px padding from 35 summaries.
  Fixed by gating the restructure behind a **`.has-roundbar` marker class** on
  `#summary-screen` (id+class specificity wins where present; baseline wins
  everywhere else). Marker class, not `:has()`, for older school-iPad Safari.
  Modules get the marker in the same commit that adds their round-bar markup.

**Step 2 — the rollout (content-preserving, in-place, fail-loud).** A Python
transformer per module: links `qn-xp.js` + `qn-roundend.js`; adds `.has-roundbar`
+ `.summary-scroll` wrapper + Beat 1/2 cards + pinned `.summary-bar` (scroll-cue,
Beat 3 next-step-cta, bar-row with the module's **own** again/drill buttons,
labels preserved); demotes change-btn + all-modules to `.summary-demote` quiet
links; inserts `QN.roundEnd.render({module:'<slug>',…})` before the fanfare.
Handles both `setTimeout(()=>{` and `setTimeout(function(){` forms. **Aborts
without writing** on any unmatched anchor. Sequenced: accidentals (proof) →
batch 1 (8) → batch 2 (10, incl. ear cluster) → batch 3 (13) → outliers. Each
file verified: inline JS parses, CSS braces balanced, summary-screen
div-balanced, all beat/bar IDs present, exactly one again-btn, no stale
`.summary-actions`.

**Outliers handled by hand (scales, piano-quiz).** scales bit twice, exactly as
CLAUDE.md warns: (1) the fanfare anchor sat **inside** scales' `if (!timedOut)`
celebration gate, so render() would skip on timed-out rounds — moved it out
(round still logs on timeout; only the celebration stays gated); (2) scales uses
`state.settings.total` and has **no `state.total`**, so the auto-inserted
`total:state.total` would have been `undefined` and broken the XP/medal math —
fixed to `state.settings.total`. Audited all 33 others: scales is the only one
lacking `state.total`. piano-quiz was clean (render unconditional, correct
field, guided-key-find untouched).

**Drill-awareness (the follow-up Jonathan asked for next).** Drill rounds that
**re-serve the user's missed items** are pure practice and must read "practice,
no XP" + write no event (else the XP total rises while Beat 1 claims none).
**Classification was the hard part** — a naive scan misread `state.deck = []`
(a fresh-reset) and adjacent handlers' `drillPool` refs as re-serve. Reading each
drill handler's actual `state.pool = […state.drillPool]` assignment, **only 3**
modules genuinely re-serve: **ledger-lines, piano-keyboard, piano-quiz**
(piano-quiz via an intermediate `const pool` var). All other drill-capable
modules either replay a **fresh graded round** at the same settings (logging +
XP is correct there) or keep the drill button hidden/unwired (intervals,
ear-intervals, transposition). Wired the 3 with the note-names pattern:
`state.isDrill=false` in startRound, `=true` in the drill handler (which never
calls startRound, so the flag persists), `!state.isDrill` guards on logOrHold +
both personal-best checks, `isDrill:state.isDrill` into render. **This precision
prevented wrongly denying XP credit on ~16 real-round "drills."**

**Decisions banked.**
- `isDrill:false` is correct for fresh-replay drills — not a gap. (Tier 2.)
- Reused note-names' summary markup verbatim where siblings were byte-identical
  clones; preserved per-module content (stat labels, miss-text, button labels)
  everywhere else.
- `pianoquiz-demo.html` intentionally NOT rolled out — it's a demo with its own
  inline `#summary-screen`; next task is to give it the **sticky-bar/scroll
  layout only, minus the XP/mastery/recommender package** (Jonathan's call).

**Still open / next.**
1. **Pixel QA on real devices** (Jonathan, in progress) — structural
   verification passed across all 35; rendered-pixel QA owed, esp. an ear
   module, scales (the structural outlier), and a chord module.
2. **pianoquiz-demo sticky bar (next build task)** — layout/scroll affordances
   only, no XP beats / mastery meter / next-step. "Doesn't need the full baked
   package."
3. **Status bar + tap-to-learn explainers** — the rest of P1 (persistent Level
   status bar, level-chip + medal bottom sheets per `specs/progress-explainers-
   spec.md`). Now unblocked: every module has the round-end surface.
4. **Dead rule:** note-names still has an orphaned inline `.summary-actions
   { margin-top:16px }` (no matching element since it uses `.summary-demote`).
   Harmless; left untouched to avoid re-touching the proof module.

---

### Gamification P0 polish + progress-explainer design — May 2026

**Session type:** UX polish on the note-names gamification proof + a design
pass (with mockup) on how the two reward systems are explained, separated, and
awarded. All to branch `claude/gamified-learning-roadmap-QxZmK` (see branch note
below). note-names stays the single proof module; nothing rolled to all 36 yet.

**Mobile round-end reach (note-names).** The new gamified summary buried "Play
again" below the fold on phones. Split `#summary-screen` into a scrolling
`.summary-scroll` + a pinned `.summary-bar` (high-frequency actions can never
hide behind content). Density fix: stars forced `white-space:nowrap` so the 3
pillar cards go wide-and-short instead of wrapping tall. Inline-only on
note-names; promote to `qn-theme.css` during P1.

**Scrollability cues (the "is there more?" problem).** Two industry-standard
additions, both **honest** (driven by a single `updateSummaryScrim()` that
toggles `#summary-screen.scroll-end`):
1. A soft cream→transparent **fade scrim** above the bar (replacing the hard
   2.5px ink border, which read as a terminal "page ends" edge). Hidden at the
   bottom / when nothing overflows.
2. An animated **"More ▾" scroll cue** pill — gentle chevron bob, tap-to-scroll
   (~70% viewport), auto-hides via the same `.scroll-end`, `prefers-reduced-
   motion` safe. Measured after render via double-rAF; scroll listener passive.

**Medal model decided — highest-wins (skipping allowed).** A learner who clears
Tricky (≥2 rounds ≥85%) earns Gold immediately, even if Easy/Medium were never
played — tiers are difficulty levels of one skill, so back-filling lower tiers
for the medal is busywork. Matches the recommender's existing source of truth
(`qn-profile.js nextTierFor` already treats tricky-cleared as "module done").
**Root-caused a real contradiction:** Beat 2's progress note used *bottom-up*
logic (`nextTier` = lowest uncleared) while the medal *label* is highest-wins —
so a Tricky-only learner saw "🥇 Gold" sitting above "2 more rounds → 🥉 Bronze."
Fixed: `nextTier` now = the tier just **above** the highest cleared; at Gold it
reads "Gold — top tier mastered! 🎉" (true whether laddered or skipped). Rejected
the "always show 3 tier pips" option for the round-end card — empty lower pips
beside an earned Gold reads as broken/hollow; that completionist view belongs on
the dashboard mastery grid if anywhere.

**Progress-explainer design (approved, not yet built beyond the mockup).**
Industry standard = explain on tap, not upfront. Tap-to-learn bottom sheets on
the **level chip** and **medal banner**, each carrying the approved one-liners:
*levels = how much you've practiced overall · medals = how well you know each
topic.* Spatial/visual separation: global **Level → persistent status bar** (its
own identity surface, purple ring); **medal stays on the topic**, tagged "this
topic" (gold trophy). Levels stay **cosmetic — they unlock nothing** (said
explicitly in the sheet). Captured in `specs/progress-explainers-spec.md` +
interactive `_mockups/progress-explainers.html` (Before/After toggle + design
annotations + working sheets).

**Key sequencing finding.** The explainer + separation rollout is **coupled to
the XP phase (P1)** and can't precede it: the separation needs the persistent
status bar (a P1 surface), and the sticky-bar/fade/cue can only land on modules
that have the new gamified round-end — which only note-names has. So the all-36
rollout *is* P1, not a step before it. note-names is the reference proof.

**Decisions banked.** Level name bands **confirmed**: Beginner / Apprentice /
Player / Musician / Virtuoso. Medal model = highest-wins (above).

**Still open / next:**
- **P1 (the next phase):** XP/Levels live everywhere + persistent status bar +
  gamified round-end rolled to all 36, applying the highest-wins medal-note fix
  per module and promoting the sticky-bar/fade/cue CSS into `qn-theme.css`
  (Tier-3 shared-file change, done as part of the rollout, not an orphan commit).
  Gated on Jonathan's **final "go" after device QA** of the note-names proof.
- **Tier-3 / lawyer-gated:** any XP/Level/streak/medal copy that reaches the
  **landing page** = user-facing promises. Current read: the system is
  client-side + cosmetic + non-purchasable, so no new privacy/terms disclosure
  is needed *now*; revisit when cloud sync stores progress (then level/streak/XP
  fall under the existing child-profile consent scope). Keep marketing
  descriptive — no outcome guarantees / no implied real-world value.
- **Device QA owed** on the note-names polish (sticky bar + cue eyeballed live;
  medal-note fix is pure logic, hard to hit by hand).
- **Branch policy:** this work went to `claude/gamified-learning-roadmap-QxZmK`,
  not `Dev` — the session task pinned the feature branch, conflicting with the
  CLAUDE.md "always Dev" rule. Needs a permanent call.

---

### play.html tile recalibration: Dotted Notes & Chromatic Scale — May 2026

**Session type:** Visual recalibration of two `play.html` library tiles, with
dedicated per-tile calibrator tools. Shipped to `Dev`, promoted to `main`.

**Dotted Notes & Ties tile.** Dot sat too far from the note; tie arced over the
top. Built `_dotted-tile-calibrator.html` (renders the exact tile on its cream
`#fff2cf` bg, sliders for dot X/Y/size + full tie control incl. an Up/Down
**direction flip** — the old depth-sign slider wasn't an obvious flip). Result:
dot tucked closer + larger, tie flipped **under** the noteheads. Final tile:
dotted-half `x57`, dot `x69 y71 size46`, tie `M 120 58 Q 139.5 69 159 58` @1.5.

**Chromatic Scale tile.** Replaced the decorative note-scatter with a real **C
chromatic scale ascending** (C C# D D# E F F# G G# A A# B C). Built
`_chromatic-tile-calibrator.html`, which evolved over the session into a
full **per-note** editor: every notehead and accidental has its own X/Y, plus
globals (direction asc=sharps/desc=flats, note style, color, sizes, stem
length/thickness/X/Y, ledger width, nudge-X-all, pill). Heads are
`noteheadBlack` + drawn stems; middle C on its ledger line; rainbow.

**The recurring lesson (again): measure the Bravura *Text* variant.** Notes kept
sitting a staff-step high (C looked like D) because:
1. The complete quarter glyph's baseline is below the head → head floats above
   `y`, ledger drawn at `y` lands under it. Fix: use `noteheadBlack` (head
   centered on baseline) + a drawn stem.
2. `noteheadBlack` in **Bravura Text** still sits on a text baseline (not
   centered), so `getBBox` measurement is required to find the true head center
   — AND the measurement must run **after** the font loads (an early/`fonts.check`
   -gated measure captured fallback-font metrics once and never refreshed, which
   is what kept it broken across several iterations). Final: measure inside
   `fonts.ready`/`fonts.load` (+600ms safety net), offset each glyph's text-y by
   the measured center. Also shipped a manual "Head glyph Y (vs line)" override
   as a guaranteed escape hatch.
- Spacing: `sqrt`/cluster layout abandoned in favor of full per-note placement
  (Jonathan dialed every position by hand).

**Step-up animation.** Each note is a `.cs-note` group (ledger/stem/accidental/
head) with a staggered 100ms `animation-delay`; a looping `cs-step` keyframe
(quick rise+fade-in, then hold) climbs the scale one note at a time and repeats.
Honors `prefers-reduced-motion`.

**Calibrators kept (Jonathan's call — do not discard).** `_chromatic-tile-
calibrator.html`, `_dotted-tile-calibrator.html`, plus the rhythm ones
(`_rhythm-render-compare.html`, `_rhythm-calibrator.html`). Underscore-prefixed
internal tools, tracked in repo per the clef-calibrator precedent. These are the
template for any future tile/glyph tuning.

**Also on Dev this session (other hands):** landing-page clef rendering tweaks
(crisp vector, sync fade) and a scale-family start-screen boot fix — folded into
the same `main` promotion.

**Still open / next.** Device/pixel QA of both tiles on production (the chromatic
head placement relies on a runtime `getBBox` that only runs in a real browser).

---

### Ear: Rhythm notation renderer rebuilt (Bravura glyphs) — May 2026

**Session type:** Renderer rework on one module (`ear-rhythm.html`) + a tracked
calibration tool. Shipped to `Dev`, then promoted to `main`.

**Trigger.** Ear: Rhythm's answer-tile rhythm patterns were drawn with
hand-rolled SVG primitives (tilted-ellipse noteheads, bezier flags, line
beams) and looked crude. Jonathan's steer: "look at a module already doing
this right instead of reinventing the wheel."

**Diagnosis.** `note-values.html` and `dotted-notes.html` already render real
**Bravura Text** glyphs (the SMuFL engraving font, loaded via @font-face in
every module) and look professional. `ear-rhythm`'s `patternSVG()` was the
lone outlier hand-drawing everything. The font can't express *beamed groups*
as a single glyph, which is why the original went hand-rolled.

**Approach (final).** Every note is a complete Bravura glyph (head+stem from
the font — no seams). Beamed groups and single 8th/16ths render the **quarter
glyph** plus a *drawn stem extension*, so the beam (a rect) / flag can sit
below the glyph's natural stem tip. Single flags are a **separately-sized flag
glyph** so the curl length is controllable. Stems down / beams below (matches
the prior shipped orientation).

**Key insight — measure, don't assume.** `bravura_metadata.json` describes
*Bravura*, but the app renders *Bravura Text*, whose em scaling differs — so
metric-derived stem-tip positions were wrong (beam floated off the stems).
Fix: measure the actual quarter glyph at runtime via `getBBox()` at a
reference size, scale linearly. The beam/flag now land on the real stem tips
regardless of font variant; falls back to a metadata estimate if measurement
is unavailable.

**Other fixes found during calibration.**
- **Spacing:** strict duration-proportional spacing crushed beamed 16th
  groups. Switched to `sqrt(duration)` spacing (engraving practice — short
  notes get more than their literal fraction).
- **viewBox:** cropped to content (head-top → beam/flag end) so tiles aren't
  mostly whitespace; choice-tile SVG capped at 240px wide, centered.
- Dead-ends logged: composing head+stem from `noteheadBlack` + a drawn stem
  reintroduced a seam (noteheadBlack's baseline = head center, complete
  glyphs sit on the text baseline → different seating). Using the complete
  quarter glyph for the head+stem everywhere removed the seam.

**Calibration tool.** `_rhythm-render-compare.html` (tracked, `_`-prefix
internal tool, kept per the clef-calibrator precedent) — old-vs-new battery,
the quarter=2×8th=4×16th reference row, live sliders, Copy-params. This is now
the template for rhythm re-tuning. Final params baked into `ear-rhythm.html`:
`glyph 44, cy 51, vNudge 14, beamW 4.5, beamGap 3.5, beamR 0, beamDX 0,
beamDrop 4.5, stemW 0.8, flagScale 0.65, flagDX 1, flagDY 8`.

**Scope.** Only `ear-rhythm.html` changed (no shared-file change — Bravura
Text already loaded everywhere). `dotted-notes.html` / `note-values.html`
already use complete glyphs and were left as-is.

**Still open / next.** Device/pixel QA of the live answer tiles (the runtime
`getBBox` measurement needs a real browser; structural + fallback verified
headless). If beamed/flagged stems look longer than plain quarters after the
beam-drop, extend quarter/half stems to match (deferred — flagged a possible
follow-up). The flag-shortening composition lives in both the calibrator and
`ear-rhythm`; keep them in sync if re-tuned.

---

### Key-signatures scoring/reveal broken + reveal-shade unification — May 2026

**Session type:** Bug fix + small cross-module visual consistency pass.
Shipped to `Dev` (commit `0a34f5e`).

**Report.** "Key signatures isn't showing the correct answer after two
wrong. Time-signatures and scales work. Also the reveal shading differs
(light vs dark) — keep it consistent across all 35, I prefer the lighter."

**Bug 1 — key-signatures field-name mismatch (whole module non-functional).**
`nextQuestion` sets `state.current = { keyId, clef }`, but `handleAnswer`
read `var correct = state.current.key` — which is `undefined` (the field is
`keyId`, not `key`). Consequences: `pickedKey === undefined` is always false,
so **every** answer — including the correct one — routed to the wrong branch
(score never incremented), and the 2nd-wrong reveal did
`children.find(b => b.dataset.key === undefined)` → matched nothing → no
reveal. Fix: `state.current.keyId`.

**Bug 2 — missing `M` binding (masked by Bug 1).** Once correct answers
registered, the `isCorrect` branch hit `if (M.explode) M.explode(...)` and
threw `M is not defined`. key-signatures uses its own `KS` namespace: the
renderer block exposes `KS.fx = { explode }` and the game loop binds
`const R = KS.render` but the clone dropped the `M` binding. Because the
throw is before `updateStreakBadge/updateProgressAndStats/setTimeout`, a
correct answer would also have failed to advance. Fix: add
`const M = KS.fx;` next to the `R` binding. (Same class of cross-IIFE-scope
bug as the prior teaching-hints session — symbols shared between the
renderer block and the game-loop block must go through the exposed
namespace.)

**Verification.** Drove a real round in the DOM-mock harness
(`/tmp/trace4.js`, probe clicks the correct button then two wrong):
before — correct click scored 0→0, no class, reveal matched nothing; after —
correct click scores 0→1, gets `.correct`, advances; two wrong reveals the
answer with `.reveal-correct`. (Had to add `Element.animate` and full
WebAudio param stubs to the mock — both are real-browser APIs the explode
celebration + audio use; their absence are mock gaps, not bugs.)

**Reveal-shade unification.** Shared `qn-theme.css` has two states:
`.choice-btn.correct` = bold dark teal (white text) and
`.choice-btn.reveal-correct` = soft light teal (`--teal-lt`/`--teal-dk`).
Semantics adopted app-wide: **dark = you earned it** (your own correct pick),
**light = here's the answer** (revealed after the 2nd miss). Audit of all
button-answer modules: 28 already revealed with the light `.reveal-correct`;
4 still used the dark `.correct` at the reveal site — **time-signatures,
dotted-notes, note-values, ear-rhythm** — switched to `.reveal-correct`
(one word each). `piano-quiz` intentionally excluded — it reveals via the
guided-keyboard glow (`state.revealing` + halo), not choice buttons. Every
module's own-correct-pick `.correct` left as the bold dark state.

**Still open / next:** device/pixel QA that key-signatures now scores,
advances, and reveals correctly, and that the lighter reveal reads well on
real screens. No schema or shared-file changes in this session
(qn-theme.css already had `.reveal-correct`).

---

### Session close — quality + viewport sprint (May 28–29, 2026)

**One-session arc:** a run of device-reported bug fixes + a full responsive
pass + doc/spec upkeep. Each item below has its own detailed entry; this is the
consolidating close-out + the refreshed next list.

**Shipped to `main` (production):**
- Teaching hints revived (time-signatures, dotted-notes — cross-scope `ReferenceError`).
- Key-signatures scoring/reveal fixed (`state.current.key`→`.keyId`; bound missing `M = KS.fx`).
- Reveal shade unified to the lighter `reveal-correct` everywhere.
- Recommender: never recommends below your highest-cleared tier; "cleared" rule
  unified across recommender / dashboard / path.
- Dashboard mastery-rule explainer (grape banner).
- Landing demo rebuilt as a scripted teaching-hint flow (wrong→hint→retry→correct→fanfare).
- Phone-viewport pass (36 modules): dvh fix, start/summary `safe center`,
  landscape "best in portrait" hint (icon C via `qn-nav.js`), play-screen scroll
  safety net.
- Legal drafts: Share/export disclosed; error-reporting scoped PLANNED.

**`Dev`-only (intentionally not promoted):**
- `specs/pwa-spec.md` — PWA engineering spec, DRAFT.

**Decision:** **PWA is deferred to the cloud session** (Jonathan's call). Rationale:
iOS evicts local storage after ~7 days unused, so an installed PWA on the
current local-only model could lose data; doing PWA *after* cloud sync means
installs are durable from day one. Spec is parked; its only hard blocker on
resume is a high-res logo for the icon set.

**CLAUDE.md candidates surfaced this session (flagged, not yet applied):**
1. Multi-IIFE shared-symbol rule: a symbol shared between a module's inline
   `<script>` blocks must be reached via its exposed namespace (`TS.decodeKey`,
   `window.DN.SYMBOLS`) — a bare ref parses fine but throws only on the code
   path that hits it. Verify runtime-wired handlers by driving a click, not just
   init.
2. `dvh`/`vh` fallback order: write `height:100vh; height:100dvh;` (fallback
   first, enhancement last) — the inverted order made `dvh` dead in all 36.
3. Per-feature "does this touch privacy/terms?" checkpoint (Share/export was the
   miss that prompted it).
4. "Mastered" is computed in 3 surfaces and drifted — consider a shared
   `QN.mastery` helper so the clear/advance rule lives in one place.

**Still open / next:**
- **Real-device QA** on the viewport pass (SE / 13 / Pro Max / small Android,
  portrait + landscape; confirm dvh fit + the rotate hint). The owed pixel QA.
- **Cloud / monetization arc** (accounts → sync → Stripe → consent gate) — the
  big next track; PWA, error-reporting Phase 1, and iOS storage durability all
  hang off it.
- **Error reporting:** Phase 0 (`qn-errors.js`, local capture + mailto/clipboard
  "send diagnostics") is buildable anytime, no policy change; Phase 1 (cloud)
  activates the PLANNED disclosures, lawyer-gated.
- **PWA** — resume in the cloud session (spec ready; needs the logo asset).
- Optional: the `QN.mastery` extraction above; landing Pillar-1 title duplication
  (from the older list).

---

### Phone-viewport pass: dvh fix, overflow-safe play loop, start/summary anchoring, landscape hint — May 2026

**Session type:** Responsive audit + fix across the whole play flow (start /
play / summary) on every module. Shipped to `Dev`, then `main`.

**Audit method.** Structural (source-based), since there's no headless browser
here — read the shared layer + a standard module + the three outliers (scales,
piano-quiz, time-signatures) and reasoned against real phone viewport heights.
A background agent extracted per-screen skeletons. Pixel-exact confirmation
still wants a real-device pass (the owed device-QA).

**What was actually there.** Each module already implements a mobile app-shell:
at ≤760px, `#play-screen.active` locks to one viewport and the header/footer
hide during play (`body.playing`). `body` is `min-height:100vh` flex-column;
the three `.screen`s are direct children (no `<main>` wrapper).

**Headline bug (all 36 modules).** The play-screen height was written
`height:100dvh; height:100vh;` — inverted, so the later `100vh` always won and
`100dvh` was dead. The screen sized to the *large* viewport, so with the
address bar showing, the answer choices + status sat behind the chrome and
couldn't scroll (`overflow:hidden`). **Fix:** swap to `height:100vh;
height:100dvh;` (fallback first, enhancement wins). This was the single
highest-impact change.

**The fixes, by tier:**
- **P0 (inline, 36 files):** the dvh swap above.
- **P1 start (inline, 36 files):** `#start-screen` `justify-content:center` →
  `safe center` — centers when it fits, top-anchors+scrolls when tall (the
  classic flex-centering-clips-the-top trap on short phones). No desktop change.
- **P1 summary (shared `qn-theme.css`):** same `safe center` on
  `#summary-screen` — one edit, all modules; a long miss-list can't clip the
  title/buttons.
- **P1 landscape hint (shared, Tier 3, approved):** `qn-nav.js` injects a
  "best in portrait" overlay **once, only on pages with `#play-screen`**
  (content pages skipped); `qn-theme.css` gates it to short *touch* landscape
  (`orientation:landscape AND max-height:500px AND pointer:coarse`) so phones
  get it, tablets-in-landscape and desktop don't. Icon = the
  landscape→portrait transition glyph (option C, chosen from
  `_mockups/rotate-hint.html`).
- **P2 (scales + universal):** scales gets a `@media (max-height:700px)` staff
  shrink (it had the tallest floor). All 36 get the play screen's
  `overflow:hidden` → `overflow-x:hidden; overflow-y:auto` so a too-short
  device **scrolls rather than clips the answer buttons**.

**Outlier decision — time-signatures.** Its staff uses fragile 1:1 baseline
geometry (code comment warns rescaling caused digit-drift). Rather than risk
that, its rigidity is covered by the P2 scroll safety net — no geometry change.
piano-quiz was fine (its keyboard scrolls horizontally by design).

**Verification.** Every batch checked across all 36: CSS brace balance, inline
JS parses, edit-correctness assertions (one `safe center` each, dvh-after-vh,
safety-net present/no leftover `overflow:hidden`). The `qn-nav.js` injector was
unit-tested to inject only when `#play-screen` exists, and once.

**Lesson / CLAUDE.md candidate.** Don't assume "no app shell" from one file —
the viewport handling lived inline per module, not in `qn-theme.css`; grepping
all 36 corrected the wrong first read. And the `dvh`/`vh` fallback order
matters: fallback first, enhancement last.

**Still open / next:** real-device QA pass (SE / 13 / Pro Max / small Android,
portrait + landscape); PWA session still owes `manifest.json` with
`"orientation":"portrait"` (the Android-side lock that pairs with the hint).

---

### Landing demo: scripted teaching-hint flow — May 2026

**Session type:** Landing-page UX. Shipped to `Dev`, approved on preview, then
`main`.

**What.** Reworked the non-playable "A round looks like this" Scales demo on
`index.html` so it *showcases the teaching-hints mechanic* rather than a
straight correct answer. New scripted loop: climb the C-major scale → reveal
choices → **pick G Major (wrong → coral)** → **teaching-hint card slides in**
→ hint hides + wrong clears → **pick C Major (correct → teal)** → existing
fanfare. The hint text is accurate to what's shown: *"Every note landed on a
white key — no sharps or flats. The major scale with no sharps or flats is C
major. (G major would have an F♯.)"* — it both refutes the specific wrong
guess and teaches the rule.

**How.** The demo already built a C-major scale with the right choices
(`CHOICES = ['C Major','F Major','A Minor','G Major']`, correct idx 0); only the
answer phase changed. Added `.demo-choice.wrong` (coral) and a `.demo-hint`
overlay scoped to `.demo-card` (which is already `position:relative;
overflow:hidden`), with `pointer-events:none` so the card's tap-through to
`play.html` still works and it never covers the rest of the page. New
`WRONG_IDX`/`HINT_TEXT` + `pickWrong`/`showHint`/`hideHint`/`clearWrong`/
`pickCorrect`; `showChoices` no longer auto-highlights the correct answer.
Static choice labels synced to the rendered set to avoid a first-paint flash.

**Timeline** (relative to notes finishing): choices at +0, wrong at +1.5s,
hint at +2.3s, hide+clear at +6.0s, correct at +6.8s, fanfare at +7.3s, loop
reset at +13s. Hint is on-screen ~3.7s (readable).

**Note.** Self-contained to `index.html` (no shared-file or module change). It
mirrors the real in-game hint card visually but is a scripted simulation —
covered by the existing "*Simulation only*" footnote under the demo.

---

### Legal-draft sync: Share/export disclosed + error-reporting scoped (PLANNED) — May 2026

**Session type:** Doc/scoping pass on `privacy.html` + `terms.html`, no app
code. Shipped to `Dev` and `main`. Both docs remain DRAFT — NOT LEGAL ADVICE,
pending counsel.

**Why.** Audited the legal drafts against what's actually shipped. The drafts
already cover the full target architecture (accounts, cloud sync, Stripe,
child profiles), but two things had drifted or were unscoped:

1. **Share / export was undisclosed (shipped feature).** The dashboard's
   "Practice Notes" image-share (`navigator.share`) + PDF/print export renders
   the **nickname + streak + practice time + mastery counts** into an artifact.
   It's user-initiated and fully on-device (our servers never see it), but the
   policy implied only two data paths existed (local; planned cloud). Added a
   §3 "Sharing and export (on your device)" disclosure, a §9 children's note
   (a freely-chosen nickname can leave the device by a parent's share action —
   lawyer-flagged against the COPPA "local-only is not collection" position),
   and a terms §9 line (exported cards are personal-use, carry QuizNote
   branding that can't be removed/misused). Shipped `f8b11b9`.

2. **Error reporting / diagnostics scoped as a FUTURE feature.** Decided the
   architecture before building anything (see roadmap below) and pre-wrote the
   PLANNED disclosures so the drafts are review-ready:
   - privacy §2 (planned list), §3 (new PLANNED "Diagnostic / error data" table
     row), §8 (PLANNED error-reporting provider sub-processor) + lawyer-review
     comment; terms §13 (PLANNED provider line).

**Error-reporting roadmap (decided, NOT built):**
- **Capture** = client-side `window.onerror` + `unhandledrejection` listeners
  (would live in a new shared `qn-errors.js`, building on `QN.diagnostics`).
- **UX = severity-tiered, default invisible.** Cosmetic (chime/anim/hint
  fails) → silent capture, keep playing. Degraded (audio init, storage write)
  → inline/auto-recover. Round-fatal → recoverable "skip/new round" state.
  App-fatal (init throw — the "buttons dead, nav works" case) → friendly
  full-screen fallback with Reload / All modules / Send diagnostics. Technique:
  tag severity at the catch site + an init-success sentinel to detect dead
  init. Capture is always separate from display (log everything, show little).
- **Phase 0 (safe to ship now, no policy change):** silent capture → a
  `localStorage` ring buffer; "Send diagnostics" via `mailto:` to
  support@quiznote.online + copy-to-clipboard. Nothing transmits automatically;
  the user's own email sends it → already covered by the privacy draft's
  "Voluntary contact" category.
- **Phase 1 (cloud, lawyer-gated):** auto-POST to Sentry-style SaaS or a Vercel
  endpoint. THIS is the step that turns on the new off-device flow → needs the
  PLANNED disclosures activated, the vendor listed as a sub-processor (+DPA),
  PII/nickname scrubbing, and a COPPA review (off/opt-in by default for kids).

**Decision rationale (legal posture).** A self-drafted, accurate,
conservative, beta-gated policy is the right pre-lawyer stance while we're
local-only with no/low users. The real liability is *inaccuracy*, not
authorship — so the rule going forward is a per-feature "does this touch
privacy/terms?" checkpoint (Share/export was the miss that prompted it). Get
counsel **before** flipping on any of: accounts/auth, cloud sync, payments,
child-data sync, or automatic error reporting.

**Still open / next:** build Phase-0 `qn-errors.js` when ready (additive, no
policy change). Effective/Last-updated dates intentionally NOT bumped — they
finalize at counsel sign-off per the drafts' own convention.

---

### Dashboard: mastery-rule explainer as a grape banner — May 2026

**Session type:** Small UX add, same thread as the recommender fix. Shipped to
`Dev` (`6621a02` caption → `f56a63a` banner).

**What.** Added a one-line explainer under the **Module mastery** heading on
dashboard.html so the medal rule is self-evident: *"Earn a medal by mastering
each level. Clear a level by scoring 85%+ accuracy in 2 rounds — your medal
shows the hardest level you've cleared: Bronze (Easy), Silver (Medium), Gold
(Tricky)."* Medal names are tinted to their ring colors.

**Styling decision.** First pass was a small muted caption inside the section
header; on Jonathan's call it became a **purple box mirroring path.html's
`.banner`** (the "Your Path guides; Practice never locks" guide box) for a
consistent look. Added `.mastery-note` (clone of `.banner`: `--grape-lt` bg,
2px `--grape` border, 14px radius, `--grape-dk` text, Fredoka bold lead) and
the `--grape-lt` token (dashboard had `--grape`/`--grape-dk` but not the light
tint). The note is a sibling of the section header, so unlike the old caption
it **shows on mobile too** (faithful to the path banner) — flagged as a
revisit-if-too-heavy item.

**Note.** The "85%+ in 2 rounds" copy intentionally states the canonical
per-round clear rule — the same rule the recommender/path were unified onto in
the sibling entry above.

---

### Recommender sent a Gold-mastered module back to Easy — tier-clear logic + three-way definition drift — May 2026

**Session type:** Bug report from device ("dashboard says Jump back in: Note
Names · Easy, but I have Gold on Tricky"; then "path's Your next step does it
too"). Shipped to `Dev` (commit `f62661e`).

**Symptom.** Note Names mastered to Gold (Tricky cleared), yet both the
dashboard "Jump back in" CTA and path.html "Your next step" card recommended
**Note Names · Easy**.

**Root cause.** Both surfaces call the same recommender, `QN.recommend.next()`
(qn-profile.js). Its helper `nextTierFor` walked tiers easy→medium→tricky and
returned the **first tier that wasn't "cleared," without checking whether a
harder tier was already cleared**. The user's Easy tier didn't meet the bar
(under-practiced / pooled accuracy < 85%), so the loop returned `easy` and
never noticed Tricky was done — directly contradicting the Gold medal.

**Definition drift (the deeper issue).** "Cleared/mastered" was defined in
**three** places that disagreed on **two** axes:
- *Per-tier rule:* dashboard `computeMastery` counted **rounds each ≥85%**
  (per-round); the recommender and path.html `moduleStatus` used **pooled
  accuracy ≥85%** over ≥2 rounds. These disagree on histories like
  [100%, 70%] (pooled passes, per-round fails).
- *Module-done rule:* the dashboard medal = **top tier (Tricky) cleared**;
  the recommender and path required **every** tier cleared.

**Fix (approved Tier 3 — shared file `qn-profile.js` + `path.html`).**
- `nextTierFor`: find the **highest** cleared tier, recommend the tier just
  above it; top tier cleared ⇒ module done (`null`) ⇒ recommender advances to
  the next module. Mastering a harder tier never sends you down.
- Unified the clear rule on the **canonical per-round** definition the medal
  already uses: `tierGood[tier]` = count of rounds scoring ≥ `TIER_UP_ACCURACY`,
  cleared = `tierGood ≥ MIN_ROUNDS_PER_TIER`. Added `tierGood` tracking + a
  shared `tierCleared()` in the recommender and in path.html's `rollup`.
- `path.html moduleStatus`: a module is "cleared" (✓ on the spine) when its
  **top** tier is cleared — matching the medal and the recommender.
- `dashboard computeMastery` was already the canonical rule — left unchanged;
  it's now the reference the other two conform to.

**Verified** with a recommender unit harness (`/tmp/rectest.js`, qn-profile.js
in a vm + seeded `qn_events`): (A) Tricky cleared / Easy under-practiced now
advances to piano-quiz, not Note Names·Easy; (B) only-Easy-cleared still
recommends Note Names·Medium (forward progress intact); (C) no events →
Note Names·Easy cold-start; (D) Easy with 1 good + 1 weak round → still Easy
(correctly needs 2 good rounds).

**Lesson / CLAUDE.md candidate.** "Mastered" is computed in 3 surfaces
(qn-profile.js recommender, dashboard `computeMastery`, path.html mirror).
They drifted because each re-implemented the rule. The durable fix would be a
single shared `QN.mastery` helper all three call; until then, any change to
the clear/advance rule must touch all three in one commit. Canonical rule:
**≥2 rounds each ≥85% per tier; module done when the top tier is cleared.**

**Still open / next:** consider extracting a shared `QN.mastery`
helper (recommender + dashboard + path all call it) to prevent future drift.

---

### Teaching hints dead on time-signatures & dotted-notes — cross-scope ReferenceError in hintKeyFor — May 2026

**Session type:** Single-bug diagnosis from a device report ("didn't get
teaching hints on the time-signature module"; then "dotted-notes too, but
accidentals/dynamics work"). Shipped to `Dev` (commit `4e48b2a`).

**Symptom.** On a wrong answer, no hint card ever appeared in
`time-signatures` and `dotted-notes`. Accidentals and dynamics were fine.

**Root cause — module-generation difference, not hint logic.** These modules
fall into two answer-handling generations, and the inline JS is split across
*separate* `(function(){…})()` IIFE blocks — a **renderer block** (exposes a
namespace: `TS` / `DN` / `M` / `R`) and a **game-loop block** (holds `state`,
`getHint`, `handleAnswer`, `hintKeyFor`).
- **Working generation (accidentals, dynamics):** uses `onCorrect/onWrong`,
  choices are objects with `.correct`, `state.current` is the full question
  object. Their `hintKeyFor` is either absent (accidentals → general hints)
  or reads `state.current.type` — an in-scope property. No cross-block
  reference, so nothing throws.
- **Broken generation (time-signatures, dotted-notes):** uses unified
  `handleAnswer(pickedKey, btn)`, choices are key-strings, `state.current =
  {key}`. Their `hintKeyFor` derived the hint category by calling a
  renderer-block symbol **bare** from the game-loop block:
  `decodeKey(state.current.key)` (time-signatures) and
  `SYMBOLS[state.current.key]` (dotted-notes). Those identifiers live in the
  *other* IIFE's closure, so the call was a `ReferenceError`. `getHint()`
  calls `hintKeyFor()` first thing, so the throw propagated up through
  `handleAnswer` on the first wrong answer and aborted it **before** the
  hint-card branch — silent failure, every time.

**Why it hid so well.** `getHint`, `showHintCard`, the hint overlay markup,
and the shared `.hint-overlay` CSS are byte-identical to working modules; all
scripts parse; init throws nowhere (DOM-mock init trace was clean). The bug
only manifests at the moment `hintKeyFor` runs — first wrong answer — which a
parser, a grep-by-name, and an init trace all miss. Caught by **driving a
real wrong-answer click in a DOM mock** (`/tmp/trace3.js`: full DOM/audio
shims + a probe injected inside the game-loop IIFE that calls the start fn,
fires a wrong choice's click listener, and reports `hint-overlay.hidden`).
Before: ReferenceError, overlay stays hidden. After: overlay opens with the
correct context-specific hint.

**Fix.** Use the accessors these files already use elsewhere for the same
symbols — `TS.decodeKey` (already used at time-signatures.html:1924) and
`window.DN.SYMBOLS` (already used at dotted-notes.html:1075/1150). Two
one-line changes:
- `time-signatures.html` hintKeyFor → `(state.current && TS.decodeKey) ?
  TS.decodeKey(state.current.key).type : null`
- `dotted-notes.html` hintKeyFor → `var sym = window.DN.SYMBOLS[state.current.key];`

**Scope audit.** All 13 `hintKeyFor` definitions checked: 11 read
`state.current.type`/`.mode` (in-scope, safe — articulation, chord-function,
circle-of-fifths, dynamics, ornaments, scale-degrees, scales,
score-navigation, tempo-markings, transposition, note-names). Only
time-signatures and dotted-notes reached across IIFE scope. No other modules
affected.

**Lesson / CLAUDE.md candidate.** When inline JS is split into multiple IIFE
blocks, any symbol shared between blocks MUST go through the exposed namespace
(`TS.`/`DN.`/`window.DN.`) — a bare reference compiles and parses fine but is
a runtime `ReferenceError` only on the code path that hits it. The
"init-trace is clean" heuristic does NOT cover handlers wired at runtime
(answer handlers built in `renderChoices`); to verify those, drive an actual
click, not just init.

**Still open / next:** unchanged from prior entries. Owed: device QA that the
hint card now renders correctly on real screens (mock confirms logic + the
`hidden` toggle, not pixels).

---

### Modules-page design system — skill-family tile colors + unified module order + dashboard color language — May 2026

**Session type:** Visual/UX system pass on `play.html`, `path.html`,
`qn-profile.js`, `dashboard.html`. Shipped to `main`.

**Skill-family tile colors (Option B).** Tile backgrounds were decorative/
random (only a loose ear≈coral pattern). Defined 5 soft skill-family tints
that repeat across all three tiers so a family reads at a glance:
`.th-ear` pink (#ffe6f1, the boldest — "listen"), `.th-read` slate (#e9eff9,
notation + score markings), `.th-rhythm` gold (#fff2cf), `.th-pitch` green
(#e4f3e0, keys/scales/intervals/transposition), `.th-harmony` grape
(#efe9fb, all chord modules). All 35 tiles reassigned by family. Decided via
a self-contained side-by-side mockup (`_mockups/play-tile-themes.html`,
Option A minimal vs B) sent for device review; Jonathan picked B.

**Unified, traditional module order across all three surfaces.** Previously
the modules page led with piano while the path buried it at #13, and Theory
analyzed chords (roman numerals) before building them (triads). New single
order now shared by play.html tiles, path.html PATH, and qn-profile.js
recommender PATH:
- Foundations: note-names → piano-quiz → piano-keyboard → ledger-lines →
  note-values → dotted-notes → ear-rhythm → time-signatures → accidentals →
  tempo → dynamics → articulation → score-navigation → ornaments
  (piano moved up — connect notes to the keyboard early)
- Reading: unchanged
- Theory: triads → triad-inversions → seventh-chords → primary-chords →
  roman-numerals → chord-function → chord-progressions → cadences → ear ×3
  (build chords before analyzing their function)

**Dashboard color language aligned.** Mastery-grid chips + ROSTER now use the
same 5 families as the tile tints (ear=pink, read=slate, rhythm=sun,
pitch=green, harmony=grape); added pink/slate/green to COLOR_HEX (saturated
chip versions). One color language app-wide.

**Bug found + fixed mid-task (good lesson):** the first attempt to reorder
play.html tiles used a whole-file "slot-swap" (reassign unit text at each
tile's file position). It corrupted placement — orphaned triads/triad-
inversions/seventh-chords OUTSIDE any section (floating between Reading's
close and the Theory header) and dropped note-names from the Foundations
grid. Root issue: position math across mismatched-length spans + comment
capture. **Fix + lesson:** reorder tiles PER SECTION — find each
`<div class="tile-grid">`'s exact close by counting div nesting, then reorder
only the units inside that grid. Verified by *physical* section placement
(Foundations 14 / Reading 10 / Theory 11), not just logical slug→tier
grouping (the logical check passed even while tiles were misplaced — a
reminder to verify rendered/physical structure, not just data).

**Still open / next:** unchanged from the prior entry (Transposition v1.1
staff-rendered answer tiles; Tier C Mock Exam Mode + Curriculum Mapping; PWA
install; optional scales rebuild). The tile-theme mockup lives in `_mockups/`
for reference.

---

### Latent brace-corruption hunt — app-wide bug fixes (freeze / toggles / hints / scales) — May 2026

**Session type:** Production bug-fix marathon, driven by device QA. Started
from a single report ("Ear: Chord Quality freezes") and uncovered a whole
class of latent bugs from a prior **bulk edit that misplaced braces** across
many modules' inline JS. None threw a *parse* error (the files looked fine
and committed clean), but the misplaced braces broke handler wiring, toggle
feedback, and hint display **at runtime**. All fixes shipped to `main`.

**The unlock (Jonathan's observation):** on a frozen screen the **home /
All-Modules links still worked but every `<button>` did nothing**. Native
`<a href>` navigation vs. JS-attached handlers — that's the signature of a
**JS exception during init aborting handler wiring**, not an audio or CSS
problem. (The first two hypotheses — iOS audio interruption, then a stale
`timer-toggle` — were partial/wrong; this reframing is what cracked it.)

**Diagnostic technique that pinned each bug: a Node DOM-mock harness.**
`/tmp/trace-any.js` parses a module, builds the set of real DOM ids, shims
`document`/`window`/`localStorage`/`QN`/`NH`/rAF, runs the inline scripts +
fires the captured `DOMContentLoaded`, and reports the exact throw + stack
line. This caught `syncPill is not defined`, the `_nh` guard false-positive
(fixed by returning `undefined` for `_`-prefixed props), `window.scrollTo`
gaps, etc. **Reusable for any future "buttons dead" report.** Caveat: it
verifies *no init throw*; it does NOT catch logic bugs (it missed the
`syncMuteUI` pill-orphan, which only broke visual feedback).

**Bugs found and fixed:**
- **9 modules frozen** — stale `els['timer-toggle']` handler (settings-card
  redesign replaced `#timer-toggle` with a Timer *row*). Unguarded
  `.addEventListener` on the now-missing element threw mid-init, killing the
  rest of wiring (incl. in-game X / mute). Fix: alias `timer-toggle`→
  `timer-row`, `timer-toggle-state`→`timer-pill-state` before first use.
  (ear-chords/-cadences/-progressions, cadences, chord-progressions,
  seventh-chords, triad-inversions, triads, piano-quiz.)
- **piano-quiz** — three separate issues, fixed in order: (1) corrupted
  `hideToast()` had lost its body+brace and **swallowed `syncPill`, `getHint`,
  `showHintCard`, `hideHintCard`** as nested functions → `syncPill` invisible
  to `setupStart` → `ReferenceError` froze everything; (2) unguarded
  `els['hint-got-it']` (piano-quiz has no modal hint card — it uses the
  guided key-find) threw; (3) `syncMuteUI` closed early so the sound-pill
  update was orphaned → start-screen Sound toggle gave no feedback.
- **Sound toggle broken app-wide (30 modules)** — the same `syncMuteUI`
  orphan: `if (els['sound-pill-state']) syncPill(..., !muted)` sat one line
  *outside* the function, so the start-screen Sound row changed mute state
  but never updated the pill (the in-game mute icon worked — it's inside the
  fn). Batch-fixed by moving the line back inside in all 29 (+piano-quiz).
- **Teaching hints never showed on wrong answers (8 modules)** — the
  Phase-4 chord/ear-harmony cluster had the hint machinery but `onWrong`'s
  first-miss branch only showed "Try once more!" and never called
  `getHint()`/`showHintCard()`. Wired the standard pattern in.
- **5 modules' Timer toggle inert** — guarded (so not frozen) but the guard
  always failed; same alias fix made the toggle work.
- **Ear: Chord Quality** — Easy padded answer tiles from all 4 qualities, so
  it showed Diminished/Augmented even though Easy only plays major/minor.
  Distractors now drawn only from the tier's qualities (Easy 2 / Med 3 /
  Tricky 4 tiles).
- **scales (the structural outlier) — three stacked latent bugs:**
  (1) it boots **inline** (every other module boots from DOMContentLoaded),
  so `initStartScreen` ran before the deferred `qn-audio.js` loaded and
  `A.setMuted(...)` threw → all start-page buttons dead. Fix: defer the boot.
  (2) it was **single-try** (wrong→reveal→next) and `onWrong` never showed a
  hint card, though `hideHintCard` was already wired to re-enable a retry —
  the conversion was started but never finished. Completed it: 2-try +
  clean-first-try scoring + hint card. (3) `showHintCard`/`hideHintCard`
  called **`pauseTimer`/`resumeTimer` which scales never defined** (it uses
  `startTimerIfNeeded`+`clearInterval`); never surfaced because the card was
  never shown. Defined proper pause/resume (preserve `timerRemaining`).

**Verification approach:** Node DOM-mock init traces for every touched
module (all clean); per-module inline-script parse checks; corruption
re-scans (e.g. all 29 `syncMuteUI` modules → 0 remaining); engine smoke
tests where logic changed (Ear: Chord Quality 6k/0). Device QA by Jonathan
confirmed each fix before shipping; `main` updated by fast-forward.

**Root-cause lesson:** a prior automated/bulk edit shifted braces by a line
in many modules — invisible to parsers and to grep-by-name, only caught by
executing init or diffing rendered behavior. Reinforces §8 "verify by
rendered result, not source." When a module's buttons are dead but links
work, suspect an init-time throw and run the DOM-mock trace first.

**Still open / next:**
- **scales rebuild (optional):** now patched and consistent, but it remains
  the legacy outlier (predates the template). A future "rebuild scales from
  the standard template" session would retire it permanently — schedule only
  if it keeps causing cross-file pain; not urgent.
- pianoquiz-demo init was a harness false-positive (the `_nh` guard) — the
  demo is fine.
- qn-audio.js iOS tweak (interrupted-state resume + node cleanup) kept as a
  harmless robustness improvement, though it was NOT the freeze fix.
- Standing pre-bug-hunt items unchanged: Transposition v1.1 staff-rendered
  answer tiles; Tier C (Mock Exam Mode, Curriculum Mapping); PWA install.

---

### Chord Function (#7) + Transposition (#8) — Phase 5 Tier B finished — May 2026

**Session type:** Two autonomous clone-and-swap module builds (queue #7, #8),
shipped to `main` (production) via clean fast-forward. Roster **33 → 35**.
Phase 5 Tier B is now complete (Circle of Fifths, Chord Function,
Transposition all live).

**Chord Function (Theory, #34) — `chord-function.html`.** Cloned from
`roman-numerals.html` (same key/chord data, new answer dimension: harmonic
*function* rather than chord name). Four question types:
- **categorize** — show a chord, name its function → 3 tiles
  (Tonic / Predominant / Dominant). The core type.
- **identify** — "which chord serves a Predominant function?" → 4 chord
  tiles. Distractors are drawn only from *other* functions so exactly one
  tile is correct (avoids the spec's two-valid-answers ambiguity).
- **motion** (Medium+) — name the two-chord harmonic motion (T→PD, PD→D,
  D→T, T→D) → 4 direction tiles.
- **exception** (Tricky, minor keys) — "why is V MAJOR in a minor key?"
  → "Raised leading tone (harmonic minor)" + 3 plausible-wrong reasons.

Function map (by scale degree, same for major/minor): I/i tonic, ii/ii°
predominant, iii/III tonic, IV/iv predominant, V dominant, vi/VI tonic,
vii° dominant. Reuses the major/minor/both selector. Engine smoke-tested
at 18k questions across tiers/modes, **0 failures**.

  *Post-ship polish (Jonathan reviewed live on Dev):* the staff now renders
  the **actual triad** (categorize + exception) via `qn-staff.js`
  `buildStaffWithChord` instead of inheriting Roman Numerals'
  key-signature-only staff. Triad = diatonic-third stack of the key's
  `roots` (so V is major in minor, vii° diminished, III+ augmented — all
  spelled correctly); chords needing a double accidental (sharpest minor
  keys, 9 of 210) fall back to a key-sig staff. The 3-tile categorize was
  rebalanced (two on top + third full-width) so it reads as deliberate —
  3 is the correct count (harmonic function has exactly three categories;
  a 4th would be musically wrong). identify/motion stay key-sig-only (no
  single subject chord).

  *Bug fixed:* inherited path-handoff key mismatch — Roman Numerals read an
  underscore key (`roman_numerals_settings`) that `path.html` never writes
  (it writes the hyphen-slug + short-prefix forms). Chord Function now reads
  `chord-function_settings` || `cfn_settings` (both forms path.html writes),
  so the launch-preset actually works.

**Transposition (Reading, #35) — `transposition.html`.** Cloned from
`intervals.html`. New transposition engine with correct pitch-spelling math
(letter-step + semitone arithmetic via NH.music; rejects results needing a
double accidental). Four question types:
- **interval** — transpose a note up/down a stated interval (M2, m3, M3,
  P4, P5, M6, octave).
- **instrument** (Medium+) — "Written for B♭ trumpet — what concert pitch
  sounds?" B♭ = down M2, F = down P5, E♭ = down M6. Distractors are the
  same written note via the *other* instruments.
- **direction** — name the transposition between two shown notes
  ("Up a perfect 5th"); distractors include the wrong direction.
- **melodic** (Tricky) — transpose a 3-note diatonic phrase; distractors
  shift one note by the wrong interval.

Engine smoke-tested at 31.5k questions across tiers/clefs, **0 failures**
(after fixing thin-distractor cases on the 2-interval easy tier and
chromatic melodic fragments — see below).

  *Design decision (Jonathan's call):* the spec wanted **staff-rendered
  answer tiles** (each answer a mini-staff). No module renders staves inside
  answer tiles — it's net-new visual machinery I couldn't pixel-verify from
  the sandbox. Offered staff-tiles (preview + QA, hold prod) vs **note-name
  tiles** (proven text-tile system, ships clean); Jonathan chose note-name
  tiles for v1. So: the *question* shows the note(s) on a staff (new
  in-module single/sequence renderer, reuses the inline interval renderer's
  geometry); the *answers* are note names like "D5", "B♭4". Staff-rendered
  answer tiles deferred to v1.1. **No audio in v1** (playing the notes would
  reveal the transposed answer) — Hear-it button hidden, mute-replay
  removed, feedback chimes kept.

  *Bugs fixed during build:* (1) easy `interval` only yielded 3 tiles — the
  2-interval easy tier ran the distractor pool dry; fixed by padding from
  all intervals + guaranteed octave-shift fallbacks via a `trPick4(correct,
  distractors, fallback)` helper. (2) melodic fragments came out chromatic
  (B–C♯–D♯) because a fixed semitone contour forced accidentals; rebuilt as
  three consecutive natural letters (diatonic). (3) thin direction/instrument
  distractor sets — comprehensive fallback pools per type.

**Verification approach (no browser in sandbox).** Both engines were
Node-tested by extracting `makeQuestion`/`buildTranspositionQuestion` and
running tens of thousands of questions with invariants (prompt present,
right tile count, exactly one correct, answer ∈ choices, no dup tiles, no
double-accidental pitches). The new renderers were exercised via a
Node DOM-string shim: Transposition's question staves and Chord Function's
`buildStaffWithChord` output (loading the real `qn-staff.js` v1.3.0) were
rendered to preview HTML, geometry-checked (notehead/stem/ledger counts),
and sent to Jonathan for device QA.

**Four surfaces** wired atomically for each module:
- Chord Function → Theory, after Roman Numerals: play tile (T→PD→D→T
  cycle), path.html MODULES/PATH/SHORT_PREFIX (`cfn_`), qn-profile.js PATH,
  index.html concept tag, dashboard.html META/ROSTER/4 skill labels.
- Transposition → end of Reading: play tile (note shifting up the staff),
  path.html MODULES/PATH/SHORT_PREFIX (`tr_`), qn-profile.js PATH,
  index.html concept tag, dashboard.html META/ROSTER/4 skill labels.

**Still open / next:**
1. **Transposition v1.1** — staff-rendered answer tiles (the deferred
   spec vision); the new in-module note renderer already produces the
   needed SVG, so the work is a choice-tile rendering layer + choice-model
   change from string-labels to pitch objects.
2. **Queue Tier C** — Mock Exam Mode (#9; Phase A = QNM contract audit
   across all 35 modules) and Curriculum Mapping Overlay (#10; generic v1
   shippable, named-method version Tier-3/lawyer-gated).
3. **Queue Tier D** — C Clefs (#11, Tier-3 renderer extension),
   Construction-mode engineering (#12, Tier-3), Build-a-X cluster (#13),
   Non-Chord Tones (#14, audience-cap borderline).
4. **PWA install** on the landing page (own session).
5. **Device QA** owed on the CoF wheel/tile, Chord Function chord-staff +
   3-tile layout, and the Transposition staves.

---

### Circle of Fifths module (Reading #33) + flagship play-tile redesign — May 2026

**Session type:** New module build (autonomous clone-and-swap, queue #6) +
visual polish. Both shipped to `main` (production) via clean fast-forward
of `origin/main` to Dev. Roster **32 → 33**.

**Circle of Fifths — the build.** Cloned from `tempo-markings.html`. This
re-opens the May 2026 §5 cut (the gap analysis judged its absence a
coverage hole). Two pieces of new machinery, both kept in the module file
(no shared-file changes, per the queue note):
- **Wheel renderer** (`NH.render.renderWheel`) — a single SVG wheel drawn
  fresh per question into `#term-wrap`. 12 outer major wedges + 12 inner
  relative-minor wedges, clockwise from C at 12 o'clock, using annular
  `sector(ri,ro,d1,d2)` + `polar(r,deg)` math. The game loop passes a
  "view" `{ scope:Set, showMinors, active, activeRing, mark, activeEnh }`
  and the renderer just draws it. Active seat = teal fill + `cofGlow`
  drop-shadow; enharmonic relabel swaps `seat.enh` spelling. Cream hub
  reads "♯ clockwise / ♭ counter."
- **Question engine** — 5 types: **position** (highlight a seat, name the
  key), **count** (key → how many sharps/flats), **neighbor** (one step
  CW/CCW), **relative** (relative minor), **enharmonic** (Tricky only;
  the bottom-three F♯=G♭ / C♯=D♭ / B=C♭). Scope reuses Key Signatures'
  5/9/12 sets per tier; type weights shift by difficulty (enharmonic only
  at Tricky). Hints keyed by the 5 types via `hintKeyFor()`.

**Bug fixed during build — count distractors ran dry for C major.** The
`count` type built distractors from opposite-type-same-count + same-type
neighbors only. For C (0 accidentals) that yielded just `1 sharp` /
`2 sharps` → 3 tiles, not 4. Root cause: no fallback across accidental
types for thin keys. Fix: a `fmtCount(n,type)` helper feeding a priority
candidate pool (opposite-same-count → same-type ±1/±2 → opposite-type
±1), deduped, that always produces ≥3 distinct distractors. Found by a
Node smoke test (extract `makeQuestion`, run 12k questions across tiers);
post-fix **0 failures** — every question has a prompt, 4 distinct tiles,
exactly one correct, answer matches a tile, and a valid wheel view.

**Four-surface wiring (atomic), placed after Key Signatures in Reading:**
`play.html` tile · `path.html` MODULES + PATH + SHORT_PREFIX (`cf_`) ·
`qn-profile.js` recommender PATH · `index.html` "Circle of fifths" concept
tag on the Reading spine (index is a concept spine, not module tiles, so
no href/slug) · `dashboard.html` ROSTER + MODULE_META + 5 skill labels.
Module inherits all shared layers from the clone (teaching hints, settings
card, profile defaults, 2-try retry) for free — it's the 33rd module
carrying them, no per-module re-author needed.

**Play-tile redesign (the "make it great" pass).** First tile was a sparse
dotted ring with "F C G / 5ths" crammed at top + a "Find the key" chip —
read as empty/amateur next to the colorful staff tiles. Jonathan's
direction: a *real* wheel with a `?` in one seat, like the in-game
position question, plus animation. Rebuilt as a full segmented wheel:
all 12 keys, **teal sharps clockwise / grape flats counter / gold C** at
12 o'clock (the actual sharps-vs-flats pedagogy), white seat dividers,
cream hub with a clockwise arrow, purple pointer at C. One seat (A♭) is
the live question: teal fill with `anim-blink` (teal↔bright-teal glow) +
`cofTileGlow` halo, white `?` glyph on `anim-pulse` (gentle breathe).
Dropped the prompt chip — the `?` IS the gameplay preview. Geometry
generated by a script mirroring the module's own `polar`/`sector` math,
so the tile and the live wheel share one coordinate system. Animation
classes reused from play.html (`anim-blink`, `anim-pulse`) — no new CSS.

**Verification.** Engine 12k/0-failures (above); all touched HTML inline
scripts parse; `circle-of-fifths.html` CSS braces 142/142; tile region
tag-balanced (`<a>`/`<svg>`/`<defs>` all matched), whole-file 33/33 svg.
No headless browser in the sandbox, so the wheel + tile were rendered via
a Node DOM shim into preview HTML and sent to Jonathan for device QA
(geometry invariants checked programmatically: 24 wedges + hub + pointer,
exactly one glowing active seat, `?` only on position, F♯→G♭ enharmonic
relabel, minors shown on relative).

**Leftover-clone cleanup.** `pushHistory` had tempo-specific label
branches (`.pair` / `.bpm`) — simplified to `state.current.answer` (the
key/spelling). Inert tempo carryover left in place because it never runs:
the `hear-btn` is hidden and its handler early-returns on
non-`metronome`; `playMetronome` stays exported but unused. `pq_muted` is
the inherited shared mute key (tempo-markings + others use it) and CoF
*does* play feedback chime/boop/fanfare/tick, so the Sound setting is
live — left as-is.

**Decisions (Tier 1/2, made autonomously per the module-build rule):**
single-ring wheel on the tile (two rings illegible at 116px); `?` seat at
A♭ (lower-left, contrasts the teal highlight against purple flats); tile
on `bg-teal`; module color `grape` in dashboard meta (Reading palette).

**Still open / next (unchanged by this session):**
1. **Queue #7 Chord Function** — clone of Roman Numerals, different
   categorization axis (T/PD/D). Reuses `buildStaffWithChord`. Autonomous.
2. **Queue #8 Transposition** — constrained 4-button MC v1; new instrument
   labels, kept in-module. Autonomous.
3. **PWA install** on the landing page (own session) — manifest, Apple
   touch icons + meta across modules, `beforeinstallprompt`.
4. **Visual QA on real devices** for teaching hints + settings card +
   onboarding (structural passed; pixel QA owed) — now also the CoF wheel
   + tile.
5. Adult/child profile UI (lawyer-gated); monetization track; landing
   pillars Pillar-1 title dup.
6. Standing visual-calibration items: time-signatures `accStartX:72`,
   time-signatures prompt-layout, scales tile reconciliation.

---

### Guided key-find (flagship) + teaching-hint bug trilogy + promo modal + ship to prod — May 2026

**Session type:** Bug fixes + flagship UX feature + production deploy.
Continuation of the dashboard session. Everything below shipped to
`main` (production) at the end of the day via a clean fast-forward of
`origin/main` to Dev (59 commits, nothing lost). The
`claude/teaching-modules-strategy-Q5H6g` branch was deleted (its tip
was fully contained in Dev/main).

**Teaching-hint bug trilogy (all 32 modules).** Reported via Dotted
Notes ("got 3 wrong, no teaching prompts"). Three distinct bugs:
1. **attempts never reset per question** (5 note-values-family modules:
   dotted-notes, note-values, time-signatures, key-signatures,
   ear-rhythm). `nextQuestion` reset `locked` but not `attempts`, so
   after the first answer `attempts ≥ 1` and every later wrong answer
   jumped straight to reveal — no hint. Only Q1 could ever show one.
   The earlier retry-add script had patched only `startGame`. Fixed
   `nextQuestion`.
2. **getHint exhausted too early.** It picked ONE random HINTS key and
   returned null if that key was used up, even when other keys had
   hints; single-key modules went silent after 2 wrong answers. Rewrote
   to gather across all keys and cycle/reset when exhausted. Added the
   missing per-round `shownHints` reset (25 modules).
3. **Hints not relevant to the question** (a tie hint on a single
   quarter note). Added context-aware selection: `getHint` calls an
   optional `hintKeyFor()` returning the current question's category.
   Wired for 10 modules where hints describe distinct content:
   dotted-notes (dotted/tied/plain via SYMBOLS), dynamics / tempo /
   articulation / ornaments / score-navigation (`state.current.type`),
   scale-degrees (type), time-signatures (`decodeKey().type`), scales
   (mode→key map), note-names (clef). Concept-level modules (intervals,
   accidentals, roman-numerals, primary-chords, key-signatures, all
   single-skill) stay general — their hints apply to every question;
   `getHint` falls back to all hints.

**Guided key-find — the flagship feature (Piano Quiz).** Built on
`pianoquiz-demo.html` first, then ported to `piano-quiz.html`. When the
user must locate and press a specific key (after a 2nd wrong answer, or
after using a Hint), the game now guides them there:
- **Banner** at top of keyboard: "Find and play the highlighted key to
  continue" with a bobbing arrow.
- **Persistent glow** — the correct key glows teal and stays until
  pressed (the hint's old 1.5s auto-clear was useless if the key was
  scrolled off-screen — removed).
- **Directional edge halo** — a pulsing teal gradient + arrow (‹ / ›)
  on the left/right edge of the keyboard pointing toward the off-screen
  target key. Recomputed on scroll via `getBoundingClientRect`; fades
  the moment the key enters view.
- **Middle C indicator suppressed while guiding** (`.kb-frame.guiding
  .mc-ind { display:none }`) so the edges show ONE clear cue.
- Reveal mode: tap the glowing key to advance. Hint: glow + guide
  persist until the next tap. Both clear on next question.
- **piano-keyboard.html intentionally NOT changed** — it uses
  letter-button answers (keyboard is the question display, not the
  input), so there's no press-to-reveal flow to guide.
- Controller: `keyGuide` state + `showKeyGuide` / `hideKeyGuide` /
  `updateKeyHalo`, wired into onWrong-reveal, the hint handler, the
  revealing branch of `handleKeyTap`, a normal-tap guard, the
  keyboard scroll listener, and `nextQuestion` cleanup.

**Calendar refinements (dashboard).** Settled the streak calendar:
calendar-month view (not rolling 4 weeks), Sunday-start week (US /
Apple Calendar convention), two colors only (practiced vs not). The
alignment saga: grid wasn't cleared between redraws (style switch
duplicated labels); grid-column-start on day 1 backfired (auto-flow
filled the empty columns before it); final fix = pad cells + grid
clear on each draw.

**Demo promo modal redesign.** Smaller card (440→380, tighter
padding/fonts). Fixed overlapping CTA + Play again buttons — the CTA is
an `<a class="btn">` and `.btn` never sets `display`, so it was inline;
`width:100%` and `margin-bottom` were ignored, dropping it onto the
same line box as the replay button. Set `display:block` on both.
Removed "No ads. Free during beta." and "More modules coming soon!".
Hook copy → "No ads. Stay focused. Track your progress."

**Other:** play.html header shortened to "Ready to practice?".
Onboarding level-detail max-height bumped to fit the practice-goal row.

**Production state:** `main` now has the full body of work from this
multi-session arc — teaching hints (engine + content + context-aware),
2-try retry universal, settings card, onboarding toggles, profile
defaults, the progress dashboard (streak visualizations, practice goal,
mastery grid, weak spots, trend, share/PDF), and the guided key-find on
Piano Quiz.

**Still open / next:**
- Visual QA on real devices (ongoing, owned by Jonathan).
- Standing build queue: Circle of Fifths (#6), Chord Function (#7),
  Transposition (#8).
- PWA offline (last pre-monetization item).

---

### Dashboard iteration — streak visualization, PDF, share, simplification — May 2026

**Session type:** Feature iteration. Multiple rounds of build-test-refine
on the progress dashboard, share system, and streak visualization.

**Streak visualization (shipped):**

Three switchable styles on the dashboard, selectable via 📅 ⭕ 🔥 buttons:
- **Calendar** — binary heat grid (teal = practiced, empty = didn't) +
  3 stat cards (streak/week/month) + week dot row showing this week's
  progress.
- **Rings** — Apple Watch-style concentric SVG rings. Daily streak
  (inner/red), weekly consistency (middle/teal), monthly total
  (outer/purple). Center shows streak count.
- **Flames** — stacked tiers with gradient progress bars. 🔥 daily
  streak, 🏆 this week's goal, 👑 this month's consistency.

All three are **goal-aware**: weekly fills to the student's practice
goal, not a fixed 7. Stored as `streakStyle` on profile. Student
picks their favorite and it persists.

**Practice goal (shipped):**

User-configurable weekly practice goal (3 / 5 / 7 days). Set during
onboarding (beginner = 3, intermediate/advanced = 5) and adjustable
anytime from the dashboard via inline "Goal: X days" picker.

Stored as `practiceGoal` on profile (additive, absent = 5). All
streak visualizations fill relative to the student's personal goal.
"4 of 5 days" (80% ring) vs "4 of 7 days" (57% ring) — the
difference between motivation and discouragement.

**Design decision (locked):** the goal lives on the dashboard, not
the profile. The setting belongs where the data is. See streak →
want to adjust → tap right there. One screen, zero navigation.

**Calendar simplified to binary:**

Dropped the 4-level intensity (1-2 rounds / 3-5 / 6+). Now binary:
teal = practiced, empty = didn't. The calendar's job is consistency,
not volume. The stat cards handle the numbers. Simpler for students,
cleaner on PDF and social cards.

**Share system rebuilt:**

- "Share as image" renamed to "Share to social"
- Opens a dark overlay picker with 3 swipeable canvas-rendered cards:
  - Card A (light) — streak hero, mastery rings
  - Card B (dark) — tier progress bars
  - Card C (warm) — achievement highlights
- All use system-ui fonts (always available, no loading issues)
- Dot indicators, scroll-snap, Share → button exports selected card
  via navigator.share (mobile) or PNG download (desktop)

**PDF rebuilt as Option B:**

Multiple iterations to get to one page. Final approach:
- @page letter with tight margins
- Inline hero stats (horizontal, compact)
- Mastery as tiny inline pill tags with 8px colored dots
- SVG rings hidden in print, replaced with CSS border dots
- Hides trend chart, weak spots, picker overlay
- Option B two-column layout from mockups

**Instruments and practice log removed:**

Mid-session simplification. The instrument selector on the profile
and the self-reported practice log were overbuilt. Stripped:
- `instruments` field from profile create/update
- Entire `practiceLog` API from qn-profile.js
- Instrument selector CSS, HTML, JS from profile.html
- Interactive tappable calendar + instrument picker from dashboard

The calendar became a pure read-only visualization of QuizNote
activity. Zero friction, zero manual input. The app tracks usage
automatically.

**Landing page updated:**

"Why QuizNote" pillars expanded from 2 to 4:
- No filler (existing)
- Curriculum-aligned (existing, copy tightened)
- Teaches, not just tests (NEW — teaching hints)
- See your progress (NEW — streaks, mastery, Practice Notes)

**Profile schema additions (all additive, no migration):**

- `practiceGoal` (3/5/7, default 5) — weekly practice target
- `streakStyle` ('calendar'/'rings'/'flames', default 'calendar')

**Strategic decisions documented (not yet built):**

- Practice Notes = the shareable export name ("Practice Notes by
  QuizNote"). Dashboard = "My Progress."
- Share via device-native share sheet only (no email from app, no
  privacy exposure)
- Teacher practice tracking deferred — was overbuilt, calendar
  handles it via binary QuizNote activity
- Instrument feature deferred — was adding noise before core
  value was solid

**Mockups created:**
- `_mockups/practice-notes-v2.html` — PDF + 2 social card options
- `_mockups/practice-notes-pdf-v3.html` — 3 one-page PDF layouts
- `_mockups/practice-notes-export.html` — original export mockups
- `_mockups/streak-visualization.html` — 3 streak style options

**Still open / next:**
- Visual QA on real devices (dashboard, streak styles, PDF, social
  cards, teaching hints, settings card, onboarding)
- PDF one-page verification (needs real-device testing with data)
- Social card visual quality check
- Build log / project doc updates for streak + goal + share
- Standing build queue: Circle of Fifths (#6), Chord Function (#7),
  Transposition (#8)

---

### Progress dashboard built + Practice Notes + strategic planning — May 2026

**Session type:** Feature build + UX design + strategic planning.

**Dashboard redesign shipped (dashboard.html — full rewrite):**

1. **Hero stat row** — streak (consecutive days, any 1 round = streak
   day), practice time, modules mastered (Gold count / 32). Animated
   count-up with staggered delays. Subtle 3-note ascending chime on
   page load.
2. **Streak calendar** — 5-week GitHub-style contribution grid, 4
   intensity levels, tooltips on tap, today outlined.
3. **Your next step** card — powered by `QN.recommend.next()`, shows
   recommended module + tier + reason. Icon by type (cold-start /
   progress / remediation / review).
4. **Up next on your path** — horizontal scrollable tiles showing
   next 3-4 unmastered modules after the recommendation.
5. **Weak spots card** — top 4 weakest sub-skills (< 80%, 5+ attempts),
   tappable rows link to module.
6. **Accuracy trend** — weekly aggregation (was per-round), "this week
   vs last week" comparison label, Y-axis labels.
7. **Mastery grid** — 32 modules in Foundations/Reading/Theory sections,
   collapsible with summary ("5/14 mastered · 8 started"). Progressive
   rings: Untouched → Started → Bronze (Easy 85%+) → Silver (Medium
   85%+) → Gold (Tricky 85%+). Gold cards shimmer. Tappable to expand
   per-tier accuracy breakdown.
8. **Back link** — "← All modules" to play.html restored.

**Mastery definition (locked):** Progressive Bronze/Silver/Gold.
85%+ accuracy across 2+ rounds at a tier = cleared. Matches the
recommender's existing advance rule. Easy = Bronze, Medium = Silver,
Tricky = Gold.

**Streak definition (locked):** Any 1 completed round in a calendar
day. Lowest friction — Duolingo model. Habit metric, not effort metric.
Edge case: if not played today, yesterday's streak stays "active"
until tomorrow (don't punish busy days).

**Practice Notes — the shareable output:**

Name: **Practice Notes by QuizNote.** The dashboard page stays
"My Progress" (what you look at). Practice Notes is what you hand
to someone (the export). Different jobs, different names.

**Share mechanism:** Device-native share sheet (no email from app).
QuizNote generates the asset (PDF or image), hands it to the OS.
No teacher email collection, no backend email service, no privacy
exposure. One privacy policy line covers it.

**Mockups created** (`_mockups/practice-notes-export.html`):
- Share button placement (next to "My Progress" title)
- PDF layout (8.5x11 letter — hero stats, streak calendar, focus
  areas, full mastery grid by tier, branded header/footer)
- Social share card (4:5 Instagram ratio — bold stats, 32 mastery
  rings, branded footer)

**Strategic items flagged (not yet built):**

**Share button design (needs work).** Current mockup is too basic
(plain pill). Should use a recognizable share icon (iOS square-with-
arrow or Android triple-dot-arc). Possibly a dropdown with: Save as
PDF / Share image / Print, each with a recognizable icon.

**Multi-instrument Practice Notes (Tier 3 — scope discussion).**
A student who plays piano AND violin could have separate Practice
Notes cards, swipeable on the dashboard. Each instrument tracks its
own practice independently.

**Architecture decision (Jonathan's, approved in conversation):**
Profile owns the instrument list. `instruments: []` as an additive
field on the profile (absent = feature off). If empty → no instrument
cards, no practice log, just QuizNote module data. If populated →
swipeable cards per instrument + practice checkboxes. Profile page
gets an instrument selector (free-text or dropdown of common
instruments). The profile becomes the master source for whether
the instrument/practice-log feature is active.

**Teacher practice log (self-reported, dashboard-only):**
A "mark I practiced" checkbox system on the dashboard. Student logs
that they completed a teacher-assigned lesson — just a date +
optional one-line note + checkmark. NOT exported to the PDF — the
PDF shows only verified QuizNote data. The practice log is the
self-reported supplement visible only on the dashboard.

**Privacy model (locked for share features):**
- Device-native share sheet = no email from app
- QuizNote never sees the recipient's identity
- PDF/image contains only on-screen-visible data (no device IDs,
  profile UUIDs)
- For child profiles: parent taps Share (existing adult-owner model)
- Privacy policy one-liner: "You may export your progress data as
  a summary document and share it using your device's built-in
  sharing features. QuizNote does not control or access the sharing
  destination."
- Teacher accounts explicitly deferred — the share button gets 80%
  of the value at 5% of the complexity

**Still open / next:**
- Visual QA on real devices (dashboard + all teaching hints changes)
- Share button build (after mockup refinement)
- Teacher practice log build (after instrument model is specced)
- Multi-instrument profile field (Tier 3 spec needed)
- Build log / project doc updates for dashboard
- Landing page marketing update (post-dashboard)
- Standing build queue: Circle of Fifths (#6), Chord Function (#7),
  Transposition (#8)

---

### Dashboard polish + streak visualization + hint bug fixes — May 2026

**Session type:** Iteration. Multiple build-test-refine rounds on the
dashboard, streak visualization, share outputs, calendar, and the
teaching hints engine.

**Streak visualization (shipped):** Three switchable styles, student
picks via 📅 ⭕ 🔥 buttons, stored as `streakStyle` on profile:
- **Calendar** — binary heat grid (teal = practiced, tan = not),
  calendar-month view, Sunday-start week, + 3 stat cards
  (streak/week/month) + week dot row.
- **Rings** — Apple Watch concentric SVG (daily/weekly/monthly),
  goal-aware fills, center streak count.
- **Flames** — stacked tier bars (🔥 streak, 🏆 weekly goal,
  👑 monthly), gradient fills, best-ever streak.

**Practice goal (shipped):** User-set weekly target (3/5/7 days),
stored as `practiceGoal` on profile. Set in onboarding (beginner = 3,
others = 5), adjustable inline on the dashboard via "Goal: X days"
picker. All streak views fill relative to the goal — "4 of 5" not
"4 of 7." Industry standard (Duolingo/Peloton/Headspace) — nobody in
music-theory space does this. Goal lives on the dashboard (where the
data is), not the profile.

**Calendar iterations (resolved):**
- 4 weeks → calendar-month view (May 1–31) with proper week alignment.
- Sunday-start week (S M T W T F S) to match Apple Calendar / US
  convention. firstDow = getDay() directly.
- Fixed misalignment: grid wasn't cleared between redraws (style
  switch duplicated labels). Then tried grid-column-start on day 1 —
  backfired (CSS auto-flow filled empty columns before it). Final fix:
  pad cells before day 1 + grid clear on each draw.
- Binary colors only (practiced vs not). Dropped intensity shades and
  the future-day light treatment — a day either has practice or it
  doesn't; today's outline marks the boundary.

**Share system rebuilt (shipped):**
- "Save as PDF" — one-page print stylesheet (Option B from mockups):
  inline hero stats, calendar, mastery as tiny pill tags. Hides trend/
  weak-spots/chrome. Branded "Practice Notes by QuizNote."
- "Share to social" — dark overlay picker, 3 swipeable canvas cards
  (A light streak-hero, B dark tier-bars, C warm highlights). Exports
  via navigator.share (mobile) or PNG download. system-ui fonts (no
  load issues).
- Share data reads from computed `_shareData` (robust across all
  views), goal-aware: Card C shows "Goal hit! X of Y" when met.
- Privacy: device-native share only, no email from app, no recipient
  PII. One privacy-policy line covers it.

**Dashboard de-duplication (shipped):** Removed "Up next on your path"
tiles and slimmed the next-step card to a single "Jump back in" CTA.
path.html owns "what's next"; dashboard owns "how am I doing."

**Naming:** Dashboard page = "My Progress." Shareable export =
"Practice Notes by QuizNote" (feature name hero, brand as byline).

**Teaching hints — three bugs found and fixed (all 32 modules):**
1. **attempts never reset per question** (5 note-values-family modules:
   dotted-notes, note-values, time-signatures, key-signatures,
   ear-rhythm). nextQuestion reset `locked` but not `attempts`, so
   after the first answer attempts ≥ 1 and every later wrong answer
   jumped straight to reveal — no hint. Only Q1 could ever show one.
   The retry-add script had only patched startGame. Fixed nextQuestion.
2. **getHint exhausted too early / picked one random key.** Returned
   null when the random key was used up even if other keys had hints;
   single-key modules (dotted-notes) went silent after 2 wrong answers.
   Rewrote to gather across all keys and cycle/reset when exhausted.
   Also added per-round `shownHints` reset (was missing in 25 modules).
3. **hints not relevant to the question** (the tie-hint-on-a-single-
   quarter-note bug). Added context-aware selection: getHint calls an
   optional `hintKeyFor()` returning the current question's category.
   Wired for 10 modules where hints describe distinct content:
   dotted-notes (dotted/tied/plain via SYMBOLS), dynamics/tempo/
   articulation/ornaments/score-navigation (state.current.type),
   scale-degrees (type), time-signatures (decodeKey type), scales
   (mode→key map), note-names (clef). Concept-level modules (intervals,
   accidentals, roman-numerals, primary-chords, key-signatures, all
   single-skill) stay general — their hints apply to every question.

**Other:** play.html header shortened to "Ready to practice?". Landing
pillars expanded 2→4 (added "Teaches, not just tests" + "See your
progress"). Onboarding level-detail max-height bumped to fit the
practice-goal row.

**Reverted mid-session (overbuilt):** instrument selector on profile +
self-reported practice log + interactive tappable calendar. Stripped
back to a read-only QuizNote-activity calendar. `instruments` field
and `practiceLog` API removed from qn-profile.js.

**Profile schema (additive, no migration):** `practiceGoal` (default 5),
`streakStyle` (default 'calendar').

**Still open / next:**
- Standing build queue: Circle of Fifths (#6), Chord Function (#7),
  Transposition (#8).
- PWA offline (last pre-monetization item).
- Visual QA owned by Jonathan, ongoing.

---

### Progress dashboard strategy conversation — May 2026

**Session type:** Strategic planning (no code). Conversation about
upgrading dashboard.html from basic stats to a competitive progress
visualization system, plus downstream considerations.

**Current state of dashboard.html:** Functional but basic. Shows per-module
round counts, best scores, weakest sub-skills breakdown. "Here's what
you've done," not "here's how you've grown."

**Target state (discussed, not yet specced):**

1. **Hero stat row** — current streak (days), total practice time, modules
   mastered. The three numbers a parent screenshots and sends to a teacher.
2. **Accuracy trend chart** — weekly accuracy across modules, showing
   improvement over time. Visual proof the app works. Sparkline or simple
   bar chart per module.
3. **Module mastery grid** — 32 modules as cards with progress rings
   (untouched → Easy cleared → Medium cleared → Tricky mastered).
   Color-coded: gray/teal/gold.
4. **Streak calendar** — GitHub-style contribution grid or simple "X days
   this week" view.
5. **Weak spots card** — recommender's weak-spot data surfaced visually
   ("Focus areas: Key Signatures 62%, Intervals 71%").

**Key insight:** All data already exists in `qn_events`. Every round's
module, tier, score, duration, timestamp, and sub-skill breakdown are
collected. The recommender already computes weak spots. The dashboard
is pure UI work on top of existing data — no schema changes needed.

**Build cost:** Medium. Single-file redesign of `dashboard.html`, no
shared file changes, no module changes. Probably one solid session.

**Downstream items flagged (not yet actioned):**

**Landing page marketing update (queued).** Once the dashboard ships,
the landing page should surface the progress visualization as a selling
point. The teaching hints layer and the progress dashboard together
close the two biggest competitive gaps (no teaching, no visible progress).
Landing copy should reflect both. Own task, not bundled with the
dashboard build.

**Terms and privacy update (Tier 3, lawyer territory).** When cloud
storage ships and we start persisting user progress server-side, the
terms and privacy policy need updating to cover: what learning data
we collect, how we use it (to improve the product, surface progress,
power recommendations), what we DON'T do (sell it, share it with
third parties, use it for advertising). This is especially sensitive
for child profiles under COPPA/GDPR-K/UK-AADC. The current privacy
policy drafts (privacy.html, terms.html) were written for the
localStorage-only era. Cloud sync + analytics = a material scope
change for the legal docs. **Gate:** lawyer review before any
cloud-synced learning data goes live.

**"Share with your teacher" — the AVS model (Tier 3, flagged for
future spec).** Rather than building teacher accounts (which opens
a massive can of privacy worms — FERPA, institutional data agreements,
role-based access, multi-tenancy), build a **learner-initiated share
button** that generates a printable/shareable progress summary. Model:
the AVS (After Visit Summary) in medicine — the patient gets a
document they can hand to anyone they choose. The learner (or parent)
decides what to share and with whom.

Possible formats:
- **Print-friendly summary page** — "Emma's QuizNote Progress" with
  mastery grid, accuracy trends, practice time, streak. Styled for
  paper. The learner taps "Share my progress," gets a clean printable
  view they can screenshot, print, or save as PDF.
- **Social media share card** — a generated image (canvas → PNG) with
  the hero stats and mastery grid. "I've mastered 12 of 32 modules
  on QuizNote!" Share to Instagram/Twitter/etc.
- **Teacher share** — same summary, framed as "show this to your
  teacher." No teacher account needed. The teacher sees a static
  snapshot, not a live dashboard. No ongoing data access.

**Privacy considerations for share features:**
- Learner-initiated = no FERPA concern (the student/parent is choosing
  to share, not the platform pushing data to a teacher).
- Social media share must not include the learner's real name unless
  they explicitly type it — use the nickname by default.
- Child profiles (under 13) should require parent approval for any
  share action. This aligns with the existing adult-owner/child-profile
  schema in `qn-cloud.js`.
- Generated share images should not include device identifiers,
  profile IDs, or any data beyond what's visible on-screen.
- **Lawyer review needed** before any share feature ships for child
  profiles. Adult-only share could ship without legal gate.

**Teacher accounts — explicitly deferred.** A "teacher dashboard"
that shows a class of students' progress would require: FERPA
compliance (US), institutional data processing agreements, role-based
access control, multi-tenancy, teacher onboarding flow, class/roster
management, and ongoing data access consent from parents. This is a
separate product track, not a feature. Deferred indefinitely — the
AVS-model share button gets 80% of the value at 5% of the complexity.

**Still open / next:**
- Spec the progress dashboard (single file: dashboard.html redesign)
- After dashboard ships: landing page marketing update
- After cloud sync ships: terms + privacy update (lawyer-gated)
- Share button: spec after dashboard ships (depends on what data
  is visualized)
- Standing build queue unchanged: Circle of Fifths (#6), Chord
  Function (#7), Transposition (#8)

---

### Session 3 — Teaching hints layer + settings card redesign — May 2026

**Session type:** Feature build + UX redesign. Largest cross-cutting
feature since the shared-CSS extraction. Touched all 32 module files,
profile.html, qn-profile.js, and qn-theme.css.

**Major deliverables:**

1. **Teaching hints engine (all 32 modules).** When a student answers
   wrong, a contextual teaching hint card appears before the retry
   attempt. Pop-up modal on all screen sizes (mobile and desktop —
   the desktop inline banner variant was prototyped and rejected in
   favor of consistency). Hint explains WHY the answer is wrong, not
   just WHAT the correct answer is. Student taps "Got it" then gets
   their second try with that knowledge fresh. Timer pauses during
   hint display. Same hint never shown twice per round (frequency cap
   via `shownHints` Set). Graceful fallback: if no hint exists for the
   current question type, falls through to plain retry.

2. **Teaching hint content authored for all 32 modules.** 2-3 hints per
   question type per module. Foundations: staff reading mnemonics,
   duration arithmetic, meter rules, accidental definitions, Italian
   tempo/dynamics terms, articulation effects (including tie vs slur),
   navigation markings, ornament identification. Reading: key signature
   rules, scale interval patterns, scale degree names, mode
   characteristics, interval quality/counting, ear training strategies.
   Theory: chord quality by interval structure, Roman numeral conventions,
   inversions, seventh chords, progressions, cadences, ear training for
   harmony. All hints follow the music theory accuracy rules.

3. **2-try retry extended to all 32 modules.** The 8 modules that
   previously went straight from wrong to reveal (Note Values, Dotted
   Notes, Time Signatures, Key Signatures, Chromatic Scale, Scale
   Modes, Ear: Rhythm, Ear: Scales) now have the same retry mechanic
   as the other 24. Every module: wrong → hint card → second try →
   reveal on second miss.

4. **Settings card redesign (all 32 modules).** Replaced the separate
   timer toggle pill + hints toggle pill + muted checkbox with a single
   grouped settings card containing three rows: Timer, Teaching hints,
   Sound. Uses pill-state indicators (on/off). Timer row expands the
   30s/45s/60s pills inline when toggled on. Design chosen from a
   4-option mockup (Option C: grouped card + pill states). Industry
   standard pattern — groups secondary preferences into a visually
   quiet cluster below the primary tile selectors and above the CTA.
   Mockup at `_mockups/start-screen-settings.html`.

5. **Onboarding interactive toggles.** Level selection now shows
   interactive difficulty (Easy/Med/Tricky) and teaching hints (On/Off)
   pill toggles when a level is selected. Defaults change based on
   level: "Just starting" = Easy + hints on, "I know some notes" =
   Medium + hints on, "I've been playing a while" = Tricky + hints off.
   Users can override defaults before continuing. Values stored on the
   profile as `defaultDifficulty` and `hintsEnabled`.

6. **Profile-wide defaults.** Two new additive fields on the profile
   object: `defaultDifficulty` (easy/medium/tricky) and `hintsEnabled`
   (boolean). Set during onboarding, consumed by all modules at startup.
   Per-module toggle cascade: per-module localStorage override >
   profile default > true. Modules read the active profile's defaults
   via `QN.profile.getActive()` and pre-select the matching difficulty
   tile + hint toggle state.

7. **Sound toggle bug fix.** The settings card Sound row toggled the
   muted boolean but never initialized the AudioContext. Web browsers
   require a user gesture to create an AudioContext — the Sound row tap
   IS that gesture but wasn't using it. Fixed: now calls `ensureCtx()`
   when unmuting. Same fix applied to all 32 modules.

8. **Feature spec.** Full spec at `specs/teaching-hints-spec.md`
   covering the flow, visual design, toggle cascade, hint data model,
   authoring guidelines, implementation phases, and autonomy guide.
   Updated during implementation to reflect design decisions (pop-up
   everywhere, settings card, onboarding toggles).

**Design decisions made:**

- **Pop-up modal on all screen sizes** (not inline on desktop). Tested
  both; pop-up is better because it forces the student to read the hint
  before retrying. Consistent with the quit dialog pattern.
- **Settings card (Option C)** from a 4-option mockup. Grouped card
  with pill states. Timer/hints/sound as peer rows. Industry standard
  for pre-activity configuration (Duolingo, Quizlet, Headspace).
- **"I've been playing a while" defaults to Tricky** (was Medium).
  If someone self-reports as experienced, starting on Medium undersells
  their assessment.
- **Sound toggle replaces muted checkbox.** Same functionality, better
  visual integration. Lives inside the settings card as a peer of
  timer and hints.
- **Hint content keyed by question type.** Each module's HINTS object
  uses keys matching the module's natural sub-skill axis. Fallback is
  graceful — missing keys just skip the hint.

**Architecture notes:**

- Teaching hints are NOT a separate system — they live inside each
  module's game loop, using the existing retry flow as the integration
  point. No new shared files created (hint CSS added to qn-theme.css,
  hint functions added inline per module).
- Profile schema changes are additive — `defaultDifficulty` and
  `hintsEnabled` absent = `'medium'` and `true` respectively. No
  migration needed. Existing profiles work unchanged.
- The `applyProfileDefaults()` function reads the active profile at
  module startup and pre-selects the difficulty tile if the current
  selection is still the hardcoded default (Medium). Path handoff
  takes priority (one-shot, already implemented).

**Files modified:**
- All 32 module HTML files (settings card DOM, hint overlay DOM,
  HINTS content, hint engine JS, settings card event handlers,
  retry mechanic where missing, profile defaults reading)
- `qn-theme.css` — settings card styles (.settings-card, .setting-row,
  .pill-state) + hint card styles (.hint-overlay, .hint-card,
  .hint-header, .hint-body, .hint-actions, .hint-dismiss-link)
- `qn-profile.js` — `defaultDifficulty` and `hintsEnabled` fields on
  profile create
- `profile.html` — interactive level toggles (.lpill, .level-detail,
  .level-setting), draftDifficulty/draftHints state
- New: `specs/teaching-hints-spec.md`
- New: `_mockups/start-screen-settings.html`

**Still open / next:**
- **Visual QA on real devices** — structural verification passed (all
  32 modules parse clean, all DOM elements present, all JS functions
  exist). Pixel-level QA on phone/tablet still owed. Key spots: settings
  card layout, hint pop-up appearance, sound toggle, onboarding toggles.
- **Hint content refinement** — v1 content is authored; may need
  tuning after real-student feedback. Particular attention to modules
  where the question type axis doesn't perfectly match the hint keys
  (scales family uses mode names as keys, but getHint picks randomly
  from available keys — may want context-aware selection like Note
  Names has).
- **Build log / project doc / spec updates** — this entry covers the
  build log. QUIZNOTE_PROJECT_DOC.md §3b, §4, §5, §6, §12 need
  updates to reflect: teaching hints as a shipped feature, settings
  card as the new start-screen pattern, retry mechanic now universal,
  profile defaults. CLAUDE.md "Current in-progress state" section
  needs the teaching layer added.
- Standing build queue unchanged: Circle of Fifths (#6), Chord
  Function (#7), Transposition (#8).

---

### Session 2 — QA fixes, ear training rebuild, anti-memorization — May 2026

**Session type:** QA-driven bug fixes, module rebuilds, UX improvements,
and anti-memorization upgrades. Marathon session covering notation,
gameplay, landing page, legal pages, and module library depth.

**Major deliverables:**

1. **Ear: Rhythm rebuilt as pattern matching.** Replaced single-note-
   duration format (guessing game) with 1-bar rhythm pattern matching.
   SVG renderer draws stems-down beamed notation (industry standard).
   Algorithmic pattern generator gives infinite variety — no two rounds
   are the same. Easy: quarter/half/whole. Medium: +eighths. Tricky:
   +sixteenths with double beams.

2. **Ear: Scales distractor rework.** Distractors now prioritize same-
   tonic different-type (C Major vs C Minor vs C Harmonic Minor) instead
   of same-type different-root. Tests interval pattern recognition, not
   absolute pitch. Fixed biased shuffle (Array.sort random → Fisher-Yates).

3. **Ear: Progressions algorithmic generator.** Replaced 5 static
   progressions with rule-based generator. Weighted voice-leading
   transitions, 6 random keys, 18 unique patterns per round.
   Easy: I/IV/V. Medium: +ii/vi. Tricky: +iii/viio/V/V.

4. **Ear: Intervals bass floor raised to A3.** Notes below A3 (220 Hz)
   removed — indistinguishable on phone speakers.

5. **Anti-memorization audit.** Analyzed all 31 modules for pool sizes.
   Fixed: time-signatures easy (3→5, added 6/8 + 2/2), accidentals
   (note position now varies randomly across staff range per question).

6. **Articulation marks — SVG hand-drawn.** Replaced Bravura font glyphs
   with deterministic SVG shapes (circle, line, path). Per-mark calibrated
   values for size, offset, stroke. Fermata/breath/caesura positioned
   well above staff. Calibrator built and shipped to `_calibrators/`.

7. **Dynamics pre-composed glyphs.** fp, sfz, pp, ff, etc. now use single
   SMuFL pre-composed codepoints instead of letter-by-letter composition
   (fixed visible gaps).

8. **Ornaments/Dynamics/Tempo A/B question UX.** Answer buttons changed
   from term names to A/B (matching visual layout). Removed shuffle so
   A always left, B always right. Font consistency: removed italic serif
   overrides from all Phase 5 modules.

9. **Ledger Lines fixes.** 3-ledger-line cap (was 4). Both-mode routing
   picks staff with fewer ledger lines AND requires at least 1 ledger
   line. ViewBox expanded for deep notes.

10. **Dotted Notes — tie arc rebuilt as SVG bezier.** CSS border-radius
    approach replaced with JS-measured SVG quadratic bezier path. Symbol
    size reduced 140→80px. Per-note dot offsets. Beat label grammar
    (½ beat not ½ beats).

11. **Landing page polish.** Removed "all ages" language. Hero stats:
    30+ Modules / 3 Skill tiers / Any Device. Pillar cards reduced
    from 4 to 2 (No filler + Curriculum-aligned). Footer taglines
    aligned. "Not [name]? Switch →" on returning user banner.

12. **Legal pages.** Sticky nav → static header with "← Back to
    QuizNote". Collapsible TOC on mobile. No marketing CTAs.

13. **Demo flow.** Promo modal auto-shows 2.5s after round. "Play again"
    button on modal. "Leave" redirects to landing page.

14. **Ear training tile redesign.** All 6 ear modules: coral background +
    🎧 badge in top-left (instant category recognition) + unique
    animated art per module.

15. **Profile lastActiveAt.** Now updates on every round completion via
    `touchActive()`, not just profile switches. Picker shows real recency.

16. **Profile limit UX.** "Could not create" alert replaced with themed
    "Profile limit reached" view (5/5 in use, remove one first).

17. **Key signatures.** Fixed F♭ treble position (step 8→1). Flat order
    now matches BEADGCF standard.

18. **Scales accidentals.** Natural signs now render when raised degrees
    cancel key-signature flats (harmonic/melodic minor).

19. **Primary chords labels.** "G major ♯" → "G♯ major" — accidental
    after root letter, before quality.

20. **Dotted sixteenth removed** from dotted-notes tricky pool (rarely
    used in practice).

**Calibrator pattern established.** `_calibrators/` folder on Dev houses
internal tuning tools. Underscore-prefix convention. Current calibrators:
articulation, clef, treble, time-signature, time-signature weight.

**Still open / next:**
- Summary screen "All modules" button alignment (minor).
- Ear: Rhythm patterns could benefit from dotted note values in
  medium/tricky tiers.
- Full browser verification pass across all 31 modules still owed.
- PWA offline, progress dashboard, richer teaching content — the three
  highest-ROI additions before monetization (see competitive analysis
  in this session).

---

### Landing page + legal pages polish — May 2026

**Session type:** Copy + UX polish (continuation of the notation-fixes
session).

**Changes:**

1. **Footer tagline alignment.** index.html had drifted to "for students
   of all ages", privacy/terms had "Practice music theory, one short
   round at a time." All three aligned to match the 32 modules:
   "Made by musicians, for musicians."

2. **"All ages" removed from index.** Hero subtitle trimmed ("for all
   ages" dropped). Hero stat "All Ages" replaced with **"30+ Modules"**
   (future-proof — won't need updating until 40+). "Lots of fun" stat
   replaced with **"Any Device"**. Bottom CTA meta changed to "Works on
   any smartphone, tablet, or desktop."

3. **Legal page headers simplified.** Replaced the sticky nav + "Test
   drive →" CTA on privacy.html and terms.html with a clean static
   header: logo + "← Back to QuizNote" link. Legal pages aren't
   conversion surfaces — no sticky, no blur, no marketing buttons.

4. **Legal page TOC collapsible on mobile.** Both privacy.html and
   terms.html TOC now wraps in a `<details>` element on mobile (≤640px),
   starting collapsed with a "Contents ▾" toggle. Scrolls inline — no
   overlay, no sticky behavior. Desktop unchanged.

**Still open / next:**
- Summary screen "All modules" button alignment (minor).
- Full browser verification pass across all 32 modules still owed.
- Tie arc positioning in dotted-notes: SVG bezier approach works but
  vertical offset (-18px from glyph bottom) may need further tuning
  per user feedback.

---

### Music notation fixes — May 2026

**Session type:** Bug-fix + visual-polish session across multiple modules.
Triggered by Jonathan's QA screenshots identifying rendering issues in
note display, ties, ledger lines, articulation marks, dynamics, ornaments,
and dotted-notes modules.

**Fixes delivered (16+ files touched):**

1. **Ledger line bug (16 files).** Notes on spaces (odd step positions)
   outside the staff were getting one extra phantom ledger line drawn
   beyond the note. Root cause: `chordLedgers()` / `ledgers()` used
   `d - 1` for below-staff odd steps and `d + 1` for above-staff odd
   steps — both should be the reverse. Mechanical swap in all 16 files
   that carry the function (every staff-rendering module + `qn-staff.js`).

2. **Ledger Lines "both" mode routing.** In "both" clef mode, the MIDI
   >= 60 shortcut routed bass-pool notes (D4, E4, etc.) to the treble
   staff where they don't need ledger lines. Fixed to check actual
   diatonic step instead. Also fixed a scoping bug (`diatonicStep` was
   called from the game-loop IIFE where it wasn't in scope — caused
   blank staff).

3. **Ledger Lines viewBox.** Deep ledger notes (3-4 ledger lines below)
   were cut off by the SVG viewBox. Expanded: bottomY 130→185,
   height 200→310.

4. **Dotted Notes — tie arc.** Original CSS border-radius arc was
   impossible to position reliably. Replaced with SVG quadratic bezier
   path drawn between measured glyph positions. JS `positionTieArc()`
   sets horizontal position from glyph bounding boxes; CSS `bottom`
   controls vertical. Calibrator built and used to tune values at 80px
   font-size.

5. **Dotted Notes — symbol size.** Reduced from 140px to 80px font-size
   (line-height 1.4→1.35) to fix stems bleeding into question text.

6. **Dotted Notes — dot spacing.** Removed excess thin space (` `)
   before augmentation dot. Added per-note-type DOT_OFFSETS lookup
   (eighth/sixteenth get x:-9 to compensate for flag width).

7. **Dotted Notes — beat label grammar.** Fractions ≤1 now use singular
   "beat" (½ beat, ¼ beat) instead of "beats".

8. **Ornaments + Dynamics — A/B question UX.** Discriminate/ordering
   questions showed A/B visual options but answer buttons had term names
   ("upper mordent", "fortissimo"). Changed to A/B buttons. Removed
   shuffle so A is always left, B always right.

9. **Tempo Markings — same A/B fix.** "Which is faster?" converted from
   term-name buttons to A/B.

10. **Dynamics — glyph overflow.** fff/pp overflowed comparison boxes.
    Reduced pair font-size, added `overflow: hidden` to `.term-card`.

11. **Articulation — mark visibility.** Font-size 26→56px with 1px
    stroke. SVG height expanded (130→180, midY 70→90) to prevent
    fermata clipping. Spacing adjusted for larger glyphs.

12. **Ornaments — mordent spacing.** Offset increased 30→40px above
    noteheads.

13. **Font consistency.** Removed italic serif font overrides from
    `.choices-pair`, `.choices-terms`, `.choices-wordy` in all 4
    Phase 5 modules (ornaments, dynamics, articulation, tempo-markings).
    Answer buttons now inherit shared Fredoka 700 from qn-theme.css.

14. **Note color audit.** Confirmed all modules consistently use purple
    (#5B3FE4) — no inconsistency found.

**Calibrator pattern.** Built `_tie-dot-calibrator.html` (same
`_` prefix convention as `_clef-calibrator.html`) with per-note-type
dot sliders, tie anchor %, font-size/line-height controls. Deleted
from repo after calibration complete.

**Architecture lesson — tie positioning:** CSS absolute positioning
(`bottom: Xpx`) is unreliable when the positioned element's container
height depends on font metrics and flex layout. The SVG bezier approach
is robust because it measures actual glyph positions at render time.

**Still open / next:**
- Summary screen "All modules" button sits slightly higher than sibling
  buttons — minor alignment issue in `.summary-actions`.
- Score-navigation `routing` question type still deferred to v1.1.
- Dynamics single-term glyph may still clip on very narrow viewports.
- Full browser verification pass across all 32 modules still owed.

---


**Session type:** Visual-consistency refactor + new shared file. One
commit (`bdec8f3`). Net -271 lines across 14 module files.

**Problem.** 14 modules (note-names, piano-quiz, piano-keyboard,
ledger-lines, accidentals, intervals, ear-intervals, scale-degrees,
primary-chords, roman-numerals, triads, triad-inversions, seventh-
chords, pianoquiz-demo) each had treble / bass / both clef-picker
tiles on their start screen, rendered as inline `<svg class="tile-clef">`
blocks in the HTML. Hand-written per-module, so they had drifted into
**3 distinct visual variants per clef** across the 14 modules — split
roughly 7 / 5 / 2:

- Variant 1 (7 modules): serif Unicode glyphs (𝄞 U+1D11E, 𝄢 U+1D122),
  font-size 44pt treble / 32pt bass, x=12/14 y=50/34.
- Variant 2 (5 modules): Bravura SMuFL glyphs (`` / ``),
  font-size 40pt, x=12 y=51.5 treble / x=14 y=47.75 bass.
- Variant 3 (2 modules, both Piano Quiz-family): same as Variant 2
  but treble x=14 instead of 12.

Invisible at the grep level (same class names, same structure);
only surfaced at the pixel level. Exactly the "verify-by-rendered-
result, not grep" case from CLAUDE.md.

**Fix.** New shared file **`qn-ui.js`** with two exports:
- `QN.ui.clefTile({clef})` — returns canonical SVG markup for treble /
  bass / both. Single source of truth.
- `QN.ui.mountClefTiles(scope?)` — auto-called on DOMContentLoaded;
  finds every `[data-clef]` element and injects the canonical SVG,
  replacing any pre-existing `.tile-clef` child SVG (or prepending
  if missing).

Each of the 14 modules: (1) loads `qn-ui.js` after `qn-nav.js` in the
head, and (2) carries **no inline tile-clef SVG** — just the
`<button data-clef="treble|bass|both">` wrapper that the existing
tile-pick handlers still use.

**The calibrator.** `_clef-calibrator.html` (untracked; prefix-`_`
convention matches `_mockups/`). A self-contained HTML page with:
- **§1** — all 3 current variants of treble / bass / both rendered
  side-by-side at actual size + 2× scale, with the module-counts
  per variant and the raw params shown as monospace.
- **§2** — a live editor: single canonical tile rendered with sliders
  for every knob (font system, viewBox, staff geometry, per-clef
  font-size/x/y, "both" tile's twin-staff layout). Two-way bound
  slider ↔ numeric input. Four preset buttons load: clean defaults,
  variant 1, variant 2, variant 3.
- **§3** — live-updating JS snippet output (the canonical
  `QN.ui.clefTile` body with chosen values baked in) + copy-to-
  clipboard.

Jonathan dialed in the canonical values in-browser, sent the snippet
back as a chat message. Values committed verbatim into `qn-ui.js`.
Canonical config (locked May 2026):

    VBW=66, VBH=68, font=Bravura Text
    SINGLE: lx=7, rx=66, topY=15, gap=9.5, sw=1.5
            treble: fs=39.5, x=13, y=52.75
            bass:   fs=40,   x=11, y=48.75
    BOTH:   topY=8, gap=9, lineGap=5.5, sw=1.1
            treble: fs=26.5, x=10, y=30.5
            bass:   fs=24,   x=10, y=59

**To change clef appearance globally:** edit the `SINGLE` / `BOTH`
blocks in `qn-ui.js`. No more 14-file diff.

**Tier 1/2 decisions made (autonomous, noted for the log):**
- New shared file rather than extending `qn-profile.js`. `qn-profile.js`
  is the profile / event / account / `QN.ui.confirm` file; adding
  presentation helpers (`QN.ui.clefTile`, `QN.ui.mountClefTiles`)
  felt out-of-scope for it. `qn-ui.js` is now the home for *visual*
  shared helpers — same `QN.ui` namespace, separate file.
- Auto-mount on DOMContentLoaded so modules don't need an explicit
  `QN.ui.mountClefTiles()` call. Defensively idempotent: if a module
  later mutates the DOM and adds a new clef picker, it can call
  `QN.ui.mountClefTiles(newScope)` itself.
- Removed inline SVG from module HTML entirely (rather than keep it
  as a fallback that gets replaced). Eliminates the inconsistency at
  the source; the script tag's `defer` attribute means the gap
  between HTML parse and JS run is sub-frame.
- pianoquiz-demo.html (the marketing demo on the landing page)
  doesn't load `qn-profile.js`, so the rollout script's anchor-match
  missed it on the first pass — the inline SVGs were stripped but
  no script tag was inserted, leaving empty buttons. Caught in the
  verification sweep; manual patch added `qn-ui.js` after
  `qn-audio.js`. **Lesson for future shared-script rollouts:** check
  the demo / marketing surfaces too, they often don't share the full
  module script chain.

**Tier 3 watch-outs that DID trigger this session:**
- This was technically a Tier 3 session by CLAUDE.md's standing rules:
  it added a new shared file and modified 14 module files. Jonathan
  explicitly asked for the work ("create a clef calibrator and I'll
  tell you exactly how everything should look"), so it was authorized
  — not unilateral.

**Verification:** Structural only. Each module ends with: 3 `data-clef`
buttons, 0 inline tile-clef SVGs, 1 reference to `qn-ui.js`. Browser
verification on each of the 14 modules (start screen renders the
canonical tiles, picker still updates state.settings.clef on tap)
is still owed before relying on this in production — same caveat as
the Phase 5 cluster.

**Files modified:**
- New: `qn-ui.js` (~110 lines).
- 14 module HTMLs: added one `<script src="qn-ui.js" defer>` line in
  head, removed inline tile-clef SVG from each `[data-clef]` button.
- Internal-only: `_clef-calibrator.html` (untracked).

**Still open / next:**
- Browser verify the 14 modules (was also owed before for the Phase 5
  cluster of 5 new files — bundle the two verification passes).
- `qn-ui.js` is now the natural home for the next wave of visual
  shared helpers if/when more inline-SVG inconsistencies surface
  (e.g. the staff-card chrome, the difficulty-tile emoji+label
  pattern, etc.). Not Tier 3 to add new exports to `qn-ui.js` going
  forward — it was Tier 3 to *create* it.

---

### Phase 5 score-literacy cluster shipped — May 2026

**Session type:** Module build session. Autonomous mode per the May 2026
"Module builds are autonomous" rule. Five new modules cloned and wired
through the four-surface rule in one atomic commit.

**Net result:** Full Tier A score-literacy cluster from the Phase 5 ranked
build queue now live. Module roster **27 → 32**. Closes the score-literacy
coverage gap identified in the May 2026 curriculum review (zero coverage
of tempo/dynamics/articulation/navigation/ornaments).

**Built (in queue order):**
1. **Tempo Markings** (`tempo-markings.html`) — Foundations Level 2. Question
   types: `meaning` / `ordering` / `metronome` / `change`. 11-term steady-
   tempo catalog + four change-of-tempo markings. BPM bands taken verbatim
   from the spec. `playMetronome(bpm, count)` audio helper added to the
   module's local audio engine — 4 wood-block clicks at the question's BPM.
2. **Dynamics** (`dynamics.html`) — Foundations Level 2. Question types:
   `meaning` / `ordering` / `direction` / `accent`. Bravura PUA glyphs
   (U+E520–E525) compose ppp through fff, sfz, fp via concatenation
   (mf = "m"+"f"). Hairpins drawn as inline SVG polyline. No audio.
3. **Articulation** (`articulation.html`) — Foundations Level 2. Question
   types: `name` / `effect` / `discriminate`. Inline-SVG 5-line staff with
   notehead + Bravura articulation glyph. **Tie-vs-slur discrimination**
   (the headline skill of the module) is realised as two adjacent noteheads
   joined by a curve — same pitch = tie, different pitch = slur. No audio.
4. **Score Navigation** (`score-navigation.html`) — Foundations Level 2.
   Question types: `name` / `meaning` / `discriminate` (v1 only — `routing`
   deferred to v1.1 per spec). Repeat barlines + voltas drawn as inline SVG;
   segno (𝄋) / coda (𝄌) via Bravura PUA; D.C./D.S./Fine as italic serif.
   Discriminate uses a worded confused-pair pool (D.C. vs D.S., 1st vs 2nd
   ending) rather than rendering both targets side-by-side.
5. **Ornaments** (`ornaments.html`) — Foundations Level 2. Question types:
   `name` / `effect` / `discriminate`. Inline-SVG notehead with attached
   ornament (Bravura glyphs for trill/turn/mordents above the notehead;
   grace notes drawn as smaller noteheads with optional slash through the
   stem; tremolo slashes across the main stem). Visual ID only in v1 —
   ornament *realization* is performer-dependent and out of scope.

**Cloning pattern (proven across all five):**
- **#1 Tempo Markings** was the cluster's pattern-establisher. Cloned from
  `accidentals.html`, swapped the staff renderer for a styled "term card"
  (italic serif Italian terms on a cream card), and added a 4-type question
  engine. Took ~80% of the build time; established the renderer + question
  shape every sibling reuses.
- **#2 Dynamics, #3 Articulation, #4 Score Navigation, #5 Ornaments** were
  cloned from Tempo Markings (Articulation → cloned to → Ornaments because
  both render noteheads on a staff). Each one is a Python-script surgery
  pass: simple string swaps for title/slug/copy, plus a full replacement of
  the renderer block and the question engine. Boilerplate (audio engine,
  QN_FX celebration system, game loop scaffolding, summary screen, modal)
  is byte-identical across the five files.
- **No `qn-staff.js` changes were made.** Each module renders its own
  inline-SVG staff segments where needed — Foundations score-literacy is
  too small a context (single notehead, two adjacent noteheads) to justify
  a shared-file extension. This was a Tier 1/2 call inside the autonomous-
  build rule.

**Tier 1/2 decisions made (autonomous, noted for the log):**
- File names match slugs verbatim — no abbreviation.
- Short prefixes: `tm_`, `dy_`, `ar_`, `sn_`, `or_`.
- Module-count statistic does not live in `index.html` literally; the
  four-surface rule's "index" update was satisfied by adding a new
  "Expression markings" tag to the Foundations row of the `wi-` spine
  (the spine is concept-level, so one tag covers the whole cluster — kept
  it as a single addition rather than five).
- Tile colors in `play.html` chosen to avoid adjacent collisions in the
  Foundations grid: Tempo Markings `bg-sun`, Dynamics `bg-coral`,
  Articulation `bg-teal`, Score Navigation `bg-green`, Ornaments `bg-grape`.
- Each module reuses a font load for Libre Caslon Text (italic serif) —
  redundant across the cluster but kept inline-per-module to honor the
  "no shared file changes" rule of autonomous builds. If we later observe
  bundle size matters, the obvious follow-up is to fold the font into
  `qn-theme.css`.
- `hear-btn` in the play screen template is kept (DOM-present, JS-hidden)
  in Dynamics, Articulation, Score Navigation, and Ornaments because the
  cost of removing it cleanly across the template exceeded the cost of
  leaving it dormant.
- For Ornaments' `discriminate` questions, the "always-confused-pair"
  pool is gated by tier: Medium gets upper-vs-lower mordent only; Tricky
  also unlocks acciaccatura vs appoggiatura.
- For Score Navigation's `discriminate`, the "render the pair" approach
  used by other modules in the cluster wouldn't work (D.C. al Fine and
  D.S. al Coda are both italic-text instructions — visually
  indistinguishable). Switched to a *worded prompt* pool: "Which one
  means go back to the very beginning?" with the two textual answers as
  tiles. Confirmed by reading the spec's distractor-strategy guidance.

**Tier 3 watch-outs that did NOT trigger this session:**
- Renderer extension. Each module drew what it needed inline; no module
  attempted a 3-note chord, a circular Circle-of-Fifths SVG, or anything
  else that would require `qn-staff.js` work.
- Music theory accuracy. Speed bands for tempo terms have legitimate
  source variation; pulled them verbatim from the spec (which carries a
  "flag for review" note) rather than guessing. Italian-term plain-
  English meanings use the conventional pedagogy gloss ("walking pace"
  for andante, "very loud" for ff, etc.).

**Four-surface integration (single atomic commit, uncommitted):**
- `tempo-markings.html`, `dynamics.html`, `articulation.html`,
  `score-navigation.html`, `ornaments.html` — 5 new module files.
- `play.html` — 5 new Foundations tiles after Accidentals.
- `path.html` — 5 entries in MODULES, 5 entries in PATH, 5 entries
  in SHORT_PREFIX.
- `qn-profile.js` — 5 entries in the recommender PATH.
- `index.html` — single "Expression markings" tag added to the
  Foundations row of the `wi-` concept spine.

**Verification:** Structural only this session — div balance, brace
balance, parse-by-grep of the engine and renderer blocks across the five
files. No browser-render verification yet. The `verify` skill or a manual
round-trip on each of the five start screens should be the next step
before relying on them in production.

**Still open / next (post this session, ranked):**
1. **Browser verification** of all 5 new modules (run through one
   round each at each tier). Catches anything the structural checks miss
   — particularly the Bravura glyph composition in Dynamics, the
   tie-vs-slur SVG curve geometry in Articulation, and the volta brackets
   in Score Navigation.
2. **Tier B — Reading expansion** from the Phase 5 queue:
     - #6 Circle of Fifths (own renderer; SVG circle ~80 lines, no
       shared-file changes)
     - #7 Chord Function (T / PD / D — reuses `buildStaffWithChord`)
     - #8 Transposition (instrument labels, 4-button MC v1)
3. **Tier C non-module multipliers:** Mock Exam Mode (Phase A is the
   QNM-contract audit across all 32 modules; gated on that).
4. **Tier D defensible-but-lower-ROI:** C Clefs (Tier 3, renderer
   extension), Construction-mode engineering session (Tier 3, prereq
   for any Build-a-X cluster).
5. **PWA install** still queued (own session, manifest + icons).
6. **Adult/child profile UI** still queued (lawyer-gated).
7. **Monetization track** still queued (server auth required first).

**CLAUDE.md / QUIZNOTE_PROJECT_DOC.md updates needed:**
- CLAUDE.md "Current in-progress state" section: bump module count from
  27 to 32; mark Tier A score-literacy cluster as COMPLETE in the ranked
  queue; bump the queue to start at #6 Circle of Fifths.
- QUIZNOTE_PROJECT_DOC.md §5: add the 5 new modules to the roster map
  with their built status; bump roster total.
- Both files describe roster "considered the complete set... growing
  past 27 is a deliberate scope decision" — that 27 number is now stale.
  The decision to grow past it was already approved (May 2026 curriculum
  review). Update the prose to reflect 32 as the current floor and
  document the Phase 5 expansion as the formal Tier 3 approval.

---

### Pricing/monetization assessment + curriculum gap analysis + Phase 5 spec drafting — May 2026

**Session type:** Strategy + spec-writing session. No code changed. 10 new
spec files added to `/specs/`. CLAUDE.md updated with a ranked build queue.
The next several sessions will work from that queue.

**Net result:** A pricing assessment Jonathan can hand to advisors / use as
internal reference; a curriculum gap analysis that justifies a deliberate
27 → 37 module roster expansion (Tier 3 decision, approved); 10 specs
covering 7 new modules + 3 non-module features, all ranked by ROI; a
documented trademark conversation that gates the curriculum-mapping feature
behind lawyer review.

**Commits:** none yet — files written, awaiting Jonathan's review and
explicit go on the commit.

---

#### Part 1 — Pricing & monetization assessment (no code)

Audited the codebase against the question "what does QuizNote cost per
user to operate, and what pricing structures fit?" Key findings:

- **Per-user cost is effectively zero.** Pure static site (Vercel), all
  audio is WebAudio synth (`qn-audio.js`), all data in localStorage, no
  backend, no external API calls beyond Google Fonts + jsDelivr Bravura
  CDN (both free, cached). Heavy user ≈ $0.015/mo bandwidth on Vercel
  Pro overage; light user ≈ $0.
- **Stripe fees are the binding constraint on cheap subscriptions.**
  $0.99/mo nets ~$0.66 after 2.9% + $0.30; $1.99/mo nets ~$1.63;
  $4.99 lifetime nets ~$4.55. Sub-$2 monthly subscriptions are
  margin-fights against payment processors.
- **Existing scaffolding is honest plumbing.** `qn-cloud.js` has Stripe
  Checkout pattern (SAQ-A PCI scope), feature flags all OFF, US-only geo
  gating, two-condition child consent lockout. `qn-profile.js` has
  `pricingCohort: 'beta'` tag on every existing account → these users
  are "founders" forever once the go-live lever flips. 7-day trial built
  but not armed. `trialStatus()` explicitly advisory; real entitlement
  must be server-authoritative.
- **No real auth today.** `qn-gate.js` is an explicitly-labeled
  client-side velvet rope (SHA-256 hash, trivially bypassable). MUST be
  replaced by server-side auth before any paid feature ships.

Four pricing proposals laid out: (A) cheap subscription no trial,
(B) lifetime-only, (C) hybrid (trial + sub + lifetime escape hatch),
(D) donate / pay-what-you-want. **Recommended: Proposal C — free
Foundations + 7-day trial + $2.99/mo or $19.99/yr + $39.99 lifetime.**
Rationale: cost structure permits any of them; the hybrid is the one
that lets the data tell you which audience (subscribers vs.
one-time buyers) dominates before doubling down.

**No code touched.** Assessment lives in the chat transcript; no
written deliverable in repo (Jonathan can re-derive from cited file
references + this log entry if needed).

#### Part 2 — Curriculum gap analysis

CEO/PhD pass: audited the 27-module roster against ABRSM Grades 1–5,
RCM Levels 1–8, AP Music Theory units 1–8, NAfME standards, and the
Alfred + Faber method-book series. Reframed the question from "what
does theory have?" to "what makes the 27 number feel like an undersell?"

**Headline finding:** the roster *count* is generous in this category
(Tenuto ~14, EarMaster ~16, Duolingo Music ~12, Teoria ~20 — QuizNote
at 27 is already at the top). The real risks are surface variety
(many drills look like staff+4-button), coverage type (zero score-
literacy markings: tempo/dynamics/articulation/symbols), and external
legibility (no mapping to recognized syllabi).

**Tier A gaps identified (real, build):**
- Expression markings cluster — tempo, dynamics, articulation, score
  navigation, ornaments. Zero current coverage; every method book uses
  these from page 1. Five Foundations modules. Clone-and-swap from
  Accidentals; no shared-file changes.
- Circle of Fifths — reopen the May 2026 §5 cut. Iconic visual artifact;
  its absence reads as a coverage hole regardless of how it's covered
  elsewhere.
- Transposition — every band/orchestra student needs it; ABRSM Grade 5
  tests it.

**Tier B (defensible at intermediate, build):**
- Chord Function (T/PD/D) — cheapest meaningful Theory expansion;
  genuinely new pedagogical skill.

**Tier C (build only with demonstrated demand):**
- C Clefs (alto/tenor) — niche orchestral audience.
- Non-Chord Tones — at the upper edge of the §2 audience cap.

**Tier D (out of scope, written down to prevent re-litigation):**
- Modulation, figured bass, voice-leading rules, modes-as-harmony,
  jazz extensions, sight-singing, non-Western systems. All cited in
  §2 as out-of-scope; flagged for inclusion in §5's "Deliberately out
  of scope" list during next project-doc revision.

**Non-module multipliers (real value, not modules):**
- Mock Exam Mode — recombination of existing question pools; feels like
  5+ new modules.
- Curriculum Mapping Overlay — re-organizes existing 27+ modules under
  ABRSM / RCM / AP / method-book labels. Lawyer-gated for the named-
  method version.
- Construction-mode engineering session — unlocks Build-a-X cluster as
  a future cheap clone-and-swap chain (Phase 3 → Phase 4 pattern).

#### Part 3 — Trademark conversation (Tier 3, documented for future sessions)

Jonathan asked: "Can I get in trouble saying 'click here if you're
following Bastien and do these exercises which map to their book?'"

Answer summary (documented here so future sessions don't re-litigate):

- **Probably fine if worded carefully**, but Tier 3 — needs a real
  lawyer review before any named-method copy ships. Claude is not a
  lawyer.
- **US nominative fair use** allows referring to a third-party product
  by its actual name if (1) you can't reasonably identify it otherwise,
  (2) you use only as much of the mark as needed, (3) you don't suggest
  sponsorship/endorsement.
- **Do:** use phrasings like "aligns with the concepts in," "compatible
  with," "for students working through." Include a disclaimer:
  "QuizNote is not affiliated with, endorsed by, or sponsored by
  [marks]. All trademarks are property of their respective owners."
- **Don't:** use their logos, cover art, exact lesson titles, or imply
  endorsement. Don't copy their exercise sequences or expressed lesson
  order. Don't say "official," "approved by," "in partnership with."
- **Risk by mark holder:** Bastien (Kjos) and Faber lowest; ABRSM,
  Trinity, RCM actively police marks (consider applying for official
  partner programs); College Board / AP highest risk (extremely
  protective of "AP" mark).
- **Recommended launch path:** ship a **generic-language v1** of
  curriculum mapping first ("Beginner — first year of theory" /
  "Grade-1-equivalent" / etc.), no named marks. Add the named-method
  overlay as v1.1 *only after* lawyer signs off on the disclaimer
  language and the specific marks used.

This conversation is the source-of-truth gate for the curriculum-mapping
feature (#10 in the queue). Do not ship named-method copy without
revisiting this and obtaining lawyer review.

#### Part 4 — Phase 5 specs drafted (10 files added to /specs/)

Roster expansion 27 → 37 approved as a Tier 3 scope decision.
Justification: closes a real score-literacy gap (5 Foundations modules)
within the existing audience, plus carefully-bounded Reading/Theory
expansions. Not an audience-scope change — a roster-scope correction.

Slicing decision: 5 standalone Foundations modules (rather than 1
mega-module or 2 combined), because the question types and renderers
differ per topic; the existing module pattern fits each cleanly.

**Specs written (all in `/specs/`):**

Tier A — score-literacy cluster (Foundations):
- `tempo-markings-spec.md` (#28)
- `dynamics-spec.md` (#29)
- `articulation-spec.md` (#30) — includes the tie-vs-slur skill
- `score-navigation-spec.md` (#31) — `routing` question type deferred to v1.1
- `ornaments-spec.md` (#32)

Tier B — Reading + Theory expansion:
- `circle-of-fifths-spec.md` (#33) — re-opens the May 2026 cut
- `transposition-spec.md` (#35)
- `chord-function-spec.md` (#34) — cheapest meaningful Theory add

Tier C — defensible / borderline:
- `c-clefs-spec.md` (#36) — requires `qn-staff.js` extension first
  (alto/tenor clef glyphs + STEP_TO_Y per clef); flagged as Tier 3
  renderer-extension session before module build
- `non-chord-tones-spec.md` (#37) — borderline; build only with
  demonstrated demand

Non-module features (Tier C multipliers):
- `mock-exam-mode-spec.md` — Phase A is an architecture audit of all
  27 modules' QNM contract exposure
- `curriculum-mapping-spec.md` — lawyer-gated for named-method version
- `construction-mode-engineering-spec.md` — Phase 3-sized engineering
  session; unlocks Build-a-X cluster as cheap follow-on clones

All specs follow the canonical `accidentals-spec.md` format. Each
specifies build source, ROI rank, tiers, question types, distractor
strategy, theory accuracy notes, renderer requirements (with explicit
"no `qn-staff.js` changes required" callouts where true), sub-skill
tagging, and concept explainer card text.

#### Decisions made (Tier 3, approved by Jonathan)

- **Scope expansion 27 → 37 modules** — approved. Not audience
  expansion; closes a real score-literacy gap within the stated audience.
- **Slicing: 5 standalone Foundations score-literacy modules** —
  approved (not 1 mega-module, not 2 combined).
- **Tier placement: all score-literacy modules in Foundations · Level 2** —
  approved.
- **Re-open Circle of Fifths from the May 2026 §5 cut** — approved.
- **Construction-mode is its own engineering session, not bundled with
  module builds** — approved (mirrors Phase 3 pattern).
- **Generic-language curriculum mapping v1 can ship; named-method
  v1.1 is lawyer-gated** — approved.

#### Ranked build queue established (see CLAUDE.md "Ranked build queue")

The next several sessions will work from a 14-item ranked queue, written
into a new section of CLAUDE.md. Top of queue: the 5-module Foundations
score-literacy cluster (Tempo → Dynamics → Articulation → Score Nav →
Ornaments). Ranking is by ROI = (perceived-value gain) ÷ (build cost),
not by topic clustering or numerical balance across tiers.

**Tier symmetry was explicitly rejected as a planning goal** — adding
the same number to Reading and Theory just to balance the chart would
be padding. Per-module pedagogical merit is the test. Final shape:
Foundations 9 → 14 (+5), Reading 8 → 10 or 11 (+2 firm, +1 optional),
Theory 10 → 11 or 12 (+1 firm, +1 borderline).

#### Still open / next

1. **Jonathan reviews this BUILD_LOG entry and approves the commit.**
2. **Commit the spec files + doc updates** (single commit: 10 new specs +
   CLAUDE.md ranked queue + this BUILD_LOG entry).
3. **Next session:** start at top of queue — `tempo-markings-spec.md`.
   Build autonomously per "Module builds are autonomous" rule. No
   checkpoints expected until commit/push.
4. **QUIZNOTE_PROJECT_DOC.md update** is pending — §5 needs four-phase
   rewrite to add Phase 5 (score-literacy + Reading/Theory expansion),
   roster header bumped from "27 modules" to "27 live / 37 planned with
   Phase 5", new entries #28–37 added with status "Planned" and links
   to spec files. Could be done in this commit or deferred to the
   Tempo Markings build session. Recommend deferring — easier to land
   §5 entries module-by-module as each ships, mirroring how Phases 1–4
   were logged.
5. **Carried open items from prior sessions** (unchanged):
   - Visual QA on all 8 Phase 4 chord modules + Phase 2 expansions.
   - Sampled-piano audio (Tier 2) roadmap item.
   - time-signatures `accStartX: 72` pin + 2 qn-theme.css holdouts.
   - PWA install on landing page (own session).
   - Adult/child profile UI (lawyer-gated).
   - Monetization track (sign-in → Stripe → entitlement).
   - Landing pillars Pillar 1 title duplication.

#### CLAUDE.md updates folded into this session

- Phase 4 status line updated to point at Phase 5 as planned (with
  pointer to the ranked queue + spec files).
- New section "Ranked build queue (May 2026 — Phase 5 and beyond)"
  inserted before "Music-theory accuracy" — lists 14 items in priority
  order with spec-file paths and per-item notes for the next session.

---

### Landing-page copy pass + mobile path reorder + stash rescue — May 2026

**Session type:** Copy/UX scrub on index.html + path.html mobile reorder + an
unintentional git-stash recovery saga.

**Net result:** path.html mobile-friendly (Your-next-step on top, rail below);
six "no ads" mentions and the "free during beta" claim removed from
index.html; the entire "How it works" section deleted; tier-description copy
on pianoquiz-demo.html and the What's-Inside spine reconciled with the
post-Phase-1 tier roster (Intervals in Reading; ear chips split
Pitch-by-ear / Harmony-by-ear); nickname-creation copy on profile.html
sharpened.

**Commits:**
- `6cf46a6` path.html: mobile reorder + drop lock metaphor
- (this session's second commit) Landing copy scrub + ear-training relabel
  + profile/pianoquiz-demo copy tightening + build log

**path.html — mobile reorder (committed earlier in the session):**

- On mobile the layout now stacks: "Your next step" card on top, "Next up
  on your path" tiles, purple guide banner, then the path rail at the
  bottom. Desktop unchanged (rail on left, stage on right). Implementation:
  CSS `order:` flipped between `.rail` (order: 1) and `.stage` (order: 0)
  with the existing 880px media query restoring desktop ordering.
- The path rail no longer renders a 🔒 glyph on upcoming modules. The lock
  metaphor contradicted the banner copy ("Practice never locks"), and the
  rail items aren't clickable anyway — the rail is a *map*, not a *menu*.
  Upcoming nodes are now muted dots; current (★) and done (✓) unchanged.
  `.node.locked` class renamed to `.node.upcoming` to drop the misleading
  vocabulary in the code too.
- "Or jump into anything" → "Next up on your path", and the three tiles
  switched from a played-frequency mix to the next 3 modules on PATH after
  the current recommendation. Edge case: if the learner is at the end of
  the path, backfill with the previous items.
- Banner copy reworded: "**Your Path guides; Practice never locks.** Every
  module is open for you to practice whenever you want it — the path just
  shows what's next."

**index.html — landing copy scrub:**

- Removed all "no ads" mentions (6 of them — hero pill, hero stats tile,
  pillars section sub, Pillar 1 body, Pillar 2 entire pillar, meta
  description).
- Removed "Free during beta" from hero pill (Stripe path is in progress;
  no longer want a free-forever promise on the page).
- Hero pill simplified to a single claim: "Follows the music curriculum
  your teacher uses." Substantive curriculum-alignment claim that answers
  the first silent question a parent/teacher has on landing.
- Pink coral pulse on the hero pill dot retired; now reuses existing
  `pulse-teal` keyframes (same animation as the Try-a-question eyebrow).
  Visual consistency for free; the coral was reading as alert/urgent
  instead of healthy/active.
- "0 / Ads" stat tile → "All / Ages." Same 3-stat layout, swapped a
  defensive metric for an audience claim.
- Hero CTA row + stats row both changed from `display: inline-flex` to
  `display: flex` so stats always sit BELOW the CTAs at every screen size.
  On wide screens they used to flow inline next to the buttons.
- Pillar 2 entirely replaced. Old: "No ads" (icon: ⊘). New: "For every
  learner" (icon: two-person SVG) — "From first notes to intermediate
  theory — same path, your pace." Title and body intentionally avoid age
  references ("school-age," "adult learners") per user direction —
  no age vocabulary anywhere on the landing now.
- Pillars section sub: "No ads. No filler. Just the practice your teacher
  assigned, done right." → "Short rounds, sharp focus, the exact skills
  your method book covers."
- Pillar 1 body: "No ads, no distractions..." → "Supplementary practice
  that pairs with whatever your teacher gives you next."
- **Deleted the entire "How it works" section.** Reason: three sections in
  a row (Pillars → How it works → What's inside) were all reinforcing the
  same claim with rotating vocabulary, and "How it works" was the
  weakest — its 3 steps (Pick / Configure / Play) were generic, applicable
  to any app. The demo card up top + hero CTA already show "what using it
  looks like." Removed: HTML section, all `.how`/`.steps`/`.step*` CSS
  rules (~36 lines), responsive padding override, and the `.step` selector
  in the IntersectionObserver animation list. Section between Pillars and
  What's-Inside is now also gone.
- **What's Inside spine — duplicate "Ear training" chip resolved.** Both
  Reading and Theory tiers had identical "Ear training" chips. The
  underlying modules are genuinely different categories of ear work:
  Reading covers `ear-intervals` + `ear-scales` (pitch-based); Theory
  covers `ear-chords` + `ear-cadences` + `ear-progressions` (harmony-based).
  Relabeled: Reading → "Pitch by ear"; Theory → "Harmony by ear." Two
  distinct categories now read as such, and the spine subtly signals that
  ear training is woven through the curriculum at different levels of
  abstraction.
- Meta description tweaked: "Short rounds, no ads." → "Short rounds, real
  fluency."

**pianoquiz-demo.html — post-tier-reconciliation copy fix:**

The demo-end promo card's tier descriptions still referenced pre-Phase-1
tier assignments (Intervals in Theory; no mention of piano modules in
Foundations). Updated to match the live roster:

- Foundations: now mentions piano modules (Piano Quiz + Piano & Keyboard
  shipped in Phase 1). "Read notes on the staff and keys, feel rhythm and
  meter."
- Reading: now mentions intervals (moved from Theory in the May 2026
  reconciliation). "Key signatures, scales, and intervals — when the staff
  feels like home."
- Theory: harmony-only (no more intervals). "Chords, cadences, and how
  harmony works."

**profile.html — nickname copy:**

Nickname-creation sub-line on view-nickname tightened. Old: "Pick a fun
name. Use your real name only if you want to — most people don't."
New: "Pick a fun nickname — no real names needed."

The prior version softly permitted real names ("only if you want to"),
which weakens the nickname-first nudge. The new line sets nickname as the
default expectation. Defensive hygiene for both the pre-cloud
local-only state (browser autofill, shared devices, screen-sharing) and
the future adult/child UI when parent/sub-accounts ship. The strong
minor-protection copy ("never a child's real name") was deliberately left
for when the adult/child UI exists — putting that language on a screen
that doesn't have the concept yet would confuse users.

The switcher copy ("Tap a profile to play as them. Or add a new one for
someone else.") was left as-is — already neutral, doesn't assume adult,
and "someone else" covers sibling/child/friend without committing to a
relationship model the data doesn't yet support.

**The stash-rescue saga (worth keeping for future archaeology):**

When pushing the path.html mobile-reorder commit, the local branch was
behind origin/Dev. Standard fix (stash → rebase → pop) ran into an
unexpected wrinkle: a parallel `claude/autonomous-module-builds-Ej8Nq`
branch had landed the full Phase 3 (chord renderer) + Phase 4 (8 chord
modules) work on Dev independently. The local working tree had the SAME
work in progress but uncommitted, so the stash captured 13 modified
tracked files (BUILD_LOG.md, qn-staff.js +199 lines, qn-audio.js, shared
docs, 8 existing module HTMLs) plus 8 untracked files (the 8 new chord
HTMLs) which then collided with the now-tracked-on-remote versions of
those same files. `git stash pop` failed mid-restore (the untracked files
conflicted with the newly-tracked ones from remote), leaving the stash
preserved but unapplied.

Per-file md5 diff revealed: shared engines and docs (qn-staff.js,
qn-audio.js, qn-profile.js, BUILD_LOG.md, QUIZNOTE_PROJECT_DOC.md) were
**byte-identical** between stash and Dev — both implementations of the
chord-renderer extension converged. The 16 differing files all differed
by **exactly 2 lines** (or 10 in dashboard.html's case): a single
`<script src="qn-gate.js"></script>` insertion that the
"Data-claim audit + client-side beta access gate" commit added across the
codebase, plus a small data-claim copy softening on dashboard.html.

**Verdict:** the stash was fully superseded by Dev. Dropped with
confidence (commit hash `6dad6b1` recorded here in case it's ever needed
for archaeology). Recovery cost: ~30 minutes of git forensics.

**Lesson worth keeping:** when two parallel Claude sessions build the same
queued work (Phase 3 chord renderer was on the docket; both sessions
independently worked it), the engines/docs will converge and the
per-module HTMLs will diverge only on infrastructure that landed in
between (here: the beta-gate script tag). Future-proof workflow when
running parallel sessions on QuizNote: claim the queued item up front in
a brief commit to Dev (or a tracking file) so both sessions don't
independently build the same thing.

**Still open / next:**

- **PWA install on the landing page (queued — its own session).**
  QuizNote's flat-static architecture is already PWA-friendly — the user
  verified by adding the site to their phone home screen as a bookmark and
  reports it works "as a mini-app." Productizing the experience needs:
  `manifest.json` (app name, theme color, `display: standalone`, icons),
  Apple touch icons + `apple-mobile-web-app-capable` meta tag across every
  HTML file (not just index — every module needs the meta or it falls back
  to a Safari window when launched from home screen), a small set of icon
  assets (192×192, 512×512, plus iOS sizes), and a tap-to-install button on
  the landing page using `beforeinstallprompt` for Android. **iOS caveat:**
  Apple does NOT expose a programmatic install API on Safari, so iOS must
  show a friendly Share → "Add to Home Screen" instruction card. Pair the
  install CTA with the "No download needed" copy at line ~1853 of
  index.html. Needs an app icon design first.
- **Landing-page pillars section repetition not fully resolved.** Pillar 1
  title is still "Built for learners" which duplicates the section title
  "Built for learners, not engagement." Proposed (not yet applied):
  rename Pillar 1 → "Pairs with your lessons", rename Pillar 2 → "From day
  one", and shorten the section sub so Pillar 4 owns the method-book
  claim alone. User flagged the repetition; rewrite was tabled
  mid-session in favor of the "How it works" deletion (which addressed the
  bigger repetition problem first).
- **Adult/child UI (Tier 3, lawyer-gated).** Schema scaffolding is in
  qn-cloud.js (`childProfiles[]`, `consentReceipt`, `profileType`,
  `managedBy`, two-condition consent gate). The UI flow doesn't exist
  yet — profile.html has no adult/child distinction. Building this is
  the right point to add the strong nickname-only copy with the concept
  visible to the user.
- **ORYKU branch deleted on GitHub.** All audit/beta-gate work was merged
  into Dev via PR #55, no commits lost.
- **Dev merged to main.** Production now has the chord renderer + Phase 4
  chord modules + data-claim audit + beta gate + privacy/terms + qn-cloud
  scaffolding, plus (after this commit) the landing copy scrub +
  mobile path reorder.

**Doc updates flagged for next session:**
- **CLAUDE.md module count**: line says "19 live modules"; Dev now has
  27 (Phase 3 + Phase 4 merged via the autonomous-module-builds branch).
- **CLAUDE.md "Current in-progress state"** section: says "Phase 2 in
  progress; Chord renderer session queued as Phase 3." Both are now
  shipped via the parallel session; needs reconciling.
- **QUIZNOTE_PROJECT_DOC.md §5 (roster) and §12 (phases)**: same — needs
  reconciling with the current 27-module reality. Recommend a single
  cleanup session to walk both docs against the live state.

---

### Phase 2 #1 — Chromatic Scale — May 2026

**Session type:** Build (1 module via clone-and-swap)

**Net result:** 18 → 19 live modules. Phase 2 item #1 complete. Remaining
Phase 2 work is expansions to existing modules (not new builds).

**Commit:**
- `13e5bc9` Phase 2: ship Chromatic Scale module (#19)

**Per-module decisions worth keeping (chromatic-scale.html):**

- **Cloned from scales.html** — staff renderer, audio voice (rich piano
  timbre), game loop, confetti, FX engine all inherited verbatim. Pure
  data swap plus a small pool-structure refactor (see below).
- **24 chromatic scales generated from a single helper** (12 ascending +
  12 descending). Tonic list = 12 musically-common major-key spellings:
  C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B. Same tonic list for both
  directions — each tonic carries its canonical major-key spelling
  regardless of direction.
- **Spelling convention LOCKED** to the school-textbook standard:
  ascending uses sharps, descending uses flats, tonic stays natural,
  **no B♯/E♯/C♭/F♭** (uses C/F and B/E instead). The diatonic-preserving
  "melodic chromatic" variant used in chromatic harmony is **deliberately
  out of scope** — noted in spec. This decision applies to any future
  chromatic content too.
- **POOLS structure refactored** from scales.html's single map into
  separate `QUESTION_POOLS` (always chromatic — what the round queue
  samples from) and `DISTRACTOR_POOLS` (chromatic + majors at Medium,
  + natural minors at Tricky — what `makeChoices` samples wrong-answer
  candidates from). **Reason:** chromatic discrimination requires
  comparing against majors/minors, but the learner must never be asked
  to *name* a non-chromatic scale. Worth remembering: if a future
  module needs the same separation (asked items ≠ distractor items),
  this is the proven pattern.
- **Tempting distractors** for chromatic: same-tonic opposite-direction
  chromatic (tests asc-vs-desc spelling discrimination) + same-tonic
  major scale (tests "is this really every half step?"). The old
  scales-specific relative-major/minor temptation block was replaced.
- **Audio namespace renamed** `NH.audio_scales` → `NH.audio_chromatic`.
  Each module's local audio voice gets its own slot under the global NH
  namespace. The Proxy in the game-loop block checks the renamed slot
  first, then falls back to `NH.audio`. Pattern unchanged from scales.
- **Tile design** (play.html, Reading section after Scales): coral
  background, dense sharp-glyph staff art with alternating natural +
  sharp glyphs climbing the staff, "half steps?" caption.
- **Path placement:** between Scales and Scale Degrees in path.html
  PATH and qn-profile.js PATH. Both lists kept identical (a
  recurring requirement — search "PATH" in both files when adding any
  module).
- **Module ks is always 0** for chromatic — no key signature is drawn;
  every chromatic note carries its own accidental glyph explicitly.
  `needsExplicitAccidental` returns true for chromatic notes because
  mode is neither `major` nor `minor-natural` and `ksAccForLetter` is
  empty (ks=0). No code change needed to that helper — it falls through
  correctly.
- **Sanity check** rewritten for chromatic: every entry must be 13
  notes, tonic-to-tonic, every adjacent pair ±1 semitone, octave span
  ±12. All 24 pass on script load. Output: `[CHROM] ✓ Sanity check
  passed: 24 chromatic scales validated (12 asc, 12 desc)`.

**Spec:** `specs/chromatic-scale-spec.md` (the canonical record for the
spelling convention, tier breakdown, distractor strategy, and the
"what this is NOT" list).

**Catches worth remembering:**

- **`git commit -m "$(cat <<'EOF' ... EOF)"` failed on this commit
  message.** The eval got confused by some character combination in the
  body (likely the `+/-` chars or the en-dash). Switched to writing the
  message to `/tmp/qn-commit-msg.txt` and using `git commit -F` — worked
  immediately. **Workflow lesson:** for commit messages with any
  unusual punctuation, just write to a temp file. Don't fight bash
  escapes.
- **`Edit` requires Read-first ON THE NEW FILE PATH after `cp source
  dest`.** A copy creates a fresh path the harness hasn't tracked; the
  first Edit attempts fail with "File has not been read yet." A single
  Read of any 1-line slice unlocks Edit. Cheap; just do it after every
  `cp`.

---

**Still open / next (updated):**

COMPLETED this session:
- ✅ Chromatic Scale (Phase 2 #1) shipped to all 4 surfaces.
- ✅ CLAUDE.md + QUIZNOTE_PROJECT_DOC.md updated for the new live count
  and the Phase 2 progress.

STILL OPEN (ordered by priority):

**Phase 2 expansions — remaining (7 items):**

1. Expand Scales: pentatonic + scale-type selector
   (major/natural/harmonic/melodic/pentatonic)
2. Expand Key Signatures: minor keys + major/minor/both selector
3. Expand Ear: Scales: pentatonic + selector
4. Expand Primary Chords: minor keys + selector. Accuracy: V is MAJOR
   in minor (raised leading tone from harmonic minor)
5. Expand Scale Degrees: minor keys + selector
6. Expand Roman Numerals: minor keys + selector
7. Verify + expand if needed: Intervals — clef selector

**These are EDIT-IN-PLACE expansions to existing working modules,
NOT clone-and-swap new-module builds.** The "module builds are always
additive" rule (copy to a new file) does not apply here. They are
direct edits to live working code and must NOT break current Major-key
behavior. Treat each as its own session; surface the diff for review
before committing. The selector pattern (MANDATORY per CLAUDE.md) is
the right shape for each — use the existing difficulty-selector tile
pattern as the model.

**Phase 3 (queued, single dedicated engineering session):** chord
renderer extension. Extend `qn-staff.js` with 3-note (root-position
triad) and 4-note (seventh chord) rendering — stacked noteheads +
shared stem geometry, proper accidental placement for upper chord
tones. Add `playChord(rootMidi, thirdMidi, fifthMidi[, seventhMidi])`
helper to `qn-audio.js` (block chord with light arpeggiation, modelled
on `playInterval`). **Gates all of Phase 4.** Shared-file change =
Tier 3, own session per CLAUDE.md.

**Phase 4 (after Phase 3 lands):** 8 Level 3 chord modules. Cleanly
clone-and-swap once the chord renderer exists: Triads, Triad Inversions,
Seventh Chords, Chord Progressions, Cadences, Ear: Chord Quality,
Ear: Cadences, Ear: Chord Progressions.

**Still flagged for a cleanup pass (no urgency):**

- Orphan CSS in `index.html` (`.tier-section`, `.tier-header`,
  `.tier-meta`, `.tier-desc`, old `.ltile-*` / `.bg-*` rules) left over
  from the May 2026 vertical-spine redesign. Harmless but unused.
  Sweep when next touching that file.
- `time-signatures` `accStartX:72` pin (QA first).
- `time-signatures` prompt-layout conversion + `scales` tile
  reconciliation. Both need a slider harness per §8 before they can move.

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

**Doc updates done (this session, follow-up commits):**
- ✅ Tier reconciliation across all four surfaces (Intervals → Reading;
  Ear: Intervals + Ear: Scales → Reading per Option B). play.html
  tiles moved, path.html MODULES + PATH updated, qn-profile.js PATH
  re-ordered, CLAUDE.md status updated.
- ✅ QUIZNOTE_PROJECT_DOC.md §5 + §12 reconciled to the 27-module
  roster. Four Phase 1 modules added with full entries. Tier
  reconciliation locked in. Dropped-from-roster decisions documented
  (Rhythm Reading folded into Time Signatures Tricky tier; Circle of
  Fifths cut; Stretch tier retired). §12 rewritten as four-phase
  plan (Phase 1 done, Phase 2 next, Phase 3 chord renderer, Phase 4
  chord cluster).

**Still flagged for a cleanup pass:**
- Orphan CSS in index.html: `.tier-section`, `.tier-header`,
  `.tier-meta`, `.tier-desc`, the old `.ltile-*` and `.bg-*` rules
  for the deleted tile grid. Harmless but unused — sweep when next
  touching that file.

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

---

## May 2026 — Full roster session: Phase 2 + 3 + 4 complete (19 → 27 live modules)

**Largest single session in the project's history.** 10 commits, 20 files changed, ~14,000 lines added.
Completed all four build phases, taking the roster from 19 live modules to the full 27-module target.
Branch: `claude/autonomous-module-builds-Ej8Nq` (all work pushed).

### Phase 2 — Reading Level-2 gaps + expansions (all 7 items closed)

**Scales** — Added 28 pentatonic scales (major + minor pentatonic, derived from diatonic data).
6-option scale-type selector (All/Major/Natural/Harmonic/Melodic/Pentatonic). Dynamic `getPool(difficulty, scaleType)`
replaces static POOLS. Pentatonic enters the "All types" pool at Medium tier. Sanity check updated for
variable note counts (6 for pentatonic vs 8 for diatonic). Dashboard skill labels added.

**Key Signatures** — Added 15 minor keys (Am through Abm). Major/Minor/Both selector. Dynamic `getKeyPool`.
Relative-key distractor (same key signature, opposite mode) is the primary tempting distractor — the core
pedagogical challenge of this expansion. Settings persisted via `ks_settings`.

**Ear: Scales** — Parallel pentatonic + type selector expansion mirroring Scales.

**Primary Chords** — Minor key chord data (i/iv/V — V is MAJOR in minor per harmonic minor). Major/Minor/Both
selector. Relative-key distractors in "Both" mode.

**Scale Degrees** — Minor key degree names. Critical distinction: degree 7 = subtonic in natural minor (NOT
leading tone). Major/Minor/Both selector.

**Roman Numerals** — Harmonic minor conventions: i, ii°, III+, iv, V, VI, vii°. Major/Minor/Both selector.

**Intervals** — Clef selector (treble/bass/both) verified as already fully functional. No expansion needed.

### Phase 3 — Chord renderer engineering session (1 commit)

**qn-staff.js v1.3.0** — `buildChord()` renders 3-4 stacked noteheads with shared stem, seconds
displacement (adjacent diatonic steps offset right), ledger lines as union of all notes, and staggered
accidental placement (zigzag column assignment avoiding vertical collision). `buildStaffWithChord()` is the
high-level composer (staff frame + clef + optional key sig + chord in one call). Notehead sizing matches
intervals (rx=0.70, ry=0.50, tilt=-16°). All existing functions unchanged, zero blast radius.

**qn-audio.js v1.1.0** — `playChord(midiArray, opts)` plays block chords with 40ms arpeggiation between
note onsets. Triangle + square-wave attack click per note, routed through masterGain. Per-note gain scaled
by chord size to avoid clipping. Modeled on the proven playFanfare chord voicing pattern.

### Phase 4 — Theory chord cluster (8 new modules)

All 8 modules cloned from intervals.html pattern using the new Phase 3 renderer + audio.

**Single-chord identification (visual):**
- **Triads** (triads.html, `tr_`) — 29 chords across 4 qualities (major/minor/dim/aug). Tiers by quality count.
- **Triad Inversions** (triad-inversions.html, `ti_`) — 36 chords (6 roots × 3 inversions × 2 qualities).
  "3rd inversion" as pedagogically interesting never-correct distractor (only exists for 7th chords).
- **Seventh Chords** (seventh-chords.html, `s7_`) — 29 chords across 5 qualities (dom7/maj7/min7/half-dim/dim7).

**Multi-chord sequences (visual + audio):**
- **Chord Progressions** (chord-progressions.html, `cp_`) — 13 entries across 5 progression types
  (I-IV-V-I, I-V-vi-IV, ii-V-I, I-vi-IV-V, IV-V-I) in 3 keys. Wider staff (540px), 700ms chord gaps.
- **Cadences** (cadences.html, `cd_`) — 18 entries across 4 cadence types (perfect authentic, plagal,
  half, deceptive) in 4-5 keys. Two chords rendered side by side with arrow + roman numeral labels.

**Ear training (audio-only):**
- **Ear: Chord Quality** (ear-chords.html, `ec_`) — Clone of Triads with staff hidden behind 🎧.
- **Ear: Cadences** (ear-cadences.html, `ecd_`) — 18 cadences, audio-only, 800ms gap between chords.
- **Ear: Chord Progressions** (ear-progressions.html, `ep_`) — Same progression data, audio-only.

### Four-surface update (atomic commit)

All 8 new modules wired into:
- **play.html** — 8 new Theory-tier tiles; "More to come" placeholders removed from all 3 sections
  (27-module roster is complete, no more placeholders needed)
- **path.html** — MODULES (8 entries), PATH (8 appended), SHORT_PREFIX (8 entries)
- **qn-profile.js** — recommender PATH extended with 8 chord modules
- **dashboard.html** — MODULE_META for 8 new modules + chromatic-scale (was missing)

### Still open / next

1. **Visual QA** — All 8 new chord modules + the 7 Phase 2 expansions need browser testing.
   JS parses cleanly in all files; structure follows proven patterns; but rendered output needs
   real-browser verification (especially chord renderer stacking, accidental placement, and
   multi-chord layout in Cadences/Progressions).
2. **Sampled-piano audio** (Tier 2) — still on the roadmap per project doc.
3. **Time-signatures `accStartX: 72` pin** + the 2 `qn-theme.css` holdouts (carried from prior sessions).
4. **Notehead rendering in qn-staff.js** — still blocks retiring Note Names / Piano Quiz per-module
   note positioning (carried).
5. **QUIZNOTE_PROJECT_DOC.md** needs update: §5 module roster statuses (8 Theory modules → Live),
   §12 phase plan (Phases 2-4 → DONE). This file's revision header needs bumping.

### Decisions made (Tier 1/2, not paused)

- Pentatonic enters "All types" pool at Medium tier (simpler than harmonic/melodic, shouldn't wait for Tricky)
- Type-specific pools use 5/9/all key tiers for meaningful difficulty progression within a single scale type
- For key-signatures minor, relative-key distractor is always the primary tempting distractor
- V is always MAJOR in minor keys (harmonic minor convention) across Primary Chords, Roman Numerals, Cadences
- Degree 7 in natural minor = "subtonic" (not "leading tone") in Scale Degrees
- Roman Numerals uses harmonic minor conventions: i, ii°, III+, iv, V, VI, vii°
- "3rd inversion" used as pedagogically interesting distractor in Triad Inversions (only exists for 7ths)
- Augmented triads and diminished/half-dim 7ths use ks:0 with all accidentals explicit (chromatic chords)
- All chord modules use the existing synthesized audio (Tier 1); multi-timbre (Tier 3) deferred
