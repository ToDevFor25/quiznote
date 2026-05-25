# QuizNote — Project Doc (v2)

_Last revised: May 2026 — **All 27 modules live (Phases 1–4 complete).** Phase 2 expansions (pentatonic scales, minor keys + selectors across 7 modules), Phase 3 chord renderer (qn-staff.js v1.3.0 `buildChord` + qn-audio.js v1.1.0 `playChord`), Phase 4 chord cluster (8 new Theory modules: Triads, Triad Inversions, Seventh Chords, Chord Progressions, Cadences, Ear: Chord Quality, Ear: Cadences, Ear: Chord Progressions). Four-surface updates atomic. "More to come" placeholders retired from play.html. Prior: **Phase 1 of the curriculum redesign complete**, taking live roster 14 → 18. Shipped: Ledger Lines (clone of note-names, strict on-ledger pool), Dotted Notes & Ties (clone of note-values with dotted-glyph + CSS-tie-arc renderer, beat-value MC choices), Ear: Rhythm (clone of note-values with 🎧 audio placeholder, 60 BPM tick-then-tone cue, notes-only v1), Piano & Keyboard (clone of note-names, new C3..C6 keyboard SVG in NH.render with highlighted target key, clef selector hidden). Landing pages restructured: play.html now three collapsible level sections (Foundations / Reading / Theory) with "X/N completed" progress chips and FOUC-safe state restoration; index.html "What's Inside" replaced with a 3-row vertical-spine concept view (concept pills, not module tiles — decoupled from per-module tiering); hero stats trimmed to "0 Ads / 3 Skill tiers / Lots of fun"; pillars locked to 2×2 desktop / 1-col mobile. New CLAUDE.md working rule: module builds are autonomous (Tier 1/2 decisions made without pausing during clone-and-swap builds; only Tier 3 blockers stop the build). **§5 and §12 reconciled to the 27-module roster** (this session): four Phase 1 modules added with full entries, tier reconciliation locked in (Intervals + ear modules → Reading), dropped-from-roster decisions documented (Rhythm Reading folded in, Circle of Fifths cut, Stretch tier retired). §12 rewritten as a four-phase plan (Phase 1 done, Phase 2 next, Phase 3 chord renderer, Phase 4 chord cluster). Prior: Scale Modes (§5 #12) and Ear: Intervals (§5 #19) shipped earlier in May 2026, taking the live roster from 9 to 11. Both built using the clone-and-swap pattern: Scale Modes off `scales.html` (pure data swap to mode generator), Ear: Intervals off `intervals.html` (one CSS rule hides the staff and shows a 🎧 placeholder; audio + question logic byte-identical to sight Intervals). `index.html` landing roster reconciled with `play.html` (added the previously-missing Time Signatures + Scale Degrees tiles — pre-existing landing-page drift). Triads / 7ths / Primary Chords (§5 #14–16) explicitly deferred this session because they need 3-note chord rendering and no live module has that — queued as their own focused session that starts with a 3-note staff renderer extension. Prior: shared-CSS extraction COMPLETE (all 6 of 6 documented clusters in `qn-theme.css`: tokens + prompt + tiles + summary + start-screen + play-chassis + modal + buttons + page-chrome). Shared feedback toast rolled out to 8 of 9 modules (scales excluded by design — different feedback model). `QN.ui.confirm` rolled out to all 9 modules (was 2-of-9); per-module `showConfirm` definitions retired. Start-timer "Ready, set…" modal in all 9 modules (was 5-of-9). `qn-profile.js` v1.8.0 — `schemaVersion` migration hook installed (today's data IS v1, 0→1 is a no-op stamp; the hook is the value, future breaking shape changes plug into `migrations[]`). Latent timer-badge bug fixed (badge stayed hidden after pause/resume in note-values + time-signatures + key-signatures). All 4 working docs (`BUILD_LOG.md`, `BUILD_LOG_ARCHIVE.md`, `CLAUDE.md`, `QUIZNOTE_PROJECT_DOC.md`) now under version control. Prior: Key-sig clef-clearance made proportional in `qn-staff.js` (`lineGap * 4.5`); 4 CSS clusters extracted; all 9 quit dialogs unified to Option 1; "quiet A" prompt; `QN.ui.confirm` introduced; §8 rendered-result audit rule; roster expanded to 24; path-first three-ring IA; device reset. Two visual-QA items still open: time-signatures `accStartX:72` pin (QA-driven) and the 2 qn-theme.css holdouts (time-sigs prompt-layout + scales tile, both needing a slider harness per §8). Supersedes the v1 doc that locked the seven-module roster._

---

## 1. Product vision

QuizNote is a mobile-first music theory practice app for learners of any age, fluency-targeted rather than age-targeted. The product covers Western tonal theory comprehensively, from absolute-beginner staff reading through intermediate-level harmony and ear training. Practice is fast, attractive, and feels like progress.

The product is sold on three things, in this order:

**Polish.** The category is dominated by sites that look like 2008 worksheets. QuizNote looks and feels like a real product — chunky-button design system, real engraving via Bravura, considered audio, real motion. This is the moat that costs the least to defend.

**Direction.** Most competitors are buffets. A learner opening QuizNote on day 12 should know what to practice without choosing. A learning path, surfaced by default, with weak-spot tracking quietly serving up the right next thing.

**Mobile.** Phone-first, not phone-tolerated. A short practice on the bus is the canonical session.

## 2. Audience

Primary: beginners. Someone who knows what a treble clef is, can name maybe three notes on the staff, and wants to actually get fluent. Heavy emphasis on gentle onboarding, optional concept explainers before drills, and a path that says "start here."

Secondary: intermediates who want to drill and get faster. They want depth, harder tiers, free practice, and the ability to skip the path.

Out of scope: advanced theorists, music school students preparing for AP exams, jazz/modal/world-music specialists. The product can flirt with this audience later but isn't designed for them.

**Age framing.** Age-agnostic, fluency-based. Suitable for kids and adults. Account ownership follows applicable laws — child profiles are owned and managed by a parent/guardian account, never independently held by a minor. Privacy is a first-class concern. We collect the minimum necessary for a robust experience and nothing more.

## 3. Differentiators

What QuizNote does that competitors don't, in roughly the order users will notice them:

- Real mobile design. Thumb-reachable, fast, attractive.
- Real engraving (Bravura SMuFL font, canonical accidental positions, real staff layout).
- A learning path that defaults to "do this next" without removing free practice.
- Weak-spot tracking. The app quietly drills what you're shaky on, not what you've already mastered.
- Quality audio. Sampled piano baseline, multi-timbre where it matters (ear training).
- Concept explainers before drills (short, skippable after first view).
- Privacy-respecting, ad-free, cheap when monetized.

## 4. Architecture

### Current state

Each module is a single self-contained HTML file (~2000 lines) with embedded CSS and JS. Files deploy to Vercel via push. Shared profile/event/UI layer lives in `qn-profile.js`, loaded by every module. LocalStorage is the only persistence. No backend, no accounts beyond device-local profiles.

### Target state

Single-HTML-per-module survives roughly through module 10–12. Beyond that, the duplication cost on shared CSS and the audio engine becomes the bottleneck. The target architecture, reached incrementally:

- **Module template.** A canonical HTML scaffold that every new module is cloned from. The template contains the shared CSS, the audio engine, the profile chip mount, the start-screen pattern, the play-screen scaffolding, and the summary-screen pattern. New modules differ only in (a) their question generator, (b) their renderer, and (c) their localStorage namespace.
- **Module spec.** A JSON-shaped description of what makes a module a module: difficulty tiers, question types, answer format, scoring rules, audio behavior, explainer copy. A spec is the artifact a human writes. The HTML is generated from the spec plus the template.
- **Shared script files.** `qn-profile.js`, `qn-audio.js`, `qn-staff.js`, `qn-nav.js`, `qn-music.js`, and `qn-ui.js` are proven shared files. Modules become genuinely thin as more is extracted. **Consolidation caution (investigated May 2026):** the duplicated helpers have drifted — `parsePitch` is identical in 6 modules but scales' version is a *superset* (handles double accidentals `##`/`bb` for harmonic/melodic minor). Any `qn-music.js` extraction must diff each helper across all 7 files and lift the superset, not the first copy found. Likewise `qn-staff.js` covers staff lines/clef/key-sig/time-sig but NOT noteheads, so consolidating Note Names & Piano Quiz onto it requires adding notehead rendering first; Key Signatures is a clean candidate today (its accidental step arrays are byte-identical to the shared renderer). These are grouped as a future "consolidation pass" — see build log. **`qn-ui.js` (May 2026):** the home for visual shared helpers in the `QN.ui` namespace. v1.0.0 exports `QN.ui.clefTile({clef})` (canonical treble / bass / both clef-picker tile SVG) and `QN.ui.mountClefTiles(scope?)` (auto-mount on DOMContentLoaded). Created when the 14 modules with clef pickers were found to have drifted into 3 distinct visual variants per clef; calibration values dialed in via `_clef-calibrator.html` (internal tool, untracked). To change clef tile appearance globally, edit the `SINGLE` / `BOTH` config blocks in `qn-ui.js`.
- **Shared stylesheet — `qn-theme.css` (NEW, May 2026).** The first shared *CSS* file; the CSS sibling to the shared JS. Single source of truth for the design tokens (the 16 `--ink`/`--teal`/etc. variables, previously copied byte-identically into all 9 modules) and cross-module question-area styling (the canonical question prompt `.staff-label` and the answer-tile `.choice-btn` system). Each module links it in `<head>` (after the font link) and must NOT also define those rules inline — an inline copy at equal specificity but later source order silently overrides the shared file, so migration = add the link AND delete the duplicated rules. Loaded by all 9 live modules as of the May 2026 shared-CSS pass. Grows incrementally (same option-A adoption model as `qn-music.js`): the measured opportunity was **41 byte-identical selectors** shared across all 9 modules. **Four clusters now extracted (May 2026):** summary, start screen (tiles/timer/CTA), play-screen chassis (stat cards/progress/streak/topbar/dots), and modal (overlay/card/actions/miss-list/PB rows) — taking each module from ~765 to ~450 lines of inline CSS (~41% cut). The shared **feedback toast** (Option-2 placement: praise high over the staff, retry/reveal lower) now also lives here, but **only scale-degrees is wired to it** — the other 8 keep their inline `.toast` (which overrides the shared rule via source order) pending a per-module rollout. **2 clusters remain** inline: buttons (~81, `.btn/.ghost`), cards/structure (~72). Method per cluster: audit identity programmatically → copy exact rule bytes (never retype) → append to qn-theme.css → byte-verify → strip from 9 preserving @media overrides → verify braces/parse/tokens/JS. Recurring: scales is the lone outlier in most clusters and its divergence is usually a *subset* — lift the superset, flag visible changes (the toast is the exception — scales has a genuinely different feedback model: 40px correct, `.toast.wrong`, no retry/reveal — kept separate, not flattened). Two known per-module holdouts kept inline deliberately: time-signatures' `.staff-label` (absolute-positioned layout, needs a separate conversion) and scales' `.choice-btn` (24px desktop for long "harmonic minor" labels, pending the wrap-as-designed tile reconciliation).
- **`qn-ui.js` (folded into `qn-profile.js`'s `QN.ui`, not a separate file).** Shared widgets live under `QN.ui`: `chip` (profile chip) and `confirm` (the shared quit/confirm modal component, added v1.7.0; **rolled out to all 9 modules in the May 2026 finishing session** — per-module `showConfirm` definitions retired, hardcoded-modal markup ids swapped so ghost-left=`modal-cancel` matches the component convention). The originally-planned standalone `qn-ui.js` was unnecessary; `QN.ui` is the home.
- **Supabase migration, when warranted.** The current localStorage schema in `qn-profile.js` is already shaped to mirror a backend cleanly: opaque profile IDs, `syncedAt` field on profiles, append-only event log with `profileId`/`module`/`tier`/`correct`/`total`/`durationMs`/`completedAt`. When we go to backend, profiles and events become tables with this exact shape. No schema rework needed.

### What stays the same

- One HTML file per module (always — no SPA, no bundler, no framework).
- No build step. Drop a file, push, done.
- Vercel hosting, quiznote.online via Namecheap.
- LocalStorage as the local-only persistence layer. Supabase, when added, syncs on top of localStorage, not in place of it. Offline play must keep working.
- Mobile-first, iOS Safari and modern Android Chrome as primary targets.

### Load-order gotcha (load-bearing rule)

When an inline `<script>` block needs to reference a global from an external `defer`-loaded shared file (e.g. `NH.audio` from `qn-audio.js`), it must NOT capture the reference at parse time:

```js
// WRONG — runs at parse time, before defer scripts execute
const A = window.NH.audio;

// RIGHT — resolves at call time, after defer scripts have run
const A = new Proxy({}, {
  get(_t, prop) { return window.NH && window.NH.audio ? window.NH.audio[prop] : undefined; }
});
```

The Proxy pattern in `note-values.html`'s game-loop block is the reference implementation. Use it any time inline code needs an external shared-file global.

### Module audio patterns (three flavors)

When extracting shared code from modules, there are three patterns depending on how a module relates to the shared engine:

**Pure shared** — module uses only the shared engine's functions. Example: Note Values, Piano Quiz. The Proxy resolves everything from `NH.audio`. Simplest case.

**Shared + module-local additions** — module adds functions that the shared engine doesn't have (e.g. a sound the module needs and no other module does). Example: Key Signatures (`playReveal`), Intervals (`playInterval`). The module defines `NH.audio_modulename = { ... }`, and the Proxy falls through to it when `NH.audio` doesn't have the property. Call sites stay unchanged (`A.playReveal()` works).

**Shared + module-local overrides** — module replaces shared functions with its own implementation (e.g. a deliberately different timbre). Example: Scales (overrides `playMidi`, `playChime`, `playFanfare` with a richer piano voice). The module defines `NH.audio_scales = { ... }`, and the Proxy checks module-local **first**, falling back to shared. Module-local functions route through `NH.audio.getMasterGain()` to honor the shared master volume and mute.

These same patterns apply to future shared-file extractions (`qn-ui.js`, `qn-music.js`, etc.). Don't reinvent — copy the Proxy from a sibling module.

### Module template + QNM contract

`qn-template.html` is the canonical scaffold every new module clones from. It contains all the shared CSS, the chunky start screen, the play screen, the summary screen, the modal, the audio nudge, the shared fanfare FX engine, and a fully generic game loop. The template is a development artifact, not a deployable file — it has unresolved `{{PLACEHOLDER}}` strings and never goes to the production repo.

A module is built from the template by (a) substituting ~12 string placeholders for module-specific copy (title, tagline, tier labels, etc.) and (b) supplying a renderer script that defines `window.QNM` before the game loop runs. The QNM contract is:

```js
window.QNM = {
  // Identity
  slug:      'note-values',  // localStorage prefix + events log
  namespace: 'NV',           // JS namespace global

  // Question generation
  buildPool(tier),                       // array of question keys for tier
  buildChoices(correctKey, pool, tier),  // 4 choice keys (one correct)
  labelFor(key),                         // display label for a question key

  // Rendering
  render: {
    renderQuestion(container, key),      // draw question in play-screen wrap
    animateQuestionIn(container, key),   // optional pop-in
    recolorAfterAnswer(container, correct), // optional; null = reset
  },

  // Optional FX
  explode(correct, x, y, streak),

  // Summary copy
  encouragingLine(score, total),
};
```

The generic game loop calls `M.buildPool()`, `M.labelFor()`, etc. — it never references a specific module's data shape. Module-specific localStorage keys and event-log module IDs derive from `QNM.slug`.

Same load-order rule applies as for `NH.audio`: the renderer script must set `window.QNM` synchronously before the deferred game-loop code runs. The template handles this by placing the renderer script *before* the game-loop script in document order.

### Storage model (already implemented in qn-profile.js)

```
qn_profiles       Array<Profile>   list of all profiles on device
qn_activeProfile  string | null    id of currently active profile
qn_events         Array<Event>     append-only round log

Profile = {
  id, nickname, level, color,
  createdAt, lastActiveAt, syncedAt
}

Event = {
  profileId, module, tier, length,
  correct, total, durationMs, timedMode, completedAt
}
```

Per-module localStorage namespaces (`nv_`, `ks_`, etc.) are still used for module-local UI state (selected tier, mute toggle, personal best). They do NOT carry learning data — that lives in `qn_events`.

Also in the store: `qn_pendingEvents` (anonymous rounds held for back-fill), `<slug>_pb_<tier>` personal-best keys written by modules, and (as of v1.8.0) `qn_schemaVersion` — single global stamp; absent ⇒ treated as 0, then migrated up to the current SCHEMA_VERSION via `migrations[]` at module init. Events may carry an optional `skills: { skillKey: { c, t } }` tally (sub-skill tagging). `QN.profile.resetDevice()` (v1.4.0) wipes everything QuizNote-owned — all `qn_*` keys plus all `*_pb_*` keys — while leaving unrelated same-domain keys intact; surfaced as "Reset all data on this device" in the profile switcher. `QN` API version ladder: 1.0 base → 1.1 hold-and-backfill → 1.2 skills tallies → 1.3 recommender → 1.4 resetDevice → 1.4.1 guest-prompt bug fix (logOrHold active-check-first) → 1.5.0 corruption-aware reads + `QN.diagnostics` → 1.6.0 account/household layer (cohort tag, 5-learner cap, 7-day trial built-not-armed, `accountId` on profiles) → 1.7.0 `QN.ui.confirm` shared modal component → 1.8.0 `schemaVersion` migration hook (single global stamp at `qn_schemaVersion`; today's data IS v1, the 0→1 migration is a no-op stamp; the HOOK is the value).

### localStorage durability — risks + evolution playbook

localStorage is the right beta persistence layer, but it has known sharp edges. How we handle them, and how the stored shape is allowed to evolve, is a standing convention:

- **Reads never crash, and corrupt ≠ empty (v1.5.0).** `readStorage` returns a safe fallback on any failure. A *parse* failure (data existed but is unreadable) is treated as corruption, NOT as "no data": it's logged distinctly, the raw corrupt value is copied to a recoverable `<key>__corrupt_<timestamp>` backup, and the fallback is returned. Check `QN.diagnostics.corruption()` / `QN.diagnostics.hasCorruption()` in the console during builds. This makes a corruption visible and recoverable instead of a silent vanish.
- **Evolve the stored shape additively wherever possible.** Adding a new OPTIONAL field (as `skills` was) never breaks old data — old records simply lack it and code already tolerates absence. Additive changes need no migration. The event/profile shapes are a contract; treat them as such.
- **A non-additive change (rename/retype/restructure) requires a migration — the hook IS now installed** (v1.8.0, May 2026 finishing session). Single global stamp at `qn_schemaVersion` (absent ⇒ treated as 0). `migrations[N]` is keyed by FROM version and must be idempotent; `runMigrations()` at module init writes the new version ONLY after a step completes, so a thrown migration halts the chain and leaves the previous version intact (recovery-friendly). Today's stored data IS v1 — the 0→1 migration is a no-op stamp; the future breaking change is what plugs in. Additive changes (new optional fields, as the skills tally was) still don't need a version bump.
- **Hard boundaries (by design, not bugs):** ~5MB per origin (hence the 5000-event/profile cap), per-device + per-origin (Dev preview and prod don't share; clearing the browser or switching devices starts fresh — surfaced honestly in the dashboard's "saved on this device only" footnote).
- **Supabase is the structural answer.** Once data lives server-side, the localStorage-specific risks (per-device, 5MB cap, silent corruption, browser-clear wipes) become server-managed with real migrations + backups. The local schema was deliberately shaped to mirror the backend so migration is lift-and-shift, not a rewrite.

## 5. Module roster

Organized by the three user-facing tiers — **Foundations / Reading / Theory**, framed as Levels 1–6. The names that ship on `play.html` and `index.html` are canonical; the older "Beginner core / Intermediate depth / Stretch" framing is retired.

Roster is **32 modules** — 14 Foundations + 8 Reading + 10 Theory. The 27 → 32 expansion was a deliberate Tier 3 scope decision made in the May 2026 curriculum gap analysis (BUILD_LOG.md) and executed in the May 2026 Phase 5 Tier A session, adding the score-literacy cluster (Tempo Markings, Dynamics, Articulation, Score Navigation, Ornaments). Justification: real coverage gap (every method book teaches these from lesson 1; the 27-roster had zero coverage of tempo/dynamics/articulation/navigation/ornaments), not audience expansion. Growing past 32 pushes toward the advanced-theorist / music-school audience that §2 excludes; resist it without another deliberate scope decision. (Earlier framings of "24 modules" and "27 modules" are superseded.)

Status legend: **Live** = shipped; **Planned** = on the build queue.

**Tier reconciliation locked May 2026** (Option B): Intervals and ear modules sit with their visual partners, not clustered together. Reading owns visual Intervals + Ear:Intervals together, visual Scales + Ear:Scales together. Theory holds harmony only — chord modules and the future chord ear training.

### Foundations · Levels 1–2 (reading notes and rhythm) — 14 modules, all Live

1. **Note Names** — staff note identification. *Live.* Treble / bass / both clef selector.
2. **Ledger Lines** — pitches outside the staff. *Live (May 2026, Phase 1).* Cloned from note-names; pool strictly notes with visible ledger lines drawn (excludes the "bare space outside the staff" notes Note Names already covers — D4 / G5 treble, F2 / B3 bass). Tier axis = how far past the staff edge (Easy 1st-2nd / Medium +3rd / Tricky +4th ledger). Tricky ceiling capped at 4th ledger by design — covers school repertoire; flute/piccolo high register out of scope per §2. Pool counts per clef: 6 / 10 / 14.
3. **Piano Quiz** — see the staff note, find it on the keys. *Live.* Treble / bass / both selector.
4. **Piano & Keyboard** — see the highlighted key, name the note. *Live (May 2026, Phase 1).* The reverse direction of Piano Quiz. Cloned from note-names (not piano-quiz — cleaner reuse of the 4-button letter MC) with a new C3..C6 inline SVG keyboard renderer added to `NH.render`. Distinct learning channel from Note Names (keyboard geography vs staff). Clef selector hidden — irrelevant on a piano.
5. **Note Values** — rhythmic duration identification (single notes/rests). *Live.* Whole / half / quarter / eighth / sixteenth + rest equivalents.
6. **Dotted Notes & Ties** — duration arithmetic with dots and ties. *Live (May 2026, Phase 1).* Cloned from note-values; pool mixes regular, dotted, and tied combinations. Renderer = Bravura augmentation dot (U+E1E7) appended to note glyph for dotted; two adjacent glyphs + CSS-drawn semicircle for tied pairs. Choice format = beat values with Unicode vulgar fractions ("1½ beats", "¾ beat"). buildChoices guarantees unique beat values across the 4 buttons (avoids the dotted-half = tied-half-quarter label collision). Convention: quarter = 1 beat, simple meter only.
7. **Ear: Rhythm** — hear a single duration, identify the notation. *Live (May 2026, Phase 1).* Cloned from note-values with the visual hidden behind a 🎧 placeholder + "▶ Hear it again" button. Audio cue = 2 metronome ticks (lead-in tempo anchor at 60 BPM) + sustained A4 piano tone for `beats × 1000ms`. Notes-only in v1; rests deferred (silence-of-N-beats is a meaningfully different UX). Tiers thin by design: Easy 3, Medium 4, Tricky 5.
8. **Time Signatures** — identify the meter, count beats per bar. *Live.* Five question types (`label` / `top` / `bottom` / `whichBeats` / `whichUnit`); position-scoped answer highlighting. Easy 2/4·3/4·4/4, Medium +6/8·3/8·2/2, Tricky +9/8·12/8·5/4·7/8. Tuplets / syncopation / compound feel fold in as Tricky-tier complexity here.
9. **Accidentals** — sharps, flats, naturals, double-sharps/flats, enharmonic equivalents. *Live.* Staff + four-button MC, sibling to Note Names.
10. **Tempo Markings** — Italian tempo terms, ordering on a slow→fast continuum, metronome markings, change-of-tempo. *Live (May 2026, Phase 5 Tier A #1).* First in the score-literacy cluster; established the cluster's renderer pattern (styled "term card" with italic serif text — no staff). Question types: `meaning` / `ordering` / `metronome` / `change`. 11-term steady-tempo catalog (Grave through Presto) + four change markings (accel., rit., a tempo, rubato). Added `playMetronome(bpm, count)` to the module's inline audio engine — 4 wood-block clicks at the question's BPM via the "Hear it" button. BPM bands taken verbatim from spec.
11. **Dynamics** — dynamic markings, loud-vs-soft ordering, crescendo/diminuendo direction, sforzando/fortepiano accent family. *Live (May 2026, Phase 5 Tier A #2).* Question types: `meaning` / `ordering` / `direction` / `accent`. Bravura PUA glyphs (U+E520–E525) compose ppp through fff, sfz, fp via concatenation (mf = "m"+"f"). Hairpins drawn as inline SVG polyline. No audio in v1.
12. **Articulation** — note-treatment markings (staccato, tenuto, accent, marcato, fermata, breath mark, caesura) + tie-vs-slur discrimination. *Live (May 2026, Phase 5 Tier A #3).* Question types: `name` / `effect` / `discriminate`. **Headline skill = tie vs slur:** two adjacent noteheads joined by a curve; same pitch = tie, different pitch = slur. Inline-SVG 5-line staff with notehead + Bravura articulation glyph. No audio.
13. **Score Navigation** — repeat structures, jump markings (D.C., D.S., Coda, Fine, segno, voltas). *Live (May 2026, Phase 5 Tier A #4).* v1 ships `name` / `meaning` / `discriminate`; `routing` (read-the-path-through-a-passage) deferred to v1.1 per spec. Repeat barlines + voltas drawn as inline SVG; segno (𝄋) / coda (𝄌) via Bravura PUA; D.C./D.S./Fine as italic serif text. Discriminate uses a worded confused-pair pool ("Which means go back to the very beginning?") rather than rendering both targets — text-style markings are visually indistinguishable from each other. No audio.
14. **Ornaments** — trills, mordents (upper / lower), turn, grace notes (acciaccatura / appoggiatura), tremolo. *Live (May 2026, Phase 5 Tier A #5).* Question types: `name` / `effect` / `discriminate`. Visual ID only in v1 — ornament *realization* is performer-dependent and period-specific (Baroque vs Classical vs Romantic), explicitly out of scope. Inline-SVG notehead with attached ornament (Bravura glyphs above the notehead; grace notes as smaller noteheads with optional slash through the stem; tremolo as slashes across the main stem). No audio.

### Reading · Levels 3–4 (the staff feels like home) — 8 modules

10. **Key Signatures** — identify the key from sharps/flats on the staff. *Live.* Easy 5 / Medium 9 / Tricky 15 keys. Distractor: one same-count opposite-type mirror (D=2♯ paired with B♭=2♭). *Phase 2 (May 2026, shipped): + 15 minor keys + Major/Minor/Both selector.*
11. **Scales** — identify and spell major + natural/harmonic/melodic minor + pentatonic scales. *Live.* Sub-skill axis = mode. *Phase 2 (May 2026, shipped): + pentatonic + 6-option scale-type selector.*
12. **Scale Degrees** — degree numbers and names in a key. *Live (May 2026).* Three question types (number / name / whichDegree); tiers reuse Key Signatures' 5/9/15 key sets. First module to combine a key-sig row + a queried note on one staff. *Phase 2 (May 2026, shipped): + minor keys + selector. Degree 7 = subtonic in natural minor.*
13. **Scale Modes** — Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian. *Live (May 2026).* Cloned from scales.html as a pure data swap (parent-major + mode-rotation generator). Octave-normalized so every mode renders in the same staff range as its parent. Distractors are sibling modes (same parent, different tonic — the "D Dorian vs A Aeolian" confusion) and parallel modes (same tonic, different rotation).
14. **Intervals (sight)** — identify intervals by sight. *Live.* Inversion and compound intervals fold in as harder tiers. **Tier locked May 2026: Reading** (sight-reading the staff), not Theory. *Phase 2 (May 2026, shipped): clef selector verified functional; no expansion needed.*
15. **Ear: Intervals** — hear two notes, identify the interval. *Live (May 2026).* Cloned from intervals.html with the rendered staff hidden behind a 🎧 placeholder; audio + question logic byte-identical to sight Intervals. **Tier locked May 2026: Reading** (pairs with visual Intervals, not clustered with other ear modules in Theory).
16. **Ear: Scales** — hear a scale, identify the type. *Live.* All four diatonic scale types + pentatonic. **Tier locked May 2026: Reading** (pairs with visual Scales). *Phase 2 (May 2026, shipped): + pentatonic + scale-type selector (mirrors visual Scales).*
17. **Chromatic Scale** — identify and spell the chromatic scale; sharp vs flat spelling. *Live (May 2026, Phase 2 #1).* Cloned from scales.html. 24 chromatic scales (12 ascending + 12 descending) generated by helper. Spelling convention locked to the school-textbook standard: ascending uses sharps, descending uses flats, tonic stays natural, no B♯/E♯/C♭/F♭ (uses C/F and B/E). The diatonic-preserving "melodic chromatic" variant used in chromatic harmony is deliberately out of scope. Refactored scales.html's single POOLS into separate `QUESTION_POOLS` (always chromatic) and `DISTRACTOR_POOLS` (chromatic + majors + minors) so the learner is never asked to name a non-chromatic scale, but still has to discriminate chromatic from diatonic.

### Theory · Levels 5–6 (harmony) — 10 modules

After the May 2026 tier reconciliation, Theory is cleanly "harmony" — chord modules and chord ear training. The other ear-training modules (rhythm / intervals / scales) live in their respective visual tiers with their partners.

18. **Primary Chords (I–IV–V)** — the three main chords in a key. *Live.* The *early, practical* harmony skill — distinct from Roman-numeral analysis. *Phase 2 (May 2026, shipped): + minor keys + selector.* **Accuracy note:** in minor keys, the V chord is MAJOR (raised leading tone from harmonic minor) — see §9.
19. **Roman Numerals** — diatonic chord function (I, ii, iii, IV, V, vi, vii°). *Live.* *Phase 2 (May 2026, shipped): + minor keys + selector. Harmonic minor conventions used (i, ii°, III+, iv, V, VI, vii°).*
20. **Triads** — major, minor, diminished, augmented chord qualities by sight. *Live (May 2026, Phase 4).* 29 chords, clef selector, uses `NH.staff.buildStaffWithChord` + `NH.audio.playChord`. Tiers: Easy (maj/min), Medium (+dim), Tricky (+aug).
21. **Triad Inversions** — root position, 1st inversion, 2nd inversion. *Live (May 2026, Phase 4).* 36 chords (6 roots × 3 inversions × 2 qualities). "3rd inversion" as pedagogically interesting distractor.
22. **Seventh Chords** — dominant 7, major 7, minor 7, half-diminished, fully diminished. *Live (May 2026, Phase 4).* 29 four-note chords. Tiers: Easy (dom7/min7), Medium (+maj7), Tricky (+half-dim/dim7).
23. **Chord Progressions** — identify common progressions (I–V–vi–IV, ii–V–I, etc.). *Live (May 2026, Phase 4).* 13 entries across 5 types in 3 keys. Multi-chord rendering on wider staff (540px), 700ms sequential playback.
24. **Cadences** — authentic, plagal, half, deceptive. *Live (May 2026, Phase 4).* 18 entries across 4 types in 4-5 keys. Two chords rendered side by side with arrow + roman numeral labels.
25. **Ear: Chord Quality** — hear a chord, identify quality. *Live (May 2026, Phase 4).* Clone of Triads with staff hidden behind 🎧. The only ear module in Theory (visual partner is in Theory).
26. **Ear: Cadences** — hear a cadence, identify the type. *Live (May 2026, Phase 4).* 18 cadences, audio-only, 800ms gap between chords.
27. **Ear: Chord Progressions** — hear a chord progression, identify it. *Live (May 2026, Phase 4).* Audio-only progressions, 700ms gaps.

### Folded-in, not standalone

Topics that live as tiers or sub-skills inside an existing module:
- Relative & parallel keys → Key Signatures
- Interval inversion / compound intervals → Intervals
- Compound meter (6/8, 9/8, 12/8), tuplets, syncopation → Time Signatures (Tricky tier)
- Rests of each duration → Note Values (mixed into the pool by category)

Two topics that **were** folded-in but are now standalone (May 2026 redesign):
- Ledger lines & octave registers → now **Ledger Lines** (Foundations #2)
- Dotted notes / ties → now **Dotted Notes & Ties** (Foundations #6)

### Dropped from earlier roster framings (May 2026 redesign)

- **Rhythm Reading** (was Foundations #6 in the 24-roster) — folded into Time Signatures' Tricky tier (compound meter, tuplets, syncopation already there) rather than its own tile.
- **Circle of Fifths** (was Reading #11 in the 24-roster) — cut from the 27 to keep the roster tight, then **re-queued in May 2026** as Phase 5 Tier B #6 (see CLAUDE.md ranked build queue). The May 2026 curriculum gap analysis judged its absence to read as a coverage hole regardless of equivalent content elsewhere. Spec at `/specs/circle-of-fifths-spec.md`.
- **Transposition** (was Reading #13 in the 24-roster) — Stretch, dropped from the 27, **re-queued in May 2026** as Phase 5 Tier B #8. Spec at `/specs/transposition-spec.md`.
- **Melodic Dictation, Rhythmic Dictation, Score Reading** (was Theory #21–23) — Stretch, dropped from the 27. Voice-input dictation is its own engineering track and out of scope per §2.

### Deliberately out of scope (the boundary, written down)

Not omissions — decisions. Revisit only with an explicit scope change:

- **Sight-singing, scale-degree singing, melodic/rhythmic dictation *by voice*** — need microphone input + pitch detection; a separate engineering track.
- **Counterpoint, phrase/form analysis (binary, sonata), orchestration, composition, music history** — the advanced-theorist / music-school audience §2 excludes.
- **Jazz/extended/altered harmony, modal-jazz, world-music systems, microtonal & non-Western notation** — out of the Western-tonal-theory mission.
- **Clefs beyond treble/bass (alto, tenor)** — niche for the target audience. Spec drafted (`/specs/c-clefs-spec.md`) and parked in the Phase 5 Tier D ranked queue (#11) — build only with demonstrated demand. The build itself requires a `qn-staff.js` renderer-extension session (Tier 3) before the module clone, so the threshold to start is high.

This list exists so the recurring "is the roster too light?" question has a written answer: the roster isn't light, it's *bounded*. Everything not on it is either folded into a module above or deliberately beyond the line.

## 6. Cross-cutting systems

### Learning path + information architecture

Default landing experience for a signed-in profile. The IA is **three concentric rings**, designed so the tile count can grow to 24+ without ever overwhelming a beginner:

- **Ring 1 — Today.** A single recommendation card: which module, which tier, how many questions, estimated time, and a one-line *why* ("you cleared Easy, time for Medium"). This is the recommender's output (`QN.recommend.next`) rendered. ~90% of what a returning beginner sees. No choosing required. A "something else" affordance re-rolls so direction never feels like a cage.
- **Ring 2 — The path spine.** A vertical Duolingo-style progression: modules behind you (dimmed + checked, showing best score), the current one (lit), the next one or two (visible but soft-locked). Lets a learner *see* room to grow without acting on all of it. Path is linear in v1 — everyone moves through the same roster order, branching only at the difficulty-tier level inside each module.
- **Ring 3 — Practice (the buffet).** The full set of all modules, organized by the three tiers. Reached by a tab, never the default. Where intermediates and skippers live.

**Gating model: soft-lock, never hard-lock.** On the path spine, later modules are visible but de-emphasized (dimmed, lock glyph, "up next"). Nothing is ever truly forbidden. In Practice, *every* module is always open — an intermediate skips straight there. This honors the § 2 promise that secondary-audience users can skip the path. Hard-locking (hide-until-earned) is explicitly rejected: it would frustrate the intermediate who lands on day one wanting seventh chords.

**Placement / "clep out" — performance-driven, not a test (v1).** A real upfront placement test stays a v2 feature (per the branching-paths note below) and is deferred. The v1 version: let people play anything from Practice, and let their performance quietly advance the path. If someone scores 95% on Intervals from the buffet, the recommender already knows not to send them back to easy note-naming — placement comes free from the weak-spot data already collected, no test gate, no friction.

**Surfaces (planned, not yet built):** a `path.html` that becomes the signed-in default, with `play.html` becoming the Practice tab and the existing `dashboard.html` becoming Progress — Path / Practice / Progress as the three nav destinations. Recommended (Tier 2) to build `path.html` as a *new* page rather than overwriting `play.html`, so nothing currently working breaks and the feel can be evaluated before it's made the literal home. Mobile = single column, Today card fills the screen, tabs at the bottom. Desktop/tablet = path spine in a left rail, Today featured center, Practice peek below; tabs in the top nav. Same architecture, two layouts — not two designs.

**Spine state needs a small additive read.** The Today card is buildable now (the recommender returns exactly `{module, tier, length, reason}`). The spine's cleared/current/locked states need a per-module "cleared tier" derivation over `qn_events` (≥ 2 rounds at a tier AND ≥ 85% = cleared, reusing the recommender's existing advance rule). Additive, no schema change.

The path remains linear in v1 — everyone moves through the same sequence in roughly the same order, with branching only at the difficulty-tier level inside each module. Branching paths (placement test → personalized route) is a v2 feature, not v1. A "Practice" tab exists alongside the path for users who want the buffet. Intermediates will live in this tab. Beginners will live in the path.

### Weak-spot tracking

Built on `qn_events`. After every round, the system identifies which question types the learner got wrong and schedules them for re-drilling in future sessions. Concretely:

- Each module's question generator can produce questions tagged with sub-skills (e.g., "Key Signatures" might tag a question as `4-sharps` or `enharmonic-Db`).
- Events log per-question outcomes, not just round totals, when tagging is available. This is an additive change to the event schema — back-compatible.
- The path recommender weights weak sub-skills higher when picking the next session's content.

This is the single highest-leverage learning feature and the biggest moat. It also requires the most careful design. Build the tagging first, the recommender second, the surfacing in the path third.

**Phase 1 (tagging) — DONE as of May 2026.** The schema and one-module proof are live; the recommender and path surfacing are NOT built yet (still phases 2 and 3, in that order).

- **Locked schema convention:** an event optionally carries `skills: { <skillKey>: { c: <correct>, t: <total> } }` — lean per-sub-skill tallies, one small object per round. Chosen over a per-question detail array because it's exactly what the recommender consumes (an aggregate), stays bounded under the 5000-event/profile cap, and maps cleanly to a Supabase JSON column or `{event_id, skill, c, t}` child table. Additive and back-compatible: events without `skills` are valid and treated as round-level only.
- **Granularity is in the key, not the structure.** To get item-level detail later (e.g. distinguish 7/8 from 5/4), make the skill key more specific (`bottom-8` vs `bottom`) — no schema change. Skill keys should be namespaced mentally as "this module's question type"; the dashboard labels them per `module/skill`.
- **Plumbing:** `qn-profile.js` (v1.2.0) threads `skills` through `log`, `logOrHold`, and `backfill`, with a `sanitizeSkills()` guard that clamps/drops bad values so a buggy module can't corrupt the log.
- **Emitting modules: all seven** (as of May 2026). Each tags by its natural sub-skill axis: Time Signatures by question type (`label`/`top`/`bottom`/`whichBeats`/`whichUnit`); Note Names and Piano Quiz by clef (`treble`/`bass`); Intervals by interval shorthand (`M3`, `P5`, …); Key Signatures by key (`C`, `Db`, `F#`, …); Note Values by note-value key (`quarter-note`, `eighth-rest`, …); Scales by mode (`major`, `minor-natural`, `minor-harmonic`, `minor-melodic`). Six derive the tally from each round's `state.history` at summary time (can't drift from the score); Scales is the outlier (no history array) and accumulates a `state.skillTally` in its answer handler. **Retry note:** Note Names, Piano Quiz, and Intervals have a retry mechanic — a retry counts as *not correct* for the sub-skill, consistent with how those modules score the round (only a clean first try counts). When adding a NEW module's tags, also add friendly labels to `SKILL_LABELS` in `dashboard.html` (high-cardinality, self-readable keys like interval shorthand or key names use the raw-key fallback and need no entry).
- **Surfacing:** `dashboard.html` shows a weakest-first sub-skill breakdown per module, only when that module has tagged data. This is "see it," not the recommender — nothing acts on the weak spots yet.

**Phase 2 (recommender) — DONE as of May 2026.** `QN.recommend.next(profileId)` in `qn-profile.js` (v1.3.0). Pure logic, **no UI** — phase 3 (the "Today" surface) is still not built and is the next piece.

- **What it returns:** `{ module, tier, length, kind, reason, weakSkills }`, `kind` ∈ `cold-start | progress | remediation | review`. Pure read over `qn_events`.
- **Behavior:** severe weak spot (< 40%, enough samples, not just practiced) jumps the queue; otherwise forward progress through the linear path (live modules in roster order); all-cleared → review. Tuning knobs centralized in a `REC` object.
- **Locked design philosophy — evidence-based (see build log for sources):** Balanced (forward progress with weak spots woven in), NOT remediation-first — learning research favors *interleaving* over blocked drilling and warns that review-everything-first stalls progress. The no-nag cap (don't serve the same weak spot back-to-back) is the *spacing effect*, not just politeness. **Interleaving guardrail:** the recommender biases a round toward a weak module, but rounds must stay interleaved — never build single-sub-skill blocked drills (applies to phase 3 and any future "drill this weak spot" feature).
- **Competitive context:** the incumbent (Tenuto) is manual — the user targets their own weak spots. QuizNote's moat is doing it automatically; this engine is that.

### Concept explainers

Each module gets a short explainer surfaced before the first practice session and accessible from a small "Learn" button thereafter. Format: 3–5 swipeable cards, each one short sentence + one visual. Skippable forever after first view. The explainer is part of the module spec, not a separate content system.

This is light, not heavy. It's not a textbook. The bar is "a learner who has never seen a key signature can do the Easy tier after reading this."

### Audio

Three tiers, in order of when they apply:

- **Tier 1 (current): Web Audio synthesized tones.** Adequate for note-name modules where pitch identification isn't the point. Cheap, no download.
- **Tier 2 (next upgrade): sampled piano.** A real piano sample set loaded once, used across all modules that need pitched audio. One-time engineering lift; perceived quality jump is large.
- **Tier 3 (ear training only): multi-timbre.** Piano, strings, voice, for interval and chord ear training where timbre variation aids generalization.

Audio engine lives in `qn-audio.js` once extracted. Modules call it; they don't reimplement it.

### Onboarding

A new profile lands on a 4-screen onboarding:

1. Nickname + color (already built).
2. Self-reported level: "Just starting" / "I know some" / "I've been at this a while" (already a field on profile).
3. Optional placement check (skip-able). Adjusts the starting point in the learning path.
4. First session in the recommended module, with sound on, ready to go.

Placement-check failure or skip routes to the path's first module at Easy tier.

**Identity surface (convention).** The profile chip is the persistent identity anchor — it shows who's active and is the way to switch. On hub pages (play, dashboard) it opens a small dropdown menu (Switch profile, Progress); on module pages it links straight to the switcher. The menu is an extension point for future low-stakes nav (settings, help/FAQ). **Destructive or rare actions stay OUT of everyday menus** — the device-wide "Reset all data" lives only on profile.html (the manage-data page) behind a two-step confirm (scope statement + count preview + explicit second tap), never adjacent to frequent actions like profile-switch. Implementation: the chip itself is `QN.ui.chip` (renders a plain link, JS-free fallback); the dropdown is an additive `QNMenu` layer the hub pages opt into.

**Confirm/quit modal (convention, shared component v1.7.0).** The in-round quit dialog (and any confirm dialog) is `QN.ui.confirm({title, body, confirmLabel, cancelLabel, onConfirm, onCancel, onOpen, onClose, dismissIsConfirm})` — a shared component in `qn-profile.js`, not per-module markup. **Canonical arrangement (locked):** the destructive action (Quit) is the **ghost button on the LEFT**; the safe default (Keep playing) is the **solid green button on the RIGHT** — the prominent easy tap is always the safe one, and backdrop/Escape dismiss as the safe action. This arrangement lives in one place; changing it updates every module. The component reuses an existing `#modal-overlay` if a module still has the inline markup, or builds its own if not. **Why it exists:** the modal was duplicated as per-module markup + hand-written handlers, which drifted — some modules had the buttons in opposite order/color, and two (note-values, time-signatures) had crossed label↔handler wiring that made "Quit" silently do nothing. Promoting it to a component (basis: note-names' old `showConfirm`) fixes the bug and the inconsistency in one place and retires the per-module modal from the duplication list. **Rolled out to all 9 modules in the May 2026 finishing session.** The 5 showConfirm-engine modules (note-names, piano-quiz, scale-degrees, intervals, accidentals) lost their per-module `function showConfirm` and now use `onOpen: pauseTimer` / `onConfirm: resumeTimer` / `onCancel: { stopTimer; showScreen('start') }`. The 2 hardcoded-modal modules (key-signatures, scales) had their button ids swapped in markup so ghost-left = `modal-cancel` (the QN.ui.confirm convention) — the prior cleanup-session fix had moved the ghost class + DOM order but kept the OLD ids, leaving the inversion invisible because the inline handlers were id-keyed; only the migration to QN.ui.confirm (which writes labels by id) made the swap necessary. **Start-timer modal also now in all 9 modules** (was 5-of-9): each start-btn handler calls `showStartTimerModal()` when `state.settings.timer.enabled`, otherwise fires `startGame()`/`startRound()` directly. **Latent bug caught during rollout (fixed):** `stopTimer()` in note-values/time-signatures/key-signatures both clears the interval AND hides `timer-badge`; the QN.ui.confirm flow calls `stopTimer()` in `onOpen` then re-creates the interval in `onConfirm`, but never unhid the badge — so the timer kept counting invisibly. Fix: `els['timer-badge'].hidden = false` before re-creating. Pre-existing since note-values' original migration.

## 7. Monetization

Free during beta and for the foreseeable runway. Eventually freemium with a low price point — the bet is on word-of-mouth from genuinely-good free + a paid tier that's a clear value. No ads, ever. No data sale, ever. Privacy is part of the product.

Likely paid features when the time comes: full module access (some kept free), unlimited weak-spot recommendations, cross-device sync via account, progress export. To be designed in detail closer to launch.

## 8. Working style and decision authority

Three tiers govern when I decide vs. when I check in.

**Tier 1 — Decide and build.** Mechanical, technical, or aesthetic-within-established-patterns. Code structure, file organization, variable names, which CSS token to use, how to factor a function, microcopy that follows existing voice, bug fixes, refactors that don't change behavior. I do these and mention what I did. No options, no checkpoints.

**Tier 2 — Recommend and proceed.** Judgment calls that aren't stakes calls. Module difficulty breakdowns, sub-skill tagging, default tier orderings, explainer copy, color choices within the palette, default question counts, audio behavior choices, layout decisions within the design system. I state my pick with one line of reasoning and proceed. Format: "Going with X because Y — flag if wrong." Visible enough to veto by skimming.

**Tier 3 — Stop and ask.** Anything legal, monetization, brand-level, scope-changing, or user-promising. Terms and privacy language, pricing, feature claims on the landing page, new content areas, changes to data collection, anything that promises users something the product doesn't yet do.

**Calibration rule.** If I treat something as Tier 1 that should have been Tier 2, or Tier 2 that should have been Tier 3, correct me once and I'll move it up permanently. I default conservative early in a working relationship and widen as patterns establish.

**"Decisions before code" still applies, but only for Tier 3.** Tier 1 and Tier 2 work proceeds without checkpoints. "Build" or "go" is no longer required for Tier 1/2 — only for Tier 3 where ambiguity exists.

**Other working rules:**

- Complete files, not snippets. New modules drop in by replacing the old version.
- Preview file for visual QA before push, on any visual change.
- Outputs framed as observations, not directives, where legally sensitive (especially anything that could read as personalized advice to a learner).
- Trust-first scope discipline. The roster is unlocked but the comprehensive-Western-tonal-theory mission is the boundary. "Does this serve the mission" is the test, not "is this a cool feature."
- Marketing copy must describe current state, not roadmap. Features that don't yet exist (learning path, weak-spot tracking, sampled audio) do not appear in landing-page claims. Unsupported time promises like "5 minute modules" do not appear anywhere.
- Canonical product framing: "short rounds," not time-based promises. A round is 5/10/20 questions at the learner's pace, not a clock commitment.
- Privacy and legal language is Tier 3 always. I can draft proposed language but I'm not a lawyer and final terms/privacy text needs a real lawyer's eyes before going live for anything beyond beta.
- Extracting code with nested structures (CSS `@keyframes`, function bodies, JSX trees, etc.) must use proper brace-counting, never regex. Regex stops at the first matching delimiter and silently corrupts nested blocks. This rule exists because it bit twice in one session — once truncating a `@keyframes` block (killed CSS parsing), once leaving an undefined variable in the game loop (froze the round on first correct answer).
- Any task requiring pixel-level visual calibration (glyph positioning, layout offsets, animation timing) starts with a local slider harness — a standalone HTML file with live-adjustable parameters rendering all the relevant cases at once — NOT a deploy-screenshot-nudge loop. The person dials in the values directly and pastes them back; Claude bakes them in. This rule exists because time-signature digit positioning burned hours and many GitHub round-trips before the harness was built; the harness solved it in one pass. Build the calibrator first. Bake calibrated constants into the shared file with a comment naming the harness so they can be re-tuned.
- When something renders inconsistently, inspect the actual computed DOM / box model (DevTools: real element dimensions, attribute values, rendered pixel sizes) BEFORE theorizing about rendering math, layout, or scaling. And use the working case as the diagnostic key — ask "why does the one that works, work?" This rule exists because the time-sig digit drift produced ~6 wrong fixes built on math/layout theories while the real evidence (identical attributes but different rendered widths → a font-rendering problem) sat visible in DevTools; the question "why is 6/8 always right?" (symmetric glyph + dominant-baseline) is what finally cracked it. Root cause was font/baseline rendering under SVG scaling, fixed by switching to vector-path glyphs.
- Any element toggled via the `hidden` attribute that ALSO has an author `display` rule (`display:flex`, `display:grid`, etc.) MUST have a matching `.selector[hidden]{display:none}` guard. The browser default `[hidden]{display:none}` loses to any class selector that sets `display`, so without the guard the attribute is set but visually ignored — the element stays on screen no matter what the JS does. This bit the save-scores prompt app-wide (it showed for active profiles despite provably-correct JS: `logOrHold`→`'logged'`, `pendingCount()`→`0`, reveal line computing `hidden=true`). The template already followed this convention for six other elements (`.summary-speed`, `.acc-block`, `.timer-pills`, `.timer-badge`, `.pb-row`, `.modal-overlay`); the rule is written down so the next one isn't missed. (This is the same "inspect the box model, not the logic" lesson as the rule above — second occurrence.)
- **When auditing whether something is "consistent across files," compare the RENDERED result, not just the selector/class names.** A grep that finds the same class name (`.staff-label`) in every module can read as "consistent" while the modules actually diverge — via a second override rule, a media-query variant, a different element filling the same slot, or a stale deploy. This bit the May 2026 question-prompt audit: a class-name grep reported "byte-identical, consistent," but screenshots proved three different live prompt treatments (small-caps-left, big-bold-centered, medium-left). The class name matched; what each module *did* with it didn't. Same root lesson as the two box-model rules above, applied to cross-file comparison: the source can lie about the rendered truth. For a real consistency check, diff the full rule bodies (and their overrides/media queries), or look at the actual pixels.
- **Clone-and-swap is a pure-data swap. If the source module's renderer or audio engine can't represent the new module's shape, that's a renderer-extension session, NOT a clone-and-swap.** Clone-and-swap means cloning a working module file and changing only: the module-specific data (question/scale/note catalogs), the question-generation function, the answer-choice function, identity strings (title/h1/tagline/staff-label/etc), and the localStorage key prefix. The renderer, audio engine, game loop, CSS links, and shared file references stay intact. Before starting a clone-and-swap, audit whether the source module's renderer can already draw what the new module needs. If it can't (e.g., a 2-note stacked-interval renderer asked to draw a 3-note triad, or a single-note staff asked to draw a chord), STOP and propose either a renderer extension as its own dedicated session, or a different source module. Building a "new renderer alongside the old one" inside a clone-and-swap is not clone-and-swap — it's net-new code in a cloned shell, which inherits the source's bugs without inheriting its proven behavior. This rule exists because the May 2026 roster-expansion session burned ~30 minutes attempting to clone intervals.html into a Triads module before recognizing that 3-note rendering is fundamentally outside intervals' renderer scope; the chord cluster (Triads / 7ths / Primary Chords) was rightly queued as its own focused session that starts with a 3-note staff renderer extension.

## 9. Music theory accuracy

Unchanged from v1.

- Sharp order: F# C# G# D# A# E# B#. Flat order: Bb Eb Ab Db Gb Cb Fb.
- Tricky-tier enharmonic spellings: F# (not Gb) for 6 sharps, Db (not C#) for 5 flats, Gb (not F#) for 6 flats, C# (not Db) for 7 sharps, Cb (not B) for 7 flats.
- Treble bottom line = E4 = step 0. Bass bottom line = G2 = step 0. Steps increment by half-line going up.
- Verify accidental positions against a real source. Don't rely on training-data memory.

## 10. Tech facts

- Hosted on Vercel. Domain quiznote.online via Namecheap.
- No backend currently. Supabase planned but not built. LocalStorage schema is already Supabase-shaped.
- Mobile-first; iOS Safari and Android Chrome are primary targets. Desktop is a happy accident, not a design target.
- No analytics beyond what Vercel provides by default. No third-party trackers. No ads.
- Bravura Text font (SMuFL music notation) loaded from CDN.

## 11. What "done" looks like for a new module

1. Module spec written and reviewed.
2. HTML generated from spec + template, dropped into repo.
3. Play page card flipped from soon → live.
4. Index page card flipped + module count bumped.
5. Preview file generated for visual QA before push.
6. After ship: the module's sub-skill tags wired into the weak-spot recommender.

## 12. Build order

The infrastructure phase is **complete**. The template, the five shared script files (`qn-profile.js`, `qn-audio.js`, `qn-staff.js`, `qn-nav.js`, `qn-ui.js`) plus `qn-music.js`, the shared CSS (`qn-theme.css`), the profile/account layer, the dashboard, the weak-spot tagging (phase 1) and recommender (phase 2) are all shipped. The work now is **further roster expansion per the Phase 5 ranked queue in CLAUDE.md** plus the parallel Tier-3 monetization/legal track.

Current state: **32 of 32 modules live** — Phases 1–4 (27-module floor) plus Phase 5 Tier A score-literacy cluster (5 modules) shipped (May 2026). Remaining curriculum work is Phase 5 Tier B+ (queued, ranked in CLAUDE.md), plus the parallel Tier-3 monetization/legal track and polish items (see "Parallel tracks" below).

### Infrastructure — done (May 2026)

- ~~Extract `qn-audio.js`~~ ✓ Three patterns (pure shared, shared + additions, shared + overrides).
- ~~Build the module template~~ ✓ `qn-template.html`; `window.QNM` is the module-to-template contract.
- ~~Extract `qn-staff.js`~~ ✓ Staff engraving in `window.NH.staff`; time-sig digits are vector paths, not font glyphs.
- ~~First net-new module from the system~~ ✓ **Time Signatures**.
- ~~Profile prompt + score tracking, hold-and-backfill~~ ✓ (`qn-profile.js` v1.1.0).
- ~~Progress dashboard + sub-skill tagging across all 7 live modules~~ ✓ (`dashboard.html`; v1.2.0).
- ~~Unified nav `qn-nav.js` across all 12 surfaces~~ ✓ — pill-shrink/readable-floor/avatar-fallback truncation; one line on every page; footers standardized; all 7 modules retired their old `QN.ui.chip` header onto `QNNav`.
- ~~Account/household layer + 7-day trial schema~~ ✓ (`qn-profile.js` v1.6.0) — account = up to 5 learners; founder `pricingCohort='beta'` tag; `startTrial()` **built but not armed**; `trialStatus()` advisory-only (real entitlement is server-side). Go-live lever = the `CURRENT_COHORT` constant.

### Phase plan (May 2026 redesign)

Phases are sequenced; each unblocks the next. Inside a phase, modules can be built in any order. Every new build follows the spec-first + clone-and-swap pattern (CLAUDE.md). Module builds are autonomous on Tier 1/2 decisions — only Tier 3 blockers stop the build (CLAUDE.md "Module builds are autonomous").

**Phase 1 — Foundations Level-1 gaps. ✓ DONE (May 2026, this session).** Live count 14 → 18.
- Ledger Lines (clone from note-names; strict on-ledger pool) — §5 #2
- Dotted Notes & Ties (clone from note-values; Bravura aug-dot + CSS-tie-arc renderer; beat-value MC choices) — §5 #6
- Ear: Rhythm (clone from note-values; 🎧 audio cue at locked 60 BPM tempo) — §5 #7
- Piano & Keyboard (clone from note-names with a new C3..C6 keyboard SVG renderer in `NH.render`) — §5 #4

**Phase 2 — Reading Level-2 gaps + Level-2 expansions. ✓ DONE (May 2026).**
- ✓ Chromatic Scale (§5 #17) — shipped prior session
- ✓ Scales — pentatonic + 6-option type selector (All/Major/Natural/Harmonic/Melodic/Pentatonic)
- ✓ Key Signatures — 15 minor keys + Major/Minor/Both selector
- ✓ Ear: Scales — pentatonic + type selector (mirrors Scales)
- ✓ Primary Chords — minor keys + selector. V is MAJOR in minor (harmonic minor).
- ✓ Scale Degrees — minor keys + selector. Degree 7 = subtonic in natural minor.
- ✓ Roman Numerals — minor keys + selector. Harmonic minor conventions (i, ii°, III+, iv, V, VI, vii°).
- ✓ Intervals — clef selector verified as already functional. No expansion needed.

**Phase 3 — Chord renderer engineering session. ✓ DONE (May 2026).**
- ✓ `qn-staff.js` v1.3.0: `buildChord()` (3-4 stacked noteheads, shared stem, seconds displacement, staggered accidentals) + `buildStaffWithChord()` (high-level composer)
- ✓ `qn-audio.js` v1.1.0: `playChord(midiArray, opts)` — block chord with 40ms arpeggiation

**Phase 4 — Theory chord cluster (8 modules). ✓ DONE (May 2026).** Live count 19 → 27.
- ✓ Triads (§5 #20) — 29 chords, 4 qualities
- ✓ Triad Inversions (§5 #21) — 36 chords, 3 inversions × 2 qualities
- ✓ Seventh Chords (§5 #22) — 29 chords, 5 qualities
- ✓ Chord Progressions (§5 #23) — 13 entries, 5 progression types
- ✓ Cadences (§5 #24) — 18 entries, 4 cadence types
- ✓ Ear: Chord Quality (§5 #25) — audio-only triads
- ✓ Ear: Cadences (§5 #26) — audio-only cadences
- ✓ Ear: Chord Progressions (§5 #27) — audio-only progressions

**End-of-Phase-4 state: 27 modules live — the original full-roster target.**

**Phase 5 Tier A — score-literacy cluster (5 modules). ✓ DONE (May 2026).** Live count 27 → 32.
- ✓ Tempo Markings (§5 #10) — 11-term steady-tempo catalog + change markings; `meaning` / `ordering` / `metronome` / `change` question types; `playMetronome()` inline audio helper
- ✓ Dynamics (§5 #11) — ppp–fff composed via Bravura PUA letter glyphs; hairpins as inline SVG; sfz / fp accent family
- ✓ Articulation (§5 #12) — staccato / tenuto / accent / marcato / fermata / breath mark / caesura + tie-vs-slur discrimination (the headline skill)
- ✓ Score Navigation (§5 #13) — repeat barlines, voltas, D.C., D.S., Coda, Fine, segno; `routing` question type deferred to v1.1
- ✓ Ornaments (§5 #14) — trill, mordents, turn, grace notes (acciaccatura / appoggiatura), tremolo; visual ID only in v1

**Pattern reuse:** Tempo Markings was cloned from `accidentals.html` and established the cluster's "term card" renderer + 3- or 4-type question engine. The other four were Python-script clone-and-swap from Tempo Markings (Ornaments cloned from Articulation since both render noteheads on a staff). Boilerplate (audio engine, QN_FX celebration system, game loop, summary, modal) is byte-identical across the five files. No shared-file changes; each module renders its own inline-SVG staff segments. See BUILD_LOG.md "Phase 5 score-literacy cluster shipped" for the session log.

**Phase 5 Tier B+ — queued, ranked in CLAUDE.md.** Tier B (Circle of Fifths, Chord Function, Transposition), Tier C non-module multipliers (Mock Exam Mode, Curriculum Mapping Overlay — Tier 3 / lawyer-gated for the named-method version), and Tier D defensible-but-lower-ROI (C Clefs — Tier 3 renderer-extension required; Construction-mode engineering session — Tier 3; Build-a-X cluster — depends on construction mode; Non-Chord Tones — borderline audience-cap). Build-readiness summary lives in CLAUDE.md "Ranked build queue".

### Parallel tracks (not blockers)

- **Tier-3 monetization buildout (sequenced):** module promise-copy pass → Apple/Google sign-in (calls `linkAuth`) → Stripe + paywall (calls `startTrial`) → server-authoritative entitlement → parent-consent gate (COPPA/GDPR-K/UK-AADC — lawyer territory) → backend migration via `syncedAt`/`accountId` hooks.
- **Consolidation pass (in progress):** ✓ **Clef rendering consolidated** — all six staff modules call `NH.staff.buildClef()`. ✓ **Play-staff accidental glyphs consolidated** — `NH.staff.buildNoteAccidental()` (qn-staff.js v1.2.0), used by the five staff modules. ✓ **`qn-music.js` created (v1.0.0, forward-looking)** — superset pitch helpers; NEW modules use `NH.music`; existing modules keep inline copies until edited (option A). ✓ **`qn-theme.css` created (v1.0.0, May 2026) — first shared CSS file.** Design tokens + canonical question prompt + answer-tile system extracted; all 9 modules migrated (link added, duplicated rules stripped). The question prompt was standardized to the "quiet A" look (sentence-case, centered, 22px, fixed-height zone so the staff never jumps) and prompt wording normalized to question form across modules. ✓ **CSS extraction — all 6 of 6 clusters done (May 2026):** summary, start screen, play-screen chassis, modal, chunky buttons (incl. `.btn:disabled` lifted from scales as superset), and page chrome (cards / screens / brand / site-header / site-footer) extracted to `qn-theme.css` (~620 lines). All deployed and QA'd live. ✓ **Feedback toast rolled out to 8 of 9 modules** (scales kept its different model by design — 40px correct, `.toast.wrong`, no retry/reveal); Option-2 placement (praise 46% / retry-reveal 64%). ✓ **`QN.ui.confirm` rolled out to all 9 modules** — per-module `showConfirm` definitions retired; hardcoded-modal markup ids swapped on key-signatures + scales so ghost-left=`modal-cancel` matches the component convention. ✓ **Start-timer "Ready, set…" modal in all 9** (was 5-of-9). ✓ **Modal arrangement unified** — all 9 quit dialogs show Option 1 (Quit ghost/left, Keep green/right). ✓ **Key-sig clef-clearance made proportional** — `qn-staff.js` `buildAccidentals`/`buildStaff` startX changed from fixed 72/70 to `lineGap * 4.5/4.4` (clef width scales with lineGap); fixed a flats-overlapping-clef bug in scale-degrees, key-signatures unchanged, time-signatures key sig shifts +18px (pin-able via new `accStartX` override — QA-driven, not yet applied). **Module-specific holdouts left inline (genuinely-different, not flattened):** time-signatures' absolute-positioned `.staff-label` (needs separate prompt-layout conversion via a slider harness); scales' `.choice-btn` desktop 24px (pending wrap-as-designed tile reconciliation); piano-quiz's `.brand .brand-logo`; scales' `body.playing .site-footer { display: none }`; every module's `@media .btn` responsive shrink; scales' inline feedback-toast block (different model). ✓ **Clef-picker tile centralization (May 2026)** — new shared file `qn-ui.js` v1.0.0 with `QN.ui.clefTile({clef})` (canonical SVG) + `QN.ui.mountClefTiles(scope?)` (auto-mount on DOMContentLoaded). 14 modules (note-names, piano-quiz, piano-keyboard, ledger-lines, accidentals, intervals, ear-intervals, scale-degrees, primary-chords, roman-numerals, triads, triad-inversions, seventh-chords, pianoquiz-demo) had drifted into 3 distinct visual variants per clef; all now strip their inline tile-clef SVG and let `qn-ui.js` inject the canonical Bravura SMuFL tile. **The calibration pattern** lives in `_clef-calibrator.html` (untracked, prefix-`_` convention): §1 shows current-state variants in the wild, §2 has a live editor with sliders + preset buttons matching each shipping variant, §3 outputs a copy-paste JS snippet. This is the proven template for the remaining visual-calibration holdouts. **Still pending:** (1) sampled-piano audio (Tier 2); (2) notehead rendering in `qn-staff.js` (blocks retiring Note Names / Piano Quiz per-module note positioning); (3) the 2 visual-calibration holdouts above (time-sigs prompt-layout + scales tile) — clone the clef-calibrator pattern when these are tackled.
- ✓ **`schemaVersion` migration hook — installed** (qn-profile.js v1.8.0, May 2026 finishing session). Single global stamp at `qn_schemaVersion` (absent ⇒ 0); `migrations[N]` keyed by FROM version, must be idempotent; `runMigrations()` at module init writes the new version ONLY after a step completes (so a thrown migration halts with previous version intact). Today's data IS v1, so 0→1 is a no-op stamp — the HOOK is the value. Future breaking shape changes (rename / retype / restructure of stored records) bump `SCHEMA_VERSION` and add a `migrations[N]` entry; additive changes still don't need a version bump. `window.QN.schemaVersion` exposed for diagnostics.
- **Landing/terms/privacy:** accuracy pass + final legal language before non-beta launch.

## 13. Keeping this doc alive

Anything we figure out in a chat that isn't written down effectively didn't happen. To keep this doc useful across sessions:

**At the end of any session where we made decisions worth keeping**, I will list them as "doc updates to consider." You decide whether to fold them in. Candidates include: new tier-2 defaults, sub-skill tagging conventions, audio behavior choices, locked module decisions, scope clarifications.

**The build log (`BUILD_LOG.md`)** holds module-specific locked decisions and historical milestones. This doc holds cross-cutting rules and current state. Keep them separate.

**Starting a new chat:** paste this doc into the project instructions. I won't carry anything across chats automatically — the doc is the only continuity. Module file currency also doesn't carry: if a file in the project has been updated since I last saw it, tell me at the start of the session.

**Session-start file check:** before doing any work that touches the project files, I'll list what's in `/mnt/project/` and flag any files I don't recognize or that have changed names/versions since I last saw them. This is Tier 1 housekeeping and prevents the audit-the-wrong-version-of-reality problem.

**Doc version bumps:** if a change is substantive (new section, changed scope, changed working model), bump the "Last revised" date at the top and add a build log entry. Small edits don't need that ceremony.
