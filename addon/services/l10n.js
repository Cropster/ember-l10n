import Ember from 'ember';

/**
 * This service translates through gettext.js.
 * There are two available methods to be used
 * for translations message ids from JS source:
 *
 * - t(msgid, hash);
 * - n(msgid, msgid_plural, count, hash);
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
 */
export default Ember.Service.extend(Ember.Evented, {
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
   * Currently available translations hash.
   *
   * @property availableLocales
   * @type {Object}
   * @public
   */
  availableLocales: Ember.computed(function(){
    return {
      'en': this.t('en')
    };
  }),

  /**
   * Reference to gettext library.
   *
   * @property _gettext
   * @type {String}
   * @default null
   * @private
   */
  _gettext: window.i18n(),

  /**
   * Cache persisting loaded JSON files to
   * avoid duplicated requests going out.
   *
   * @property _cache
   * @type {Object}
   * @default {}
   * @private
   */
  _cache: Ember.computed(function(){
    return {}; // complex type!
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
    if (!this.get("autoInitialize")) {
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
    const defaultLocale = this.get("defaultLocale");
    const locale = this.get("locale");
    if (Ember.isNone(locale)) {
      return defaultLocale;
    }

    return locale;
  },

  /**
   * Sets active locale if available.
   *
   * @method setLocale
   * @param {String} locale
   * @return {String}
   * @public
   */
  setLocale(locale) {
    if (!this.hasLocale(locale)) {
      return;
    }

    console.info(`l10n.js: Locale set to: "${locale}"`);
    this.get("_gettext").setLocale(locale);
    this.set("locale", locale);
    this._loadJSON();
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
    const availableLocales = this.get("availableLocales");
    const hasLocale = !Ember.isNone(availableLocales[locale]);
    if (!hasLocale) {
      console.warn(`l10n.js: Locale "${locale}" is not available!`);
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
    const defaultLocale = this.get("defaultLocale");
    const forceLocale = this.get("forceLocale");
    const navigator = window.navigator;
    let locale;

    // auto detect locale if no force locale
    if (Ember.isNone(forceLocale)) {

      // special case: android user agents
      if( navigator && navigator.userAgent &&
          (locale = window.navigator.userAgent.match(
            /android.*\W(\w\w)-(\w\w)\W/i
          ))
        ) {
        locale = locale[1];
      }

      // for all other browsers
      if (Ember.isNone(locale) && navigator) {
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

      locale = locale.substr(0,2);
    } else {
      locale = forceLocale;
    }

    // provide default locale if not available
    if (!this.hasLocale(locale)) {
      console.info(`l10n.js: Falling back to default language: "${defaultLocale}"!`);
      return defaultLocale;
    }

    // otherwise return detected locale
    if (Ember.isNone(forceLocale)) {
      console.info(`l10n.js: Automatically detected user language: "${locale}"`);
    } else {
      console.info(`l10n.js: Using forced locale: "${locale}"`);
    }

    return locale;
  },

  /**
   * Translates a singular form message id.
   *
   * @method t
   * @param {String} msgid
   * @param {Object} hash
   * @return {String}
   * @public
   */
  t(msgid,hash = {}) {
    if (Ember.typeOf(msgid)!=='string') {
      try{
        msgid = msgid.toString();
      } catch(e) {
        console.log('l10n.js: "msgid" param for t() should be either a string or an object implementing toString() method!');
        return msgid;
      }
    }

    return this._strfmt(this.get('_gettext').gettext(msgid),hash);
  },

  /**
   * Translates a plural form message id.
   *
   * @method n
   * @param {String} msgid
   * @param {String} msgid_plural
   * @param {Number} count
   * @param {Object} hash
   * @return {String}
   * @public
   */
  n(msgid,msgid_plural,count = 1,hash = {}) {
    if (Ember.typeOf(msgid)!=='string') {
      try{
        msgid = msgid.toString();
      } catch(e) {
        console.log('l10n.js: "msgid" param for n() should be either a string or an object implementing toString() method!');
        return msgid;
      }
    }

    if (Ember.typeOf(msgid_plural)!=='string') {
      try{
        msgid_plural = msgid_plural.toString();
      } catch(e) {
        console.log('l10n.js: "msgid_plural" param for n() should be either a string or an object implementing toString() method!');
        return msgid;
      }
    }

    return this._strfmt(this.get('_gettext').ngettext(msgid,msgid_plural,count),hash);
  },

  /**
   * Replaces placeholders like {{placeholder}} from string.
   *
   * @method _strfmt
   * @param {String} string
   * @param {Object} hash
   * @return {String}
   * @private
   */
  _strfmt(string,hash) {
    // don't process empty hashes
    if (Ember.isNone(hash)) {
      return string;
    }

    // find and replace all {{placeholder}}
    const pattern = /{{\s*([\w]+)\s*}}/g;
    const replace = (idx,match) => {
      let value = hash[match];
      if (Ember.isNone(value)) {
        return `{{${match}}}`;
      }

      if (Ember.typeOf(value)==='string') {
        value = this.get('_gettext').gettext(value);
      }

      return value;
    };

    return string.replace(pattern, replace);
  },

  /**
   * Loads current locale translation file.
   * Triggers `translation_loaded` event.
   *
   * @method _load
   * @return {Void}
   * @private
   */
  _loadJSON(){
    const cache = this.get("_cache");
    const locale = this.get("locale");
    const url = `${this.get("jsonPath")}/${locale}.json`;

    const successCallback = response => {
      const cachedResponse = Ember.copy(response,true);
      this.notifyPropertyChange('availableLocales');
      this.get('_gettext').loadJSON(response);
      this.trigger('translation_loaded');
      cache[locale] = cachedResponse;
    };

    const failureCallback = reason => {
      console.error(`l10n.js: An error occured loading "${url}": ${reason}`);
    };

    // used cache translation if present
    if (cache.hasOwnProperty(locale)) {
      successCallback(cache[locale]);
      return;
    }

    // otherwise load json file from assets
    Ember.$.ajax(
      {
        url: url,
        dataType: 'json'
      }
    ).then(
      Ember.run.bind(this,successCallback),
      Ember.run.bind(this,failureCallback)
    );
  }

});
