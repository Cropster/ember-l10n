import Ember from 'ember';

const { get } = Ember;

/**
 * This helper provides gettext pluralization for message ids.
 * It takes singular and plural message ids as well as actual
 * amount as positional arguments. All placeholders can be
 * provided through named arguments (hash).
 *
 * ```html
 * {{n '{{count}} apple' '{{count}} apples' someBoundProperty}}
 * ```
 *
 * @namespace Helper
 * @class N
 * @extends Ember.Helper
 */
export default Ember.Helper.extend({
  l10n: Ember.inject.service(),

  init(){
    this._super(...arguments);
    this.get('l10n').on('translation_loaded', this, this.recompute);
  },

  willDestroy(){
    this._super(...arguments);
    this.get('l10n').off('translation_loaded', this, this.recompute);
  },

  compute([msgid, msgid_plural, count], hash){
    if (Ember.isNone(msgid)) {
      return msgid;
    }

    // If hash.count is not set, use the provided count positional param
    if (!get(hash, 'count')) {
      hash.count = count;
    }

    let trans = this.get('l10n').n(msgid, msgid_plural, count, hash);
    return Ember.String.htmlSafe(trans);
  }
});
