import Ember from 'ember';

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
export default Ember.Helper.extend({
  l10n: Ember.inject.service(),

  compute([msgid], hash) {
    if (Ember.isNone(msgid)) {
      return msgid;
    }

    let trans = this.get('l10n').t(msgid, hash);
    return Ember.String.htmlSafe(trans);
  },

  _watchLocale: Ember.observer(
    'l10n.locale',
    function() {
      this.recompute();
    }
  )
});
