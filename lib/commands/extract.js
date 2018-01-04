/* eslint-env node */

'use strict';

let fs = require('fs');
let chalk = require('chalk');
let shell = require('shelljs');
let AbstractCommand = require('./abstract');
let BaseCommand = Object.create(AbstractCommand);

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
      name: 'exclude-patterns',
      type: Array,
      aliases: ['x'],
      default: [],
      description: 'List of regex patterns to put into a dedicated `excluded.pot` file'
    },
    {
      name: 'skip-patterns',
      type: Array,
      aliases: ['s'],
      default: ['mirage','fixtures','styleguide'],
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
      description: 'If this is true, do not parse the node_modules/lib folders.'
    },
    {
      name: 'skip-check-install',
      type: Boolean,
      aliases: ['sci'],
      default: false,
      description: 'If this is true, do not check if cli dependencies are installed.'
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
      description: 'If only PO-file should be created from POT without extraction'
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
      description: 'Target PO-file to be used in conjunction with `-g` flag - CAUTION: uses `${language}.po` as default'
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
    this._extractFromJS(options);
    this._extractFromHBS(options);

    // then initialize POT files
    this._initPOTFile(options,this.potExcludeFile);
    this._initPOTFile(options,this.potFile);

    // and create PO files afterwards
    this._initPOFile(options,this.potFile);

    // cleanup temporary folder
    this._postCommand(options);
  },

  /**
   * Creates temporary folders and sets up regular expressions from options.
   *
   * @private
   * @method _preCommand
   * @param {object} options
   * @return {Void}
   */
  _preCommand(options){
    shell.mkdir('-p', this.tmpFolder);

    this.excludeRegex = new RegExp(`(?:${options.excludePatterns.join('|')||'a^'})`,'g');
    this.skipRegex = new RegExp(`(?:${options.skipPatterns.join('|')||'a^'})`,'g');
  },

  /**
   * Removes temporary folders and prints success message.
   *
   * @private
   * @method _postCommand
   * @param {object} options
   * @return {Void}
   */
  _postCommand(/*options*/) {
    shell.rm('-rf', this.tmpFolder);
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

    this.initPOFile(options,potFile,poFile);
    this.postCommand(options);

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
    this.potExcludeFile = `${this.tmpFolder}/excluded.pot`;
    this.potFile = `${this.tmpFolder}/${options.potName}`;

    shell.touch(this.potExcludeFile);
    shell.touch(this.potFile);
  },

  /**
   * Parses both `lib` and `node_modules` folder.
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
    this._parseFolder('node_modules', options);
    this._parseFolder('lib', options);
  },

  /**
   * Parses folder and adjusts `extractFrom` collection.
   *
   * @private
   * @method _parseFolder
   * @param {object} options
   * @return {Void}
   */
  _parseFolder(basePath, options) {
    let addon = 'ember-l10n';
    let excludedDependencies = options.skipDependencies || [];
    if (!this.fileExists_(basePath)) {
      return;
    }

    let modules = fs.readdirSync(basePath);
    modules.forEach(module => {
      if (module===addon || excludedDependencies.indexOf(module) > -1) {
        return;
      }

      let modulePath = `${basePath}/${module}`;
      let stat = fs.statSync(modulePath);
      if (!stat.isDirectory()) {
        return;
      }

      let json = `${modulePath}/package.json`;
      if (!this.fileExists_(json)) {
        return;
      }

      let data = fs.readFileSync(json,'utf8');
      if (!data.match(addon)) {
        return;
      }

      options.extractFrom.push(`${modulePath}/addon`);
    });
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
    let directories = typeof options.extractFrom==='string' ?
      [ options.extractFrom ] :
      options.extractFrom;

    let files = shell.find('-R', directories.map(dir => `${dir}/**/*.js`));

    let opts = [
      `--msgid-bugs-address="${options.bugAddress}"`,
      `--copyright-holder="${options.copyright}"`,
      `--package-version="${options.version}"`,
      `--package-name="${options.package}"`,
      `--from-code=${options.fromCode}`,
      `--language=JavaScript`,
      `--join-existing`,
      `--force-po`,
      `--no-wrap`
    ];

    options.keys.forEach(key => { opts.push(`--keyword=${key}`); });

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
EXTRACTING JAVASCRIPT TRANSLATIONS
========================================
      `)
    );

    files.forEach(file => {
      if (file.match(this.skipRegex)) {
        this.ui.writeLine(chalk.yellow(`Skipping ${file}...`));
        return;
      }

      let isExcluded = file.match(this.excludeRegex);
      let color = isExcluded ? 'gray' : 'white';
      let outputFile = isExcluded ?
        this.potExcludeFile :
        this.potFile;

      let potFile = this._getFileName(outputFile);
      this.ui.writeLine(chalk[color](`Extracting ${file} >>> ${potFile}...`));

      let args = opts.slice();
      args.push(`--output=${outputFile}`);
      args = `${args.join(' ')} ${file}`;

      shell.exec(`xgettext ${args}`);
    });

    this.ui.writeLine(chalk.green.bold(`\nExtracted ${files.length} files ✔`));
  },

  /**
   * Extractor method for all HBS files using `xgettext-template`.
   *
   * @private
   * @method _extractFromHBS
   * @param {object} options
   * @return {Void}
   */
  _extractFromHBS(options) {
    let directories = typeof options.extractFrom==='string' ?
      [ options.extractFrom ] :
      options.extractFrom;

    let files = shell.find('-R', directories.map(dir => `${dir}/**/*.hbs`));

    let opts = [
      `--from-code ${options.fromCode}`,
      `--language Handlebars`,
      `--force-po true`
    ];

    options.keys.forEach(key => { opts.push(`--keyword ${key}`); });

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
EXTRACTING TEMPLATE TRANSLATIONS
========================================
      `)
    );

    files.forEach(file => {
      if (file.match(this.skipRegex)) {
        this.ui.writeLine(chalk.yellow(`Skipping ${file}...`));
        return;
      }

      let encoding = options.fromCode;

      let data = fs.readFileSync(file, encoding);
      let path = './node_modules/xgettext-template';
      let parser = `${path}/bin/xgettext-template`;
      let tmpHBSFile = file.replace(/\.hbs$/,'.l10n.hbs');
      let tmpPOTFile = file.replace(/\.hbs$/,'.l10n.pot');

      // create temporary files directly in folder in order
      // to provide correct path information message comments
      shell.touch(tmpPOTFile);
      shell.touch(tmpHBSFile);

      // clean all whitespaces from .hbs files, otherwise
      // xgettext-template included parser doesn't work!
      fs.writeFileSync(tmpHBSFile, data.replace(/\s+/g,' '), encoding);

      // prepare correct output file depending on excludes
      let isExcluded = file.match(this.excludeRegex);
      let color = isExcluded ? 'gray' : 'white';
      let outputFile = isExcluded ?
        this.potExcludeFile :
        this.potFile;

      let potFile = this._getFileName(outputFile);
      this.ui.writeLine(chalk[color](`Extracting ${file} >>> ${potFile}...`));

      // invoke gettext-template to get template messages
      // and write them to temporary POT file for merging
      let nodeOpts = opts.slice();
      nodeOpts.push(`--output ${tmpPOTFile}`);
      let nodeArgs = `${nodeOpts.slice().join(' ')} ${tmpHBSFile}`;

      shell.exec(`${parser} ${nodeArgs}`);

      // now merge with existing messages from JS
      // extraction stored in temporary messages.pot
      let mergeOpts = [
        `--lang=${options.defaultLanguage}`,
        `--output-file=${outputFile}`,
        `--to-code=${encoding}`,
        `--use-first`,
        `--no-wrap`,
        outputFile,
        tmpPOTFile
      ];

      let mergeArgs = mergeOpts.join(' ');
      shell.exec(`msgcat ${mergeArgs}`);

     // cleanup temporary files from source
     shell.rm('-f',[tmpPOTFile, tmpHBSFile]);
    });

    this.ui.writeLine(chalk.green.bold(`\nExtracted ${files.length} files ✔`));
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
  _initPOTFile(options, inputPOTFile) {
    let outputPOTFile = this._getFileName(inputPOTFile);
    outputPOTFile = `${options.extractTo}/${outputPOTFile}`;

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
        inputPOTFile
      ];

      this.ui.writeLine(
        chalk.cyan.bold(`
========================================
UPDATING POT FILE
========================================
        `)
      );
      let args = opts.join(' ');
      shell.exec(`msgmerge ${args}`);
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
    shell.mkdir('-p', options.extractTo);
    shell.cp(inputPOTFile, outputPOTFile);
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
      shell.exec(`msgmerge ${mergeArgs}`);

      // invoke msginit in case current language
      // is default language, otherwise the new
      // strings would be left empty in PO file
      if (options.defaultLanguage===options.language) {
        let initOpts = [
          `--locale=${options.language}`,
          `--output-file=${poFile}`,
          `--input=${poFile}`,
          `--no-translator`,
          `--no-wrap`
        ];
        let initArgs = initOpts.join(' ');
        shell.exec(`msginit ${initArgs}`);
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

    shell.mkdir('-p', options.extractTo);
    shell.exec(`msginit ${args}`);
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
});
