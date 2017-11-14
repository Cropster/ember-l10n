import Ember from 'ember';
import GetText from 'i18n';

const {
  computed,
  Service,
  inject,
  RSVP: { Promise },
  get,
  merge,
  copy,
  typeOf: getTypeOf,
  Evented,
  isNone,
  Logger,
  testing
} = Ember;

/**
 * This service translates through gettext.js.
 * There are two available methods to be used
 * for translations message ids from JS source:
 *
 * - t(msgid, hash);
 * - n(msgid, msgidPlural, count, hash);
 *
 * Furthermore, there's an auto initialization
 * feature (default: true), which detects user's
 * locale according to system preferences. If the
 * user's locale is supported in `availableLocales`,
 * the corresponding translations are loaded. If the
 * user's locale is not supported, the default locale
 * will be used instead (default: 'en'). Please use the
 * following method to change locales:
 *
 * - setLocale(locale);
 *
 * The following utility methods are also availalbe:
 *
 * - hasLocale(locale);
 * - detectLocale();
 *
 * To configure the path of the JSON files (depending on
 * the path configured via gettext.sh extractor) use the
 * `jsonPath` property (default: '/assets/locales').
 *
 * @namespace Service
 * @class L10N
 * @extends Ember.Service
 * @extends Ember.Evented
 * @public
 */
