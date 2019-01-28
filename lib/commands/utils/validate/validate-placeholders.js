/**
 * Validate the regular placeholders of an item.
 * This possibly modifies the given validationErrors.
 *
 * @method _validatePlaceholder
 * @param {String} id
 * @param {String} idPlural
 * @param {String[]} translations
 * @private
 */
function validatePlaceholders(
  { id, idPlural, translations },
  validationErrors
) {
  // search for {{placeholderName}}
  // Also search for e.g. Chinese symbols in the placeholderName
  let pattern = /{{\s*(\S+?)\s*?}}/g;
  let placeholders = id.match(pattern) || [];

  // We also want to add placeholders from the plural string
  if (idPlural) {
    let pluralPlaceholders = idPlural.match(pattern) || [];
    pluralPlaceholders.forEach((placeholder) => {
      if (!placeholders.includes(placeholder)) {
        placeholders.push(placeholder);
      }
    });
  }

  if (!placeholders.length) {
    return;
  }

  translations.forEach((translation) => {
    let translatedPlaceholders = translation.match(pattern) || [];

    // Search for placeholders in the translated string that are not in the original string
    let invalidPlaceholder = translatedPlaceholders.find(
      (placeholder) => !placeholders.includes(placeholder)
    );
    if (invalidPlaceholder) {
      validationErrors.push({
        id,
        translation,
        message: `The placeholder "${invalidPlaceholder}" seems to be wrongly translated. Allowed: ${placeholders.join(
          ', '
        )}`,
        level: 'ERROR'
      });
    }
  });
}

module.exports = {
  validatePlaceholders
};
