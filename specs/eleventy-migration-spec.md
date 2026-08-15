# Spec — De-duplication + 11ty (Eleventy) migration

**Status:** APPROVED and **UN-GATED** (Jonathan, August 2026). The earlier post-launch
gate is **lifted** — the de-dup work can start now; it no longer waits on terms/privacy +
pricing/Stripe. Until the migration actually ships, the repo stays flat-static / no-build
per CLAUDE.md (this migration is what replaces that, incrementally on a branch off Dev).

**Revision history:**
- *May 2026* — original plan (HTML-templating framing).
- *Aug 2026 (a)* — reconciled against the real repo: found **three layers** of duplication
  (HTML / CSS / inline-JS), the JS being biggest.
- *Aug 2026 (b) — THIS REVISION* — folded in a **two-model adversarial risk audit**
  (Fable 5 + Sonnet, independent reads of the real module bodies). Both found the plan's
  central premise — *"one shared lifecycle, each module keeps only `makeQuestion()`"* —
  is **empirically false**, plus a silent data-corruption path no prior gate catches. The
  numbers below are revised **down** on payoff and **up** on effort accordingly. §3 is the
  new must-read.

---

## 1. Why (the problem, measured)

- **48 root `.html` files, 91,065 total lines.** ~35 game modules at ~1,700–2,600 lines
  each; the rest are catalog/legal/support pages + `pianoquiz-demo` + `_`-prefixed tools.
- Every game module is a clone-and-swap of the same skeleton, duplicated in **three
  layers**: HTML scaffold (~280 lines), inline CSS (~320–430 lines — *varies*, not a flat
  355), and inline `<script>` (~1,500 lines, of which a large share is copy-pasted round-
  lifecycle boilerplate).
- **Goal (unchanged): one-file changes instead of 35-file changes.** Today's app-icon
  rollout (had to touch every entry page by hand) is the pain in miniature. The line count
  is a proxy; iteration speed is the real prize.

---

## 2. The three layers of duplication

| Layer | ~lines/module | Fix | Tool |
|---|---|---|---|
| **A. Inline JS boilerplate** | ~700–1,000 *claimed* | Extract shared round-lifecycle into a shared engine; module keeps its question logic | plain JS (`qn-engine.js`) |
| **B. Inline CSS** | ~200–300 of ~320–430 | Move shared selectors into `qn-theme.css` | plain CSS |
| **C. HTML scaffold** | ~280 (+head) | Templatize head + header + 3 screens + footer | **11ty** |

**⚠️ The audit corrected Layer A (see §3):** the *verbatim-extractable* core is only
~250–350 lines/module (timer, hints, screen-switch, settings shell). The other ~400–650
"boilerplate" lines are **per-module-flavored** (answer loop, round start/end, history,
drill, event-logging) — 14–17 variants across the standard modules **plus three other
whole families**. So Layer A is a *design* problem, not a cut-and-paste one, and the
90K→15K target was optimistic (see §9).

---

## 3. ⚠️ Risk-audit findings (Fable + Sonnet, reconciled) — READ FIRST

Two independent adversarial audits read the real function *bodies* (not grep). They agreed
on the big items; unique finds are labeled. Severity: BLOCKER / HIGH / MEDIUM.

### 3.1 The lifecycle families (BLOCKER — both models)
There is **no single shared round lifecycle.** There are ~4:

- **Family A — "standard" (~26 modules):** `showScreen`/`startRound`/`onCorrect`/`onWrong`/
  `onTimeUp` (e.g. `intervals`, `triads`, `dynamics`, `note-names`). **But within Family A,
  Fable hash-compared bodies and found 17 distinct `startRound`, 14 `onWrong`, 15
  `onCorrect`, ~24 `nextQuestion`** — they differ in *substance* (correct-answer lookup by
  data shape, shake/reveal hooks, reveal text derivation, timings 1400ms vs 1600ms), not
  formatting. Only **one** truly-uniform cluster exists: `articulation` / `dynamics` /
  `ornaments` / `score-navigation` / `tempo-markings` / `circle-of-fifths` (identical
  `onWrong` + `startRound`). That 6-module cluster is the *only* place "4–6 modules/session"
  holds; most other "batches" are batches of one or two.
