/* ==========================================================================
   qn-roundend.js — shared gamified round-end (P1 rollout spine)
   --------------------------------------------------------------------------
   The three-beat round-end (EARN → PROGRESS → NEXT STEP) + the summary-screen
   scroll affordances (fade scrim + "More ▾" cue), extracted verbatim from the
   note-names P0 proof so all modules render an identical round-end from one
   place. Pure rendering over standard summary markup + the XP core (qn-xp.js),
   profile, events, and recommender. Reads nothing at import; defer-safe.

   Load order: AFTER qn-profile.js and qn-xp.js. Degrades to a no-op if the XP
   core is absent. Every block self-skips if its anchor element is missing, so
   a module can adopt beats incrementally.

   ── Module contract ──────────────────────────────────────────────────────
   1. Link this file (defer) after qn-xp.js.
   2. Provide the standard summary markup (IDs below) inside #summary-screen,
      wrapped as `.summary-scroll` (scrolling content) + `.summary-bar` (pinned).
   3. Call QN.roundEnd.initScroll() once during init (wires scroll/cue listeners).
   4. Call QN.roundEnd.render({ module, score, total, tier, bestStreak, isDrill,
      onRetry }) at round end (wrap in try/catch per CLAUDE.md init-throw rule).

   Standard IDs (all optional — each beat self-skips if missing):
     Beat 1  #xp-earn #xp-plus #xp-level-badge #xp-bar-fill #xp-to-next #xp-streak-kept
     Beat 2  #mastery-meter #mm-label #mm-pips #mm-note
     Beat 3  #next-step-cta #nsc-reason #nsc-btn
   Scroll affordances act on: `#summary-screen .summary-scroll`, `#scroll-cue`,
   toggling `#summary-screen.scroll-end`.
   ========================================================================== */
