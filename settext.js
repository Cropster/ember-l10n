/* jshint node:true */

//
// DEPENDENCIES
//
var fs = require('fs');

//
// HELPERS
//

// converts key like: n:1,2 -> n
var normalizeKey = function(key) {
  "use strict";

  return key.replace(
    /([a-zA-Z0-9_])(?:[0-9:,]*)/g,
    "$1"
  );
};

// escapes strings for regex usage
var escapeString = function(string) {
   "use strict";

  return string.replace(
    /[-\/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );
};

// primitive function to do replacement
var replaceFile = function(file,regex,msgstr,msgstrPlural) {
  "use strict";

  // read source file contents synchronously
  var data = fs.readFileSync(file, 'utf8');

  // now convert msgstr to msgid in content string
  var newData = data.replace(
    regex,
    "$1" + escapeString(msgstr) + "$3" +
    "$4" + (escapeString(msgstrPlural)||"") + "$6"
  );

  // write new data back to source file
  fs.writeFileSync(file, newData, 'utf8');

  // provide changed state for consumer
  console.log(data !== newData ? 1 : 0);
};

/**
 * Replaces msgid with msgstr both for singular and plural form in JS files.
 *
 * @param {String} file Path to JS file.
 * @param {String} key Keyword used in JS file.
 * @param {String} msgid Message id from PO file.
 * @param {String} msgstr Singular message string.
 * @param {String} [msgidPlural] Plural message id.
 * @param {String} [msgstrPlural] Plural message string.
 */
module.exports.replaceJS = function(file,key,msgid,msgstr,msgidPlural,msgstrPlural) {
  "use strict";

  // prepare regular expression to match both singular
  // and plural method calls within JS sources:
  // Example:
  //  this.get("l10n").t(
  //    "My string with {{placeholder}}.",
  //    { placeholder: someDynamicValue }
  //  );
  var regex = new RegExp(
    "(\\\." +
      normalizeKey(key) +
    "\\\((?:\\\s*)(?:'|\\\"))" +                    // = $1
    "(" + escapeString(msgid) + ")" +               // = $2
    "('|\\\")" +                                    // = $3
    "(?:" +
      "(\\\s*,\\\s*(?:'|\\\"))" +                   // = $4
      "(" + escapeString(msgidPlural||"") + ")" +   // = $5
      "('|\\\")" +                                  // = $6
    ")?",
    "g"
  );

  // forward to primitive method to do replace
  replaceFile(file,regex,msgstr,msgstrPlural);
};

/**
 * Replaces msgid with msgstr both for singular and plural form in HBS files.
 *
 * @param {String} file Path to JS file.
 * @param {String} key Keyword used in JS file.
 * @param {String} msgid Message id from PO file.
 * @param {String} msgstr Singular message string.
 * @param {String} [msgidPlural] Plural message id.
 * @param {String} [msgstrPlural] Plural message string.
 */
module.exports.replaceHBS = function(file,key,msgid,msgstr,msgidPlural,msgstrPlural) {
  "use strict";

  // prepare regular expression to match both singular
  // and plural template blocks and subexpressions:
  // Example:
  //  {{t
  //      "My string with {{placeholder}}"
  //      placeholder=someDynamicValue
  //  }}
  //
  //  (t
  //      "My string with {{placeholder}}"
  //      placeholder=someDynamicValue
  //  )
  var regex = new RegExp(
    "((?:\\\(|{{{?)" +
        normalizeKey(key) +
    "\\\s*(?:'|\\\"))" +                            // = $1
    "(" + escapeString(msgid) + ")" +               // = $2
    "('|\\\")" +                                    // = $3
    "(?:" +
      "(\\\s*(?:'|\\\"))" +                         // = $4
      "(" + escapeString(msgidPlural||"") + ")" +   // = $5
      "('|\\\")" +                                  // = $6
    ")?",
    "g"
  );

  // forward to primitive method to do replace
  replaceFile(file,regex,msgstr,msgstrPlural);
};