export default Service.extend(Evented, {
  // -------------------------------------------------------------------------
  // Dependencies

  ajax: inject.service('l10n-ajax'),

  // -------------------------------------------------------------------------
  // Properties

  /**
   * Current locale from user, defaults
   * to 'defaultLocale' if not retrievable
   * or currently available due to missing
   * translations.
   *
   * @property locale
   * @type {String}
   * @default null
   * @public
   */
  locale: null,

  /**
   * Use this property if you want to force
   * a specific locale and skip automatic
   * detection of user's system settings.
   * This is useful for signed in users,
   * but beware that unsupported locales
   * will fallback to the default locale!
   *
   * @property forceLocale
   * @type {String}
   * @default null
   * @public
   */
  forceLocale: null,

  /**
   * Fallback locale for unavailable locales.
   *
   * @property defaultLocale
   * @type {String}
   * @default 'en'
   * @public
   */
  defaultLocale: 'en',

  /**
   * Will invoke a language detection or loads
   * language from `forceLanguage` on service
   * instantiation. If disabling, make sure to
   * set locale manually with setLocale().
   *
   * @property autoInitialize
   * @type {String}
   * @default null
   * @public
   */
  autoInitialize: true,

  /**
   * Directory containing JSON files with all
   * translations for corresponding locale.
   *
   * @property jsonPath
   * @type {String}
   * @default 'assets/locales'
   * @public
   */
  jsonPath: '/assets/locales',

  /**
   * A map of fingerprints per language.
   * Overwrite this with your actual fingerprint map!
   *
   * @property fingerprintMap
   * @type {Object}
   * @protected
   */
  fingerprintMap: null,

  /**
   * Currently available translations hash.
   *
   * @property availableLocales
   * @type {Object}
   * @public
   */
  availableLocales: computed(function() {
    return {
      'en': this.t('en')
    };
  }),

  /**
   * Cache persisting loaded JSON files to
   * avoid duplicated requests going out.
   *
   * @property _cache
   * @type {Object}
   * @default {}
   * @private
   */
  _cache: computed(function() {
    return {}; // complex type!
  }),

  /**
   * The window object.
   * This can be overwritten for tests or similar.
   *
   * @property _window
   * @type {Object}
   * @readOnly
   * @private
   */
  _window: computed(function() {
    return window || {};
  }),

  /**
   * Reference to gettext library. This gets
   * lazily initialized within `init` method.
   *
   * @property _gettext
   * @type {String}
   * @default null
   * @private
   */
  _gettext: null,

  // -------------------------------------------------------------------------
  // Methods

  /**
   * Sets initial locale. If you want to to
   * skip language detection, please provide
   * `forceLocale` property with reopen().
   *
   * @method init
   * @return {Void}
   * @public
   */
  init() {
    this._super(...arguments);
    this.set('_gettext', new GetText());
    if (!this.get('autoInitialize')) {
      return;
    }

    this.setLocale(this.detectLocale());
  },

  /**
   * Provides current locale. If not set,
   * delivers default locale.
   *
   * @method setLocale
   * @param {String} locale
   * @return {String}
   * @public
   */
  getLocale() {
    let defaultLocale = this.get('defaultLocale');
    let locale = this.get('locale');
    if (isNone(locale)) {
      return defaultLocale;
    }

    return locale;
  },

  /**
   * Sets active locale if available. Returns a
   * RSPV Promise for asynchronous JSON request.
   *
   * @method setLocale
   * @param {String} locale
   * @return {RSVP.Promise}
   * @public
   */
  setLocale(locale) {
    return new Promise((resolve, reject) => {
      if (!this.hasLocale(locale)) {
        reject();
        return;
      }

      let old = this.getLocale();

      this.set('locale', locale);
      this.get('_gettext').setLocale(locale);

      let successCallback = () => {
        this.notifyPropertyChange('locale');
        this.notifyPropertyChange('availableLocales');

        resolve();
      };

      let failureCallback = () => {
        try {
          this.get('_gettext').setLocale(old);
          this.set('locale', old);
        } catch(e) {
          // probably destroyed
        }

        reject();
      };

      this._loadJSON(locale).then(
        successCallback,
        failureCallback
      );
    });
  },

  /**
   * Checks if locale is available.
   *
   * @method setLocale
   * @param {String} locale
   * @return {Boolean}
   * @public
   */
  hasLocale(locale) {
    let availableLocales = this.get('availableLocales');
    let hasLocale = !isNone(availableLocales[locale]);
    if (!hasLocale) {
      this._log(`l10n.js: Locale "${locale}" is not available!`, 'warn');
    }

    return hasLocale;
  },

  /**
   * Gets user's current client language and
   * provides extracted ISO-Code.
   *
   * @method detectLocale
   * @return {String}
   * @public
   */
  detectLocale() {
    let navigator = get(this, '_window.navigator');
    let defaultLocale = this.get('defaultLocale');
    let forceLocale = this.get('forceLocale');
    let locale;

    // auto detect locale if no force locale
    if (isNone(forceLocale)) {

      // special case: android user agents
      if (navigator && navigator.userAgent &&
        (locale = navigator.userAgent.match(
          /android.*\W(\w\w)-(\w\w)\W/i
        ))
      ) {
        locale = locale[1];
      }

      // for all other browsers
      if (isNone(locale) && navigator) {
        if (navigator.language) {
          locale = navigator.language;
        } else if (navigator.browserLanguage) {
          locale = navigator.browserLanguage;
        } else if (navigator.systemLanguage) {
          locale = navigator.systemLanguage;
        } else if (navigator.userLanguage) {
          locale = navigator.userLanguage;
        }
      }

      if (locale) {
        locale = locale.substr(0, 2);
      } else {
        locale = defaultLocale
          ? defaultLocale
          : "en";
      }

      locale = locale.substr(0, 2);
    } else {
      locale = forceLocale;
    }

    // provide default locale if not available
    if (!this.hasLocale(locale)) {
      this._log(`l10n.js: Falling back to default language: "${defaultLocale}"!`);
      return defaultLocale;
    }

    // otherwise return detected locale
    if (isNone(forceLocale)) {
      this._log(`l10n.js: Automatically detected user language: "${locale}"`);
    } else {
      this._log(`l10n.js: Using forced locale: "${locale}"`);
    }

    return locale;
  },

  /**
   * Translates a singular form message id.
   *
   * @method t
   * @param {String} msgid
   * @param {Object} hash
   * @return {String}
   * @public
   */
  t(msgid, hash = {}) {
    let key = this._sanitizeKey(msgid);
    if (getTypeOf(key)!=='string') {
      return key;
    }

    console.log(key);

    let message = this.get('_gettext').gettext(key);

    return this._strfmt(message, hash);
  },

  /**
   * Translate a singular string without indexing it.
   * This is useful when passing variables to it, e.g. `l10n.tVar(myVar)`
   * If you would use `l10n.t(myVar)` in this case, myVar would be (wrongly) parsed by `gettext.sh`.
   *
   * @method tVariable
   * @param {String} msgid
   * @param {Object} hash
   * @return {String}
   * @public
   */
  tVar(msgid, hash = {}) {
    return this.t(msgid, hash);
  },

  /**
   * Translates a plural form message id.
   *
   * @method n
   * @param {String} msgid
   * @param {String} msgidPlural
   * @param {Number} count
   * @param {Object} hash
   * @return {String}
   * @public
   */
  n(msgid, msgidPlural, count = 1, hash = {}) {
    let singularKey = this._sanitizeKey(msgid);
    if (getTypeOf(singularKey)!=='string') {
      return singularKey;
    }

    let pluralKey = this._sanitizeKey(msgidPlural);
    if (getTypeOf(pluralKey)!=='string') {
      return singularKey;
    }

    let message = this.get('_gettext').ngettext(
      singularKey,
      pluralKey,
      count
    );

    hash = merge({ count }, hash);

    return this._strfmt(message, hash);
  },

  /**
   * Sanitizes message ids by removing unallowed characters like whitespace.
   *
   * @method _prepareKey
   * @param {String} key
   * @return {String}
   * @private
   */
  _sanitizeKey(key) {
    if (getTypeOf(key) !== 'string') {
      try {
        key = key.toString();
      } catch(e) {
        this._log('l10n.js: Message ids should be either a string or an object implementing toString() method!');
        return key;
      }
    }

    return key.replace(/\s+/g, ' ');
  },

  /**
   * Replaces placeholders like {{placeholder}} from string.
   *
   * @method _strfmt
   * @param {String} string
   * @param {Object} hash
   * @return {String}
   * @private
   */
  _strfmt(string, hash) {
    // don't process empty hashes
    if (isNone(hash)) {
      return string;
    }

    // find and replace all {{placeholder}}
    let pattern = /{{\s*([\w]+)\s*}}/g;
    let replace = (idx, match) => {
      let value = hash[match];
      if (isNone(value)) {
        return `{{${match}}}`;
      }

      return value;
    };

    return string.replace(pattern, replace);
  },

  /**
   * Loads current locale translation file.
   * Note that `locale` will trigger change
   * after loading JSON file, so watching the
   * `locale` informs about new translations!
   *
   * @method _loadJSON
   * @param {String} locale
   * @return {Void}
   * @private
   */
  _loadJSON(locale) {
    return new Promise((resolve, reject) => {
      let ajax = this.get('ajax');
      let cache = this.get('_cache');

      let fingerprintMap = get(this, 'fingerprintMap');
      let fingerprint = fingerprintMap ? get(fingerprintMap, locale) : null;

      let basePath = this.get('jsonPath');
      let path = fingerprint ? `${basePath}/${fingerprint}` : basePath;
      let url = `${path}/${locale}.json`;

      let successCallback = (response) => {
        let cachedResponse = copy(response, true);
        this.get('_gettext').loadJSON(response);

        cache[locale] = cachedResponse;
        resolve();
      };

      let failureCallback = (reason) => {
        this._log(`l10n.js: An error occurred loading "${url}": ${reason}`, 'error');
        reject();
      };

      // used cache translation if present
      if (cache.hasOwnProperty(locale)) {
        successCallback(cache[locale]);
        resolve(cache[locale]);
        return;
      }

      // otherwise load json file from assets
      ajax.request(url).then(
        successCallback,
        failureCallback
      );
    });
  },

  /**
   * Log a message.
   * When testing, this will be swallowed to keep the output clean.
   *
   * @method _log
   * @param {String} str
   * @param {'log'|'warn'|'error'} type
   * @private
   */
  _log(str, type = 'log') {
    if (testing) {
      return;
    }

    if (!['log', 'warn', 'error'].includes(type)) {
      type = 'log';
    }

    Logger[type](str);
  }

});
