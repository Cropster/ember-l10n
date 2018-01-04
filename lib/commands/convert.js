/* eslint-env node */

'use strict';

let fs = require('fs');
let chalk = require('chalk');
let shell = require('shelljs');
let parser = require('gettext-parser');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);

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

    shell.mkdir('-p', fullPath);
    shell.touch(jsonFile);

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
CREATING JSON FILE
========================================
      `)
    );

    let poData = fs.readFileSync(poFile);
    let jsonData = parser.po.parse(poData);
    jsonData = JSON.stringify(jsonData, null, 2);

    fs.writeFileSync(jsonFile, jsonData, 'utf8');

    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  }

});
