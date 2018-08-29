'use strict';

module.exports = {
  name: 'ember-l10n',

  includedCommands: function() {
    return {
      'l10n:install': require('./lib/commands/install'),
      'l10n:extract': require('./lib/commands/extract'),
      'l10n:convert': require('./lib/commands/convert'),
      'l10n:sync': require('./lib/commands/sync')
    };
  }
};
