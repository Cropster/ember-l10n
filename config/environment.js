'use strict';

module.exports = function(environment) {
  let ENV = {
    ifa: {
      enabled: false,
      inline: false
    }
  };

  if (environment === 'production') {
    ENV.ifa.enabled = true;
  }

  return ENV;
};
