/**
 * This will traverse an l10n-JSON file, and call the callback function for each translation item.
 *
 * For example:
 *
 * ```js
 * traverseJson(json, (item) => delete item.comment);
 * ```
 *
 * @method traverseJson
 * @param {Object} json
 * @param {Function} callback
 * @public
 */
function traverseJson(json, callback) {
  let { translations } = json;

  Object.keys(translations).forEach((namespace) => {
    Object.keys(translations[namespace]).forEach((k) => {
      callback(translations[namespace][k], translations[namespace], k);
    });
  });
}

module.exports = {
  traverseJson
};
