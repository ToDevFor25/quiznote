/* ============================================================
   QuizNote — Shared Staff Renderer
   ============================================================

   Purpose:
     Single source for SVG staff rendering across all QuizNote
     modules that show notation (Key Signatures, Time Signatures,
     Scales, Intervals, future Triads/Cadences/etc).

     Renders staff lines, clefs, accidentals (key signatures),
     and time signatures with calibrated positioning. Uses
     Bravura SMuFL glyphs for engraving-quality output.

   Loaded via:
     <script src="qn-staff.js" defer></script>

   Exposes:
     window.NH.staff = {
       SMUFL, OFFSET,
       getAccidentalSteps,
       buildStaffLines,
       buildClef,
       buildAccidentals,
       buildTimeSignature,
       buildStaff,
     }

   Coordinate system convention:
     - All builders work in SVG units where one staff space = `lineGap`.
     - `bottomY` is the y-coordinate of the bottom staff line.
     - `step 0` = bottom line. Each step is a half-staff-space.
       So step 1 = the space immediately above the bottom line,
       step 2 = the second line from the bottom, etc.
     - `xOffset` allows multiple staff segments side-by-side.

   Calibration:
     OFFSET values were tuned during a Samsung Android device sweep
     for Key Signatures. Bravura glyphs render with their visual
     center offset from the SVG y-anchor, so each glyph type needs
     a per-glyph downward shift. DO NOT change these without
     re-testing on real devices.

   Authored: May 2026. Extracted from key-signatures-8-2.html.
   ============================================================ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // SMuFL codepoints (Bravura Text font)
  // ─────────────────────────────────────────────────────────────

  const SMUFL = {
    gClef:    '\uE050',   // treble clef
    fClef:    '\uE062',   // bass clef
    sharp:    '\uE262',
    flat:     '\uE260',
    natural:  '\uE261',
    // Time-signature digits — Bravura has dedicated glyphs that visually
    // sit centered on a staff line. Use digit(n) helper to get the right one.
    tsDigit: (n) => String.fromCharCode(0xE080 + n),
  };

  // ─────────────────────────────────────────────────────────────
  // OFFSET calibration constants
  // Locked from Samsung Android device sweep. Each value is in
  // units of lineGap (staff spaces). Bravura glyphs render their
  // visual content ABOVE the SVG text y-anchor, so we shift each
  // glyph DOWN by these calibrated amounts.
  // ─────────────────────────────────────────────────────────────

  const OFFSET = {
    trebleClef:     0.975,  // from G4 line (step 2) — calibrated May 2026
    bassClef:       2.375,  // from F3 line (step 6)
    trebleClefSize: 4.2,    // font-size in lineGap units (treble runs slightly larger)
    bassClefSize:   4,      // font-size in lineGap units
    sharp:          1.625,  // from target line
    flat:           1.625,
    natural:        1.625,
    tsDigit:        1.5,    // time-signature digit visual center vs y-anchor
  };

  // ─────────────────────────────────────────────────────────────
  // Accidental positions for key signatures
  // step 0 = bottom staff line. Half-step increments going up.
  // Sharps and flats appear in canonical order:
  //   Sharps: F# C# G# D# A# E# B#
  //   Flats:  Bb Eb Ab Db Gb Cb Fb
  // ─────────────────────────────────────────────────────────────

  const SHARP_STEPS_TREBLE = [8, 5, 9, 6, 3, 7, 4];
  const FLAT_STEPS_TREBLE  = [4, 7, 3, 6, 2, 5, 8];
  const SHARP_STEPS_BASS   = [6, 3, 7, 4, 1, 5, 2];
  const FLAT_STEPS_BASS    = [2, 5, 1, 4, 0, 3, -1];

  function getAccidentalSteps(clef, type, count) {
    let arr;
    if (clef === 'treble') {
      arr = (type === 'sharp') ? SHARP_STEPS_TREBLE : FLAT_STEPS_TREBLE;
    } else {
      arr = (type === 'sharp') ? SHARP_STEPS_BASS : FLAT_STEPS_BASS;
    }
    return arr.slice(0, count);
  }

  // ─────────────────────────────────────────────────────────────
  // Atomic builders
  //
  // Each returns an SVG string fragment. The caller wraps these
  // fragments in an <svg> element with appropriate viewBox.
  // ─────────────────────────────────────────────────────────────

  /**
   * Five staff lines.
   * @param {object} opts
   * @param {number} opts.bottomY - y of bottom line
   * @param {number} opts.lineGap - distance between adjacent lines
   * @param {number} opts.width   - overall staff width
   * @param {number} [opts.xOffset=0]
   * @param {string} [opts.color='#2A2A3E']
   * @returns {string} SVG fragment
   */
  function buildStaffLines(opts) {
    const { bottomY, lineGap, width, xOffset = 0, color = '#2A2A3E' } = opts;
    let svg = '';
    for (let i = 0; i < 5; i++) {
      const y = bottomY - i * lineGap;
      svg += `<line x1="${xOffset + 8}" y1="${y}" x2="${xOffset + width - 8}" y2="${y}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    }
    return svg;
  }

  /**
   * A single accidental glyph next to a note on the play staff (NOT a key
   * signature — see buildAccidentals for that). Shared so the glyph map,
   * calibrated +offset, font-size and styling live in one place; callers pass
   * the x and the note's y (they differ per module: one note, two notes, etc.).
   *
   * @param {object} opts
   * @param {'#'|'b'|'n'|'x'|'bb'} opts.accidental
   * @param {number} opts.x      - right edge of the glyph (text-anchor="end")
   * @param {number} opts.noteY  - the note's y; glyph is shifted down by the calibrated offset
   * @param {number} opts.lineGap
   * @param {string} [opts.color='#2A2A3E']
   * @returns {string} SVG fragment ('' if no/unknown accidental)
   */
  const NOTE_ACC_GLYPH = { '#': SMUFL.sharp, 'b': SMUFL.flat, 'n': SMUFL.natural, 'x': '\uE263', '##': '\uE263', 'bb': '\uE264' };
  function buildNoteAccidental(opts) {
    const { accidental, x, noteY, lineGap, color = '#2A2A3E' } = opts;
    const sym = NOTE_ACC_GLYPH[accidental];
    if (!sym) return '';
    const y = noteY + OFFSET.sharp * lineGap;   // sharp/flat/natural all share 1.625
    return `<text x="${x}" y="${y}" font-family="Bravura Text" font-size="${lineGap * 4}" text-anchor="end" fill="${color}">${sym}</text>`;
  }

  /**
   * A clef glyph.
   * @param {object} opts
   * @param {'treble'|'bass'} opts.clef
   * @param {number} opts.bottomY
   * @param {number} opts.lineGap
   * @param {number} [opts.xOffset=0]
   * @param {number} [opts.x] - explicit x, defaults to xOffset + 14
   * @param {string} [opts.color='#2A2A3E']
   * @returns {string} SVG fragment
   */
  function buildClef(opts) {
    const { clef, bottomY, lineGap, xOffset = 0, color = '#2A2A3E' } = opts;
    const x = (opts.x !== undefined) ? opts.x : xOffset + 14;
    let y, glyph, fontSize;
    if (clef === 'treble') {
      // Anchor at G4 line (step 2), shift down by calibrated offset
      y = (bottomY - 1 * lineGap) + OFFSET.trebleClef * lineGap;
      glyph = SMUFL.gClef;
      fontSize = lineGap * OFFSET.trebleClefSize;
    } else {
      // Anchor at F3 line (step 6), shift down by calibrated offset
      y = (bottomY - 3 * lineGap) + OFFSET.bassClef * lineGap;
      glyph = SMUFL.fClef;
      fontSize = lineGap * OFFSET.bassClefSize;
    }
    return `<text x="${x}" y="${y}" font-family="Bravura Text" font-size="${fontSize}" fill="${color}">${glyph}</text>`;
  }

  /**
   * A row of accidentals (sharps or flats), in canonical key-signature order.
   * @param {object} opts
   * @param {'treble'|'bass'} opts.clef
   * @param {'sharp'|'flat'} opts.type
   * @param {number} opts.count - number of accidentals (1..7)
   * @param {number} opts.bottomY
   * @param {number} opts.lineGap
   * @param {number} [opts.startX]
   * @param {string} [opts.color='#2A2A3E']
   * @param {string} [opts.className]
   * @returns {string} SVG fragment
   */
  function buildAccidentals(opts) {
    const { clef, type, count, bottomY, lineGap, color = '#2A2A3E', className } = opts;
    if (!count || count === 0) return '';
    const halfStep = lineGap / 2;
    // Default startX scales with lineGap because the clef glyph's width does
    // (font-size = lineGap * ~4.2). A fixed value overlapped the clef at small
    // lineGap. 4.5/4.4 reproduce the prior 72/70 at lineGap 16 (key-signatures),
    // and clear the clef at any size. Callers can still pass an explicit startX.
    const startX = (opts.startX !== undefined) ? opts.startX : (clef === 'treble' ? lineGap * 4.5 : lineGap * 4.4);
    const spacing = lineGap * 1.05;
    const fontSize = lineGap * 4;
    const sym = (type === 'sharp') ? SMUFL.sharp : SMUFL.flat;
    const offset = (type === 'sharp') ? OFFSET.sharp : OFFSET.flat;
    const steps = getAccidentalSteps(clef, type, count);
    const classAttr = className ? ` class="${className}"` : '';
    let svg = '';
    steps.forEach((step, i) => {
      const ax = startX + i * spacing;
      const ay = (bottomY - step * halfStep) + offset * lineGap;
      svg += `<text${classAttr} x="${ax}" y="${ay}" font-family="Bravura Text" font-size="${fontSize}" text-anchor="middle" fill="${color}">${sym}</text>`;
    });
    return svg;
  }

  /**
   * Time signature: two numerals stacked vertically, centered on the staff.
   * Top numeral sits in the space between lines 3 and 4 (centered on G4 in treble);
   * bottom numeral sits in the space between lines 1 and 2 (centered on D4 in treble).
   * For multi-digit numerals (e.g. 12), digits are placed side-by-side.
   *
   * @param {object} opts
   * @param {number} opts.top - top numeral (e.g. 4 in 4/4)
   * @param {number} opts.bottom - bottom numeral (e.g. 4 in 4/4)
   * @param {number} opts.bottomY
   * @param {number} opts.lineGap
   * @param {number} [opts.x] - x center of the time signature
   * @param {string} [opts.color='#2A2A3E']
   * @param {string} [opts.className]
   * @returns {string} SVG fragment
   */
  // ─────────────────────────────────────────────────────────────
  // Vector digit glyphs for time signatures.
  //
  // WHY PATHS, NOT TEXT: font-rendered digits drifted vertically and
  // changed size between questions on real devices — the same glyph would
  // render at different pixel widths, and dominant-baseline centered by the
  // font's metric box (not each glyph's ink), so symmetric digits (6, 8)
  // looked centered while asymmetric ones (3, 4) sat off. Vector paths have
  // no font dependency, no baseline, no load-timing, no metric box: a path
  // at given coordinates renders pixel-identically every time, everywhere.
  //
  // Each digit is defined in a normalized box: width DIGIT_W × height DIGIT_H,
  // with its top-left at (0,0). The geometric center is therefore
  // (DIGIT_W/2, DIGIT_H/2). Glyphs are placed by translate+scale only.
  // Bold, monoline-ish forms to read as engraved time-signature numerals.
  // ─────────────────────────────────────────────────────────────

  const DIGIT_W = 100;
  const DIGIT_H = 140;

  // Filled-outline paths (even-odd) for 0-9 in the 100x140 box.
  const DIGIT_PATHS = {
    '0': 'M50 4 C76 4 92 30 92 70 C92 110 76 136 50 136 C24 136 8 110 8 70 C8 30 24 4 50 4 Z M50 30 C38 30 32 48 32 70 C32 92 38 110 50 110 C62 110 68 92 68 70 C68 48 62 30 50 30 Z',
    '1': 'M58 4 L58 136 L34 136 L34 36 L14 46 L14 22 L40 4 Z',
    '2': 'M14 40 C14 14 34 4 52 4 C74 4 90 18 90 42 C90 60 78 74 60 90 L44 104 L92 104 L92 136 L12 136 L12 112 L52 74 C62 64 66 56 66 46 C66 36 60 30 50 30 C40 30 36 38 36 48 L36 52 L14 52 Z',
    '3': 'M14 38 C16 14 36 4 54 4 C76 4 90 16 90 38 C90 52 82 62 70 66 C84 70 92 82 92 98 C92 122 74 136 52 136 C30 136 12 124 12 98 L12 96 L36 96 L36 100 C36 108 42 114 52 114 C62 114 68 108 68 98 C68 88 60 82 48 82 L40 82 L40 60 L48 60 C58 60 66 54 66 44 C66 36 60 30 52 30 C42 30 38 36 38 46 L14 46 Z',
    '4': 'M62 4 L92 4 L92 88 L106 88 L106 110 L92 110 L92 136 L68 136 L68 110 L8 110 L8 86 Z M68 88 L68 38 L36 88 Z',
    '5': 'M20 4 L88 4 L88 28 L42 28 L40 54 C46 50 54 48 62 48 C82 48 94 64 94 92 C94 120 76 136 52 136 C30 136 12 122 12 98 L12 96 L36 96 L36 98 C36 108 42 114 52 114 C62 114 70 106 70 92 C70 78 62 70 50 70 C42 70 36 74 32 80 L12 76 Z',
    '6': 'M52 4 C72 4 86 14 88 32 L64 36 C62 32 58 28 52 28 C40 28 34 42 33 64 C40 56 50 52 60 52 C80 52 94 68 94 92 C94 118 76 136 52 136 C26 136 10 116 10 78 C10 32 28 4 52 4 Z M52 74 C42 74 34 82 34 94 C34 106 42 114 52 114 C62 114 70 106 70 94 C70 82 62 74 52 74 Z',
    '7': 'M12 4 L92 4 L92 26 L52 136 L26 136 L66 28 L12 28 Z',
    '8': 'M50 4 C72 4 88 16 88 36 C88 50 80 60 68 64 C82 68 92 80 92 96 C92 120 74 136 50 136 C26 136 8 120 8 96 C8 80 18 68 32 64 C20 60 12 50 12 36 C12 16 28 4 50 4 Z M50 26 C42 26 36 32 36 40 C36 48 42 54 50 54 C58 54 64 48 64 40 C64 32 58 26 50 26 Z M50 76 C40 76 32 84 32 94 C32 106 40 112 50 112 C60 112 68 106 68 94 C68 84 60 76 50 76 Z',
    '9': 'M48 4 C74 4 90 24 90 62 C90 108 72 136 48 136 C28 136 14 126 12 108 L36 104 C38 108 42 112 48 112 C60 112 66 98 67 76 C60 84 50 88 40 88 C20 88 6 72 6 48 C6 22 24 4 48 4 Z M48 26 C38 26 30 34 30 46 C30 58 38 66 48 66 C58 66 66 58 66 46 C66 34 58 26 48 26 Z',
  };

  function buildTimeSignature(opts) {
    const { top, bottom, bottomY, lineGap, color = '#2A2A3E', className } = opts;
    const x = (opts.x !== undefined) ? opts.x : 60;

    // Glyph height calibrated via ts-weight-calibrator.html (glyphH = 1.80).
    // Width scales proportionally from the normalized box aspect ratio.
    const glyphH = lineGap * 1.80;
    const scale  = glyphH / DIGIT_H;
    const glyphW = DIGIT_W * scale;
    const digitGap = glyphW * 0.04;   // small gap between multi-digit numerals

    // Anchored to the MIDDLE staff line: top numeral center one staff-space
    // above it, bottom numeral center one staff-space below.
    const midY = bottomY - 2 * lineGap;
    const topCenterY = midY - lineGap * 1.02;
    const botCenterY = midY + lineGap * 1.02;

    // Digit weight calibrated via ts-weight-calibrator.html (weight = -2.00).
    // feMorphology "erode" thins the filled glyphs uniformly. Radius is in
    // glyph-box units (applied to the path BEFORE the per-glyph scale), so the
    // thinning is consistent regardless of staff size. A single shared <defs>
    // is emitted once and referenced by every digit.
    const ERODE_RADIUS = 2.0;
    const filterId = 'qnTsErode';
    const defs =
      `<defs><filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">` +
      `<feMorphology operator="erode" radius="${ERODE_RADIUS}"/></filter></defs>`;

    function renderStack(numStr, centerY, posClass) {
      const n = numStr.length;
      const totalW = n * glyphW + (n - 1) * digitGap;
      const startLeft = x - totalW / 2;
      const cls = [className, posClass].filter(Boolean).join(' ');
      const clsAttr = cls ? ` class="${cls}"` : '';
      let out = '';
      for (let i = 0; i < n; i++) {
        const d = numStr[i];
        const path = DIGIT_PATHS[d];
        if (!path) continue;
        // Place the glyph box so its center lands on (digitCenterX, centerY).
        const leftX = startLeft + i * (glyphW + digitGap);
        const tx = leftX;
        const ty = centerY - glyphH / 2;
        out += `<g${clsAttr} fill="${color}" transform="translate(${tx} ${ty}) scale(${scale})">` +
               `<path d="${path}" fill-rule="evenodd" filter="url(#${filterId})"/></g>`;
      }
      return out;
    }

    return defs +
      renderStack(String(top), topCenterY, 'ts-top') +
      renderStack(String(bottom), botCenterY, 'ts-bottom');
  }

  // ─────────────────────────────────────────────────────────────
  // High-level composer
  // ─────────────────────────────────────────────────────────────

  /**
   * Build a complete staff: lines + clef + optional key signature + optional time signature.
   * Returns just the inner SVG fragment; caller wraps in <svg>.
   *
   * @param {object} opts
   * @param {'treble'|'bass'} [opts.clef='treble']
   * @param {number} [opts.width=360]
   * @param {number} [opts.lineGap=16]
   * @param {number} [opts.bottomY=130]
   * @param {number} [opts.xOffset=0]
   * @param {object} [opts.keySig] - { type: 'sharp'|'flat', count: 0..7 }
   * @param {object} [opts.timeSig] - { top: number, bottom: number }
   * @param {string} [opts.color='#2A2A3E']
   * @param {string} [opts.accClassName] - CSS class to attach to accidentals (for recoloring)
   * @param {string} [opts.tsClassName] - CSS class to attach to time-sig digits
   * @returns {{ svg: string, accStartX: number, tsX: number, accEndX: number }}
   *          svg fragment plus useful x-coordinates for composing further elements
   */
  function buildStaff(opts) {
    const {
      clef = 'treble',
      width = 360,
      height = 200,
      lineGap = 16,
      bottomY = 130,
      xOffset = 0,
      keySig = null,
      timeSig = null,
      color = '#2A2A3E',
      accClassName,
      tsClassName,
    } = opts;

    let svg = '';

    // Lines
    svg += buildStaffLines({ bottomY, lineGap, width, xOffset, color });

    // Clef
    svg += buildClef({ clef, bottomY, lineGap, xOffset, color });

    // Key signature (if any). Clef-clearance scales with lineGap (see buildAccidentals).
    // Callers may override via opts.accStartX (e.g. to pin a pre-existing layout).
    const accStartX = (opts.accStartX !== undefined)
      ? opts.accStartX
      : xOffset + (clef === 'treble' ? lineGap * 4.5 : lineGap * 4.4);
    let accEndX = accStartX;
    if (keySig && keySig.count > 0 && keySig.type) {
      svg += buildAccidentals({
        clef, type: keySig.type, count: keySig.count,
        bottomY, lineGap, startX: accStartX, color, className: accClassName,
      });
      accEndX = accStartX + keySig.count * (lineGap * 1.05);
    }

    // Time signature (if any) — placed after key signature with a small gap
    let tsX = 0;
    if (timeSig) {
      tsX = accEndX + lineGap * 1.2;
      svg += buildTimeSignature({
        top: timeSig.top, bottom: timeSig.bottom,
        bottomY, lineGap, x: tsX, color, className: tsClassName,
      });
    }

    return { svg, accStartX, accEndX, tsX };
  }

  // ─────────────────────────────────────────────────────────────
  // Chord rendering (3-4 stacked noteheads + shared stem)
  //
  // Generalizes the 2-note interval renderer to N notes.
  // Handles stem direction, seconds displacement, ledger lines,
  // and staggered accidental placement.
  // ─────────────────────────────────────────────────────────────

  function diatonicStepFromPitch(letter, octave) {
    const LETTER_STEPS = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    return octave * 7 + (LETTER_STEPS[letter] || 0);
  }

  function chordLedgers(d) {
    const out = [];
    if (d <= -2) {
      const eMin = (d % 2 === 0) ? d : d + 1;
      for (let e = -2; e >= eMin; e -= 2) out.push(e);
    } else if (d >= 10) {
      const eMax = (d % 2 === 0) ? d : d - 1;
      for (let e = 10; e <= eMax; e += 2) out.push(e);
    }
    return out;
  }

  /**
   * Build SVG for a chord (3-4 stacked noteheads with a shared stem).
   *
   * @param {object} opts
   * @param {'treble'|'bass'} opts.clef
   * @param {Array<{letter,octave,accidental,midi}>} opts.pitches - parsed pitches, any order
   * @param {number} opts.bottomY
   * @param {number} opts.lineGap
   * @param {number} [opts.x]          - x center for the chord (default: centered in width)
   * @param {number} [opts.width=360]
   * @param {number} [opts.xOffset=0]
   * @param {string} [opts.noteFill='#5B3FE4']
   * @param {string} [opts.color='#2A2A3E']
   * @param {string} [opts.noteClass='note-head']
   * @returns {{ svg: string, noteX: number }}
   */
  function buildChord(opts) {
    const {
      clef, pitches,
      bottomY, lineGap,
      width = 360, xOffset = 0,
      noteFill = '#5B3FE4', color = '#2A2A3E',
      noteClass = 'note-head',
    } = opts;

    if (!pitches || pitches.length < 2) return { svg: '', noteX: 0 };

    const halfStep = lineGap / 2;
    const headRX = lineGap * 0.70;
    const headRY = lineGap * 0.50;
    const tilt = -16;
    const LETTER_STEPS = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    const clefBottom = clef === 'treble'
      ? diatonicStepFromPitch('E', 4)
      : diatonicStepFromPitch('G', 2);

    // Sort pitches low to high by diatonic step
    const sorted = pitches.slice().sort((a, b) => {
      const da = diatonicStepFromPitch(a.letter, a.octave);
      const db = diatonicStepFromPitch(b.letter, b.octave);
      return da - db;
    });

    const steps = sorted.map(p => diatonicStepFromPitch(p.letter, p.octave) - clefBottom);
    const ys = steps.map(d => bottomY - d * halfStep);

    // Stem direction: midpoint of outer notes
    const dMid = (steps[0] + steps[steps.length - 1]) / 2;
    const stemUp = dMid < 4;

    // Base x position
    const baseX = (opts.x !== undefined) ? opts.x : (xOffset + width * 0.55);

    // Seconds displacement: when adjacent notes are 1 step apart, offset
    // the appropriate note. Work from bottom up.
    const xs = sorted.map(() => baseX);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (steps[i + 1] - steps[i] === 1) {
        if (stemUp) {
          xs[i + 1] = baseX + headRX * 1.9;
        } else {
          xs[i] = baseX - headRX * 1.9;
        }
      }
    }

    let svg = '';

    // Ledger lines — union of all notes
    const allLedgers = new Set();
    steps.forEach(d => chordLedgers(d).forEach(e => allLedgers.add(e)));
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    allLedgers.forEach(e => {
      const ly = bottomY - e * halfStep;
      svg += `<line x1="${xMin - lineGap * 1.05}" y1="${ly}" x2="${xMax + lineGap * 1.05}" y2="${ly}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`;
    });

    // Accidentals — staggered to avoid vertical collision.
    // Process top-to-bottom; each accidental gets the closest available
    // column unless a previously placed one is within 2.5 steps.
    const accColumns = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (!sorted[i].accidental) continue;
      const sym = NOTE_ACC_GLYPH[sorted[i].accidental];
      if (!sym) continue;
      let col = 0;
      for (const placed of accColumns) {
        if (Math.abs(steps[i] - placed.step) < 3 && placed.col === col) {
          col++;
        }
      }
      accColumns.push({ step: steps[i], col });
      const accX = xMin - lineGap * 1.1 - col * lineGap * 1.0;
      const accY = ys[i] + OFFSET.sharp * lineGap;
      svg += `<text x="${accX}" y="${accY}" font-family="Bravura Text" font-size="${lineGap * 4}" text-anchor="end" fill="${color}">${sym}</text>`;
    }

    // Stem
    const stemLen = lineGap * 3.5;
    svg += `<g class="chord-group" id="chord-anim">`;
    if (stemUp) {
      const sx = baseX + headRX * 0.78;
      const stemTop = ys[ys.length - 1] - stemLen;
      svg += `<line x1="${sx}" y1="${ys[0] - 1}" x2="${sx}" y2="${stemTop}" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>`;
    } else {
      const sx = baseX - headRX * 0.78;
      const stemBot = ys[0] + stemLen;
      svg += `<line x1="${sx}" y1="${ys[ys.length - 1] + 1}" x2="${sx}" y2="${stemBot}" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>`;
    }

    // Noteheads — bottom to top
    sorted.forEach((p, i) => {
      svg += `<ellipse class="${noteClass}" data-i="${i}" cx="${xs[i]}" cy="${ys[i]}" rx="${headRX}" ry="${headRY}" transform="rotate(${tilt} ${xs[i]} ${ys[i]})" fill="${noteFill}" stroke="${color}" stroke-width="2"/>`;
    });
    svg += `</g>`;

    return { svg, noteX: baseX };
  }

  /**
   * Build a complete staff with a chord: lines + clef + optional key sig + chord.
   * High-level composer for chord modules.
   *
   * @param {object} opts
   * @param {'treble'|'bass'} [opts.clef='treble']
   * @param {Array} opts.pitches      - parsed pitches for the chord
   * @param {object} [opts.keySig]    - { type: 'sharp'|'flat', count: 0..7 }
   * @param {number} [opts.width=360]
   * @param {number} [opts.lineGap=16]
   * @param {number} [opts.bottomY=130]
   * @param {number} [opts.height=200]
   * @param {string} [opts.noteFill='#5B3FE4']
   * @param {string} [opts.color='#2A2A3E']
   * @returns {{ svg: string, noteX: number, accEndX: number }}
   */
  function buildStaffWithChord(opts) {
    const {
      clef = 'treble',
      pitches,
      keySig = null,
      width = 360,
      lineGap = 16,
      bottomY = 130,
      height = 200,
      noteFill = '#5B3FE4',
      color = '#2A2A3E',
    } = opts;

    // Staff frame: lines + clef + key sig
    const frame = buildStaff({
      clef, width, height, lineGap, bottomY, xOffset: 0,
      keySig, color,
    });

    // Place chord after key signature with comfortable clearance
    const chordX = (frame.accEndX || (lineGap * 4.5)) + lineGap * 3;

    const chord = buildChord({
      clef, pitches, bottomY, lineGap, width,
      x: chordX, noteFill, color,
    });

    return {
      svg: frame.svg + chord.svg,
      noteX: chord.noteX,
      accEndX: frame.accEndX,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Expose
  // ─────────────────────────────────────────────────────────────

  window.NH = window.NH || {};
  window.NH.staff = {
    SMUFL,
    OFFSET,
    getAccidentalSteps,
    buildStaffLines,
    buildClef,
    buildAccidentals,
    buildNoteAccidental,
    buildTimeSignature,
    buildStaff,
    buildChord,
    buildStaffWithChord,
  };
  window.NH.staff.version = '1.3.0';

})();
