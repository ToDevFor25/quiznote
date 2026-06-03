/* qn-debug.js — QuizNote QA / debug panel (dev-only, June 2026)
 *
 * A hidden test harness for manufacturing app state on demand — so we can QA
 * the gamification surfaces (splash flavors, streaks, levels, quests, badges,
 * the guest/new/returning home states, once-a-day gates) WITHOUT hand-clearing
 * data, playing many rounds, or waiting days.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SAFETY / ACTIVATION — this is dead code in production unless explicitly opened:
 *   • Loads on a page but does NOTHING until activated.
 *   • Activates ONLY when the URL has `?debug` (or `?debug=1`), OR a prior
 *     `?debug` set the sticky `qn_debug_on` flag (so it survives navigation
 *     during a test session). `?debug=off` clears it.
 *   • Refuses to activate on a production host by default (see PROD_HOSTS) unless
 *     `?debug=force`. So a stray `?debug` on quiznote.online still shows nothing.
 *   • Reads/writes the SAME localStorage the app already uses (qn_profiles /
 *     qn_events / qn_activeProfile). No schema, no backend. Seeded data behaves
 *     exactly like real data because it goes through QN.profile / QN.events.
 *
 * It pairs with the runtime QA flags in qn-cloud.js §1b (QN.flags.qa.*).
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';
  window.QN = window.QN || {};

  var STICKY = 'qn_debug_on';
  // Hosts where the panel must NOT auto-open (production). Dev preview / localhost
  // are fine. quiznote.online is the real site.
  var PROD_HOSTS = ['quiznote.online', 'www.quiznote.online'];

  function param(name) {
    var m = new RegExp('[?&]' + name + '(?:=([^&]*))?').exec(location.search);
    return m ? (m[1] === undefined ? '' : decodeURIComponent(m[1])) : null;
  }

  function shouldActivate() {
    var d = param('debug');
    var host = location.hostname || '';
    var isProd = PROD_HOSTS.indexOf(host) !== -1;
    try {
      if (d === 'off') { localStorage.removeItem(STICKY); return false; }
      if (d === 'force') { localStorage.setItem(STICKY, '1'); return true; }   // override prod guard
      if (isProd) return false;                       // never auto-open on prod
      if (d !== null) { localStorage.setItem(STICKY, '1'); return true; }      // ?debug present
      return localStorage.getItem(STICKY) === '1';     // sticky within a session
    } catch (e) { return d !== null && !isProd; }
  }

  // ── storage helpers (raw, plus the real APIs where they exist) ────────────
  function getJSON(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch (e) { return fallback; } }
  function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function dateKey(ts) { var d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function activeProfile() {
    return (window.QN && QN.profile && QN.profile.getActive) ? QN.profile.getActive() : null;
  }

  // ── ACTIONS ───────────────────────────────────────────────────────────────

  // Force a clean "Guest" — no active profile (keeps the profiles list intact so
  // you can restore). Reloads to the current page.
  function forceGuest() {
    try { localStorage.removeItem('qn_activeProfile'); } catch (e) {}
    clearGates(); clearQAFlags();   // show this state's NATURAL splash, not a stuck forced flavor
    reload();
  }

  // ── ONE dedicated test profile, written DIRECTLY to storage. The panel is a
  //    test tool, so it bypasses QN.profile.create() entirely — create() enforces
  //    the 5-profile household cap and returns null once full, which made the
  //    state buttons silently no-op after a few clicks. We reuse a single
  //    'p_qadebug' profile (upsert, never spawn new ones) so the cap is never hit
  //    and the buttons are idempotent.
  var QA_PID = 'p_qadebug';
  function ensureTestProfile() {
    var profiles = getJSON('qn_profiles', []);
    var existing = null;
    for (var i = 0; i < profiles.length; i++) { if (profiles[i].id === QA_PID) { existing = profiles[i]; break; } }
    if (!existing) {
      existing = {
        id: QA_PID, accountId: 'a_qadebug', nickname: 'Tester',
        level: null, defaultDifficulty: 'medium', hintsEnabled: true,
        practiceGoal: 5, streakStyle: 'calendar', color: 'teal',
        createdAt: Date.now(), lastActiveAt: Date.now(), syncedAt: null
      };
      profiles.push(existing);
      setJSON('qn_profiles', profiles);
    }
    try { localStorage.setItem('qn_activeProfile', QA_PID); } catch (e) {}
    return existing;
  }

  // New / blank: the test profile active, ZERO events, gates cleared.
  function forceNewUser() {
    ensureTestProfile();
    wipeEventsFor(QA_PID);
    clearGates(); clearQAFlags();   // natural NEW splash (0 rounds), no stuck force flag
    reload();
  }

  // Returning: the test profile active + a populated event history (fresh — we
  // wipe first so repeated clicks don't pile up endlessly).
  function forceReturning(opts) {
    opts = opts || {};
    ensureTestProfile();
    wipeEventsFor(QA_PID);
    seedRounds(QA_PID, opts.rounds || 16, opts.modules || ['note-names', 'intervals', 'triads', 'key-signatures']);
    if (opts.streak) seedStreak(QA_PID, opts.streak);
    clearGates(); clearQAFlags();   // natural RETURNING splash, no stuck force flag
    reload();
  }

  // Seed `n` rounds for a profile via the REAL event store, spread over the last
  // few days, varied scores, with skill tags so weak-spots populate.
  function seedRounds(profileId, n, modules) {
    var tiers = ['easy', 'medium', 'tricky'];
    var now = Date.now();
    for (var i = 0; i < n; i++) {
      var mod = modules[i % modules.length];
      var tier = tiers[i % 3];
      var total = 10;
      var correct = 6 + (i % 5);            // 6..10 → mix of clean + weak
      var daysAgo = Math.floor(i / 3);       // a few per day, back a few days
      var ev = {
        profileId: profileId, module: mod, tier: tier, length: total,
        correct: correct, total: total, durationMs: 60000 + (i % 4) * 15000,
        timedMode: false, completedAt: now - daysAgo * 86400000,
        skills: tagFor(mod, correct, total)
      };
      pushEvent(ev);
    }
  }
  function tagFor(mod, c, t) {
    // a single plausible sub-skill tag so Focus areas can surface
    var key = (mod === 'note-names' || mod === 'piano-quiz') ? 'treble'
            : (mod === 'intervals') ? 'M3' : (mod === 'key-signatures') ? 'C' : 'general';
    return (function () { var o = {}; o[key] = { c: c, t: t }; return o; })();
  }

  // Write directly to qn_events (bypasses QN.events.log's drill/active guards so
  // we can seed for any profile + back-date completedAt). Same shape the app reads.
  function pushEvent(ev) {
    var arr = getJSON('qn_events', []);
    arr.push(ev);
    setJSON('qn_events', arr);
  }

  // Back-date one round per day for the last `days` days so a streak of that
  // length reads as current.
  function seedStreak(profileId, days) {
    var now = Date.now();
    for (var d = 0; d < days; d++) {
      pushEvent({ profileId: profileId, module: 'note-names', tier: 'easy', length: 10, correct: 10, total: 10, durationMs: 60000, timedMode: false, completedAt: now - d * 86400000, skills: { treble: { c: 10, t: 10 } } });
    }
  }

  function wipeEventsFor(profileId) {
    var arr = getJSON('qn_events', []);
    setJSON('qn_events', arr.filter(function (e) { return e.profileId !== profileId; }));
  }

  // Clear all the "once per day / dismissed" gates so the splash, recap, and tips
  // reappear for testing.
  var GATE_KEYS = ['qn_studio_splash_day', 'qn_studio_recap_day', 'qn_studio_medal_note_dismissed', 'qn_studio_journey_tip_dismissed', 'qn_play_hint_done', 'qn_play_hint_seen', 'qn_play_hint_force'];
  function clearGates() { GATE_KEYS.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }

  // QA force-flags (the splash-flavor toggles). These are STICKY by design so a
  // forced flavor survives reload — but switching user-state must clear them, or a
  // flavor you forced earlier sticks across every state ("launching on all
  // flavors"). The state buttons call this so each state shows its NATURAL splash.
  var QA_FLAG_KEYS = ['qn_qa_force_splash', 'qn_qa_splash_new', 'qn_qa_splash_guest', 'qn_qa_hide_splash'];
  function clearQAFlags() { QA_FLAG_KEYS.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }

  // Snapshot / restore real progress (also doubles as a manual backup).
  var SNAP_KEY = 'qn_debug_snapshot';
  function snapshot() {
    var snap = { at: Date.now(), profiles: localStorage.getItem('qn_profiles'), active: localStorage.getItem('qn_activeProfile'), events: localStorage.getItem('qn_events') };
    setJSON(SNAP_KEY, snap);
    toast('Snapshot saved');
  }
  function restore() {
    var snap = getJSON(SNAP_KEY, null);
    if (!snap) { toast('No snapshot'); return; }
    try {
      if (snap.profiles != null) localStorage.setItem('qn_profiles', snap.profiles); else localStorage.removeItem('qn_profiles');
      if (snap.active != null) localStorage.setItem('qn_activeProfile', snap.active); else localStorage.removeItem('qn_activeProfile');
      if (snap.events != null) localStorage.setItem('qn_events', snap.events); else localStorage.removeItem('qn_events');
    } catch (e) {}
    reload();
  }

  function reload() { location.reload(); }

  // ── QA flag toggles (mirror QN.flags.qa.* into localStorage so they persist
  //    and the app can read them) ──
  function flag(name) {
    try { return localStorage.getItem('qn_qa_' + name) === '1'; } catch (e) { return false; }
  }
  function setFlag(name, on) { try { on ? localStorage.setItem('qn_qa_' + name, '1') : localStorage.removeItem('qn_qa_' + name); } catch (e) {} }

  // ── PANEL UI ────────────────────────────────────────────────────────────────
  function toast(msg) {
    var t = document.getElementById('qn-debug-toast');
    if (!t) { t = document.createElement('div'); t.id = 'qn-debug-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.style.cssText = 'position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:1000000;background:#2A2A3E;color:#fff;font:600 13px/1.2 system-ui;padding:9px 16px;border-radius:10px;opacity:1;transition:opacity .3s;';
    setTimeout(function () { t.style.opacity = '0'; }, 1400);
  }

  function row(label, fn, color) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'display:block;width:100%;text-align:left;margin:3px 0;padding:8px 10px;border:none;border-radius:8px;font:600 12.5px/1.2 system-ui;cursor:pointer;background:' + (color || '#3a3a52') + ';color:#fff;';
    b.addEventListener('click', fn);
    return b;
  }
  function heading(txt) {
    var h = document.createElement('div');
    h.textContent = txt;
    h.style.cssText = 'font:700 10px/1.4 system-ui;letter-spacing:.08em;text-transform:uppercase;color:#9a9ab0;margin:12px 0 4px;';
    return h;
  }
  function flagToggle(name, label) {
    var b = row((flag(name) ? '☑ ' : '☐ ') + label, function () { setFlag(name, !flag(name)); b.textContent = (flag(name) ? '☑ ' : '☐ ') + label; toast(label + (flag(name) ? ' ON' : ' OFF')); }, '#2f2f46');
    return b;
  }

  function buildPanel() {
    var panel = document.createElement('div');
    panel.id = 'qn-debug-panel';
    panel.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:248px;max-width:80vw;z-index:999999;background:#1e1e2e;color:#fff;overflow-y:auto;padding:14px 12px 40px;box-shadow:-4px 0 20px rgba(0,0,0,.4);font-family:system-ui,sans-serif;transform:translateX(100%);transition:transform .25s;';

    var title = document.createElement('div');
    title.innerHTML = '🛠 <b>QA panel</b>';
    title.style.cssText = 'font:700 15px/1.2 system-ui;margin-bottom:2px;';
    panel.appendChild(title);
    var sub = document.createElement('div');
    sub.textContent = 'dev-only · ?debug=off to disable';
    sub.style.cssText = 'font:600 10px/1.3 system-ui;color:#9a9ab0;margin-bottom:6px;';
    panel.appendChild(sub);

    panel.appendChild(heading('User state'));
    panel.appendChild(row('👤 Guest (no profile)', forceGuest, '#0e8475'));
    panel.appendChild(row('🌱 New user (blank cards)', forceNewUser, '#5B3FE4'));
    panel.appendChild(row('🏅 Returning (16 rounds + 7-day streak)', function () { forceReturning({ rounds: 16, streak: 7 }); }, '#c98800'));

    panel.appendChild(heading('Seed data (current profile)'));
    panel.appendChild(row('+ 5 rounds', function () { var p = activeProfile(); if (!p) { toast('No active profile'); return; } seedRounds(p.id, 5, ['note-names', 'intervals', 'triads']); reload(); }));
    panel.appendChild(row('+ 7-day streak', function () { var p = activeProfile(); if (!p) { toast('No active profile'); return; } seedStreak(p.id, 7); reload(); }));
    panel.appendChild(row('Wipe this profile\'s rounds', function () { var p = activeProfile(); if (!p) { toast('No active profile'); return; } wipeEventsFor(p.id); reload(); }, '#7a3030'));

    panel.appendChild(heading('Gates / once-a-day'));
    panel.appendChild(row('↺ Reset splash + recap + tips', function () { clearGates(); toast('Gates cleared — reload'); }));
    panel.appendChild(row('↻ Reload', reload));

    panel.appendChild(heading('Feature flags (QA)'));
    panel.appendChild(flagToggle('force_splash', 'Always show splash'));
    panel.appendChild(flagToggle('splash_new', 'Force NEW-user splash'));
    panel.appendChild(flagToggle('splash_guest', 'Force GUEST splash'));
    panel.appendChild(flagToggle('hide_splash', 'Disable splash'));
    panel.appendChild(row('✖ Clear all QA flags', function () { clearQAFlags(); toast('QA flags cleared — reload'); }, '#7a3030'));

    panel.appendChild(heading('Backup'));
    panel.appendChild(row('💾 Snapshot my real data', snapshot, '#2f6f4a'));
    panel.appendChild(row('♻ Restore snapshot', restore, '#2f4a6f'));

    document.body.appendChild(panel);

    // toggle tab
    var tab = document.createElement('button');
    tab.id = 'qn-debug-tab';
    tab.textContent = '🛠';
    tab.title = 'QA panel';
    tab.style.cssText = 'position:fixed;top:50%;right:0;transform:translateY(-50%);z-index:1000000;width:34px;height:46px;border:none;border-radius:10px 0 0 10px;background:#1e1e2e;color:#fff;font-size:18px;cursor:pointer;box-shadow:-2px 0 8px rgba(0,0,0,.3);';
    var open = false;
    function setOpen(o) { open = o; panel.style.transform = o ? 'translateX(0)' : 'translateX(100%)'; }
    tab.addEventListener('click', function () { setOpen(!open); });
    document.body.appendChild(tab);
  }

  function boot() { if (!shouldActivate()) return; if (document.getElementById('qn-debug-panel')) return; buildPanel(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Public, so the app can read QA flags (e.g. studio splash logic):
  QN.debug = { flag: flag, version: '0.1.0' };
})();
