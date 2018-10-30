/* eslint-env node */
const { validatePlaceholders } = require('./validate/validate-placeholders');
const { validateTranslatedPlaceholders } = require('./validate/validate-translated-placeholders');

function validate(json) {
  let { translations } = json;
  let validationErrors = [];

  Object.keys(translations).forEach((namespace) => {
    Object.keys(translations[namespace]).forEach((k) => {
      validateItem(translations[namespace][k], validationErrors);
    });
  });

  return validationErrors
}

function validateItem(item, validationErrors) {
  let { msgid: id, msgid_plural: idPlural, msgstr: translations } = item;

  validatePlaceholders({ id, idPlural, translations }, validationErrors);
  validateTranslatedPlaceholders({ id, translations }, validationErrors);
}

module.exports = {
  validate,
  validateItem
};
