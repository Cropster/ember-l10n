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

  init() {
    this._super(...arguments);
    this.get('l10n').on('translation_loaded', this, this.recompute);
  },

  willDestroy() {
    this._super(...arguments);
    this.get('l10n').off('translation_loaded', this, this.recompute);
  },

  compute([msgid], hash) {
    if (Ember.isNone(msgid)) {
      return msgid;
    }

    let trans = this.get('l10n').t(msgid, hash);
    return Ember.String.htmlSafe(trans);
  }
});
