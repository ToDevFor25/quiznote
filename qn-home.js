/* qn-home.js — QuizNote Studio shared home components (v0.1.0)
 *
 * Studio P0: the persistent STATUS MASTHEAD. Reads the (already-live) XP engine
 * and the local event log to render identity — Level ring, rank, XP-to-next,
 * streak, and weekly goal — on the hub pages (studio.html), so
 * progression is visible BETWEEN rounds (it was previously only shown inside a
 * round's Beat 1 and vanished on close).
 *
 * Pure read-only over QN.xp / QN.profile / QN.events. No schema, no writes.
 * Load order: AFTER qn-profile.js and qn-xp.js, BEFORE/with qn-nav.js.
 *
 * Streak + week-day math mirror the (now-retired) dashboard's computeStreak/computeWeekDays
 * EXACTLY (Sunday-based week; streak counts consecutive days ending today, or
 * yesterday if today is not yet practiced) so the masthead and the dashboard
 * always agree on the same data. (P0 verification gate #2.)
 *
 * API:
 *   QN.home.mountStatus({ slot })  — render the masthead into slot (default
 *                                    '#qn-status-slot'); no-op if no slot/profile.
 *   QN.home.refreshStatus()        — re-read + re-render (after navigation, etc.)
 *   QN.home.streakFor(profileId)   — { current, longest } (mirrors dashboard)
 *   QN.home.weekDaysFor(profileId) — count of distinct days practiced this week
 */
