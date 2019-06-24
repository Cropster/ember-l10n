'use strict';

module.exports = {
  name: require('./package').name,

  includedCommands() {
    return {
      'l10n:install': require('./lib/commands/install'),
      'l10n:extract': require('./lib/commands/extract'),
      'l10n:convert': require('./lib/commands/convert'),
      'l10n:sync': require('./lib/commands/sync'),
      'l10n:changes': require('./lib/commands/changes')
    };
  }
};
