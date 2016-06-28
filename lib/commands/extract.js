// jscs:disable
/* jshint node:true */

'use strict';

var chalk = require('chalk');
var spawn = require('child_process').spawn;
var merge = require('merge');
var path = require('path');
var fs = require('fs');
var findBy = require('../utils/find-by');
var makeArray = require('make-array');
var nopt = require('nopt');

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
    name: 'input-directory',
    type: String,
    aliases: ['i'],
    default: './app',
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
    type: String,
    aliases: ['k'],
    default: 't',
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
    name: 'shell-path',
    type: String,
    aliases: ['s'],
    default: './node_modules/ember-l10n/lib/sh',
    description: 'The path where the shell scripts are',
    validInConfig: true
  }
];

module.exports = {
  name: 'l10n:extract',
  description: 'Extract the strings from the app',
  works: 'insideProject',

  run: function(options) {
    let folderPath = options.shellPath;
    let scriptPath = folderPath + '/gettext.sh';
    return this.runScript(scriptPath, options);
  },

  runScript(scriptPath) {
    var ui = this.ui;

    var cmd = spawn('sh', [scriptPath], {});

    cmd.stdout.on('data', (data) => {
      ui.writeLine(data);
    });

    cmd.stderr.on('data', (data) => {
      ui.writeLine(data);
    });

    cmd.on('exit', (code) => {
      ui.writeLine(chalk.yellow(`Child exited with code ${code}`));
    });

    cmd.on('error', (err) => {
      ui.writeLine(chalk.red(`Child errored ${err}`));
    });

    return cmd;
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
