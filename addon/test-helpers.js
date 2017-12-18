import { helper } from '@ember/component/helper';
import { strfmt } from './services/l10n';

export default function(context) {
  let tHelper = helper(([str]) => strfmt(str));
  let nHelper = helper(([strSingular, strPlural, count]) => {
    return strfmt(count !== 1 ? strPlural : strSingular);
  });

  context.register('helper:t', tHelper);
  context.register('helper:n', nHelper);
}
