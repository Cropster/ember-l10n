/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-l10n',

  included: function(app) {
    // @see: https://github.com/ember-cli/ember-cli/issues/3718
    this._super.included.apply(this, arguments);
    if (typeof app.import!=='function' && app.app) {
      app = app.app;
    }

    app.import('bower_components/gettext.js/dist/gettext.min.js',{
      exports: {
        'get-text': [
          'default'
        ]
      }
    });
  }
};
