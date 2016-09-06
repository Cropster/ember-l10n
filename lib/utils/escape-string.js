/* jshint node:true */

'use strict';

let fs = require('fs');

module.exports = function escapeString(string) {
  return string.replace(
    /[-\/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );
};
