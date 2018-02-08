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
        name: 'xgettext-template',
        target: '^3.4.0'
      },
      {
        name: 'gettext-parser',
        target: '^1.3.0'
      },
      {
        name: 'ember-ajax'
      },
      {
        name: 'ember-cli-ifa'
      }
    ]);
  }
};
