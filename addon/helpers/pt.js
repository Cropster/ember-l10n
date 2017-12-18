import {
  get,
  observer
} from '@ember/object';
import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

/**
 * This helper provides contextual singular message, where context has to
 * be given as 4th argument, otherwise just works the same as `t` helper.
 *
 * ```html
 * {{pt 'This is {{variable}}.' variable=someBoundProperty 'context'}}
 * ```
 *
 * @namespace Helper
 * @class PT
 * @extends Ember.Helper
 * @public
 */
export default Helper.extend({
  l10n: service(),

  compute([msgid, msgctxt], hash) {
    let l10n = get(this, 'l10n');

    if (!msgid) {
      return msgid;
    }

    return l10n.pt(
      msgid,
      msgctxt,
      hash,
    );
  },

  _watchLocale: observer(
    'l10n.locale',
    function() {
      this.recompute();
    }
  )
});
