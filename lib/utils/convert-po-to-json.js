const parser = require('gettext-parser');
const { validate } = require('./../utils/validate-json');
const { traverseJson } = require('./../utils/traverse-json');
const fs = require('fs');

module.exports = function convertPoToJson(poFilePath) {
  let poData = fs.readFileSync(poFilePath);
  let jsonData = parser.po.parse(poData);
  let { untranslatedItemCount } = processJSON(jsonData);

  let validationErrors = validate(jsonData);

  return { jsonData, validationErrors, untranslatedItemCount };
};

/**
 * Process the generated JSON object, to optimize it for ember-l10n.
 * This mutates the given JSON object.
 *
 * @method processJSON
 * @param {Object} json
 * @private
 */
function processJSON(json) {
  let untranslatedItemCount = 0;

  traverseJson(json, (item, namespace, id) => {
    // If the item is not translated, remove it
    if (!item.msgstr || !item.msgstr[0]) {
      untranslatedItemCount++;
      delete namespace[id];
      return;
    }

    // If the translation is the same as the ID (e.g. for the source language), also remove it
    // We use the ID by default anyhow, so this will reduce the size of the JSON for the default language
    if (
      item.msgid === item.msgstr[0] &&
      (!item.msgid_plural || item.msgid_plural === item.msgstr[1])
    ) {
      delete namespace[id];
      return;
    }

    // Remove comments, as we don't need them
    delete item.comments;

    // Fix curly single/double quotes, to ensure translations work
    fixCurlyQuotes(item);
  });

  // Delete info-item in translations (if it exists)
  if (json.translations[''] && json.translations['']['']) {
    delete json.translations[''][''];
  }

  // Ensure plural form has trailing `;`
  if (json.headers['plural-forms']) {
    let pluralForm = json.headers['plural-forms'];
    if (!pluralForm.endsWith(';')) {
      json.headers['plural-forms'] = `${pluralForm};`;
    }
  }

  // Ensure it is sorted consistently (by message id)
  sortJSON(json);

  return { untranslatedItemCount };
}

function sortJSON(json) {
  let { translations } = json;

  Object.keys(translations)
    .sort((a, b) => a.localeCompare(b))
    .forEach((namespace) => {
      let sortedNamespace = {};

      Object.keys(translations[namespace])
        .sort((a, b) => a.localeCompare(b))
        .forEach((k) => {
          sortedNamespace[k] = translations[namespace][k];
        });

      delete translations[namespace];
      translations[namespace] = sortedNamespace;
    });
}

/**
 * Fix quotes in translations.
 * This will replace curly double/single quotes with regular quotes, to ensure the generated JSON files work.
 *
 * @method fixCurlyQuotes
 * @param {Object} item
 * @private
 */
function fixCurlyQuotes(item) {
  let doubleQuoteRegex = /[“|”]/gm;
  let singleQuoteRegex = /[‘|’]/gm;

  item.msgstr = item.msgstr.map((str) => {
    return str.replace(doubleQuoteRegex, '"').replace(singleQuoteRegex, "'");
  });
}
