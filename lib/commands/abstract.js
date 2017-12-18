/* eslint-env node */

let fs = require('fs');
let path = require('path');
let chalk = require('chalk');
let shell = require('shelljs');
let inquirer = require('inquirer');

'use strict';

/**
 * Abstract command class. Refer to current implementation of Ember CLI at:
 * https://github.com/ember-cli/ember-cli/blob/master/lib/models/command.js
 *
 * @class AbstractCommand
 */
module.exports = {

  /**
   * Constant being one of `insideProject`, `outsideProject` or `everywhere`.
   *
   *
   */
  works: 'insideProject',

  /**
   * Collection of available options. An option should look like:
   *
   * ```
   *   {
   *     type: <T>,
   *     name: String,
   *     default: String,
   *     aliases:[]<String>,
   *     description: String
   *   }
   * ```
   *
   * @public
   * @property availableOptions
   * @type {Array}
   */
  availableOptions: [],

  /**
   * Directory where to store tmp files during command processings.
   *
   * @public
   * @property tmpFolder
   * @type {String}
   */
  tmpFolder: './tmp/ember-l10n',

  /**
   * Tries to extend `availableOptions` with globals from config.
   *
   * @public
   * @method beforeRun
   * @return {Void}
   */
  beforeRun() {
    this._super(...arguments);

    // try to read global options from `/config/l10n-${command}.js`
    let globals = {};
    let name = this.name.replace(':','-');
    let module = path.join(this.project.root, 'config', name);

    try {
      globals = require(module);
    } catch(e) {
      return;
    }

    this.availableOptions.map((option) => {
      // a) check if it corresponds with `name`
      let namedOpt = globals[option.name];
      if (namedOpt !== undefined) {
        option.default = namedOpt;
        return option;
      }

      // b) check if it's contained in `aliases`
      let aliases = option.aliases || [];
      for (let i=0; i<aliases.length; i++) {
        let aliasedOpt = globals[aliases[i]];
        if (aliasedOpt !== undefined) {
          option.default = aliasedOpt;
          return option;
        }
      }

      return option;
    });
  },

  /**
   * Default implementation checks for dependencies and
   * invokes `start()` method after successful checks!
   *
   * @public
   * @method run
   * @return {Promise}
   */
  run(options) {
    let promise = this.checkDependencies_();
    promise.then(() => this.start(options));

    return promise;
  },

  /**
   * Template method for implementing actual logic after checks.
   *
   * @public
   * @method start
   * @return {Void}
   */
  start() {
    throw new Error(`command must implement start() when not overriding run()!`);
  },

  /**
   * Checks if all dependencies for l10n commands are installed.
   *
   * @protected
   * @method fileExists_
   * @param {String} file
   * @return {Boolean}
   */
  fileExists_(file) {
    try {
      fs.accessSync(file, fs.F_OK);
    } catch (e) {
      return false;
    }

    return true;
  },

  /**
   * Escapes a string to be used within a regular expressions.
   *
   * @protected
   * @method escapeString_
   * @param {String} input
   * @return {String}
   */
  escapeString_(input) {
    return input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  },

  /**
   * Checks if all dependencies for l10n commands are installed.
   *
   * @protected
   * @method checkDependencies
   * @return {Promise}
   */
  checkDependencies_() {
    let promiseCallback = (resolve,reject) => {
      if (!this._hasMissingDependencies()) {
        resolve();
        return;
      }

      console.log(chalk.red.bold(`You have to install missing dependencies for ember-l10n CLI!\n`));

      let question = {
        default: true,
        name: 'install',
        type: 'confirm',
        message: 'Should they be automatically installed (hit ENTER for Yes)?'
      };

      let successCallback = answer => {
        if (!answer.install) {
          reject();
          return;
        }

        shell.exec(
          `ember l10n:install`,
          () => { resolve(); }
        );
      };

      let failureCallback = () => {
        reject();
      };

      let promise = inquirer.prompt([question]);
      promise.then(successCallback,failureCallback);
    };

    return new Promise(promiseCallback);
  },

  /**
   * Checks if a `default` programm is installed on client.
   *
   * @protected
   * @method hasProgramm_
   * @return {Boolean}
   */
  hasProgramm_(bin) {
    let task = shell.exec(`type ${bin} >/dev/null 2>&1`);
    return task.code===0;
  },

  /**
   * Checks if a `npm` programm is installed on client.
   *
   * @protected
   * @method hasNpmPackage_
   * @return {Boolean}
   */
  hasNpmPackage_(pkg) {
    let task = shell.exec(`ls node_modules | grep ${pkg} >/dev/null 2>&1`);
    return task.code===0;
  },

  /**
   * Checks if all dependencies for l10n commands are installed.
   *
   * @private
   * @method _hasMissingDependencies
   * @return {Boolean}
   */
  _hasMissingDependencies() {
    return (
      !this.hasProgramm_('xgettext') ||
      !this.hasNpmPackage_('gettext-parser') ||
      !this.hasNpmPackage_('xgettext-template')
    );
  },
};
