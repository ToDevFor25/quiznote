// =====================================================================
// QuizNote — shared UI helpers (qn-ui.js)
// =====================================================================
//
// QN.ui.clefTile({clef})
//   Returns the canonical SVG markup for a treble / bass / both clef-picker
//   tile. Source of truth for start-screen clef pickers across the 14
//   modules that have one. Values calibrated in _clef-calibrator.html;
//   change them HERE and every module updates.
//
// QN.ui.mountClefTiles(scope?)
//   Auto-called on DOMContentLoaded. Finds every element with [data-clef]
//   inside `scope` (defaults to document) and injects QN.ui.clefTile()
//   into it, replacing any pre-existing .tile-clef SVG. Each module's
//   start-screen markup keeps the <button data-clef="treble"> wrapper
//   (used by the existing tile-pick handlers) but no longer carries
//   per-module inline SVG.
//
// Loading: <script src="qn-ui.js" defer></script> in <head>, after
// qn-profile.js so window.QN.ui exists.
//
// =====================================================================

(function () {
  var W = window;
  W.QN = W.QN || {};
  W.QN.ui = W.QN.ui || {};

  QN.ui.clefTile = function (opts) {
    var clef = opts.clef;  // 'treble' | 'bass' | 'both'
    var VBW = 66, VBH = 68;
    var FF  = 'Bravura Text';
    var T   = '';
    var B   = '';

    // Single-staff layout (treble or bass)
    var SINGLE = {
      lx: 7, rx: 66, topY: 15, gap: 9.5, sw: 1.5,
      treble: { fs: 39.5, x: 13, y: 52.75 },
      bass:   { fs: 40,   x: 11, y: 48.75 }
    };

    // Two-staff "both" layout
    var BOTH = {
      topY: 8, gap: 9,
      lineGap: 5.5, sw: 1.1,
      treble: { fs: 26.5, x: 10, y: 30.5 },
      bass:   { fs: 24,   x: 10, y: 59 }
    };

    function lines(left, right, ys, sw) {
      return '<g class="staff-line" stroke="#2A2A3E" stroke-width="' + sw + '" fill="none">' +
        ys.map(function (y) { return '<line x1="' + left + '" y1="' + y + '" x2="' + right + '" y2="' + y + '"/>'; }).join('') +
      '</g>';
    }
    function glyph(g, k) {
      return '<text class="clef" x="' + k.x + '" y="' + k.y + '" font-family="' + FF + '" font-size="' + k.fs + '" fill="#2A2A3E">' + g + '</text>';
    }

    if (clef === 'treble' || clef === 'bass') {
      var ys = [0,1,2,3,4].map(function (i) { return SINGLE.topY + i * SINGLE.gap; });
      var g = clef === 'treble' ? glyph(T, SINGLE.treble) : glyph(B, SINGLE.bass);
      return '<svg class="tile-clef" viewBox="0 0 ' + VBW + ' ' + VBH + '" xmlns="http://www.w3.org/2000/svg">' +
        lines(SINGLE.lx, SINGLE.rx, ys, SINGLE.sw) + g + '</svg>';
    }
    // both
    var tYs = [0,1,2,3,4].map(function (i) { return BOTH.topY + i * BOTH.lineGap; });
    var bassTop = BOTH.topY + 4 * BOTH.lineGap + BOTH.gap;
    var bYs = [0,1,2,3,4].map(function (i) { return bassTop + i * BOTH.lineGap; });
    return '<svg class="tile-clef" viewBox="0 0 ' + VBW + ' ' + VBH + '" xmlns="http://www.w3.org/2000/svg">' +
      lines(SINGLE.lx, SINGLE.rx, tYs.concat(bYs), BOTH.sw) +
      glyph(T, BOTH.treble) + glyph(B, BOTH.bass) +
    '</svg>';
  };

  // Mount: find every clef-picker tile and inject the canonical SVG.
  // Looks for buttons (or any element) with [data-clef="treble|bass|both"]
  // inside the scope; replaces any existing .tile-clef child SVG, or
  // prepends one if missing.
  QN.ui.mountClefTiles = function (scope) {
    var root = scope || document;
    var tiles = root.querySelectorAll('[data-clef]');
    for (var i = 0; i < tiles.length; i++) {
      var btn = tiles[i];
      var clef = btn.getAttribute('data-clef');
      if (clef !== 'treble' && clef !== 'bass' && clef !== 'both') continue;
      var existing = btn.querySelector('svg.tile-clef');
      var html = QN.ui.clefTile({ clef: clef });
      if (existing) {
        existing.outerHTML = html;
      } else {
        // Insert at the front so it shows above text labels (matches the
        // historical inline-SVG ordering).
        btn.insertAdjacentHTML('afterbegin', html);
      }
    }
  };

  // Auto-mount on DOMContentLoaded so modules don't need to call this
  // manually. If a module mutates the DOM later (e.g. dynamically adds a
  // clef picker), call QN.ui.mountClefTiles(newScope) yourself.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { QN.ui.mountClefTiles(); });
  } else {
    QN.ui.mountClefTiles();
  }
})();
