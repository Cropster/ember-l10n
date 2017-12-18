/* eslint-env node */
'use strict';

module.exports = {
  description: 'Creates an initializer to inject ember-l10n service.',
  locals(options) {
    return {
      name: options.entity.name
    };
  }
};
