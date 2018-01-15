import { computed } from '@ember/object';
import L10n from 'ember-l10n/services/l10n';

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
      'en': 'English'
    };
  }),

  /**
   * Flag indicating if service should try to detect user langugage
   * from browser settings and load/set the corresponding JSON file.
   *
   * @property autoInitialize
   * @type {boolean}
   * @public
   */
  autoInitialize: true

});
