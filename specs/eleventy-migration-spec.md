# Spec — De-duplication + 11ty (Eleventy) migration

**Status:** APPROVED and **UN-GATED** (Jonathan, August 2026). The earlier
post-launch gate is **lifted** — the de-dup work can start now, it no longer waits on
terms/privacy + pricing/Stripe. Until the migration actually ships, the repo stays
flat-static / no-build per CLAUDE.md (this migration is what replaces that, done
incrementally on a branch off Dev).

**This revision (Aug 2026):** reconciled against the *current* repo (48 HTML files,
91,065 lines, all the Studio/gamification shared files). The May 2026 spec treated
this as an HTML-templating job; measuring the real files shows the duplication is in
**three layers** (HTML scaffold · inline CSS · inline JS boilerplate), and the JS
layer is the biggest one. That changes the plan — read §2 and §3 carefully.

---

## 1. Why (the problem, measured)

- **48 root `.html` files, 91,065 total lines.** ~35 are game modules at ~1,700–2,600
  lines each; the rest are catalog/legal/support pages (index, play, studio, profile,
  privacy, terms, rewards, path-redirect) + `pianoquiz-demo` + a couple `_`-prefixed
  internal tools.
- Every game module is a clone-and-swap of the same skeleton. Measured on `note-names`
  (2,206 lines), a representative module decomposes as:
  | Region | Lines | Duplication |
  |---|---|---|
  | `<head>` meta + `qn-*.js`/css links | ~25 | ~identical |
  | inline `<style>` block | ~355 | mostly shared, some unique |
  | `<header class="site-header">` | ~4 | identical |
  | `#start-screen` scaffold | ~120 | ~identical (tiles differ) |
  | `#play-screen` scaffold | ~62 | identical |
  | `#summary-screen` scaffold | ~90 | identical |
  | `<footer class="site-footer">` | ~8 | identical |
  | inline `<script>` (3 blocks) | ~1,540 | **~60% shared boilerplate, ~40% unique engine** |
- **Proof the JS is duplicated, not just the HTML:** `function nextQuestion` is defined
  inline in **35** modules, `function showScreen` in **31**. The round lifecycle
  (screen switching, question loop, scoring, timer, settings-card wiring, hint display,
  start-scroll init) was copy-pasted per module rather than shared.

**So the ~90K → ~15–20K target is only reachable by de-duplicating all three layers.**
11ty templating alone (HTML scaffold) saves ~250 lines/module (~9K). The CSS and the
inline-JS boilerplate are where the rest of the reduction lives.

**Goal (unchanged): one-file changes instead of 35-file changes.** The line count is a
proxy; the real win is iteration speed. Today's session is the exhibit — the app-icon
tags had to go into every entry page by hand; a shared `<head>` makes that one edit.

---

## 2. The three layers of duplication (and how each is fixed)

| Layer | ~lines/module | Fix | Tool |
|---|---|---|---|
| **A. Inline JS boilerplate** | ~700–1,000 | Extract the shared round-lifecycle into a shared engine module; each module keeps only its question-generation/rendering | plain JS (`qn-engine.js`), **no 11ty needed** |
| **B. Inline CSS** | ~200–300 (of ~355) | Move remaining shared selectors into `qn-theme.css`; module keeps only its unique CSS | plain CSS, **no 11ty needed** |
| **C. HTML scaffold** | ~280 (+head) | Templatize head + header + 3 screens + footer into shared includes | **11ty** |

**Key realization:** Layers A and B can (and should) be done *first, on the flat repo,
with no build step*, incrementally and verifiably. Only Layer C needs 11ty. Doing A+B
first means that by the time we templatize, each module is already slim (front-matter +
unique engine + q-blocks), so the njk templates are small and the diffs are clean.

