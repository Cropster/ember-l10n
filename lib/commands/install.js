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

let tmpFolder = './tmp/ember-l10n';
let configPath = 'config/l10n-install.js';
let installOptions = require('../utils/install-options');

module.exports = {
  name: 'l10n:install',
  description: 'Checks and installs required dependencies for CLI',
  works: 'insideProject',

  run: function() {

    this.ui.writeLine(
      chalk.cyan.bold(`
========================================
CHECKING DEPENDENCIES
========================================
      `)
    );

    // 1) xgettext utilities (JS)
    let xgettext = this.hasProgramm('xgettext');
    this.ui.writeLine(`Checking xgettext... ${
      xgettext ?
      chalk.green('installed ✔') :
      chalk.red('not installed ✘')
    }`);

    if (!xgettext) {
      this.ui.writeLine(chalk.bold(`\nInstalling xgettext...\n`));
      this.installGettext();
    }

    // 2) xgettext-template (HBS)
    let xgettextTemplate = this.hasNpmPackage('xgettext-template');
    this.ui.writeLine(`Checking xgettext-template... ${
      xgettextTemplate ?
      chalk.green('installed ✔') :
      chalk.red('not installed ✘')
    }`);

    if (!xgettextTemplate) {
      this.ui.writeLine(chalk.bold(`\nInstalling xgettext-template...\n`));
      this.installNpmPackage('xgettext-template');
    }

    // 3) gettext.js (PO2JSON)
    let gettextJs = this.hasNpmPackage('gettext.js');
    this.ui.writeLine(`Checking gettext.js... ${
      gettextJs ?
      chalk.green('installed ✔') :
      chalk.red('not installed ✘')
    }`);

    if (!gettextJs) {
      this.ui.writeLine(chalk.bold(`\nInstalling gettext.js...\n`));
      this.installNpmPackage('gettext.js');
    }

    this.ui.writeLine(chalk.green.bold(`\nFINISHED ✔`));
  },

  hasMissingDependencies: function() {
    return (
      !this.hasProgramm('xgettext') || 
      !this.hasNpmPackage('gettext.js') ||
      !this.hasNpmPackage('xgettext-template')
    );
  },

  installGettext: function() {
    let cur = process.cwd();
    let dir = `${tmpFolder}/gettext`;
    let url = 'http://ftp.gnu.org/pub/gnu/gettext/gettext-latest.tar.gz';

    shell.mkdir('-p',dir);
    shell.exec(`curl -L ${url} | tar -xz - -C ${dir} --strip-components=1`);

    shell.cd(dir);

    shell.exec('sh ./configure');
    shell.exec('make');
    shell.exec('make install');
    shell.exec('make clean');
    shell.exec('make distclean');

    shell.cd(cur);
    shell.rm('-rf',dir);
  },

  installNpmPackage: function(npmPackage) {
    shell.exec(`npm install ${npmPackage} --save-dev`);
  },

  hasProgramm: function(programm) {
    let task = shell.exec(`type ${programm} >/dev/null 2>&1`);
    return task.code===0;
  },

  hasNpmPackage: function(npmPackage) {
    let task = shell.exec(`ls node_modules | grep ${npmPackage} >/dev/null 2>&1`);
    return task.code===0;
  },

  // Merge options specified on the command line with those defined in the config
  init: function() {
    if (this._super.init) {
      this._super.init.apply(this, arguments);
    }

    let baseOptions = this.baseOptions();
    let optionsFromConfig = this.config().options;
    let mergedOptions = baseOptions.map(function(installOption) {
      let option = merge(true, installOption);

      if ((optionsFromConfig[option.name] !== undefined) && (option.default !== undefined)) {
        option.default = optionsFromConfig[option.name];
        option.description = option.description + ' (configured in ' + configPath + ')';
      }

      return option;
    });

    // Merge custom strategy options if specified
    let strategy = optionsFromConfig.strategy;
    if (typeof strategy === 'object' && Array.isArray(strategy.installOptions)) {
      mergedOptions = mergedOptions.concat(strategy.installOptions);
    }

    this.registerOptions({
      availableOptions: mergedOptions
    });
  },

  baseOptions: function() {
    return installOptions;
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
