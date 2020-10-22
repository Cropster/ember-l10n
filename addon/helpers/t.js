import BaseHelper from './-base';

/**
 * This helper provides gettext singularization for message ids.
 * It takes singular message id as positional arguments. All
 * placeholders can be provided through named arguments.
 *
 * ```html
 * {{t 'Your current role: {{role}}' role=someBoundProperty}}
 * ```
 *
 * @namespace Helper
 * @class T
 * @extends Ember.Helper
 * @public
 */
export default class THelper extends BaseHelper {
  compute([msgid], hash) {
    let { l10n } = this;

    if (!msgid) {
      return msgid;
    }

    return l10n.t(msgid, hash);
  }
}
