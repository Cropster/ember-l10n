// jscs:disable
/* jshint node:true */

'use strict';

let fs = require('fs');
let nopt = require('nopt');
let path = require('path');
let merge = require('merge');
let chalk = require('chalk');
let shell = require('shelljs');
let makeArray = require('make-array');

let findBy = require('../utils/find-by');
let fileExists = require('../utils/file-exists');

let tmpFolder = './tmp/ember-l10n';
let configPath = 'config/l10n-extract.js';

let extractOptions = require('../utils/extract-options');
let checkDependencies = require('../utils/check-dependencies');

module.exports = {
  name: 'l10n:extract',
  description: 'Extract message ids from app',
  works: 'insideProject',

  run: function(options) {
    let promise = checkDependencies();
    promise.then(() => {
      this.start(options);
    });

    return promise;
  },

  start: function(options) {
    // make the temporary folder first
    this.preCommand(options);

    // check if we should simply generate new
    // language po file from existing pot file
    if (this.generateOnly(options)) {
      return;
    }

    // create the temporary POT file to write
    // all extractions from instance members!
    this.makePOTFiles(options);

    // parse `node_modules` and add all packages
    // which have a dependency for `ember-l10n`
    // to catch those message ids too
    this.parseAddons(options);

    // run JS and HBS extractions
    this.extractFromJS(options);
    this.extractFromHBS(options);

    // then initialize POT files
    this.initPOTFile(options,this.potExcludeFile);
    this.initPOTFile(options,this.potFile);

    // and create PO files afterwards
    this.initPOFile(options,this.potFile);

    // cleanup temporary folder
    this.postCommand(options);
  },

  preCommand: function(options){
    shell.mkdir('-p',tmpFolder);

    this.excludeRegex = new RegExp(`(?:${options.excludePatterns.join('|')||'.*'})`,'g');
    this.skipRegex = new RegExp(`(?:${options.skipPatterns.join('|')||'.*'})`,'g');
  },

  postCommand: function(/*options*/) {
    shell.rm('-rf', tmpFolder);
    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  generateOnly: function(options) {
    if (!options.generateOnly) {
      return false;
    }

    let potFile = `${options.extractTo}/${options.generateFrom}`;
    let poFile = options.generateTo;

    this.initPOFile(options,potFile,poFile);
    this.postCommand(options);

    return true;
  },

  makePOTFiles: function(/*options*/) {
    this.potExcludeFile = `${tmpFolder}/excluded.pot`;
    this.potFile = `${tmpFolder}/messages.pot`;

    shell.touch(this.potExcludeFile);
    shell.touch(this.potFile);
  },

  parseAddons: function(options) {
    this._parseFolder('node_modules', options);
    this._parseFolder('lib', options);
  },

  _parseFolder: function(basePath, options) {
    let addon = 'ember-l10n';
    if (!fileExists(basePath)) {
      return;
    }

    let modules = fs.readdirSync(basePath);
    modules.forEach(module => {
      if (module===addon) {
        return;
      }

      let modulePath = `${basePath}/${module}`;
      let stat = fs.statSync(modulePath);
      if (!stat.isDirectory()) {
        return;
      }

      let json = `${modulePath}/package.json`;
      if (!fileExists(json)) {
        return;
      }

      let data = fs.readFileSync(json,'utf8');
      if (!data.match(addon)) {
        return;
      }

      options.extractFrom.push(modulePath);
    });
  },

  _getFileName: function(filePath) {
    let match = filePath.match(/([^\/]+)$/);
    if (match) {
      return match[0];
    }

    return filePath;
  },

  extractFromJS(options) {
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

  extractFromHBS(options) {
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
      let lib = options.xgettextTemplatePath;
      let data = fs.readFileSync(file, encoding);
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

      shell.exec(`node ${lib} ${nodeArgs}`);

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
      shell.rm('-f',[tmpPOTFile,tmpHBSFile]);
    });

    this.ui.writeLine(chalk.green.bold(`\nExtracted ${files.length} files ✔`));
  },

  initPOTFile(options,inputPOTFile) {
    let outputPOTFile = this._getFileName(inputPOTFile);
    outputPOTFile = `${options.extractTo}/${outputPOTFile}`;

    // a) merge extracted translations with existing
    if (fileExists(outputPOTFile)) {
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
    shell.cp(inputPOTFile,outputPOTFile);
    this.ui.writeLine(chalk.green.bold(`\nCreated ${outputPOTFile} ✔`));
  },

  initPOFile(options,potFile,poFile) {
    poFile = poFile ? poFile : `${options.language}.po`;
    poFile = `${options.extractTo}/${poFile}`;

    // a) merge extracted translations with existing
    if (fileExists(poFile)) {
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
    shell.exec(`msginit ${args}`);
  },

  // Merge options specified on the command line with those defined in the config
  init: function() {
    if (this._super.init) {
      this._super.init.apply(this, arguments);
    }

    let baseOptions = this.baseOptions();
    let optionsFromConfig = this.config().options;
    let mergedOptions = baseOptions.map(function(extractOption) {
      let option = merge(true, extractOption);

      if ((optionsFromConfig[option.name] !== undefined) && (option.default !== undefined)) {
        option.default = optionsFromConfig[option.name];
        option.description = option.description + ' (configured in ' + configPath + ')';
      }

      return option;
    });

    // Merge custom strategy options if specified
    let strategy = optionsFromConfig.strategy;
    if (typeof strategy === 'object' && Array.isArray(strategy.extractOptions)) {
      mergedOptions = mergedOptions.concat(strategy.extractOptions);
    }

    this.registerOptions({
      availableOptions: mergedOptions
    });
  },

  baseOptions: function() {
    return extractOptions;
  },

  config: function() {
    if (!this._parsedConfig) {
      let ui = this.ui;
      let fullConfigPath = path.join(this.project.root, configPath);
      let config = {};

      if (fs.existsSync(fullConfigPath)) {
        config = require(fullConfigPath);
      }

      let baseOptions = this.baseOptions();
      let configOptions = baseOptions.filter(function(option) {
        return option.validInConfig;
      });
      let optionTypeMap = configOptions.reduce(function(result, option) {
        result[option.name] = option.type;
        return result;
      }, {});

      // Extract whitelisted options
      let options = Object.keys(config).reduce(function(result, optionName) {
        if (findBy(configOptions, 'name', optionName)) {
          result[optionName] = optionTypeMap[optionName] === Array ? makeArray(config[optionName]) : config[optionName];
        } else if (findBy(baseOptions, 'name', optionName)) {
          ui.writeLine(chalk.yellow("Warning: cannot specify option `" + optionName + "` in " + configPath + ", ignoring"));
        } else {
          ui.writeLine(chalk.yellow("Warning: invalid option `" + optionName + "` in " + configPath + ", ignoring"));
        }

        return result;
      }, {});

      // Coerce options into their expected type; this is not done for us since
      // the options are not coming from the CLI arg string
      nopt.clean(options, optionTypeMap);


      this._parsedConfig = {
        options: options
      };
    }

    return this._parsedConfig;
  }
};
