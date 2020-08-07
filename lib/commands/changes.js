'use strict';

const chalk = require('chalk');
const shell = require('shelljs');
const ExtractCommand = require('./extract');
const BaseCommand = Object.create(ExtractCommand);
const fs = require('fs');
const { parseHbsFile } = require('./utils/parse-hbs');
const { parseJsFile } = require('./utils/parse-js');
const parser = require('gettext-parser');
const path = require('path');

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

  // We want to re-use the extract config here
  _getConfigFilePath() {
    return path.join(this.project.root, 'config', 'l10n-extract');
  },

  start(options) {
    this.messageGettextItems = [];

    this._preCommand(options);
    this._parseAddons(options);

    this._collectFromJS(options);
    this._collectFromHBS(options);
    this._compareWithPotFile(options);
    this._reportChanges();

    this._postCommand(options);
  },

  /**
   * Reports newly added messages in the Command Line
   */
  _reportChanges() {
    if (this.newMessageGettextItems.length > 0) {
      this.ui.writeLine(
        chalk.cyan.bold(`
========================================
FOLLOWING MESSAGE ITEMS ARE NEW
========================================
            `)
      );

      for (let messageItem of this.newMessageGettextItems) {
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
  _filterGettextItems(existingTranslations, context) {
    let filteredGettextItems = this.messageGettextItems.filter((textItem) => {
      if (textItem.messageContext !== context) {
        return false;
      }

      // The message IDs have normalized whitespace, so we need to convert it accordingly as well
      let messageId = textItem.messageId
        .replace(/(\n|(\r\n))[\t ]*/gm, '\n') // Remove leading whitespace after line breaks
        .replace(/[\t ]+/gm, ' ') // Remove duplicate spaces/tabs
        .trim(); // trim front & end of spaces

      return !existingTranslations[messageId];
    });

    this.newMessageGettextItems = this.newMessageGettextItems.concat(
      filteredGettextItems
    );
  },

  /**
   * Compare method for checking Message Items in the PO file
   * @param {*} options
   */
  _compareWithPotFile(options) {
    let potFile = `${options.extractTo}/${options.potName}`;

    if (this.fileExists_(potFile)) {
      let potData = fs.readFileSync(potFile);
      let jsonData = parser.po.parse(potData);

      this.newMessageGettextItems = [];

      Object.keys(jsonData.translations).forEach((context) => {
        this._filterGettextItems(
          jsonData.translations[context],
          context || undefined
        );
      });
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
