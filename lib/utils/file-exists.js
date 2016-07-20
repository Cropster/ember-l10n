/* jshint node:true */

'use strict';

let fs = require('fs');

module.exports = function fileExists(file) {
  try {
    fs.accessSync(file, fs.F_OK);
  } catch (e) {
    return false;
  }

  return true;
};
