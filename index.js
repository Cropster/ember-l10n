/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-l10n',

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
