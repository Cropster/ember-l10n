import { get } from '@ember/object';
import THelper from './t';

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
export default THelper.extend({
  compute([msgid, msgidPlural, count], hash) {
    let l10n = get(this, 'l10n');

    if (!msgid) {
      return msgid;
    }

    return l10n.n(msgid, msgidPlural, count, hash);
  },
});
