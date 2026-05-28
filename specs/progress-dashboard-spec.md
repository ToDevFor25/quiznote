# Feature Spec — Progress Dashboard Upgrade

**Type:** Single-page redesign of `dashboard.html`. No new files, no
shared file changes, no module changes.
**ROI rank:** Highest remaining pre-monetization priority. The teaching
hints layer closed the "no teaching" gap. This closes the "no visible
progress" gap. Together they convert QuizNote from a practice tool
into a learning system with receipts.
**Build cost:** Medium. One session. Pure UI on existing data — `qn_events`
already has every round's module, tier, score, duration, timestamp, and
sub-skill breakdown. No schema changes needed.

---

## What exists today

`dashboard.html` currently shows:
- Three summary stats (accuracy %, rounds played, total time)
- An accuracy trend SVG line chart (per-round, oldest→newest)
- Per-module cards sorted by most-played, each with accuracy %, rounds,
  best score, accuracy bar, and weakest-first sub-skill breakdown

It's functional but flat. No streaks, no mastery visualization, no
sense of journey. A student who went from 40% to 90% on Key Signatures
sees the same card as someone who scored 90% once.

---

## What it becomes

### 1. Hero stat row (the screenshot row)

Three large stats at the top — the numbers a parent screenshots and
sends to the teacher.

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  🔥 14   │  │  ⏱ 4h    │  │  ★ 12    │
│  Day     │  │  Total    │  │  Modules │
│  streak  │  │  practice │  │  mastered│
└──────────┘  └──────────┘  └──────────┘
```

- **Streak:** consecutive calendar days with at least 1 completed round.
  Computed from `qn_events` timestamps. The streak is the habit metric —
  low bar, high emotional value. Display: current streak + longest
  streak ever (small subtitle).
- **Practice time:** total `durationMs` across all events, formatted as
  hours and minutes. The proof of investment.
- **Modules mastered:** count of modules at Gold tier (see mastery
  definition below). The progress metric — "12 of 32" tells the student
  how far they've come and how much room there is.

### 2. Streak calendar (the consistency view)

A 7-column × N-row grid showing the last 4-8 weeks of practice.
Each cell = one day. Color intensity = practice volume that day
(0 rounds = gray, 1-2 = light teal, 3-5 = medium teal, 6+ = dark
teal). Similar to GitHub's contribution graph but simpler.

Sits directly below the hero stats. Gives an at-a-glance view of
consistency — "I practiced 5 of the last 7 days" is immediately
visible without counting.

Day labels (M T W T F S S) across the top. No month labels needed
for a 4-8 week window. Today is always the rightmost cell in the
bottom row.

### 3. Mastery grid (the journey view)

All 32 modules displayed as cards in a grid (2 columns mobile,
3-4 columns desktop). Each card shows:

```
┌─────────────────────────┐
│  ◐ Note Names           │
│  ████████░░  Silver     │
│  Easy ✓  Medium ✓       │
│  Tricky: 72%            │
└─────────────────────────┘
```

- **Progress ring or bar** showing mastery level
- **Mastery tier label:** Bronze / Silver / Gold (or Untouched)
- **Per-difficulty status:** which tiers are cleared, current accuracy
  on the highest attempted tier

**Mastery tiers (progressive, locked):**

| Tier | Requirement | Visual |
|------|-------------|--------|
| Untouched | No rounds played | Gray card, empty ring |
| Started | At least 1 round, not yet cleared Easy | Faint teal outline |
| Bronze | Easy cleared (85%+ accuracy, 2+ rounds) | Bronze ring/badge |
| Silver | Medium cleared (85%+, 2+ rounds) | Silver ring/badge |
| Gold | Tricky mastered (85%+, 2+ rounds) | Gold ring/badge, shimmer |

"Cleared" uses the same rule as the recommender's advance logic
(≥85% accuracy across ≥2 rounds at that tier). This is already
computed — `qn_events` has `tier` and `correct/total` per round.

**Sort order:** Modules follow the roster order (Foundations →
Reading → Theory), not most-played. The grid IS the curriculum map.
Tier section headers (Foundations / Reading / Theory) divide the grid,
matching `play.html`.

### 4. Accuracy trend (upgraded)

Keep the existing hand-drawn SVG line chart but improve it:
- **Per-week aggregation** instead of per-round (smoother, more
  meaningful for students with 50+ rounds)
- **Color-coded by module** or a single aggregate line (Tier 2 call
  for the builder — aggregate is simpler and probably cleaner)
- **"This week vs last week"** comparison label: "+8% this week" or
  "Steady at 87%"

If per-round is kept for users with few rounds, switch to per-week
automatically after 20+ rounds.

### 5. Weak spots card (the recommender surface)

The recommender already computes weak spots. Surface the top 2-3 as
a card:

```
┌─────────────────────────────────────┐
│  📌 Focus areas                     │
│                                     │
│  Key Signatures         62%  →      │
│  Intervals (quality)    71%  →      │
│  Time Signatures (top)  75%  →      │
│                                     │
│  These are your trickiest spots.    │
│  The path is already drilling them. │
└─────────────────────────────────────┘
```

Each row links to the module (arrow → opens the module). The copy
reassures: the recommender is already handling this, you don't need
to manually hunt for weak spots.

Only shows when there are genuine weak spots (< 80% accuracy with
sufficient sample size). If the student is strong everywhere, show
a congratulatory message instead.

---

## Layout (mobile-first)

Stacks vertically on mobile, single column:

1. Hero stat row (3 stats, flex-wrap on narrow screens)
2. Streak calendar
3. Weak spots card (if applicable)
4. Mastery grid (2 columns)
5. Accuracy trend chart

On desktop (≥760px), the hero stats and streak calendar sit in a
wider top section. The mastery grid goes to 3-4 columns. The weak
spots card and trend chart sit side by side below the grid.

---

## Data computation (all from existing qn_events)

### Streak calculation

```
1. Get all events for the active profile, sorted by completedAt
2. Extract unique calendar dates (local timezone)
3. Count consecutive days backward from today
4. Also track longest-ever streak (max consecutive run in the set)
```

Edge case: if the student hasn't played today, show yesterday's
streak count but don't break it until tomorrow. "You haven't
practiced today yet" nudge, not "streak broken."

### Mastery calculation

```
For each module, for each tier (easy/medium/tricky):
  - Filter events matching module + tier
  - Count rounds with ≥85% accuracy
  - If ≥2 such rounds exist → tier is "cleared"

