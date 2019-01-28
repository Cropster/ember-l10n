const { validatePlaceholders } = require('./validate/validate-placeholders');
const {
  validateTranslatedPlaceholders
} = require('./validate/validate-translated-placeholders');
const { traverseJson } = require('./traverse-json');

function validate(json) {
  let validationErrors = [];
  traverseJson(json, (item) => validateItem(item, validationErrors));
  return validationErrors;
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
