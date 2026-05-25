/* ============================================================
   qn-cloud.js — Cloud sync, account model, payment scaffolding
   ============================================================

   ⚠️  EVERYTHING IN THIS FILE SHIPS BEHIND FLAGS THAT ARE OFF.
   No sync fires, no account is created server-side, no network
   call is made, no payment is taken. This is plumbing and
   structure only. A later, deliberate, lawyer-gated flag flip
   turns each layer on. With all flags off, the app behaves
   exactly like the current local-only build.

   Loads AFTER qn-profile.js via:
     <script src="qn-cloud.js" defer></script>

   Extends window.QN with:
     QN.flags      — central feature-flag registry (source of truth)
     QN.cloud      — sync layer (offline-first, inert while flag off)
     QN.stripe     — Stripe Checkout scaffolding (inert while flag off)
     QN.consent    — child-profile consent gate (structurally locked)
     QN.geo        — US-scoping helpers (inert while flag off)

   Authored: May 2026. No external dependencies beyond qn-profile.js.
   ============================================================ */

(function () {
  'use strict';

  if (!window.QN) {
    console.error('[QN-cloud] qn-profile.js must load before qn-cloud.js');
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // §1  FEATURE FLAGS — the single source of truth
  //
  // Every flag defaults to OFF (false). Enabling ANY of these is a
  // deliberate, reviewable change — never an accidental default.
  // A build with all flags false === today's local-only app.
  //
  // To enable a flag for a release: change its value here and
  // redeploy. That's the flip — one constant, one file, obvious
  // in every diff.
  // ═══════════════════════════════════════════════════════════════

  var FLAGS = {
    // Master sync switch. When false, all cloud code paths are no-ops.
    // LAWYER-GATED: before flipping, update privacy.html and terms.html
    // to accurately describe data that now leaves the device. Flip ONLY
    // after legal review.
    SYNC_ENABLED:         false,

    // Adult-only beta mode: sync ON, payments OFF, child-profile
    // creation STRUCTURALLY DISABLED. This is the legally-cleaner
    // cloud-beta slice (adults only, no child data). Enable ONLY
    // after an accurate sync notice exists in privacy/terms.
    // LAWYER-GATED: requires updated data-handling notice.
    ADULT_BETA_MODE:      false,

    // Full account creation (sign-up flow, not just local account).
    // Requires SYNC_ENABLED. When false, account.get() still returns
    // the local-only account from qn-profile.js — no server call.
    // LAWYER-GATED: requires finalized privacy policy + terms.
    ACCOUNTS_ENABLED:     false,

    // Stripe payments. Requires ACCOUNTS_ENABLED.
    // LAWYER-GATED: requires payment terms in terms.html.
    PAYMENTS_ENABLED:     false,

    // Child-profile sync. This flag alone is NOT SUFFICIENT — see
    // §4 (consent gate) for the two-condition lockout.
    // LAWYER-GATED: requires COPPA/GDPR-K compliant consent mechanism.
    CHILD_SYNC_ENABLED:   false
  };

  // Expose as read-only snapshot (consumers check QN.flags.SYNC_ENABLED,
  // never mutate). The actual FLAGS object stays in closure scope.
  var flagsAPI = {};
  for (var k in FLAGS) {
    if (Object.prototype.hasOwnProperty.call(FLAGS, k)) {
      flagsAPI[k] = FLAGS[k];
    }
  }
  Object.freeze(flagsAPI);


  // ═══════════════════════════════════════════════════════════════
  // §2  ACCOUNT MODEL EXTENSIONS — adult-owner / child nesting
  //
  // qn-profile.js already has Account (one per device) with
  // authId, pricingCohort, trial clock, syncedAt. This section
  // extends the account schema for the adult/child hierarchy and
  // US-scoping, without modifying qn-profile.js.
  //
  // The local account record gains these fields (additive, all
  // default null/empty — back-compatible):
  //   - accountType: 'adult' | null  (null = legacy/untyped local)
  //   - country: 'US' | null         (set at signup, not before)
  //   - childProfiles: []            (ids of profiles marked as child)
  //   - consentReceipt: null         (populated by consent mechanism)
  //
  // Profiles gain:
  //   - profileType: 'adult' | 'child' | null  (null = legacy)
  //   - managedBy: <accountId> | null           (set for child profiles)
  // ═══════════════════════════════════════════════════════════════

  var ACCOUNT_STORAGE_KEY = 'qn_account';

  function readAccountRaw() {
    try {
      var raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeAccountRaw(acct) {
    try {
      localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(acct));
      return true;
    } catch (e) { return false; }
  }

  /**
   * Ensure the existing local account has the extended fields.
   * Additive migration — never removes existing fields, never bumps
   * schema version (these are optional fields).
   */
  function ensureExtendedAccount() {
    var acct = readAccountRaw();
    if (!acct || !acct.id) return null;
    var changed = false;
    if (acct.accountType === undefined) { acct.accountType = null; changed = true; }
    if (acct.country === undefined)     { acct.country = null;     changed = true; }
    if (!Array.isArray(acct.childProfiles)) { acct.childProfiles = []; changed = true; }
    if (acct.consentReceipt === undefined) { acct.consentReceipt = null; changed = true; }
    if (changed) writeAccountRaw(acct);
    return acct;
  }


  // ═══════════════════════════════════════════════════════════════
  // §3  SYNC LAYER — offline-first, flag-gated
  //
  // Local cache (localStorage) is the working copy. Cloud is the
  // source of truth WHEN ENABLED. On reconnect, reconcile using
  // the existing syncedAt / opaque-ID design from qn-profile.js.
  //
  // All public methods are no-ops while FLAGS.SYNC_ENABLED is false.
  // No network calls, no fetch, no XMLHttpRequest — structurally
  // inert, not just "probably won't fire."
  // ═══════════════════════════════════════════════════════════════

  var cloudAPI = {

    /**
     * True if sync is currently active and network operations will fire.
     */
    isActive: function () {
      return FLAGS.SYNC_ENABLED === true;
    },

    /**
     * Push local changes to the cloud.
     * NO-OP while FLAGS.SYNC_ENABLED is false.
     *
     * When enabled, this will:
     * 1. Collect profiles + events where syncedAt is null or stale
     * 2. POST to the sync endpoint
     * 3. On success, stamp syncedAt on each synced record
     *
     * @returns {Promise<{synced:number, errors:string[]}>}
     */
    push: function () {
      if (!FLAGS.SYNC_ENABLED) {
        return Promise.resolve({ synced: 0, errors: [] });
      }
      // FUTURE: implement actual push. Endpoint, auth headers, and
      // payload shape will be defined when the backend is built.
      // The contract is: POST unsynced records, receive confirmations,
      // stamp syncedAt locally.
      return Promise.resolve({ synced: 0, errors: ['sync not yet implemented'] });
    },

    /**
     * Pull cloud state and reconcile with local.
     * NO-OP while FLAGS.SYNC_ENABLED is false.
     *
     * Reconciliation strategy (offline-first):
     * - Cloud wins on conflicts (cloud is source of truth when enabled)
     * - Local-only records (syncedAt null) are pushed UP, not discarded
     * - Deleted records: tombstone approach (deletedAt timestamp)
     *
     * @returns {Promise<{pulled:number, conflicts:number, errors:string[]}>}
     */
    pull: function () {
      if (!FLAGS.SYNC_ENABLED) {
        return Promise.resolve({ pulled: 0, conflicts: 0, errors: [] });
      }
      // FUTURE: implement actual pull + reconcile.
      return Promise.resolve({ pulled: 0, conflicts: 0, errors: ['sync not yet implemented'] });
    },

    /**
     * Full sync cycle: pull then push.
     * The "airplane lands, reconnects" path.
     * NO-OP while FLAGS.SYNC_ENABLED is false.
     *
     * @returns {Promise<Object>}
     */
    sync: function () {
      if (!FLAGS.SYNC_ENABLED) {
        return Promise.resolve({ status: 'disabled' });
      }
      var self = this;
      return this.pull().then(function (pullResult) {
        return self.push().then(function (pushResult) {
          return {
            status: 'complete',
            pull: pullResult,
            push: pushResult
          };
        });
      });
    },

    /**
     * Mark a local record as needing sync (clear its syncedAt).
     * Called internally when local data changes. While sync is off,
     * this still clears syncedAt so that when sync IS enabled, the
     * record will be picked up. Harmless in local-only mode since
     * syncedAt is already null on new records.
     *
     * @param {'account'|'profile'|'event'} type
     * @param {string} id
     */
    markDirty: function (type, id) {
      // In local-only mode, syncedAt is already null. This method
      // exists so call sites are ready — it's a no-op that documents
      // intent.
      void(type); void(id);
    }
  };


  // ═══════════════════════════════════════════════════════════════
  // §4  CHILD-PROFILE CONSENT GATE — two-condition lockout
  //
  // ⚠️  CRITICAL SAFETY ARCHITECTURE ⚠️
  //
  // Creating a SYNCING child profile (a child's name/identifier that
  // leaves the device) requires BOTH of these conditions to be true
  // simultaneously:
  //
  //   Condition A: FLAGS.CHILD_SYNC_ENABLED === true
  //               (build/release flag — set by developer in this file)
  //
  //   Condition B: A consent mechanism function is registered AND
  //               returns a valid consent receipt.
  //               (code path that obtains verifiable parental consent)
  //
  // It is STRUCTURALLY IMPOSSIBLE to create a synced child profile
  // with only one condition met. This is not a default or a setting —
  // the code path that would create one does not exist until both
  // gates open.
  //
  // WHY: A child playing under an adult's local account is not
  // "collection" — it's local data under adult control. But a SYNCED
  // child profile (with a child's name/identifier transmitted to a
  // server) IS collection under COPPA, GDPR-K, and UK AADC. The beta
  // must not be able to create the latter. The consent mechanism
  // itself is lawyer-chosen and built in a later session; this code
  // only builds the LOCKOUT that refuses to open without it.
  //
  // LAWYER-GATED: the actual consent flow (what it asks, how it
  // verifies, what receipt it stores) must be designed with legal
  // counsel for COPPA / GDPR-K / UK AADC compliance.
  // ═══════════════════════════════════════════════════════════════

  // Consent mechanism slot. Starts null. A future build registers
  // the real implementation here. Until registered, Condition B is
  // structurally unmet.
  var _consentMechanism = null;

  var consentAPI = {

    /**
     * Register the consent mechanism. Called by the future consent
     * module once it's built and reviewed by counsel.
     *
     * @param {Object} mechanism
     * @param {function} mechanism.obtainConsent
     *   async fn that walks the parent through the consent flow.
     *   Must return a consent receipt object: { granted: true,
     *   method: string, timestamp: number, guardianId: string }
     *   or { granted: false }.
     * @param {function} mechanism.verifyReceipt
     *   fn(receipt) -> boolean. Validates a stored receipt is still
     *   current and not expired.
     */
    registerMechanism: function (mechanism) {
      if (!mechanism ||
          typeof mechanism.obtainConsent !== 'function' ||
          typeof mechanism.verifyReceipt !== 'function') {
        console.error('[QN-cloud] Invalid consent mechanism — must have obtainConsent() and verifyReceipt()');
        return false;
      }
      _consentMechanism = mechanism;
      return true;
    },

    /**
     * Check Condition B: is a consent mechanism registered?
     */
    hasMechanism: function () {
      return _consentMechanism !== null;
    },

    /**
     * The TWO-CONDITION GATE. Both must be true:
     *   A) FLAGS.CHILD_SYNC_ENABLED === true
     *   B) _consentMechanism is registered
     *
     * Returns true ONLY when both conditions are met.
     * Any code that would create a synced child profile MUST
     * call this first and refuse to proceed if false.
     */
    canCreateSyncedChildProfile: function () {
      // Condition A: flag
      if (FLAGS.CHILD_SYNC_ENABLED !== true) return false;
      // Condition B: mechanism present
      if (_consentMechanism === null) return false;
      return true;
    },

    /**
     * Attempt to create a synced child profile.
     * Enforces the two-condition gate, then runs the consent flow.
     *
     * @param {Object} profileData  { nickname, color, level }
     * @param {string} parentAccountId  the adult account that owns this child
     * @returns {Promise<{success:boolean, profile:Object|null, reason:string}>}
     */
    createChildProfile: function (profileData, parentAccountId) {
      // GATE: both conditions must be true
      if (!this.canCreateSyncedChildProfile()) {
        var missing = [];
        if (FLAGS.CHILD_SYNC_ENABLED !== true) missing.push('CHILD_SYNC_ENABLED flag is off');
        if (_consentMechanism === null) missing.push('no consent mechanism registered');
        return Promise.resolve({
          success: false,
          profile: null,
          reason: 'Child profile creation blocked: ' + missing.join('; ')
        });
      }

      // Run consent flow (async — the mechanism handles the UX)
      return _consentMechanism.obtainConsent(parentAccountId).then(function (receipt) {
        if (!receipt || receipt.granted !== true) {
          return { success: false, profile: null, reason: 'Consent not granted' };
        }

        // Consent granted — create the profile with child metadata
        var profile = QN.profile.create({
          nickname: profileData.nickname,
          color: profileData.color,
          level: profileData.level
        });

        if (!profile) {
          return { success: false, profile: null, reason: 'Profile creation failed (capacity?)' };
        }

        // Stamp child-specific fields onto the profile
        // (extends the profile object in localStorage)
        var profiles = JSON.parse(localStorage.getItem('qn_profiles') || '[]');
        for (var i = 0; i < profiles.length; i++) {
          if (profiles[i].id === profile.id) {
            profiles[i].profileType = 'child';
            profiles[i].managedBy = parentAccountId;
            profiles[i].consentReceipt = {
              method: receipt.method,
              timestamp: receipt.timestamp,
              guardianId: receipt.guardianId
            };
            break;
          }
        }
        localStorage.setItem('qn_profiles', JSON.stringify(profiles));

        // Also register the child in the parent account's list
        var acct = readAccountRaw();
        if (acct && Array.isArray(acct.childProfiles)) {
          acct.childProfiles.push(profile.id);
          writeAccountRaw(acct);
        }

        return { success: true, profile: profile, reason: 'ok' };
      });
    },

    /**
     * Check if an existing profile has valid consent for sync.
     * Always false if either gate condition is unmet.
     */
    hasValidConsent: function (profileId) {
      if (!this.canCreateSyncedChildProfile()) return false;
      if (!_consentMechanism) return false;

      var profiles = JSON.parse(localStorage.getItem('qn_profiles') || '[]');
      for (var i = 0; i < profiles.length; i++) {
        if (profiles[i].id === profileId && profiles[i].consentReceipt) {
          return _consentMechanism.verifyReceipt(profiles[i].consentReceipt);
        }
      }
      return false;
    }
  };


  // ═══════════════════════════════════════════════════════════════
  // §5  US-SCOPING — built into account creation from the start
  //
  // When account creation is later enabled, it must scope to the US.
  // These helpers enforce that constraint so it doesn't need to be
  // retrofitted. All inert until ACCOUNTS_ENABLED is flipped.
  //
  // Primary control: country selection at signup, limited to US.
  // Secondary (backup): geo-IP check.
  //
  // NOTE ON GEO-IP: It is a SECONDARY backup layer only. Geo-IP is
  // leaky (VPNs, proxies, corporate networks, mobile carriers) and
  // must NEVER be the sole control. The primary gate is explicit
  // country selection at signup. Geo-IP is a soft warning/redirect
  // for obviously-non-US users, not an enforcement mechanism.
  //
  // LAWYER-GATED: "US-only" must be stated in terms.html before
  // accounts go live. Flag for legal review.
  // ═══════════════════════════════════════════════════════════════

  var ALLOWED_COUNTRIES = ['US'];

  var geoAPI = {

    /**
     * Check if a country code is in the allowed list.
     * @param {string} countryCode  ISO 3166-1 alpha-2
     * @returns {boolean}
     */
    isAllowedCountry: function (countryCode) {
      if (!countryCode || typeof countryCode !== 'string') return false;
      return ALLOWED_COUNTRIES.indexOf(countryCode.toUpperCase()) !== -1;
    },

    /**
     * Stamp the account's country during signup.
     * Rejects non-US countries. Inert if accounts not enabled.
     *
     * @param {string} countryCode
     * @returns {boolean} true if accepted
     */
    setAccountCountry: function (countryCode) {
      if (!FLAGS.ACCOUNTS_ENABLED) return false;
      if (!this.isAllowedCountry(countryCode)) return false;

      var acct = readAccountRaw();
      if (!acct) return false;
      acct.country = countryCode.toUpperCase();
      return writeAccountRaw(acct);
    },

    /**
     * Geo-IP lookup (SECONDARY backup — see note above).
     * Returns a promise resolving to { country: 'XX' } or null.
     * NO-OP (returns null) while ACCOUNTS_ENABLED is false.
     *
     * Uses a free, no-auth geo-IP service. The specific service
     * will be chosen at implementation time; this is the interface
     * contract.
     */
    detectCountry: function () {
      if (!FLAGS.ACCOUNTS_ENABLED) {
        return Promise.resolve(null);
      }
      // FUTURE: call a geo-IP service. Something like:
      // return fetch('https://...').then(r => r.json())
      //   .then(data => ({ country: data.country_code }))
      //   .catch(() => null);
      return Promise.resolve(null);
    },

    /**
     * Pre-signup check: is the user likely in an allowed country?
     * Combines explicit selection (primary) with geo-IP (secondary).
     *
     * @param {string} selectedCountry  user's explicit selection
     * @returns {Promise<{allowed:boolean, method:string, country:string|null}>}
     */
    validateForSignup: function (selectedCountry) {
      if (!FLAGS.ACCOUNTS_ENABLED) {
        return Promise.resolve({ allowed: false, method: 'disabled', country: null });
      }

      // Primary gate: explicit country selection
      if (!this.isAllowedCountry(selectedCountry)) {
        return Promise.resolve({
          allowed: false,
          method: 'explicit-selection',
          country: selectedCountry
        });
      }

      // Primary passed — optionally cross-check with geo-IP as a
      // soft signal (never the sole gate).
      return this.detectCountry().then(function (geo) {
        return {
          allowed: true,
          method: 'explicit-selection',
          country: selectedCountry,
          geoHint: geo ? geo.country : null
        };
      });
    }
  };


  // ═══════════════════════════════════════════════════════════════
  // §6  STRIPE SCAFFOLDING — data-minimizing, flag-off
  //
  // Structure for Stripe Checkout / hosted payment fields so card
  // data goes DIRECTLY to Stripe, never touching our backend.
  // This keeps PCI scope minimal (SAQ-A eligible).
  //
  // ⚠️  DO NOT build a custom card form that sends card data
  // through our server. Stripe Checkout or Stripe Elements with
  // direct tokenization is the ONLY acceptable pattern.
  //
  // No Stripe calls fire in this build. Structure only.
  //
  // LAWYER-GATED: payment terms, refund policy, and subscription
  // terms must be in terms.html before PAYMENTS_ENABLED is flipped.
  // ═══════════════════════════════════════════════════════════════

  var stripeAPI = {

    /**
     * True if payments are active. Requires BOTH flags.
     */
    isActive: function () {
      return FLAGS.ACCOUNTS_ENABLED === true && FLAGS.PAYMENTS_ENABLED === true;
    },

    /**
     * Redirect to Stripe Checkout for subscription.
     * NO-OP while payments disabled.
     *
     * Stripe Checkout is a hosted page — the user leaves our site,
     * enters card details on Stripe's domain, and returns. Our
     * server NEVER sees card data. This is the data-minimizing
     * pattern that keeps us at SAQ-A PCI scope.
     *
     * @param {Object} opts
     * @param {string} opts.priceId     Stripe Price ID for the plan
     * @param {string} opts.accountId   local account ID for metadata
     * @param {string} opts.successUrl  redirect after successful payment
     * @param {string} opts.cancelUrl   redirect if user cancels
     * @returns {Promise<{redirected:boolean, error:string|null}>}
     */
    checkout: function (opts) {
      if (!this.isActive()) {
        return Promise.resolve({ redirected: false, error: 'payments disabled' });
      }
      if (!opts || !opts.priceId || !opts.accountId) {
        return Promise.resolve({ redirected: false, error: 'missing required fields' });
      }

      // Decline non-US accounts (US-scoping enforcement at payment time)
      var acct = readAccountRaw();
      if (!acct || !geoAPI.isAllowedCountry(acct.country)) {
        return Promise.resolve({ redirected: false, error: 'account country not eligible' });
      }

      // FUTURE: create a Checkout Session via our backend API, then
      // redirect to Stripe. Something like:
      //
      // return fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     priceId: opts.priceId,
      //     accountId: opts.accountId,
      //     cohort: acct.pricingCohort,
      //     successUrl: opts.successUrl,
      //     cancelUrl: opts.cancelUrl
      //   })
      // })
      // .then(function (r) { return r.json(); })
      // .then(function (data) {
      //   window.location.href = data.checkoutUrl;
      //   return { redirected: true, error: null };
      // })
      // .catch(function (err) {
      //   return { redirected: false, error: err.message };
      // });

      return Promise.resolve({ redirected: false, error: 'stripe not yet implemented' });
    },

    /**
     * Check subscription status for an account.
     * NO-OP while payments disabled.
     *
     * ADVISORY ONLY — real entitlement must be server-authoritative.
     * This is the client-side UX hint, mirroring the pattern in
     * qn-profile.js trialStatus().
     *
     * @param {string} accountId
     * @returns {Promise<{status:'none'|'active'|'past_due'|'canceled', error:string|null}>}
     */
    subscriptionStatus: function (accountId) {
      if (!this.isActive()) {
        return Promise.resolve({ status: 'none', error: 'payments disabled' });
      }
      // FUTURE: query backend for Stripe subscription status.
      return Promise.resolve({ status: 'none', error: 'not yet implemented' });
    },

    /**
     * Open the Stripe Customer Portal for subscription management.
     * NO-OP while payments disabled.
     *
     * @param {string} accountId
     * @returns {Promise<{redirected:boolean, error:string|null}>}
     */
    manageSubscription: function (accountId) {
      if (!this.isActive()) {
        return Promise.resolve({ redirected: false, error: 'payments disabled' });
      }
      // FUTURE: create a portal session via backend, redirect.
      return Promise.resolve({ redirected: false, error: 'not yet implemented' });
    }
  };


  // ═══════════════════════════════════════════════════════════════
  // §7  ADULT-BETA MODE SCAFFOLDING
  //
  // An intermediate operating mode between "local-only" and
  // "full launch":
  //   - Sync: ON (for adult profiles only)
  //   - Payments: OFF
  //   - Child-profile creation: STRUCTURALLY DISABLED
  //   - No solicitation of any child-identifying field
  //
  // This mode exists so the app can be cloud-tested with adults
  // before the full lawyer-gated launch that includes children,
  // payments, and consent mechanisms.
  //
  // When ADULT_BETA_MODE is true:
  //   - SYNC_ENABLED is treated as true (for adults)
  //   - PAYMENTS_ENABLED stays false
  //   - CHILD_SYNC_ENABLED stays false (AND consent gate blocks it)
  //   - Account creation is limited to type 'adult'
  //
  // LAWYER-GATED: still requires an accurate sync notice in
  // privacy.html and terms.html before enabling. The notice is
  // simpler than full launch (no child data, no payments) but
  // still needs legal review.
  // ═══════════════════════════════════════════════════════════════

  var adultBetaAPI = {

    /**
     * Whether adult-beta mode is currently active.
     */
    isActive: function () {
      return FLAGS.ADULT_BETA_MODE === true;
    },

    /**
     * Whether sync should be active for a given profile.
     * In adult-beta mode, sync is on for adult profiles only.
     * In full mode, defers to the main SYNC_ENABLED flag.
     */
    shouldSync: function (profileId) {
      if (!FLAGS.ADULT_BETA_MODE && !FLAGS.SYNC_ENABLED) return false;

      // In adult-beta mode, only sync adult profiles
      if (FLAGS.ADULT_BETA_MODE) {
        var profiles = JSON.parse(localStorage.getItem('qn_profiles') || '[]');
        for (var i = 0; i < profiles.length; i++) {
          if (profiles[i].id === profileId) {
            // child profiles never sync in adult-beta mode
            if (profiles[i].profileType === 'child') return false;
            return true;
          }
        }
        return false;
      }

      // Full mode: sync all (subject to child consent gate)
      return true;
    },

    /**
     * Whether the account creation flow should allow child profiles.
     * Always false in adult-beta mode. In full mode, delegates to
     * the consent gate.
     */
    canCreateChildProfile: function () {
      if (FLAGS.ADULT_BETA_MODE) return false;
      return consentAPI.canCreateSyncedChildProfile();
    }
  };


  // ═══════════════════════════════════════════════════════════════
  // §8  INITIALIZATION + NAMESPACE EXTENSION
  // ═══════════════════════════════════════════════════════════════

  // Ensure extended account fields exist (additive, safe)
  ensureExtendedAccount();

  // Extend QN namespace
  window.QN.flags   = flagsAPI;
  window.QN.cloud   = cloudAPI;
  window.QN.stripe  = stripeAPI;
  window.QN.consent = consentAPI;
  window.QN.geo     = geoAPI;
  window.QN.adultBeta = adultBetaAPI;

  window.QN.cloudVersion = '0.1.0';

})();
