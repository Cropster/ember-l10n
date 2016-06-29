/* jshint node: true */
// jscs: disable
'use strict';

module.exports = {
  name: 'ember-l10n',

  isDevelopingAddon: function() {
    // @see: https://ember-cli.com/extending/#link-to-addon-while-developing
    return true;
  },

  includedCommands: function() {
    return {
      'l10n:extract': require('./lib/commands/extract'),
      'l10n:convert': require('./lib/commands/convert')
    };
  },

  included: function(app) {
    this._super.included(app);

    app.import(app.bowerDirectory + '/gettext.js/dist/gettext.min.js',{
      exports: {
        'i18n': [
          'default'
        ]
      }
    });
  }
};
