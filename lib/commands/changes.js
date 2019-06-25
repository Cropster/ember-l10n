'use strict';

const chalk = require('chalk');
const shell = require('shelljs');
const ExtractCommand = require('./extract');
const BaseCommand = Object.create(ExtractCommand);
const fs = require('fs');
const { parseHbsFile } = require('./utils/parse-hbs');
const { parseJsFile } = require('./utils/parse-js');
const parser = require('gettext-parser');

// enable error reporting
shell.config.fatal = true;

/**
 * Command for identifying newly added messages in the Application.
 *
 * Usage: `ember l10n:changes`
 *
 * @class ChangesCommand
 * @extends ExtractCommand
 */
module.exports = Object.assign(BaseCommand, {
  /**
   * Name of the command.
   *
   * @public
   * @property name
   * @type {String}
   */
  name: 'l10n:changes',

  /**
   * Description of the command.
   *
   * @public
   * @property name
   * @type {String}
   */
  description: 'Reports newly added messages in the Application',

  start(options) {
    this.messageGettextItems = [];

    this._preCommand(options);

    this._collectFromJS(options);
    this._collectFromHBS(options);
    this._compareWithPoFile(options);
    this._reportChanges();

    this._postCommand(options);
  },

  /**
   * Reports newly added messages in the Command Line
   */
  _reportChanges() {
    if (this.messageGettextItems.length > 0) {
      this.ui.writeLine(
        chalk.cyan.bold(`
========================================
FOLLOWING MESSAGE ITEMS ARE NEW
========================================
            `)
      );

      for (let messageItem of this.messageGettextItems) {
        this.ui.writeLine(chalk.red.bold(messageItem.messageId));
      }
      this.ui.writeLine(
        chalk.cyan.bold(`
==========================================================
EXECUTE ember l10n:extract TO ADD THEM IN THE TRANSLATIONS
==========================================================
            `)
      );
    } else {
      this.ui.writeLine(
        chalk.green.bold(`
========================================
NO NEW MESSAGE ITEMS FOUND
========================================
            `)
      );
    }
  },

  /**
   * Filter method for identifying newly added Message Items
   * @param {Array} existingTranslations
   */
  _filterTextItems(existingTranslations) {
    this.messageGettextItems = this.messageGettextItems.filter((textItem) => {
      return !existingTranslations[textItem.messageId];
    });
  },

  /**
   * Compare method for checking Message Items in the PO file
   * @param {*} options
   */
  _compareWithPoFile(options) {
    let poFile = `${options.extractTo}/${options.language}.po`;

    if (this.fileExists_(poFile)) {
      let poData = fs.readFileSync(poFile);
      let jsonData = parser.po.parse(poData);
      let existingTranslations = jsonData.translations[''];

      this._filterTextItems(existingTranslations);
    }
  },

  /**
   * Collect method for all HBS files.
   *
   * @private
   * @method _collectFromHBS
   * @param {object} options
   * @return {Void}
   */
  _collectFromHBS(options) {
    let files = this._getFiles(options, 'hbs');

    files.forEach((file) => {
      if (this._shouldSkipFile(file)) {
        this.ui.writeLine(chalk.yellow(`Skipping ${file}...`));
        return;
      }

      parseHbsFile(file, options, this.messageGettextItems);
    });

    this.ui.writeLine(
      chalk.green.bold(`\nCollected from ${files.length} files ✔`)
    );
  },

  /**
   * Collect method for all JS files using `xgettext`.
   *
   * @private
   * @method _collectFromJS
   * @param {object} options
   * @return {Void}
   */
  _collectFromJS(options) {
    let files = this._getFiles(options, '{js,ts}');

    files.forEach((file) => {
      if (this._shouldSkipFile(file)) {
        this.ui.writeLine(chalk.yellow(`Skipping ${file}...`));
        return;
      }

      parseJsFile(file, options, this.messageGettextItems);
    });

    this.ui.writeLine(chalk.green.bold(`\nExtracted ${files.length} files ✔`));
  }
});
