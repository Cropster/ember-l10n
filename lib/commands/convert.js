// jscs:disable
/* jshint node:true */

'use strict';

let fs = require('fs');
let nopt = require('nopt');
let path = require('path');
let chalk = require('chalk');
let merge = require('merge');
let shell = require('shelljs');
let makeArray = require('make-array');

let findBy = require('../utils/find-by');
let fileExists = require('../utils/file-exists');

let configPath = 'config/l10n-convert.js';
let convertOptions = require('../utils/convert-options');
let checkDependencies = require('../utils/check-dependencies');

module.exports = {
  name: 'l10n:convert',
  description: 'Convert PO files to JSON',
  works: 'insideProject',

  run: function(options) {
    let promise = checkDependencies();
    promise.then(() => {
      this.start(options);
    });

    return promise;
  },

  start: function(options) {
    let poFile = `${options.convertFrom}/${options.language}.po`;
    let jsonFile = `${options.convertTo}/${options.language}.json`;

    if (!fileExists(poFile)) {
      this.ui.writeLine(chalk.red.bold(`PO file ${poFile} does not exist!`));
      return;
    }

    shell.mkdir('-p', options.convertTo);
    shell.exec(`touch ${jsonFile}`);

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
CREATING JSON FILE
========================================
      `)
    );

    let args = [poFile, jsonFile, `-p`].join(' ');
    shell.exec(`node ${options.gettextjsPath} ${args}`);

    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  // Merge options specified on the command line with those defined in the config
  init: function() {
    if (this._super.init) {
      this._super.init.apply(this, arguments);
    }

    let baseOptions = this.baseOptions();
    let optionsFromConfig = this.config().options;
    let mergedOptions = baseOptions.map(function(convertOption) {
      let option = merge(true, convertOption);

      if ((optionsFromConfig[option.name] !== undefined) && (option.default !== undefined)) {
        option.default = optionsFromConfig[option.name];
        option.description = option.description + ' (configured in ' + configPath + ')';
      }

      return option;
    });

    // Merge custom strategy options if specified
    let strategy = optionsFromConfig.strategy;
    if (typeof strategy === 'object' && Array.isArray(strategy.convertOptions)) {
      mergedOptions = mergedOptions.concat(strategy.convertOptions);
    }

    this.registerOptions({
      availableOptions: mergedOptions
    });
  },

  baseOptions: function() {
    return convertOptions;
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
