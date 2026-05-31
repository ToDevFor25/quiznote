/* qn-badges.js — QuizNote achievement engine (v0.1.0)
 *
 * Studio P4. Badges are PURE PREDICATES over the local event log (qn_events) +
 * the XP engine — no new stored state, no backend. Each badge is earned the
 * moment its predicate is true over the player's history; "earned" is therefore
 * always recomputable and can never desync. (When cloud arrives, the same
 * predicates run server-side.)
 *
 * Load order: after qn-profile.js + qn-xp.js. Read-only.
 *
 * API:
 *   QN.badges.LIST                      -> the catalogue (ordered, for the wall)
 *   QN.badges.evaluate(profileId)       -> { earned:Set<id>, count, total,
 *                                            next: badge|null, byId:{id:bool} }
 *   QN.badges.get(id)                   -> badge def
 */
(function () {
  'use strict';
  window.QN = window.QN || {};

  // Tier lookup so "practice a Theory module" style badges work without the
  // caller passing a roster. Mirrors the Studio/dashboard ROSTER tiers.
  var TIER = {};
  (function () {
    var R = {
      foundations: ['note-names','piano-quiz','piano-keyboard','ledger-lines','note-values','dotted-notes','ear-rhythm','time-signatures','accidentals','tempo-markings','dynamics','articulation','score-navigation','ornaments'],
      reading: ['key-signatures','circle-of-fifths','scales','chromatic-scale','scale-degrees','scale-modes','intervals','ear-intervals','ear-scales','transposition'],
      theory: ['triads','triad-inversions','seventh-chords','primary-chords','roman-numerals','chord-function','chord-progressions','cadences','ear-chords','ear-cadences','ear-progressions']
    };
    Object.keys(R).forEach(function (t) { R[t].forEach(function (s) { TIER[s] = t; }); });
  })();

  function dateKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Derived stats computed once per evaluate() and handed to every predicate,
  // so each badge is a cheap boolean rather than its own pass over the log.
  function deriveStats(events, profileId) {
    var s = {
      rounds: events.length,
      perfectRounds: 0,
      cleanRounds: 0,
      modules: {},          // slug -> rounds
      tiersPracticed: {},   // foundations/reading/theory -> rounds
      maxStreak: 0,
      bestStreak: 0,
      totalXP: (window.QN && QN.xp && QN.xp.totalFor) ? QN.xp.totalFor(profileId) : 0,
      level: 1,
      days: {}
    };
    events.forEach(function (ev) {
      if (ev.total > 0 && ev.correct === ev.total) s.perfectRounds++;
      if (ev.total > 0 && ev.correct / ev.total >= 0.85) s.cleanRounds++;
      s.modules[ev.module] = (s.modules[ev.module] || 0) + 1;
      var t = TIER[ev.module];
      if (t) s.tiersPracticed[t] = (s.tiersPracticed[t] || 0) + 1;
      s.days[dateKey(ev.completedAt)] = true;
    });
    s.distinctModules = Object.keys(s.modules).length;
    // current streak (consecutive days ending today/yesterday) — same algorithm
    // used by qn-home / dashboard.
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var d = new Date(today), cur = 0;
    if (!s.days[dateKey(d.getTime())]) d.setDate(d.getDate() - 1);
    while (s.days[dateKey(d.getTime())]) { cur++; d.setDate(d.getDate() - 1); }
    s.curStreak = cur;
    if (window.QN && QN.xp && QN.xp.levelFor) s.level = QN.xp.levelFor(s.totalXP).level;
    return s;
  }

  // Catalogue — ordered for the wall (earned ones float up at render time).
  // icon is an emoji; predicate(stats) -> bool.
  var LIST = [
    { id: 'first-round',  icon: '🎵', name: 'First Note',       desc: 'Play your first round',           pred: function (s) { return s.rounds >= 1; } },
    { id: 'perfect-1',    icon: '🌟', name: 'Flawless',          desc: 'Score a perfect round',           pred: function (s) { return s.perfectRounds >= 1; } },
    { id: 'streak-3',     icon: '🔥', name: 'On a Roll',         desc: 'Reach a 3-day streak',            pred: function (s) { return s.curStreak >= 3; } },
    { id: 'streak-7',     icon: '⚡', name: 'Week Warrior',      desc: 'Reach a 7-day streak',            pred: function (s) { return s.curStreak >= 7; } },
    { id: 'rounds-10',    icon: '🎯', name: 'Getting Serious',   desc: 'Play 10 rounds',                  pred: function (s) { return s.rounds >= 10; } },
    { id: 'rounds-50',    icon: '🏅', name: 'Dedicated',         desc: 'Play 50 rounds',                  pred: function (s) { return s.rounds >= 50; } },
    { id: 'perfect-10',   icon: '💎', name: 'Perfectionist',     desc: 'Score 10 perfect rounds',         pred: function (s) { return s.perfectRounds >= 10; } },
    { id: 'explorer-5',   icon: '🧭', name: 'Explorer',          desc: 'Try 5 different modules',         pred: function (s) { return s.distinctModules >= 5; } },
    { id: 'explorer-15',  icon: '🗺️', name: 'Cartographer',      desc: 'Try 15 different modules',        pred: function (s) { return s.distinctModules >= 15; } },
    { id: 'reading-tier', icon: '📖', name: 'Reader',            desc: 'Practice a Reading module',       pred: function (s) { return (s.tiersPracticed.reading || 0) >= 1; } },
    { id: 'theory-tier',  icon: '🎼', name: 'Theorist',          desc: 'Practice a Theory module',        pred: function (s) { return (s.tiersPracticed.theory || 0) >= 1; } },
    { id: 'level-5',      icon: '🎓', name: 'Apprentice',        desc: 'Reach Level 5',                   pred: function (s) { return s.level >= 5; } },
    { id: 'level-10',     icon: '👑', name: 'Player',            desc: 'Reach Level 10',                  pred: function (s) { return s.level >= 10; } },
    { id: 'level-20',     icon: '🏆', name: 'Musician',          desc: 'Reach Level 20',                  pred: function (s) { return s.level >= 20; } }
  ];

  var byId = {};
  LIST.forEach(function (b) { byId[b.id] = b; });

  function evaluate(profileId) {
    var events = [];
    try {
      if (window.QN && QN.events && QN.events.query && profileId) events = QN.events.query(profileId) || [];
    } catch (e) {}
    var stats = deriveStats(events, profileId);
    var earned = {}, count = 0, next = null;
    LIST.forEach(function (b) {
      var got = false;
      try { got = !!b.pred(stats); } catch (e) { got = false; }
      earned[b.id] = got;
      if (got) count++;
      else if (!next) next = b;   // first unearned, in catalogue order = "next up"
    });
    return { byId: earned, count: count, total: LIST.length, next: next, stats: stats };
  }

  QN.badges = {
    LIST: LIST,
    get: function (id) { return byId[id] || null; },
    evaluate: evaluate,
    version: '0.1.0'
  };
})();
