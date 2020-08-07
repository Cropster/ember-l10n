import { get } from '@ember/object';
import THelper from './t';

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
export default THelper.extend({
  compute([msgid, msgidPlural, count, msgctxt], hash) {
    let l10n = get(this, 'l10n');

    if (!msgid) {
      return msgid;
    }

    return l10n.pn(msgid, msgidPlural, count, msgctxt, hash);
  },
});
