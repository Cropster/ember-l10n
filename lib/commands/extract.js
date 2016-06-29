// jscs:disable
/* jshint node:true */

'use strict';

var chalk = require('chalk');
var shell = require('shelljs');
var prependFile = require('prepend-file');
var merge = require('merge');
var path = require('path');
var fs = require('fs');
var findBy = require('../utils/find-by');
var makeArray = require('make-array');
var nopt = require('nopt');

var createJsonFromPo = require('../utils/create-json-from-po');

let configPath = 'config/l10n.js';

let availableOptions = [
  {
    name: 'domain-file',
    type: String,
    aliases: ['d'],
    default: './translations/domain.pot',
    description: 'The path to the domain.pot file',
    validInConfig: true
  },
  {
    name: 'encoding',
    type: String,
    aliases: ['e'],
    default: 'UTF-8',
    description: 'The encoding of the input files',
    validInConfig: true
  },
  {
    name: 'input-directories',
    type: Array,
    aliases: ['i'],
    default: ['./app'],
    description: 'The directory from which to extract the strings',
    validInConfig: true
  },
  {
    name: 'output-directory',
    type: String,
    aliases: ['o'],
    default: './translations',
    description: 'Output directory of the PO file',
    validInConfig: true
  },
  {
    name: 'json-directory',
    type: String,
    aliases: ['j'],
    default: './public/assets/locales',
    description: 'The directory to which to output the JSON files',
    validInConfig: true
  },
  {
    name: 'keys',
    type: Array,
    aliases: ['k'],
    default: ['t', 'n:1,2'],
    description: 'Function/Helper Keys to be used for lookup',
    validInConfig: true
  },
  {
    name: 'language',
    type: String,
    aliases: ['l'],
    default: 'en',
    description: 'Target language of the PO-file',
    validInConfig: true
  },
  {
    name: 'plural',
    type: String,
    aliases: ['n'],
    default: 'nplurals=2; plural=(n!=1);',
    description: 'Plural forms for the PO-file',
    validInConfig: true
  },
  {
    name: 'package',
    type: String,
    aliases: ['p'],
    default: 'My App',
    description: 'The name of the package',
    validInConfig: true
  },
  {
    name: 'version',
    type: String,
    aliases: ['v'],
    default: '1.0',
    description: 'The version of the package',
    validInConfig: true
  },
  {
    name: 'xgettext-template-path',
    type: String,
    default: './node_modules/xgettext-template/bin/xgettext-template',
    description: 'The path where xgettext-template is available',
    validInConfig: true
  },
  {
    name: 'gettextjs-path',
    type: String,
    default: './node_modules/gettext.js/bin/po2json',
    description: 'The path where gettex-js is available',
    validInConfig: true

  }
];

