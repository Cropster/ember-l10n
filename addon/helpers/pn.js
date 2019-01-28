import { get, observer } from '@ember/object';
import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

/**
 * This helper provides contextual plural message, where context has to
 * be given as 4th argument, otherwise just works the same as `n` helper.
 *
 * ```html
 * {{pn '{{count}} apple' '{{count}} apples' someBoundProperty 'context'}}
 * ```
 *
 * @namespace Helper
 * @class PN
 * @extends Ember.Helper
 * @public
 */
export default Helper.extend({
  l10n: service(),

  compute([msgid, msgidPlural, count, msgctxt], hash) {
    let l10n = get(this, 'l10n');

    if (!msgid) {
      return msgid;
    }

    return l10n.pn(msgid, msgidPlural, count, msgctxt, hash);
  },

  // eslint-disable-next-line ember/no-observers
  _watchLocale: observer('l10n.locale', function() {
    this.recompute();
  })
});