Mastery level = highest cleared tier:
  - Tricky cleared → Gold
  - Medium cleared → Silver
  - Easy cleared → Bronze
  - Any rounds but no tier cleared → Started
  - No rounds → Untouched
```

### Weekly aggregation for trend

```
Group events by ISO week (Monday start)
Per week: sum correct / sum total → weekly accuracy %
Plot the last 8-12 weeks
```

---

## Autonomy guide

### Tier 1 — decide and build

- Visual design within the QuizNote design system (colors, spacing,
  card styles, ring/bar choice for mastery)
- Streak calendar cell colors and thresholds
- Mastery badge visual treatment (ring vs bar vs icon)
- Sort order within tier sections
- Chart styling (line weight, colors, grid lines)
- "This week vs last week" comparison label formatting
- Empty states ("No rounds yet," "Play your first round to start
  tracking progress")
- Animation choices (ring fill, stat count-up)
- Whether to keep per-round trend for < 20 rounds vs always weekly
- Responsive breakpoints

### Tier 2 — decide, note reasoning, proceed

- Whether the trend chart is aggregate or per-module colored
- Whether the weak spots card links directly to modules or just labels
- How many weeks the streak calendar shows (4 vs 8)
- Whether "Started" is a visible tier or just "not Bronze yet"
- Whether Gold modules get a special shimmer/glow animation

### Tier 3 — stop and ask

- Adding any new fields to qn_events or qn_profiles
- Changes to qn-profile.js
- Changes to any module file
- Adding a new nav tab (the "Progress" tab promotion)
- Any data that would need privacy policy updates

---

## Files touched

- `dashboard.html` — full redesign (same file, same URL)
- No other files modified

## Files NOT touched

- No module files
- No shared JS files (qn-profile.js, qn-audio.js, etc.)
- No qn-theme.css (dashboard styles are inline, same as today)
- No index.html, play.html, path.html

---

## What this is NOT

- **Not a new page.** Same URL, same file, much better content.
- **Not a backend feature.** All computation runs client-side over
  localStorage data. When cloud sync ships, the same computations
  run over the synced dataset — no architectural change.
- **Not the "Progress" nav tab.** That's a follow-up task (promoting
  dashboard.html into the nav as a peer of path.html and play.html).
  This spec covers the page content, not the navigation change.
- **Not the share button.** The share/print feature is a follow-up
  that depends on what data the dashboard shows. Build the dashboard
  first, then spec the share button based on what's there.

---

## Success criteria

1. A parent can screenshot the hero stats and streak calendar and know
   their child is making progress without reading anything else
2. A student can see at a glance which modules they've mastered and
   which need work
3. The streak motivates daily practice (the "don't break the chain"
   effect)
4. The weak spots card makes the recommender's intelligence visible
   without requiring the student to act on it manually
5. The page loads fast on mobile with 500+ events in localStorage
