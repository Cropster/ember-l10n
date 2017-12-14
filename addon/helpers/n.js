import {
  get,
  observer
} from '@ember/object';
import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

/**
 * This helper provides gettext pluralization for message ids.
 * It takes singular and plural message ids as well as actual
 * amount as positional arguments. All placeholders can be
 * provided through named arguments (hash).
 *
 * ```html
 * {{n '{{count}} apple' '{{count}} apples' someBoundProperty}}
 * ```
 *
 * @namespace Helper
 * @class N
 * @extends Ember.Helper
 * @public
 */
export default Helper.extend({
  l10n: service(),

  compute([msgid, msgidPlural, count], hash) {
    let l10n = get(this, 'l10n');

    if (!msgid) {
      return msgid;
    }

    return l10n.n(
      msgid,
      msgidPlural,
      count,
      hash
    );
  },

  _watchLocale: observer(
    'l10n.locale',
    function() {
      this.recompute();
    }
  )
});
