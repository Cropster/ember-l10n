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
        target: '^3.3.0'
      },
      {
        name: 'gettext.js',
        target: '^0.5.2'
      },
      {
        name: 'ember-ajax',
        target: '^2.5.3'
      }
    ]);
  }
};
