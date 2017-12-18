import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import Controller from '@ember/controller';
import { get } from '@ember/object';

export default Controller.extend({
  l10n: service(),

  selection: reads('l10n.locale'),
  languages: reads('l10n.availableLocales'),

  actions: {
    select(locale) {
      let l10n = get(this, 'l10n');
      l10n.setLocale(locale);
    }
  }
});
