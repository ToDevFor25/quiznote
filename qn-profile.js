/* ============================================================
   QuizNote — Shared Profile + Event Helper
   ============================================================

   Purpose:
     Single source of truth for learner identity and round
     event logging across all QuizNote modules. Loaded once per
     module via <script src="qn-profile.js" defer></script>.

   Exposes one global: window.QN

   Namespaces:
     QN.account  — owner/household (one per device): identity, cohort, trial
     QN.profile  — learner identity (create, list, switch, update, delete)
     QN.events   — round logging (log, query)
     QN.ui       — shared widgets (profile chip)
     QN.recommend— next-step suggestion

   Storage model (localStorage, all values JSON-encoded):
     qn_account       Account          the device's owner/household record
     qn_profiles      Array<Profile>   list of all learner profiles (<= 5)
     qn_activeProfile string | null    id of currently active profile
     qn_events        Array<Event>     append-only round log

   Account / household model (added v1.6.0):
     - One Account per device = the future owner/payer/consent holder.
       Up to MAX_PROFILES_PER_ACCOUNT (5) learner profiles hang beneath it.
     - Account.authId is null until claimed by a real Apple/Google
       identity (QN.account.linkAuth). Sign-in = identity only; it does
       NOT start the trial or take a card. Decoupled on purpose.
     - Account.pricingCohort stamps WHEN the account was born. Today's
       value is CURRENT_COHORT ('beta') — the founder tag. To "go live"
       later, change CURRENT_COHORT to 'standard' (one constant, below);
       existing 'beta' accounts keep their tag forever. Stripe maps each
       cohort to a price and never auto-migrates anyone.
     - 7-day trial: QN.account.startTrial() arms the clock. It is BUILT
       BUT NOT ARMED — nothing calls it yet. The future paywall fires it
       at the Stripe-subscription moment (card authorized), NOT at sign-in.
     - trialStatus() is ADVISORY / UX-ONLY. Real entitlement ("is this
       account paid / in-trial") MUST be server-authoritative once a
       backend exists — never gate a paid feature on this local value.

   Forward-compatibility notes:
     - All ids are opaque 10-char random strings, NOT sequential.
       Safe to sync to a backend later.
     - Account + Profiles carry syncedAt: null until pushed to the
       backend. syncedAt: <timestamp> means synced.
     - Profile.accountId links each learner to its owning account, so a
       local -> backend migration is an attach (link), not a rebuild.
     - Event shape is final. Backend table will mirror this.

   Authored: May 2026. No external dependencies.
   ============================================================ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────

  var STORAGE_KEYS = {
    ACCOUNT:        'qn_account',        // the device's owner/household record
    PROFILES:       'qn_profiles',
    ACTIVE_PROFILE: 'qn_activeProfile',
    EVENTS:         'qn_events',
    PENDING_EVENTS: 'qn_pendingEvents', // anonymous rounds awaiting a profile
    SCHEMA_VERSION: 'qn_schemaVersion'  // single global stamp; absent ⇒ treat as 0
  };

  // ── GO-LIVE LEVER ────────────────────────────────────────────
  // Every account is stamped with this cohort at birth. Today's users
  // are 'beta' (founders). The day you launch paid, change this ONE
  // string to 'standard' and redeploy — existing 'beta' accounts keep
  // their tag forever; only NEW accounts get the new stamp. Stripe maps
  // each cohort to a price and never auto-migrates anyone.
  var CURRENT_COHORT = 'beta';

  // Household cap: an account owns at most this many learner profiles.
  // create() enforces it (returns null when full). Marketing: "up to 5".
  var MAX_PROFILES_PER_ACCOUNT = 5;

  // Free-trial length, in days. The trial is BUILT BUT NOT ARMED:
  // startTrial() exists, nothing calls it yet. The future paywall fires
  // it at the Stripe moment, not at sign-in.
  var TRIAL_DAYS = 7;
  var DAY_MS = 24 * 60 * 60 * 1000;

  var MAX_EVENTS_PER_PROFILE = 5000;
  // Anonymous rounds held before a profile exists. Capped so a long
  // anonymous session can't grow storage without bound; oldest dropped.
  var MAX_PENDING_EVENTS = 50;

  // Current local-storage schema version. The hook (not the data) is
  // what's being installed here: today's shape IS v1, so the 0→1
  // migration is a no-op stamp. Future BREAKING shape changes
  // (rename/retype/restructure) bump this constant and add a
  // migrations[N] entry; additive changes (new optional fields) do
  // NOT need a version bump. Retrofitting versioning after unversioned
  // data is in the wild is the painful path — installing the hook
  // now keeps that door open. See project doc §4 storage playbook.
  var SCHEMA_VERSION = 1;

  // Color palette IDs match the design system tokens in each
  // module's CSS. Keep this list in sync with the onboarding
  // color picker in profile.html.
  var COLOR_OPTIONS = ['teal', 'sun', 'grape', 'coral', 'mint', 'rose'];

  // In-session record of any corrupt-data reads (see readStorage). Surfaced
  // via QN.diagnostics so corruption is checkable in the console during builds.
  var _corruptionLog = [];

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
   *
   * Corruption handling (v1.5.0): a parse failure means data EXISTED but is
   * unreadable — very different from "no data". Rather than silently treating
   * a corrupt blob as empty (which makes a user's history appear to vanish
   * with no trace), we (1) log it distinctly, (2) preserve the raw corrupt
   * value under a timestamped backup key so it's recoverable, and (3) still
   * return the safe fallback so the app keeps working. This makes a
   * corruption visible/recoverable during the build instead of a silent loss.
   */
  function readStorage(key, fallback) {
    if (fallback === undefined) fallback = [];
    var raw;
    try {
      raw = localStorage.getItem(key);
    } catch (e) {
      console.warn('[QN] localStorage unavailable for', key, e);
      return fallback;
    }
    if (raw === null || raw === undefined) return fallback;  // genuinely no data — normal
    try {
      return JSON.parse(raw);
    } catch (e) {
      // Data exists but won't parse → corruption. Preserve + flag, don't vanish silently.
      console.error('[QN] CORRUPT data at "' + key + '" — preserving a backup, falling back to empty.', e);
      try {
        var backupKey = key + '__corrupt_' + Date.now();
        localStorage.setItem(backupKey, raw);
        _corruptionLog.push({ key: key, backupKey: backupKey, at: Date.now() });
      } catch (e2) { /* backup is best-effort; never throw from a read */ }
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
  // Schema migrations
  //
  // Single global version stamp at qn_schemaVersion. Absent ⇒ 0.
  // migrations[N] runs the N→N+1 transformation. Each must be
  // idempotent — safe to re-run if interrupted mid-way. The version
  // is written ONLY after a step completes, so a failed migration
  // halts the chain and leaves the previous version intact.
  //
  // Today's data IS v1, so 0→1 is a no-op stamp. Future breaking
  // changes add migrations[1], migrations[2], etc., and bump
  // SCHEMA_VERSION above.
  // ─────────────────────────────────────────────────────────────

  function readSchemaVersion() {
    var raw = readStorageRaw(STORAGE_KEYS.SCHEMA_VERSION);
    if (raw == null) return 0;
    var v = Number(raw);
    return isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  }

  function writeSchemaVersion(v) {
    writeStorageRaw(STORAGE_KEYS.SCHEMA_VERSION, String(v));
  }

  var migrations = {
    // 0 → 1: current shape IS v1. Stamp it; no data transformation.
    0: function () { /* no-op */ }
  };

  function runMigrations() {
    var current = readSchemaVersion();
    while (current < SCHEMA_VERSION) {
      var step = migrations[current];
      if (typeof step === 'function') {
        try {
          step();
        } catch (e) {
          console.error('[QN] schema migration ' + current + ' → ' + (current + 1) + ' failed:', e);
          return; // halt chain; leave previous version intact
        }
      }
      current += 1;
      writeSchemaVersion(current);
    }
  }

  /**
   * Validate + normalize an optional per-skill tally object.
   * Input shape: { skillKey: { c: <correct>, t: <total> }, ... }
   * Returns a clean object, or null if there's nothing usable. Defensive
   * so a module passing junk can't corrupt the event log.
   */
  function sanitizeSkills(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var out = {};
    var any = false;
    for (var key in raw) {
      if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
      var v = raw[key];
      if (!v || typeof v !== 'object') continue;
      var c = Number(v.c) || 0;
      var t = Number(v.t) || 0;
      if (t <= 0) continue;            // skill with no attempts is meaningless
      if (c < 0) c = 0;
      if (c > t) c = t;                // clamp impossible values
      out[String(key)] = { c: c, t: t };
      any = true;
    }
    return any ? out : null;
  }

  // ─────────────────────────────────────────────────────────────
  // QN.profile — identity layer
  // ─────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────
  // ACCOUNT API  (owner / household — one per device)
  // ─────────────────────────────────────────────────────────────
  //
  // The Account is the future owner/payer/consent-holder. Today it's a
  // local record that exists mainly to (a) tag the founder cohort now,
  // while we still can, and (b) give profiles an owner to hang from so a
  // later backend migration is an attach, not a rebuild. Auth, Stripe,
  // and the trial clock all live here but are inert until wired.

  var accountAPI = {

    /**
     * Return the device's account, creating a local one on first call.
     * Idempotent — there is always exactly one account per device.
     */
    get: function () {
      var acct = readStorage(STORAGE_KEYS.ACCOUNT, null);
      if (acct && acct.id) return acct;

      var now = Date.now();
      acct = {
        id:            'a_' + generateId().slice(2), // opaque, 'a_' prefix
        authId:        null,           // set by linkAuth() at Apple/Google sign-in
        pricingCohort: CURRENT_COHORT, // 'beta' today = founder tag
        trialStartedAt: null,          // set by startTrial() (not armed yet)
        trialEndsAt:    null,
        createdAt:     now,
        syncedAt:      null            // becomes a timestamp once pushed to backend
      };
      writeStorage(STORAGE_KEYS.ACCOUNT, acct);
      return acct;
    },

    /**
     * How many more learner profiles this account may add (0..MAX).
     */
    seatsLeft: function () {
      var count = readStorage(STORAGE_KEYS.PROFILES, []).length;
      var left = MAX_PROFILES_PER_ACCOUNT - count;
      return left > 0 ? left : 0;
    },

    /**
     * Whether another learner profile can be created (under the cap).
     */
    canAddProfile: function () {
      return this.seatsLeft() > 0;
    },

    /**
     * Link a real auth identity (Apple/Google subject id) to this account.
     * Identity only — does NOT start the trial or take payment.
     * Returns the updated account.
     */
    linkAuth: function (authId) {
      if (!authId || typeof authId !== 'string') return null;
      var acct = this.get();
      acct.authId = authId;
      writeStorage(STORAGE_KEYS.ACCOUNT, acct);
      return acct;
    },

    /**
     * Arm the 7-day trial clock. BUILT BUT NOT ARMED — nothing calls this
     * yet. The future paywall calls it at the Stripe-subscription moment
     * (card authorized). Idempotent: won't restart a trial that already
     * started. Returns the updated account.
     */
    startTrial: function () {
      var acct = this.get();
      if (acct.trialStartedAt) return acct; // already started; never restart
      var now = Date.now();
      acct.trialStartedAt = now;
      acct.trialEndsAt    = now + TRIAL_DAYS * DAY_MS;
      writeStorage(STORAGE_KEYS.ACCOUNT, acct);
      return acct;
    },

    /**
     * ADVISORY / UX-ONLY trial state. Do NOT gate paid features on this —
     * real entitlement must be server-authoritative once a backend exists.
     * @returns {{ state:'none'|'active'|'expired', daysLeft:number, endsAt:number|null }}
     */
    trialStatus: function () {
      var acct = this.get();
      if (!acct.trialStartedAt || !acct.trialEndsAt) {
        return { state: 'none', daysLeft: 0, endsAt: null };
      }
      var remaining = acct.trialEndsAt - Date.now();
      if (remaining <= 0) {
        return { state: 'expired', daysLeft: 0, endsAt: acct.trialEndsAt };
      }
      return {
        state: 'active',
        daysLeft: Math.ceil(remaining / DAY_MS),
        endsAt: acct.trialEndsAt
      };
    }
  };

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

      // Enforce the household cap (up to MAX_PROFILES_PER_ACCOUNT learners).
      // Refusing here keeps the cap real, not advisory. Callers (profile.html)
      // already handle a null return as "couldn't create".
      if (!accountAPI.canAddProfile()) return null;

      // Ensure the owning account exists, so every profile is linked to one.
      var account = accountAPI.get();

      var now = Date.now();
      var profile = {
        id:            generateId(),
        accountId:     account.id,  // links learner -> owning account (household)
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
     * Wipe ALL QuizNote data from this device: every profile, the event
     * log, held anonymous rounds, the active pointer, and every module's
     * personal-best keys. Parent-friendly "start completely fresh" / shared-
     * device reset. Irreversible. Returns a small summary of what was cleared.
     *
     * PB keys are written by modules as "<slug>_pb_<tier>" and aren't in
     * STORAGE_KEYS, so we scan all localStorage keys and match the pattern —
     * this way new modules' PBs are caught automatically (no hardcoded list).
     *
     * @returns {{ profiles:number, events:number, pbKeys:number }}
     */
    resetDevice: function () {
      var summary = { profiles: 0, events: 0, pbKeys: 0 };
      try {
        summary.profiles = readStorage(STORAGE_KEYS.PROFILES, []).length;
        summary.events = readStorage(STORAGE_KEYS.EVENTS, []).length;
      } catch (e) {}

      // 1. the four known qn_* keys
      writeStorageRaw(STORAGE_KEYS.ACCOUNT, null);
      writeStorageRaw(STORAGE_KEYS.PROFILES, null);
      writeStorageRaw(STORAGE_KEYS.ACTIVE_PROFILE, null);
      writeStorageRaw(STORAGE_KEYS.EVENTS, null);
      writeStorageRaw(STORAGE_KEYS.PENDING_EVENTS, null);

      // 2. scan for per-module PB keys ("<slug>_pb_<tier>") and any stray
      //    qn_* keys, collect first then remove (don't mutate while iterating)
      try {
        var toRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (!k) continue;
          if (/_pb_/.test(k) || k.indexOf('qn_') === 0) toRemove.push(k);
        }
        for (var r = 0; r < toRemove.length; r++) {
          try { localStorage.removeItem(toRemove[r]); summary.pbKeys += (/_pb_/.test(toRemove[r]) ? 1 : 0); } catch (e) {}
        }
      } catch (e) {}

      return summary;
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
      // Optional per-skill tallies: { skillKey: { c, t } }. Additive —
      // events without it are valid; the dashboard treats them as
      // round-level only. See sanitizeSkills().
      var sk = sanitizeSkills(eventData.skills);
      if (sk) event.skills = sk;

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
      var active = profileAPI.getActive();

      // ACTIVE PROFILE: always log directly; never return the 'held'
      // signal for a signed-in user. (Bug fix v1.4.1: the old guard
      // `if (!eventData || !eventData.module) return 'held'` ran BEFORE
      // this check, so a malformed/slug-less event from an active user
      // returned 'held' — which, combined with any stranded pending
      // event, mis-fired the guest "save your scores?" prompt for a
      // well-established profile.)
      if (active) {
        // Drain any stranded pending events — they are meaningless once a
        // profile is active, and left lying around they keep pendingCount()
        // > 0, which is half of what mis-triggered the guest prompt.
        if (eventsAPI.pendingCount() > 0) {
          try { eventsAPI.backfill(active.id); } catch (e) {}
        }
        if (eventData && eventData.module) {
          eventsAPI.log(eventData);
          return 'logged';
        }
        // Malformed event but a real profile is active: do not log a junk
        // event, but never claim 'held'. Signal a no-op so the caller's
        // prompt stays hidden.
        return 'skipped';
      }

      // NO PROFILE (anonymous): a malformed event can't be held meaningfully.
      if (!eventData || !eventData.module) return 'skipped';

      // Stash a normalized event (without profileId) in the pending slot.
      // profileId is assigned at backfill time.
      var pending = readStorage(STORAGE_KEYS.PENDING_EVENTS, []);
      var held = {
        module:      eventData.module,
        tier:        eventData.tier || null,
        length:      Number(eventData.length) || 0,
        correct:     Number(eventData.correct) || 0,
        total:       Number(eventData.total) || 0,
        durationMs:  Number(eventData.durationMs) || 0,
        timedMode:   !!eventData.timedMode,
        completedAt: Date.now()
      };
      var heldSk = sanitizeSkills(eventData.skills);
      if (heldSk) held.skills = heldSk;
      pending.push(held);
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
        var ev = {
          profileId:   profileId,
          module:      p.module,
          tier:        p.tier || null,
          length:      Number(p.length) || 0,
          correct:     Number(p.correct) || 0,
          total:       Number(p.total) || 0,
          durationMs:  Number(p.durationMs) || 0,
          timedMode:   !!p.timedMode,
          completedAt: Number(p.completedAt) || Date.now()
        };
        var bfSk = sanitizeSkills(p.skills);
        if (bfSk) ev.skills = bfSk;
        events.push(ev);
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
    },

    /**
     * Shared confirm/quit modal (component — replaces per-module modal
     * markup + handlers). Renders a two-button dialog with the CANONICAL
     * arrangement locked in one place:
     *   - Quit / destructive action  = ghost button, LEFT
     *   - Keep / safe default action = solid green button, RIGHT
     * so the prominent easy tap is always the safe one. Change the
     * arrangement HERE and every module inherits it.
     *
     * General enough for any confirm (quit round, start timer, etc.) —
     * not quit-specific. Reuses an existing #modal-overlay if the module
     * still has one in its HTML; otherwise builds + appends its own, so a
     * module can delete its modal markup entirely.
     *
     * @param {Object} opts
     *   title         {string}            heading
     *   body          {string}            sub-text
     *   confirmLabel  {string}            solid/primary button text (the SAFE default, e.g. "Keep playing")
     *   cancelLabel   {string}            ghost button text (the destructive action, e.g. "Quit round")
     *   onConfirm     {function}          run when the primary (safe) button is tapped
     *   onCancel      {function}          run when the ghost (destructive) button is tapped
     *   dismissIsConfirm {boolean}        if true, backdrop/Escape = confirm (safe); default true
     *   onOpen        {function}          optional hook fired when shown (e.g. pause timer)
     *   onClose       {function}          optional hook fired when hidden (resume===arg)
     *
     * NOTE on semantics: the SOLID button is the "safe"/affirmative default
     * (confirmLabel/onConfirm). The GHOST button is the destructive action
     * (cancelLabel/onCancel). For a quit dialog: confirmLabel "Keep playing"
     * (onConfirm = resume), cancelLabel "Quit round" (onCancel = quit).
     */
    confirm: function (opts) {
      opts = opts || {};
      var ov = document.getElementById('qn-confirm-overlay') ||
               document.getElementById('modal-overlay');
      var built = false;
      if (!ov) {
        // Build a fresh overlay (module deleted its inline modal markup).
        ov = document.createElement('div');
        ov.id = 'qn-confirm-overlay';
        ov.className = 'modal-overlay';
        ov.hidden = true;
        ov.innerHTML =
          '<div class="modal-card">' +
            '<h2 class="qn-confirm-title"></h2>' +
            '<p class="qn-confirm-body"></p>' +
            '<div class="modal-actions">' +
              '<button class="btn ghost qn-confirm-cancel" type="button"></button>' +
              '<button class="btn qn-confirm-ok" type="button"></button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(ov);
        built = true;
      }

      // Resolve the parts whether built fresh or reusing inline markup.
      var titleEl  = ov.querySelector('.qn-confirm-title')  || ov.querySelector('#modal-title');
      var bodyEl   = ov.querySelector('.qn-confirm-body')   || ov.querySelector('#modal-body');
      var okEl     = ov.querySelector('.qn-confirm-ok')     || ov.querySelector('#modal-confirm');
      var cancelEl = ov.querySelector('.qn-confirm-cancel') || ov.querySelector('#modal-cancel');

      // Enforce canonical arrangement: ghost(cancel)=LEFT, solid(ok)=RIGHT.
      // Reorder the buttons in the DOM so order is consistent regardless of
      // how a reused inline modal had them written.
      if (okEl && cancelEl && okEl.parentNode) {
        var row = okEl.parentNode;
        row.appendChild(cancelEl); // cancel first => left
        row.appendChild(okEl);     // ok last => right
        cancelEl.className = 'btn ghost' + (cancelEl.classList.contains('qn-confirm-cancel') ? ' qn-confirm-cancel' : '');
        okEl.className = 'btn' + (okEl.classList.contains('qn-confirm-ok') ? ' qn-confirm-ok' : '');
      }

      if (titleEl)  titleEl.textContent  = opts.title || '';
      if (bodyEl)   bodyEl.textContent   = opts.body || '';
      if (okEl)     okEl.textContent     = opts.confirmLabel || 'OK';
      if (cancelEl) cancelEl.textContent = opts.cancelLabel || 'Cancel';

      var dismissIsConfirm = opts.dismissIsConfirm !== false; // default true

      function show() {
        ov.hidden = false;
        ov.classList.add('show');
        if (opts.onOpen) opts.onOpen();
      }
      function hide(wasConfirm) {
        ov.classList.remove('show');
        ov.hidden = true;
        okEl    && okEl.removeEventListener('click', okHandler);
        cancelEl&& cancelEl.removeEventListener('click', cancelHandler);
        ov.removeEventListener('click', backdropHandler);
        document.removeEventListener('keydown', keyHandler);
        if (opts.onClose) opts.onClose(wasConfirm);
      }
      function okHandler()     { hide(true);  if (opts.onConfirm) opts.onConfirm(); }
      function cancelHandler() { hide(false); if (opts.onCancel)  opts.onCancel(); }
      function backdropHandler(e) { if (e.target === ov) { if (dismissIsConfirm) okHandler(); else cancelHandler(); } }
      function keyHandler(e)   { if (e.key === 'Escape') { if (dismissIsConfirm) okHandler(); else cancelHandler(); } }

      okEl     && okEl.addEventListener('click', okHandler);
      cancelEl && cancelEl.addEventListener('click', cancelHandler);
      ov.addEventListener('click', backdropHandler);
      document.addEventListener('keydown', keyHandler);

      show();
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
  // RECOMMENDER  (weak-spot system, phase 2 — pure logic, no UI)
  //
  // QN.recommend.next(profileId) -> a single "what to practice next"
  // recommendation. Personality: encouraging + forward-moving, but it
  // doesn't let weak spots rot. Balanced (mostly progress, weak spots
  // woven in) with a no-nag cap so the same weak spot isn't served
  // back-to-back. Phase 3 (the "Today" surface) will consume this; the
  // function itself commits to no UI.
  //
  // DESIGN PRINCIPLE (evidence-based — see BUILD_LOG): learning research
  // favors INTERLEAVING (mixed question types) over blocked drilling, and
  // SPACING over massed repetition. So: (1) the recommender biases a round
  // toward a weak *module*, but the round itself must stay interleaved —
  // never collapse into a single-sub-skill blocked drill. (2) The no-nag
  // cap is the spacing effect, not just politeness: a weak spot resurfaces
  // later rather than back-to-back, which is the more effective pattern.
  // ─────────────────────────────────────────────────────────────

  // v1 linear path: live modules only, in the roster's pedagogical order.
  var PATH = [
    'note-names', 'note-values', 'time-signatures', 'accidentals', 'piano-quiz',
    'key-signatures', 'scales', 'scale-degrees', 'scale-modes',
    'intervals', 'ear-intervals',
    'primary-chords', 'roman-numerals', 'ear-scales'
  ];
  var TIER_ORDER = ['easy', 'medium', 'tricky'];

  var REC = {
    // tuning knobs (single place to re-tune the engine's feel)
    MIN_SAMPLES_FOR_WEAK: 4,    // need >= this many attempts before trusting an accuracy
    WEAK_THRESHOLD:       0.60, // sub-skill accuracy under this is "weak"
    SEVERE_THRESHOLD:     0.40, // under this is "severe" — jumps the queue
    RECENT_WINDOW:        20,   // how many recent rounds inform recency weighting
    NO_NAG_LOOKBACK:      2,    // don't re-serve a weak spot if it was the focus
                                //   of either of the last N recommendations-as-played
    TIER_UP_ACCURACY:     0.85, // clear a tier at >= this to advance to the next
    MIN_ROUNDS_PER_TIER:  2,    // and only after this many rounds at the tier
    DEFAULT_LENGTH:       10
  };

  function recencyWeight(idx, total) {
    // idx 0 = most recent. Linear decay from 1.0 (newest) to 0.4 (oldest
    // in window). Rounds beyond the window contribute nothing.
    if (idx >= REC.RECENT_WINDOW) return 0;
    var span = Math.min(total, REC.RECENT_WINDOW);
    if (span <= 1) return 1;
    return 1 - 0.6 * (idx / (span - 1));
  }

  var recommendAPI = {
    /**
     * Compute the next-practice recommendation for a profile.
     * Pure read over qn_events — no side effects, no UI.
     * @param {string} profileId
     * @returns {Object} {
     *   module, tier, length,
     *   kind: 'cold-start'|'remediation'|'progress'|'review',
     *   reason: string,
     *   weakSkills: [{ module, skill, acc, attempts }]   // may be empty
     * }
     */
    next: function (profileId) {
      var path = PATH.slice();
      var fallback = {
        module: path[0], tier: 'easy', length: REC.DEFAULT_LENGTH,
        kind: 'cold-start', reason: 'Start at the beginning.', weakSkills: []
      };
      if (!profileId) return fallback;

      var events = eventsAPI.query(profileId); // newest first
      if (!events || !events.length) return fallback;

      // ---- per-module rollups + recency-weighted sub-skill accuracy ----
      var perModule = {};   // slug -> { rounds, recentRoundAcc:[], skills:{ key:{wc,wt} } }
      for (var i = 0; i < events.length; i++) {
        var ev = events[i];
        if (path.indexOf(ev.module) === -1) continue; // ignore non-path modules
        if (!perModule[ev.module]) perModule[ev.module] = { rounds: 0, recentAcc: [], tierRounds: {}, tierAcc: {}, skills: {} };
        var pm = perModule[ev.module];
        pm.rounds++;
        var w = recencyWeight(i, events.length);

        if (i < REC.RECENT_WINDOW && ev.total > 0) pm.recentAcc.push(ev.correct / ev.total);

        var t = ev.tier || 'easy';
        pm.tierRounds[t] = (pm.tierRounds[t] || 0) + 1;
        if (ev.total > 0) {
          if (!pm.tierAcc[t]) pm.tierAcc[t] = { c: 0, n: 0 };
          pm.tierAcc[t].c += ev.correct; pm.tierAcc[t].n += ev.total;
        }

        if (ev.skills && w > 0) {
          for (var sk in ev.skills) {
            if (!Object.prototype.hasOwnProperty.call(ev.skills, sk)) continue;
            if (!pm.skills[sk]) pm.skills[sk] = { wc: 0, wt: 0 };
            pm.skills[sk].wc += ev.skills[sk].c * w;  // recency-weighted
            pm.skills[sk].wt += ev.skills[sk].t * w;
          }
        }
      }

      // ---- collect weak sub-skills across path modules ----
      var weak = [];
      for (var slug in perModule) {
        var sk2 = perModule[slug].skills;
        for (var key in sk2) {
          var wt = sk2[key].wt;
          if (wt < REC.MIN_SAMPLES_FOR_WEAK) continue; // not enough signal
          var acc = sk2[key].wc / wt;
          if (acc < REC.WEAK_THRESHOLD) {
            weak.push({ module: slug, skill: key, acc: acc, attempts: Math.round(wt), severe: acc < REC.SEVERE_THRESHOLD });
          }
        }
      }
      weak.sort(function (a, b) { return a.acc - b.acc; }); // weakest first

      // ---- no-nag: what were the last couple of things actually practiced? ----
      var recentModules = [];
      for (var r = 0; r < events.length && recentModules.length < REC.NO_NAG_LOOKBACK; r++) {
        if (path.indexOf(events[r].module) !== -1) recentModules.push(events[r].module);
      }

      // ---- 1. severe weak spot jumps the queue (unless just practiced) ----
      var severe = weak.filter(function (w2) { return w2.severe; });
      for (var s = 0; s < severe.length; s++) {
        if (recentModules.indexOf(severe[s].module) === -1) {
          var sv = severe[s];
          return {
            module: sv.module,
            tier: weakestTierFor(perModule[sv.module]),
            length: REC.DEFAULT_LENGTH,
            kind: 'remediation',
            reason: 'Let\u2019s shore up ' + sv.module + ' \u2014 ' + Math.round(sv.acc * 100) + '% on one part of it.',
            weakSkills: [sv]
          };
        }
      }

      // ---- 2. forward progress: first path module not yet "cleared" ----
      for (var p = 0; p < path.length; p++) {
        var mslug = path[p];
        var info = perModule[mslug];
        if (!info) {
          // never touched -> start it
          return {
            module: mslug, tier: 'easy', length: REC.DEFAULT_LENGTH,
            kind: 'progress',
            reason: 'New skill: time to start ' + mslug + '.',
            weakSkills: weak.filter(function (w3) { return w3.module === mslug; })
          };
        }
        var tier = nextTierFor(info);
        if (tier) {
          return {
            module: mslug, tier: tier, length: REC.DEFAULT_LENGTH,
            kind: 'progress',
            reason: tier === 'easy'
              ? 'Keep going on ' + mslug + '.'
              : 'You\u2019re ready for ' + tier + ' in ' + mslug + '.',
            weakSkills: weak.filter(function (w4) { return w4.module === mslug; })
          };
        }
        // else this module is cleared at all tiers -> continue to next
      }

      // ---- 3. everything cleared: review the weakest remaining spot, or
      //         the least-recently practiced module ----
      if (weak.length) {
        var firstNonRecent = weak.find(function (w5) { return recentModules.indexOf(w5.module) === -1; }) || weak[0];
        return {
          module: firstNonRecent.module,
          tier: weakestTierFor(perModule[firstNonRecent.module]),
          length: REC.DEFAULT_LENGTH,
          kind: 'review',
          reason: 'Sharpen ' + firstNonRecent.module + ' \u2014 still a soft spot.',
          weakSkills: [firstNonRecent]
        };
      }
      // truly all strong: gentle review of the least-recently-played module
      var lru = path.filter(function (m) { return recentModules.indexOf(m) === -1; })[0] || path[0];
      return {
        module: lru, tier: 'tricky', length: REC.DEFAULT_LENGTH,
        kind: 'review',
        reason: 'You\u2019re strong everywhere \u2014 a quick refresher on ' + lru + '.',
        weakSkills: []
      };

      // ---- helpers ----
      function nextTierFor(info) {
        // Returns the tier to practice next in this module, or null if the
        // module is "cleared" (all tiers practiced enough and accurate).
        for (var ti = 0; ti < TIER_ORDER.length; ti++) {
          var tr = TIER_ORDER[ti];
          var rounds = info.tierRounds[tr] || 0;
          var acc = info.tierAcc[tr] ? info.tierAcc[tr].c / info.tierAcc[tr].n : 0;
          if (rounds < REC.MIN_ROUNDS_PER_TIER) return tr;          // under-practiced
          if (acc < REC.TIER_UP_ACCURACY) return tr;                // not yet mastered
          // else cleared; check next tier
        }
        return null;
      }
      function weakestTierFor(info) {
        // For remediation: practice at the lowest tier that isn't mastered,
        // so we rebuild from where it broke down.
        for (var ti = 0; ti < TIER_ORDER.length; ti++) {
          var tr = TIER_ORDER[ti];
          var acc = info.tierAcc[tr] ? info.tierAcc[tr].c / info.tierAcc[tr].n : null;
          if (acc !== null && acc < REC.TIER_UP_ACCURACY) return tr;
        }
        return 'easy';
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // EXPOSE GLOBAL NAMESPACE
  // ─────────────────────────────────────────────────────────────

  window.QN = window.QN || {};
  window.QN.account   = accountAPI;
  window.QN.profile   = profileAPI;
  window.QN.events    = eventsAPI;
  window.QN.ui        = uiAPI;
  window.QN.recommend = recommendAPI;

  // Lightweight diagnostics surface (v1.5.0). During builds, run
  // QN.diagnostics.corruption() in the console to see if any stored key
  // failed to parse this session (and where its recoverable backup lives).
  window.QN.diagnostics = {
    corruption: function () { return _corruptionLog.slice(); },
    hasCorruption: function () { return _corruptionLog.length > 0; }
  };

  // Run schema migrations once at module init, before any consumer
  // reads the storage. Today this is a no-op stamp; the hook is what
  // matters — future breaking-shape changes plug in via migrations[].
  runMigrations();
  window.QN.schemaVersion = SCHEMA_VERSION;

  window.QN.version = '1.8.0';  // + schemaVersion migration hook (no-op stamp; future breaking shape changes plug into migrations[])

})();
