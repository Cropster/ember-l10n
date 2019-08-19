import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { tagName } from '@ember-decorators/component';

@tagName('span')
export default class MyClass {
  @service l10n;

  testFunc() {
    return this.l10n.t('test string');
  }

  @computed()
  get myProp() {
    return this.l10n.t('other test string - this@my-domain.com');
  }

  @reads('l10n.other') readsProp;
}
