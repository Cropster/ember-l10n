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
 * @public
 */
export default Ember.Helper.extend({
  l10n: Ember.inject.service(),

  compute([msgid, msgidPlural, count], hash) {
    if (Ember.isNone(msgid)) {
      return msgid;
    }

    // If hash.count is not set, use the provided count positional param
    if (!get(hash, 'count')) {
      hash.count = count;
    }

    let trans = this.get('l10n').n(msgid, msgidPlural, count, hash);
    return Ember.String.htmlSafe(trans);
  },

  _watchLocale: Ember.observer(
    'l10n.locale',
    function() {
      this.recompute();
    }
  )
});
