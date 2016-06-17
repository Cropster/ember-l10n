import Ember from 'ember';
import L10n from 'ember-l10n/services/l10n';

export default L10n.extend({
  availableLocales: Ember.computed(function() {
    return {
      'en': this.t('en')
    };
  }),
  autoInitialize: true,
  jsonPath: '/assets/locales'
});
