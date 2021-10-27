import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import Controller from '@ember/controller';

export default class ApplicationController extends Controller {
  @service l10n;

  get selection() {
    return this.l10n.locale;
  }

  get languages() {
    return {
      en: this.l10n.t('en'),
      de: this.l10n.t('de'),
      ko: this.l10n.t('ko'),
    };
  }

  @action
  select(locale) {
    let { l10n } = this;
    l10n.setLocale(locale);
  }
}