module.exports = {
  name: 'l10n:extract',
  description: 'Extract the strings from the app',
  works: 'insideProject',

  run: function(options) {
    // Create tmp domain pot file, in order to not accidentally mess up the original static messages
    let domainPotTmpFolder = `./tmp/ember-l10n`;
    let domainPotTmp = `${domainPotTmpFolder}/domain.pot`;
    shell.mkdir('-p', domainPotTmpFolder);
    shell.cp(options.domainFile, domainPotTmp);

    // Extracting javascript translations
    this.extractFromJS(domainPotTmpFolder, domainPotTmp, options);
    this.extractFromHBS(domainPotTmpFolder, domainPotTmp, options);
    this.initialiseTranslations(domainPotTmpFolder, domainPotTmp, options);

    // Remove tmp folder
    shell.rm('-rf', domainPotTmpFolder);

    // Create JSON from PO
    createJsonFromPo(options, this.ui);
  },

  extractFromJS(domainPotTmpFolder, domainPotTmp, options) {
    var ui = this.ui;

    // Get all .js files
    let directories = options.inputDirectories;
    if (typeof directories === 'string') {
      directories = [directories];
    }
    directories = directories.map(function(directory) {
      return `${directory}/**/*.js`;
    });

    let files = shell.find('-R', directories);
    // filter out invalid
    files = files.filter(function(file) {
      return file.indexOf('mirage/') === -1;
    });

    let shOptions = [
      '--copyright-holder="Cropster"',
      '--msgid-bugs-address="support@cropster.com"',
      `--package-version="${options.version}"`,
      `--package-name="${options.package}"`,
      '--language=JavaScript',
      `--from-code=${options.encoding}`,
      `--output=${domainPotTmp}`,
      '--force-po',
      '--join-existing'
    ];

    let keyArgs = options.keys.map((k) => `--keyword=${k}`);
    keyArgs.forEach(function(keyArg) {
      shOptions.push(keyArg);
    });

    ui.writeLine(chalk.green(`Extracting strings from ${files.length} JavaScript files...`));

    files.forEach(function(file) {
      let opts = shOptions.slice();
      opts.push(file);

      ui.writeLine(`Extracting from ${file}...`);
      shell.exec(`xgettext ${opts.join(' ')}`);
    });
  },

  extractFromHBS(domainPotTmpFolder, domainPotTmp, options) {
    var ui = this.ui;

    // Get all .hbs files
    let directories = options.inputDirectories;
    if (typeof directories === 'string') {
      directories = [directories];
    }
    directories = directories.map(function(directory) {
      return `${directory}/**/*.hbs`;
    });

    let files = shell.find('-R', directories);

    let shOptions = [
      '--language Handlebars',
      `--from-code ${options.encoding}`,
      '--force-po true'
    ];

    let keyArgs = `--keyword ${options.keys.join(',')})`;
    shOptions.push(keyArgs);

    ui.writeLine(chalk.green(`Extracting strings from ${files.length} Handlebars files...`));

    files.forEach(function(file) {
      // Create tmp files for parser and message merging
      // as xgettext-template doesn't support --join-existing
      shell.mkdir('-p', `${domainPotTmpFolder}/${file}`);
      let tmpPoFile = `${domainPotTmpFolder}/${file}.po`;
      let tmpHbsFile = `${domainPotTmpFolder}/${file}.tmp`;
      let localPotTmp = `${domainPotTmpFolder}/${file}.pot`;
      shell.exec(`touch ${localPotTmp}`);
      shell.cp(file, tmpHbsFile);

      // clean all whitespace from .hbs files
      shell.sed('-i', /\s+/g, ' ', tmpHbsFile);

      let opts = shOptions.slice();
      opts.push(`--output ${tmpPoFile}`);
      opts.push(tmpHbsFile);

      ui.writeLine(`Extracting from ${file}...`);
      shell.exec(`node ${options.xgettextTemplatePath} ${opts.join(' ')}`);

      // remove first two lines because they are wrong
      shell.exec(`sed -i '1,2d' ${tmpPoFile}`);

      // prepend header
      let headerTemplate = `msgid ""
msgstr ""
"Content-Type: text/plain; charset=${options.encoding}\\n"
`;
      prependFile.sync(tmpPoFile, headerTemplate);

      // merge po file with main domain.pot
      let mergeOpts = [
        `--output-file=${localPotTmp}`,
        `--to-code="${options.encoding}"`,
        `--lang=${options.language}`,
        `--use-first`,
        `--unique`,
        domainPotTmp,
        tmpPoFile
      ];
      shell.exec(`msgcat ${mergeOpts.join(' ')}`);
      shell.cp(localPotTmp, domainPotTmp);
    });
  },

  initialiseTranslations(domainPotTmpFolder, domainPotTmp, options) {
    let languagePoFile = `${options.outputDirectory}/${options.language}.po`;

    let languageExists = shell.ls(languagePoFile);
    languageExists = !!languageExists.length;

    if (!languageExists) {
      // New Translations
      shell.exec(`touch ${languagePoFile}`);

      let opts = [
        `--output-file ${languagePoFile}`,
        `--input=${domainPotTmp}`,
        `--locale=${options.language}`,
        `--no-translator`
      ];
      shell.exec(`msginit ${opts.join(' ')}`);

      // Replace auto-generated plural forms with the provided/default ones
      shell.sed('-i', /"Plural-Forms:\(.*\)"/g, `Plural-Forms: '${options.plural}'`, languagePoFile);
    } else {
      // merge with existing translations
      let languagePoFileTmp = `${domainPotTmpFolder}/${options.language}.po.tmp`;
      shell.exec(`touch ${languagePoFileTmp}`);
      let opts = [
        `--output-file ${languagePoFileTmp}`,
        `--no-fuzzy-matching`,
        `--lang=${options.language}`,
        `--verbose`,
        `--force-po`,
        languagePoFile,
        domainPotTmp
      ];
      shell.exec(`msgmerge ${opts.join(' ')}`);
      shell.mv(languagePoFileTmp, languagePoFile);
    }

  },

  // Merge options specified on the command line with those defined in the config
  init: function() {
    this._super.init && this._super.init.apply(this, arguments);

    var baseOptions = this.baseOptions();
    var optionsFromConfig = this.config().options;
    var mergedOptions = baseOptions.map(function(availableOption) {
      var option = merge(true, availableOption);

      if ((optionsFromConfig[option.name] !== undefined) && (option.default !== undefined)) {
        option.default = optionsFromConfig[option.name];
        option.description = option.description + ' (configured in ' + configPath + ')';
      }

      return option;
    });

    // Merge custom strategy options if specified
    var strategy = optionsFromConfig.strategy;
    if (typeof strategy === 'object' && Array.isArray(strategy.availableOptions)) {
      mergedOptions = mergedOptions.concat(strategy.availableOptions);
    }

    this.registerOptions({
      availableOptions: mergedOptions
    });
  },

  baseOptions: function() {
    return availableOptions;
  },

  config: function() {
    if (!this._parsedConfig) {
      var ui = this.ui;
      var fullConfigPath = path.join(this.project.root, configPath);
      var config = {};

      if (fs.existsSync(fullConfigPath)) {
        config = require(fullConfigPath);
      }

      var baseOptions = this.baseOptions();
      var configOptions = baseOptions.filter(function(option) {
        return option.validInConfig;
      });
      var optionTypeMap = configOptions.reduce(function(result, option) {
        result[option.name] = option.type;
        return result;
      }, {});

      // Extract whitelisted options
      var options = Object.keys(config).reduce(function(result, optionName) {
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
