/* jshint node:true */

'use strict';

module.exports = function findBy(array, key, value) {
  for (let i = 0, l = array.length; i < l; i++) {
    if (array[i] && array[i][key] === value) {
      return array[i];
    }
  }
};
