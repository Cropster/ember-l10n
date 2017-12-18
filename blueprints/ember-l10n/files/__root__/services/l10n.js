import { computed } from '@ember/object';
import L10n from 'ember-l10n/services/l10n';
import l10nFingerprintMap from '../utils/l10n-fingerprint-map';

export default L10n.extend({
  /**
   * Defines available locales as hash map, where key corresponds
   * to ISO_639-1 country codes and value can be any truthy value.
   * By default, it's used to translate the language codes, which
   * could be used for a language drop down. Adjust the hash map
   * for each new language being added your translatable project.
   *
   * @property availableLocales
   * @type {object}
   * @public
   */
  availableLocales: computed('locale', function() {
    return {
      'en': this.t('en')
    };
  }),

  /**
   * Activation of fingerprint map living in app's/addon's `/utils`
   * directory. For opting out from fingerprinting set it to `null`.
   *
   * @property fingerprintMap
   * @type {object|null}
   * @public
   */
  fingerprintMap: l10nFingerprintMap,

  /**
   * Default path to loadable translations as JSON files. The install
   * process will generate an empty english JSON file for a kickstart.
   *
   * @property jsonPath
   * @type {string}
   * @public
   */
  jsonPath: '/assets/locales',

  /**
   * Flag indicating if service should try to detect user langugage
   * from browser settings and load/set the corresponding JSON file.
   *
   * @property autoInitialize
   * @type {boolean}
   * @public
   */
  autoInitialize: true,
});
