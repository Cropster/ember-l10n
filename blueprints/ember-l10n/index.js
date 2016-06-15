/*jshint node:true*/
module.exports = {
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
