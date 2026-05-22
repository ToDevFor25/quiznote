/* ============================================================================
   qn-nav.js  —  QuizNote unified navigation component
   ----------------------------------------------------------------------------
   One source of truth for the top-right nav across index, path, play, and
   dashboard. Renders:  [ profile pill ]  [ CurrentPage = ]
     - profile pill: active nickname + colored initial dot, or "Guest";
       links to profile.html (identity / switch lives here, NOT in the menu).
     - current-page label fused to a hamburger; the dropdown holds the two
       destinations you're NOT on (current page is the label, omitted from menu).

   Destinations (the only three): Today / All Modules / My Progress.

   Usage (page includes qn-profile.js first, then qn-nav.js, both defer):
       QNNav.mount({ current: 'today' });            // path.html
       QNNav.mount({ current: 'modules' });          // play.html
       QNNav.mount({ current: 'progress' });         // dashboard.html
       QNNav.mount({ current: null });               // index.html (label "Menu")
   Optional: { slot: '#some-id' } to target a specific mount element;
   defaults to '#qn-nav-slot' then '#profile-chip-slot' (legacy) then
   '#nav-actions' (index).

   This replaces the old per-page QNMenu (chip-anchored profile dropdown).
   ========================================================================== */
(function () {
  'use strict';

  var DESTS = [
    { key: 'today',    label: 'Today',       href: 'path.html',      icon: '\u25B6' },
    { key: 'modules',  label: 'All Modules', href: 'play.html',      icon: '\u266B' },
    { key: 'progress', label: 'My Progress', href: 'dashboard.html', icon: '\u25D0' }
  ];

  var CSS = [
    '.qn-nav { position: relative; display: inline-flex; align-items: center; gap: 8px;',
    '  min-width: 0; flex-shrink: 1; font-family: Fredoka, sans-serif; }',
    '.qn-nav-pill { display: inline-flex; align-items: center; gap: 6px;',
    '  padding: 4px 12px 4px 5px; background: #fff; color: #2A2A3E;',
    '  border: 2px solid #2A2A3E; border-radius: 999px; font-weight: 600;',
    '  font-size: 13px; text-decoration: none; white-space: nowrap; max-width: 150px;',
    '  min-width: 0; flex-shrink: 1; transition: background 120ms; }',
    '.qn-nav-pill:hover { background: #d3f1ec; }',
    '.qn-nav-pill .qn-nav-name { overflow: hidden; text-overflow: ellipsis; min-width: 4.5em; }',
    '.qn-nav-dot { width: 20px; height: 20px; border-radius: 50%; flex: none;',
    '  background: #1FB8A8; color: #fff; display: inline-flex; align-items: center;',
    '  justify-content: center; font-size: 11px; font-weight: 700; }',
    '.qn-nav-guest { display: inline-flex; align-items: center; justify-content: center;',
    '  width: 18px; height: 18px; flex: none; font-size: 13px; color: #8a8472; }',
    '.qn-nav-btn { display: inline-flex; align-items: center; gap: 8px; height: 38px; flex: none;',
    '  padding: 0 12px; background: #d3f1ec; color: #0e8475; border: 2px solid #2A2A3E;',
    '  border-radius: 11px; box-shadow: 0 3px 0 #2A2A3E; font-family: Fredoka, sans-serif;',
    '  font-weight: 600; font-size: 14px; line-height: 1; cursor: pointer; white-space: nowrap;',
    '  transition: transform 100ms, box-shadow 100ms, background 120ms, color 120ms; }',
    '.qn-nav-btn .qn-nav-bars { font-size: 17px; }',
    '.qn-nav-btn:hover { background: #c2ebe3; }',
    '.qn-nav-btn[aria-expanded="true"] { background: #1FB8A8; color: #fff; }',
    '.qn-nav-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #2A2A3E; }',
    '.qn-nav-panel { position: fixed; z-index: 99999;',
    '  min-width: 200px; background: #fff; border: 2px solid #2A2A3E; border-radius: 14px;',
    '  box-shadow: 0 6px 0 #2A2A3E; overflow: hidden; font-family: Fredoka, sans-serif; }',
    '.qn-nav-panel[hidden] { display: none; }',
    '.qn-nav-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px;',
    '  font-weight: 600; font-size: 14px; color: #2A2A3E; text-decoration: none;',
    '  cursor: pointer; white-space: nowrap; border-bottom: 1px solid rgba(42,42,62,0.09);',
    '  transition: background 110ms; }',
    '.qn-nav-item:last-child { border-bottom: none; }',
    '.qn-nav-item:hover { background: rgba(31,184,168,0.12); }',
    '.qn-nav-item .qn-nav-ico { font-size: 16px; flex: none; width: 18px; text-align: center;',
    '  color: #0e8475; }',
    '@media (max-width: 760px) {',
    '  .qn-nav-panel { min-width: 220px; }',
    '  .qn-nav-item { padding: 13px 16px; font-size: 15px; }',
    '  .qn-nav-pill { max-width: 132px; }',
    '}',
    '@media (max-width: 480px) {',
    '  .qn-nav-pill { max-width: none; padding: 8px; }',
    '  .qn-nav-pill .qn-nav-name { display: none; }',
    '  .qn-nav-guest { width: 22px; height: 22px; }',
    '}'
  ].join('\n');

  var styleInjected = false;
  function injectCSS() {
    if (styleInjected) return;
    var s = document.createElement('style');
    s.id = 'qn-nav-style';
    s.textContent = CSS;
    document.head.appendChild(s);
    styleInjected = true;
  }

  function getActive() {
    return (window.QN && window.QN.profile && window.QN.profile.getActive)
      ? window.QN.profile.getActive() : null;
  }

  function findSlot(opts) {
    if (opts && opts.slot) {
      var byOpt = (typeof opts.slot === 'string')
        ? document.querySelector(opts.slot) : opts.slot;
      if (byOpt) return byOpt;
    }
    return document.getElementById('qn-nav-slot')
        || document.getElementById('profile-chip-slot')
        || document.getElementById('nav-actions');
  }

  function buildPill(active) {
    var pill = document.createElement('a');
    pill.className = 'qn-nav-pill';
    pill.href = 'profile.html';
    if (active) {
      var dot = document.createElement('span');
      dot.className = 'qn-nav-dot';
      dot.textContent = (active.nickname || '?').trim().charAt(0).toUpperCase() || '?';
      if (active.color) dot.style.background = active.color;
      var name = document.createElement('span');
      name.className = 'qn-nav-name';
      name.textContent = active.nickname || 'You';
      pill.appendChild(dot); pill.appendChild(name);
      pill.setAttribute('aria-label', 'Profile: ' + (active.nickname || 'You'));
    } else {
      var g = document.createElement('span');
      g.className = 'qn-nav-guest'; g.setAttribute('aria-hidden', 'true');
      g.textContent = '\u25CB';
      var gl = document.createElement('span');
      gl.className = 'qn-nav-name'; gl.textContent = 'Guest';
      pill.appendChild(g); pill.appendChild(gl);
      pill.setAttribute('aria-label', 'Guest \u2014 make a profile');
    }
    return pill;
  }

  function mount(opts) {
    opts = opts || {};
    injectCSS();
    var slot = findSlot(opts);
    if (!slot) return false;

    var active = getActive();
    var currentKey = (typeof opts.current === 'undefined') ? null : opts.current;

    var wrap = document.createElement('div');
    wrap.className = 'qn-nav';

    var pill = buildPill(active);

    var btn = document.createElement('button');
    btn.className = 'qn-nav-btn';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');

    var current = null;
    for (var i = 0; i < DESTS.length; i++) {
      if (DESTS[i].key === currentKey) { current = DESTS[i]; break; }
    }
    var labelText = current ? current.label : 'Menu';
    btn.setAttribute('aria-label', labelText + ' \u2014 open navigation menu');

    var lbl = document.createElement('span');
    lbl.className = 'qn-nav-curlabel'; lbl.textContent = labelText;
    var bars = document.createElement('span');
    bars.className = 'qn-nav-bars'; bars.setAttribute('aria-hidden', 'true');
    bars.textContent = '\u2630';
    btn.appendChild(lbl); btn.appendChild(bars);

    var panel = document.createElement('div');
    panel.className = 'qn-nav-panel';
    panel.setAttribute('role', 'menu');
    panel.hidden = true;

    DESTS.forEach(function (it) {
      if (it.key === currentKey) return;  // omit the page we're on
      var a = document.createElement('a');
      a.className = 'qn-nav-item';
      a.href = it.href;
      a.setAttribute('role', 'menuitem');
      var ic = document.createElement('span');
      ic.className = 'qn-nav-ico'; ic.setAttribute('aria-hidden', 'true');
      ic.textContent = it.icon;
      a.appendChild(ic);
      a.appendChild(document.createTextNode(it.label));
      // Explicit navigation: don't rely solely on default <a> behavior, and
      // make sure the click can't be swallowed by the menu's own listeners.
      a.addEventListener('click', function (e) {
        e.stopPropagation();
        window.location.href = it.href;
      });
      panel.appendChild(a);
    });

    // Position the (body-mounted, fixed) panel under the button's right edge.
    // Body-mounting escapes nav's backdrop-filter stacking context, which was
    // trapping the panel below the hero and stealing item clicks.
    function place() {
      var r = btn.getBoundingClientRect();
      panel.style.top = (r.bottom + 8) + 'px';
      // align panel's right edge to the button's right edge
      panel.style.left = 'auto';
      panel.style.right = (window.innerWidth - r.right) + 'px';
    }
    function open() { place(); panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); bars.textContent = '\u2715'; }
    function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); bars.textContent = '\u2630'; }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.hidden ? open() : close();
    });
    document.addEventListener('click', function (e) {
      // panel now lives on <body>, so check it explicitly as well as the wrap
      if (!panel.hidden && !wrap.contains(e.target) && !panel.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) close();
    });
    window.addEventListener('resize', function () { if (!panel.hidden) place(); });
    window.addEventListener('scroll', function () { if (!panel.hidden) place(); }, true);

    wrap.appendChild(pill);
    wrap.appendChild(btn);

    slot.innerHTML = '';
    slot.appendChild(wrap);
    // remove any stale panel from a previous mount, then attach the new one to body
    var stale = document.getElementById('qn-nav-panel-mounted');
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
    panel.id = 'qn-nav-panel-mounted';
    document.body.appendChild(panel);  // detached from nav's stacking context
    return true;
  }

  window.QNNav = { mount: mount, DESTS: DESTS };
})();
