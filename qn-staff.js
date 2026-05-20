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

    // Glyph height ~2.3 staff spaces (matches prior calibrated visual size).
    // Width scales proportionally from the normalized box aspect ratio.
    const glyphH = lineGap * 2.30;
    const scale  = glyphH / DIGIT_H;
    const glyphW = DIGIT_W * scale;
    const digitGap = glyphW * 0.04;   // small gap between multi-digit numerals

    // Anchored to the MIDDLE staff line: top numeral center one staff-space
    // above it, bottom numeral center one staff-space below.
    const midY = bottomY - 2 * lineGap;
    const topCenterY = midY - lineGap * 1.02;
    const botCenterY = midY + lineGap * 1.02;

    const classAttr = className ? ` class="${className}"` : '';

    function renderStack(numStr, centerY) {
      const n = numStr.length;
      const totalW = n * glyphW + (n - 1) * digitGap;
      const startLeft = x - totalW / 2;
      let out = '';
      for (let i = 0; i < n; i++) {
        const d = numStr[i];
        const path = DIGIT_PATHS[d];
        if (!path) continue;
        // Place the glyph box so its center lands on (digitCenterX, centerY).
        const leftX = startLeft + i * (glyphW + digitGap);
        const tx = leftX;
        const ty = centerY - glyphH / 2;
        out += `<g${classAttr} fill="${color}" transform="translate(${tx} ${ty}) scale(${scale})">` +
               `<path d="${path}" fill-rule="evenodd"/></g>`;
      }
      return out;
    }

    return renderStack(String(top), topCenterY) + renderStack(String(bottom), botCenterY);
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
