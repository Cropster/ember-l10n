/*jshint node:true*/
module.exports = {
  description: 'Creates an initializer to inject ember-l10n service.',
  locals: function(options) {
    return {
      name: options.entity.name
    };
  }
};
