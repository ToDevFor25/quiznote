/* ============================================================
   QuizNote — Shared Profile + Event Helper
   ============================================================

   Purpose:
     Single source of truth for learner identity and round
     event logging across all QuizNote modules. Loaded once per
     module via <script src="qn-profile.js" defer></script>.

   Exposes one global: window.QN

   Three namespaces:
     QN.profile  — identity (create, list, switch, update, delete)
     QN.events   — round logging (log, query)
     QN.ui       — shared widgets (profile chip)

   Storage model (localStorage, all values JSON-encoded):
     qn_profiles      Array<Profile>   list of all profiles on device
     qn_activeProfile string | null    id of currently active profile
     qn_events        Array<Event>     append-only round log

   Forward-compatibility notes:
     - Profile ids are opaque 10-char random strings, NOT
       sequential. Safe to sync to a backend later.
     - Profiles carry syncedAt: null until claimed by a parent
       account (post-Supabase). syncedAt: <timestamp> means the
       profile has been pushed to the backend.
     - Event shape is final. Backend table will mirror this.

   Authored: May 2026. No external dependencies.
   ============================================================ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────

  var STORAGE_KEYS = {
    PROFILES:       'qn_profiles',
    ACTIVE_PROFILE: 'qn_activeProfile',
    EVENTS:         'qn_events',
    PENDING_EVENTS: 'qn_pendingEvents'  // anonymous rounds awaiting a profile
  };

  var MAX_EVENTS_PER_PROFILE = 5000;
  // Anonymous rounds held before a profile exists. Capped so a long
  // anonymous session can't grow storage without bound; oldest dropped.
  var MAX_PENDING_EVENTS = 50;

  // Color palette IDs match the design system tokens in each
  // module's CSS. Keep this list in sync with the onboarding
  // color picker in profile.html.
  var COLOR_OPTIONS = ['teal', 'sun', 'grape', 'coral', 'mint', 'rose'];

  // ─────────────────────────────────────────────────────────────
  // INTERNAL UTILITIES
  // ─────────────────────────────────────────────────────────────

  /**
   * Generate an opaque 10-char alphanumeric id.
   * 62^10 = enough entropy to never collide across devices.
   */
  function generateId() {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var id = 'p_';
    for (var i = 0; i < 10; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  /**
   * Read and JSON-parse a localStorage key.
   * Returns fallback (default []) on any error.
   */
  function readStorage(key, fallback) {
    if (fallback === undefined) fallback = [];
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[QN] readStorage failed for', key, e);
      return fallback;
    }
  }

  /**
   * JSON-stringify and write to localStorage.
   * Silently swallows quota errors so modules don't crash.
   */
  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[QN] writeStorage failed for', key, e);
      return false;
    }
  }

  /**
   * Read raw string from localStorage (no JSON parse).
   * Used for the active profile pointer.
   */
  function readStorageRaw(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeStorageRaw(key, value) {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // QN.profile — identity layer
  // ─────────────────────────────────────────────────────────────

  var profileAPI = {

    /**
     * Return the currently active profile object, or null.
     */
    getActive: function () {
      var id = readStorageRaw(STORAGE_KEYS.ACTIVE_PROFILE);
      if (!id) return null;
      var profiles = readStorage(STORAGE_KEYS.PROFILES, []);
      for (var i = 0; i < profiles.length; i++) {
        if (profiles[i].id === id) return profiles[i];
      }
      // active pointer points to a deleted profile; clear it
      writeStorageRaw(STORAGE_KEYS.ACTIVE_PROFILE, null);
      return null;
    },

    /**
     * Return array of all profiles on this device.
     */
    list: function () {
      return readStorage(STORAGE_KEYS.PROFILES, []);
    },

    /**
     * Create a new profile.
     *
     * @param {Object} data
     * @param {string} data.nickname    required, 1-20 chars
     * @param {string} [data.level]     'starting' | 'some' | 'while' | null
     * @param {string} [data.color]     one of COLOR_OPTIONS, defaults to 'teal'
     * @returns {Object} the new profile, or null if invalid input
     *
     * Also sets the new profile as active.
     */
    create: function (data) {
      if (!data || typeof data.nickname !== 'string') return null;
      var nickname = data.nickname.trim();
      if (nickname.length < 1 || nickname.length > 20) return null;

      var now = Date.now();
      var profile = {
        id:            generateId(),
        nickname:      nickname,
        level:         data.level || null,
        color:         (data.color && COLOR_OPTIONS.indexOf(data.color) >= 0)
                         ? data.color : 'teal',
        createdAt:     now,
        lastActiveAt:  now,
        syncedAt:      null  // becomes a timestamp once pushed to backend
      };

      var profiles = readStorage(STORAGE_KEYS.PROFILES, []);
      profiles.push(profile);
      writeStorage(STORAGE_KEYS.PROFILES, profiles);
      writeStorageRaw(STORAGE_KEYS.ACTIVE_PROFILE, profile.id);

      // Claim any anonymous rounds played before this profile existed.
      // Safe no-op if there are none.
      eventsAPI.backfill(profile.id);

      return profile;
    },

    /**
     * Switch the active profile by id.
     * Returns true on success, false if id not found.
     */
    setActive: function (id) {
      var profiles = readStorage(STORAGE_KEYS.PROFILES, []);
      var found = false;
      for (var i = 0; i < profiles.length; i++) {
        if (profiles[i].id === id) {
          profiles[i].lastActiveAt = Date.now();
          found = true;
          break;
        }
      }
      if (!found) return false;
      writeStorage(STORAGE_KEYS.PROFILES, profiles);
      writeStorageRaw(STORAGE_KEYS.ACTIVE_PROFILE, id);
      return true;
    },

    /**
     * Update fields on an existing profile.
     * Only nickname, level, and color can be updated.
     * Returns the updated profile, or null if not found.
     */
    update: function (id, data) {
      if (!data) return null;
      var profiles = readStorage(STORAGE_KEYS.PROFILES, []);
      for (var i = 0; i < profiles.length; i++) {
        if (profiles[i].id === id) {
          if (typeof data.nickname === 'string') {
            var nn = data.nickname.trim();
            if (nn.length >= 1 && nn.length <= 20) profiles[i].nickname = nn;
          }
          if (data.level !== undefined) {
            profiles[i].level = data.level;
          }
          if (data.color && COLOR_OPTIONS.indexOf(data.color) >= 0) {
            profiles[i].color = data.color;
          }
          writeStorage(STORAGE_KEYS.PROFILES, profiles);
          return profiles[i];
        }
      }
      return null;
    },

    /**
     * Delete a profile AND all its events.
     * If the deleted profile was active, active becomes null.
     * Returns true on success, false if id not found.
     */
    'delete': function (id) {
      var profiles = readStorage(STORAGE_KEYS.PROFILES, []);
      var filtered = [];
      var found = false;
      for (var i = 0; i < profiles.length; i++) {
        if (profiles[i].id === id) {
          found = true;
        } else {
          filtered.push(profiles[i]);
        }
      }
      if (!found) return false;

      writeStorage(STORAGE_KEYS.PROFILES, filtered);

      // also purge this profile's events
      var events = readStorage(STORAGE_KEYS.EVENTS, []);
      var remainingEvents = [];
      for (var j = 0; j < events.length; j++) {
        if (events[j].profileId !== id) remainingEvents.push(events[j]);
      }
      writeStorage(STORAGE_KEYS.EVENTS, remainingEvents);

      // clear active pointer if it pointed here
      if (readStorageRaw(STORAGE_KEYS.ACTIVE_PROFILE) === id) {
        writeStorageRaw(STORAGE_KEYS.ACTIVE_PROFILE, null);
      }

      return true;
    },

    /**
     * Expose color options so onboarding UI can render the picker
     * without hardcoding the same list.
     */
    colors: COLOR_OPTIONS.slice()
  };

  // ─────────────────────────────────────────────────────────────
  // QN.events — round logging layer
  // ─────────────────────────────────────────────────────────────

  var eventsAPI = {

    /**
     * Append one round event to the log.
     *
     * Modules call this from their summary-screen code when a
     * round completes. If no profile is active, the event is
     * NOT logged (anonymous play is not tracked).
     *
     * @param {Object} eventData
     * @param {string} eventData.module     e.g. 'note-names'
     * @param {string} eventData.tier       'easy' | 'medium' | 'tricky'
     * @param {number} eventData.length     total questions in round
     * @param {number} eventData.correct    correct answers
     * @param {number} eventData.total      attempted answers
     * @param {number} eventData.durationMs round duration in ms
     * @param {boolean} eventData.timedMode whether timer was on
     * @returns {boolean} true if logged, false if no active profile
     */
    log: function (eventData) {
      var active = profileAPI.getActive();
      if (!active) return false;
      if (!eventData || !eventData.module) return false;

      var event = {
        profileId:   active.id,
        module:      eventData.module,
        tier:        eventData.tier || null,
        length:      Number(eventData.length) || 0,
        correct:     Number(eventData.correct) || 0,
        total:       Number(eventData.total) || 0,
        durationMs:  Number(eventData.durationMs) || 0,
        timedMode:   !!eventData.timedMode,
        completedAt: Date.now()
      };

      var events = readStorage(STORAGE_KEYS.EVENTS, []);
      events.push(event);

      // Enforce per-profile cap: count events for THIS profile,
      // drop oldest if over cap. Other profiles' events untouched.
      var thisProfileCount = 0;
      for (var i = 0; i < events.length; i++) {
        if (events[i].profileId === active.id) thisProfileCount++;
      }
      if (thisProfileCount > MAX_EVENTS_PER_PROFILE) {
        var toRemove = thisProfileCount - MAX_EVENTS_PER_PROFILE;
        var pruned = [];
        for (var j = 0; j < events.length; j++) {
          if (events[j].profileId === active.id && toRemove > 0) {
            toRemove--;
            continue;
          }
          pruned.push(events[j]);
        }
        events = pruned;
      }

      writeStorage(STORAGE_KEYS.EVENTS, events);

      // touch lastActiveAt on the profile
      profileAPI.setActive(active.id);

      return true;
    },

    /**
     * Log a round if a profile is active; otherwise HOLD it as a
     * pending anonymous round so it can be back-filled when the
     * player makes a profile right after.
     *
     * Modules should call this (not log) from round-completion code.
     *
     * @param {Object} eventData  same shape as log()
     * @returns {string} 'logged' | 'held'
     */
    logOrHold: function (eventData) {
      if (!eventData || !eventData.module) return 'held';
      var active = profileAPI.getActive();
      if (active) {
        eventsAPI.log(eventData);
        return 'logged';
      }
      // No profile: stash a normalized event (without profileId) in
      // the pending slot. profileId is assigned at backfill time.
      var pending = readStorage(STORAGE_KEYS.PENDING_EVENTS, []);
      pending.push({
        module:      eventData.module,
        tier:        eventData.tier || null,
        length:      Number(eventData.length) || 0,
        correct:     Number(eventData.correct) || 0,
        total:       Number(eventData.total) || 0,
        durationMs:  Number(eventData.durationMs) || 0,
        timedMode:   !!eventData.timedMode,
        completedAt: Date.now()
      });
      // Cap: keep only the most recent MAX_PENDING_EVENTS.
      if (pending.length > MAX_PENDING_EVENTS) {
        pending = pending.slice(pending.length - MAX_PENDING_EVENTS);
      }
      writeStorage(STORAGE_KEYS.PENDING_EVENTS, pending);
      return 'held';
    },

    /**
     * How many anonymous rounds are currently held, awaiting a profile.
     * Modules use this to decide whether to show the "save your scores"
     * prompt on the summary screen.
     * @returns {number}
     */
    pendingCount: function () {
      return readStorage(STORAGE_KEYS.PENDING_EVENTS, []).length;
    },

    /**
     * Move all held anonymous rounds into the real event log under the
     * given profileId, then clear the pending slot. Called automatically
     * by profile.create(). Safe no-op if nothing is pending.
     * @param {string} profileId
     * @returns {number} how many events were back-filled
     */
    backfill: function (profileId) {
      if (!profileId) return 0;
      var pending = readStorage(STORAGE_KEYS.PENDING_EVENTS, []);
      if (!pending.length) return 0;

      var events = readStorage(STORAGE_KEYS.EVENTS, []);
      var n = 0;
      for (var i = 0; i < pending.length; i++) {
        var p = pending[i];
        if (!p || !p.module) continue;
        events.push({
          profileId:   profileId,
          module:      p.module,
          tier:        p.tier || null,
          length:      Number(p.length) || 0,
          correct:     Number(p.correct) || 0,
          total:       Number(p.total) || 0,
          durationMs:  Number(p.durationMs) || 0,
          timedMode:   !!p.timedMode,
          completedAt: Number(p.completedAt) || Date.now()
        });
        n++;
      }
      writeStorage(STORAGE_KEYS.EVENTS, events);
      writeStorage(STORAGE_KEYS.PENDING_EVENTS, []);
      return n;
    },

    /**
     * Query events for a profile, with optional filters.
     *
     * @param {string} profileId
     * @param {Object} [opts]
     * @param {string} [opts.module]  filter to one module
     * @param {number} [opts.since]   only events with completedAt >= since
     * @param {number} [opts.limit]   max results, most recent first
     * @returns {Array<Event>} matching events, newest first
     */
    query: function (profileId, opts) {
      if (!profileId) return [];
      opts = opts || {};
      var events = readStorage(STORAGE_KEYS.EVENTS, []);
      var results = [];
      for (var i = 0; i < events.length; i++) {
        var ev = events[i];
        if (ev.profileId !== profileId) continue;
        if (opts.module && ev.module !== opts.module) continue;
        if (opts.since && ev.completedAt < opts.since) continue;
        results.push(ev);
      }
      // newest first
      results.sort(function (a, b) { return b.completedAt - a.completedAt; });
      if (opts.limit && results.length > opts.limit) {
        results = results.slice(0, opts.limit);
      }
      return results;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // QN.ui — shared widgets
  // ─────────────────────────────────────────────────────────────

  var uiAPI = {

    /**
     * Render the profile chip into a container element.
     * The chip shows the active profile's nickname + color dot.
     * Tapping it navigates to profile.html (the switcher).
     *
     * If no profile is active, renders a subtle "Sign in" prompt
     * that links to profile.html.
     *
     * Call this once per page, after DOMContentLoaded, passing
     * the element where you want the chip mounted (typically a
     * top-right header slot).
     *
     * @param {HTMLElement} containerEl
     */
    chip: function (containerEl) {
      if (!containerEl) return;
      var active = profileAPI.getActive();

      // Clear container
      while (containerEl.firstChild) containerEl.removeChild(containerEl.firstChild);

      var link = document.createElement('a');
      link.href = 'profile.html';
      link.className = 'qn-chip';
      link.setAttribute('aria-label',
        active ? 'Switch profile (currently ' + active.nickname + ')'
               : 'Make a profile');

      // Inline styles so the chip works without any new CSS in
      // module files. Modules can override .qn-chip rules in
      // their own CSS if they want a tighter visual fit.
      link.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:8px',
        'padding:6px 12px 6px 8px',
        'border-radius:999px',
        'background:rgba(255,255,255,0.85)',
        'border:1px solid rgba(42,42,62,0.12)',
        'font-family:Fredoka,sans-serif',
        'font-weight:600',
        'font-size:14px',
        'color:#2A2A3E',
        'text-decoration:none',
        'cursor:pointer',
        'transition:background 140ms, transform 120ms'
      ].join(';');

      var dot = document.createElement('span');
      dot.style.cssText = [
        'display:inline-block',
        'width:18px',
        'height:18px',
        'border-radius:50%',
        'background:' + colorHex(active ? active.color : 'teal'),
        'flex-shrink:0'
      ].join(';');

      var label = document.createElement('span');
      label.textContent = active ? active.nickname : 'Sign in';

      link.appendChild(dot);
      link.appendChild(label);
      containerEl.appendChild(link);
    }
  };

  /**
   * Map color id to a hex value. Mirrors the design tokens used
   * across modules. Local to ui.chip so the chip can render
   * without depending on any specific module's CSS.
   */
  function colorHex(colorId) {
    switch (colorId) {
      case 'teal':  return '#1FB8A8';
      case 'sun':   return '#FFB627';
      case 'grape': return '#5B3FE4';
      case 'coral': return '#FF6B6B';
      case 'mint':  return '#7FD1AE';
      case 'rose':  return '#F4A5BE';
      default:      return '#1FB8A8';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EXPOSE GLOBAL NAMESPACE
  // ─────────────────────────────────────────────────────────────

  window.QN = window.QN || {};
  window.QN.profile = profileAPI;
  window.QN.events  = eventsAPI;
  window.QN.ui      = uiAPI;
  window.QN.version = '1.0.0';

})();
