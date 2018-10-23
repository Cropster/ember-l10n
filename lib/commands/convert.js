/* eslint-env node */

'use strict';

let fs = require('fs');
let chalk = require('chalk');
let shell = require('shelljs');
let parser = require('gettext-parser');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);

// enable error reporting
shell.config.fatal = true;

/**
 * Command for converting PO files to JSON files for l10n service.
 *
 * Usage: `ember l10n:convert`
 *
 * @class ConvertCommand
 * @extends AbstractCommand
 */
module.exports = Object.assign(BaseCommand, {
  /**
   * Name of the command.
   *
   * @public
   * @property name
   * @type {String}
   */
  name: 'l10n:convert',

  /**
   * Description of the command.
   *
   * @public
   * @property name
   * @type {String}
   */
  description: 'Converts PO files to JSON.',

  /**
   * Collection of available options.
   *
   * @public
   * @property availableOptions
   * @type {Array}
   */
  availableOptions: [
    {
      name: 'convert-from',
      type: String,
      aliases: ['i'],
      default: './translations',
      description: 'Directory of PO file to convert'
    },
    {
      name: 'convert-to',
      type: String,
      aliases: ['o'],
      default: './public/assets/locales',
      description: 'Directory to write JSON files to'
    },
    {
      name: 'language',
      type: String,
      aliases: ['l'],
      default: 'en',
      description: 'Target language for PO to JSON conversion'
    },
    {
      name: 'validate-throw',
      type: String,
      aliases: ['vt'],
      default: null,
      description: 'For which validation level the script should abort. Can be: ERROR, WARNING, null'
    },
    {
      name: 'dry-run',
      type: Boolean,
      aliases: ['dr'],
      default: false,
      description: 'If true, only generate but do not actually write to a file'
    }
  ],

  /**
   * Implements template method of abstract class.
   *
   * @public
   * @method start
   * @param {object} options
   * @return {Void}
   */
  start(options) {
    let fullPath = options.convertTo;
    let poFile = `${options.convertFrom}/${options.language}.po`;
    let jsonFile = `${fullPath}/${options.language}.json`;

    if (!this.fileExists_(poFile)) {
      this.ui.writeLine(chalk.red.bold(`PO file ${poFile} does not exist!`));
      return;
    }

    this.tryInvoke_(() => {
      shell.mkdir('-p', fullPath);
      shell.touch(jsonFile);
    });

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
CREATING JSON FILE
========================================
      `)
    );

    let poData = fs.readFileSync(poFile);
    let jsonData = parser.po.parse(poData);
    this._stripCommentsFromJSON(jsonData);

    let validationErrors = this.validate(jsonData);
    this._printValidationErrors(validationErrors);

    if (this._shouldThrowForValidation(validationErrors, options.validateThrow)) {
      throw new Error('Validation of JSON was not successfully, aborting...');
    }

    if (!options.dryRun) {
      let strData = JSON.stringify(jsonData, null, 2);
      fs.writeFileSync(jsonFile, strData, 'utf8');
    }

    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  /**
   * Remove all comments from the generated JSON.
   * The comments are not needed by ember-l10n, and just add considerable size that the end user needs to download.
   * Note that this modifies the given object.
   *
   * @method _stripCommentsFromJSON
   * @param {Object} json
   * @private
   */
  _stripCommentsFromJSON(json) {
    let { translations } = json;

    Object.keys(translations).forEach((namespace) => {
      Object.keys(translations[namespace]).forEach((k) => {
        let item = translations[namespace][k];
        delete item.comments;
      });
    });
  },

  /**
   * Validate a given JSON object for correct syntax.
   * This returns an array of error objects.
   *
   * @method validate
   * @param {Object} json
   * @return {Object[]}
   * @protected
   */
  _validationErrors: [],
  validate(json) {
    let { translations } = json;
    this._validationErrors = [];

    Object.keys(translations).forEach((namespace) => {
      Object.keys(translations[namespace]).forEach((k) => {
        this._validateItem(translations[namespace][k]);
      });
    });

    return this._validationErrors;
  },

  /**
   * Validate one translation item.
   * This mutates this._validationErrors.
   *
   * @method _validateItem
   * @param {Object }item
   * @private
   */
  _validateItem(item) {
    let { msgid: id, msgid_plural: idPlural, msgstr: translations } = item;

    this._validatePlaceholders({ id, idPlural, translations });
    this._validateTranslatedPlaceholders({ id, translations });
  },

  /**
   * Validate the regular placeholders of an item.
   * This possibly modifies this._validationErrors.
   *
   * @method _validatePlaceholder
   * @param {String} id
   * @param {String} idPlural
   * @param {String[]} translations
   * @private
   */
  _validatePlaceholders({ id, idPlural, translations }) {
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
      let invalidPlaceholder = translatedPlaceholders.find((placeholder) => !placeholders.includes(placeholder));
      if (invalidPlaceholder) {
        this._validationErrors.push({
          id,
          translation,
          message: `The placeholder "${invalidPlaceholder}" seems to be wrongly translated. Allowed: ${placeholders.join(', ')}`,
          level: 'ERROR'
        });
      }
    });
  },

  /**
   * Validate the translated (complex) placeholders of an item.
   * This mutates this._validationErrors.
   *
   * @method _validateTranslatedPlaceholders
   * @param {String} id
   * @param {String[]} translations
   * @private
   */
  _validateTranslatedPlaceholders({ id, translations }) {
    // find all: {{placeholder 'also translated'}}
    // {{placeholder "also translated"}}
    // {{placeholder \'also translated\'}}
    // {{placeholder \"also translated\"}}
    let pattern = /{{\s*([\w]+)\s+((\\')|(\\")|"|')(.*?)((\\')|(\\")|"|')\s*}}/g;

    // This only works in non-plural form, so we assume only one translation
    let [translation] = translations;

    // Build an object describing the complex placeholders from the original string
    let placeholders = id.match(pattern) || [];
    if (!placeholders.length) {
      return;
    }
    let placeholderConfig = placeholders.map((str) => {
      pattern.lastIndex = 0;
      let [fullResult, placeholder, quoteSymbol1, , , content, quoteSymbol2] = pattern.exec(str);
      return {
        fullResult,
        placeholder,
        quoteSymbol1,
        quoteSymbol2,
        content
      };
    });

    // Build an object describing the complex placeholders from the translated string
    let translatedPlaceholders = translation.match(pattern) || [];
    let translatedPlaceholderConfig = translatedPlaceholders.map((str) => {
      pattern.lastIndex = 0;
      let [fullResult, placeholder, quoteSymbol1, , , content, quoteSymbol2] = pattern.exec(str);
      return {
        fullResult,
        placeholder,
        quoteSymbol1,
        quoteSymbol2,
        content
      };
    });

    placeholderConfig.forEach(({ placeholder, content }) => {
      // First we check for missing/invalid placeholders
      // This can happen e.g. if a translator changes {{placeholder 'test'}} to {{placeholder `test`}}
      // So we make sure that all originally defined placeholders actually still exist
      if (!translatedPlaceholderConfig.find((config) => config.placeholder === placeholder)) {
        this._validationErrors.push({
          id,
          translation,
          message: `The complex placeholder "${placeholder}" is not correctly translated`,
          level: 'ERROR'
        });
        return;
      }

      // Then, we check if the placeholder content is correctly translated
      // If the whole string is not translated at all, we ignore it
      // Only if the string is translated but the placeholder part not will this show a warning
      // NOTE: This is just a warning (not an error), as it is theoretically possible this is done on purpose
      // E.g. a word _might_ be the same in translated form
      if (id === translation) {
        return;
      }
      let invalidTranslatedPlaceholder = translatedPlaceholderConfig.find((config) => {
        return config.content === content;
      });

      if (invalidTranslatedPlaceholder) {
        this._validationErrors.push({
          id,
          translation,
          message: `The content "${content}" for complex placeholder "${placeholder}" is not translated`,
          level: 'WARNING'
        });
      }
    });
  },

  /**
   * If an error should be thrown for the given list of errors & the specified min. level of errors.
   *
   * @method _shouldThrowForValidation
   * @param {Object[]} errors
   * @param {null|ERROR|WARNING} minLevel
   * @return {Boolean}
   * @private
   */
  _shouldThrowForValidation(errors, minLevel) {
    if (!minLevel) {
      return false;
    }

    if (minLevel.toUpperCase() === 'ERROR') {
      return !!errors.find((error) => error.level === 'ERROR');
    }

    if (minLevel.toUpperCase() === 'WARNING') {
      return errors.length > 0;
    }

    throw new Error(`Invalid value for ${minLevel} "validateThrow", only ERROR, WARNING, and null are allowed.`);
  },

  /**
   * Print a list of validation errors.
   *
   * @method _printValidationErrors
   * @param {Object[]} errors
   * @private
   */
  _printValidationErrors(errors) {
    errors.forEach((error) => {
      this._printValidationError(error);
    });
  },

  /** Print one validation errors.
   *
   * @method _printValidationError
   * @param {Object} error
   * @private
   */
  _printValidationError({ id, translation, message, level }) {
    level = level.toUpperCase();
    let color = level === 'ERROR' ? 'red' : 'yellow';
    let label = level === 'ERROR'
      ? 'Validation error'
      : 'Validation warning';

    this.ui.writeLine(chalk[color].bold(`${label} for "${id}":`));
    this.ui.writeLine(chalk[color].bold(`   Translation: "${translation}"`));
    this.ui.writeLine(chalk[color].bold(`   Problem: ${message}`));
  }

});
