/* ==========================================================================
   qn-xp.js — QuizNote progression spine (XP + Learner Levels)
   --------------------------------------------------------------------------
   Pure logic, no DOM. Exposes window.QN.xp. Source of truth for XP is the
   existing qn_events log (QN.events) — XP is DERIVED by replaying each round
   through roundXP(), so there is NO new stored field and NO migration. Past
   play is rewarded retroactively. See specs/gamification-overhaul-spec.md §2.

   Load order: after qn-profile.js (needs QN.events / QN.profile / QN.recommend),
   like the other shared files. Defer-safe; reads nothing at import time.

   Tunables (XP formula + level curve) are Tier 2 per CLAUDE.md — change the
   CONFIG block below, nothing else, to retune. v1 defaults documented in spec.
   ========================================================================== */
(function () {
  'use strict';

  var QN = (window.QN = window.QN || {});

  // ── CONFIG (Tier 2 — tunable) ────────────────────────────────────────────
  var CONFIG = {
    xpPerCorrect:     10,    // base XP per correct answer
    cleanRoundPct:    0.85,  // accuracy at/above this earns the clean-round bonus
    cleanRoundBonus:  25,
    inRoundStreak:    5,     // best-in-round streak at/above this earns streak bonus
    streakBonus:      15,
    difficultyMult:   { easy: 1.0, medium: 1.25, tricky: 1.5 },
    // Cumulative XP required to REACH each level (index = level-1). Beyond the
    // table, each further level costs `tailStep` more than the last gap.
    levelThresholds:  [0, 50, 120, 220, 360, 540, 770, 1060, 1420, 1860, 2390],
    tailStep:         700,
    // Friendly tier names by level band. [minLevel, name].
    nameBands: [
      [1,  'Beginner'],
      [5,  'Apprentice'],
      [10, 'Player'],
      [20, 'Musician'],
      [35, 'Virtuoso']
    ]
  };

  // ── XP for a single round ────────────────────────────────────────────────
  // Accepts a round/event-shaped object: { correct, total, tier, streak }.
  // `streak` is the best in-round streak (qn_events stores this as `streak`).
  // Defensive against missing fields so it can replay historical events.
  function roundXP(ev) {
    if (!ev) return 0;
    var correct = Math.max(0, ev.correct || 0);
    var total   = Math.max(0, ev.total || 0);
    var tier    = ev.tier || 'easy';

    var baseXP = correct * CONFIG.xpPerCorrect;

    var pct = total > 0 ? correct / total : 0;
    var accuracyBonus = pct >= CONFIG.cleanRoundPct ? CONFIG.cleanRoundBonus : 0;

    var bestStreak = ev.streak || 0;
    var streakBonus = bestStreak >= CONFIG.inRoundStreak ? CONFIG.streakBonus : 0;

    var mult = CONFIG.difficultyMult[tier];
    if (typeof mult !== 'number') mult = 1.0;

    return Math.round((baseXP + accuracyBonus + streakBonus) * mult);
  }

  // ── Total XP for a profile (replay all events) ───────────────────────────
  function totalFor(profileId) {
    if (!QN.events || typeof QN.events.query !== 'function') return 0;
    var events;
    try { events = QN.events.query(profileId) || []; } catch (e) { events = []; }
    var sum = 0;
    for (var i = 0; i < events.length; i++) sum += roundXP(events[i]);
    return sum;
  }

  // ── Level math ───────────────────────────────────────────────────────────
  // Returns the cumulative XP threshold required to REACH `level` (1-based),
  // extrapolating past the table with a constant tail step.
  function thresholdForLevel(level) {
    var t = CONFIG.levelThresholds;
    if (level <= t.length) return t[level - 1];
    var last = t[t.length - 1];
    var extra = level - t.length;
    return last + extra * CONFIG.tailStep;
  }

  function nameForLevel(level) {
    var name = CONFIG.nameBands[0][1];
    for (var i = 0; i < CONFIG.nameBands.length; i++) {
      if (level >= CONFIG.nameBands[i][0]) name = CONFIG.nameBands[i][1];
    }
    return name;
  }

  // levelFor(totalXP) → { level, name, intoLevel, levelSpan, toNext, pct }
  //   intoLevel : XP earned since the current level began
  //   levelSpan : XP between current level start and next level
  //   toNext    : XP remaining to next level
  //   pct       : 0..1 progress through the current level (for the ring)
  function levelFor(totalXP) {
    totalXP = Math.max(0, totalXP || 0);
    var level = 1;
    // climb while we've met the NEXT level's threshold
    while (totalXP >= thresholdForLevel(level + 1)) level++;

    var start = thresholdForLevel(level);
    var next  = thresholdForLevel(level + 1);
    var span  = Math.max(1, next - start);
    var into  = totalXP - start;
    var pct   = Math.max(0, Math.min(1, into / span));

    return {
      level:     level,
      name:      nameForLevel(level),
      intoLevel: into,
      levelSpan: span,
      toNext:    Math.max(0, next - totalXP),
      pct:       pct
    };
  }

  // Given XP before/after a round, did we cross one or more level boundaries?
  // → { leveled:Boolean, from:level, to:level } for the level-up interstitial.
  function levelDelta(xpBefore, xpAfter) {
    var a = levelFor(xpBefore).level;
    var b = levelFor(xpAfter).level;
    return { leveled: b > a, from: a, to: b };
  }

  // ── One-call summary for the status bar + round-end Beat 1 ────────────────
  // { totalXP, level, name, pct, intoLevel, levelSpan, toNext }
  function summaryFor(profileId) {
    var total = totalFor(profileId);
    var lv = levelFor(total);
    return {
      totalXP:   total,
      level:     lv.level,
      name:      lv.name,
      pct:       lv.pct,
      intoLevel: lv.intoLevel,
      levelSpan: lv.levelSpan,
      toNext:    lv.toNext
    };
  }

  QN.xp = {
    CONFIG:          CONFIG,
    roundXP:         roundXP,
    totalFor:        totalFor,
    levelFor:        levelFor,
    levelDelta:      levelDelta,
    summaryFor:      summaryFor,
    thresholdForLevel: thresholdForLevel,
    nameForLevel:    nameForLevel,
    version:         '1.0.0'
  };
})();
