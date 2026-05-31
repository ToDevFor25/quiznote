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

    // --- HERO: the round verdict (stars + score), owned here so every module
    // renders an identical verdict. Stars derive from pct (1/.8/.5 buckets,
    // the common scale); score is this round's raw count + percent. The module
    // markup just provides the anchors (#sum-stars hero, #sum-score, #sum-score-of,
    // #sum-pct); a module with no hero markup self-skips each line. ---
    var starN = pct >= 1 ? 4 : pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
    var starsEl = $('sum-stars');
    if (starsEl) {
      var sHtml = '';
      for (var si = 0; si < 4; si++) sHtml += '<span class="s ' + (si < starN ? 'on' : 'off') + '">★</span>';
      starsEl.innerHTML = sHtml;   // computed only, no user data
    }
    if ($('sum-score'))    $('sum-score').textContent = score;
    if ($('sum-score-of')) $('sum-score-of').textContent = ' / ' + total;
    if ($('sum-pct'))      $('sum-pct').textContent = total ? ('· ' + Math.round(pct * 100) + '%') : '';

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
        } else {
          // Streak now surfaces ONLY when it earned the XP bonus — otherwise the
          // standalone "best streak" was redundant with the hero. Threshold +
          // amount come from qn-xp CONFIG (single source of truth; 5/15 default).
          var cfg = (QN.xp && QN.xp.CONFIG) || {};
          var streakMin = cfg.inRoundStreak || 5;
          var streakBonus = cfg.streakBonus || 15;
          if (bestStreak >= streakMin) {
            streakEl.hidden = false;
            streakEl.textContent = '🔥 ' + bestStreak + '-streak — +' + streakBonus + ' bonus XP!';
          } else {
            streakEl.hidden = true;
          }
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

  QN.roundEnd = {
    render:      render,
    initScroll:  initScroll,
    updateScrim: updateScrim,
    prettySlug:  prettySlug,
    version:     '1.1.0'
  };
})();
