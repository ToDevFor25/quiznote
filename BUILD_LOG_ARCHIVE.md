# QuizNote build log — ARCHIVE

> Full blow-by-blow of resolved sagas and superseded UI sessions, moved out of the active
> `BUILD_LOG.md` during the May 2026 cleanup so the active file stays scannable. Nothing here is
> deleted history — it's the detailed record behind the collapsed entries in the active log. The
> durable *lessons* from these sessions live in the project doc §8 and the active log's "Collapsed
> sagas" section. Consult this only when you need the exact mechanism/diagnostic of a past fix.

---

## May 2026 — Hub-page profile menu (chip dropdown)

**Problem (user, from screenshots).** No way to see who's active or switch profiles from play.html; the chip existed on the dashboard but wasn't tappable; "delete all" felt undiscoverable. Root issue: the profile chip was inconsistent across pages (present on dashboard, absent on play) and the switcher + device-reset lived only on profile.html with no path in from the hubs.

**Chosen fix.** Make the profile chip a tappable identity-anchor on the two **hub pages** (play.html, dashboard.html); tapping opens a small dropdown menu. Module pages left untouched (their chip keeps the existing tap-straight-to-switcher link). No `qn-profile.js` change — version stays 1.4.0.

### Locked design decisions

- **Dropdown under the chip**, NOT a centered/dimmed modal [user chose after a side-by-side mockup]. Lightweight fits the everyday "switch user / check progress" intent; page stays visible. Responsive touch: on ≤760px the menu drops a bit wider with larger tap targets (some of a sheet's phone-friendliness without the dim-everything weight).
- **Small menu, NOT a direct link** [user]. Chosen as an extension point — future items (settings, help/FAQ, sign-out once there's a backend) get an obvious home instead of fighting for header space.
- **Menu contents:** Switch profile (→ `profile.html`) and Progress (→ `dashboard.html`). On the dashboard the Progress item is omitted (no-op — already there), so the dashboard menu is just Switch profile. Active nickname shown as a muted header row.
- **Reset all data deliberately NOT in the menu** [user refinement]. A destructive device-wide wipe shouldn't neighbor frequent actions in an everyday dropdown — muscle memory from "Switch profile" is exactly how someone fat-fingers a wipe. Reset stays on profile.html (the manage-data page, alongside profile edit/delete), reachable in two taps via Switch profile. Earlier in this session a `#reset` deep-link + `fillResetPreview()` helper were added to route the menu straight to reset; when reset was pulled from the menu, the `#reset` router branch was **backed out** (profile.html returned to clean state). The `fillResetPreview()` extraction was kept (still used by the reset-link handler — a small net improvement).

### Reset safety gate (verified, no change needed)

Confirmed in code: tapping the quiet "Reset all data on this device" link on profile.html does NOT wipe — it routes to a dedicated `#view-reset` confirmation that (a) states the scope ("every profile... for everyone, not just one person"), (b) shows a live count preview (`#reset-stats`), (c) warns "This cannot be undone," and (d) requires a second explicit tap on "Yes, erase everything" (Cancel as the easy out). `QN.profile.resetDevice()` only fires after that confirm. Two-step, accessible, accident-proof — suitable to point at from a future FAQ. **FAQ note:** the reset trail is chip → Switch profile → "Reset all data on this device" (bottom of switcher) → confirm.

### Implementation

- **Additive layer over `QN.ui.chip`, NOT a change to it** [Tier 2]. `ui.chip` still renders a plain `<a href="profile.html">` (works with no JS — graceful degradation). A self-contained `QNMenu` snippet (CSS + IIFE) wraps the chip, intercepts its click (`preventDefault`), and toggles an anchored dropdown. Chosen over editing `ui.chip` so the 7 module pages (which call `ui.chip`) are completely unaffected and there's no `qn-profile.js` version bump / cross-module re-verify.
- **Snippet inlined into both hub pages** (not a shared file) — correct for a two-page scope. `QNMenu.attach({ showProgress: <bool> })` called after the chip renders.
- play.html previously loaded NO scripts and had NO chip — added `qn-profile.js`, the chip slot in `.nav-right` (rightmost, after the PRACTICE tag), and the snippet. dashboard.html already rendered the chip — just added the `attach()` call + snippet.
- Menu closes on outside-click (capture-phase listener) and Escape.
- Unused `.qn-menu-divider` / `.qn-menu-item.danger` CSS retained intentionally for a future item (e.g. FAQ/help link, or any destructive action that genuinely belongs).
- **Verified** in Node with a DOM stub harness: chip wraps, menu builds, opens on click, correct item count + hrefs per page (play = 2: Switch/Progress; dashboard = 1: Switch), reset absent from both, outside-click + Escape close. All three files pass CSS brace balance, div balance, `node -c`.

### Deploy set

`play.html` · `dashboard.html` · `profile.html`, then merge Dev→main. No `qn-profile.js` change (stays v1.4.0). QA on Dev preview: tap name on play → menu shows Switch profile + Progress only (no reset); Switch profile lands on the switcher where the reset link lives; trigger reset → two-step confirm with correct count appears; repeat from dashboard and confirm Progress is absent there.

### Mobile nav overflow fix (play.html + dashboard.html)

**Bug (user, iPhone screenshot).** On phones the play.html chip clipped off the right edge ("Pia…") and the header pills looked boxy/squeezed. **Cause:** play.html's nav was a single non-wrapping flex row with THREE items in `.nav-right` (Progress button + PRACTICE tag + chip) and no mobile breakpoint — the chip (last) overflowed.

**Fix [Tier 2], CSS-only inside existing 560px blocks:**
- **play.html:** ≤560px, nav declutters to **brand + chip only**. PRACTICE tag dropped (redundant — page title already says it); standalone Progress button dropped because Progress now lives in the chip's dropdown menu. Nice payoff from the menu work: the chip *replaces* the nav buttons on small screens. Chip label capped `max-width:46vw` + ellipsis so a long (≤20-char) nickname can't re-trigger overflow.
- **dashboard.html:** milder crowding (brand + "No ads…" tagline + chip). Tagline NOT deleted (it's a brand/values line, not clutter) — pushed to its own line below brand+chip via `order:3; flex-basis:100%`, chip stays pinned, nothing clips.
- **Modules left untouched:** their headers are brand + chip with `flex-wrap` + an existing 760px block, so they wrap gracefully and don't clip (only play had the three-item row). Lowest-risk scope.
- Desktop unchanged on both; no JS / `qn-profile.js` change. Both pass brace/div/`node -c`.
- **Consequence to confirm with user:** on mobile play, Progress is now reachable ONLY via the chip menu (standalone button hidden). Leaning this is the right trade (cleaner header, one tap away); user to veto if they want a visible Progress button on phones.

**Deploy:** `play.html` · `dashboard.html`, merge Dev→main. QA on a real phone: play header = QuizNote + chip only, chip fully visible, Progress in the menu; dashboard tagline on its own line, chip pinned.

### Next-session queue + decisions (logged before context ran out)

1. ~~**[Bug] Save-scores prompt + name prompt appear on the summary screen even with an ACTIVE profile.**~~ **RESOLVED** (May 2026 — see "Save-scores prompt bug: root cause was CSS, not JS" entry below). It was NOT the JS guard or a mis-wired module — the logic was correct everywhere. Root cause was CSS specificity: `.save-scores-prompt { display: flex }` overrode the weak default `[hidden]{display:none}`, so the attribute was set but visually ignored. App-wide (template + all 7 modules). Fixed with a one-line `.save-scores-prompt[hidden]{display:none}` guard.
2. **[Design, Tier 2/3] Make "guest mode" an explicit remembered state.** Today the model is binary-by-absence (active profile or not); onboarding offers skip/play-as-guest but the choice isn't persisted, so a guest is re-prompted every round. Decide whether declining the profile prompt once should set a remembered "guest" flag that stops the per-round nag. Tie to the onboarding skip option.
3. **[Tier 3 / legal] "No tracking" copy — RESOLVED THIS SESSION (see below).** Was: defensible while local-only, but breaks once Vercel/Stripe/login/Supabase arrive; fragile as an absolute/permanent claim. Decision: remove "no tracking" everywhere, re-market on "what we won't do" + local-data claims. Onboarding fluency questions are NOT tracking (user-provided local preferences). Real lawyer still required before non-beta launch.
4. **[UX, Tier 2] Onboarding fluency questions — add parenthetical level tags.** The three self-report questions ("Just starting" / middle / "been at this a while") should show the level they map to (e.g. Beginner / Intermediate / Advanced-ish) so the answer visibly ties to the difficulty tiers used in gameplay. User likes the questions; this just makes the skill-level connection legible. Not yet built.
5. **[DECIDED] No logout button yet.** "Log out" implies an account session to end, which doesn't exist on a local-only build — it'd be a confusing alias for switch-user. Switch-user is the correct verb for multiple local profiles on one device. Add real "Log out" only when Apple/Google login exists. Keep the active-profile name shown in the dropdown.

### "No tracking" copy removed + privacy caveat (legal-accuracy pass)

**Why.** "No tracking" as an absolute marketing claim is a liability — defensible while local-only, but breaks the moment infra logs anything (Vercel/Stripe/login/Supabase). Re-marketed on "what we won't do" + local-data claims, which stay true across the roadmap. [Tier 3 — user directed the removal; real lawyer still required before non-beta launch.]

**Marketing copy — index.html + profile.html meta (user confirmed lean set 1a/2a/3a/4a):**
- Hero badge: `Free during beta · No ads · No tracking` → `… · No data sold`
- Section sub: `No ads. No tracking. No filler. Just the practice.` → `No ads. No filler. No selling your data. Just the practice.`
- "Private by design" pillar: `No tracking. No ads. No data sold. You stay in control.` → `Your practice data stays on your device. No ads, no data sold. You stay in control.`
- index meta description + profile.html meta: `no tracking` → `no data sold`.
- Result: zero "tracking" refs in index + profile.
- **Dashboard banner left as-is** ("No ads. No distractions. Just music fluency.") — no tracking claim, already safe "what we are" framing.

**privacy.html (user confirmed: keep the true lines, ADD a draft caveat).**
- KEPT the two true, scoped, user-protective statements (no tracking pixels/fingerprinting/cross-site tracking; no advertising/third-party tracking cookies) — deleting them weakens the policy without making it safer. The 3 remaining "tracking" refs are these intentional lines + the new caveat's "track you across other websites".
- ADDED one HTML-commented **DRAFT** caveat in Section 4 (Cookies/Local Storage): future optional sign-in / payments / cloud sync will rely on third-party providers under their own policies, and the policy will be updated before those launch. Flagged as needs-lawyer-review, not final legal language.

**profile.html baseline correction (important).** Mid-session I edited the project-knowledge `profile-3.html`, but the user then uploaded the LIVE `profile-4.html` (deployed on GitHub/Vercel) — which was AHEAD of the project copy: it already had this session's `fillResetPreview` refactor + reset confirm view, and correctly NO `#reset` router branch (backed out when reset was pulled from the menu). Re-based the copy fix onto the LIVE file. **The shipped `profile.html` = live profile-4.html + the one meta edit.** Discard the earlier project-copy edit. Lesson: when a deployed file may be ahead of project knowledge, get the live copy before editing.

**Deploy set (copy work):** `index.html` · `privacy.html` · `profile.html` (live-based), merge Dev→main.

---


---

## May 2026 — Session: bug fix, onboarding tags, mobile fixes, demo funnel, durability

A multi-part session. Files advanced through the session as deploys folded back; latest seen at session end: `qn-profile.js` v1.5.0, `pianoquiz-demo-2.html`, `index-26.html`, `play-15.html`, `note-values-14.html`, `time-signatures-19.html`, `profile-5.html`, `BUILD_LOG-8.md`, `QUIZNOTE_PROJECT_DOC-8.md`.

### 1. Save-prompt bug — active profile saw the guest prompt (qn-profile.js v1.4.1)

**Real bug, not cache** (user confirmed: hard-refreshed, well-established profile, production). **Reproduced in Node.** Root cause: `logOrHold`'s first line `if (!eventData || !eventData.module) return 'held'` ran BEFORE the active-profile check, so a `module`-less event from an active user returned `'held'` — which, combined with ANY stranded pending event (`pendingCount() > 0`), mis-fired the guest "save your scores?" prompt. The "many rounds in" detail fit: stranded pending events accumulate over time. **Trigger:** note-values + time-signatures pass `module: M.slug` (indirection) while the other five pass literal strings — so only those two could emit a falsy module if `M`/`slug` was ever unready.

Fixed at three layers:
- **qn-profile.js v1.4.1:** `logOrHold` checks active profile FIRST; never returns `'held'` for a signed-in user (malformed-but-active returns harmless `'skipped'`); also DRAINS stranded pending events (backfills) when an active user plays, removing the lingering-pending fuel.
- **note-values + time-signatures:** `module: M.slug` → `(M && M.slug) || '<slug>'` fallback (defense in depth).
- Verified 5 Node scenarios: bug case now hides prompt; normal active logging, anonymous hold, backfill, guest flow all intact.

### 2. Onboarding fluency questions — level tags (profile.html)

Added pill tags to the 3 self-report options so the answer maps visibly to gameplay tiers: "Just starting out → Beginner", "I know some notes → Intermediate", "I've been playing a while → Advanced". `.level-option` made flex row + `.level-tag` teal pill. Based on current profile-5 (no baseline tangle this time).

### 3. Time Signatures question clipped on Samsung (time-signatures.html)

The in-game question lives in `.staff-label`, which inherited the short-label rule (`white-space:nowrap` + fixed 34px height + ellipsis) — fine for "What is this?" but it clipped long question sentences ("Which number tells you what…") on narrow phones. **Fix:** `#play-screen .staff-label` now wraps up to 2 lines with `clamp(15px,4.4vw,22px)` responsive sizing + `-webkit-line-clamp:2`; staff pushed down (svg-wrap `top` 56→72px desktop, 84px mobile); mobile staff-card height 220→250px so a 2-line prompt + staff both fit. TS-specific (only module putting a full sentence in that slot); other modules untouched.

### 4. Key-sig tile sharps re-anchored to the clef (index.html + play.html)

Decorative "A major" tile sharps were drifting mid-staff (x=60/76/92). Pulled into a tight cluster right after the clef (x=34/45/56) in proper key-signature order. Vertical positions were already pitch-correct (F# top line, C# 3rd space, G# above staff). Horizontal/spacing fix only; animation intact. Engraving-accurate for A major (matches the tile label).

### 5. PianoQuiz "Test Drive" demo funnel (NEW — pianoquiz-demo.html)

The top-of-funnel: land → test drive → celebrate → promote → full app. **Decisions (all user-confirmed):**
- **Standalone demo file**, PianoQuiz untouched (demo is supposed to diverge; isolates funnel logic from the flagship). Known tradeoff: it's a static carve — won't inherit future PianoQuiz gameplay changes. (Noted on consolidation list.)
- **Boots straight into 10 questions, medium tier, both clefs** (treble+bass so they feel clef scrolling). Skips the setup screen; forces settings then calls `startRound()`.
- **Fully anonymous:** stripped `qn-profile.js` load, profile chip, `logOrHold`, save-prompt. No tracking in the taste.
- **Two-beat ending** [user]: celebrate FIRST (reuse PianoQuiz's native stars/tier-animation/confetti/encouraging line), then pitch on a tap. Summary screen = "↻ Play again" + "Keep going →"; "Keep going" reveals the marketing pop-up.
- **Marketing pop-up copy** (user-edited, soft-value, no price talk — same discipline as the "no tracking" removal): headline "That's just the warm-up 🎹"; two-clef subhead; three honest tiers (Foundations/Reading/Theory-Intervals) + "More modules coming soon!"; hook "Go at your own pace… Track your progress…" (cut "every round adapts" — that adaptation isn't wired into gameplay yet, only built as recommender logic); "No ads. Free during beta." (dropped "no signup needed" per user); single CTA "Explore the full app →" → play.html.
- Exit (X) leaves to play.html instead of the nonexistent start screen.

### 6. CTA + pop-up redundancy cleanup (index.html + pianoquiz-demo.html)

User spotted overlapping CTAs (pattern: two prominent buttons that look equivalent create decision drag, whether truly duplicate or merely similar-looking).
- **Landing:** all three primary CTAs → "Test drive →" → demo (nav top-right + hero + bottom). Hero keeps "See what's inside" (#anchor) as a distinct secondary. [Decision] Top-right + hero being twins is accepted because the top-right is temporary — it becomes "Log in" once Apple/Google accounts exist. Durable convention recorded in project doc: top-right nav = future account/login home; hero = primary task CTA.
- **Pop-up:** removed redundant "↻ Replay the demo" (duplicated the summary's "Play again" one tap away, and diluted the pop-up's single job). Pop-up now has ONE action (Explore the full app →); the × close returns to the summary where "Play again" lives. No capability lost.

### 7. localStorage durability — corruption detection + documented playbook (qn-profile.js v1.5.0)

User asked whether localStorage will cause issues on big updates. [Decisions] Document the strategy now, build the schemaVersion machinery LATER; add corruption detection now (cheap build-time safety net).
- **v1.5.0:** `readStorage` distinguishes CORRUPT (parse failure — data existed but unreadable) from EMPTY (no data). Corruption now: logs distinctly, copies the raw value to a recoverable `<key>__corrupt_<timestamp>` backup, returns safe fallback (no crash). New `QN.diagnostics.corruption()` / `.hasCorruption()` console surface. Verified in Node: corruption flagged+backed-up, empty NOT falsely flagged, no crashes.
- **Documented in project doc** (durability playbook): reads fail safe + corrupt≠empty; evolve the stored shape ADDITIVELY (no migration needed — as `skills` was); a non-additive change needs a `schemaVersion` stamp + migrate-on-read — **NOT built yet, deliberately deferred**, flagged because retrofitting versioning after unversioned data is in the wild is the painful path; hard boundaries (5MB/origin, per-device, per-origin); Supabase is the structural answer the local schema mirrors.
- Version ladder: … → 1.4 resetDevice → 1.4.1 guest-prompt fix → 1.5.0 corruption-aware reads + diagnostics.

### Deploy sets (this session, clean names)

- Bug fix #1: `qn-profile.js` (then superseded by v1.5.0 below), `note-values.html`, `time-signatures.html`.
- Onboarding tags: `profile.html`.
- TS question wrap: `time-signatures.html` (combined with the slug fallback).
- Sharps: `index.html`, `play.html`.
- Demo funnel: `pianoquiz-demo.html` (new), `index.html`. Requires `qn-audio.js` already deployed.
- CTA/pop-up cleanup: `index.html`, `pianoquiz-demo.html`.
- Durability: `qn-profile.js` **v1.5.0** (this is the one to push — supersedes the v1.4.1 interim).
- **Net to deploy:** `qn-profile.js` (v1.5.0), `pianoquiz-demo.html`, `index.html`, `play.html`, `note-values.html`, `time-signatures.html`, `profile.html`. Merge Dev→main. Hard-refresh, confirm `QN.version` === `1.5.0`. Re-upload updated project doc.
- **QA still owed:** the demo wants a real-device pass (boots to a question with both clefs, play 10, celebration fires, "Keep going" → single-CTA pop-up → play.html).

### Consolidation list addition

- The demo is a static carve of PianoQuiz — won't inherit future PianoQuiz gameplay changes. If PianoQuiz changes meaningfully, re-carve or revisit. (Acceptable divergence by design; logged so it's not a surprise.)

---


---

## May 2026 — path.html built (Today card + spine + Practice peek; phase 3, first surface)

The build that follows the planning entry above. **Shipped a new standalone `path.html`** — the first real surface for the weak-spot recommender. No change to `qn-profile.js` (stays v1.5.0), no change to any existing module, no routing change. Droppable + testable in isolation; deliberately NOT made the default landing page (that routing change stays a separate Tier-3 call, pending a feel check).

### What it is

A path-first home with the three-ring IA realized:
- **Today card** — calls `QN.recommend.next(active.id)`, renders the module name, the recommender's own `reason` line, tier/length/~time pills, and a tier-colored staff thumbnail. Tag varies by `kind` (progress / remediation / review / cold-start).
- **Path spine** — modules grouped by tier (Foundations/Reading/Theory), each shown done (✓, dimmed, best score) / current (★, the recommended module) / locked (🔒, soft — visible, dashed-feel, never forbidden). Computed in-page.
- **Practice peek** — three tiles biased toward the recommended module + top weak-skill module + most-played, plus the grape "the path guides; Practice never locks" banner. "All modules" → play.html.
- **States:** anonymous → "add a name to get a path" nudge; active → the full path.
- Nav mirrors the convention: brand + Today/Practice/Progress tabs + the chip. Chip uses the **verbatim `QNMenu` snippet** copied from play.html/dashboard.html (showProgress:true).

### Spine cleared-tier logic (in-page, additive, no qn-profile.js change)

A local `rollup()` over `qn_events` + `moduleStatus()` reusing the recommender's own thresholds (`MIN_ROUNDS_PER_TIER = 2`, `TIER_UP_ACCURACY = 0.85`) so the spine's "cleared" badges match what the recommender will actually skip. Kept in-page (not in the shared file) so there's no version bump and the blast radius is one new file. Note: these two constants are now **mirrored** in path.html — if the recommender's `REC` knobs are re-tuned, update path.html to match (logged as a coupling).

### The tier-handoff finding [important — shapes a follow-up task]

Investigated how modules receive a tier on launch. **No module reads a URL param**; they read a localStorage settings key on boot — but only SOME do:
- **Template-pattern modules read `<slug>_settings`** via `loadSettings()` and prefill the start screen: note-values, time-signatures.
- **Scales reads `sc_settings`** and prefills.
- **note-names, piano-quiz, intervals, key-signatures do NOT read any settings key on boot** — their start screen uses hardcoded `state.settings` defaults + the `.on` class in the HTML. Pre-seeding is a silent no-op for these four.

**Decision [Tier 2, "you decide"]: ship the card now, log the retrofit.** Rationale: the alternative (a 4-module `loadSettings()` retrofit) expands a one-new-file session into editing four live modules' boot paths — exactly the "looks quick, has hidden surface" shape the consolidation-session lesson warns against. It deserves its own focused pass.

**Handoff behavior as shipped:** the Start button writes the settings payload in BOTH key forms (`<slug>_settings` AND a short-prefix `<pfx>settings`) so it doesn't depend on which convention a module uses; harmless where unread. Result: tier is honored for note-values / time-signatures / scales; the other four launch the correct module on their own start screen at the user's last settings (reason line still names the tier). No broken state anywhere — worst case is one extra tap + tier not pre-highlighted.

### Verified (local, network-off)

- Both inline `<script>` blocks pass `node -c`.
- CSS brace balance 106/106; div balance 25/25; section/aside/nav/main/footer/svg all balanced.
- Logic simulation against stubbed `localStorage` + realistic events: cleared/in-progress/untouched statuses correct; pre-seed writes both key forms with right tier/length; navigation targets correct `<slug>.html`.

### Assumptions NOT verifiable here (confirm in QA / next session)

- Four short prefixes used in the pre-seed map are **inferred, not confirmed against live code**: `nn_` (note-names), `pq_` (piano-quiz — `pq_muted` IS confirmed, settings key inferred), `ks_` (key-signatures), `iv_` (intervals — `iv_muted` IS confirmed, settings key inferred). Low-stakes today (those four don't read settings on boot anyway); matters when the retrofit happens.
- `.qn-chip` styling was authored fresh into path.html (it's a new page) — confirm it visually matches the chip on play/dashboard.

### QA owed (Dev preview)

Open path.html anonymous → "add a name" state. Make a profile + play a couple rounds → Today card shows a real recommendation with reason; spine shows progress; Practice peek shows 3 tiles. Tap Start → lands on the recommended module (on the right tier for note-values/time-signatures/scales). Tap chip → dropdown (Switch profile + Progress).

### Deploy set

`path.html` (new) only. Relies on already-deployed `qn-profile.js` v1.5.0. No other file changes. Do NOT wire it as the default home yet.

### Doc updates to consider

1. **`loadSettings()` retrofit** for the four older modules (note-names, piano-quiz, intervals, key-signatures) so they read `<slug>_settings` on boot like the template does — makes tier-honoring universal. Its own focused session; verify the four short prefixes against live code while there.
2. **Spine threshold coupling:** path.html mirrors the recommender's `MIN_ROUNDS_PER_TIER`/`TIER_UP_ACCURACY`. If `REC` is re-tuned, update path.html. (Or, later, expose the thresholds from `qn-profile.js` so there's one source.)
3. **"Make path.html the default landing page"** — the routing change in index.html/play.html — remains the open Tier-3 call, pending the feel check.

---


---

## May 2026 — loadSettings retrofit (all 4 older modules) + a long Vercel deploy saga

Two things this session: (1) shipped the `loadSettings()` retrofit flagged in the prior entry's doc-updates #1 — Start now hands the recommended tier to every module; (2) burned a long evening on a deploy problem that turned out to be 100% Vercel preview-URL behavior, not code. Logging both, the second one especially, so it never eats an evening again.

### The retrofit (the actual feature work)

Closes the path→module gap: the Today card recommends a tier, and now the module opens on it. Built `applyPathHandoff()` into the four older modules that didn't read a settings key on boot — **note-names, piano-quiz, intervals, key-signatures**. (note-values, time-signatures, scales already honored their settings key.)

- **One-shot, consume-then-clear [Tier 2, decided "best + scalable"].** Reads the pre-seeded `<slug>_settings`, applies it to `state.settings`, syncs the start-screen `.on` highlights to match, then **deletes the key**. The handoff is "for this launch only" — a later direct visit starts from the module's own defaults, so a path recommendation never silently sticks as a preference. Scalable because there's no per-module preference state to maintain or migrate to Supabase.
- **Reads tier + length + clef.** clef included so the delivery pipe is ready for a future clef-aware recommender, even though the recommender doesn't emit clef yet. (See next item.)
- Per-module tailoring: note-names/piano-quiz/intervals have a clef tile group → handoff syncs it; key-signatures has no clef → handoff omits it. Spliced via guarded exact-string edits; each verified with `node -c`, brace/div balance, and a behavioral sim (highlight-sync moves, key clears, second call is a safe no-op).
- **note-names confirmed working live**; the other three are identical in pattern, verified by sim + structure (not yet live-confirmed at write time). Live check per module: set `<slug>_settings` in console, reload, confirm it clears. Slugs: `note-names_settings`, `piano-quiz_settings`, `intervals_settings`, `key-signatures_settings`.

### Clef-aware recommender — now the formal next recommender session

The retrofit made the pipe clef-capable (modules read clef on handoff), but the recommender still reasons only in module + tier + length, **not clef**. Yet clef is a real difficulty axis (bass harder than treble) AND is already tagged as a sub-skill (dashboard shows e.g. "Bass clef 40%"). So the weak-spot data to recommend a clef exists; the recommender just doesn't consume it. This is the "recommend second" depth of the moat (tag→recommend→surface), and it's its own careful-design session. Until then: tier + length carry through on Start; clef always opens on the module default. That's expected, not a bug.

### The Vercel deploy saga (the lesson with teeth)

Spent the bulk of the session on "path.html / note-names doesn't honor the handoff" — chasing it as a code bug, a cache bug, a filename bug. **It was none of those. The code was correct and committed the whole time.** Root cause: testing against the wrong Vercel deployment.

- Vercel gives **every commit its own immutable preview URL** with a random hash (e.g. `quiznote-fly3t8wle-…vercel.app`). That URL is a frozen snapshot — it never updates. The hash URL being used for testing was a build from ~3h earlier (pre-retrofit, and pre-recommender — it served `qn-profile.js` v1.0.0, which is also why the path page first showed "Recommender not available").
- Every "it didn't work" — stale version string, blank/stale path, unhonored handoff, key never clearing — was the same thing wearing different clothes: a stale snapshot URL with its own separate localStorage.
- The `git-dev` branch alias was *also* stuck pointing at a stale "Stale"-tagged deployment, so even the supposedly-stable URL lagged.
- **Fix that ended all of it [workflow]:** set Vercel **Production Branch = Dev** (Settings → Git). Now the clean no-hash production URL always serves the newest Dev build — one stable URL, one localStorage, always current. Confirmed working immediately after.

**Standing workflow rules added (write into the project doc's working style):**
1. **Test only on one stable URL** — the production URL after setting Production Branch = Dev. Never test on a per-commit hash preview URL; it's a frozen snapshot.
2. **The served build is ground truth** — not the GitHub repo source, not the file you uploaded. Confirm with `QN.version` in console AND a known one-shot side effect (e.g. the handoff key clearing). This is the deploy-side twin of the earlier "cached-old-qn-profile.js" lesson.
3. **localStorage is per-domain** — a profile made on one deployment URL won't exist on another. Inconsistent "no profile" / "lost scores" across URLs is this, not data loss.

### Deploy set

Four modules: `note-names.html`, `piano-quiz.html`, `intervals.html`, `key-signatures.html` (clean names, replace in repo). Relies on already-deployed `path.html` + `qn-profile.js` v1.5.0. QA: per-module console key-clear test on the stable URL.

### Still open (unchanged by this session)

1. **Clef-aware recommender** — the next recommender session (above).
2. **A real link *into* path.html** — still only reachable by typing the URL; needs a "Today" tab on play.html/dashboard (the small reversible wiring step).
3. **"Make path.html the default home"** — Tier-3 routing decision, still pending the feel check (which is now positive — the feature is signed off).
4. **Spine threshold coupling** — path.html still mirrors the recommender's `MIN_ROUNDS_PER_TIER`/`TIER_UP_ACCURACY`; collapse to one source eventually.

---


---

## May 2026 — Save-scores prompt bug: root cause was CSS, not JS (app-wide fix)

**Resolved** the open-queue bug "[Bug] Save-scores prompt appears with active profile" (logged in the prior session's next-session queue). Both this and the v1.4.1 session assumed it lived in the JS guard / pending-events logic. It did not.

**Root cause — CSS specificity, one layer below where everyone looked.** `.save-scores-prompt { display: flex }` (a class selector) overrides the browser default `[hidden] { display: none }`, which is too weak to beat a class. So JS correctly setting `ssp.hidden = true` set the attribute but never visually hid the element — the prompt rendered for everyone, active profile or not, independent of JS state.

**Why it hid so well.** Every runtime signal kept exonerating the JS. On the live quiznote.online summary screen, signed in: `QN.version` -> `1.5.0`; `QN.events.logOrHold({...})` -> `'logged'` (not `'held'`); `QN.events.pendingCount()` -> `0`. Plugged into the reveal line `ssp.hidden = !(roundOutcome==='held' && pendingCount()>0)` that correctly yields `hidden = true`. The logic was flawless; the stylesheet ignored it. Reading the full module confirmed one reveal site, no duplicate id, no competing code path — leaving CSS as the only explanation, and `.save-scores-prompt` had `display:flex` with no `[hidden]` guard.

**Scope: app-wide.** Originated in `qn-template.html` (all seven modules clone from it). The template carries `[hidden]` guards for six other elements (`.summary-speed`, `.acc-block`, `.timer-pills`, `.timer-badge`, `.pb-row`, `.modal-overlay`) — save-scores-prompt was the one missed, so every module shipped with it.

**Fix — one additive CSS line, no JS change:**
`.save-scores-prompt[hidden] { display: none; }`
added beside the existing `.save-scores-prompt` rule. Hidden when the attribute is set; `display:flex` when removed.

**Fixed:** `qn-template.html` + all 7 modules (`note-names`, `note-values`, `key-signatures`, `piano-quiz`, `scales`, `intervals`, `time-signatures`). HTML/CSS only — no `qn-profile.js` change, no version bump. User-verified working (signed-in: prompt gone; guest: prompt still appears).

**Lesson (second scar for an existing rule).** Reinforces "inspect the computed box model before theorizing about logic." The whole investigation chased the JS guard and pending events while a class-vs-`[hidden]` specificity override sat in the stylesheet. The working case — "JS provably returns 'logged' yet the box is on screen" — is what finally pointed at CSS, not JS. New standing rule added to project doc Section 8: any `hidden`-toggled element with an author `display` rule needs a matching `[hidden]{display:none}` guard.

**Process note (GitHub connector).** This session connected the repo via the Projects GitHub connector (read-only, on Dev branch) and cleaned repo filenames to canonical names. Key finding: the connector reads repo files via chunked search only — it cannot deliver a whole file for surgical full-file editing. Reading the complete `note-names.html` via direct upload is what surfaced the CSS; chunked search had repeatedly returned only the (correct) JS block, which is partly why the JS got over-scrutinized. Convention going forward: connector for read/confirm; direct upload (or a targeted one-line hand-edit) when applying a whole-file fix. The two living docs + `qn-template.html` remain manual project uploads (template intentionally not in the repo — it has unresolved `{{PLACEHOLDER}}` strings).

### Deploy set

`qn-template.html` (dev artifact — update the project upload, not the repo) + 7 modules: `note-names.html`, `note-values.html`, `key-signatures.html`, `piano-quiz.html`, `scales.html`, `intervals.html`, `time-signatures.html`. HTML/CSS only; no `qn-profile.js` change. QA on the stable production URL: signed in -> prompt gone; guest -> prompt still appears; hard-refresh to bust per-file cache.

---


---

## May 2026 — Welcome-back bar: mobile two-row + sticky (index.html)

**Context / why this wasn't already logged.** The returning-visitor "Welcome back" bar on `index.html` (teal bar above the nav, links to `path.html`, session-dismissable via ×) was never given its own build-log entry — it must have been added during one of the `path.html` sessions (it depends on `path.html` existing) but slipped the log. No mystery beyond that: the code was present and correct in `index.html`; only the *record* was missing. This entry documents both the pre-existing bar and the change made this session, so future chats have it. (It also corrects a false alarm from the start of this session: the bar/path were flagged as possibly "stale/undocumented" — that was based on a truncated paste of this log, not the real file, which fully documents `path.html`.)

**Problem (user-reported, with screenshot).** On mobile the bar clipped the player's name to "Welcome back, …". Root cause: the bar was a single flex row where the CTA button (`Continue your path →`) and × were `flex: none` (never shrink) and the name (`wb-text`) was the only flexible element — so under ~390px the name was the only thing that lost space and ellipsis-clipped to nothing. Also the bar was not sticky, so the path CTA scrolled away, while the nav below it had its own `position: sticky; top: 0`.

### Changes (all confined to the welcome bar in `index.html`)

- **Mobile two-row layout (`max-width: 560px`).** Bar switches to `flex-direction: column`. Row 1 = greeting + dismiss × (`.wb-top` wrapper, space-between); row 2 = the CTA as a full-width button. The greeting now uses full width and wraps (`white-space: normal`) instead of clipping — the name shows in full. Desktop is unchanged (single row, name left / button + × right).
- **Desktop ×-placement preserved via `display: contents`.** The × is in the DOM inside `wb-left` (so it sits with the greeting when stacked on mobile). At `min-width: 561px`, `wb-left` is set to `display: contents` so dot/text/×/right become direct flex children of the bar, and flex `order` puts the × back at the far right after the button — matching the original desktop look. `margin-right: auto` on the text pushes the button group right.
- **Sticky, stacked with the nav.** Bar is now `position: sticky; top: 0; z-index: 60` (above the nav's `z-index: 50`). The nav's `top` was changed from `0` to `var(--qn-welcome-h, 0px)`. The injection script measures `bar.offsetHeight` into `--qn-welcome-h` on `:root`, so the nav pins directly *beneath* the bar instead of colliding. Both stay visible on scroll (user-chosen behavior: bar on top, nav below).
- **Offset is robust to height changes.** `--qn-welcome-h` is re-measured on `resize` (bar height differs across the 560px breakpoint, esp. with the wrapping greeting) and on `document.fonts.ready` (Fredoka swaps in after first paint and changes line metrics). Dismissing the bar (×) clears the offset back to `0px` and removes the resize listener — and first-timers/dismissers, who never get a bar, fall back to `top: 0` via the CSS variable default, so the nav behaves exactly as before for them.

### Locked design decisions

- **Copy:** greeting is now `Welcome back, {name} — ready to pick up your path?` (was `Welcome back, {name}`). Button text unchanged: `Continue your path →`. Considered "What game shall we play today?" — set aside because "game" leans younger than the rest of the surface ("practice," "reading fluency," learners-not-kids). [Tier 2]
- **Greeting-as-question, separate from the button** (not question-baked-into-the-button) — keeps the warm question visible on its own line and the button unambiguous. [Tier 1, aesthetic-in-pattern]
- **Sticky stacking order:** bar on top, nav pinned below it, both visible. [user decision]
- Dismiss stays **session-only** (`sessionStorage` `qn_welcome_dismissed`) — returns next visit. Unchanged.

### Verified

`node -c` on the extracted injection script (parses). CSS brace balance across all `<style>` blocks: 403/403. All new hooks present (`--qn-welcome-h` default, `.wb-top`, `display: contents`, `@media (min-width: 561px)`). Visual not yet confirmed on a real device — QA below.

### Deploy set

`index.html` only. No `qn-profile.js` change, no version bump, no other file touched. QA: as a returning profile-holder, load `index.html` on a phone — full name shows on its own line, CTA is a full-width button below it; scroll → bar + nav both stay pinned (bar on top); tap × → bar gone and nav snaps to top with no gap; reload → bar returns. On desktop → single row unchanged, × at far right after the button.

### Still open / coupling notes

- **`play.html` may have its own copy of this bar** and isn't in the project knowledge (only `index.html` is), so it couldn't be checked or fixed this session. If a welcome bar exists there too, it needs the same two-row + sticky treatment. **Flagged for next session.**
- **New coupling:** the nav's sticky `top` now depends on `--qn-welcome-h`, set by the bar's injection script. Anyone restyling the nav's sticky behavior must keep this in mind (or the nav will overlap the bar / leave a gap).

---

---

## May 2026 — Unified nav across index/path/play/dashboard + welcome-bar overhaul (`qn-nav.js`)

A multi-step arc that started as a mobile welcome-bar bug and ended as a site-wide nav unification. Shipped a new shared component and touched four pages.

### Why this happened (and a correction)
The returning-visitor welcome bar on `index.html` clipped the player's name on mobile (single flex row; the CTA + × were `flex:none`, so the name was the only shrinkable element). Fixing it surfaced that the three app pages each had a *different* nav: `path.html` text tabs (Today/Practice/Progress), `play.html` emoji-links (🎯 Today / 📊 Progress) + a "PRACTICE" tag + chip, `dashboard.html` back-links (← All modules / 🎯 Today) + chip. Three vocabularies, three layouts. The welcome bar itself had never been logged (added during a path.html session). **Correction to a false alarm:** early this arc `path.html` was flagged as possibly stale/undocumented — that was from a truncated paste of this log; the real file fully documents it.

### Decisions (all user-directed; several are Tier 3 — primary nav + landing CTA)
- **One nav everywhere.** Brand left; `[ profile pill ] [ CurrentPage ☰ ]` right. The pill is identity-only (active name + colored dot, or "Guest"), links to `profile.html`. The hamburger's label = the page you're on; the dropdown lists the two destinations you're NOT on (current page omitted, reusing QNMenu's old no-op-avoidance principle).
- **Three destinations, final vocabulary:** **Today** (path.html) / **All Modules** (play.html) / **My Progress** (dashboard.html). "Practice" retired as a destination name — everything is practice, so it didn't distinguish anything; "All Modules" says what you get. "Dashboard"→"My Progress" (learner language, pairs with the path framing; "My" signals ownership). [Tier 2 naming]
- **Identity vs. destination split:** profile-switching lives in the pill, not the menu — so the dropdown stays just the 3 destinations. Dropped "Switch profile" / "Log out" from the menu (an earlier mock had them).
- **Index, two states:** guest keeps "Test drive" + a sticky nav (stays the whole scroll); returning user gets the welcome prompt + the pill/hamburger, no Test drive.
- **Welcome bar:** sticky **alone** (only the bar pins; the nav scrolls away beneath it via `body.qn-has-welcome nav { position: static }`). On ×, bar is removed and the class dropped → nav returns to normal sticky, whole page scrolls. Two-row on mobile (greeting+× on top, full-width CTA below) so the name never clips; single row on desktop. Copy: "Welcome back, {name} — ready to practice?" / button "Continue →". Dismiss stays session-only.

### The build: `qn-nav.js` (new shared component) + Option A refactor
Chose **A (true unification)** over a per-page reshape: extract one component, retire the old per-page `QNMenu`. Rationale: only A delivers "same nav everywhere" rather than "looks similar" — anything less recreates the drift we were fixing.

- **`qn-nav.js` (NEW)** — `window.QNNav.mount({ current })`. Self-contained: injects its own CSS, renders pill + label + hamburger + dropdown, handles open/close/outside-click/Escape. `current` ∈ `'today'|'modules'|'progress'|null` (null → "Menu" label, all 3 shown — used on index). Slot resolution falls back `#qn-nav-slot` → `#profile-chip-slot` (legacy) → `#nav-actions`. Does NOT depend on `QN.ui.chip` (renders its own pill), so module pages that still use the plain chip are untouched.
- **`index.html`** — welcome bar (sticky-alone, two-row mobile) kept inline; menu now calls shared `QNNav.mount({current:null})`. Removed the inline `buildMenu`/`QN_NAV_DESTS` (~84 lines JS) and inline menu CSS (~64 lines) that were prototyped here in the prior pass — superseded by `qn-nav.js`.
- **`path.html`** — dropped the text tabs; mounts `QNNav.mount({current:'today'})`. Retired its `QNMenu` block (~94 lines).
- **`play.html`** — dropped emoji-links + "PRACTICE" tag; mounts `{current:'modules'}`. Retired `QNMenu` (~151 lines).
- **`dashboard.html`** — chip slot → `#qn-nav-slot`, removed redundant body back-links; mounts `{current:'progress'}`. Retired `QNMenu` (~151 lines). Header layout unchanged (still `space-between`; gave `#qn-nav-slot` the old slot's `margin-left:auto`).

### Verified
`node -c` on `qn-nav.js` and every page's inline scripts (all parse). CSS brace balance: index 404/404, path 93/93, play 98/98, dashboard 64/64. `<div>`/`</div>` balanced on all four. `QNMenu` reference count = 0 on the three hub pages. Each page includes `qn-nav.js` after `qn-profile.js` (both defer → ordering guaranteed) and calls mount with its slot present. **Not yet device-verified** — visual QA below; the returning-visitor state in particular was built from spec (user couldn't see it live, gave trust to proceed).

### Deploy set
NEW `qn-nav.js` + `index.html`, `path.html`, `play.html`, `dashboard.html`. Relies on already-deployed `qn-profile.js` v1.5.0 (no profile-JS change, no version bump). QA: (1) returning user on each of the 4 pages → pill shows name, hamburger labeled with the current page, dropdown shows the other two and routes correctly; (2) guest on index → "Test drive" + sticky nav, no pill; guest on path/play/dashboard → "Guest" pill + full nav; (3) index returning → welcome prompt, dismiss × removes bar and nav resumes sticky; mobile → name on its own row, no clip; (4) hard-refresh to bust per-file cache (new `qn-nav.js`).

### Still open / notes
- **`profile.html`** was NOT brought into the unified nav this pass (it's the identity/manage page the pill links *to*, with its own back-link header). Decide whether it should also carry the bar.
- **Leftover dead CSS:** unused `.profile-chip-slot` rules remain in path/play/dashboard (harmless; left to keep the diff focused). Clean up in a later pass.
- **Dashboard header** keeps its stacked brand+tagline+slot layout; the nav right-aligns via `space-between`. A fuller visual match to the other pages' bar is a polish follow-up, not done here.
- **`QN.ui.chip`** is now unused by the four nav pages but still used by module pages — left intact.

---


---

## May 2026 — profile.html into unified nav + footer standardization (all pages)

Two small follow-ups to the nav-unification arc.

### profile.html joins the unified nav
`profile.html` now mounts the shared `QNNav` (`current: null` → "Menu" label, all 3 destinations), replacing its lone "← Back to modules" link. Pill shows the active profile (useful context on the identity/manage page). Include added after `qn-profile.js`; mount called inside the existing `init()` retry-guard so `QN`/`QNNav` are ready. All six learner-facing pages (index, path, play, dashboard, profile) now carry the same nav. Minor accepted wart: the pill self-links to profile.html when you're already on it (harmless reload).

### Footer standardization [Option 2, user-chosen]
Footers were inconsistent: play.html had the canonical one; path.html had nav-links + Privacy only; profile.html had Privacy/Terms + copyright in a different shape; dashboard.html had none; index.html had a richer marketing footer.

**Canonical footer (the four app pages — play/path/dashboard/profile):**
`© 2026 QuizNote · Privacy Policy · Terms of Service · Made by musicians, for musicians` (relative links, `.sep` separators).
- play.html: already canonical (the reference).
- path.html: replaced its "All modules · Progress · Privacy" footer (nav links dropped — navigation is the hamburger's job now; the "module" link removed per user, anticipating a future paywall).
- profile.html: replaced its variant; kept the page's existing `.foot` div wrapper (already centered/muted), added a `.foot .sep` rule.
- dashboard.html: had no footer — added markup + matching CSS (used `--shadow-cool` for the border-top, the var this page defines).

**index.html [Option 2 — keep richer landing footer, align wording]:** kept the branded footer (wordmark + beta pill + domain) but removed the "Modules" link (per user) and switched link text to the full "Privacy Policy" / "Terms of Service". Also changed the copy-line tagline "Practice music theory, one short round at a time" → "Made by musicians, for musicians" to match the signature line. **Flag:** that tagline swap is a judgment call — if the original landing tagline was preferred, it's a one-phrase revert.

### Verified
All five touched pages: CSS brace balance and `<div>` balance intact. Canonical footer text present on the four app pages; index has full link names, no Modules link. Old footer variants confirmed gone.

### Deploy set
`index.html`, `path.html`, `play.html` (no footer change, but shipped together as the nav set), `dashboard.html`, `profile.html`. No `qn-nav.js` change this round (profile.html consumes the already-built component). Relies on `qn-profile.js` v1.5.0.

### Note on this session's log
The project mount refreshed mid-session and `/mnt/project/BUILD_LOG.md` reverted to a near-empty stub; the new "Unified nav" entry briefly landed on the stub and was recovered. The complete log is the `outputs/BUILD_LOG.md` copy — treat it as source of truth when syncing back.

---


---

## May 2026 — Returning-user "Test drive still showing" → filename mismatch (qn_nav vs qn-nav)

**Symptom.** A returning user on index saw the welcome bar correctly ("Welcome back, AllegroAlpaca — ready to practice?") but the nav still showed the guest "Test drive" CTA — no pill, no hamburger. Looked like a stale deploy (this repo has prior scars for that).

**Not a deploy or code bug — a filename mismatch.** Verified the code three ways (parse, headless `mount()` test that clears the slot + appends the nav, IIFE/`window.QNNav` export structure) — all correct. Console on the live site: `typeof QNNav` → `"undefined"` + two `404`s. Network tab showed `qn-nav.js` in red (404). Root cause: the file was committed to the repo as **`qn_nav.js`** (underscore) while all five pages `<script src="qn-nav.js">` reference the **hyphen**. Server had the underscore file; pages requested the hyphen; 404; `QNNav` never defined; the `if (window.QNNav)` guard skipped the swap; the literal "Test drive" HTML stayed.

**Fix:** rename repo file `qn_nav.js` → `qn-nav.js` (hyphen). Chosen over editing five includes because hyphen matches the convention of every other shared file (`qn-profile.js`, `qn-staff.js`, `qn-audio.js`); `qn_nav.js` was the lone underscore. No code change — the includes were already correct. **Canonical filename is `qn-nav.js` (hyphen) — keep it that way everywhere.**

**Hardening shipped alongside (stays regardless):**
- `qn-nav.js` `getActive()` was using a bare `QN` reference under `'use strict'`; now fully `window.QN`-qualified.
- `index.html` init now has a fallback: if `window.QNNav` is missing (file 404s again, etc.), it repoints the "Test drive" CTA to `path.html` as "Continue →" so a returning user is never stranded on the guest CTA. Can't render the hamburger (that *is* qn-nav.js) — it just prevents the wrong-CTA bug.

**Lesson.** Add to the "stale deploy" differential: before blaming the CDN/cache, check the Network tab for a 404 and confirm the requested filename exactly matches the committed filename. An underscore/hyphen slip presents identically to a stale build.

---


---

## May 2026 — Nav saga, part 2: dead dropdown, page consistency, sticky, mobile overflow

Continuation of the unified-nav work. The filename fix (prev entry) made `QNNav` load; this session fixed everything that surfaced after it rendered. Several distinct bugs, each with its own root cause — grouped here because they were one continuous debugging arc.

### The dead-dropdown bug (stacking context) — root cause + fix
**Symptom.** Nav rendered correctly (pill + current-page hamburger), dropdown opened and looked right, but tapping an item did nothing — no navigation.

**Diagnostic that cracked it.** Live console `document.elementFromPoint(x, y)` at the center of a dropdown item returned `<section class="hero">`, NOT the `<a>`. So the click was landing on the hero behind the panel — the panel was *visible but not on top for hit-testing*.

**Mechanism.** The nav has `backdrop-filter` + `z-index: 50`, which makes it a **stacking context**. The dropdown panel was `position: absolute` inside the nav with `z-index: 200` — but that 200 only ranks it *within* the nav's context (effective level ~50 against the page). Where the panel overlapped the hero, the hero won hit-testing.

**Fix (in `qn-nav.js`).** Panel is now `position: fixed; z-index: 99999`, appended to `document.body` (escapes the nav's stacking context entirely), positioned via the button's `getBoundingClientRect()` in a `place()` fn that re-runs on scroll/resize. Outside-click handler checks both the wrap and the panel; stale-panel guard via a `qn-nav-panel-mounted` id. Headless-tested.

**Lesson.** `elementFromPoint` is the tool for "visible but unclickable." When an element renders but won't receive clicks, something else is winning hit-testing — usually a stacking-context/z-index trap, not a z-index *number* problem. (Same shape as the earlier "why is 6/8 always right" win: let the live DOM tell you the mechanism instead of theorizing.)

### Page-consistency cleanup
The unified nav exposed that the pages still differed in chrome. Resolved:
- **Stale `play.html` deploy** accounted for most of the "not consistent" report — the live Practice page was the pre-unified version (old Today/Progress pills, "PRACTICE" tag, old chip dropdown). The outputs `play.html` was already fully converted; the fix was simply to deploy it.
- **path.html brand** ("Today logo wrong") was plain non-linked `QuizNote` with no teal accent → fixed to `Quiz<span>Note</span>` linked to index, with the `.nav-brand span { color: teal }` rule added.
- **dashboard brand** made a link to index (`text-decoration:none` added).
- **Tagline** lived only on dashboard ("No ads. No distractions. Just music fluency.") → removed so all three app pages share the identical clean bar (brand left, pill+hamburger right). **Flag:** removed rather than added-everywhere because it matched the two already-approved pages; if the tagline is wanted on all three instead, that's the alternative.
- **dashboard footer floated mid-page** (short content) → body made `display:flex; flex-direction:column`, `.wrap` set `flex:1 0 auto` so the footer sits at the bottom.
- **profile footer** content was already canonical but styled differently (12px, underlined links) → `.foot` restyled to match the canonical footer typography (13px, no-underline). Kept inside profile's narrow centered column rather than forced into a full-width bar — profile is a deliberately different form-style page. **Flag:** if a literal full-width footer bar is wanted there too, small follow-up.

### overflow-x:hidden breaks position:sticky — root cause + fix
**Symptom.** On index, the welcome bar and nav both scrolled away despite `position: sticky; top: 0` on each. Multiple deploy attempts didn't fix it.

**Root cause.** `body` had `overflow-x: hidden`. Any `overflow` value other than `visible` on an ancestor turns that ancestor into the sticky scroll container; since `body` doesn't scroll internally, every `position: sticky` descendant silently fails. The sticky rules were correct the whole time — the overflow was disabling them.

**Fix.** Moved the horizontal clipping from `body` to `html` as `overflow-x: clip` (`clip` clips without creating a scroll container, so it doesn't re-trigger the bug the way `hidden` on `html` could). Sticky now works.

**Lesson.** Add to the differential for "position:sticky isn't sticking": check every ancestor (esp. `body`/`html`) for a non-`visible` `overflow`, and for `transform`/`filter`/`contain`. Prefer `overflow-x: clip` over `hidden` when you only need horizontal clipping and want sticky to keep working.

### Index sticky behavior [user DECISION]
- **Welcome bar present:** bar (top) and nav (below it) are **both pinned**, stacked; page scrolls under the pair. Nav offset handled by `body.qn-has-welcome nav { top: var(--nav-top, 0px) }`.
- **After × dismiss:** bar removed, `qn-has-welcome` class dropped, nav alone stays pinned at `top:0`; page scrolls under the nav.
- **Guest (never had a bar):** nav pinned, page scrolls under it.
- Net rule: **the nav is always sticky**; the welcome bar is sticky above it while it exists.

### Mobile nav overflow (index)
On narrow phones the nav row (logo + BETA + profile pill + Menu) overflowed the right edge — pill and Menu clipped off-screen. Fix, scoped to index:
- **≤760px:** `nav` gets `flex-wrap: wrap`; brand and right-side actions allowed to shrink (`min-width:0`); QNNav pill name truncates at `max-width: 30vw` (ellipsis).
- **≤460px:** BETA pill hidden; brand badge/word shrunk; pill name capped at `24vw`.
- Pill name truncation is **variable-width** (industry standard — Netflix/Spotify/Slack pattern): hugs short names, ellipsis only when space runs out. Not fixed-width.
- Audit was scoped to index only [user call] — truncation in the shared `qn-nav.js` already helps the other pages.

### Profile name cap (confirmed, no change)
Question raised about capping profile names. Found `profile.html` already enforces **20 chars**, two layers: `maxlength="20"` on both the create and edit inputs, plus a validation gate (`val.length >= 1 && val.length <= 20`) that disables Continue otherwise. 20 chosen as generous-enough for real names while truncation handles tight-space display. No code change needed.

### Deploy set
`qn-nav.js` (fixed panel: fixed-position, body-appended, re-placed on scroll), `index.html` (sticky/overflow + mobile nav + welcome-bar behavior), `path.html` (brand), `play.html` (the stale-deploy fix — deploy the converted version), `dashboard.html` (footer + tagline + brand), `profile.html` (footer styling). Relies on `qn-profile.js` v1.5.0 (no bump). Hard-refresh after deploying `qn-nav.js`.

QA: returning user on every page → pill + current-page hamburger, **dropdown items navigate** (the bug); guest index → Test drive + sticky welcome behavior; scroll index as returning user → bar+nav pinned together, then × → nav alone pinned, page scrolls under; narrow phone → nav fits, name truncates, no clip.

### Working-style note
The `ask_user_input_v0` picker repeatedly failed to capture selections this session (echoed questions back) — fell back to plain-text questions. The Safari console also suppressed `console.log` output; a `.join(' | ')` *return-value* expression is the reliable way to read computed styles live there.

---


---

## May 2026 — Nav saga, part 3: pill truncation done right + footer unification

Polishing pass on the unified nav, driven by mobile screenshots across all pages using a deliberately long test name ("PianoPanda1234567890"). Two arcs: getting the profile-pill truncation to behave consistently and per industry convention, and finishing footer unification (profile was the last odd page out). Supersedes the index-only mobile-overflow fix from part 2.

### The pill-truncation evolution (what superseded what)
Three iterations this session, each replacing the last — recorded so the reasoning is clear:

1. **Variable-width per page (part 2, now retired).** Pill hugged its name and ellipsed only past a `vw` cap, set per-page on index. Problem the screenshots exposed: each page gave the pill a *different* amount of room, so the same name truncated to different widths page-to-page ("PianoPanda123…" vs "PianoPanda12…"), and `play.html`'s long "All Modules" label clipped because only index had been fixed.

2. **Fixed cap + wrap (intermediate, also retired).** Moved truncation into the shared `qn-nav.js` (`max-width: 150px` desktop / `132px` mobile) so it was identical everywhere, and added `flex-wrap: wrap` to the nav containers so the long hamburger label wouldn't clip. Problem: wrapping dropped the *entire* pill+hamburger group to a second line whenever the label was long ("All Modules", "My Progress"), stranding the brand alone on the top line — while short labels ("Today") stayed on one line. So the *layout* now varied by label length. [user flagged this directly from screenshots]

3. **Pill-shrink, one line always (current).** The right model: keep the row on one line and let the *flexible* element (the pill) absorb the squeeze while *fixed* elements (brand, hamburger button) stay intact.
   - **`qn-nav.js`:** `.qn-nav` and `.qn-nav-pill` get `flex-shrink: 1; min-width: 0`; `.qn-nav-btn` gets `flex: none` (label never clips). Pill keeps `max-width: 150px` desktop / `132px` mobile as the *ceiling* (full name shows when it fits — desktop/tablet), shrinking below that as space tightens.
   - **All four nav containers:** `flex-wrap` removed; brand set `flex: none` (stays whole); the right-side group/slot set shrinkable (`min-width: 0`). Now the pill yields instead of the row wrapping. (index, play, path, dashboard — path/dashboard had already wrapped; play was the outlier that clipped.)

### Readable floor + avatar-only fallback [industry-standard polish]
Unbounded shrink let the pill collapse to "P…" on the narrowest phones with the longest label — technically one line, but unreadable. Fixed to match how the big apps stop:
- **Readable floor:** `.qn-nav-name { min-width: 4.5em }` — name ellipses to a legible stub (~8 chars, "PianoPa…"), never a single letter. Verified by flex math to still fit one line down to ~481px even with the longest label.
- **Avatar-only fallback ≤480px:** name `display: none`, pill collapses to just the colored initial dot as a ~40px circular tap target (`padding: 8px`, dot 22px). A bare avatar reads as "your account"; "P…" reads as broken. This is the Spotify/Twitter/Gmail move.

### Industry-standard nav patterns (durable design rules)
Recording these so they're not re-derived later. The nav now follows the mainstream conventions:
- **Truncate the flexible label, never wrap the layout or clip fixed controls.** Logo and menu button stay intact; the account/name label is what gives. (Slack, Spotify, Gmail, Linear, GitHub.)
- **Fixed elements get `flex: none`; the yielding element gets `flex-shrink: 1; min-width: 0`.** `min-width: 0` is the flexbox gotcha that actually lets a flex child shrink below its content size so ellipsis engages.
- **A readable floor on the truncated label** (~8 chars) rather than collapsing to one character.
- **Below the floor, drop the label and fall back to an avatar/initial** — never render a one-letter ellipsis stub.
- **Maintain a ~40px+ touch target** for the avatar-only control (iOS HIG / Material minimum).
- **A global footer is identical on every page** — same content, styling, full-width band; it's page chrome like the nav, not per-page content. A footer that restyles itself per page reads as unfinished.

### Footer unification (profile was the last odd page)
profile.html had a text-style footer (`.foot` div) living *inside* its 520px centered `.page` column — no border, no band, slightly different color token — a historical artifact from before footer standardization, not a principled choice. Made it match canonical:
- Moved the footer markup **out of `.page`** to be a body-level `<footer>` (page chrome, like the other pages).
- Applied canonical band styling: white bg, `border-top: 2px solid #d8d6cc`, `padding: 16px 24px`, centered, Nunito 13px, `#8a8472`.
- **Token gotcha caught:** profile's own `--ink-faint` is `rgba(42,42,62,0.12)` (a faint hairline), NOT the readable `#8a8472` that play/dashboard's identically-named token resolves to. Using `var(--ink-faint)` would have rendered the footer text near-invisible. Used **literal** canonical values instead. (Lesson: same token name ≠ same value across pages; resolve it before reusing.)
- **Layout:** `body` made `display:flex; flex-direction:column`; `.page` set `flex: 1 0 auto` (dropped its own `min-height:100vh`) so the footer anchors to the bottom on short views instead of floating. Same pattern the other pages use. Full-width band + centered text now matches play/dashboard exactly (their content is wider, but the band is full-width there too).

### Dead-CSS cleanup (closed the part-2 backlog item)
Removed the orphaned `.qn-chip` / `.profile-chip-slot` rules left over from the pre-unification `QN.ui.chip` component (the unified nav renders `.qn-nav-pill`/`.qn-nav-name`/dot instead). Confirmed zero live markup used those classes before deleting. Cleared from play.html (3), path.html (2), dashboard.html (4 — kept the live `#qn-nav-slot` half of one shared selector). Trimmed a now-stale dashboard comment referencing "the chip." Cosmetic only; no behavior change. All CSS re-verified balanced.

### Deploy set
`qn-nav.js` (pill-shrink + floor + avatar fallback), `index.html` (mobile nav → shrink model), `play.html` (no-wrap + brand flex:none + dead-CSS), `path.html` (no-wrap + brand flex:none + dead-CSS), `dashboard.html` (no-wrap + brand flex:none + dead-CSS), `profile.html` (footer unification + body flex layout). Relies on `qn-profile.js` v1.5.0 (no bump). Hard-refresh after deploy (`qn-nav.js` changed).

QA: long test name on every page → one line, brand + hamburger intact, pill truncates identically; desktop → full name shows; narrow phone → readable stub or initial-dot circle (never "P…"); profile footer → full-width band matching other pages, anchored to bottom on the short welcome view.

### Still parked (non-blocking, flagged)
- **play's "All Modules"** is the longest hamburger label and squeezes the pill hardest on the narrowest phones; with the avatar fallback the pressure mostly disappears, but shortening to "Modules" remains the easy lever if it ever feels tight live. [hold until seen on-device]
- **dashboard tagline** (removed for consistency vs. add-to-all-three) and **index marketing-footer tagline swap** — both one-phrase reverts, user's call.
- **dashboard `.site-tagline` CSS** is now also dead (tagline was removed earlier); left in place, out of scope this pass.

---


---

## May 2026 — Accidentals (module #5, first build of the post-infrastructure roster)

First net-new module since the roadmap was locked to 24. Slug `accidentals`, namespace `AC`, Foundations · Level 2 (§5 #5). Fills the named Foundations gap: Key Signatures assumed accidentals it never taught. Spec committed to the repo at `specs/accidentals-spec.md` (Dev branch) — first module spec to live in the new `specs/` folder.

### What it is
Staff + four-button MC, sibling to Note Names. Three question types — which ARE the sub-skills tagged for the dashboard:
- **`effect`** — "What does this symbol do?" → word tiles (Raises/Lowers a half/whole step, Cancels). Distractor rule: always include the opposite-direction effect, so the choice tests direction, not luck.
- **`name`** — "Name this note." → pitch-name tiles. Distractors: same letter opposite accidental + the natural.
- **`enharmonic`** — "Which note sounds the same as C♯?" → pitch tiles, no staff note (prompt names the pitch). Distractors: near-miss spellings.

Tiers (Easy/Medium/Tricky) gate symbol set + type weights: Easy = sharp/flat/natural `{effect .7, name .3}`; Medium = + double-sharp/flat `{effect .45, name .4, enharmonic .15}`; Tricky = all five + enharmonic emphasis `{effect .3, name .35, enharmonic .35}`. The accidental set is a finite fixed catalog (5 symbols) — to make it harder later, add question types/enharmonic depth, not symbols.

### Build method — clone + brain-swap, NOT regenerate
Cloned `note-names.html` (closest sibling), kept the entire shared chassis (QNNav, qn-profile v1.6.0, qn-staff, footer, FX, summary, timer, sub-skill-tagging machinery), and replaced ONLY the question brain. The chassis-vs-engine split is the reusable lesson: a new MC module is "clone the nearest sibling, swap six consumer touch-points, keep everything else."

The six rewired consumer touch-points (the engine — `makeQuestion()` returning `{type, skill, prompt, staff, choices:[{label,correct}], answer}` — was already authored):
1. **startRound** — dropped the pitch pool/deck; the engine generates each question.
2. **nextQuestion** — calls `makeQuestion(diff)`; builds the staff pitch object DIRECTLY (parsePitch only handles single #/b, so midi comes from the natural letter for staff position + a `soundMidi` = base ± semis for audio); enharmonic questions hide the staff and show the prompt.
3. **renderChoices** — renders `{label,correct}` tiles; detects word-tiles (effect) vs pitch-tiles via whitespace and tags the grid `choices-wordy`; styles ♯♭♮𝄪𝄫 glyphs on pitch tiles.
4. **handleChoiceTap** — matches by `choice.correct` (not MIDI); audio guarded for enharmonic (no pitch).
5. **onWrong reveal** — finds the correct tile by `choice.correct`; shows `state.current.answer`.
6. **pushHistory + tally** — history records `{type, skill, answer, kind}`; the sub-skill tally keys off `h.skill` (was `h.clef`).

### Staff renderer extension (carries to future modules)
`qn-staff.js`'s embedded glyph map only handled `'#'`→♯ and `'b'`→♭. Extended it (and `displayName`) to a map covering `n`→♮, `x`→𝄪, `bb`→𝄫, so naturals and double accidentals render. Additive — existing modules unaffected.

### Start screen + dashboard
- Hid the "Which clef?" question (engine picks clef by tier: Easy treble-only, Medium/Tricky random) with a `#clef-block[hidden]{display:none}` guard per the load-bearing rule; renumbered the remaining steps; rewrote difficulty subtitles to describe accidental tiers; kept the sharps/flats `acc-block` permanently hidden (the module uses all accidentals).
- **Drill** repurposed to replay a focused round (Accidentals generates fresh questions, so item-level drill doesn't map).
- **Dashboard** (`dashboard.html`): added `SKILL_LABELS` entries `accidentals/effect → "Symbol effect"`, `/name → "Naming altered notes"`, `/enharmonic → "Enharmonic equivalents"`. Without them the dashboard still works (raw-key fallback) but shows bare keys.

### Verified (Node, before any browser)
- **Engine: 6,538 invariant checks across 1,500 generated questions** — every question has exactly 4 choices / 1 correct / answer==correct-label; tier gating holds (Easy never emits enharmonic; Medium ~17%, Tricky ~37%); effect answers are valid effect strings; name answers carry an accidental glyph; enharmonic answers are the theory-accurate partner (doc §9: C♯↔D♭, F♯↔G♭, A♯↔B♭, G♯↔A♭) and never duplicated among distractors.
- **Consumer path** simulated: staff questions yield valid midi+soundMidi, enharmonic yields null pitch (no crash), tally aggregates by skill and sums to round length, all skill keys ∈ {effect,name,enharmonic}.
- **Structural:** CSS balanced (258/258), inline JS balanced + `node --check` passes, header/footer/nav/profile intact, identity fully swapped (title, slug, `module:'accidentals'`, `accidentals_pb`/`accidentals_settings` keys).

### Discoverability (done-bar steps 3–4)
- Live **Accidentals** tile added to Foundations on both `play.html` (200×130 art) and `index.html` (160×112 art) — staff with ♯ before a notehead + ♯♭♮𝄪 chip row, grape art. Placed after Note Values / Time Signatures.
- Index hero stat bumped 7 → 8 modules.

### Deploy set
`accidentals.html` (new) · `dashboard.html` (labels) · `play.html` + `index.html` (live tile, count). Relies on already-deployed `qn-profile.js` v1.6.0, `qn-nav.js`, `qn-staff.js`. Commit Dev → merge main. **QA before merge: open accidentals.html and play one round of EACH tier** — confirm effect shows word tiles + a staff symbol, name shows pitch tiles + an altered notehead, enharmonic shows pitch tiles + prompt-only (no staff), and the summary's "Within this skill" breakdown lists effect/name/enharmonic. A 404 from a tile means the deployed filename isn't exactly `accidentals.html`.

### Honest note on process
First attempt left a re-identified clone whose question brain was still Note Names' — it would have played as Note Names under an Accidentals title. Flagged and corrected: a module isn't "done" (§11) until it plays as itself. The clone-and-rename is the chassis; the brain swap is the module.

#### Addendum — prompt + staff sizing matched to Time Signatures (mobile)

The cloned-from-Note-Names `.staff-label` was a tiny 13px uppercase label built for short fixed text; Accidentals' prompts are full sentences ("Which note sounds the same as C♯?") and on a narrow phone they rendered small and the longer enharmonic prompt cramped/clipped — the same failure mode the Time Signatures prompt treatment was built to fix. Matched the TS *logic* (not its absolute-position layout, which would break Accidentals' flex column):
- **Responsive question prompt:** added `#play-screen #q-prompt` mirroring TS — `font-size: clamp(15px, 4.4vw, 22px)`, weight 600, normal case, centered, wraps up to 2 lines (`-webkit-line-clamp: 2`), `max-width: 22em`. The prompt is now properly sized and legible on mobile instead of a small uppercase label.
- **Stable staff/symbol size:** capped the staff SVG width (`max-width` 340px default / 280px mobile / 360px desktop) mirroring TS. Rationale is the TS saga itself: a free-scaling `width:100%` SVG stretches the accidental `<text>` glyph (♯♭♮𝄪𝄫) to a scale whose baseline doesn't track the geometry — the same class of issue as the digit drift. Fixed caps keep the symbol a consistent, readable size across devices.

Kept Accidentals' flex-column layout (matched the sizing values + responsive logic, not TS's absolute positioning). CSS balanced (259/259). Verify on a phone/narrow window: effect + enharmonic prompts both read clearly; staff symbol sits at a sensible size.

#### Bugfix — enharmonic question could present two correct answers

User caught it in play: "Which note sounds the same as E♭?" offered A♭ / C♯ / D♯ / E♭. D♯ is the intended answer (E♭=D♯), but **E♭ itself was also a tile** — and E♭ obviously sounds the same as E♭, so there were two valid answers. Root cause: the enharmonic distractor logic seeded `distractorsEnh = [from]` with the rationale "the note itself is a tempting wrong answer." Flawed reasoning — the note isn't a *wrong* answer, it's a second *right* one. Fix: never include `from` (nor anything enharmonically equal to it) among the distractors; distractors are drawn only from notes that genuinely don't share its pitch.

Test gap that let it through: the engine suite only asserted "exactly one tile is *marked* `correct`," not "exactly one tile is *actually* correct by pitch." Added a pitch-class check (map every enharmonic spelling → semitone, assert exactly one tile sounds the same as the prompt note) and a no-duplicate-tiles assertion. Re-verified: 5,000 enharmonic questions → exactly one same-sounding tile each, `from` never offered, 0 dupes; full 6,000-check invariant suite passes. Lesson logged: "one correct tile" must be validated by the answer's *semantics* (pitch), not just the `correct` flag — a generator can mislabel and still pass a flag-only check.

#### Bass clef position fix + staff-renderer divergence finding (May 2026)

User reported the bass clef sat too high while treble/sharps/flats were fine. Built a dev calibration harness (`clef-calibrator.html`) that embeds the **real** `buildStaff()` with the two bass-clef coefficients on live sliders, plus dashed reference guides (bass dots should straddle the F line = 4th from bottom) and an exact-line code output. Same calibrator-first approach that solved the time-sig digit position + weight. Dialed-in value: bass clef `y = bottomY - lineGap * 0.55` (was `1.4`) and `font-size = lineGap * 5.3` (was `4.6`). Applied to the two affected files.

**Key finding — the staff renderer has diverged into two families:**
- **Unicode-serif family** (`accidentals`, `note-names`): bass clef drawn with the Unicode glyph `𝄢` in a serif font. These were the two with the bug; both now carry the calibrated `0.55 / 5.3` values.
- **Bravura SMuFL family** (`piano-quiz`, `scales`, `intervals`): bass clef drawn with the Bravura music font (`\uE050` treble / `\uE062` bass), anchored to the correct staff line (F3 = step 3) with Samsung-calibrated offsets (treble +0.75, bass +2.375 staff-spaces). These never had the bug — they were fixed in an earlier pass and use a real music font that renders consistently cross-platform.
- `note-values`, `key-signatures`, `time-signatures`: no play-staff bass clef (don't render one / render differently).

**Implication for the consolidation pass (raise priority):** the Bravura approach is strictly better (Unicode serif `𝄞`/`𝄢` render differently per-OS — the same cross-platform inconsistency class as the time-sig digit saga). The right future-proofing is two-fold: (1) migrate the Unicode-serif modules (accidentals, note-names) to the Bravura SMuFL clef rendering the other three already use, then (2) lift the unified staff renderer into `qn-staff.js` so clef tweaks are one edit across all seven modules instead of N copy-pasted edits. Until then, staff changes must be hand-applied per embedded copy, and the two families must be kept in mind (a fix to the serif line does nothing for the Bravura modules and vice-versa). Calibrator kept as `clef-calibrator.html` (dev-only) for the next staff tweak.

#### Staff renderer unified — accidentals + note-names migrated to Bravura SMuFL ("done-forever" path)

Following the bass-clef divergence finding, took the done-forever path instead of calibrating the inferior serif renderer: migrated the two Unicode-serif modules (accidentals, note-names) onto the **Bravura SMuFL** clef/accidental rendering the other four staff modules (piano-quiz, scales, intervals, key-signatures) already use. Now all six modules render the **play staff** with one identical renderer.

Why this over re-calibrating serif: the Unicode glyphs `𝄞`/`𝄢`/`♯`/`♭` render differently on every OS (the same cross-platform fragility class as the time-sig digit saga); Bravura is a real music font that renders pixel-consistently everywhere and was already calibrated. Calibrating the serif treble would have been throwaway work.

Per module, four changes (verbatim from piano-quiz, the most complete copy):
1. **Font loading added** — `<link preload>` for `BravuraText.woff2` + the `@font-face` block at the top of `<style>`. CRITICAL: without this the SMuFL glyph would fall back to tofu. (Note-names already *referenced* 'Bravura Text' in its FX explosion code but had no `@font-face`, so that FX was silently falling back to serif — now fixed as a side benefit.)
2. **Clef glyphs** → Bravura `\uE050` (treble) / `\uE062` (bass), anchored to the correct staff line (G4 step 1 / F3 step 3) with the Samsung-calibrated offsets (+0.75 / +2.375 staff-spaces). The serif `0.55/5.3` bass value from the prior fix is now superseded/deleted.
3. **Accidental glyphs** → Bravura SMuFL: sharp `\uE262`, flat `\uE260`, and (accidentals only, which needs all five) natural `\uE261`, double-sharp `\uE263`, double-flat `\uE264`; anchored at note y + 1.625 staff-spaces.
4. Left the **start-screen tile clef icons** (`class="clef"`, the small decorative selector pictures) as serif — static, tiny, low-risk; not the play staff.

Verified: both files CSS+JS balanced, `node --check` passes; all six staff modules now show `\uE062` (Bravura bass) on the play staff and zero serif clefs in `buildStaff`. clef-calibrator.html retained (dev-only) for any future tweak — but a tweak now means editing the shared Bravura values, ideally once `qn-staff.js` is the single source (still pending: the renderer is still copy-pasted per module; lifting it into `qn-staff.js` is the remaining consolidation step so the next clef change is one edit, not six).

#### Treble clef position + size recalibrated (Bravura) — rolled out to all six staff modules

Built treble-calibrator.html (dev-only, same harness pattern as the bass/clef cards) embedding the real Bravura G-clef (\uE050) with live offset + font-size sliders, starting from the shipped 0.75 / ×4. Dialed-in values: **treble offset 0.75 → 0.975**, **treble font-size ×4 → ×4.2**. Bass left as-is (2.375 / ×4).

Rollout subtlety worth noting: in every module the clef **font-size string was shared between treble and bass** (both used `lineGap * 4`, intervals/key-signatures via a `clefFontSize` var). Since only treble's size changed, the font-size could NOT be blanket-replaced — it was scoped to the treble glyph line specifically (the `\uE050` / `SMUFL.gClef` line), leaving bass at ×4. Verified post-edit that zero bass-clef (\uE062) lines picked up 4.2.

Applied across all six: accidentals, note-names, piano-quiz, scales (literal `0.975 * lineGap` + inline treble `lineGap * 4.2`); intervals (same, treble line given its own `lineGap * 4.2` instead of the shared `clefFontSize`); key-signatures (named `OFFSET.trebleClef: 0.975` + treble `lineGap * 4.2`). All six: CSS+JS balanced, node --check passes; treble offset/size present once each, bass unchanged.

Third hand-applied clef tweak across six copies this session (bass position, Bravura migration, now treble). The case for lifting `buildStaff` into `qn-staff.js` keeps compounding — next clef change should be one edit, not six. Flagged again; not yet done.

#### Clef rendering consolidated into qn-staff.js (surgical extraction — ends the six-edit clef tweak)

The third hand-applied clef change in one session made the cost clear, so extracted the shared clef logic. Discovery that shaped the approach: the deployed `qn-staff.js` (`window.NH.staff`, loaded only by time-signatures until now) ALREADY had a `buildClef()` with named `OFFSET` constants — but it was stale (treble 0.75, single `lineGap*4` size, pre-dating the bass fix, Bravura migration, and treble recalibration). And the six staff renderers are NOT one function — accidentals/note-names/piano-quiz use `buildStaff`+`renderStaff`, scales uses `buildStaffFrame`, intervals uses `buildStaffWithInterval` (two notes), key-signatures inlines a key-sig drawer, note-values/time-signatures have no play bass clef. So a full-renderer merge was rightly rejected as high-risk/low-gain; the surgical scope is just the clef block, which IS identical across all six.

What was done:
- **`qn-staff.js` → v1.1.0:** `buildClef()` updated to the current calibrated values via `OFFSET` constants — `trebleClef: 0.975`, `bassClef: 2.375`, and NEW per-clef sizes `trebleClefSize: 4.2` / `bassClefSize: 4` (the modules had a treble-vs-bass size split that the old single `fontSize = lineGap*4` didn't capture). `buildClef` now reads both. Version bumped so a stale-deploy shows as `NH.staff.version !== '1.1.0'` in console.
- **All six modules** now call `svg += NH.staff.buildClef({ clef, bottomY, lineGap, xOffset })` (scales passes `x: 14` since it doesn't use xOffset for the clef) instead of their inline `if(treble){…}else{…}` block, and each now loads `<script src="qn-staff.js" defer>`. Removed now-orphaned `clefFontSize` locals (intervals, key-signatures). key-signatures KEEPS its local `SMUFL`/`OFFSET` — they still drive its key-signature accidental row (4 uses each), only the clef block was swapped.
- Load-order: `qn-staff.js` is `defer` and `NH.staff.buildClef` is only called during question rendering (post-DOMContentLoaded), and every module shares the same `window.NH` global, so timing is safe.

Verified: qn-staff.js `node --check` passes; buildClef Node functional test confirms treble 0.975/4.2 + bass 2.375/4 + correct glyphs + explicit-x honored; all six modules call buildClef once, zero inline leftover clef glyphs, load qn-staff.js, parse, CSS balanced.

**Net result: the next clef tweak is ONE edit in qn-staff.js, not six.** Note: the rest of each renderer (note/interval/key-sig/time-sig positioning) remains module-specific by design. The accidental glyphs on the play staff (sharp/flat/natural/double) are still inline per module — a future surgical pass could route those through `NH.staff` too (the helpers exist), but they were left alone this round to keep scope tight. Deploy set: qn-staff.js (v1.1.0) + all six staff modules; hard-refresh / cache-bust after deploying qn-staff.js (check NH.staff.version === '1.1.0').

#### Clarifications on the clef consolidation (start-screen filters + which modules are covered)

Two questions that came up after the consolidation, answered against the code so a future session doesn't re-investigate:

**Start-screen filter count is 2 or 3 by design, not an inconsistency.** Modules that let the player choose a clef show 3 filters (clef + difficulty + length): note-names, piano-quiz, intervals. Modules where the engine picks the clef itself show 2 (difficulty + length): scales, key-signatures, time-signatures, note-values, and now **accidentals**. Accidentals hides its "Which clef?" block (still in the file, `hidden`) because the engine assigns clef by tier (Easy treble-only; Medium/Tricky random). This has **zero effect on progress/weak-spot mapping**: the start-screen filters only set `state.settings`, while the dashboard reads each module's `skills` tally from gameplay. Accidentals tags by question type (`effect`/`name`/`enharmonic`), not by clef, so dropping the clef *filter* changes nothing downstream. Consistent with the four other no-clef-choice modules that have always run this way.

**The clef-position change reached all eight modules via two paths — no module was missed.** (1) The six staff modules edited to call `NH.staff.buildClef` directly: accidentals, note-names, piano-quiz, scales, intervals, key-signatures. (2) **time-signatures was NOT edited and did not need to be** — it already loads `qn-staff.js` and renders via `NH.staff.buildStaff(...)`, which calls `buildClef` internally (qn-staff.js line ~342), so it inherited the calibrated treble (0.975/4.2) + per-clef sizes automatically. This is exactly the payoff of the consolidation: update `buildClef` once, time-signatures gets it free. (3) note-values renders NO clef (Bravura duration symbols only, doesn't load qn-staff.js) — N/A.

**One visual caveat to spot-check:** time-signatures uses a larger staff (`lineGap: 20`, `width: 450`) than the others (`lineGap: 16`). Clef offsets are in lineGap units so they scale proportionally and the math holds, but the treble value was visually calibrated on a 16-unit staff — worth an eyeball on the bigger TS staff to confirm it reads well at that scale. Not a known issue; proportional units should carry it.

#### Shared bits routed thinner: play-staff accidental glyphs + qn-music.js (forward-looking)

Continuation of the consolidation arc — making modules thinner so new ones build faster.

**Play-staff accidental glyph → shared `NH.staff.buildNoteAccidental` (qn-staff.js v1.2.0).** The five staff modules each inlined "draw one accidental glyph next to the play note" with the same glyph map (#→E262, b→E260, n→E261, x/##→E263, bb→E264), the same +1.625-lineGap calibrated offset, same size/anchor — only the x and note-y differed (intervals draws two; scales uses a tighter x). Added `buildNoteAccidental({ accidental, x, noteY, lineGap, color })` to qn-staff.js (distinct from `buildAccidentals`, which is the key-signature ROW). Routed accidentals (5 glyphs), note-names (#/b), piano-quiz (#/b), intervals (two calls, upper+lower), scales (play-note, behind its `drawAccidental` guard). Shared map accepts both `x` and `##` for double-sharp since scales uses the `##` convention. Verified: helper Node-tested for all five glyphs + edge cases (null/unknown → ''), all five modules call it / zero inline leftover / parse / CSS balanced. qn-staff.js bumped 1.1.0 → 1.2.0 (additive export). NOT routed: scales' key-signature accidental ROW (that's `buildAccidentals`'s job, left as-is); key-signatures' local accidental row (still uses its local SMUFL/OFFSET).

**`qn-music.js` created (v1.0.0) — forward-looking, NOT retrofitted [decision: option A].** All eight modules embed their own `parsePitch`/`toMidi`/`diatonicStep`/`displayName`/`midiEquals`. Diffing showed they're nearly identical EXCEPT scales carries a superset (double-accidental `##`/`bb` in regex + toMidi + displayName); the other seven are byte-identical to each other (the earlier hash "divergence" for piano-quiz was just whitespace). A full retroactive extraction would mean reconciling the superset into all eight and re-proving pitch output unchanged — high effort, real regression risk (these compute actual notes/answers, wouldn't show in a parse check), and the duplication isn't *causing* pain (unlike the clef, it's not re-edited every session). So chose the lighter path: created `qn-music.js` = scales' superset (parsePitch/toMidi/displayName with ##/bb) UNION the common `midiEquals` (used by 7/8). **New modules load it and use NH.music; the eight existing modules keep their inline copies until edited for another reason.** Verified (Node): produces byte-identical parsePitch/toMidi/diatonicStep/midiEquals output to the common impl across all 231 natural+single-accidental pitches, AND correctly adds ##/bb (C##4=62, Dbb4=60, G##2=45, Abb6=91). Drop-in safe.

This positions step (2): the next modules are the first consumers of `qn-music.js`, built thin from the start.


---

## May 2026 — Scale Degrees (module #8, path-order build via clone-and-swap)

**Shipped.** Scale Degrees — name a note's function in a major key (degree number 1–7 and name tonic…leading tone), read on a real staff with a key signature. First Reading-tier net-new module since the consolidation arc; built by cloning `note-names.html` and swapping the question brain. Slug `scale-degrees`, namespace `SD`, tagline "Every note has a job in its key." Spec written first (`scale-degrees-spec.md`) and signed off before build.

### Locked design decisions
- **Major keys only (v1).** Minor-key degrees + the subtonic/leading-tone wrinkle deferred to a harder tier/follow-up — keeps the catalog finite. (Add-to-catalog rule.)
- **Tiers reuse Key Signatures' key sets:** Easy 5 (C G D F Bb), treble only, degrees biased to 1/3/5 then 2/4; Medium 9 (+A E Ab Eb), random clef, all 7 degrees; Tricky 15 (+B F# Db Gb C# Cb), random clef, all degrees. Same finite catalog as Key Sigs so weak-spot data can correlate across the two later.
- **Three question types = sub-skills:** `number` ("Which scale degree is this?" → number tiles), `name` ("What's the name of this scale degree?" → function-name tiles), `whichDegree` ("Which note is the dominant?" → pitch-name tiles, note hidden — reverse lookup). Weights: easy `{number .7, name .3}`; medium `{number .45, name .4, whichDegree .15}`; tricky `{number .3, name .4, whichDegree .3}`.
- **Degree names locked (major):** 1 tonic, 2 supertonic, 3 mediant, 4 subdominant, 5 dominant, 6 submediant, 7 leading tone.
- **Distractors:** number → adjacent degrees (off-by-one is the real confusion); name → functionally-adjacent pairs (dominant↔subdominant, mediant↔submediant); whichDegree → other diatonic notes of the *same* key (every tile is a real note in the key, so it tests function not spelling).
- **Theory accuracy:** each key's 7 degrees spelled per its signature (D maj 7 = C#, never Db; F# maj 7 = E#; Cb maj 4 = Fb). Verified all 15 keys produce a correct major scale (W-W-H-W-W-W-H) and key-correct spellings.

### New rendering assembly (first of its kind)
Scale Degrees is the first module to draw **a key-signature row + a queried note on one staff**. Both are existing shared functions (`NH.staff.buildAccidentals` for the row, the note path + `buildNoteAccidental` for the note) — extended the module's local `buildStaff` to take a `keySig:{type,count}` option, draw the row after the clef, and nudge the note right so it clears the accidentals. No net-new drawing primitives; assembly of proven parts (the payoff of the consolidation).

### qn-music.js + a load-order finding [flagged]
Spec called Scale Degrees the first `qn-music.js` consumer. **It isn't, and here's why:** the module's game-loop scripts destructure `NH.music` at PARSE time (`const { parsePitch } = NH.music`), which runs before any *deferred* external script. A deferred `qn-music.js` would be undefined at that point → throw. So Scale Degrees keeps an **inline** NH.music, but upgraded in place to the superset (## / bb), needed for F#/C# major (E#, B#). True qn-music.js consumption requires converting the inline game-loop scripts to deferred — a template-level change, deliberately deferred rather than wedged in. (Lesson logged: the qn-music.js rollout to existing modules is blocked on the same parse-time-vs-defer issue, not just regression risk.)

### Consumer wiring (clone-and-swap touch-points)
Engine `makeQuestion(diff)` returns `{type, skill, prompt, key, clef, degIdx, pitch, keySig, showNote, choices:[{label,correct}], answer}`. Rewired: startRound (no pool), nextQuestion (calls makeQuestion, sets #q-prompt, renders key-sig+note, hides note for whichDegree, plays the note or tonic anchor), renderChoices ({label,correct} tiles, word-tile detection for degree names → `.choices-wordy`, ♯/♭ styling on pitch tiles), handleChoiceTap (match by `choice.correct`, audio guarded for null note), onWrong reveal (correctIdx via findIndex(c=>c.correct), shows `answer`), pushHistory + tally (history records {type,skill,key,answer,kind}; round tally keyed by `skill` = question type). Identity swapped (title, slug, module, `scale-degrees_pb`/`scale-degrees_settings`, #q-prompt added+cached). Start screen reduced to 2 filters (clef block hidden w/ `#clef-block[hidden]` guard, renumbered); drill repurposed to a fresh round (questions are generated, not pooled).

### Verified
Node engine test: theory correct across all 15 keys (major-scale interval check per degree + spot-checked spellings incl. double-letter E#/Fb), and 27,000 generated questions pass invariants (exactly 1 correct tile, 4 distinct labels, answer == correct tile, easy=treble-only, keys ∈ tier set, whichDegree hides note). CSS + JS balanced, `node --check` passes. Dashboard `SKILL_LABELS` added (number/name/whichDegree).

### Deferred (not built)
- **Concept explainer cards** — note-names (the clone base) has none, so Scale Degrees has none. Gap shared with several older modules; building the explainer system is its own task, not wedged into this build.
- **qn-music.js-via-defer refactor** (above) — would let Scale Degrees and others drop their inline pitch helpers.

### Deploy set
`scale-degrees.html` (NEW) · `dashboard.html` (SKILL_LABELS) · `play.html` (Reading tile) · `index.html` (Reading tile + module count 8→9). Relies on already-deployed `qn-staff.js` v1.2.0 (buildClef/buildAccidentals/buildNoteAccidental). QA: open scale-degrees.html on a phone; play each tier — Easy treble-only number/name; Medium/Tricky show key sig + random clef; whichDegree shows key sig, no note, pitch tiles. 404 from a tile = deployed filename not exactly `scale-degrees.html`.

#### Bugfix — quit ("✕") button did nothing in Note Values + Time Signatures

**Reported:** the ✕ (quit-round) button next to Home worked in every module except Note Values and Time Signatures — pressing it did nothing.

**Root cause (confirmed in code):** these two modules use a different quit mechanism than the others (a `#modal-overlay` confirm dialog toggled by a `.show` class, rather than the `showConfirm()` helper the note-names-family uses). The overlay markup is `<div class="modal-overlay" id="modal-overlay" hidden>`, and the CSS had `.modal-overlay { display:flex }` + `.modal-overlay[hidden] { display:none }` but **no `.modal-overlay.show` rule**. The click handler added the `.show` class yet never removed the `hidden` attribute — so `[hidden]{display:none}` stayed in force and the overlay never appeared. Classic load-bearing-`hidden` trap (project-doc rule), but here the JS toggled a class the CSS didn't define instead of the attribute the CSS keyed on. Handler *was* firing; the element just stayed `display:none`.

**Fix (both modules):** (1) added `.modal-overlay.show { display:flex }` so the class overrides `[hidden]`; (2) the open handler now also sets `hidden=false`; (3) both close paths (cancel + confirm-quit) now restore `hidden=true` alongside removing `.show`, keeping the attribute and class in sync. Quit flow verified end-to-end: ✕ opens the confirm modal → "Keep playing" / "Quit round" → quit calls `showScreen('start')`. Both files CSS+JS balanced, `node --check` passes.

**Note for future modules:** the two quit mechanisms (`showConfirm()` vs `.show`-toggled `#modal-overlay`) are a known inconsistency. When a module is next edited, prefer the `showConfirm()` helper for consistency, or ensure any `hidden`-attribute element toggled by a class has a class rule that beats `[hidden]`.

---

