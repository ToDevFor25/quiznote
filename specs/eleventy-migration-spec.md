# Spec — 11ty (Eleventy) component-layer migration

**Status:** APPROVED, sequenced **POST-LAUNCH** (Jonathan, May 2026). Do not start
until launch is done (terms/privacy sign-off + pricing/Stripe shipped). Until it
ships, the repo stays flat-static / no-build per CLAUDE.md.

## Why
~1,900 lines of identical scaffold (head, `.site-header`/nav slot, `#start-screen`,
`#play-screen`, `#summary-screen`, footer) are copy-pasted into all 35 modules;
only ~150–400 lines per module are unique (question engine + tile/config + hint
content + explainer cards). Every cross-cutting change is therefore an N-file
edit (this whole session: svh fix, rubber-band, pop-in, footer year — all ×35).

**Goal: one-file changes instead of 35-file changes.** Expected HTML ~90K → ~15–20K.
The line count is a proxy; the real win is iteration speed.

## Tool
**11ty (Eleventy).** Pure templating → outputs **plain static HTML**. No JS
framework, no hydration. All existing vanilla JS (engines, qn-*.js) stays as-is.
Chosen over Astro for the smallest leap (no component-island concepts).

## Target structure
```
src/
  _includes/
    base.njk            # <head>, fonts, qn-*.js/css links, <body>, header, footer
    start-screen.njk    # the shared start-screen scaffold (scroll/bar/cue/settings card)
    play-screen.njk     # shared play scaffold (topbar, play-body, hint overlay)
    summary-screen.njk  # shared summary scaffold
  modules/
    note-names.njk      # front-matter (title, tagline, slug, clef opts…) + UNIQUE
                        # q-blocks + the module's engine <script>
    ...
  catalog: index, play, path, dashboard, profile, privacy, terms  (own templates)
.eleventy.js            # config: passthrough qn-*.js/css, output to dist/
package.json            # @11ty/eleventy devDep + build script
```
Deploy: Vercel build command `npx @11ty/eleventy`, output dir `dist/`. **Push-to-Dev
→ Vercel preview flow is preserved** — Vercel just runs the build now.

## What's shared vs unique (the split)
- **Shared (→ _includes):** head/meta, fonts, all `<script src=qn-*.js>` + `qn-theme.css`
  link, `.site-header` + `#qn-nav-slot`, the entire start/play/summary scaffolds,
  footer (with the `data-qn-year` span). The per-module `:root` vars + `#start-screen`
  inline rule + the start-bar/scroll bits → fold into shared CSS at last (or keep
  qn-theme.css as the home; this migration is a chance to finally move `#start-screen`
  + `body` rules out of inline).
- **Unique (→ each module .njk):** title/tagline, the question-config q-blocks
  (clef/tier/length tiles — these differ), the module's engine `<script>`, hint
  content, explainer cards, any module-specific CSS.

## Method (same discipline as the start-bar rollout)
1. **Scaffold 11ty** + base layout. Get ONE catalog page (e.g. `play`) building to
   byte-equivalent output first (it's simpler than a module).
2. **Pilot: `note-names`.** Build it via the layout; diff the *rendered* output +
   run the DOM-mock init-trace; confirm screen-for-screen parity with the live file.
   Keep the old `note-names.html` until parity is signed off.
3. **Roll out in verified batches.** Per batch: build, init-trace, structural
   checks (brace/tag balance), behavior parity vs the current live module.
4. **Outliers — handle in their own batch, carefully:**
   - `scales` — perennial structural outlier (own toast model etc.); audit separately.
   - 8 Phase-4 chord modules — footer used `&copy;`/`&middot;` entities; other
     subtle clone-era differences likely. Verify individually.
   - 4 non-`showScreen` modules (scales, scale-modes, ear-scales, chromatic-scale).
   - `pianoquiz-demo` — EXCLUDE (standalone demo, no shared deps).
   - catalog (`index/play/path/dashboard`) + `profile/privacy/terms` — distinct
     shapes; templatize but don't force the module layout on them.
5. **Cutover:** only delete a source `*.html` once its built twin is parity-confirmed.

## Verification gates (per module, before deleting the old file)
- Rendered output matches current screen-for-screen (start / play / summary).
- DOM-mock init-trace: no init throw.
- Structural: `<div>`/`<section>`/`<script>` balance, CSS braces, all qn-*.js present.
- The four-surface data (play/path/index/qn-profile) still consistent.

## Risk controls
- Branch off `Dev`; keep the current flat files intact until each twin is verified.
- Incremental — never a big-bang replace of all 35 at once.
- The migration changes HOW files are authored, NOT the shipped behavior; if a built
  page differs from its current live page, that's a bug to fix, not an accepted change.

## Out of scope (do NOT bundle into this migration)
- No redesigns, no new modules, no behavior changes. Pure de-duplication.
- No client JS framework. No CSS preprocessor. Keep vanilla.

## Line items to fold in WHILE migrating (cheap wins the build step enables)
- **Strip `qn-debug.js` from the production build.** Today it's a dev-only QA panel
  guarded by `?debug` (inert on prod, but still shipped ~10KB). Once 11ty gives us a
  build step, make it a dev-only include that the prod build omits entirely — turning
  the pragmatic `?debug` approach into proper build-time stripping for free. (Same
  could apply to any other dev-only tooling.)
