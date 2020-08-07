import { isNone, typeOf } from '@ember/utils';
import { get, set, computed } from '@ember/object';
import { Promise } from 'rsvp';
import Ember from 'ember';
import Service from '@ember/service';
import { assign } from '@ember/polyfills';
import { guessLocale } from '../utils/guess-locale';
import { A as array } from '@ember/array';
import { assert } from '@ember/debug';
import { getLocaleAssetMap } from 'ember-l10n/utils/get-locale-asset-map';
import { fetchJsonFile } from 'ember-l10n/utils/fetch-json-file';

/**
 * This service translates through gettext.js.
 * There are two available methods to be used
 * for translations message ids from JS source:
 *
 * - t(msgid, hash);
 * - tVar(msgid, hash);
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
 * @class L10n
 * @extends Ember.Service
 * @extends Ember.Evented
 * @public
 */
export default Service.extend({
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
   * Fallback locale for unavailable locales or
   * the language which is used for message ids.
   *
   * @property defaultLocale
   * @type {String}
   * @default 'en'
   * @public
   */
  defaultLocale: 'en',

  /**
   * Fallback plural form for unavaiable locales or
   * the language which is used for message ids.
   *
   * @property defaultPluralForm
   * @type {String}
   * @default 'nplurals=2; plural=(n != 1)'
   * @public
   */
  defaultPluralForm: 'nplurals=2; plural=(n != 1);',

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
   * Currently available translations hash.
   *
   * @property availableLocales
   * @type {Object}
   * @public
   */
  availableLocales: computed('locale', function () {
    return {
      en: this.t('en'),
    };
  }),

  /**
   * Wrapper for window object for mocking tests.
   *
   * @property _window
   * @type {Object}
   * @readOnly
   * @private
   */
  _window: computed(function () {
    return window || {};
  }),

  /**
   * Hashmap storing callable plural function
   * for each target language parsed from the
   * `plural-form` header of JSON files.
   *
   * @property _data
   * @type {Object}
   * @default {}
   * @private
   */
  _plurals: computed(function () {
    let pluralForm = get(this, 'defaultPluralForm');
    let locale = get(this, 'defaultLocale');
    let _plurals = {};

    _plurals[locale] = this._pluralFactory(pluralForm);

    return _plurals;
  }),

  /**
   * Hashmap storing loaded translations by
   * locale at runtime to avoid requests on
   * consequent invocations of `setLocale()`.
   *
   * @property _data
   * @type {Object}
   * @default {}
   * @private
   */
  _data: computed(function () {
    return {};
  }),

  /**
   * The map of locales to locale files to use.
   *
   * @property _localeMap
   * @type {Object}
   * @private
   */
  _localeMap: computed(function () {
    return getLocaleAssetMap();
  }),

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

    this._checkLocaleFiles();

    // Since FastBoot does not support XMLHttpRequest (which we use to usually load the locale .json files)
    // We embed the whole locale files in that scenario, and preload all the locales here
    // This way, no ajax requests need to be made in FastBoot
    if (typeof FastBoot !== 'undefined') {
      this._preloadLocaleFilesForFastBoot();
    }

    if (get(this, 'autoInitialize')) {
      this.setLocale(this.detectLocale());
    }
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
    let defaultLocale = get(this, 'defaultLocale');
    let locale = get(this, 'locale');

    return locale || defaultLocale;
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
      if (!this.hasLocale(locale, true)) {
        reject();
        return;
      }

      let successCallback = () => {
        set(this, 'locale', locale);
        resolve();
      };

      this._loadJSON(locale).then(successCallback, reject);
    });
  },

  /**
   * Checks if locale is available.
   *
   * @method setLocale
   * @param {String} locale
   * @param {Boolean} warnIfUnavailable
   * @return {Boolean}
   * @public
   */
  hasLocale(locale, warnIfUnavailable = false) {
    let availableLocales = get(this, 'availableLocales');
    let hasLocale = !!availableLocales[locale];
    if (!hasLocale && warnIfUnavailable) {
      this._log(`Locale "${locale}" is not available!`, 'warn');
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
    let defaultLocale = get(this, 'defaultLocale');
    let forceLocale = get(this, 'forceLocale');

    // auto detect locale if no force locale
    let locale = forceLocale || this.guessBrowserLocale();

    // provide default locale if not available
    if (!this.hasLocale(locale)) {
      this._log(`Falling back to default language: "${defaultLocale}"!`);
      return defaultLocale;
    }

    // otherwise return detected locale
    if (!forceLocale) {
      this._log(`Automatically detected user language: "${locale}"`);
    } else {
      this._log(`Using forced locale: "${locale}"`);
    }

    return locale;
  },

  /**
   * Get a list of desireable locales for the browser.
   * This will use navigator.languages if possible, and fall back to navigator.browserLanguage for IE11.
   *
   * @method _getBrowserLocales
   * @returns {Array<String>}
   * @private
   */
  _getBrowserLocales() {
    let navigator = get(this, '_window.navigator');
    let defaultLocale = get(this, 'defaultLocale') || 'en';

    if (!navigator) {
      return array([defaultLocale]);
    }

    let desiredLocales = navigator.languages || [navigator.browserLanguage];
    desiredLocales = array(desiredLocales.slice()).compact();
    if (!get(desiredLocales, 'length')) {
      return array([defaultLocale]);
    }

    return desiredLocales;
  },

  /**
   * Guess the best locale to use based on the browser locales & available locales.
   *
   * @method guessBrowserLocale
   * @return {String}
   * @public
   */
  guessBrowserLocale(allowSubLocales = false) {
    let defaultLocale = get(this, 'defaultLocale') || 'en';
    let availableLocales = Object.keys(get(this, 'availableLocales'));
    let desiredLocales = this._getBrowserLocales();

    return guessLocale(availableLocales, desiredLocales, {
      defaultLocale,
      allowSubLocales,
    });
  },

  /**
   * Translates a singular form message id.
   *
   * @method t
   * @param {String} msgid
   * @param {Object} hash
   * @param {String} msgctxt
   * @return {String}
   * @public
   */
  t(msgid, hash = {}, msgctxt = '') {
    let key = this._sanitizeKey(msgid);
    if (typeOf(key) !== 'string') {
      return msgid;
    }

    let [message] = this._getMessages(key, msgctxt);

    return strfmt(message || key, hash);
  },

  /**
   * Translates a plural form message id.
   *
   * @method n
   * @param {String} msgid
   * @param {String} msgidPlural
   * @param {Number} count
   * @param {Object} hash
   * @param {String} msgctxt
   * @return {String}
   * @public
   */
  n(msgid, msgidPlural, count = 1, hash = {}, msgctxt = '') {
    let sKey = this._sanitizeKey(msgid);
    if (typeOf(sKey) !== 'string') {
      return msgid;
    }

    let pKey = this._sanitizeKey(msgidPlural);
    if (typeOf(pKey) !== 'string') {
      return msgid;
    }

    let plural = 0;
    let message = '';
    let locale = this.getLocale();
    let messages = this._getMessages(sKey, msgctxt);
    let pluralFunc = get(this, `_plurals.${locale}`);

    if (typeOf(pluralFunc) === 'function') {
      ({ plural } = pluralFunc(count));
      message = messages[plural];
    }

    message = message || (plural ? pKey : sKey);

    return strfmt(message, assign({ count }, hash));
  },

  /**
   * Translates a contextual singular form message id.
   *
   * @method pt
   * @param {String} msgid
   * @param {String} msgctxt
   * @param {Object} hash
   * @return {String}
   * @public
   */
  pt(msgid, msgctxt, hash = {}) {
    return this.t(msgid, hash, msgctxt);
  },

  /**
   * Translates a contextual plural form message id.
   *
   * @method pn
   * @param {String} msgid
   * @param {String} msgidPlural
   * @param {Number} count
   * @param {String} msgctxt
   * @param {Object} hash
   * @return {String}
   * @public
   */
  pn(msgid, msgidPlural, count, msgctxt, hash = {}) {
    return this.n(msgid, msgidPlural, count, hash, msgctxt);
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
   * Checks if a message id exists for current locale.
   *
   * @method exists
   * @param {String} msgid
   * @return {Boolean}
   * @public
   */
  exists(msgid, msgctxt = '') {
    let key = this._sanitizeKey(msgid);
    if (typeOf(key) !== 'string') {
      return false;
    }

    return !!this._readKey(key, msgctxt);
  },

  /**
   * Reads JSON data for given message id containing an array like:
   *
   * ```
   * [
   *   'ID of plural message' || null,
   *   'Translated singular',
   *   'Translated plural'
   * ]
   * ```
   *
   * @method _getMessages
   * @param {String} key
   * @param {String} ctxt
   * @return {Array}
   * @private
   */
  _getMessages(key, ctxt = '') {
    let json = this._readKey(key, ctxt);
    if (json === null) {
      return [];
    }

    return json.msgstr || [];
  },

  /**
   * Tries to lookup JSON data for given key and context.
   *
   * @method _readKey
   * @param {String} key
   * @param {String} ctxt
   * @return {Object|null}
   * @private
   */
  _readKey(key, ctxt = '') {
    let locale = get(this, 'locale');
    let _data = get(this, '_data');
    let json = _data[locale] || {};

    json = json.translations || {};
    json = json[ctxt] || json[''] || {};

    return json[key] || null;
  },

  /**
   * Sanitizes message ids by removing unallowed characters like whitespace.
   *
   * @method _sanitizeKey
   * @param {String} key
   * @return {String}
   * @private
   */
  _sanitizeKey(key) {
    if (typeOf(key) !== 'string') {
      try {
        key = key.toString();
      } catch (e) {
        this._log(
          'Message ids should be either a string or an object implementing toString() method!'
        );
        return key;
      }
    }

    return key.replace(/\s+/g, ' ');
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
      let _data = get(this, '_data');

      let successCallback = (response) => {
        if (get(this, 'isDestroyed')) {
          return;
        }

        this._saveJSON(response, locale);
        resolve();
      };

      let failureCallback = (reason) => {
        if (get(this, 'isDestroyed')) {
          return;
        }

        this._log(
          `An error occurred loading locale "${locale}": ${reason}`,
          'error'
        );
        reject(reason);
      };

      // used cached translation from hash map
      // eslint-disable-next-line no-prototype-builtins
      if (_data.hasOwnProperty(locale)) {
        successCallback(_data[locale]);
        resolve(_data[locale]);
        return;
      }

      // otherwise load json file from assets
      this._loadLocaleFile(locale).then(successCallback, failureCallback);
    });
  },

  /**
   * Saves locale's translation data in internal hash and extracts plural
   * form from `headers` to convert it to a callable for plural methods.
   *
   * We ignore the `language` in the JSON here, as we don't really care about that.
   * Instead, we just use the locale used for loading the JSON.
   *
   * @method _saveJSON
   * @param {Object} response
   * @param {String} locale
   * @return {Void}
   * @private
   */
  _saveJSON(response, locale) {
    let json = this._sanitizeJSON(response);

    let {
      headers: { 'plural-forms': pluralForm },
    } = json;

    set(this, `_data.${locale}`, json);
    set(this, `_plurals.${locale}`, this._pluralFactory(pluralForm, locale));
  },

  /**
   * Normalize the message ids in the JSON response
   * Otherwise, the lookup in this._getMessages() can sometimes fail.
   * The new extraction functionality leaves (some) whitespace intact, making message ids with e.g. newlines possible.
   * This breaks when looking up message keys.
   * To fix this, we normalize all message ids to plain whitespace.
   * Newlines and other whitespace in the message content remains intact.
   * This also ensures that with changing whitespace, messages will still be found later.
   *
   * @method _sanitizeJSON
   * @param {Object} json
   * @return {Object}
   * @private
   */
  _sanitizeJSON(json) {
    let { translations } = json;
    let sanitizedTranslations = {};

    Object.keys(translations).forEach((context) => {
      let items = translations[context];
      sanitizedTranslations[context] = {};

      Object.keys(items).forEach((messageId) => {
        let item = items[messageId];
        let sanitizedMessageId = messageId.replace(/\s+/g, ' ');
        sanitizedTranslations[context][sanitizedMessageId] = assign({}, item, {
          msgid: sanitizedMessageId,
        });
      });
    });

    return assign({}, json, { translations: sanitizedTranslations });
  },

  /**
   * Transforms and stores plural form it into a callable function.
   *
   * @method _pluralFactory
   * @param {String} pluralForm
   * @param {String} locale
   * @return {Void}
   * @private
   */
  _pluralFactory(pluralForm) {
    let defaultPluralForm = get(this, 'defaultPluralForm');

    if (
      !pluralForm ||
      !pluralForm.match(
        /^\s*nplurals=\s*[\d]+\s*;\s*plural\s*=\s*(?:[-+*/%?!&|=<>():;n\d\s]+);$/
      )
    ) {
      this._log(
        `Plural form "${pluralForm}" is invalid: 'nplurals=NUMBER; plural=EXPRESSION;' - falling back to ${defaultPluralForm}!`
      );
      pluralForm = defaultPluralForm;
    }

    return new Function(
      'n',
      `
      var nplurals, plural; ${pluralForm}

      switch (typeof plural) {
        case 'boolean':
          plural = plural ? 1 : 0;
          break;
        case 'number':
          plural = plural;
          break;
        default:
          plural = 0;
      }

      var max = nplurals - 1;
      if (plural > max) {
        plural = 0;
      }

      return {
        plural: plural,
        nplurals: nplurals
      };
    `
    );
  },

  /**
   * Check if all required locale files are available.
   *
   * @method _checkLocaleFiles
   * @private
   */
  _checkLocaleFiles() {
    let locales = get(this, 'availableLocales') || {};
    let localeMap = get(this, '_localeMap');

    Object.keys(locales).forEach((locale) => {
      assert(
        'Do not use the locale zh, as it is not a valid locale. Instead, use dedicated locales for traditional & simplified Chinese.',
        locale !== 'zh'
      );
      assert(
        `No locale file can be found for locale "${locale}".`,
        localeMap[locale]
      );
    });
  },

  /**
   * In FastBoot, the asset map does not contain the paths to the locale files,
   * but the actual locale file content.
   * We preload all locale content here, to avoid FastBoot needing to make network requests.
   *
   * @method _preloadLocaleFilesForFastBoot
   * @private
   */
  _preloadLocaleFilesForFastBoot() {
    let localeMap = get(this, '_localeMap');

    Object.keys(localeMap).forEach((locale) => {
      let content = JSON.parse(localeMap[locale]);
      this._saveJSON(content, locale);
    });
  },

  /**
   * Load a locale file.
   *
   * @method loadLocaleFile
   * @param {String} locale The name of the locale to load, e.g. en
   * @return {RSVP.Promise}
   * @public
   */
  _loadLocaleFile(locale) {
    let localeMap = get(this, '_localeMap');
    let fileName = get(localeMap, locale);
    return this.ajaxRequest(fileName);
  },

  /**
   * Actually make the Ajax request.
   *
   * @method ajaxRequest
   * @param {String} fileName
   * @return {Promise<Object>}
   * @protected
   */
  ajaxRequest(fileName) {
    return fetchJsonFile(fileName);
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
    // eslint-disable-next-line ember-suave/no-direct-property-access
    if (Ember.testing) {
      return;
    }

    if (!['log', 'warn', 'error'].indexOf(type) === -1) {
      type = 'log';
    }

    // eslint-disable-next-line no-console
    console[type](`l10n.js: ${str}`);
  },
});

/**
 * Replaces placeholders like {{placeholder}} from string.
 *
 * @public
 * @method strfmt
 * @param {String} string
 * @param {Object} hash
 * @return {String}
 */
export const strfmt = function (string, hash) {
  // ignore each invalid hash param
  if (typeOf(hash) !== 'object') {
    return string;
  }

  // find all: {{placeholderName}}
  let pattern = /{{\s*([\w]+)\s*}}/g;
  let replace = (idx, match) => {
    let value = hash[match];

    return isNone(value) ? `{{${match}}}` : value;
  };

  return string.replace(pattern, replace);
};
