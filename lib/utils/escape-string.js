/* eslint-env node */

'use strict';

module.exports = function escapeString(string) {
  return string.replace(
    /[-\/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );
};
