'use strict';

let fs = require('fs');
let chalk = require('chalk');
let shell = require('shelljs');
let parser = require('gettext-parser');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);
let { validate } = require('./../utils/validate-json');
let { traverseJson } = require('./../utils/traverse-json');

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
      description:
        'For which validation level the script should abort. Can be: ERROR, WARNING, null'
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
    this._processJSON(jsonData);

    let validationErrors = validate(jsonData);
    this._printValidationErrors(validationErrors);

    if (
      this._shouldThrowForValidation(validationErrors, options.validateThrow)
    ) {
      throw new Error('Validation of JSON was not successfully, aborting...');
    }

    if (!options.dryRun) {
      let strData = JSON.stringify(jsonData, null, 2);
      fs.writeFileSync(jsonFile, strData, 'utf8');
    }

    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  /**
   * Process the generated JSON object, to optimize it for ember-l10n.
   * This mutates the given JSON object.
   *
   * @method _processJSON
   * @param {Object} json
   * @private
   */
  _processJSON(json) {
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
      this._fixCurlyQuotes(item);
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
    this._sortJSON(json);

    if (untranslatedItemCount > 0) {
      this.ui.writeLine(
        chalk.yellow(
          `${untranslatedItemCount} messages have not been translated - skipping them in the generated JSON file...`
        )
      );
      this.ui.writeLine('');
    }
  },

  _sortJSON(json) {
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
  },

  /**
   * Fix quotes in translations.
   * This will replace curly double/single quotes with regular quotes, to ensure the generated JSON files work.
   *
   * @method _fixCurlyQuotes
   * @param {Object} item
   * @private
   */
  _fixCurlyQuotes(item) {
    let doubleQuoteRegex = /[“|”]/gm;
    let singleQuoteRegex = /[‘|’]/gm;

    item.msgstr = item.msgstr.map((str) => {
      return str.replace(doubleQuoteRegex, '"').replace(singleQuoteRegex, "'");
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

    throw new Error(
      `Invalid value for ${minLevel} "validateThrow", only ERROR, WARNING, and null are allowed.`
    );
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
    let label = level === 'ERROR' ? 'Validation error' : 'Validation warning';

    this.ui.writeLine(chalk[color].bold(`${label} for "${id}":`));
    this.ui.writeLine(chalk[color].bold(`   Translation: "${translation}"`));
    this.ui.writeLine(chalk[color].bold(`   Problem: ${message}`));
  }
});
