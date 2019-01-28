'use strict';

let fs = require('fs');
let chalk = require('chalk');
let shell = require('shelljs');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);
let convertPoToJson = require('./../utils/convert-po-to-json');

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

    let { jsonData, validationErrors, untranslatedItemCount } = convertPoToJson(
      poFile
    );

    if (untranslatedItemCount > 0) {
      this.ui.writeLine(
        chalk.yellow(
          `${untranslatedItemCount} messages have not been translated - skipping them in the generated JSON file...`
        )
      );
      this.ui.writeLine('');
    }
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