(function () {
  'use strict';

  var QN = (window.QN = window.QN || {});
  function $(id) { return document.getElementById(id); }

  function prettySlug(slug) {
    return String(slug || '').split('-').map(function (w) {
      return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    }).join(' ');
  }

  // The ONE star formula for the whole app. Score percentage → 1–4 stars.
  // Single threshold set (1 / .8 / .5); modules must not define their own.
  // Exposed as QN.roundEnd.starsFor so any surface (dashboard, etc.) can match.
  function starsFor(pct) {
    return pct >= 1 ? 4 : pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
  }

  // ── The three-beat round-end ──────────────────────────────────────────────
  // opts: { module, score, total, tier, bestStreak, isDrill, onRetry }
  //   module     : slug, e.g. 'note-names' (scopes the medal query)
  //   score/total: this round's correct / asked
  //   tier       : 'easy' | 'medium' | 'tricky' (the difficulty just played)
  //   bestStreak : best in-round streak
  //   isDrill    : true = purely practice (no XP, practice framing)
  //   onRetry    : fn() the module runs to replay (Beat 3 low-score retry)
  function render(opts) {
    opts = opts || {};
    if (!window.QN || !QN.xp) return;

    // Wire the summary scroll affordances on first round-end (idempotent). The
    // summary screen isn't visible until endRound, so wiring here is equivalent
    // to wiring at page init — and it frees modules from needing an init hook.
    initScroll();

    var module     = opts.module;
    var score      = opts.score | 0;
    var total      = opts.total | 0;
    var tier       = opts.tier || 'easy';
    var bestStreak = opts.bestStreak | 0;
    var isDrill    = !!opts.isDrill;
    var pct        = total > 0 ? score / total : 0;

    var prof = QN.profile && QN.profile.getActive ? QN.profile.getActive() : null;
    var profileId = prof ? prof.id : null;

    // --- HERO: the round verdict (stars + score). This is the SINGLE SOURCE of
    // star calculation for the whole app — one formula, no per-module nuance:
    //   stars(pct) = pct≥1→4, ≥.8→3, ≥.5→2, else 1   (QN.roundEnd.starsFor)
    // Gated on #sum-pct, a hero-ONLY anchor: a migrated module (hero markup)
    // gets stars+score+percent from here; a not-yet-migrated module (no #sum-pct,
    // but still has a legacy #sum-stars in its old grid) is skipped entirely so
    // render() never writes uncolored spans into the old grid. As modules adopt
    // the hero, their stars become identical by construction. ---
    if ($('sum-pct')) {
      var starN = starsFor(pct);
      var starsEl = $('sum-stars');
      if (starsEl) {
        var sHtml = '';
        for (var si = 0; si < 4; si++) sHtml += '<span class="s ' + (si < starN ? 'on' : 'off') + '">★</span>';
        starsEl.innerHTML = sHtml;   // computed only, no user data
      }
      if ($('sum-score'))    $('sum-score').textContent = score;
      if ($('sum-score-of')) $('sum-score-of').textContent = ' / ' + total;
      $('sum-pct').textContent = total ? ('· ' + Math.round(pct * 100) + '%') : '';
    }

    // Event shape EXACTLY as stored by QN.events.log (no streak field — the log
    // whitelists fields and does not persist streak, so the live earn matches
    // what totalFor() recomputes). Drills earn 0 and were never logged.
    var evShape     = { correct: score, total: total, tier: tier };
    var roundXP     = isDrill ? 0 : QN.xp.roundXP(evShape);
    var totalAfter  = profileId ? QN.xp.totalFor(profileId) : roundXP;
    var after       = QN.xp.levelFor(totalAfter);

    // --- Beat 1: THE EARN (or, for a drill, honest practice framing) ---
    var earn = $('xp-earn');
    if (earn) {
      earn.hidden = false;
      if ($('xp-level-badge')) $('xp-level-badge').textContent = 'Lvl ' + after.level + ' · ' + after.name;
      if ($('xp-to-next'))     $('xp-to-next').textContent = after.toNext > 0 ? (after.toNext + ' to Lvl ' + (after.level + 1)) : 'maxed';

      var streakEl = $('xp-streak-kept');
      if (streakEl) {
        if (isDrill) {
          streakEl.hidden = false;
          streakEl.textContent = '🎯 Practice round — no XP, just sharpening up';
        } else if (total > 0 && score === total) {
          // Perfect game: surface the bonus that was actually earned (computed
          // from CONFIG so chip == engine). Replaces the old streak chip, whose
          // bonus never fired. perfectBonusPerQ × total, then difficulty mult.
          var cfg = (QN.xp && QN.xp.CONFIG) || {};
          var perfQ = cfg.perfectBonusPerQ || 3;
          var dmult = (cfg.difficultyMult && cfg.difficultyMult[tier]) || 1;
          var perfectXP = Math.round(total * perfQ * dmult);
          streakEl.hidden = false;
          streakEl.textContent = '🌟 Perfect game — +' + perfectXP + ' bonus XP!';
        } else {
          streakEl.hidden = true;
        }
      }

      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var plusEl = $('xp-plus');
      var barEl  = $('xp-bar-fill');
      if (isDrill) {
        if (plusEl) plusEl.textContent = 'Practice';
        if (plusEl && plusEl.nextElementSibling) plusEl.nextElementSibling.style.display = 'none';
        if (barEl) barEl.style.width = Math.round(after.pct * 100) + '%';
      } else if (reduce) {
        if (plusEl && plusEl.nextElementSibling) plusEl.nextElementSibling.style.display = '';
        if (plusEl) plusEl.textContent = '+' + roundXP;
        if (barEl)  barEl.style.width = Math.round(after.pct * 100) + '%';
      } else {
        if (plusEl && plusEl.nextElementSibling) plusEl.nextElementSibling.style.display = '';
        if (plusEl) {
          var t0 = null, dur = 700;
          var step = function (ts) {
            if (t0 === null) t0 = ts;
            var k = Math.min(1, (ts - t0) / dur);
            plusEl.textContent = '+' + Math.round(roundXP * k);
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
        if (barEl) {
          barEl.style.width = '0%';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { barEl.style.width = Math.round(after.pct * 100) + '%'; });
          });
        }
      }
    }

    // --- Beat 2: THE PROGRESS (mastery meter toward the medal) ---
    // Canonical clear rule (matches qn-profile.js nextTierFor + dashboard
    // computeMastery): >= 2 rounds at a tier each scoring >= 85%. Medal =
    // highest tier cleared (skipping allowed). Drills write no event, so they
    // never appear here.
    var meter = $('mastery-meter');
    if (meter) {
      var TIERS = ['easy', 'medium', 'tricky'];
      var MEDAL = { easy: '🥉 Bronze', medium: '🥈 Silver', tricky: '🥇 Gold' };
      var TIERNAME = { easy: 'Easy', medium: 'Medium', tricky: 'Tricky' };
      var good = { easy: 0, medium: 0, tricky: 0 };
      if (profileId && QN.events && QN.events.query) {
        var evs = QN.events.query(profileId, { module: module }) || [];
        for (var i = 0; i < evs.length; i++) {
          var e = evs[i];
          if (!e.total) continue;
          var et = e.tier || 'easy';
          if (good[et] != null && (e.correct / e.total) >= 0.85) good[et]++;
        }
      }
      var cleared = { easy: good.easy >= 2, medium: good.medium >= 2, tricky: good.tricky >= 2 };
      var earned = cleared.tricky ? 'tricky' : cleared.medium ? 'medium' : cleared.easy ? 'easy' : null;
      // Forward-looking: the tier just ABOVE the highest cleared one.
      var highestCleared = cleared.tricky ? 2 : cleared.medium ? 1 : cleared.easy ? 0 : -1;
      var nextTier = highestCleared >= 2 ? null : TIERS[highestCleared + 1];

      meter.hidden = false;
      // Progress toward the next medal as a fill BAR (not dots — dots read as a
      // swipe pager). innerHTML is safe — computed width only, no user data.
      var pipBar = function (filled, totalSteps) {
        var p = Math.max(0, Math.min(100, Math.round(filled / totalSteps * 100)));
        return '<i class="mm-bar-fill" style="width:' + p + '%"></i>';
      };
      if ($('mm-label')) $('mm-label').textContent = earned ? MEDAL[earned] : 'No medal yet';
      if (nextTier) {
        var have = Math.min(2, good[nextTier]);
        if ($('mm-pips')) $('mm-pips').innerHTML = pipBar(have, 2);
        var need = 2 - have;
        if ($('mm-note')) $('mm-note').textContent = need > 0
          ? need + ' more ' + TIERNAME[nextTier] + ' round' + (need === 1 ? '' : 's') + ' at 85%+ → ' + MEDAL[nextTier]
          : 'Ready for ' + MEDAL[nextTier] + '!';
      } else {
        if ($('mm-pips')) $('mm-pips').innerHTML = pipBar(2, 2);
        if ($('mm-note')) $('mm-note').textContent = 'Gold — top tier mastered! 🎉';
      }
    }

    // --- Beat 3: THE NEXT STEP (one dominant action, adapts to the score) ---
    // There's always one prime action: a good round advances (recommender's
    // "Next: <module>"); a bad round retries ("Try again"). "Play again" and
    // "Try again" are the same action, so they never both appear — on a bad
    // round Play again is hidden and the row is just Try again + Drill missed.
    var cta = $('next-step-cta');
    var againBtn = $('again-btn');
    var nsc = $('nsc-btn');
    var low = pct < 0.5;
    if (low) {
      if (againBtn) againBtn.hidden = true;                 // retry is the prime CTA
      if (nsc) { nsc.classList.remove('grape'); nsc.classList.add('sun'); }  // friendly retry colour
      if (cta) {
        cta.hidden = false;
        if ($('nsc-reason')) $('nsc-reason').textContent = "You've got this 💪";
        if (nsc) nsc.textContent = '↻ Try again';
        cta.onclick = function (ev2) {
          ev2.preventDefault();
          if (typeof opts.onRetry === 'function') opts.onRetry();
          else if (againBtn) againBtn.click();
        };
      }
    } else {
      if (againBtn) againBtn.hidden = false;                // Play again returns to the row
      if (nsc) { nsc.classList.remove('sun'); nsc.classList.add('grape'); }
      if (cta) {
        var rec = (QN.recommend && QN.recommend.next) ? QN.recommend.next(profileId) : null;
        if (rec && rec.module) {
          cta.hidden = false;
          if ($('nsc-reason')) $('nsc-reason').textContent = rec.reason || '';
          var tierLabel = rec.tier ? (' · ' + rec.tier.charAt(0).toUpperCase() + rec.tier.slice(1)) : '';
          if (nsc) nsc.textContent = 'Next: ' + prettySlug(rec.module) + tierLabel + ' →';
          cta.onclick = function (ev2) {
            ev2.preventDefault();
            var payload = { difficulty: rec.tier || 'easy', total: rec.length || 10 };
            try { localStorage.setItem(rec.module + '_settings', JSON.stringify(payload)); } catch (e3) {}
            window.location.href = rec.module + '.html';
          };
        } else {
          cta.hidden = true;
        }
      }
    }

    // Content height is now final — measure after two frames so the scroll-fade
    // scrim starts in the correct state (shown only if the summary overflows).
    requestAnimationFrame(function () { requestAnimationFrame(updateScrim); });
  }

  // ── Summary scroll affordances (honest fade scrim + cue) ──────────────────
  // The page (window) scrolls — the summary action bar is position:sticky, so
  // there's no inner scroll container. Tracking window scroll keeps the fade
  // scrim + "More" cue honest, and window.scrollBy clamps at the document
  // bounds so the cue can never over-scroll past the content.
  function updateScrim() {
    var screen = $('summary-screen');
    if (!screen) return;
    var doc = document.documentElement;
    var y = window.scrollY || window.pageYOffset || 0;
    // 4px slop absorbs sub-pixel rounding. True when nothing more is below
    // (including when the page is too short to scroll at all).
    var remaining = doc.scrollHeight - window.innerHeight - y;
    screen.classList.toggle('scroll-end', remaining <= 4);
  }

  var scrollWired = false;
  function initScroll() {
    if (scrollWired) { updateScrim(); return; }   // idempotent
    window.addEventListener('scroll', updateScrim, { passive: true });
    window.addEventListener('resize', updateScrim);
    var cue = $('scroll-cue');
    if (cue) {
      cue.addEventListener('click', function () {
        // ~60% of a viewport, smooth; the browser clamps at the page bottom.
        window.scrollBy({ top: Math.round(window.innerHeight * 0.6), behavior: 'smooth' });
      });
    }
    scrollWired = true;
  }

  // ── Start-screen scroll affordances (twin of the summary bar) ─────────────
  // Unlike the summary screen (window scroll, sticky bar), the start screen
  // scrolls inside an inner .start-scroll container with .start-bar as a
  // non-scrolling flex sibling. So this twin tracks the container's own scroll
  // metrics. Fully self-contained: it wires listeners once, and a
  // MutationObserver re-resets + re-measures every time #start-screen
  // re-activates — so modules need NO per-file JS (auto-init below).
  function updateStartScrim() {
    var screen = $('start-screen');
    if (!screen) return;
    // Window scroll (the page scrolls; .start-bar is position:sticky), mirroring
    // the summary scrim. True when nothing more is below.
    var y = window.scrollY || window.pageYOffset || 0;
    var remaining = document.documentElement.scrollHeight - window.innerHeight - y;
    screen.classList.toggle('scroll-end', remaining <= 4);
  }

  function resetStartScroll() {
    // The window is reset to top by showScreen(); just re-measure after layout.
    requestAnimationFrame(function () { requestAnimationFrame(updateStartScrim); });
  }

  // Entrance: replay the cascaded pop-in on the config blocks. Remove + reflow +
  // re-add so it restarts every time the start screen (re)appears (CSS keyframes
  // + reduced-motion guard live in qn-theme.css).
  function playPopIn() {
    var wrap = document.querySelector('#start-screen .start-wrap');
    if (!wrap) return;
    wrap.classList.remove('pop-in');
    void wrap.offsetWidth;   // force reflow so the animation restarts
    wrap.classList.add('pop-in');
  }

  var startWired = false;
  function initStartScroll() {
    var screen = $('start-screen');
    if (!screen || !document.querySelector('#start-screen .start-scroll')) { return; }  // not converted — no-op
    if (startWired) { resetStartScroll(); return; }   // idempotent
    window.addEventListener('scroll', updateStartScrim, { passive: true });
    window.addEventListener('resize', updateStartScrim);
    var cue = $('start-scroll-cue');
    if (cue) {
      cue.addEventListener('click', function () {
        // ~60% of a viewport, smooth; the browser clamps at the page bottom.
        window.scrollBy({ top: Math.round(window.innerHeight * 0.6), behavior: 'smooth' });
      });
    }
    // Tap bounce on the start-screen tiles + Start button. Fire on POINTERDOWN
    // (the press) so it's visible even though tapping Start navigates away on
    // release. remove→reflow→re-add restarts it; cleared on animationend.
    screen.addEventListener('pointerdown', function (ev) {
      var el = ev.target && ev.target.closest && ev.target.closest('.tile, #start-btn');
      if (!el) return;
      el.classList.remove('tap-bounce');
      void el.offsetWidth;          // reflow → restart the animation
      el.classList.add('tap-bounce');
    }, { passive: true });
    screen.addEventListener('animationend', function (ev) {
      if (ev.animationName === 'tapBounce' && ev.target.classList) ev.target.classList.remove('tap-bounce');
    }, true);
    // Re-reset + re-measure ONLY on a real inactive→active transition (e.g. the
    // user returns from a round). Must track prior state: updateStartScrim()
    // toggles the `scroll-end` class on #start-screen, which is also a class
    // mutation — reacting to that would reset scrollTop mid-scroll (snap-to-top
    // feedback loop). So we ignore changes where `active` didn't actually flip.
    try {
      var wasActive = screen.classList.contains('active');
      var mo = new MutationObserver(function () {
        var isActive = screen.classList.contains('active');
        if (isActive && !wasActive) { resetStartScroll(); playPopIn(); }
        wasActive = isActive;
      });
      mo.observe(screen, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
    startWired = true;
    resetStartScroll();
    playPopIn();   // entrance on first load (start screen is the default active)
  }

  // Auto-init on DOM ready (mirrors how render() wires the summary scrim — no
  // per-module call needed). No-ops cleanly on pages without the .start-scroll.
  function autoInitStart() { initStartScroll(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitStart);
  } else {
    autoInitStart();
  }

  QN.roundEnd = {
    render:          render,
    initScroll:      initScroll,
    updateScrim:     updateScrim,
    initStartScroll: initStartScroll,
    updateStartScrim: updateStartScrim,
    prettySlug:      prettySlug,
    starsFor:        starsFor,
    version:         '1.6.0'
  };
})();