- **Family B — QNM engine, ALREADY EXISTS (4 modules):** `dotted-notes`, `note-values`,
  `time-signatures`, `ear-rhythm` set `window.QNM = {slug, namespace, buildPool,
  buildChoices, labelFor, …}` consumed by a *shared game-loop* with a unified
  `handleAnswer`/`startGame` — **no `onCorrect`/`onWrong`/`startRound`/`tickTimer` at all.**
  This is an undocumented, already-shipped mini shared-engine. Phase 1 must decide: adopt
  QNM as the target, extend it, or port these 4 off it. (The mock-exam spec's "QNM contract
  audit" refers to this; QNM lives only in these 4 files.)
- **Family B-hybrid (1 module):** `key-signatures` — `startGame`/`handleAnswer` family but
  uses `const M = KS.fx` (not `window.QNM`). Same shape, different contract.
- **Family C — scales quartet (4 modules):** `scales`, `scale-modes`, `chromatic-scale`,
  `ear-scales` — `show('play-screen')` (full element id), unified `onAnswer`, extra
  features (`skillTally` sub-skill tracking, `lastResults`, `missed`), state uses
  `qIndex`/`answered` not `q`/`locked`, `startTimerIfNeeded`, and **`showToast` has REVERSED
  argument order** (`showToast('correct', praise)` vs standard `showToast(msg, 'reveal')`).
  *Good news:* these 4 are internally consistent with each other — a clean, isolated case.
- **Special: `piano-quiz`** — Family A plus the bespoke keyGuide press-to-reveal flow
  (`keyGuide`/`showKeyGuide`/`updateKeyHalo`) threaded through its answer path.

**Implication:** the real engine contract is not `makeQuestion()` + config — it's **~8–12
per-module hooks** (`correctIndexOf`, `answerText`, shake/pop targets, history record,
skills key, drill seed, timings, renderers). Every module ships an adapter; the contract
gets stress-tested and redesigned repeatedly. Count ~10 "first-of-its-kind" modules, not
1 pilot + 34 stamps.

### 3.2 Silent `qn_events` analytics-payload drift (HIGH — Fable; the most dangerous find)
Each module writes per-round `skills` tallies to the **persisted event log** in a different
*shape*: `{label,lowerName,upperName,kind,clef}` (intervals) vs `{type,skill,display,
answer,kind}` (dynamics) vs `{pitch,display,kind,clef}` (piano-quiz) vs `{key,correct,
picked}` (key-signatures — boolean, no `kind`); scales uses `skillTally` keyed by mode, no
history at all. If the engine normalizes these, the `skills` keys written to `qn_events`
change → the **recommender / weak-spots / XP** silently drift, with **zero init throw and
pixel-identical screens.** This passes *every* verification gate the old spec defined. This
is the crown-jewel risk and the reason for a new gate (§7).

### 3.3 Audio wiring + `defer` timing trap (BLOCKER/HIGH — both models)
Two incompatible strategies: ~20 modules use a lazy `Proxy` over external `qn-audio.js`
(`defer`) / module-local audio; ~13–15 modules **build audio inline and reference it
directly** (`const A = NH.audio`). A non-deferred inline `<script>` runs *during parsing*,
before any `defer`red file — so if shared `onCorrect`/`onWrong`/`showHintCard` (which call
`A.playChime()`) move into an external deferred `qn-engine.js`, the direct-reference modules
get `A === undefined` → **a throw on the first answer click**, not at boot. **The init-trace
verifies boot only and will pass this straight through** (BUILD_LOG documents this exact
blind spot). `primary-chords` even does *both* patterns at once — a grep-based classifier
would mis-handle it. (The two audits gave slightly different counts — 22/13 vs 20/15 — which
is itself a signal that the inventory must be re-audited at kickoff, §3.6.)

### 3.4 localStorage key collisions (MEDIUM — Fable)
- **`pq_muted` is shared by 11 modules** (accidentals, articulation, circle-of-fifths,
  dynamics, note-names, ornaments, piano-keyboard, piano-quiz, scale-degrees,
  score-navigation, tempo-markings) — muting one mutes the others *today*.
- **`tr_muted` collides between `triads` and `transposition`** (clone-era).
- Several modules persist settings under **two** keys (`ar_settings`+`articulation_settings`;
  `sd_settings`+`scale-degrees_settings`).
A uniform engine must preserve these collisions bug-for-bug (per-module key config) or
migrate keys (a user-visible settings reset) — a Tier 2/3 decision, not mechanics.

### 3.5 Live product bugs the extraction must consciously preserve or fix (HIGH — Sonnet)
`applyPathHandoff()` (Studio's "jump here with your settings" deep-link) is **absent from 4
modules** (`note-values`, `ear-rhythm`, `dotted-notes`, `time-signatures`) — the feature is
*already dead* for them in production. A mechanical engine that wires it into all 35 boot
sequences would silently *fix* it — which §10 forbids ("no behavior changes"). Must be a
conscious call. Only findable by checking each boot sequence (an *absent* call is invisible
to body-diffing).

### 3.6 The plan's own inputs are stale/missing (MEDIUM — both)
- **The verification tool doesn't exist.** `/tmp/trace-any.js` (cited by CLAUDE.md and this
  spec) was session-temp and is **gone** — it must be rebuilt before Phase 1 can be verified.
- **Doc metrics are already wrong:** `hintKeyFor` is defined in 12 modules (docs say 10);
  `note-names` has **zero** `hintKeyFor` despite the log claiming it's wired. → Re-run the
  "N modules define X" inventory against live files before finalizing session counts.
- **ES5/ES6 split blocks byte-verification:** the Phase-4 chord cluster is ES5 (`var`,
  `function(){}`); the rest is ES6. Semantically-identical bodies are never byte-identical,
  so the "copy bytes, byte-verify" discipline from the CSS extraction **does not transfer** —
  every consolidation is a semantic rewrite (the exact edit class behind the historic
  30-module brace-corruption incident).
- **Drill-mode divergence:** the missed-items drill exists in ~24/35 modules in **three**
  implementations (label-deck seed / id-set re-roll / `shuffleDeck` seed) and is absent from
  7 chord modules + the scales family. Unifying it either adds a feature to 11 modules
  (behavior change) or parameterizes three strategies.

### 3.7 What genuinely IS shared (verified — the good news)
`getHint` identical in 30/31; `startTimer`/`tickTimer`/`updateProgress` identical across all
Family-A modules; `showHintCard` 26/31; settings-card DOM ids (`timer-row`/`hints-row`/
`sound-row`/`*-pill-state`) uniform across **all** families including scales; the optional
`typeof hintKeyFor` hint glue is extractable as-is. This ~250–350-line shell is the safe,
clean first extraction.

---

## 4. Three pre-code decisions (Tier 2/3 — must be made BEFORE Phase 1 touches code)

1. **QNM's fate.** Adopt the existing `window.QNM` contract as the engine target and port
   Family A onto it? Extend QNM? Or port the 4 QNM modules + `key-signatures` *off* it onto
   a new contract? This picks the whole engine's shape — decide first.
2. **localStorage collision policy.** Preserve `pq_muted`(×11)/`tr_muted`/double-key
   settings bug-for-bug (per-module key config), or migrate to clean per-slug keys (accepts a
   one-time user settings reset)?
3. **Preserve-vs-fix the live bugs.** `applyPathHandoff` missing from 4 modules; the muted
   collisions. Decide per bug: keep behavior identical (spec's default) or fix as a deliberate,
   separately-logged change.

---

## 5. Phased plan (revised)

### Phase 0 — Reconnaissance + decisions. *NEW, do this first.*
Map every module to its family; produce the definitive family/audio/key/drill inventory
(re-audited against live files, not the stale docs); make the three §4 decisions; **rebuild
the DOM-mock init-trace tool** and build the two new gates (§7). No module code changes.

### Phase 1 — Shared engine extraction (`qn-engine.js`). *The big one.*
Design the engine + descriptor **on a per-family basis** (not one contract for all). Extract
the safe shell first (§3.7), then the family-specific adapters. Order: the uniform 6-module
Family-A cluster → the rest of Family A → decide+do Family B (QNM) → `key-signatures` hybrid
→ Family C (or leave hand-rolled, accepting the line cost) → `piano-quiz`. Keep the old
inline JS until each twin passes all gates (§7).

### Phase 2 — Finish CSS extraction (Layer B).
Audit per-module inline CSS (byte-identical / partial / divergent), move shared rules to
`qn-theme.css`, keep divergent inline (e.g. `scales`' toast model). CSS length varies
321–434 lines, so expect similar underestimation to Layer A — size it after Phase 1.

### Phase 3 — 11ty templating (Layer C).
Now modules are slim; templatize the shell. Smallest step. (See §6 target structure.)

---

## 6. Tool + target structure

**11ty (Eleventy).** Pure templating → plain static HTML. No framework, no hydration; all
vanilla JS (`qn-*.js`, `qn-engine.js`, module descriptors) stays and is served via
passthrough. Nunjucks (`.njk`). Vercel build command `npx @11ty/eleventy`, output `dist/`;
**push-to-Dev → Vercel preview flow preserved.**

```
src/
  _includes/  base.njk · start-screen.njk · play-screen.njk · summary-screen.njk · module.njk
  modules/    note-names.njk … (front-matter + unique q-blocks/descriptor/hints/cards)
  index.njk play.njk studio.njk profile.njk  (catalog — own templates)
  privacy.njk terms.njk rewards.njk path.njk
.eleventy.js  (passthrough qn-*.js/css + apple-touch-icon.png; out=dist/)
package.json  (@11ty/eleventy devDep + "build": "eleventy")
```
Per-module front-matter drives the conditional `<script src>` set (staff modules add
`qn-staff.js`, clef modules `qn-ui.js`, audio modules `qn-audio.js`) and the family it
belongs to.

---

## 7. Verification gates (per module, before deleting the old file) — EXPANDED

The old gates (init-trace + structural + screen parity) are **necessary but insufficient** —
they miss the two worst risks (§3.2, §3.3). Required set:

1. **Rebuilt DOM-mock init-trace** (`/tmp/trace-any.js` is gone — rebuild it in Phase 0):
   no init throw.
2. **Scripted answer-path exercise — NEW.** Drive 6 paths headlessly per module: clean-
   correct / retry-then-correct / second-miss reveal / timeout / drill round / hint show-
   dismiss. Catches the first-click audio throw (§3.3) and logic bugs init-trace can't.
3. **`qn_events` payload diff — NEW.** Capture the `QN.events.logOrHold` payload old-vs-new
   for each of those paths; **it must be byte-identical** (or the change must be a
   deliberately-logged §4.3 decision). This is the only gate that catches §3.2.
4. **Rendered parity** start/play/summary screen-for-screen; **structural** balance + all
   `qn-*.js` present + CSS vars resolve; **four-surface** data (index/play/studio/qn-profile)
   still consistent.

---

## 8. Cheap wins the build step unlocks (fold in while migrating)
- **Shared `<head>` = one-file global changes** (apple-touch-icon/PWA/favicon/theme-color/
  fonts/analytics) — today's N-file icon chore becomes one edit.
- **Strip `qn-debug.js` from the prod build** (dev-only include the prod build omits).
- **Kill the `path.html` redirect file** — emit the redirect from 11ty data.

---

## 9. Effort + payoff (REVISED per the audit)

- **Effort:** Phase 0 ~1–2 sessions. **Phase 1 alone ~9–13 sessions** (multi-family contract
  design ×2–3 iterations, ~35 adapters, the rebuilt trace + answer-path + event-payload
  gates). Phase 2 ~1–2. Phase 3 ~1–2. **Total ~13–18 sessions** (was 10–13). "4–6
  modules/session" holds only for the single uniform 6-module cluster; most batches are 1–2.
- **Payoff:** realistic landing **~90K → ~30–35K**, not 15–20K — *unless* the scales family
  (and other hand-rolled outliers) are force-migrated, which forfeits ~10K and adds risk.
  Still a large win, and the **iteration-speed** prize (one-file changes) is fully intact.
- All phases: branch-off-Dev, incremental, reversible. Never a big-bang.

---

## 10. Out of scope (do NOT bundle in)
- No redesigns, no new modules, **no behavior changes.** Pure de-duplication. If a built page
  differs from its current live page, that's a **bug to fix, not an accepted change** — with
  the three §4 exceptions, which are *deliberate, logged* decisions, not silent drift.
- No client JS framework. No CSS preprocessor. Keep vanilla.
- Discipline (per-module verification), not timing, is what protects the shippable app — the
  post-launch gate was lifted Aug 2026.
