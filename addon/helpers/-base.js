import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

export default class BaseHelper extends Helper {
  @service l10n;

  constructor() {
    super(...arguments);

    this._callback = () => this.recompute();
    this.l10n.registerLocaleChangeCallback(this._callback);
  }

  willDestroy() {
    this.l10n.unregisterLocaleChangeCallback(this._callback);
  }
}
