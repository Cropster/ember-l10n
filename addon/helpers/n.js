import Ember from 'ember';

const {
  Helper,
  inject,
  isNone,
  get,
  merge,
  String: EmberString,
  observer
} = Ember;

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
export default Helper.extend({
  l10n: inject.service(),

  compute([msgid, msgidPlural, count], hash) {
    if (isNone(msgid)) {
      return msgid;
    }

    // If hash.count is not set, use the provided count positional param
    if (!get(hash, 'count')) {
      // hash should not be mutated
      hash = merge({}, hash);
      hash.count = count;
    }

    return this.get('l10n').n(
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
