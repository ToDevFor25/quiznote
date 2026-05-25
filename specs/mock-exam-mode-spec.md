# Feature Spec — Mock Exam Mode

**Type:** Feature (not a module). Multiplier on existing content. **File:** new `mock-exam.html` + small extensions to `qn-profile.js` event logger.
**ROI rank (May 2026 queue):** #9 — feels like 5+ new modules to a user; isn't. Pure recombination of existing question pools into a timed, mixed, composite-scored format. High perceived value, moderate build cost.

## Why this feature
ABRSM, RCM, and AP all publish past papers. Students *love* practice tests because they reduce exam anxiety. Building this on top of the existing 27+ modules costs much less than building 5 more modules but reads as a major value-add to a user (especially one preparing for a real exam). It also creates a natural use-case for the curriculum mapping overlay (#10): "Take the ABRSM Grade 3 mock exam."

## What it does
A new screen accessible from `play.html` (or `path.html`) that pulls 30–40 mixed questions across multiple modules into a single timed sitting, then scores the composite.

- **Question selection:** N questions drawn from a configurable set of modules at configurable tier levels. e.g. "ABRSM Grade 3 mock" = 5 from Note Names (Tricky) + 5 from Intervals (Easy) + 5 from Key Signatures (Easy) + 5 from Time Signatures (Medium) + 5 from Triads (Easy) + 5 from Cadences (Easy).
- **Timing:** single visible countdown clock for the whole exam (30 min default; configurable 15/30/60).
- **No skill explainer cards** — assumes the learner already knows the content.
- **No per-question feedback** — review-after-completion only (mimics real exam UX).
- **Composite score screen:** total %, per-module breakdown, suggested practice areas (reuses `QN.recommend` weak-spot logic on the composite event set).
- **Attempt history:** stored in `qn_events` with a new `exam: true` flag + `examConfig: {modules, tiers, length}` for re-running the same configuration.

## Preset exam configurations
v1 ships ~3–5 preset configurations:
- "Quick Mix" (10 questions, mixed modules, 5 min)
- "Foundations Check" (20 questions, Foundations modules only, 15 min)
- "Reading Check" (20 questions, Reading modules only, 15 min)
- "Theory Check" (20 questions, Theory modules only, 15 min)
- (v1.1 once curriculum mapping is built and lawyer-approved): "ABRSM Grade X" / "RCM Level X" / "AP Music Theory Unit X" presets

User-configurable "Custom Exam" (pick modules + tier + length) is v1.1.

## Architecture
- `mock-exam.html` is a new module-shaped page that uses the standard template chassis but skips the explainer cards, skips per-question feedback, and overrides the summary screen with a composite-score view.
- Question selection logic = new helper on `QN.profile` (or new `QN.exam` namespace): `QN.exam.buildSet(config)` returns an array of `{module, tier, questionKey}` items, drawn pseudo-randomly from each module's existing pool generators.
- Per-question rendering uses each module's own `QNM.render` / `QNM.buildChoices` — **modules are not modified**; mock exam is a thin orchestrator over them.
- This requires each module to expose its question-generation functions in a uniform way. Audit needed: do all 27 modules cleanly expose `buildPool` / `buildChoices`? Most do (it's the QNM contract per project doc §3) — but some pre-system modules (scales, the perennial outlier per CLAUDE.md) may need light refactoring.

## Implementation phases
1. **Phase A — Architecture audit.** Verify all 27 modules expose their QNM contract cleanly enough to be orchestrated externally. Identify outliers (scales is the documented suspect). Decide whether outliers get retrofitted or excluded from mock exams in v1.
2. **Phase B — `QN.exam.buildSet` helper.** Pure function over module-exposed pools. Tested in isolation.
3. **Phase C — `mock-exam.html` chassis.** Adapts the standard template — single timer, no card breaks, composite summary.
4. **Phase D — Preset library.** Ship 3–5 presets in v1. Custom exam UI in v1.1.

## Dependencies
- Requires the QNM contract audit (Phase A above). May surface technical debt that's worth fixing regardless.
- Does NOT require the curriculum mapping overlay (#10) — they're independent features that reinforce each other if both ship.
- Does NOT require any new pedagogical content.

## Risk / failure modes
- If modules are inconsistent in how they expose pools, mock exam construction becomes a fragile orchestrator. Phase A is the gate — if the audit shows >2 modules need real refactoring, scope this as a longer effort.
- Composite scoring must feel meaningful (don't average percentages across wildly different difficulty levels naively). Spec the scoring formula deliberately.

## Standard features (inherited)
Profile chip via QNNav · personal-best per preset · save-results to `qn_events` · responsive layout matching module template.
