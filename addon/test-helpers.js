import { helper } from '@ember/component/helper';
import { assign } from '@ember/polyfills';
import { strfmt } from './services/l10n';

export default function(context) {
  let tHelper = helper(([str], hash) => {
    return strfmt(str, assign({}, hash));
  });
  let ptHelper = helper(([str/*, ctxt*/], hash) => {
    return strfmt(str, assign({}, hash));
  });
  let nHelper = helper(([strSingular, strPlural, count], hash) => {
    return strfmt(count !== 1 ? strPlural : strSingular, assign({ count }, hash));
  });
  let pnHelper = helper(([strSingular, strPlural, count/*, ctxt*/], hash) => {
    return strfmt(count !== 1 ? strPlural : strSingular, assign({ count }, hash));
  });

  context.register('helper:t', tHelper);
  context.register('helper:n', nHelper);
  context.register('helper:pt', ptHelper);
  context.register('helper:pn', pnHelper);
}
