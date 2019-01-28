import { helper } from '@ember/component/helper';
import { assign } from '@ember/polyfills';
import { strfmt } from './services/l10n';
import { deprecate } from '@ember/application/deprecations';

export default function(context) {
  let tHelper = helper(([str], hash) => {
    return strfmt(str, assign({}, hash));
  });
  let ptHelper = helper(([str /* , ctxt*/], hash) => {
    return strfmt(str, assign({}, hash));
  });
  let nHelper = helper(([strSingular, strPlural, count], hash) => {
    return strfmt(
      count !== 1 ? strPlural : strSingular,
      assign({ count }, hash)
    );
  });
  let pnHelper = helper(([strSingular, strPlural, count /* , ctxt*/], hash) => {
    return strfmt(
      count !== 1 ? strPlural : strSingular,
      assign({ count }, hash)
    );
  });

  context.register('helper:t', tHelper);
  context.register('helper:n', nHelper);
  context.register('helper:pt', ptHelper);
  context.register('helper:pn', pnHelper);

  deprecate(
    `ember-l10n/test-helpers has been deprecated.
    You can use the helpers normally in your integration tests, without any further action.`,
    false,
    { id: 'ember-l10n.test-helpers', until: '4.0.0' }
  );
}
