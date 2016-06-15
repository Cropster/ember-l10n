/*jshint node:true*/
module.exports = {
  description: 'Adds addons, packages and bower packages for ember-l10n',
  normalizeEntityName: function() {
    // allows us to run ember -g ember-l10n and not blow up
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
        }
    ]).then(() => {
      return this.addBowerPackagesToProject([
        {
          name: 'gettext.js',
          target: '^0.5.2'
        }
      ]);
    });
  }
};
