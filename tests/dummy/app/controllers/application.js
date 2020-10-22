import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  l10n: service(),

  selection: reads('l10n.locale'),
  languages: computed(function () {
    return {
      en: this.l10n.t('en'),
      de: this.l10n.t('de'),
      ko: this.l10n.t('ko'),
    };
  }),

  actions: {
    select(locale) {
      let { l10n } = this;
      l10n.setLocale(locale);
    },
  },
});
