/*
 * ⚠️  CLIENT-SIDE VELVET ROPE — PRIVATE BETA ONLY ⚠️
 *
 * This is a convenience gate for a private beta, NOT real access control.
 * A hashed client-side check is trivially bypassable (disable JS, read
 * the hash list, brute-force short codes, etc.) and MUST be replaced by
 * server-side auth before any real account / user data sits behind it.
 * Do not let this gate imply security it does not provide.
 */
(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────
  // SHA-256 hex hashes of valid beta access codes (lowercase).
  // To add/retire a code: hash it (echo -n "code" | sha256sum) and
  // edit this list.  Retiring a hash forces everyone who used that
  // code to re-enter a current one.
  var VALID_HASHES = [
    'f11a989170b0b9aebd9f672fd9490527617562da147e3bac2e0da370b764e1e2'
  ];

  var STORAGE_KEY = 'qn_beta_unlock';

  // ── HELPERS ───────────────────────────────────────────────────────

  function storedHash() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function isUnlocked() {
    var h = storedHash();
    return h !== null && VALID_HASHES.indexOf(h) !== -1;
  }

  function sha256(text) {
    var enc = new TextEncoder();
    return crypto.subtle.digest('SHA-256', enc.encode(text)).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  // ── EARLY EXIT (unlocked) ─────────────────────────────────────────

  if (isUnlocked()) return;

  // ── INJECT CSS + HIDE BODY ────────────────────────────────────────
  // Runs immediately in <head> (no defer) so the page never flashes.

  var gateCSS = document.createElement('style');
  gateCSS.textContent =
    'body.qn-gated{visibility:hidden!important}' +
    '.qn-gate-overlay{' +
      'position:fixed;inset:0;z-index:99999;' +
      'display:flex;align-items:center;justify-content:center;' +
      'background:rgba(42,42,62,0.55);' +
      'backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);' +
      'padding:20px;' +
    '}' +
    '.qn-gate-card{' +
      'background:var(--cream,#FFFAF0);border-radius:20px;' +
      'padding:40px 36px 32px;max-width:440px;width:100%;' +
      'text-align:center;' +
      'box-shadow:0 20px 60px -12px rgba(0,0,0,0.35);' +
      'font-family:"Nunito",system-ui,sans-serif;' +
      'color:var(--ink,#2A2A3E);' +
    '}' +
    '.qn-gate-brand{' +
      'font-family:"Fredoka",sans-serif;font-weight:700;' +
      'font-size:32px;letter-spacing:-0.02em;margin-bottom:4px;' +
    '}' +
    '.qn-gate-accent{color:var(--teal-dk,#0e8475)}' +
    '.qn-gate-tagline{' +
      'font-size:15px;font-style:italic;' +
      'color:var(--ink-soft,#5a5a6e);margin-bottom:16px;' +
    '}' +
    '.qn-gate-status{' +
      'display:inline-block;padding:5px 14px;' +
      'font-family:"Fredoka",sans-serif;font-weight:600;' +
      'font-size:12px;text-transform:uppercase;letter-spacing:0.1em;' +
      'color:var(--teal-dk,#0e8475);background:var(--teal-lt,#d3f1ec);' +
      'border-radius:8px;margin-bottom:18px;' +
    '}' +
    '.qn-gate-blurb{' +
      'font-size:14px;line-height:1.6;' +
      'color:var(--ink-soft,#5a5a6e);margin-bottom:24px;' +
    '}' +
    '.qn-gate-label{' +
      'display:block;font-weight:700;font-size:13px;' +
      'text-align:left;margin-bottom:6px;color:var(--ink,#2A2A3E);' +
    '}' +
    '.qn-gate-input-row{display:flex;gap:8px}' +
    '.qn-gate-input{' +
      'flex:1;padding:12px 14px;' +
      'font-family:"Nunito",sans-serif;font-size:16px;' +
      'border:2px solid var(--rule,#e8e2d8);border-radius:10px;' +
      'background:#fff;color:var(--ink,#2A2A3E);' +
      'outline:none;transition:border-color 140ms;' +
    '}' +
    '.qn-gate-input:focus{border-color:var(--teal,#1FB8A8)}' +
    '.qn-gate-btn{' +
      'padding:12px 22px;font-family:"Fredoka",sans-serif;' +
      'font-weight:600;font-size:15px;border:none;border-radius:10px;' +
      'background:var(--teal,#1FB8A8);color:#fff;cursor:pointer;' +
      'transition:background 140ms,transform 120ms;' +
    '}' +
    '.qn-gate-btn:hover{background:var(--teal-dk,#0e8475);transform:translateY(-1px)}' +
    '.qn-gate-error{margin-top:10px;font-size:13px;color:#c0392b;text-align:left}' +
    '.qn-gate-notice{' +
      'margin-top:20px;font-size:12px;line-height:1.55;' +
      'color:var(--ink-faint,#8a8472);padding:12px;' +
      'background:rgba(42,42,62,0.04);border-radius:8px;' +
    '}' +
    '.qn-gate-contact{margin-top:16px;font-size:12px;color:var(--ink-faint,#8a8472)}' +
    '.qn-gate-contact a{color:var(--teal,#1FB8A8);text-decoration:none}' +
    '.qn-gate-contact a:hover{text-decoration:underline}' +
    '@media(max-width:480px){' +
      '.qn-gate-card{padding:28px 20px 24px}' +
      '.qn-gate-brand{font-size:26px}' +
      '.qn-gate-input-row{flex-direction:column}' +
    '}';
  document.head.appendChild(gateCSS);

  // Mark body as gated (hidden) — the class is added via a second
  // inline <style> that fires before any paint.
  var hideStyle = document.createElement('style');
  hideStyle.textContent = 'body{visibility:hidden!important}';
  document.head.appendChild(hideStyle);

  // ── BUILD OVERLAY ─────────────────────────────────────────────────

  function buildGate() {
    var allChildren = document.body.children;
    for (var i = 0; i < allChildren.length; i++) {
      allChildren[i].style.filter = 'blur(6px)';
      allChildren[i].style.pointerEvents = 'none';
      allChildren[i].style.userSelect = 'none';
      allChildren[i].setAttribute('aria-hidden', 'true');
      allChildren[i].setAttribute('inert', '');
    }
    document.body.style.overflow = 'hidden';

    var overlay = document.createElement('div');
    overlay.className = 'qn-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Beta access');

    /* [PLACEHOLDER — owner to refine blurb copy] */
    overlay.innerHTML =
      '<div class="qn-gate-card">' +
        '<div class="qn-gate-brand">Quiz<span class="qn-gate-accent">Note</span></div>' +
        '<div class="qn-gate-tagline">Music theory practice that meets you where you are.</div>' +
        '<div class="qn-gate-status">Private beta — opening soon.</div>' +
        '<p class="qn-gate-blurb">' +
          'Short, focused rounds covering note reading, rhythm, key signatures, scales, intervals, and more — ' +
          'built for students of all ages, from first notes through intermediate theory.' +
        '</p>' +
        '<form class="qn-gate-form" autocomplete="off">' +
          '<label for="qn-gate-code" class="qn-gate-label">Beta access code</label>' +
          '<div class="qn-gate-input-row">' +
            '<input id="qn-gate-code" class="qn-gate-input" type="text" ' +
              'placeholder="Enter code" autocomplete="off" autocapitalize="off" spellcheck="false">' +
            '<button type="submit" class="qn-gate-btn">Enter</button>' +
          '</div>' +
          '<div class="qn-gate-error" id="qn-gate-error" hidden>' +
            'That code didn’t match — check with whoever invited you.' +
          '</div>' +
        '</form>' +
        '<p class="qn-gate-notice">' +
          'This is a private beta in active development. Your data is currently stored locally on your device. ' +
          'Accounts and payments are coming — we’ll tell you before anything changes.' +
        '</p>' +
        '<div class="qn-gate-contact">Questions? <a href="mailto:support@quiznote.online">support@quiznote.online</a></div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Reveal page (blurred) behind the card
    hideStyle.remove();

    var input = document.getElementById('qn-gate-code');
    var error = document.getElementById('qn-gate-error');
    var form = overlay.querySelector('.qn-gate-form');

    setTimeout(function () { input.focus(); }, 60);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = input.value.trim().toLowerCase();
      if (!code) return;

      sha256(code).then(function (hash) {
        if (VALID_HASHES.indexOf(hash) !== -1) {
          try { localStorage.setItem(STORAGE_KEY, hash); } catch (err) { /* ok */ }
          overlay.remove();
          document.body.style.overflow = '';
          var children = document.body.children;
          for (var j = 0; j < children.length; j++) {
            children[j].style.filter = '';
            children[j].style.pointerEvents = '';
            children[j].style.userSelect = '';
            children[j].removeAttribute('aria-hidden');
            children[j].removeAttribute('inert');
          }
        } else {
          error.hidden = false;
          input.select();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildGate);
  } else {
    buildGate();
  }
})();
