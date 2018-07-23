/* eslint-env node */
'use strict';

module.exports = {
  description: 'Adds addons, packages and bower packages for ember-l10n',
  normalizeEntityName() {
    // leave empty for main blueprint run by `ember install ember-l10n`
  },
  afterInstall() {
    return this.addPackagesToProject([
      {
        name: 'ember-ajax'
      },
      {
        name: 'ember-cli-ifa'
      }
    ]);
  }
};
