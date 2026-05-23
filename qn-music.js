/* ============================================================
   qn-music.js — shared music-theory primitives (window.NH.music)

   Pitch parsing, MIDI conversion, and note-name display for QuizNote.

   This is the SUPERSET implementation: parsePitch/toMidi/displayName all
   handle double accidentals (## and bb) in addition to single # / b /
   natural. It is a strict, backward-compatible extension of the per-module
   copies that the eight existing modules still embed — any pitch string the
   old single-accidental version accepted parses identically here; this just
   ALSO accepts ## / bb.

   ROLLOUT POLICY (decided May 2026, "option A"): NEW modules load this file
   and use NH.music instead of embedding their own copy. The eight existing
   modules keep their inline copies untouched until one is edited for another
   reason — at which point it can drop its copy and adopt this. This captures
   the benefit (thin new modules) without a high-risk retroactive rewrite of
   eight working files that compute actual pitch/answers.

   Verified (Node) to produce byte-identical parsePitch/toMidi/diatonicStep/
   midiEquals output to the existing common modules across the full natural +
   single-accidental pitch range, and to additionally handle ## / bb.

   Coordinate/convention:
     - MIDI: middle C (C4) = 60. octave is scientific pitch notation.
     - accidental is the raw token from the pitch string: '', '#', 'b',
       '##', or 'bb'.

   Authored: May 2026. Superset lifted from scales.html; midiEquals from the
   common modules (note-names et al.).
   ============================================================ */

(function () {
  'use strict';

  const NH = window.NH = window.NH || {};

  // Diatonic letter → scale-step index within an octave (C=0 … B=6).
  const LETTER_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  // Inverse, for stepping by diatonic position.
  const STEP_LETTER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  // Diatonic letter → semitone offset from C within an octave.
  const LETTER_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  // Absolute diatonic step (ignores accidentals): used for vertical staff
  // placement, where C# and C sit on the same line.
  function diatonicStep(letter, octave) {
    return octave * 7 + LETTER_STEP[letter];
  }

  // Pitch → MIDI number. Handles single and double accidentals.
  function toMidi(letter, accidental, octave) {
    let acc = 0;
    if (accidental === '#') acc = 1;
    else if (accidental === 'b') acc = -1;
    else if (accidental === '##') acc = 2;
    else if (accidental === 'bb') acc = -2;
    return 12 * (octave + 1) + LETTER_SEMI[letter] + acc;
  }

  // Parse a scientific-pitch string like "C4", "F#3", "Bb5", "G##2", "Abb6".
  function parsePitch(s) {
    const m = /^([A-G])(##|bb|[#b]?)(-?\d+)$/.exec(s);
    if (!m) throw new Error('bad pitch ' + s);
    const letter = m[1], accidental = m[2], octave = parseInt(m[3], 10);
    return { letter, accidental, octave, midi: toMidi(letter, accidental, octave), name: s };
  }

  // Equal-temperament frequency for a MIDI number (A4 = 440 Hz).
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Human-readable note name with a real accidental glyph (no octave).
  function displayName(pitch) {
    let acc = '';
    if (pitch.accidental === '#') acc = '♯';
    else if (pitch.accidental === 'b') acc = '♭';
    else if (pitch.accidental === '##') acc = '𝄪';
    else if (pitch.accidental === 'bb') acc = '𝄫';
    return pitch.letter + acc;
  }

  // Enharmonic-agnostic pitch equality (compare by sounding MIDI number).
  function midiEquals(a, b) { return a === b; }

  NH.music = {
    LETTER_STEP, STEP_LETTER, LETTER_SEMI,
    diatonicStep, toMidi, parsePitch, midiToFreq, displayName, midiEquals,
  };
  NH.music.version = '1.0.0';
})();
