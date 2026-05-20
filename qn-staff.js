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
    trebleClef: 0.75,   // from G4 line (step 2)
    bassClef:   2.375,  // from F3 line (step 6)
    sharp:      1.625,  // from target line
    flat:       1.625,
    natural:    1.625,
    tsDigit:    1.5,    // time-signature digit visual center vs y-anchor
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
    const fontSize = lineGap * 4;
    const x = (opts.x !== undefined) ? opts.x : xOffset + 14;
    let y, glyph;
    if (clef === 'treble') {
      // Anchor at G4 line (step 2), shift down by calibrated offset
      y = (bottomY - 1 * lineGap) + OFFSET.trebleClef * lineGap;
      glyph = SMUFL.gClef;
    } else {
      // Anchor at F3 line (step 6), shift down by calibrated offset
      y = (bottomY - 3 * lineGap) + OFFSET.bassClef * lineGap;
      glyph = SMUFL.fClef;
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
    const startX = (opts.startX !== undefined) ? opts.startX : (clef === 'treble' ? 72 : 70);
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
  function buildTimeSignature(opts) {
    const { top, bottom, bottomY, lineGap, color = '#2A2A3E', className } = opts;
    const x = (opts.x !== undefined) ? opts.x : 60;
    // Bravura SMuFL time-sig digits (U+E080-E089) silently fail to render
    // in Bravura Text on some devices, so we use a bold serif fallback that
    // approximates the engraved look. Georgia is widely available; Times
    // and serif round out the stack.
    //
    // Sizing: each digit ~2 staff spaces tall (engraving convention).
    // Positioning:
    //   - Top digit center on line 4 (step 6) — upper half of staff
    //   - Bottom digit center on line 2 (step 2) — lower half
    // SVG text y is BASELINE; the visual center of a serif digit sits
    // ~0.35 * fontSize above baseline, so shift baseline DOWN by that.
    const fontSize = lineGap * 2.3;
    const digitWidth = lineGap * 1.15;
    const baselineShift = fontSize * 0.22;
    // Serif digits are taller than Bravura's purpose-built time-sig glyphs,
    // so separate the centers by slightly more than 2 staff spaces to keep
    // a clean gap in the middle without floating outside the staff.
    const halfSep = lineGap * 1.15;  // distance of each digit center from staff midline

    const midY = bottomY - 2 * lineGap;          // middle staff line
    const topCenterY = midY - halfSep;
    const botCenterY = midY + halfSep;
    const topY = topCenterY + baselineShift;
    const botY = botCenterY + baselineShift;

    function renderStack(numStr, y) {
      const totalWidth = numStr.length * digitWidth;
      const startX = x - totalWidth / 2 + digitWidth / 2;
      let out = '';
      for (let i = 0; i < numStr.length; i++) {
        const dx = startX + i * digitWidth;
        const classAttr = className ? ` class="${className}"` : '';
        out += `<text${classAttr} x="${dx}" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-size="${fontSize}" text-anchor="middle" fill="${color}">${numStr[i]}</text>`;
      }
      return out;
    }

    return renderStack(String(top), topY) + renderStack(String(bottom), botY);
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

    // Key signature (if any)
    const accStartX = xOffset + (clef === 'treble' ? 72 : 70);
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
    buildTimeSignature,
    buildStaff,
  };
  window.NH.staff.version = '1.0.0';

})();
