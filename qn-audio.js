/* ============================================================
   QuizNote — Shared Audio Engine
   ============================================================

   Purpose:
     Single source for the Web Audio synthesis engine used by
     every QuizNote module. Loaded once per module via
       <script src="qn-audio.js" defer></script>
     after qn-profile.js.

   Exposes:
     window.NH.audio = {
       ensureCtx, setMuted, isMuted,
       playMidi, playBoop, playTick, playChime, playFanfare,
       midiToFreq
     }

   Module-specific audio (e.g. playSequence in Scales,
   playInterval in Intervals, playReveal in Key Signatures)
   stays in those modules. Those functions reach into the
   shared context via NH.audio.ensureCtx().

   Forward-compatibility notes:
     - This file is the Tier-1 (synthesized) audio engine
       described in the project doc.
     - The Tier-2 (sampled piano) upgrade will extend the
       same NH.audio API — additive, non-breaking. Module
       call sites stay the same; the engine swaps under them.

   Authored: May 2026. No external dependencies.
   ============================================================ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────

  var ctx = null;
  var masterGain = null;
  var muted = false;
  var MASTER_VOL = 0.6;

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Lazily create the shared AudioContext + master gain node.
   * Resumes the context if it's suspended (browser autoplay rules
   * require this to happen on a user gesture).
   *
   * If the browser blocks resume, surface a small UI nudge by
   * showing the #audio-nudge element if the module rendered one.
   * This matches the pattern the existing modules already use.
   */
  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null; // Audio API unavailable
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : MASTER_VOL;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().then(function () {
        var n = document.getElementById('audio-nudge');
        if (n) n.classList.remove('show');
      }).catch(function () {
        var n = document.getElementById('audio-nudge');
        if (n) n.classList.add('show');
      });
    }
    return ctx;
  }

  function setMuted(val) {
    muted = !!val;
    if (masterGain) masterGain.gain.value = muted ? 0 : MASTER_VOL;
  }

  function isMuted() {
    return muted;
  }

  /**
   * Return the shared master gain node. Module-specific audio
   * functions (e.g. Key Signatures' playReveal, Scales' playSequence,
   * Intervals' playInterval) should route their output through this
   * node rather than ac.destination, so the master volume and mute
   * apply uniformly across the module.
   */
  function getMasterGain() {
    ensureCtx();
    return masterGain;
  }

  // ─────────────────────────────────────────────────────────────
  // PRIMITIVES — single notes and tones
  // ─────────────────────────────────────────────────────────────

  /**
   * Play a single pitched note (MIDI number) with a piano-ish
   * timbre: triangle fundamental, three sine overtones, brief
   * square-wave attack click, lowpass-filtered.
   *
   * @param {number} midi  MIDI note number
   * @param {number} [dur] Duration in seconds (default 0.9)
   */
  function playMidi(midi, dur) {
    if (dur === undefined) dur = 0.9;
    var ac = ensureCtx();
    if (!ac || muted) return;
    var now = ac.currentTime;
    var f = midiToFreq(midi);

    var env = ac.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    env.connect(masterGain);

    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(8000, f * 8);
    lp.Q.value = 0.6;
    lp.connect(env);

    var partials = [
      { type: 'triangle', mult: 1, gain: 0.55, detune: 0 },
      { type: 'sine',     mult: 2, gain: 0.18, detune: 4 },
      { type: 'sine',     mult: 3, gain: 0.07, detune: -3 },
      { type: 'sine',     mult: 4, gain: 0.03, detune: 0 }
    ];
    var stopAt = now + dur + 0.05;
    partials.forEach(function (p) {
      var osc = ac.createOscillator();
      osc.type = p.type;
      osc.frequency.value = f * p.mult;
      osc.detune.value = p.detune;
      var g = ac.createGain();
      g.gain.value = p.gain;
      osc.connect(g); g.connect(lp);
      osc.start(now);
      osc.stop(stopAt);
    });

    // Brief square-wave click on attack — adds piano-like presence
    var click = ac.createOscillator();
    click.type = 'square';
    click.frequency.value = f * 2;
    var cg = ac.createGain();
    cg.gain.setValueAtTime(0.0001, now);
    cg.gain.exponentialRampToValueAtTime(0.18, now + 0.004);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    click.connect(cg); cg.connect(masterGain);
    click.start(now);
    click.stop(now + 0.06);
  }

  /**
   * Soft downward sine sweep, used for wrong answers and gentle
   * dismissive UI feedback.
   */
  function playBoop() {
    var ac = ensureCtx();
    if (!ac || muted) return;
    var now = ac.currentTime;
    var osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.22);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(g); g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Short, high square-wave tick. Used for timer countdowns and
   * tactile UI feedback.
   */
  function playTick() {
    var ac = ensureCtx();
    if (!ac || muted) return;
    var now = ac.currentTime;
    var osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1400;
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(g); g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // ─────────────────────────────────────────────────────────────
  // STREAK CHIME — ascending arpeggio for correct-answer feedback
  // ─────────────────────────────────────────────────────────────

  /**
   * Play an ascending major-scale chime starting from `midi`.
   * Length scales with streak (longer streak, more notes, higher
   * climb). Used after correct answers in most modules.
   *
   * @param {number} midi    Base MIDI note (chime starts an octave above)
   * @param {number} streak  Current streak length; clamped to scale length
   */
  function playChime(midi, streak) {
    var ac = ensureCtx();
    if (!ac || muted) return;
    var now = ac.currentTime;
    var SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
    var len = Math.max(3, Math.min(streak || 1, SCALE.length));
    var baseMidi = midi + 12;
    while (baseMidi + SCALE[len - 1] > 100) baseMidi -= 12;
    var baseF = midiToFreq(baseMidi);
    var step = len <= 4 ? 0.06 : (len <= 7 ? 0.07 : 0.08);
    SCALE.slice(0, len).forEach(function (semi, i) {
      var f = baseF * Math.pow(2, semi / 12);
      var osc = ac.createOscillator();
      var g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      var start = now + i * step;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(g); g.connect(masterGain);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // FANFARE — end-of-round celebration, scored by tier
  // ─────────────────────────────────────────────────────────────

  /**
   * Play a celebration fanfare keyed to the round-end tier.
   *
   * Tiers:
   *   'perfect'  — ascending C-major run, ends on a stacked chord
   *   'great'    — shorter ascending run, no final chord
   *   'good'     — gentle two-note interval
   *   anything else (incl. 'practice') — single soft E note
   *
   * @param {string} tier  'perfect' | 'great' | 'good' | 'practice'
   */
  function playFanfare(tier) {
    var ac = ensureCtx();
    if (!ac || muted) return;
    var now = ac.currentTime;

    if (tier === 'perfect') {
      var melody = [60, 64, 67, 72, 76, 79, 84];
      melody.forEach(function (midi, i) {
        var f = midiToFreq(midi);
        var t = now + i * 0.09;
        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        osc.connect(g); g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.6);
      });
      var chordT = now + melody.length * 0.09 + 0.05;
      [60, 64, 67, 72].forEach(function (midi) {
        var f = midiToFreq(midi);
        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, chordT);
        g.gain.exponentialRampToValueAtTime(0.18, chordT + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, chordT + 1.1);
        osc.connect(g); g.connect(masterGain);
        osc.start(chordT);
        osc.stop(chordT + 1.2);
      });

    } else if (tier === 'great') {
      [60, 64, 67, 72, 76].forEach(function (midi, i) {
        var f = midiToFreq(midi);
        var t = now + i * 0.09;
        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(g); g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.5);
      });

    } else if (tier === 'good') {
      [60, 67].forEach(function (midi, i) {
        var f = midiToFreq(midi);
        var t = now + i * 0.14;
        var osc = ac.createOscillator();
        var g = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        osc.connect(g); g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.75);
      });

    } else {
      // 'practice' or fallback — single gentle E
      var f = midiToFreq(64);
      var osc = ac.createOscillator();
      var g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.14, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc.connect(g); g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.0);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EXPOSE GLOBAL NAMESPACE
  // ─────────────────────────────────────────────────────────────

  window.NH = window.NH || {};
  window.NH.audio = {
    ensureCtx:    ensureCtx,
    setMuted:     setMuted,
    isMuted:      isMuted,
    getMasterGain: getMasterGain,
    playMidi:     playMidi,
    playBoop:     playBoop,
    playTick:     playTick,
    playChime:    playChime,
    playFanfare:  playFanfare,
    midiToFreq:   midiToFreq
  };
  window.NH.audio.version = '1.0.0';

})();