(function () {
  'use strict';
  window.QN = window.QN || {};

  // ── date helpers (byte-for-byte the dashboard's dateKey) ──────────────────
  function dateKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function eventsFor(profileId) {
    try {
      if (window.QN && QN.events && QN.events.query && profileId) {
        return QN.events.query(profileId) || [];
      }
    } catch (e) {}
    return [];
  }

  // Mirror of the retired dashboard's computeStreak — current streak ending today (or
  // yesterday if today has no rounds yet), plus longest run.
  function streakFromEvents(events) {
    var days = {};
    events.forEach(function (ev) { var k = dateKey(ev.completedAt); days[k] = (days[k] || 0) + 1; });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var current = 0, d = new Date(today);
    if (!days[dateKey(d.getTime())]) d.setDate(d.getDate() - 1);
    while (days[dateKey(d.getTime())]) { current++; d.setDate(d.getDate() - 1); }
    var sorted = Object.keys(days).sort();
    var longest = 0, run = 0, prev = null;
    sorted.forEach(function (dk) {
      if (prev) {
        var diff = Math.round((new Date(dk) - new Date(prev)) / 86400000);
        run = (diff === 1) ? run + 1 : 1;
      } else { run = 1; }
      if (run > longest) longest = run;
      prev = dk;
    });
    return { current: current, longest: longest };
  }

  // Mirror of the retired dashboard's computeWeekDays — distinct days practiced in the
  // current Sunday-started week.
  function weekDayCountFromEvents(events) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var sunday = new Date(today); sunday.setDate(sunday.getDate() - today.getDay());
    var days = [false, false, false, false, false, false, false];
    events.forEach(function (ev) {
      var d = new Date(ev.completedAt); d.setHours(0, 0, 0, 0);
      var diff = Math.round((d - sunday) / 86400000);
      if (diff >= 0 && diff < 7) days[diff] = true;
    });
    return days.filter(Boolean).length;
  }

  function streakFor(profileId)   { return streakFromEvents(eventsFor(profileId)); }
  function weekDaysFor(profileId) { return weekDayCountFromEvents(eventsFor(profileId)); }

  // ── self-injected styles ───────────────────────────────────────────────
  // The hub pages (path/dashboard) do NOT link qn-theme.css and have colliding
  // class names, so this component carries its own CSS. Tokens have concrete
  // fallbacks in case a host page doesn't define them. Injected once.
  var STYLE_ID = 'qn-home-styles';
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.qn-status{display:flex;align-items:center;gap:16px;background:var(--white,#fff);' +
        'border:2.5px solid var(--ink,#2A2A3E);border-radius:18px;box-shadow:0 4px 0 var(--shadow-cool,#d8d6cc);' +
        'padding:14px 18px;margin:0 0 18px;}' +
      '.qn-status-ring{position:relative;flex:0 0 auto;width:60px;height:60px;}' +
      '.qn-status-ring svg{width:60px;height:60px;transform:rotate(-90deg);}' +
      '.qn-ring-track{fill:none;stroke:var(--teal-lt,#d3f1ec);stroke-width:6;}' +
      '.qn-ring-fill{fill:none;stroke:var(--teal,#1FB8A8);stroke-width:6;stroke-linecap:round;}' +
      '.qn-ring-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        "font-family:'Fredoka',sans-serif;font-weight:700;font-size:22px;color:var(--ink,#2A2A3E);font-variant-numeric:tabular-nums;}" +
      '.qn-status-id{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1 1 auto;}' +
      ".qn-status-rank{font-family:'Fredoka',sans-serif;font-weight:700;font-size:19px;color:var(--ink,#2A2A3E);letter-spacing:-.01em;line-height:1.1;}" +
      '.qn-status-xpbar{display:block;height:7px;border-radius:99px;background:var(--teal-lt,#d3f1ec);overflow:hidden;max-width:280px;}' +
      '.qn-xpbar-fill{display:block;height:100%;width:0;background:var(--teal,#1FB8A8);border-radius:99px;transition:width 800ms cubic-bezier(.4,0,.2,1);}' +
      ".qn-status-xptext{font-family:'Nunito',sans-serif;font-weight:700;font-size:13px;color:var(--ink-soft,#5a5a6e);}" +
      ".qn-status-meta{font-family:'Nunito',sans-serif;font-weight:700;font-size:13px;color:var(--ink-faint,#8a8472);}" +
      // quiet "?" help door → rewards.html. A help glyph, not a CTA: muted, small,
      // pinned to the far edge so it never competes with the level/rank or Play.
      '.qn-status-help{flex:0 0 auto;align-self:flex-start;width:22px;height:22px;border-radius:50%;' +
        'border:1.5px solid var(--shadow-cool,#d8d6cc);background:transparent;color:var(--ink-faint,#8a8472);' +
        "font-family:'Fredoka',sans-serif;font-weight:700;font-size:13px;line-height:1;text-decoration:none;" +
        'display:inline-flex;align-items:center;justify-content:center;transition:background 120ms,color 120ms,border-color 120ms;}' +
      '.qn-status-help:hover,.qn-status-help:active{background:var(--teal-lt,#d3f1ec);color:var(--teal-dk,#0e8475);border-color:var(--teal,#1FB8A8);}' +
      '@media(max-width:560px){.qn-status{gap:12px;padding:12px 14px;border-radius:16px;}' +
        '.qn-status-ring,.qn-status-ring svg{width:52px;height:52px;}.qn-ring-num{font-size:19px;}.qn-status-rank{font-size:17px;}}' +
      '@media(prefers-reduced-motion:reduce){.qn-ring-fill,.qn-xpbar-fill{transition:none!important;}}';
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }

  // ── the masthead ──────────────────────────────────────────────────────────
  var R = 26, CIRC = 2 * Math.PI * R;   // ring geometry (60×60 viewBox)

  function buildMarkup() {
    return '' +
      '<div class="qn-status" role="img">' +
        '<div class="qn-status-ring">' +
          '<svg viewBox="0 0 60 60" aria-hidden="true">' +
            '<circle class="qn-ring-track" cx="30" cy="30" r="' + R + '"></circle>' +
            '<circle class="qn-ring-fill" id="qn-ring-fill" cx="30" cy="30" r="' + R + '" ' +
              'stroke-dasharray="' + CIRC.toFixed(2) + '" stroke-dashoffset="' + CIRC.toFixed(2) + '"></circle>' +
          '</svg>' +
          '<span class="qn-ring-num" id="qn-ring-num">1</span>' +
        '</div>' +
        '<div class="qn-status-id">' +
          '<span class="qn-status-rank" id="qn-status-rank">Beginner</span>' +
          '<span class="qn-status-xpbar"><span class="qn-xpbar-fill" id="qn-xpbar-fill"></span></span>' +
          '<span class="qn-status-xptext" id="qn-status-xptext"></span>' +
          '<span class="qn-status-meta" id="qn-status-meta"></span>' +
        '</div>' +
        '<a class="qn-status-help" href="rewards.html" aria-label="How progress works" title="How progress works">?</a>' +
      '</div>';
  }

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function render(host) {
    var prof = (window.QN && QN.profile && QN.profile.getActive) ? QN.profile.getActive() : null;
    if (!prof || !prof.id || !window.QN || !QN.xp) { host.innerHTML = ''; host.style.display = 'none'; return; }

    injectStyles();
    host.style.display = '';
    if (!host.firstElementChild || !host.querySelector('.qn-status')) {
      host.innerHTML = buildMarkup();
    }

    var s = QN.xp.summaryFor(prof.id);   // { totalXP, level, name, pct, toNext, ... }
    var numEl  = host.querySelector('#qn-ring-num');
    var rankEl = host.querySelector('#qn-status-rank');
    var fillEl = host.querySelector('#qn-ring-fill');
    var barEl  = host.querySelector('#qn-xpbar-fill');
    var xpEl   = host.querySelector('#qn-status-xptext');
    var metaEl = host.querySelector('#qn-status-meta');

    if (numEl)  numEl.textContent  = s.level;
    if (rankEl) rankEl.textContent = s.name;

    if (xpEl) {
      if (s.toNext > 0) {
        var nextName = QN.xp.nameForLevel(s.level + 1);
        xpEl.textContent = s.toNext + ' XP to ' + (nextName !== s.name ? nextName : 'Lvl ' + (s.level + 1));
      } else {
        xpEl.textContent = 'Max level — ' + s.totalXP.toLocaleString() + ' XP';
      }
    }

    // Streak + weekly goal intentionally NOT shown here — they live in the
    // Studio glance row just below, so repeating them on the masthead is
    // redundant. The masthead stays focused on level/rank/XP. (Studio QA, 2026.)
    if (metaEl) metaEl.textContent = '';

    // ring + xp bar fill (animate unless reduced-motion / first paint)
    var target = Math.max(0, Math.min(1, s.pct));
    var offset = CIRC * (1 - target);
    if (fillEl) {
      if (reduceMotion()) {
        fillEl.style.transition = 'none';
        fillEl.style.strokeDashoffset = offset.toFixed(2);
      } else {
        fillEl.style.strokeDashoffset = CIRC.toFixed(2);  // start empty
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            fillEl.style.transition = 'stroke-dashoffset 800ms cubic-bezier(.4,0,.2,1)';
            fillEl.style.strokeDashoffset = offset.toFixed(2);
          });
        });
      }
    }
    if (barEl) {
      if (reduceMotion()) { barEl.style.transition = 'none'; barEl.style.width = Math.round(target * 100) + '%'; }
      else { barEl.style.width = '0%'; requestAnimationFrame(function () { requestAnimationFrame(function () { barEl.style.width = Math.round(target * 100) + '%'; }); }); }
    }

    // accessible label
    var status = host.querySelector('.qn-status');
    if (status) status.setAttribute('aria-label',
      'Level ' + s.level + ', ' + s.name + (s.toNext > 0 ? (', ' + s.toNext + ' XP to next level') : ', max level'));
  }

  function mountStatus(opts) {
    opts = opts || {};
    var host = document.querySelector(opts.slot || '#qn-status-slot');
    if (!host) return;
    render(host);
  }
  function refreshStatus() { mountStatus(); }

  QN.home = {
    mountStatus:  mountStatus,
    refreshStatus: refreshStatus,
    streakFor:    streakFor,
    weekDaysFor:  weekDaysFor,
    version:      '0.1.0'
  };

  // Self-init: render on DOM ready if a slot exists (zero per-page JS, mirrors
  // qn-roundend.js). Also re-render when the tab regains focus (XP may have
  // changed in another tab / after a round on the same surface).
  function boot() { if (document.querySelector('#qn-status-slot')) mountStatus(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('pageshow', function (e) { if (e.persisted) refreshStatus(); });
})();
