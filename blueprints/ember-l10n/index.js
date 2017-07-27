/* global module */
module.exports = {
  description: 'Adds addons, packages and bower packages for ember-l10n',
  normalizeEntityName: function() {
    // allows us to run ember install ember-l10n and not blow up
    // because ember cli normally expects the format
    // ember generate <entitiyName> <blueprint>
  },
  afterInstall: function() {
    return this.addPackagesToProject([
      {
        name: 'xgettext-template',
        target: '^2.6.0'
      },
      {
        name: 'gettext.js',
        target: '^0.5.2'
      },
      {
        name: 'ember-ajax',
        target: '^2.4.1'
      }
    ]).then(() => {
      return this.addBowerPackagesToProject([
        {
          source: 'git://github.com/Cropster/gettext.js#master',
          name: 'gettext.js',
          target: ''
        }
      ]);
    });
  }
};
