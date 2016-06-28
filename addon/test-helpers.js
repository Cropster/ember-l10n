import Ember from 'ember';

function _strfmt(string, hash) {
  // don't process empty hashes
  if (Ember.isNone(hash)) {
    return string;
  }

  // find and replace all {{placeholder}}
  let pattern = /{{\s*([\w]+)\s*}}/g;
  let replace = (idx, match) => {
    let value = hash[match];
    if (Ember.isNone(value)) {
      return `{{${match}}}`;
    }

    if (Ember.typeOf(value) === 'string') {
      value = this.get('_gettext').gettext(value);
    }

    return value;
  };

  return string.replace(pattern, replace);
}

export default function(context) {
  let tHelper = Ember.Helper.helper(function([str]) {
    return _strfmt(str);
  });

  let nHelper = Ember.Helper.helper(function([strSingular, strPlural, count]) {
    let str = count > 1 ? strPlural : strSingular;
    return _strfmt(str);
  });

  context.register('helper:t', tHelper);
  context.register('helper:n', nHelper);
}
