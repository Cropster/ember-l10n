/*jshint node:true*/
module.exports = {
  description: 'Adds addons, packages and bower packages for ember-l10n',
  normalizeEntityName: function() {
    // allows us to run ember -g ember-l10n and not blow up
    // because ember cli normally expects the format
    // ember generate <entitiyName> <blueprint>
  },
  afterInstall: function() {
    return this.addAddonsToProject({
      packages: [
        {
          name: 'ember-cli-htmlbars',
          target: '^1.0.8'
        },
        {
          name: 'ember-truth-helpers',
          target: '^1.2.0'
        },
      ]
    }).then(() => {
      this.addAddonsToProject({
        packages: [
          {
            name: 'gettext.js',
            target: '^0.5.2'
          }
        ]
      });
    }).then(() => {
      this.addBowerPackagesToProject({
        packages: [
          {
            name: 'gettext.js',
            target: '^0.5.2'
          }
        ]
      });
    });
  }
};
