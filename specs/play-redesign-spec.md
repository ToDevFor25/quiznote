# play.html redesign — collapsible level sections

## Why
- Roster is going from 15 live → 27 target. The current flat 3-section page is fine at 11 but starts feeling busy at 15 and will be cluttered at 27.
- Each new module touches `play.html` (four-surface rule). Restructuring now means the next 12 module builds drop tiles into clean, scannable sections instead of piling onto a layout that has to be rebuilt later.
- BUILD_LOG already has this queued. Doing it before Phase 1 #2 (Dotted Notes & Ties) saves rework on every subsequent module.

## What stays the same
- Three tier sections: **Foundations / Reading / Theory**.
- Tier names, colors (sun-dk / teal-dk / grape-dk), meta lines, descriptions — unchanged copy except as noted.
- All existing tile markup: `.ltile`, `.ltile-art`, animations, color backgrounds, links, the "Soon" badge, the "More to come" placeholder.
- `qn-nav.js` header, page header, footer — untouched.
- All modules always tappable. No hard locks (per CLAUDE.md).
- Mobile-first layout — same `repeat(auto-fill, minmax(190px, 1fr))` tile grid inside each section.

## What changes
1. **Each tier section becomes collapsible** via a clickable header (`<button>` for a11y, styled as the existing tier-header card). The tile-grid below collapses/expands with a slide animation.
2. **Section header gains a progress chip** showing `X/N completed`, where:
   - **Cleared** = ≥ 2 rounds completed at any tier of that module AND ≥ 85% accuracy on at least one of those rounds. Same definition `path.html` already uses for spine state. Derived in-page from `qn_events` + `<slug>_pb_<tier>` PB keys. No schema change.
   - **N** = number of live modules in that level (Soon/More-to-come tiles excluded from the denominator).
3. **Disclosure pattern, not accordion.** Multiple sections can be open at once. User-controlled.
4. **Default open state on first visit: all three sections expanded.** Matches the genre convention for browse/library UIs (Coursera, edX, Khan Academy, Notion, VSCode all default-expanded for "what's available" lists). Users want to scan options. Collapse is an affordance offered, not imposed.
5. **Last open state persists** in localStorage at `qn_play_sections_open` (one boolean per section). Bumps no schema version (additive UI-local key, same model as `<slug>_muted`).
6. **Disclosure caret** (▸ collapsed / ▾ expanded) on the section header, animated rotate on toggle.
7. **Empty-state copy** on collapsed sections shows the progress chip clearly so a learner can glance at progress without expanding.

## What this does NOT do (out of scope for this redesign)
- No per-tile cleared indicator (e.g., checkmark on cleared tiles). Tier-2 stretch — defer to its own session if wanted; it's a separate visual decision and a separate per-tile data lookup.
- No "Recommended next" highlight on play.html. The Today card on `path.html` is already the recommender's surface; play.html stays as the buffet.
- No filter / search / sort. Roster is browseable at 27 modules via the collapsible sections — no extra control needed.
- No change to the page header copy ("What do you want to practice? · Each module drills one skill. Short sessions, real progress.").

## Data source for progress chip
In-page JS, mirroring path.html:
```js
function isCleared(slug) {
  // ≥ 2 rounds completed AND best round ≥ 85% — at any tier
  const events = (QN.events.query({ profileId: QN.profile.activeId() }) || [])
                  .filter(e => e.module === slug);
  if (events.length < 2) return false;
  return events.some(e => e.total > 0 && (e.correct / e.total) >= 0.85);
}
```
Anonymous (no active profile): all chips show `0 of N`. No crash, no nag — same graceful-empty behavior as path.html.

## Visual notes
- Section header: same colors/typography as current `.tier-header`. Adds:
  - Caret glyph (Bravura ▸ / ▾ or a tiny inline SVG).
  - Progress chip — pill shape, `Nunito 12px 800`, level-tinted background (sun-lt / teal-lt / grape-lt), level-tinted-dark text. Sits in the same row as `.tier-meta`, before or after.
- Collapse animation: `grid-template-rows: 1fr → 0fr` transition (~ 240ms ease-out). Falls back gracefully when `prefers-reduced-motion`.
- Hover / focus state on the header button: subtle bg tint, full keyboard-accessible.

## A11y
- Each header is a `<button aria-expanded="…" aria-controls="…">`.
- Tile-grid wrapper has matching `id` and `aria-labelledby` pointing to the header.
- Tab order: section headers in source order, then tiles within an open section.
- `prefers-reduced-motion` disables the collapse animation (snap open/closed).

## Implementation steps
1. Move the three `.tier-section` blocks into the new structure (button header + grid wrapper).
2. Add ~50 lines of CSS for header button, chip, caret, collapse animation.
3. Add ~30 lines of JS for: read/write localStorage, default-open logic, click handler, progress-chip rendering.
4. No changes to any other file. Single-file edit.

## Done criteria
- Three sections collapse/expand on click; multiple can be open.
- Progress chips show real numbers after a round is logged; show `0 of N` when anonymous.
- Default open state: Foundations open / others closed (or advanced per heuristic). Persists across refresh.
- All existing tiles render unchanged.
- No console errors. No JS breakage in any module link.
- Mobile (320px+) and desktop both look right.
- Keyboard accessible, screen reader headers correct.

## Commit
Single commit, message: `Redesign play.html with collapsible level sections and progress chips`
