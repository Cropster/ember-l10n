import L10n from 'ember-l10n/services/l10n';
import { computed } from '@ember/object';

export default L10n.extend({
  availableLocales: computed(function () {
    return {
      en: this.t('en'),
      de: this.t('de'),
      ko: this.t('ko'),
    };
  }),

  autoInitialize: true,
});
