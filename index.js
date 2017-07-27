/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-l10n',

  isDevelopingAddon: function() {
    // @see: https://ember-cli.com/extending/#link-to-addon-while-developing
    return false; // Set this to true for local development
  },

  includedCommands: function() {
    return {
      'l10n:install': require('./lib/commands/install'),
      'l10n:extract': require('./lib/commands/extract'),
      'l10n:convert': require('./lib/commands/convert'),
      'l10n:sync': require('./lib/commands/sync')
    };
  },

  included: function(app) {
    this._super.included(app);

    // In nested addons, app.bowerDirectory might not be available
    var bowerDirectory = app.bowerDirectory || 'bower_components';
    // In ember-cli < 2.7, this.import is not available, so fall back to use app.import
    var importShim = typeof this.import !== 'undefined' ? this : app;

    importShim.import(bowerDirectory + '/gettext.js/dist/gettext.min.js', {
      exports: {
        'i18n': [
          'default'
        ]
      }
    });
  }
};
