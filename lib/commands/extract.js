'use strict';

const chalk = require('chalk');
const shell = require('shelljs');
const AbstractCommand = require('./abstract');
const BaseCommand = Object.create(AbstractCommand);
const path = require('path');
const fs = require('fs');
const { parseHbsFile } = require('./utils/parse-hbs');
const { buildPotFile } = require('./utils/build-pot-file');
const { parseJsFile } = require('./utils/parse-js');

// enable error reporting
shell.config.fatal = true;

/**
 * Command for extracting both JS and HBS file from sources.
 *
 * Usage: `ember l10n:extract`
 *
 * @class ExtractCommand
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
  name: 'l10n:extract',

  /**
   * Description of the command.
   *
   * @public
   * @property name
   * @type {String}
   */
  description: 'Extract message ids from both JS and HBS files',

  /**
   * Collection of available options.
   *
   * @public
   * @property availableOptions
   * @type {Array}
   */
  availableOptions: [
    {
      name: 'default-language',
      type: String,
      aliases: ['d'],
      default: 'en',
      description: 'The default language used in message ids'
    },
    {
      name: 'bug-address',
      type: String,
      aliases: ['b'],
      default: 'support@mycompany.com',
      description: 'The email address for translation bugs'
    },
    {
      name: 'copyright',
      type: String,
      aliases: ['c'],
      default: 'My Company',
      description: 'The copyright information'
    },
    {
      name: 'from-code',
      type: String,
      aliases: ['e'],
      default: 'UTF-8',
      description: 'The encoding of the input files'
    },
    {
      name: 'extract-from',
      type: Array,
      aliases: ['i'],
      default: ['./app'],
      description: 'The directory from which to extract the strings'
    },
    {
      name: 'include-patterns',
      type: Array,
      aliases: ['ip'],
      default: [],
      description:
        'List of regex patterns to include for extraction. Defaults to all files.'
    },
    {
      name: 'skip-patterns',
      type: Array,
      aliases: ['sp', 's'],
      default: ['mirage', 'fixtures', 'styleguide'],
      description: 'List of regex patterns to completely ignore from extraction'
    },
    {
      name: 'skip-dependencies',
      type: Array,
      aliases: ['sd'],
      default: [],
      description: 'An array of dependency names to exclude from parsing.'
    },
    {
      name: 'skip-all-dependencies',
      type: Boolean,
      aliases: ['sad'],
      default: false,
      description: 'If this is true, do not parse the addons.'
    },
    {
      name: 'extract-to',
      type: String,
      aliases: ['o'],
      default: './translations',
      description: 'Output directory of the PO-file'
    },
    {
      name: 'keys',
      type: Array,
      aliases: ['k'],
      default: ['t', 'pt:1,2c', 'n:1,2', 'pn:1,2,4c'],
      description: 'Function/Helper Keys to be used for lookup'
    },
    {
      name: 'language',
      type: String,
      aliases: ['l'],
      default: 'en',
      description: 'Target language of the PO-file'
    },
    {
      name: 'pot-name',
      type: String,
      aliases: ['n'],
      default: 'messages.pot',
      description: 'The name of generated POT-file'
    },
    {
      name: 'package',
      type: String,
      aliases: ['p'],
      default: 'My App',
      description: 'The name of the package'
    },
    {
      name: 'version',
      type: String,
      aliases: ['v'],
      default: '1.0',
      description: 'The version of the package'
    },
    {
      name: 'generate-only',
      type: Boolean,
      aliases: ['g'],
      default: false,
      description:
        'If only PO-file should be created from POT without extraction'
    },
    {
      name: 'generate-from',
      type: String,
      aliases: ['f'],
      default: 'messages.pot',
      description: 'Source POT-file to be used in conjunction with `-g` flag'
    },
    {
      name: 'generate-to',
      type: String,
      aliases: ['t'],
      default: null,
      description:
        'Target PO-file to be used in conjunction with `-g` flag - CAUTION: uses `${language}.po` as default'
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
    let startTime = +new Date();
    // make the temporary folder first
    this._preCommand(options);

    // check if we should simply generate new
    // language po file from existing pot file
    if (this._generateOnly(options)) {
      return;
    }

    // create the temporary POT file to write
    // all extractions from instance members!
    this._makePOTFiles(options);

    // parse `node_modules` and add all packages
    // which have a dependency for `ember-l10n`
    // to catch those message ids too
    this._parseAddons(options);

    // run JS and HBS extractions
    this.messageGettextItems = [];

    this._extractFromJS(options);
    this._extractFromHBS(options);

    // then initialize POT files
    this._initPOTFile(options, this.potFile, this.messageGettextItems);

    // and create PO files afterwards
    this._initPOFile(options, this.potFile);

    // cleanup temporary folder
    this._postCommand(options);

    let endTime = +new Date();
    let duration = endTime - startTime;
    this.ui.writeLine(
      chalk.green.bold(
        `Time to complete: ${(duration / 1000).toFixed(2)} seconds`
      )
    );
  },

  /**
   * Creates temporary folders and sets up regular expressions from options.
   *
   * @private
   * @method _preCommand
   * @param {object} options
   * @return {Void}
   */
  _preCommand(options) {
    this.tryInvoke_(() => shell.mkdir('-p', this.tmpFolder));

    this.includeRegex = options.includePatterns.length
      ? new RegExp(`(?:${options.includePatterns.join('|') || 'a^'})`, 'g')
      : null;
    this.skipRegex = new RegExp(
      `(?:${options.skipPatterns.join('|') || 'a^'})`,
      'g'
    );
  },

  /**
   * Removes temporary folders and prints success message.
   *
   * @private
   * @method _postCommand
   * @param {object} options
   * @return {Void}
   */
  _postCommand(options) {
    this.tryInvoke_(() => shell.rm('-rf', this.tmpFolder));
    this.tryInvoke_(() => shell.rm('-f', `${options.extractTo}/*.pot~`));
    this.tryInvoke_(() => shell.rm('-f', `${options.extractTo}/*.po~`));
    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  /**
   * Checks if only PO file should be created from existing POT file without extraction.
   *
   * @private
   * @method _generateOnly
   * @param {object} options
   * @return {Boolean}
   */
  _generateOnly(options) {
    if (!options.generateOnly) {
      return false;
    }

    let potFile = `${options.extractTo}/${options.generateFrom}`;
    let poFile = options.generateTo;

    this._initPOFile(options, potFile, poFile);
    this._postCommand(options);

    return true;
  },

  /**
   * Creates initial POT files to avoid errors by `xgettext`.
   *
   * @private
   * @method _makePOTFiles
   * @param {object} options
   * @return {Void}
   */
  _makePOTFiles(options) {
    this.potFile = `${this.tmpFolder}/${options.potName}`;

    this.tryInvoke_(() => {
      shell.touch(this.potFile);
    });
  },

  /**
   * Parses all addons of this app.
   *
   * @private
   * @method _parseAddons
   * @param {object} options
   * @return {Void}
   */
  _parseAddons(options) {
    if (options.skipAllDependencies) {
      return;
    }

    let addons = this.project.addonPackages;
    Object.keys(addons).forEach((addonName) => {
      let addon = addons[addonName];
      this._checkAddon(addon, options);
    });
  },

  /**
   * Parses a given addon, and adds its /addon and /app folders to the input folders
   * if it has ember-l10n as its dependency.
   *
   * @private
   * @method _parseFolder
   * @param {object} options
   * @return {Void}
   */
  _checkAddon(addon, options) {
    let name = 'ember-l10n';
    let addonName = addon && addon.name;
    let excludedDependencies = options.skipDependencies || [];

    if (
      !addonName ||
      addonName === name ||
      excludedDependencies.includes(addonName)
    ) {
      return;
    }

    let pkg = addon.pkg || {};
    let dependencies = pkg.dependencies || {};
    let devDependencies = pkg.devDependencies || {};

    // If it has ember-l10n in either the dependencies or the dev dependencies, add it to the list of folders
    if (dependencies[name] || devDependencies[name]) {
      let relativePath = path.relative('.', addon.path);
      options.extractFrom.push(`${relativePath}/addon`);
      options.extractFrom.push(`${relativePath}/app`);
    }
  },

  /**
   * Extractor method for all JS files using `xgettext`.
   *
   * @private
   * @method _extractFromJS
   * @param {object} options
   * @return {Void}
   */
  _extractFromJS(options) {
    let files = this._getFiles(options, '{js,ts}');

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
EXTRACTING JAVASCRIPT TRANSLATIONS
========================================
      `)
    );

    files.forEach((file) => {
      if (this._shouldSkipFile(file)) {
        this.ui.writeLine(chalk.yellow(`Skipping ${file}...`));
        return;
      }

      let color = 'white';
      let outputFile = this.potFile;

      let potFile = this._getFileName(outputFile);
      this.ui.writeLine(chalk[color](`Extracting ${file} >>> ${potFile}...`));

      parseJsFile(file, options, this.messageGettextItems);
    });

    this.ui.writeLine(chalk.green.bold(`\nExtracted ${files.length} files ✔`));
  },

  /**
   * Extractor method for all HBS files.
   *
   * @private
   * @method _extractFromHBS
   * @param {object} options
   * @return {Void}
   */
  _extractFromHBS(options) {
    let files = this._getFiles(options, 'hbs');

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
EXTRACTING TEMPLATE TRANSLATIONS
========================================
      `)
    );

    files.forEach((file) => {
      if (this._shouldSkipFile(file)) {
        this.ui.writeLine(chalk.yellow(`Skipping ${file}...`));
        return;
      }

      let color = 'white';
      let outputFile = this.potFile;

      let potFile = this._getFileName(outputFile);
      this.ui.writeLine(chalk[color](`Extracting ${file} >>> ${potFile}...`));

      parseHbsFile(file, options, this.messageGettextItems);
    });

    this.ui.writeLine(chalk.green.bold(`\nExtracted ${files.length} files ✔`));
  },

  _shouldSkipFile(file) {
    return (
      (this.includeRegex && !file.match(this.includeRegex)) ||
      file.match(this.skipRegex)
    );
  },

  /**
   * Creates POT file with `msginit` or updates it with `msgmerge` command.
   *
   * @private
   * @method _initPOTFile
   * @param {object} options
   * @param {string} inputPOTFile
   * @return {Void}
   */
  _initPOTFile(options, tmpFilePath, gettextItems) {
    let outputPOTFile = this._getFileName(tmpFilePath);
    outputPOTFile = `${options.extractTo}/${outputPOTFile}`;

    let encoding = options.fromCode.toLowerCase();
    let potContent = buildPotFile(gettextItems, options);

    // Ensure (temp) files exist
    shell.touch(tmpFilePath);
    shell.touch(outputPOTFile);

    fs.writeFileSync(tmpFilePath, potContent, encoding);

    // a) merge extracted translations with existing
    if (this.fileExists_(outputPOTFile)) {
      let opts = [
        `--lang=${options.defaultLanguage}`,
        `--no-fuzzy-matching`,
        `--force-po`,
        `--verbose`,
        `--no-wrap`,
        `--update`,
        outputPOTFile,
        tmpFilePath
      ];

      this.ui.writeLine(
        chalk.cyan.bold(`
========================================
UPDATING POT FILE
========================================
        `)
      );
      let args = opts.join(' ');

      this.tryInvoke_(() => {
        shell.exec(`msgmerge ${args}`);
      });

      this.ui.writeLine(chalk.green.bold(`\nUpdated ${outputPOTFile} ✔`));
      return;
    }

    // b) simply copy temporary file to destination
    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
CREATING POT FILE
========================================
      `)
    );

    this.tryInvoke_(() => {
      shell.mkdir('-p', options.extractTo);
      shell.cp(tmpFilePath, outputPOTFile);
    });

    this.ui.writeLine(chalk.green.bold(`\nCreated ${outputPOTFile} ✔`));
  },

  /**
   * Creates PO file from POT with `msginit` or updates it with `msgmerge` command.
   *
   * @private
   * @method _initPOFile
   * @param {object} options
   * @param {string} potFile
   * @param {string} poFile
   * @return {Void}
   */
  _initPOFile(options, potFile, poFile) {
    poFile = poFile ? poFile : `${options.language}.po`;
    poFile = `${options.extractTo}/${poFile}`;

    // a) merge extracted translations with existing
    if (this.fileExists_(poFile)) {
      let mergeOpts = [
        `--lang=${options.language}`,
        `--no-fuzzy-matching`,
        `--force-po`,
        `--verbose`,
        `--no-wrap`,
        `--update`,
        poFile,
        potFile
      ];

      this.ui.writeLine(
        chalk.cyan.bold(`
========================================
UPDATING PO FILE
========================================
        `)
      );
      let mergeArgs = mergeOpts.join(' ');

      this.tryInvoke_(() => {
        shell.exec(`msgmerge ${mergeArgs}`);
      });

      // invoke msginit in case current language
      // is default language, otherwise the new
      // strings would be left empty in PO file
      if (options.defaultLanguage === options.language) {
        let initOpts = [
          `--locale=${options.language}`,
          `--output-file=${poFile}`,
          `--input=${poFile}`,
          `--no-translator`,
          `--no-wrap`
        ];
        let initArgs = initOpts.join(' ');

        this.tryInvoke_(() => {
          shell.exec(`msginit ${initArgs}`);
        });
      }

      this.ui.writeLine(chalk.green.bold(`\nUpdated ${poFile} ✔`));
      return;
    }

    // b) simply copy temporary file to destination
    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
CREATING PO FILE
========================================
      `)
    );
    let opts = [
      `--locale=${options.language}`,
      `--output-file ${poFile}`,
      `--input=${potFile}`,
      `--no-translator`,
      `--no-wrap`
    ];
    let args = opts.join(' ');

    this.tryInvoke_(() => {
      shell.mkdir('-p', options.extractTo);
      shell.exec(`msginit ${args}`);
    });
  },

  /**
   * Helper method to retrieve file name from path.
   *
   * @private
   * @method _getFileName
   * @param {string} path
   * @return {Void}
   */
  _getFileName(path) {
    let match = path.match(/([^/]+)$/);
    if (match) {
      return match[0];
    }

    return path;
  },

  /**
   * Helper method to find files for extension from `options`.
   *
   * @private
   * @method _getFiles
   * @param {object} options
   * @param {string} extension
   * @return {Void}
   */
  _getFiles(options, extensions) {
    let directories =
      typeof options.extractFrom === 'string'
        ? [options.extractFrom]
        : options.extractFrom;

    return directories.reduce((files, dir) => {
      try {
        let normalizedPath = path.normalize(`${dir}/**/*.${extensions}`);
        let result = shell.find('-R', normalizedPath);
        if (result.code === 0) {
          return files.concat(Array.from(result));
        }
      } catch (e) {
        // ignore non-existing folders
      }
      return files;
    }, []);
  }
});
