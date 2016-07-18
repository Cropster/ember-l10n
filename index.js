/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-l10n',

  isDevelopingAddon: function() {
    // @see: https://ember-cli.com/extending/#link-to-addon-while-developing
    return false; // Set this to true for local development
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
