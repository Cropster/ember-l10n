/*jshint node:true*/
module.exports = {
  description: 'Creates an initializer to configure ember-l10n service.',

  locals: function(options) {
    return {
      name: options.entity.name
    };
  }
};
