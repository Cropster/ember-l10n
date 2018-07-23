'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  let env = process.env.EMBER_ENV || 'development';

  let app = new EmberAddon(defaults, {
    pretender: {
      enabled: true
    },
    fingerprint: {
      enabled: env === 'production',
      generateAssetMap: true,
      fingerprintAssetMap: true,
      extensions: ['js', 'css', 'png', 'jpg', 'gif', 'map', 'svg', 'json']
    }
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  return app.toTree();
};
