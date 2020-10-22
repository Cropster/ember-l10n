import BaseHelper from './-base';

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
export default class PNHelper extends BaseHelper {
  compute([msgid, msgidPlural, count, msgctxt], hash) {
    let { l10n } = this;

    if (!msgid) {
      return msgid;
    }

    return l10n.pn(msgid, msgidPlural, count, msgctxt, hash);
  }
}