This also de-risks: the scary bug class in this repo (CLAUDE.md's "buttons dead = init
throw" from bulk brace corruption) comes from *bulk JS edits* — exactly Layer A. Doing
it as a deliberate, per-module-verified extraction is far safer than folding it into a
big-bang template cutover.

---

## 3. Recommended sequencing (three phases)

### Phase 1 — Shared engine extraction (Layer A). *Biggest lift, biggest payoff.*
Create **`qn-engine.js`**: the round lifecycle every module shares —
`showScreen`, the `nextQuestion`/answer/score loop, timer, settings-card wiring,
hint-engine glue (`getHint`/`attempts`/`shownHints` — see CLAUDE.md hint notes),
`qn-roundend` start-scroll/summary hooks. Each module registers a small **descriptor**:
```js
QN.engine.run({
  slug: 'note-names',
  makeQuestion(state) { /* UNIQUE: returns {prompt, choices, correct, render, hintKeyFor} */ },
  tiers: {...}, lengths: [...], /* module config */
});
```
Everything that is *not* `makeQuestion` + its renderers + hint content + explainer
cards moves into the engine. Do it **one module at a time**, DOM-mock init-trace +
behavior parity per module, keep the old inline JS until the twin passes.
Expected: each module sheds ~700–1,000 lines. This phase alone is most of the 90K→20K.

### Phase 2 — Finish CSS extraction (Layer B).
The May 2026 CSS extraction was "complete for the original 9"; the ~26 modules built
since re-inlined shared selectors. Audit per-module (byte-identical / partial /
divergent — never trust grep name-matching, per CLAUDE.md CSS method), move shared
rules into `qn-theme.css`, keep genuinely-divergent rules inline (e.g. `scales`' own
toast model). Finally move the long-deferred `#start-screen` base rule + `:root` var
block + start-bar bits into `qn-theme.css`.

### Phase 3 — 11ty templating (Layer C).
Now each module is ~front-matter + unique engine + q-blocks + explainer/hint content.
Templatize the shared shell. This is now the *smallest* step.

---

## 4. Tool

**11ty (Eleventy).** Pure templating → outputs **plain static HTML**. No JS framework,
no hydration. All vanilla JS (`qn-*.js`, the engine, module descriptors) stays as-is
and is served via passthrough copy. Chosen over Astro for the smallest leap (no
component-island concepts). Nunjucks (`.njk`) templates.

Deploy: Vercel build command `npx @11ty/eleventy`, output dir `dist/`. **Push-to-Dev →
Vercel preview flow is preserved** — Vercel just runs the build now instead of serving
raw files.

---

## 5. Target structure

```
src/
  _data/
    site.json            # brand, year, palette tokens if templated
  _includes/
    base.njk             # <head> (meta, apple-touch-icon/PWA, fonts, qn-*.js/css),
                         # <body>, .site-header + #qn-nav-slot, <footer>, script tail
    start-screen.njk     # shared start scaffold (scroll/bar/cue/settings card)
    play-screen.njk      # shared play scaffold (topbar, play-body, hint overlay)
    summary-screen.njk   # shared summary scaffold (round bar, stats)
    module.njk           # layout that composes the 3 screens for a game module
  modules/
    note-names.njk       # front-matter (title, tagline, slug, namespace, tier,
                         # clef opts, script flags) + UNIQUE q-blocks + explainer
                         # cards + hint content + module descriptor <script>
    ...  (×35)
  index.njk play.njk studio.njk profile.njk           # catalog — own templates
  privacy.njk terms.njk rewards.njk                    # docs — own (lighter) template
  path.njk                                             # redirect stub
.eleventy.js             # passthrough qn-*.js/css + apple-touch-icon.png; out=dist/
package.json             # @11ty/eleventy devDep + "build": "eleventy"
vercel.json (or dashboard): build=`npx @11ty/eleventy`, output=`dist`
```

### Front-matter schema (per module `.njk`)
```yaml
---
layout: module.njk
title: "Note Names"
tagline: "Name the note on the staff"
slug: note-names
namespace: NN            # the module's QN-namespace prefix
tier: reading            # foundations | reading | theory
scripts:                 # which optional shared files this module needs
  staff: true            # → include qn-staff.js
  clefTiles: true        # → include qn-ui.js + mount clef tiles
  audio: false           # → include qn-audio.js
selectors:               # start-screen config tiles (the part that really differs)
  clef: [treble, bass, both]
  difficulty: [easy, medium, tricky]
  length: [10, 20]
---
```
The base/module layout reads these to conditionally emit the right `<script src>` set
(today: 35 modules link the core set; clef modules add `qn-ui.js` (15), staff modules
add `qn-staff.js`; `qn-audio.js` only where sound plays). No more copy-paste script
blocks.

---

## 6. What's shared vs unique (the split, current)

- **Shared → `_includes` (HTML) / `qn-theme.css` (CSS) / `qn-engine.js` (JS):**
  head/meta, apple-touch-icon + PWA tags, fonts, all `qn-*.js` + `qn-theme.css` links,
  `.site-header` + `#qn-nav-slot`, the entire start/play/summary scaffolds, footer
  (`data-qn-year` span), and the round-lifecycle JS (§3 Phase 1).
- **Unique → each module `.njk`:** title/tagline, the selector/config q-blocks (clef/
  tier/length tiles — these genuinely differ), the module **descriptor** (`makeQuestion`
  + renderers + distractor logic), hint content (keyed by question type; some modules
  are context-aware via `hintKeyFor()`), explainer cards (3), any module-specific CSS.

---

## 7. Method (same discipline as the start-bar rollout)

1. **Phase 1/2 on the flat repo, per module, verified** — extract engine + CSS, keep the
   old inline code until the slimmed module passes: DOM-mock init-trace (no init throw)
   + behavior parity (rendered start/play/summary screen-for-screen) + structural checks.
2. **Scaffold 11ty** + `base.njk`. Get ONE catalog page (e.g. `play`) building to
   byte-equivalent output first — simpler than a module.
3. **Pilot module: `note-names`.** Build via `module.njk`; diff *rendered* output +
   init-trace + screen parity vs the live file. Keep old `note-names.html` until signed off.
4. **Roll out in verified batches** (5–8 modules). Per batch: build, init-trace, brace/
   tag balance, behavior parity vs the current live module.
5. **Cutover:** delete a source `*.html` only once its built twin is parity-confirmed.

---

## 8. Verification gates (per module, before deleting the old file)

- Rendered output matches current screen-for-screen (start / play / summary).
- DOM-mock init-trace (`/tmp/trace-any.js` per CLAUDE.md): **no init throw.**
- Structural: `<div>`/`<section>`/`<script>` balance, CSS braces balanced, all needed
  `qn-*.js` present, all CSS vars resolve, JS class refs intact.
- The four-surface data (play / studio MODULES+PATH / index / qn-profile PATH) still
  consistent — the migration must not silently drop a module from a surface.

---

## 9. Outliers & known traps (handle in their own batches)

- **`scales`** — perennial structural outlier (own toast model, non-`showScreen`);
  audit separately, never assume it matches.
- **4 non-`showScreen` modules** — `scales`, `scale-modes`, `ear-scales`,
  `chromatic-scale`. The engine extraction (Phase 1) must accommodate their pattern or
  they stay hand-rolled.
- **8 Phase-4 chord modules** — clone-era footer entity differences (`&copy;`/`&middot;`),
  subtle divergences; verify individually.
- **`index.html`** — carries a **blocking `<head>` return-user redirect**; `studio.html`
  auto-lands returning users. These head-scripts must be preserved verbatim in the
  templated head (they run before paint — order matters).
- **`pianoquiz-demo`** — EXCLUDE (standalone demo, no shared deps).
- **`piano-quiz` / `piano-keyboard`** — flagship guided-key-find + letter-button variants;
  more unique JS than average. Expect thinner engine extraction.
- **catalog + docs pages** — distinct shapes; give them their own templates, don't force
  the module layout on them.

---

## 10. Cheap wins the build step unlocks (fold in while migrating)

- **Shared `<head>` = one-file global changes.** apple-touch-icon / PWA meta / favicon /
  theme-color / analytics / font links all become single edits (today's icon work needed
  N-file edits — this is the poster child).
- **Strip `qn-debug.js` from the prod build.** Today it ships ~10KB, inert, guarded by
  `?debug`. Make it a dev-only include the prod build omits — proper build-time stripping
  for free.
- **Kill the `path.html` redirect file** — 11ty can emit the redirect from data.

---

## 11. Effort estimate (rough, post-launch)

- **Phase 1 (engine extraction):** the big one. ~1–2 focused sessions to design
  `qn-engine.js` + the descriptor contract on the pilot, then ~4–6 modules/session with
  per-module verification. Call it the bulk of the project.
- **Phase 2 (CSS finish):** ~1–2 sessions (mechanical, but audit-heavy).
- **Phase 3 (11ty templating):** ~1 session to scaffold + pilot, then fast batches once
  modules are slim.
- Whole thing is **branch-off-Dev, incremental, reversible** — never a big-bang.

---

## 12. Out of scope (do NOT bundle in)

- No redesigns, no new modules, **no behavior changes.** Pure de-duplication. If a built
  page differs from its current live page, that's a **bug to fix, not an accepted change.**
- No client JS framework. No CSS preprocessor. Keep vanilla.
- Keep it pure de-duplication with per-module verification — the discipline, not the
  timing, is what protects the shippable app. (The post-launch gate was lifted Aug 2026.)
